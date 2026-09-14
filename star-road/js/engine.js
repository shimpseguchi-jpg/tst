/* まなびスターロード - ぼうけんエンジン（マップ・ステータス・セーブ） */
(function (global) {
  'use strict';
  const { CHARS, RELICS, ENEMIES } = global.GameData;
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  const SAVE_KEY = 'manabi-star-road-v1';
  const FLOORS = 8;   // 0..7 のフロア ＋ さいごに ボス
  const COLS = 5;
  const PATHS = 5;

  const NODE_TYPES = {
    battle: { label: 'もぎせん', emoji: '⚔️', color: '#8fb7ff' },
    elite: { label: 'エリートせん', emoji: '💀', color: '#ff8b6b' },
    train: { label: 'とっくん', emoji: '🏋️', color: '#8ce7b0' },
    event: { label: 'イベント', emoji: '❓', color: '#e3b6ff' },
    rest: { label: 'きゅうけい', emoji: '🔥', color: '#ffd98b' },
    boss: { label: 'ボスせん', emoji: '👹', color: '#ff6b8b' }
  };

  // ================= マップ せいせい =================
  function genMap() {
    const nodes = {};
    const edges = new Set();
    const key = (f, c) => f + '_' + c;
    function ensure(f, c) {
      const k = key(f, c);
      if (!nodes[k]) nodes[k] = { id: k, floor: f, col: c, next: [], parents: [], type: null };
      return nodes[k];
    }
    function crosses(f, a, b) {
      if (a === b) return false;
      return edges.has(`${f}_${b}_${a}`);
    }
    const starts = [];
    for (let p = 0; p < PATHS; p++) {
      let c = rnd(COLS);
      if (p === 1 && c === starts[0]) c = (c + 1 + rnd(COLS - 1)) % COLS;
      starts.push(c);
      ensure(0, c);
      for (let f = 0; f < FLOORS - 1; f++) {
        const opts = [];
        for (const d of [-1, 0, 1]) {
          const nc = c + d;
          if (nc < 0 || nc >= COLS) continue;
          if (crosses(f, c, nc)) continue;
          opts.push(nc);
        }
        const nc = opts.length ? pick(opts) : c;
        ensure(f + 1, nc);
        edges.add(`${f}_${c}_${nc}`);
        const a = nodes[key(f, c)], b = nodes[key(f + 1, nc)];
        if (!a.next.includes(b.id)) a.next.push(b.id);
        if (!b.parents.includes(a.id)) b.parents.push(a.id);
        c = nc;
      }
    }
    // ボスノード
    const boss = { id: 'boss', floor: FLOORS, col: (COLS - 1) / 2, next: [], parents: [], type: 'boss' };
    nodes.boss = boss;
    for (const k in nodes) {
      const n = nodes[k];
      if (n.floor === FLOORS - 1) { n.next.push('boss'); boss.parents.push(n.id); }
    }

    // しゅるいを きめる
    const byFloor = [];
    for (let f = 0; f < FLOORS; f++) byFloor.push([]);
    for (const k in nodes) { const n = nodes[k]; if (n.floor < FLOORS) byFloor[n.floor].push(n); }

    const WEIGHTS = [['battle', 26], ['train', 26], ['event', 22], ['elite', 14], ['rest', 12]];
    for (let f = 0; f < FLOORS; f++) {
      for (const n of byFloor[f]) {
        if (f === 0) { n.type = 'battle'; continue; }
        if (f === 1) { n.type = pick(['train', 'event', 'battle', 'train']); continue; }
        if (f === FLOORS - 1) { n.type = 'rest'; continue; }   // ボスの まえは かならず きゅうけい
        const parentTypes = n.parents.map(pid => nodes[pid] && nodes[pid].type);
        let t = null, guard = 0;
        while (guard++ < 30) {
          const total = WEIGHTS.reduce((s, w) => s + w[1], 0);
          let r = rnd(total);
          for (const [name, w] of WEIGHTS) { r -= w; if (r < 0) { t = name; break; } }
          if (t === 'elite' && f < 3) continue;
          if (t === 'rest' && (f < 2 || f === FLOORS - 2)) continue;
          if ((t === 'rest' || t === 'elite') && parentTypes.includes(t)) continue;
          break;
        }
        n.type = t || 'battle';
      }
    }
    // どの フロアにも さいてい 1つは とっくん/きゅうけい いがいが ある ように
    return { nodes, floors: FLOORS, cols: COLS };
  }

  // ================= ラン（ぼうけん）=================
  function newRun() {
    const run = {
      act: 1,
      map: genMap(),
      current: null,        // いま えらんだ ノードid（ひょうじ よう）
      pos: null,            // さいごに クリアした ノードid（ここから つぎへ すすめる）
      cleared: [],
      party: CHARS.map(c => ({
        id: c.id, hp: c.base.hp, ep: 0,
        bonus: { hp: 0, atk: 0, def: 0, spd: 0, crit: 0 }
      })),
      sp: 3, maxSp: 5,
      relics: [],
      stats: { correct: 0, wrong: 0, bySubject: { 国語: [0, 0], 算数: [0, 0], 英語: [0, 0] } },
      pending: null
    };
    // さいだいHP まで かいふく
    run.party.forEach(p => { p.hp = charStats(run, p.id).hp; });
    return run;
  }

  function charDef(id) { return CHARS.find(c => c.id === id); }
  function partyOf(run, id) { return run.party.find(p => p.id === id); }

  function relicsOf(run) { return run.relics.map(id => RELICS.find(r => r.id === id)).filter(Boolean); }
  function relicSum(run, key) {
    return relicsOf(run).reduce((s, r) => s + (typeof r[key] === 'number' ? r[key] : 0), 0);
  }
  function hasRelic(run, id) { return run.relics.includes(id); }

  // そのキャラの いまの ステータス
  function charStats(run, id) {
    const def = charDef(id), p = partyOf(run, id);
    const rl = relicsOf(run);
    let atkPct = 0;
    for (const r of rl) if (r.atkBySubject && r.atkBySubject[def.subject]) atkPct += r.atkBySubject[def.subject];
    const hpPct = relicSum(run, 'hpPct');
    return {
      hp: Math.round((def.base.hp + p.bonus.hp) * (1 + hpPct)),
      atk: Math.round((def.base.atk + p.bonus.atk) * (1 + atkPct)),
      def: def.base.def + p.bonus.def + relicSum(run, 'defFlat'),
      spd: def.base.spd + p.bonus.spd + relicSum(run, 'spdFlat'),
      crit: def.base.crit + p.bonus.crit + relicSum(run, 'crit'),
      critDmg: def.base.critDmg + relicSum(run, 'critDmg')
    };
  }

  function healPct(run, pct) {
    run.party.forEach(p => {
      const max = charStats(run, p.id).hp;
      if (p.hp > 0) p.hp = Math.min(max, p.hp + Math.round(max * pct));
    });
  }
  function clampHp(run) {
    run.party.forEach(p => { p.hp = Math.min(p.hp, charStats(run, p.id).hp); });
  }
  function isWipe(run) { return run.party.every(p => p.hp <= 0); }

  // ================= てき せんせい =================
  function rollEnemies(run, kind) {
    const act = run.act;
    // ボスは act ごとに べつの てき なので HPは そのまま。ザコ／エリートだけ すこし つよく する。
    const scale = kind === 'boss' ? 1 : 1 + (act - 1) * 0.35;
    const atkScale = 1.5 * (kind === 'boss' ? 1 : 1 + (act - 1) * 0.45);
    function inst(src) {
      return {
        id: src.id, name: src.name, emoji: src.emoji,
        maxHp: Math.round(src.hp * scale), hp: Math.round(src.hp * scale),
        atk: Math.round(src.atk * atkScale),
        def: Math.round(src.def * (kind === 'boss' ? 1 : 1 + (act - 1) * 0.3)),
        spd: src.spd, maxTough: src.tough, tough: src.tough,
        w: src.w.slice(), moves: src.moves, broken: false
      };
    }
    if (kind === 'boss') return [inst(ENEMIES.boss[Math.min(act - 1, ENEMIES.boss.length - 1)])];
    if (kind === 'elite') return [inst(pick(ENEMIES.elite))];
    const pool = shuffle(ENEMIES.normal.slice());
    const n = act === 1 ? (Math.random() < 0.45 ? 1 : 2) : (Math.random() < 0.3 ? 2 : Math.random() < 0.8 ? 2 : 3);
    return pool.slice(0, n).map(inst);
  }

  // ================= レリック ほうしゅう =================
  function rollRelic(run) {
    const owned = new Set(run.relics);
    const cand = RELICS.filter(r => !owned.has(r.id));
    if (!cand.length) return null;
    return pick(cand);
  }
  function giveRelic(run, relicId) {
    if (!relicId || run.relics.includes(relicId)) return null;
    run.relics.push(relicId);
    clampHp(run);
    return RELICS.find(r => r.id === relicId);
  }

  // ================= むずかしさ =================
  function difficultyFor(run, kind) {
    let d = run.act;                 // act1→1, act2→2, act3→3
    if (kind === 'elite') d += 1;
    if (kind === 'boss') d += 1;
    return Math.max(1, Math.min(3, d));
  }
  function timeLimitFor(run, kind) {
    const base = kind === 'boss' ? 18 : kind === 'elite' ? 20 : 24;
    return base + relicSum(run, 'timeBonus');
  }

  // ================= セーブ =================
  function save(run) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(run)); } catch (e) { /* むし */ }
  }
  function load() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      if (!s) return null;
      const run = JSON.parse(s);
      if (!run || !run.map || !run.party) return null;
      // とちゅうで やめた ぶんの ノードは「まだ やって いない」あつかいに もどす
      if (run.pos === undefined) run.pos = run.cleared.length ? run.cleared[run.cleared.length - 1] : null;
      run.current = run.pos;
      return run;
    } catch (e) { return null; }
  }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

  function recordAnswer(run, subject, correct) {
    run.stats[correct ? 'correct' : 'wrong']++;
    const s = run.stats.bySubject[subject];
    if (s) s[correct ? 0 : 1]++;
  }

  global.Engine = {
    NODE_TYPES, FLOORS, COLS,
    genMap, newRun, charDef, partyOf, charStats, relicsOf, relicSum, hasRelic,
    healPct, clampHp, isWipe, rollEnemies, rollRelic, giveRelic,
    difficultyFor, timeLimitFor, save, load, clearSave, recordAnswer,
    _util: { rnd, pick, shuffle }
  };
})(typeof window !== 'undefined' ? window : globalThis);
