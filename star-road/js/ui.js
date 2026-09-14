/* まなびスターロード - がめん（マップ／とっくん／イベント／きゅうけい／ほうしゅう） */
(function (global) {
  'use strict';
  const E = global.Engine;
  const { NODE_TYPES, COLS, FLOORS } = E;
  const { RELICS, EVENTS, CHARS } = global.GameData;
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = E._util.shuffle;
  const SUB_EMOJI = { '国語': '📖', '算数': '🔢', '英語': '🔤' };
  const STAT_LABEL = { atk: 'こうげき', def: 'まもり', spd: 'すばやさ', hp: 'さいだいHP', crit: 'かいしんりつ' };

  let run = null;
  const $ = id => document.getElementById(id);

  function show(name) {
    document.querySelectorAll('.screen').forEach(s => { s.hidden = (s.id !== 'screen-' + name); });
    const main = $('main');
    if (main) main.scrollTop = 0;
    $('hud').hidden = (name === 'title');
  }

  // ================= HUD =================
  function renderHud() {
    if (!run) return;
    $('hud-act').textContent = `${run.act}ステージ`;
    $('hud-party').innerHTML = run.party.map(p => {
      const d = E.charDef(p.id), st = E.charStats(run, p.id);
      const pct = Math.max(0, Math.round(p.hp / st.hp * 100));
      return `<div class="hp-mini" style="--c:${d.color}" title="${d.name}">
        <span class="hm-emoji">${Sprites.tag(d.id, 1)}</span>
        <span class="hm-bar"><i style="width:${pct}%"></i></span>
        <span class="hm-num">${Math.max(0, p.hp)}</span></div>`;
    }).join('');
    $('hud-relics').innerHTML = run.relics.map(id => {
      const r = RELICS.find(x => x.id === id);
      return r ? `<button class="relic-chip" type="button" title="${r.name}">${r.emoji}</button>` : '';
    }).join('');
    $('hud-sp').textContent = 'SP ' + run.sp;
  }

  function setRun(r) { run = r; renderHud(); }

  // ================= マップ =================
  const ROW_H = 96;
  function renderMap() {
    const wrap = $('map-wrap');
    const nodes = run.map.nodes;
    const rows = FLOORS + 1;                 // ボスの ぶん +1
    const H = rows * ROW_H;
    const cx = n => ((n.col + 0.5) / COLS) * 100;
    const cy = n => H - (n.floor * ROW_H) - ROW_H / 2;

    const avail = availableNodes();
    const availSet = new Set(avail.map(n => n.id));

    let lines = '';
    for (const k in nodes) {
      const n = nodes[k];
      for (const nx of n.next) {
        const m = nodes[nx];
        if (!m) continue;
        const on = run.cleared.includes(n.id) && availSet.has(m.id);
        lines += `<line x1="${cx(n)}" y1="${cy(n)}" x2="${cx(m)}" y2="${cy(m)}"
          class="edge${on ? ' on' : ''}" vector-effect="non-scaling-stroke"/>`;
      }
    }
    let html = `<svg class="map-lines" viewBox="0 0 100 ${H}" preserveAspectRatio="none"
      style="height:${H}px">${lines}</svg>`;
    for (const k in nodes) {
      const n = nodes[k];
      const t = NODE_TYPES[n.type];
      const done = run.cleared.includes(n.id);
      const can = availSet.has(n.id);
      html += `<button type="button" class="node ${n.type}${done ? ' done' : ''}${can ? ' can' : ''}${run.current === n.id ? ' here' : ''}"
        data-id="${n.id}" style="left:${cx(n)}%;top:${cy(n) - 30}px;--c:${t.color}" ${can ? '' : 'disabled'}>
        <span class="n-ico">${t.emoji}</span><span class="n-lab">${t.label}</span></button>`;
    }
    wrap.style.height = H + 'px';
    wrap.innerHTML = html;
    wrap.querySelectorAll('.node.can').forEach(b => {
      b.addEventListener('click', () => enterNode(nodes[b.dataset.id]));
    });
    $('map-hint').textContent = run.current
      ? 'ひかって いる マスを タップして すすもう'
      : 'いちばん したの マスから スタート！';
    // いまいる ばしょが みえる ように スクロール
    setTimeout(() => {
      const here = wrap.querySelector('.node.can') || wrap.querySelector('.node.here');
      if (here) here.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 60);
    renderHud();
  }

  function availableNodes() {
    const nodes = run.map.nodes;
    if (!run.pos) return Object.values(nodes).filter(n => n.floor === 0);
    const cur = nodes[run.pos];
    if (!cur) return [];
    return cur.next.map(id => nodes[id]).filter(Boolean);
  }

  function enterNode(node) {
    run.current = node.id;
    E.save(run);
    switch (node.type) {
      case 'battle': return startBattle('normal');
      case 'elite': return startBattle('elite');
      case 'boss': return startBattle('boss');
      case 'train': return showTrain();
      case 'event': return showEvent();
      case 'rest': return showRest();
    }
  }

  function finishNode() {
    if (!run.cleared.includes(run.current)) run.cleared.push(run.current);
    run.pos = run.current;
    E.save(run);
    show('map');
    renderMap();
  }

  // ================= たたかい =================
  function startBattle(kind) {
    show('battle');
    Battle.start({
      run, kind,
      onEnd: summary => {
        if (!summary.win) return gameOver();
        battleReward(kind, summary);
      }
    });
  }

  function battleReward(kind, summary) {
    const lines = [];
    // かった ごほうびに みんなが つよく なる（エリート・ボスほど おおきい）
    const up = kind === 'boss' ? 6 : kind === 'elite' ? 4 : 2;
    run.party.forEach(p => {
      p.bonus.atk += up;
      p.bonus.hp += up * 6;
    });
    lines.push(`⚔️ みんなの こうげき +${up}、さいだいHP +${up * 6}`);
    if (kind !== 'normal') {
      run.party.forEach(p => { p.bonus.def += 2; p.bonus.spd += 2; });
      lines.push('🛡️ みんなの まもり +2、すばやさ +2');
    }
    if (summary.allSubjects) {
      E.healPct(run, 0.08);
      lines.push('🌈 3きょうか ぜんぶ つかった！ HPが すこし かいふく');
    }
    lines.push(`📊 この たたかい：せいかい ${summary.answers.correct} / まちがい ${summary.answers.wrong}`);
    E.clampHp(run);

    const choices = shuffle(RELICS.filter(r => !run.relics.includes(r.id))).slice(0, 3);
    showReward({
      title: kind === 'boss' ? '👹 ボスを たおした！' : kind === 'elite' ? '💀 エリートに かった！' : '⚔️ かった！',
      lines,
      relics: choices,
      onDone: () => {
        if (kind === 'boss') return actClear();
        finishNode();
      }
    });
  }

  function showReward(opt) {
    show('reward');
    $('rw-title').textContent = opt.title;
    $('rw-lines').innerHTML = opt.lines.map(l => `<li>${l}</li>`).join('');
    const box = $('rw-relics');
    box.innerHTML = '';
    if (opt.relics && opt.relics.length) {
      $('rw-relic-label').hidden = false;
      opt.relics.forEach(r => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'relic-card';
        b.innerHTML = `<span class="rc-emoji">${r.emoji}</span>
          <span class="rc-name">${r.name}</span><span class="rc-desc">${r.desc}</span>`;
        b.addEventListener('click', () => {
          E.giveRelic(run, r.id);
          renderHud();
          box.querySelectorAll('.relic-card').forEach(x => { x.disabled = true; x.classList.add('dim'); });
          b.classList.remove('dim'); b.classList.add('taken');
          $('rw-next').hidden = false;
        });
        box.appendChild(b);
      });
      $('rw-next').hidden = true;
    } else {
      $('rw-relic-label').hidden = true;
      $('rw-next').hidden = false;
    }
    const next = $('rw-next');
    next.onclick = () => opt.onDone();
  }

  // ================= とっくん =================
  const TRAIN_MENUS = [
    { stat: 'atk', value: 3, label: 'こうげき' },
    { stat: 'hp', value: 30, label: 'さいだいHP' },
    { stat: 'def', value: 3, label: 'まもり' },
    { stat: 'spd', value: 2, label: 'すばやさ' },
    { stat: 'crit', value: 2, label: 'かいしんりつ' }
  ];

  function showTrain(forced) {
    show('train');
    $('tr-result').hidden = true;
    $('tr-menu').hidden = false;
    $('tr-title').textContent = '🏋️ とっくん';
    $('tr-lead').textContent = 'どの とっくんを する? もんだいに せいかいすると ちからが あがるよ。（じかん せいげん なし）';
    const box = $('tr-menu');
    box.innerHTML = '';
    const menus = [];
    const chars = shuffle(CHARS.slice());
    for (let i = 0; i < 3; i++) {
      const c = chars[i % chars.length];
      const m = pick(TRAIN_MENUS);
      menus.push({ char: c, stat: m.stat, value: m.value, label: m.label });
    }
    menus.forEach(m => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'train-card';
      b.style.setProperty('--c', m.char.color);
      const bonus = E.relicSum(run, 'trainBonus') * (m.stat === 'hp' ? 10 : 1);
      b.innerHTML = `<span class="tc-emoji">${m.char.emoji}</span>
        <span class="tc-name">${m.char.name} の ${m.label} とっくん</span>
        <span class="tc-desc">${SUB_EMOJI[m.char.subject]} ${m.char.subject}の もんだい 3もん<br>
        せいかい 1つ に つき ${m.label} +${m.value + bonus}</span>`;
      b.addEventListener('click', () => runTraining(m, 3, bonus));
      box.appendChild(b);
    });
  }

  function runTraining(menu, count, bonus) {
    let i = 0, got = 0, correct = 0;
    $('tr-menu').hidden = true;
    const step = () => {
      if (i >= count) {
        if (correct === count) {
          got += menu.value;
          E.healPct(run, 0.05);
        }
        applyStat(menu.char.id, menu.stat, got);
        E.clampHp(run);
        $('tr-result').hidden = false;
        $('tr-res-title').textContent = correct === count ? '🎉 パーフェクト！' : correct > 0 ? '👍 よく がんばった！' : '💦 つぎは がんばろう';
        $('tr-res-body').innerHTML =
          `<p>せいかい <b>${correct}</b> / ${count}</p>` +
          (correct === count ? `<p class="bonus">ぜんもん せいかい ボーナス！ ＋${menu.value}　＆ HP すこし かいふく</p>` : '') +
          `<p class="grow">${menu.char.emoji} ${menu.char.name} の ${menu.label} が <b>+${got}</b> あがった！</p>`;
        $('tr-res-next').onclick = finishNode;
        renderHud();
        return;
      }
      i++;
      Quiz.ask({
        subject: menu.char.subject,
        difficulty: E.difficultyFor(run, 'train'),
        timeLimit: 0,
        title: `とっくん ${i} / ${count}`,
        hints: 0,
        onDone: res => {
          E.recordAnswer(run, menu.char.subject, res.correct);
          if (res.correct) { correct++; got += menu.value + bonus; }
          step();
        }
      });
    };
    step();
  }

  function applyStat(charId, stat, value) {
    if (!value) return;
    const p = E.partyOf(run, charId);
    if (!p) return;
    p.bonus[stat] = (p.bonus[stat] || 0) + value;
  }
  function applyStatAll(stat, value) { run.party.forEach(p => { p.bonus[stat] = (p.bonus[stat] || 0) + value; }); }

  // ================= イベント =================
  function showEvent() {
    show('event');
    const ev = pick(EVENTS);
    $('ev-emoji').textContent = ev.emoji;
    $('ev-title').textContent = ev.title;
    $('ev-text').textContent = ev.text;
    $('ev-result').hidden = true;
    const box = $('ev-choices');
    box.hidden = false;
    box.innerHTML = '';
    ev.choices.forEach(ch => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ev-choice';
      b.textContent = ch.label;
      b.addEventListener('click', () => doEventChoice(ev, ch));
      box.appendChild(b);
    });
  }

  function eventResult(lines) {
    $('ev-choices').hidden = true;
    $('ev-result').hidden = false;
    $('ev-res-body').innerHTML = lines.map(l => `<p>${l}</p>`).join('');
    $('ev-res-next').onclick = finishNode;
    E.clampHp(run);
    renderHud();
  }

  function doEventChoice(ev, ch) {
    const lines = [];
    const give = () => {
      const r = E.rollRelic(run);
      if (r) { E.giveRelic(run, r.id); return `${r.emoji} <b>${r.name}</b> を てに いれた！<br><small>${r.desc}</small>`; }
      E.healPct(run, 0.15); return 'レリックは もう ぜんぶ もっていた。かわりに HPが かいふく した。';
    };
    const hurt = pct => {
      run.party.forEach(p => { if (p.hp > 0) p.hp = Math.max(1, p.hp - Math.round(E.charStats(run, p.id).hp * pct)); });
      return `みんな HPが ${Math.round(pct * 100)}% へった…`;
    };
    switch (ch.kind) {
      case 'none': return eventResult([ch.note || 'なにも おこらなかった。']);
      case 'heal': E.healPct(run, ch.value); return eventResult([`HPが ${Math.round(ch.value * 100)}% かいふく した！`]);
      case 'maxhp': applyStatAll('hp', ch.value); E.healPct(run, 0.05); return eventResult([`みんなの さいだいHP が +${ch.value}！`]);
      case 'stat': {
        if (ch.who) { applyStat(ch.who, ch.stat, ch.value); const c = CHARS.find(x => x.id === ch.who); return eventResult([`${c.emoji} ${c.name} の ${STAT_LABEL[ch.stat]} が +${ch.value}！`]); }
        applyStatAll(ch.stat, ch.value); return eventResult([`みんなの ${STAT_LABEL[ch.stat]} が +${ch.value}！`]);
      }
      case 'relic': return eventResult([give()]);
      case 'fullsp': run.sp = run.maxSp; return eventResult(['スキルポイントが さいだいに なった！']);
      case 'ep': run.party.forEach(p => { p.ep = Math.min(100, p.ep + ch.value); }); return eventResult([`みんなの ひっさつゲージ +${ch.value}！`]);
      case 'lunch': E.healPct(run, 0.2); applyStatAll('hp', 40); return eventResult(['HPが 20% かいふく！', 'みんなの さいだいHP が +40！']);
      case 'catgood': { const l = [hurt(0.08)]; l.push(give()); return eventResult(l); }
      case 'train': {
        const c = CHARS.find(x => x.subject === ch.subject);
        $('ev-choices').hidden = true;
        return Quiz.ask({
          subject: ch.subject, difficulty: E.difficultyFor(run, 'train'), timeLimit: 0,
          title: 'たびの せんせいの もんだい', hints: 0,
          onDone: res => {
            E.recordAnswer(run, ch.subject, res.correct);
            if (res.correct) {
              applyStat(c.id, 'atk', 6); applyStat(c.id, 'hp', 40);
              eventResult([`せいかい！ ${c.emoji} ${c.name} の こうげき +6、さいだいHP +40！`]);
            } else {
              applyStatAll('hp', 15);
              eventResult(['ざんねん… でも おしえて もらった ことは わすれない。', 'みんなの さいだいHP が +15。']);
            }
          }
        });
      }
      case 'quiz': case 'quiz2': {
        const n = ch.kind === 'quiz2' ? 2 : 1;
        let i = 0, ok = 0;
        $('ev-choices').hidden = true;
        const step = () => {
          if (i >= n) {
            const lines2 = [];
            if (ok === n) {
              lines2.push(`ぜんもん せいかい！`);
              if (ch.reward === 'relic') lines2.push(give());
              else { applyStatAll('atk', 4); lines2.push('みんなの こうげき が +4！'); }
            } else {
              lines2.push('まちがえて しまった…');
              if (ch.penalty === 'hp10') lines2.push(hurt(0.1));
              else if (ch.penalty === 'hp15') lines2.push(hurt(0.15));
              else lines2.push('とくに なにも おこらなかった。');
            }
            return eventResult(lines2);
          }
          i++;
          const subject = pick(['国語', '算数', '英語']);
          Quiz.ask({
            subject, difficulty: E.difficultyFor(run, 'event'), timeLimit: 0,
            title: `${ev.title}（${i}/${n}）`, hints: 0,
            onDone: res => { E.recordAnswer(run, subject, res.correct); if (res.correct) ok++; step(); }
          });
        };
        return step();
      }
    }
    eventResult(['…']);
  }

  // ================= きゅうけい =================
  function showRest() {
    show('rest');
    $('rs-result').hidden = true;
    const box = $('rs-choices');
    box.hidden = false;
    box.innerHTML = '';
    const pct = 0.4 * (1 + E.relicSum(run, 'restBonus'));
    const mk = (emoji, title, desc, fn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rest-card';
      b.innerHTML = `<span class="rs-emoji">${emoji}</span><span class="rs-name">${title}</span><span class="rs-desc">${desc}</span>`;
      b.addEventListener('click', fn);
      box.appendChild(b);
    };
    mk('😴', 'ぐっすり ねる', `HPが ${Math.round(pct * 100)}% かいふく する`, () => {
      E.healPct(run, pct);
      restResult([`ぐっすり ねた！ HPが ${Math.round(pct * 100)}% かいふく した。`]);
    });
    mk('📖', 'じしゅべんきょう', 'もんだい 2もん。せいかいすると みんなの ちからが あがる（じかん せいげん なし）', () => {
      box.hidden = true;
      let i = 0, ok = 0;
      const step = () => {
        if (i >= 2) {
          applyStatAll('atk', ok * 3);
          applyStatAll('hp', ok * 20);
          E.healPct(run, 0.1);
          E.clampHp(run);
          return restResult([`せいかい ${ok} / 2`,
            `みんなの こうげき +${ok * 3}、さいだいHP +${ok * 20}`,
            'すこし HPも かいふく した。']);
        }
        i++;
        const subject = pick(['国語', '算数', '英語']);
        Quiz.ask({
          subject, difficulty: E.difficultyFor(run, 'train'), timeLimit: 0,
          title: `じしゅべんきょう ${i}/2`, hints: 0,
          onDone: res => { E.recordAnswer(run, subject, res.correct); if (res.correct) ok++; step(); }
        });
      };
      step();
    });
    mk('🔧', 'そうび を みなおす', 'ひっさつゲージ ＋30／スキルポイント さいだい', () => {
      run.party.forEach(p => { p.ep = Math.min(100, p.ep + 30); });
      run.sp = run.maxSp;
      restResult(['みんなの ひっさつゲージ +30！', 'スキルポイントが さいだいに なった！']);
    });
  }
  function restResult(lines) {
    $('rs-choices').hidden = true;
    $('rs-result').hidden = false;
    $('rs-res-body').innerHTML = lines.map(l => `<p>${l}</p>`).join('');
    $('rs-res-next').onclick = finishNode;
    renderHud();
  }

  // ================= ステージ クリア／ゲームオーバー =================
  function actClear() {
    if (!run.cleared.includes(run.current)) run.cleared.push(run.current);
    run.pos = run.current;
    if (run.act >= 3) return gameClear();
    run.act++;
    run.map = E.genMap();
    run.current = null;
    run.pos = null;
    run.cleared = [];
    run.sp = Math.max(run.sp, 3);
    E.healPct(run, 0.35);
    E.clampHp(run);
    E.save(run);
    show('result');
    $('rz-emoji').textContent = '🎊';
    $('rz-title').textContent = `ステージ ${run.act - 1} クリア！`;
    $('rz-body').innerHTML = `<p>つぎは <b>ステージ ${run.act}</b>。もんだいも てきも すこし むずかしく なるよ。</p>
      <p>HPが 35% かいふく した！</p>` + statsHtml();
    $('rz-again').textContent = 'つぎの ステージへ ➡';
    $('rz-again').onclick = () => { show('map'); renderMap(); };
    $('rz-title2').hidden = true;
  }

  function gameClear() {
    E.clearSave();
    show('result');
    $('rz-emoji').textContent = '🏆';
    $('rz-title').textContent = 'ぜんステージ クリア！ おめでとう！';
    $('rz-body').innerHTML = `<p>テスト まおう を たおして、まなびの ほしに へいわが もどった！</p>` + statsHtml();
    $('rz-again').textContent = 'もう いちど あそぶ';
    $('rz-again').onclick = () => global.Game.newGame();
    $('rz-title2').hidden = true;
  }

  function gameOver() {
    E.clearSave();
    show('result');
    $('rz-emoji').textContent = '💤';
    $('rz-title').textContent = 'ぜんめつ… また ちょうせん しよう';
    $('rz-body').innerHTML = `<p>ステージ ${run.act}・${run.cleared.length}マスまで すすんだ。</p>` + statsHtml();
    $('rz-again').textContent = 'もう いちど はじめから';
    $('rz-again').onclick = () => global.Game.newGame();
    $('rz-title2').hidden = true;
  }

  function statsHtml() {
    const s = run.stats;
    const tot = s.correct + s.wrong;
    const rate = tot ? Math.round(s.correct / tot * 100) : 0;
    const rows = Object.keys(s.bySubject).map(k => {
      const [c, w] = s.bySubject[k];
      const t = c + w;
      return `<tr><td>${SUB_EMOJI[k]} ${k}</td><td>${c} / ${t}</td>
        <td>${t ? Math.round(c / t * 100) : 0}%</td></tr>`;
    }).join('');
    return `<div class="stats">
      <p class="big">といた もんだい <b>${tot}</b>もん　せいかいりつ <b>${rate}%</b></p>
      <table><thead><tr><th>きょうか</th><th>せいかい</th><th>りつ</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="relic-list">レリック：${run.relics.map(id => { const r = RELICS.find(x => x.id === id); return r ? r.emoji + r.name : ''; }).join('、') || 'なし'}</p>
    </div>`;
  }

  global.UI = { show, setRun, renderMap, renderHud, statsHtml, finishNode };
})(typeof window !== 'undefined' ? window : globalThis);
