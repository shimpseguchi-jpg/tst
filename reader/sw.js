/* 商店街連作リーダー — オフライン用のサービスワーカー。
   方針：本文もデータも「ネットワーク優先、失敗したらキャッシュ」。
   こうしておくと、リーダーを更新したときに古い本文が残らない。
   フォントだけはキャッシュ優先にする（毎回取りにいく必要がないため）。 */
"use strict";

var CACHE = "shotengai-v1";
var FONTS = "shotengai-fonts-v1";

var WORKS = ["01","02","03","04","05","06","07","08","09","10","11","12","i1","i2","i3"];
var PRECACHE = [
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./data/index.json",
  "./data/guide.json",
  "./data/report.json"
].concat(WORKS.map(function (n) { return "./data/" + n + ".json"; }));

/* addAll は一つでも落ちると全部やり直しになるので、一つずつ入れる */
function warm(cache, urls) {
  return Promise.all(urls.map(function (u) {
    return fetch(u, { cache: "reload" }).then(function (res) {
      if (res && res.ok) return cache.put(u, res);
    }).catch(function () {});
  }));
}

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return warm(c, PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE && k !== FONTS) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* Google Fonts はキャッシュ優先 */
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.open(FONTS).then(function (c) {
        return c.match(req).then(function (hit) {
          if (hit) return hit;
          return fetch(req).then(function (res) {
            if (res) c.put(req, res.clone());
            return res;
          }).catch(function () { return hit; });
        });
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  /* 本文・データ・ページはネットワーク優先 */
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && res.type === "basic") {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) {
        if (hit) return hit;
        if (req.mode === "navigate") return caches.match("./index.html");
        return new Response("", { status: 504, statusText: "offline" });
      });
    })
  );
});
