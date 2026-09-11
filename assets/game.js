/* カルティア想造録 — ゲーム進行
 * 原作『レブス』の「意味の繋がる文字と文字を組み合わせて法術を想造する」を、
 * 「よみ・いみ → 二字の漢字を組み立てる」という書き取り学習に置きかえている。
 */
(function () {
  'use strict';

  var K_PROGRESS = 'rebus.progress.v1';
  var K_NOTE     = 'rebus.note.v1';
  var K_SOUND    = 'rebus.sound.v1';

  var BEAST_HP  = 102;
  var BASE_DMG  = 34;
  var MAX_LIFE  = 5;
  var ORIGINALS = ['天', '地', '人', '生', '死', '無'];

  /* ── 保存 ───────────────────────────────── */
  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var progress = load(K_PROGRESS, { cleared: [] });
  var note     = load(K_NOTE, {});
  var soundOn  = load(K_SOUND, true);

  function noteAdd(word, yomi, mean, grade) {
    var e = note[word] || { y: yomi, m: mean, g: grade, n: 0 };
    e.y = yomi; e.m = mean; e.g = grade; e.n += 1;
    note[word] = e;
    save(K_NOTE, note);
  }
  function noteEase(word) {
    if (!note[word]) return;
    note[word].n -= 1;
    if (note[word].n <= 0) delete note[word];
    save(K_NOTE, note);
  }
  function noteList() {
    return Object.keys(note).map(function (w) {
      return { w: w, y: note[w].y, m: note[w].m, g: note[w].g, n: note[w].n };
    }).sort(function (a, b) { return b.n - a.n || a.g - b.g; });
  }

  /* ── 音（外部ファイルなし・その場で合成） ── */
  var actx = null;
  function tone(freqs, dur, type, gainPeak) {
    if (!soundOn) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      freqs.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain();
        var t0 = actx.currentTime + i * 0.07;
        o.type = type || 'sine';
        o.frequency.setValueAtTime(f, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(gainPeak || 0.13, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t0); o.stop(t0 + dur + 0.05);
      });
    } catch (e) {}
  }
  var SFX = {
    pick:  function () { tone([620], 0.09, 'triangle', 0.05); },
    cast:  function () { tone([523.25, 659.25, 987.77], 0.5, 'sine', 0.12); },
    great: function () { tone([523.25, 783.99, 1046.5, 1318.5], 0.7, 'sine', 0.14); },
    miss:  function () { tone([146.83, 110], 0.34, 'sawtooth', 0.06); },
    clear: function () { tone([523.25, 659.25, 783.99, 1046.5], 0.9, 'sine', 0.12); }
  };

  /* ── 小道具 ─────────────────────────────── */
  function $(sel) { return document.querySelector(sel); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function sigilSvg() {
    return '<svg viewBox="0 0 152 152" aria-hidden="true">' +
      '<circle class="ring-a" cx="76" cy="76" r="71" fill="none" stroke="#6c5a30" stroke-width="1" stroke-dasharray="3 9"/>' +
      '<circle class="ring-b" cx="76" cy="76" r="60" fill="none" stroke="#d4ae57" stroke-width="1" stroke-dasharray="26 14" opacity=".55"/>' +
      '<circle cx="76" cy="76" r="47" fill="rgba(212,174,87,.07)" stroke="#6c5a30" stroke-width="1"/>' +
      '</svg>';
  }

  var SCREENS = ['s-title', 's-select', 's-battle', 's-result', 's-note'];
  function show(id) {
    SCREENS.forEach(function (s) { $('#' + s).hidden = (s !== id); });
    window.scrollTo(0, 0);
  }

  /* ── 局面 ───────────────────────────────── */
  var S = null;

  function startLayer(idx) {
    var L = REBUS_DATA.layers[idx];
    begin({
      layerIdx: idx,
      title: L.name,
      sub: '小学' + L.grade + '年の漢字',
      core: L.core,
      grade: L.grade,
      words: L.words,
      pool: L.words,
      beasts: L.beasts
    });
  }

  function startReview() {
    var list = noteList().slice(0, 12);
    if (!list.length) return;
    var words = list.map(function (e) { return [e.w, e.y, e.m]; });
    var pool = REBUS_DATA.layers[Math.max(0, (list[0].g || 1) - 1)].words.concat(words);
    begin({
      layerIdx: null,
      title: 'まなびノート',
      sub: 'まちがえた ' + list.length + ' 語',
      core: '記',
      grade: list[0].g || 1,
      words: words,
      pool: pool,
      beasts: [{ name: '記憶ノ影', yomi: 'きおくのかげ', sigil: '記', kind: 'common' }],
      beastHp: Math.max(BASE_DMG * 3, BASE_DMG * Math.min(words.length, 6))
    });
  }

  function begin(cfg) {
    S = {
      cfg: cfg,
      queue: shuffle(cfg.words),
      qi: -1,
      bi: 0,
      beastMax: cfg.beastHp || BEAST_HP,
      beastHp: cfg.beastHp || BEAST_HP,
      life: MAX_LIFE,
      combo: 0,
      original: false,
      learned: [],
      chars: shuffle(Array.from(new Set(cfg.pool.reduce(function (acc, w) {
        return acc.concat(Array.from(w[0]));
      }, [])))),
      slots: [null, null],
      hand: [],
      hintUsed: false,
      busy: false
    };
    show('s-battle');
    paintBeast(true);
    nextQuestion();
  }

  function currentBeast() { return S.cfg.beasts[S.bi]; }

  function paintBeast(fresh) {
    var b = currentBeast();
    var kind = REBUS_DATA.kinds[b.kind];
    $('#hud-layer').innerHTML = S.cfg.title + '<small>' + S.cfg.sub + '</small>';
    var wrap = $('#beast-sigil');
    wrap.className = 'sigil hovering';
    wrap.innerHTML = sigilSvg() + '<span class="sigil-core">' + b.sigil + '</span>';
    $('#beast-name').innerHTML = '<ruby>' + b.name + '<rt>' + b.yomi + '</rt></ruby>';
    $('#beast-kind').innerHTML = kind.label + ' <span>' + kind.note + '</span>';
    if (fresh) { S.beastHp = S.beastMax; }
    paintHp();
    paintLife();
  }

  function paintHp() {
    $('#beast-hp').style.width = Math.max(0, (S.beastHp / S.beastMax) * 100) + '%';
  }

  function paintLife() {
    var box = $('#hearts');
    box.innerHTML = '';
    for (var i = 0; i < MAX_LIFE; i++) {
      box.appendChild(el('span', 'heart' + (i < S.life ? '' : ' lost')));
    }
    box.setAttribute('aria-label', 'のこりの こころ ' + S.life + ' / ' + MAX_LIFE);
  }

  function paintOriginal() {
    var bar = $('#original-bar');
    bar.innerHTML = '';
    var core = ORIGINALS.indexOf(S.cfg.core) >= 0 ? S.cfg.core : '想';
    var label = el('span', null, S.original ? 'オリジナル「' + core + '」発現 — つぎの 想造が 倍の 力' : '想造の 気');
    bar.appendChild(label);
    if (!S.original) {
      for (var i = 0; i < 3; i++) bar.appendChild(el('i', 'pip' + (i < S.combo ? ' on' : '')));
    }
    bar.className = 'original-bar' + (S.original ? ' ready' : '');
  }

  function nextQuestion() {
    S.qi += 1;
    if (S.qi >= S.queue.length) S.queue = shuffle(S.queue), S.qi = 0;
    S.q = S.queue[S.qi];
    S.slots = [null, null];
    S.hintUsed = false;
    S.busy = false;

    var b = currentBeast();
    var veilMeaning = (b.kind === 'shadow');
    var handSize = (b.kind === 'doll') ? 10 : 8;

    $('#q-yomi').textContent = S.q[1];
    var mean = $('#q-mean');
    if (veilMeaning) {
      mean.textContent = 'いみは 霧の なか';
      mean.className = 'q-mean veiled';
    } else {
      mean.textContent = S.q[2];
      mean.className = 'q-mean';
    }

    var answer = Array.from(S.q[0]);
    var decoys = S.chars.filter(function (c) { return answer.indexOf(c) < 0; });
    var picked = shuffle(decoys).slice(0, handSize - answer.length);
    S.hand = shuffle(answer.concat(picked)).map(function (c, i) {
      return { ch: c, id: i, used: false };
    });

    $('#verdict').hidden = true;
    paintHand();
    paintSlots();
    paintOriginal();
    $('#btn-hint').disabled = false;
  }

  function paintHand() {
    var box = $('#hand');
    box.innerHTML = '';
    S.hand.forEach(function (c, i) {
      var b = el('button', 'card' + (c.used ? ' used' : ''), c.ch);
      b.type = 'button';
      b.dataset.i = i;
      b.setAttribute('aria-label', 'カルティア ' + c.ch);
      if (c.hinted) b.style.boxShadow = '0 0 0 2px var(--gold), 0 0 22px -4px var(--gold)';
      b.addEventListener('click', function () { pick(i); });
      box.appendChild(b);
    });
  }

  function paintSlots() {
    [0, 1].forEach(function (i) {
      var s = $('#slot-' + i);
      var h = S.slots[i] == null ? null : S.hand[S.slots[i]];
      s.textContent = h ? h.ch : '';
      s.className = 'slot' + (h ? ' filled' : '');
    });
    $('#btn-cast').disabled = !(S.slots[0] != null && S.slots[1] != null);
  }

  function pick(i) {
    if (S.busy || S.hand[i].used) return;
    var target = S.slots[0] == null ? 0 : (S.slots[1] == null ? 1 : -1);
    if (target < 0) return;
    S.slots[target] = i;
    S.hand[i].used = true;
    SFX.pick();
    paintHand();
    paintSlots();
  }

  function unslot(i) {
    if (S.busy || S.slots[i] == null) return;
    S.hand[S.slots[i]].used = false;
    S.slots[i] = null;
    paintHand();
    paintSlots();
  }

  function hint() {
    if (S.busy || S.hintUsed) return;
    S.hintUsed = true;
    $('#btn-hint').disabled = true;
    var first = Array.from(S.q[0])[0];
    S.hand.forEach(function (c) { if (c.ch === first) c.hinted = true; });
    if (currentBeast().kind === 'shadow') {
      $('#q-mean').textContent = S.q[2];
      $('#q-mean').className = 'q-mean';
    }
    paintHand();
  }

  function cast() {
    if (S.busy || S.slots[0] == null || S.slots[1] == null) return;
    S.busy = true;
    var made = S.hand[S.slots[0]].ch + S.hand[S.slots[1]].ch;
    $('#slot-0').classList.add('casting');
    $('#slot-1').classList.add('casting');
    setTimeout(function () { resolve(made); }, 420);
  }

  function resolve(made) {
    $('#slot-0').classList.remove('casting');
    $('#slot-1').classList.remove('casting');
    var correct = (made === S.q[0]);
    var v = $('#verdict');
    v.className = 'verdict ' + (correct ? 'hit' : 'miss');
    v.hidden = false;
    v.innerHTML = '';

    if (correct) {
      var dmg = BASE_DMG;
      if (S.hintUsed) dmg = Math.round(dmg / 2);
      if (S.original) { dmg *= 2; S.original = false; S.combo = 0; }
      else if (!S.hintUsed) {
        S.combo += 1;
        if (S.combo >= 3) { S.original = true; S.combo = 0; }
      }
      S.beastHp -= dmg;
      if (S.learned.indexOf(S.q[0]) < 0) S.learned.push(S.q[0]);
      noteEase(S.q[0]);

      flash(S.q[0]);
      (dmg > BASE_DMG ? SFX.great : SFX.cast)();
      $('#beast-sigil').classList.add('struck');
      setTimeout(function () { $('#beast-sigil').classList.remove('struck'); }, 450);
      paintHp();
      paintOriginal();

      v.appendChild(el('p', 'verdict-head', dmg > BASE_DMG ? 'オリジナル発現' : '想造 成功'));
      v.appendChild(el('p', 'verdict-word', S.q[0]));
      v.appendChild(el('p', 'verdict-note', S.q[1] + '　' + S.q[2]));

      setTimeout(function () {
        if (S.beastHp <= 0) defeatBeast(); else nextQuestion();
      }, 1400);
    } else {
      S.combo = 0;
      S.life -= 1;
      SFX.miss();
      noteAdd(S.q[0], S.q[1], S.q[2], S.cfg.grade);
      paintLife();
      paintOriginal();

      v.appendChild(el('p', 'verdict-head', 'しくじり'));
      v.appendChild(el('p', 'verdict-word', S.q[0]));
      v.appendChild(el('p', 'verdict-note', S.q[1] + '　' + S.q[2]));
      var next = el('button', 'btn btn-quiet', S.life <= 0 ? '結末を 見る' : 'つぎへ');
      next.type = 'button';
      next.addEventListener('click', function () {
        if (S.life <= 0) finish(false); else nextQuestion();
      });
      v.appendChild(next);
      next.focus();
    }
  }

  function flash(word) {
    var f = $('#flash');
    f.innerHTML = '<span>' + word + '</span>';
    f.classList.remove('show');
    void f.offsetWidth;
    f.classList.add('show');
  }

  function defeatBeast() {
    var wrap = $('#beast-sigil');
    wrap.className = 'sigil fading';
    setTimeout(function () {
      S.bi += 1;
      if (S.bi >= S.cfg.beasts.length) { finish(true); return; }
      paintBeast(true);
      nextQuestion();
    }, 650);
  }

  function finish(won) {
    if (won) {
      SFX.clear();
      if (S.cfg.layerIdx != null && progress.cleared.indexOf(S.cfg.layerIdx) < 0) {
        progress.cleared.push(S.cfg.layerIdx);
        save(K_PROGRESS, progress);
      }
    }
    var box = $('#result-body');
    box.innerHTML = '';

    var head = el('h2', 'section', won ? S.cfg.title + 'を 踏破した' : '想造の 力が 尽きた');
    box.appendChild(head);

    var stats = el('div', 'stat-row');
    [[S.learned.length, 'そうぞう した 熟語'], [S.life, 'のこった こころ'],
     [won ? S.cfg.beasts.length : S.bi, 'しずめた 幻獣']].forEach(function (p) {
      var s = el('div', 'stat');
      s.appendChild(el('b', null, String(p[0])));
      s.appendChild(el('span', null, p[1]));
      stats.appendChild(s);
    });
    box.appendChild(stats);

    if (S.learned.length) {
      box.appendChild(el('p', 'eyebrow', '今回 想造した カルティア'));
      var grid = el('div', 'word-grid');
      S.learned.forEach(function (w) {
        var src = S.cfg.words.filter(function (x) { return x[0] === w; })[0];
        var chip = el('div', 'word-chip');
        chip.appendChild(el('b', null, w));
        chip.appendChild(el('span', null, src ? src[1] : ''));
        chip.appendChild(el('em', null, src ? src[2] : ''));
        grid.appendChild(chip);
      });
      box.appendChild(grid);
    }

    var acts = el('div', 'title-actions');
    var again = el('button', 'btn', won ? 'もう一度 この層へ' : 'もう一度 いどむ');
    again.type = 'button';
    again.addEventListener('click', function () {
      if (S.cfg.layerIdx != null) startLayer(S.cfg.layerIdx); else startReview();
    });
    var back = el('button', 'btn btn-primary', '層を えらぶ');
    back.type = 'button';
    back.addEventListener('click', renderSelect);
    acts.appendChild(again);
    acts.appendChild(back);
    box.appendChild(acts);

    show('s-result');
  }

  /* ── 層のえらび ─────────────────────────── */
  function renderSelect() {
    var list = $('#layer-list');
    list.innerHTML = '';
    REBUS_DATA.layers.forEach(function (L, i) {
      var cleared = progress.cleared.indexOf(i) >= 0;
      var b = el('button', 'layer-btn');
      b.type = 'button';
      b.dataset.cleared = cleared ? '1' : '0';
      b.innerHTML =
        '<span class="layer-glyph">' + L.core + '</span>' +
        '<span><span class="layer-name">' + L.name + '</span>' +
        '<span class="layer-meta">小学' + L.grade + '年の漢字 ・ ' + L.words.length + '語 ・ 幻獣' + L.beasts.length + '体</span></span>' +
        '<span class="layer-seal">' + (cleared ? '踏破' : '') + '</span>';
      b.addEventListener('click', function () { startLayer(i); });
      list.appendChild(b);
    });
    var n = noteList().length;
    $('#note-count').textContent = n ? 'まちがえた ' + n + ' 語' : 'まだ 何もない';
    show('s-select');
  }

  /* ── まなびノート ───────────────────────── */
  function renderNote() {
    var list = noteList();
    var box = $('#note-body');
    box.innerHTML = '';
    if (!list.length) {
      box.appendChild(el('p', 'empty-note', 'まちがえた 熟語が ここに たまる。いまは からっぽだ。'));
    } else {
      var grid = el('div', 'word-grid');
      list.forEach(function (e) {
        var chip = el('div', 'word-chip sore');
        chip.appendChild(el('b', null, e.w));
        chip.appendChild(el('span', null, e.y));
        chip.appendChild(el('em', null, e.m));
        chip.appendChild(el('span', 'times', '小学' + e.g + '年 ・ ' + e.n + '回 しくじり'));
        grid.appendChild(chip);
      });
      box.appendChild(grid);
    }
    $('#btn-review').disabled = !list.length;
    show('s-note');
  }

  /* ── 配線 ───────────────────────────────── */
  function wire() {
    $('#btn-start').addEventListener('click', renderSelect);
    $('#btn-open-note').addEventListener('click', renderNote);
    $('#btn-note-from-select').addEventListener('click', renderNote);
    $('#btn-note-back').addEventListener('click', renderSelect);
    $('#btn-review').addEventListener('click', startReview);
    $('#btn-cast').addEventListener('click', cast);
    $('#btn-hint').addEventListener('click', hint);
    $('#btn-retreat').addEventListener('click', renderSelect);
    $('#slot-0').addEventListener('click', function () { unslot(0); });
    $('#slot-1').addEventListener('click', function () { unslot(1); });

    var snd = $('#btn-sound');
    function paintSound() { snd.textContent = soundOn ? '音 ある' : '音 なし'; }
    snd.addEventListener('click', function () {
      soundOn = !soundOn; save(K_SOUND, soundOn); paintSound();
      if (soundOn) SFX.pick();
    });
    paintSound();

    document.addEventListener('keydown', function (e) {
      if ($('#s-battle').hidden || !S) return;
      if (e.key >= '1' && e.key <= '9') {
        var i = Number(e.key) - 1;
        if (S.hand[i]) { pick(i); e.preventDefault(); }
      } else if (e.key === 'Enter' && !$('#btn-cast').disabled) {
        cast(); e.preventDefault();
      } else if (e.key === 'Backspace') {
        unslot(S.slots[1] != null ? 1 : 0); e.preventDefault();
      }
    });

    $('#title-sigil').innerHTML = sigilSvg() + '<span class="sigil-core">想</span>';
  }

  function boot() {
    wire();
    show('s-title');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
