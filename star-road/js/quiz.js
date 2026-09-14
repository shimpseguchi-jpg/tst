/* まなびスターロード - もんだい オーバーレイ */
(function (global) {
  'use strict';
  const SUBJECT_COLOR = { '国語': '#ff6b8b', '算数': '#5cc8ff', '英語': '#ffd45c' };
  const SUBJECT_EMOJI = { '国語': '📖', '算数': '🔢', '英語': '🔤' };

  let el = {}, state = null, raf = 0;

  function init() {
    el.root = document.getElementById('quiz');
    el.badge = document.getElementById('q-badge');
    el.cat = document.getElementById('q-cat');
    el.prompt = document.getElementById('q-prompt');
    el.choices = document.getElementById('q-choices');
    el.timer = document.getElementById('q-timer');
    el.timerBar = document.getElementById('q-timer-bar');
    el.timerNum = document.getElementById('q-timer-num');
    el.feedback = document.getElementById('q-feedback');
    el.fbIcon = document.getElementById('q-fb-icon');
    el.fbText = document.getElementById('q-fb-text');
    el.fbNote = document.getElementById('q-fb-note');
    el.fbNext = document.getElementById('q-fb-next');
    el.hint = document.getElementById('q-hint');
    el.title = document.getElementById('q-title');
    el.fbNext.addEventListener('click', finish);
    el.hint.addEventListener('click', useHint);
  }

  /**
   * ask({subject, difficulty, timeLimit, title, hints, onDone})
   *   onDone({correct, question, chosen, speed})  speed: 0〜1（はやいほど 1）
   */
  function ask(opt) {
    if (!el.root) init();
    const q = Questions.make(opt.subject, opt.difficulty || 1);
    state = {
      q, opt, answered: false, hintsLeft: opt.hints || 0,
      start: performance.now(), limit: (opt.timeLimit || 0) * 1000, speed: 0
    };
    el.root.style.setProperty('--qc', SUBJECT_COLOR[q.subject] || '#fff');
    el.badge.textContent = SUBJECT_EMOJI[q.subject] + ' ' + q.subject;
    el.cat.textContent = q.category;
    el.title.textContent = opt.title || 'もんだい';
    el.prompt.textContent = q.prompt;
    el.feedback.hidden = true;
    el.choices.hidden = false;
    el.choices.innerHTML = '';
    q.choices.forEach((c, i) => {
      const b = document.createElement('button');
      b.className = 'q-choice';
      b.type = 'button';
      b.innerHTML = `<span class="q-num">${i + 1}</span><span class="q-txt"></span>`;
      b.querySelector('.q-txt').textContent = c;
      b.addEventListener('click', () => answer(i));
      el.choices.appendChild(b);
    });
    el.hint.hidden = !(state.hintsLeft > 0);
    el.hint.textContent = `👓 ヒント（のこり ${state.hintsLeft}）`;
    el.timer.hidden = !state.limit;
    el.root.hidden = false;
    el.root.classList.add('show');
    if (state.limit) tick(); else cancelAnimationFrame(raf);
  }

  function tick() {
    const now = performance.now();
    const left = Math.max(0, state.limit - (now - state.start));
    const ratio = left / state.limit;
    el.timerBar.style.width = (ratio * 100) + '%';
    el.timerBar.classList.toggle('danger', ratio < 0.3);
    el.timerNum.textContent = Math.ceil(left / 1000);
    if (left <= 0) { answer(-1); return; }
    if (!state.answered) raf = requestAnimationFrame(tick);
  }

  function useHint() {
    if (!state || state.answered || state.hintsLeft <= 0) return;
    state.hintsLeft--;
    const btns = Array.from(el.choices.children);
    const wrong = btns.map((b, i) => i).filter(i => i !== state.q.answer);
    Questions._util.shuffle(wrong).slice(0, 2).forEach(i => {
      btns[i].disabled = true;
      btns[i].classList.add('dimmed');
    });
    el.hint.hidden = true;
    if (state.opt.onHintUsed) state.opt.onHintUsed();
  }

  function answer(idx) {
    if (!state || state.answered) return;
    state.answered = true;
    cancelAnimationFrame(raf);
    const correct = idx === state.q.answer;
    const used = performance.now() - state.start;
    state.speed = state.limit ? Math.max(0, Math.min(1, 1 - used / state.limit)) : 0.5;
    state.chosen = idx;

    Array.from(el.choices.children).forEach((b, i) => {
      b.disabled = true;
      if (i === state.q.answer) b.classList.add('right');
      else if (i === idx) b.classList.add('miss');
    });
    el.hint.hidden = true;

    setTimeout(() => {
      el.choices.hidden = true;
      el.feedback.hidden = false;
      el.feedback.classList.toggle('ok', correct);
      el.feedback.classList.toggle('ng', !correct);
      el.fbIcon.textContent = correct ? '⭕' : '❌';
      el.fbText.textContent = correct
        ? (state.limit && state.speed > 0.6 ? 'せいかい！ はやい！' : 'せいかい！')
        : (idx === -1 ? 'じかん ぎれ…' : 'ざんねん…');
      el.fbNote.textContent = state.q.note + (correct ? '' : `　こたえ：${state.q.choices[state.q.answer]}`);
      el.fbNext.focus({ preventScroll: true });
    }, correct ? 350 : 550);
  }

  function finish() {
    if (!state) return;
    const s = state;
    state = null;
    el.root.hidden = true;
    el.root.classList.remove('show');
    s.opt.onDone({
      correct: s.chosen === s.q.answer,
      question: s.q, chosen: s.chosen, speed: s.speed,
      hintsLeft: s.hintsLeft
    });
  }

  global.Quiz = { ask, SUBJECT_COLOR, SUBJECT_EMOJI };
})(typeof window !== 'undefined' ? window : globalThis);
