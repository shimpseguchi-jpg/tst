# -*- coding: utf-8 -*-
"""資料/備陽新報_*.md を読んで、リーダーの「紙面」タブ用の JSON にする。

書式は次のとおり。パーサを単純に保つため、形を崩さないこと。

    面: 22                  ← 最初の ## より前が紙面全体の情報
    ## 主記事               ← ここから記事の塊
    見出し: 開いている店を歩く
    本文                    ← この行のあと、次の ## までが本文
    　…
"""
import json, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "reader", "data", "paper.json")
KV = re.compile(r'^([^:：\s]+)\s*[:：]\s*(.*)$')


def parse(path):
    lines = open(path, encoding="utf-8").read().split("\n")
    meta, blocks, cur = {}, [], None
    for ln in lines:
        s = ln.rstrip()
        if s.startswith("## "):
            cur = {"kind": s[3:].strip(), "本文": []}
            blocks.append(cur)
            continue
        if s.strip() == "本文":
            (cur if cur else meta).setdefault("_body", True)
            if cur is not None:
                cur["_in"] = True
            continue
        if cur is not None and cur.get("_in"):
            cur["本文"].append(s.strip())   # 空行は段落の切れ目として残す
            continue
        m = KV.match(s.strip())
        if m:
            k, v = m.group(1), m.group(2)
            tgt = cur if cur is not None else meta
            if k in tgt and isinstance(tgt[k], list):
                tgt[k].append(v)
            elif k in tgt:
                tgt[k] = [tgt[k], v]
            else:
                tgt[k] = v
    return meta, blocks


def build(path):
    meta, blocks = parse(path)
    paper = {
        "title": "備陽新報",
        "page": meta.get("面", ""),
        "section": meta.get("面名", ""),
        "date": meta.get("日付", ""),
        "issuer": meta.get("発行", ""),
        "lead": None, "news": [], "ads": [], "weather": None, "obits": [],
    }
    def paras(raw):
        """空行で区切って段落にする。一段落は一つの続き文になる。"""
        out, cur = [], []
        for x in raw:
            if x:
                cur.append(x)
            elif cur:
                out.append("".join(cur)); cur = []
        if cur:
            out.append("".join(cur))
        return out

    for b in blocks:
        k = b["kind"]
        body = paras(b.get("本文", []))
        if k == "主記事":
            paper["lead"] = {
                "series": b.get("柱", ""), "head": b.get("見出し", ""),
                "sub": b.get("脇見出し", ""), "by": b.get("署名", ""),
                "caption": b.get("写真説明", ""), "body": body,
                "chars": len("".join(body).replace("　", "")),
            }
        elif k == "記事":
            paper["news"].append({"head": b.get("見出し", ""),
                                  "sub": b.get("脇見出し", ""), "body": body})
        elif k == "広告":
            paper["ads"].append({"dan": int(b.get("段", "2")), "main": b.get("主", ""),
                                 "sub": b.get("副", ""), "text": b.get("文", "")})
        elif k == "天気":
            paper["weather"] = {kk: b[kk] for kk in
                                ("地名", "今日", "最高", "最低", "降水", "明日", "日の出", "日の入")
                                if kk in b}
        elif k == "おくやみ":
            v = b.get("一行", [])
            paper["obits"] = v if isinstance(v, list) else [v]
    return paper


def main():
    src = sorted(glob.glob(os.path.join(ROOT, "資料", "備陽新報_*.md")))
    if not src:
        raise SystemExit("資料/備陽新報_*.md が無い")
    papers = [build(p) for p in src]
    json.dump(papers, open(OUT, "w", encoding="utf-8"),
              ensure_ascii=False, separators=(",", ":"))
    for p in papers:
        print("%s %s面　主記事 %d字／%d行　記事%d　広告%d　おくやみ%d" % (
            p["date"][:14], p["page"], p["lead"]["chars"], len(p["lead"]["body"]),
            len(p["news"]), len(p["ads"]), len(p["obits"])))
    print("paper.json", os.path.getsize(OUT), "bytes")


if __name__ == "__main__":
    main()
