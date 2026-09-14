/* まなびスターロード - バトル（こうどうじゅん／じゃくてん げきは／SP／ひっさつ） */
(function (global) {
  'use strict';
  const BASE_AV = 10000;   // こうどうち：ちいさい ほど はやく うごく
  const DEF_K = 300;       // まもりの けいさん ていすう
  const E = global.Engine;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const SUB_EMOJI = { '国語': '📖', '算数': '🔢', '英語': '🔤' };

  let B = null, el = {}, inited = false;
  const $ = id => document.getElementById(id);

  function initDom() {
    el.kind = $('b-kind'); el.order = $('b-order'); el.enemies = $('b-enemies');
    el.msg = $('b-msg'); el.party = $('b-party'); el.sp = $('b-sp'); el.actions = $('b-actions');
    el.stage = $('b-stage');
    inited = true;
  }

  // ============ かいし ============
  function start(opt) {
    if (!inited) initDom();
    const run = opt.run;
    const enemies = E.rollEnemies(run, opt.kind);
    B = {
      run, kind: opt.kind, onEnd: opt.onEnd,
      difficulty: E.difficultyFor(run, opt.kind),
      timeLimit: E.timeLimitFor(run, opt.kind),
      sp: Math.min(run.maxSp, run.sp + E.relicSum(run, 'startSp')),
      hints: E.relicSum(run, 'hint'),
      allies: run.party.map(p => {
        const st = E.charStats(run, p.id), d = E.charDef(p.id);
        return {
          side: 'ally', id: p.id, cdef: d, stats: st,
          hp: Math.min(p.hp, st.hp), maxHp: st.hp,
          ep: Math.min(100, p.ep + E.relicSum(run, 'startEp')),
          av: BASE_AV / st.spd, buffAtk: 0, buffTurns: 0,
          name: d.name, emoji: d.emoji, subject: d.subject, color: d.color,
          down: p.hp <= 0
        };
      }),
      enemies: enemies.map((e, i) => {
        e.side = 'enemy'; e.av = BASE_AV / e.spd; e.idx = i;
        e.nextMove = pick(e.moves); e.brokenTurns = 0; return e;
      }),
      streak: 0, target: 0, actor: null, busy: false,
      usedSubjects: {}, answers: { correct: 0, wrong: 0 }, turnCount: 0
    };
    el.kind.textContent = B.kind === 'boss' ? '👹 ボスせん'
      : B.kind === 'elite' ? '💀 エリートせん' : '⚔️ もぎせん';
    el.kind.className = 'b-kind ' + B.kind;
    buildEnemies(); buildParty();
    renderAll();
    say(B.kind === 'boss' ? 'ボスが あらわれた！' : 'たたかい かいし！');
    setTimeout(advance, 700);
  }

  // ============ ひょうじ ============
  function aliveEnemies() { return B.enemies.filter(e => e.hp > 0); }
  function aliveAllies() { return B.allies.filter(a => !a.down); }

  function say(text, cls) {
    el.msg.textContent = text;
    el.msg.className = 'b-msg show ' + (cls || '');
  }

  function renderAll() { renderEnemies(); renderParty(); renderSp(); renderOrder(); }

  // カードは つくりなおさず、なかみだけ ぬりかえる
  // （つくりなおすと ダメージの すうじや ゆれる アニメが きえて しまう）
  function setBar(card, kind, pct, label) {
    const bar = card.querySelector('.bar.' + kind);
    bar.querySelector('i').style.width = Math.max(0, Math.min(100, pct)) + '%';
    bar.querySelector('b').textContent = label;
  }

  function buildEnemies() {
    el.enemies.innerHTML = '';
    B.enemies.forEach((e, i) => {
      const card = document.createElement('div');
      card.className = 'e-card';
      card.dataset.i = i;
      card.innerHTML = `
        <div class="e-mark">🎯</div>
        <div class="e-emoji"></div>
        <div class="e-name"></div>
        <div class="e-weaks"></div>
        <div class="bar tough"><i></i><b></b></div>
        <div class="bar hp"><i></i><b></b></div>
        <div class="e-next"></div>
        <div class="pops"></div>`;
      card.querySelector('.e-emoji').textContent = e.emoji;
      card.querySelector('.e-name').textContent = e.name;
      card.addEventListener('click', () => {
        if (e.hp <= 0) return;
        B.target = i; renderEnemies();
      });
      el.enemies.appendChild(card);
    });
  }

  function renderEnemies() {
    if (el.enemies.children.length !== B.enemies.length) buildEnemies();
    B.enemies.forEach((e, i) => {
      const card = el.enemies.children[i];
      card.classList.toggle('dead', e.hp <= 0);
      card.classList.toggle('broken', e.brokenTurns > 0);
      card.classList.toggle('targeted', i === B.target && e.hp > 0);
      card.querySelector('.e-weaks').innerHTML = e.w.map(w =>
        `<span class="chip${e.brokenTurns > 0 ? ' off' : ''}">${SUB_EMOJI[w]}${w}</span>`).join('');
      setBar(card, 'tough', e.tough / e.maxTough * 100,
        e.brokenTurns > 0 ? 'よろけ！' : 'じゃくてん ' + e.tough);
      setBar(card, 'hp', e.hp / e.maxHp * 100, Math.max(0, e.hp) + ' / ' + e.maxHp);
      card.querySelector('.e-next').textContent = 'つぎ：' + (e.nextMove ? e.nextMove.name : '―');
    });
  }

  function buildParty() {
    el.party.innerHTML = '';
    B.allies.forEach(a => {
      const card = document.createElement('div');
      card.className = 'p-card';
      card.style.setProperty('--c', a.color);
      card.innerHTML = `
        <div class="p-emoji"></div>
        <div class="p-name"><span class="p-nm"></span><span class="p-sub"></span></div>
        <div class="bar hp"><i></i><b></b></div>
        <div class="bar ep"><i></i><b></b></div>
        <div class="p-buff" hidden>⬆こうげき アップ</div>
        <div class="pops"></div>`;
      card.querySelector('.p-emoji').textContent = a.emoji;
      card.querySelector('.p-nm').textContent = a.name;
      card.querySelector('.p-sub').textContent = a.subject;
      el.party.appendChild(card);
    });
  }

  function renderParty() {
    if (el.party.children.length !== B.allies.length) buildParty();
    B.allies.forEach((a, i) => {
      const card = el.party.children[i];
      card.classList.toggle('down', a.down);
      card.classList.toggle('acting', B.actor === a);
      setBar(card, 'hp', a.hp / a.maxHp * 100, Math.max(0, Math.round(a.hp)) + ' / ' + a.maxHp);
      setBar(card, 'ep', a.ep, 'ひっさつ ' + Math.floor(a.ep) + '%');
      card.querySelector('.p-buff').hidden = !(a.buffTurns > 0);
    });
  }

  function renderSp() {
    let h = '<span class="sp-label">スキルポイント</span>';
    for (let i = 0; i < B.run.maxSp; i++) h += `<span class="pip${i < B.sp ? ' on' : ''}"></span>`;
    el.sp.innerHTML = h;
  }

  // つぎに うごく じゅんばんを よそくして ならべる
  function renderOrder() {
    const sim = [].concat(
      aliveAllies().map(a => ({ av: a.av, spd: a.stats.spd, emoji: a.emoji, name: a.name, side: 'ally', color: a.color })),
      aliveEnemies().map(e => ({ av: e.av, spd: e.spd, emoji: e.emoji, name: e.name, side: 'enemy', color: '#ff9a76' }))
    );
    const out = [];
    for (let k = 0; k < 7 && sim.length; k++) {
      sim.sort((x, y) => x.av - y.av);
      const n = sim[0];
      out.push(n);
      const t = n.av;
      sim.forEach(s => s.av -= t);
      n.av = BASE_AV / n.spd;
    }
    el.order.innerHTML = '<span class="o-label">こうどうじゅん</span>' + out.map((n, i) =>
      `<span class="o-item ${n.side}${i === 0 ? ' now' : ''}" style="--c:${n.color}" title="${n.name}">${n.emoji}</span>`
    ).join('<span class="o-arrow">›</span>');
  }

  function pop(container, text, cls) {
    const host = container.querySelector('.pops');
    if (!host) return;
    const d = document.createElement('div');
    d.className = 'pop ' + (cls || '');
    d.textContent = text;
    d.style.left = (20 + Math.random() * 45) + '%';
    host.appendChild(d);
    setTimeout(() => d.remove(), 1100);
  }
  function enemyCard(i) { return el.enemies.children[i]; }
  function allyCard(a) { return el.party.children[B.allies.indexOf(a)]; }
  function flash(card, cls) {
    if (!card) return;
    card.classList.add(cls);
    setTimeout(() => card.classList.remove(cls), 420);
  }

  // ============ こうどうじゅん ============
  function advance() {
    if (checkEnd()) return;
    const all = aliveAllies().concat(aliveEnemies());
    if (!all.length) return;
    all.sort((x, y) => x.av - y.av);
    const actor = all[0];
    const t = actor.av;
    all.forEach(c => c.av -= t);
    B.actor = actor;
    B.turnCount++;
    renderAll();
    if (actor.side === 'ally') beginAllyTurn(actor);
    else setTimeout(() => enemyAct(actor), 620);
  }

  function endTurn(actor) {
    actor.av = BASE_AV / (actor.side === 'ally' ? actor.stats.spd : actor.spd);
    if (actor._advance) { actor.av = Math.max(0, actor.av * (1 - actor._advance)); actor._advance = 0; }
    B.actor = null;
    renderAll();
    setTimeout(advance, 420);
  }

  // ============ みかたの ターン ============
  function beginAllyTurn(a) {
    if (a.buffTurns > 0) { a.buffTurns--; if (a.buffTurns === 0) a.buffAtk = 0; }
    if (!aliveEnemies().length) return;
    if (B.enemies[B.target] && B.enemies[B.target].hp <= 0) B.target = B.enemies.indexOf(aliveEnemies()[0]);
    say(`${a.name} の ばん！`, 'turn');
    renderActions(a);
  }

  function renderActions(a) {
    el.actions.innerHTML = '';
    const mk = (label, sub, cls, enabled, fn) => {
      const b = document.createElement('button');
      b.className = 'act ' + cls + (enabled ? '' : ' off');
      b.type = 'button';
      b.innerHTML = `<span class="act-t">${label}</span><span class="act-s">${sub}</span>`;
      if (enabled) b.addEventListener('click', () => { if (!B.busy) fn(); });
      else b.disabled = true;
      el.actions.appendChild(b);
      return b;
    };
    mk(`つうじょう こうげき`, a.cdef.basic.name + '　SP +1', 'basic', true, () => doAction(a, 'basic'));
    mk(`せんぎ`, a.cdef.skill.name + `　SP -${a.cdef.skill.sp}`, 'skill', B.sp >= a.cdef.skill.sp,
      () => doAction(a, 'skill'));
    const ready = B.allies.filter(x => !x.down && x.ep >= 100);
    if (ready.length) {
      const row = document.createElement('div');
      row.className = 'ult-row';
      ready.forEach(u => {
        const b = document.createElement('button');
        b.className = 'act ult';
        b.style.setProperty('--c', u.color);
        b.innerHTML = `<span class="act-t">⚡ ${u.name} の ひっさつ</span><span class="act-s">${u.cdef.ult.name}</span>`;
        b.addEventListener('click', () => { if (!B.busy) doAction(u, 'ult', a); });
        row.appendChild(b);
      });
      el.actions.appendChild(row);
    }
  }

  // kind: basic / skill / ult    backTo: ひっさつの あと ばんが もどる キャラ
  function doAction(a, kind, backTo) {
    B.busy = true;
    el.actions.innerHTML = '';
    const act = kind === 'basic' ? a.cdef.basic : kind === 'skill' ? a.cdef.skill : a.cdef.ult;
    Quiz.ask({
      subject: a.subject,
      difficulty: B.difficulty,
      timeLimit: B.timeLimit,
      title: `${a.name} の ${act.name}`,
      hints: B.hints,
      onHintUsed: () => { B.hints = Math.max(0, B.hints - 1); },
      onDone: res => {
        B.busy = false;
        E.recordAnswer(B.run, a.subject, res.correct);
        B.answers[res.correct ? 'correct' : 'wrong']++;
        B.usedSubjects[a.subject] = true;
        B.streak = res.correct ? B.streak + 1 : 0;
        resolveAction(a, kind, act, res, backTo);
      }
    });
  }

  function atkOf(a) { return a.stats.atk * (1 + a.buffAtk); }

  function calcDamage(a, target, mult, res, weakHit) {
    const wrongMult = E.relicSum(B.run, 'wrongDamage') || 0.3;
    const ansMult = res.correct ? 1 : wrongMult;
    let critRate = a.stats.crit + Math.min(25, B.streak * E.relicSum(B.run, 'streakCrit'));
    const sureCrit = res.correct && B.timeLimit && res.speed > 0.5;
    const isCrit = sureCrit || Math.random() * 100 < critRate;
    let d = atkOf(a) * mult * (DEF_K / (DEF_K + target.def));
    if (isCrit) d *= 1 + a.stats.critDmg / 100;
    if (target.brokenTurns > 0) d *= 1.18;
    if (weakHit) d *= 1 + E.relicSum(B.run, 'breakDmg');
    d *= ansMult;
    d *= 0.96 + Math.random() * 0.08;
    return { dmg: Math.max(1, Math.round(d)), crit: isCrit };
  }

  function hitEnemy(a, e, mult, toughCut, res) {
    const weakHit = res.correct && e.w.includes(a.subject);
    const r = calcDamage(a, e, mult, res, weakHit);
    e.hp -= r.dmg;
    const card = enemyCard(e.idx);
    flash(card, 'hit');
    pop(card, r.dmg + (r.crit ? ' かいしん!' : ''), r.crit ? 'crit' : 'dmg');
    if (weakHit && toughCut > 0 && e.brokenTurns <= 0) {
      e.tough = Math.max(0, e.tough - toughCut);
      pop(card, 'じゃくてん -' + toughCut, 'tough');
      if (e.tough === 0) breakEnemy(a, e);
    }
    if (e.hp <= 0) { e.hp = 0; setTimeout(() => say(`${e.name} を たおした！`, 'good'), 260); }
  }

  function breakEnemy(a, e) {
    e.brokenTurns = 1;
    e.av += (BASE_AV / e.spd) * 0.85;   // こうどうが おくれる
    const bd = Math.round(e.maxHp * 0.05 + atkOf(a) * 0.5);
    e.hp -= bd;
    const card = enemyCard(e.idx);
    setTimeout(() => {
      flash(card, 'break');
      pop(card, 'じゃくてん げきは！ ' + bd, 'break');
      say(`${SUB_EMOJI[a.subject]} ${a.subject}で じゃくてん げきは！ ${e.name} が よろけた！`, 'good');
      renderEnemies();
    }, 280);
    if (e.hp <= 0) e.hp = 0;
  }

  function healAlly(t, amount) {
    if (t.down) return;
    const before = t.hp;
    t.hp = Math.min(t.maxHp, t.hp + amount);
    const got = t.hp - before;
    if (got > 0) { const c = allyCard(t); flash(c, 'healed'); pop(c, '+' + got, 'heal'); }
  }

  function resolveAction(a, kind, act, res, backTo) {
    if (!res.correct) say('まちがえた… こうげきが よわく なった', 'bad');
    else if (B.timeLimit && res.speed > 0.5) say('はやい せいかい！ かいしん こうげき！', 'good');
    else say('せいかい！', 'good');

    // SP と ひっさつゲージ
    if (kind === 'basic') { if (res.correct) B.sp = Math.min(B.run.maxSp, B.sp + 1); a.ep = Math.min(100, a.ep + act.ep); }
    if (kind === 'skill') { B.sp = Math.max(0, B.sp - act.sp); a.ep = Math.min(100, a.ep + act.ep); }
    if (kind === 'ult') { a.ep = 0; }

    const targets = act.target === 'all' ? aliveEnemies()
      : act.target === 'ally-all' ? null
        : [B.enemies[B.target] && B.enemies[B.target].hp > 0 ? B.enemies[B.target] : aliveEnemies()[0]].filter(Boolean);

    if (act.mult > 0 && targets) targets.forEach(e => hitEnemy(a, e, act.mult, act.toughness, res));

    if (act.heal) {
      const amt = Math.round((atkOf(a) * act.heal.mult + act.heal.flat) * (res.correct ? 1 : 0.35));
      B.allies.forEach(t => healAlly(t, amt));
    }
    if (act.buffAtk && res.correct) {
      B.allies.forEach(t => { if (!t.down) { t.buffAtk = act.buffAtk; t.buffTurns = act.buffTurns; } });
    }
    if (act.advance && res.correct) {
      if (B.actor === a) a._advance = act.advance;
      else a.av = Math.max(0, a.av * (1 - act.advance));
    }

    renderAll();
    // まちがえると てきが はんげき してくる（まちがいが そのまま HPの そんに なる）
    const counterDelay = !res.correct && aliveEnemies().length ? 700 : 0;
    if (counterDelay) setTimeout(() => counterAttack(a), 500);
    setTimeout(() => {
      if (checkEnd()) return;
      if (kind === 'ult') {
        // ひっさつは ターンを つかわない。ばんは もとの キャラに もどる
        const owner = backTo || a;
        if (!owner.down) { B.actor = owner; renderAll(); renderActions(owner); return; }
        endTurn(owner);
        return;
      }
      endTurn(a);
    }, 900 + counterDelay);
  }

  // まちがえた ときの はんげき
  function counterAttack(a) {
    const live = aliveEnemies();
    if (!live.length || a.down) return;
    const e = live.includes(B.enemies[B.target]) ? B.enemies[B.target] : live[0];
    flash(enemyCard(e.idx), 'attack');
    const dmg = Math.max(1, Math.round(e.atk * 0.6 * (DEF_K / (DEF_K + a.stats.def)) * (0.95 + Math.random() * 0.1)));
    a.hp -= dmg;
    a.ep = Math.min(100, a.ep + 10);
    const c = allyCard(a);
    flash(c, 'hit'); pop(c, dmg, 'dmg');
    say(`${e.name} の はんげき！`, 'bad');
    if (a.hp <= 0) { a.hp = 0; a.down = true; say(`${a.name} が たおれた…`, 'bad'); }
    renderAll();
  }

  // ============ てきの ターン ============
  function enemyAct(e) {
    if (e.hp <= 0) { endTurn(e); return; }
    if (e.brokenTurns > 0) {
      e.brokenTurns = 0; e.tough = e.maxTough;
      say(`${e.name} が たてなおした`, '');
      renderEnemies();
      setTimeout(() => endTurn(e), 700);
      return;
    }
    const move = e.nextMove || pick(e.moves);
    const alive = aliveAllies();
    if (!alive.length) { checkEnd(); return; }
    const targets = move.target === 'all' ? alive : [pick(alive)];
    say(`${e.name} の ${move.name}！`, 'bad');
    flash(enemyCard(e.idx), 'attack');
    setTimeout(() => {
      targets.forEach(t => {
        let d = e.atk * move.mult * (DEF_K / (DEF_K + t.stats.def));
        d *= 0.95 + Math.random() * 0.1;
        const dmg = Math.max(1, Math.round(d));
        t.hp -= dmg;
        t.ep = Math.min(100, t.ep + 10);
        const c = allyCard(t);
        flash(c, 'hit'); pop(c, dmg, 'dmg');
        if (t.hp <= 0) { t.hp = 0; t.down = true; say(`${t.name} が たおれた…`, 'bad'); }
      });
      e.nextMove = pick(e.moves);
      renderAll();
      setTimeout(() => { if (!checkEnd()) endTurn(e); }, 700);
    }, 380);
  }

  // ============ しゅうりょう ============
  function checkEnd() {
    if (!B || B.ended) return B ? B.ended : true;
    if (!aliveEnemies().length) { B.ended = true; setTimeout(() => finish(true), 800); return true; }
    if (!aliveAllies().length) { B.ended = true; setTimeout(() => finish(false), 900); return true; }
    return false;
  }

  function finish(win) {
    el.actions.innerHTML = '';
    const run = B.run;
    // けっかを ラン に かきもどす
    run.sp = B.sp;
    B.allies.forEach(a => {
      const p = E.partyOf(run, a.id);
      p.hp = a.down ? 0 : Math.round(a.hp);
      p.ep = Math.round(a.ep);
    });
    if (win) {
      const heal = E.relicSum(run, 'afterBattleHeal');
      if (heal) E.healPct(run, heal);
      // たおれた なかまは すこし かいふくして ふっき
      run.party.forEach(p => {
        if (p.hp <= 0) p.hp = Math.round(E.charStats(run, p.id).hp * 0.15);
      });
    }
    const summary = {
      win, kind: B.kind, answers: B.answers,
      allSubjects: ['国語', '算数', '英語'].every(s => B.usedSubjects[s])
    };
    const cb = B.onEnd;
    B = null;
    cb(summary);
  }

  global.Battle = { start };
})(typeof window !== 'undefined' ? window : globalThis);
