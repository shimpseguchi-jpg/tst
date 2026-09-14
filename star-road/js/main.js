/* まなびスターロード - きどう */
(function (global) {
  'use strict';
  const E = global.Engine;
  const $ = id => document.getElementById(id);
  let run = null;

  const DIFF_KEY = 'manabi-star-road-diff';
  let diffMode = 'normal';

  function pickDiff(mode) {
    diffMode = mode;
    try { localStorage.setItem(DIFF_KEY, mode); } catch (e) { /* むし */ }
    document.querySelectorAll('#diff-row .dp').forEach(b => {
      b.classList.toggle('on', b.dataset.d === mode);
    });
  }

  function boot() {
    renderTitleChars();
    try { diffMode = localStorage.getItem(DIFF_KEY) || 'normal'; } catch (e) { diffMode = 'normal'; }
    document.querySelectorAll('#diff-row .dp').forEach(b => {
      b.addEventListener('click', () => pickDiff(b.dataset.d));
    });
    pickDiff(diffMode);
    const saved = E.load();
    $('btn-continue').hidden = !saved;
    $('btn-new').classList.toggle('primary', !saved);
    $('btn-new').addEventListener('click', () => {
      if (E.load() && !confirm('いまの ぼうけんは きえて しまいます。はじめから あそびますか?')) return;
      newGame();
    });
    $('hud-menu').addEventListener('click', () => {
      if (!confirm('タイトルに もどりますか?（いまの ぼうけんは セーブされます）')) return;
      if (run) E.save(run);
      $('btn-continue').hidden = false;
      $('btn-new').classList.remove('primary');
      UI.show('title');
    });
    $('btn-continue').addEventListener('click', () => {
      const s = E.load();
      if (!s) return;
      run = s;
      global.UI.setRun(run);
      global.UI.show('map');
      global.UI.renderMap();
    });
    UI.show('title');
  }

  function newGame() {
    E.clearSave();
    run = E.newRun(diffMode);
    E.save(run);
    global.UI.setRun(run);
    global.UI.show('map');
    global.UI.renderMap();
  }

  function renderTitleChars() {
    $('title-chars').innerHTML = global.GameData.CHARS.map(c => `
      <div class="tchar" style="--c:${c.color}">
        <div class="tc-emoji">${Sprites.tag(c.id, 4)}</div>
        <div class="tc-name">${c.name}</div>
        <div class="tc-sub">${c.subject}　${c.role}</div>
        <div class="tc-desc">${c.desc}</div>
        <div class="tc-skills">
          <p><b>つうじょう</b> ${c.basic.name}</p>
          <p><b>せんぎ</b> ${c.skill.name}<br><small>${c.skill.text}</small></p>
          <p><b>ひっさつ</b> ${c.ult.name}<br><small>${c.ult.text}</small></p>
        </div>
      </div>`).join('');
  }

  global.Game = { boot, newGame, get run() { return run; } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : globalThis);
