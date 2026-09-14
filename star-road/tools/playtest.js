/* まなびスターロード - じどう プレイテスト
 *
 * ほんものの ゲームを ヘッドレス ブラウザで うごかして、
 * 「せいかいりつ が X% の 子」が どこまで すすめるかを しらべます。
 * バランス調整と、こわれていないかの かくにん（回帰テスト）の りょうほうに つかいます。
 *
 *   npm i playwright                          # さいしょに 1かいだけ
 *   node tools/playtest.js                    # せいかいりつ 90/70/50/30% を 3かいずつ
 *   node tools/playtest.js --acc 0.5 --runs 6 # せいかいりつ 50% を 6かい
 *   node tools/playtest.js --acc 0.9 --shots  # スクリーンショットも とる
 *   node tools/playtest.js --think 14         # 1もんに 14びょう かける「ゆっくりな 子」
 *
 * --think を つけないと AIは そっこうで こたえるので、いつも「はやい せいかい」に
 * なって かいしんが かならず でます。じっさいの 子の てごたえに ちかづけたい ときは
 * --think に 10〜15 くらいを いれて ください（そのぶん テストは ながく かかります）。
 *
 * PW_CHROME=/path/to/chrome で ブラウザの ばしょを していできます。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const GAME = 'file://' + path.resolve(__dirname, '..', 'index.html');
const SHOT_DIR = path.resolve(__dirname, '..', '.shots');

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : dflt;
}
const HAS = name => process.argv.includes('--' + name);
const CONCURRENCY = parseInt(arg('jobs', '3'), 10);

async function playOnce(acc, shots, think) {
  const opts = {};
  if (process.env.PW_CHROME) opts.executablePath = process.env.PW_CHROME;
  const browser = await chromium.launch(opts);
  const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(GAME);
  await page.waitForTimeout(400);
  // どれが せいかいか を テストがわで しるための ひっかけ
  await page.evaluate(() => {
    const m = Questions.make;
    Questions.make = (s, d) => { const q = m(s, d); window.__lastQ = q; return q; };
  });
  if (shots) { fs.mkdirSync(SHOT_DIR, { recursive: true }); await page.screenshot({ path: SHOT_DIR + '/01-title.png', fullPage: true }); }
  await page.click('#btn-new');
  await page.waitForTimeout(400);

  const vis = sel => page.evaluate(s => {
    const e = document.querySelector(s);
    if (!e || e.hidden) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none';
  }, sel);

  const R = { acc, think, won: false, answered: 0, correct: 0, nodes: 0, stageAnswered: [], errors, result: '' };
  const done = {};
  let steps = 0;
  while (steps++ < 12000) {
    if (await vis('#quiz')) {
      if (shots && !done.quiz) { done.quiz = 1; await page.screenshot({ path: SHOT_DIR + '/04-quiz.png', fullPage: true }); }
      const a = await page.evaluate(() => window.__lastQ.answer);
      if (think) await page.waitForTimeout(think * 1000);
      const ok = Math.random() < acc;
      R.answered++; if (ok) R.correct++;
      await page.locator('.q-choice').nth(ok ? a : (a + 1) % 4).click();
      await page.waitForSelector('#q-fb-next:visible', { timeout: 5000 });
      await page.click('#q-fb-next');
      continue;
    }
    if (await vis('#screen-map')) {
      if (shots && !done.map) { done.map = 1; await page.screenshot({ path: SHOT_DIR + '/02-map.png', fullPage: true }); }
      const n = await page.locator('.node.can').count();
      if (!n) { R.errors.push('すすめる マスが ない'); break; }
      R.nodes++;
      await page.locator('.node.can').nth(Math.floor(Math.random() * n)).click({ force: true });
      await page.waitForTimeout(200);
      continue;
    }
    if (await vis('#screen-battle')) {
      if (shots && !done.battle && await page.locator('.act').count()) {
        done.battle = 1; await page.screenshot({ path: SHOT_DIR + '/03-battle.png', fullPage: true });
      }
      const live = page.locator('.act:not(.off)');
      const n = await live.count();
      if (!n) { await page.waitForTimeout(150); continue; }
      const ult = await page.locator('.act.ult').count();
      let i = 0;
      if (ult && Math.random() < 0.85) i = n - 1;                                   // ひっさつが たまったら つかう
      else if (await page.locator('.act.skill:not(.off)').count() && Math.random() < 0.55) i = 1;
      await live.nth(Math.min(i, n - 1)).click({ force: true });
      await page.waitForTimeout(80);
      continue;
    }
    if (await vis('#screen-reward')) {
      if (await page.locator('#rw-relics .relic-card:not([disabled])').count()) {
        await page.locator('#rw-relics .relic-card').first().click();
      }
      await page.waitForSelector('#rw-next:visible');
      await page.click('#rw-next'); continue;
    }
    if (await vis('#screen-train')) {
      if (await vis('#tr-result')) { await page.click('#tr-res-next'); continue; }
      await page.locator('.train-card').nth(Math.floor(Math.random() * 3)).click(); await page.waitForTimeout(150); continue;
    }
    if (await vis('#screen-event')) {
      if (await vis('#ev-result')) { await page.click('#ev-res-next'); continue; }
      const c = await page.locator('.ev-choice').count();
      if (c) await page.locator('.ev-choice').nth(Math.floor(Math.random() * c)).click();
      await page.waitForTimeout(180); continue;
    }
    if (await vis('#screen-rest')) {
      if (await vis('#rs-result')) { await page.click('#rs-res-next'); continue; }
      await page.locator('.rest-card').nth(Math.floor(Math.random() * 3)).click(); await page.waitForTimeout(150); continue;
    }
    if (await vis('#screen-result')) {
      const title = (await page.textContent('#rz-title')) || '';
      const btn = (await page.textContent('#rz-again')) || '';
      if (btn.indexOf('つぎの') === 0) {
        R.stageAnswered.push(R.answered);
        await page.click('#rz-again'); await page.waitForTimeout(200); continue;
      }
      R.stageAnswered.push(R.answered);
      R.won = title.indexOf('ぜんステージ') >= 0;
      R.result = title;
      if (shots) await page.screenshot({ path: SHOT_DIR + '/05-result.png', fullPage: true });
      break;
    }
    await page.waitForTimeout(150);
  }
  R.stage = await page.evaluate(() => (window.Game && Game.run) ? Game.run.act : 0);
  await browser.close();
  return R;
}

async function pool(tasks, n) {
  const out = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, async () => {
    while (i < tasks.length) { const k = i++; out[k] = await tasks[k](); }
  }));
  return out;
}

(async () => {
  const accs = HAS('acc') ? [parseFloat(arg('acc', '0.7'))] : [0.9, 0.7, 0.5, 0.3];
  const runs = parseInt(arg('runs', HAS('acc') ? '4' : '3'), 10);
  const shots = HAS('shots');
  const think = parseFloat(arg('think', '0')) || 0;
  const tasks = [];
  accs.forEach(a => { for (let i = 0; i < runs; i++) tasks.push(() => playOnce(a, shots && i === 0 && a === accs[0], think)); });
  console.log(`ゲーム：${GAME}`);
  console.log(`せいかいりつ ${accs.map(a => Math.round(a * 100) + '%').join(' / ')} を ${runs}かいずつ（どうじ ${CONCURRENCY}）`);
  console.log(think ? `1もん ${think}びょう かけて こたえます` : '1もん そっこうで こたえます（かいしんが かならず でます）');
  console.log('');
  const res = await pool(tasks, CONCURRENCY);

  const rows = accs.map(a => {
    const g = res.filter(r => r.acc === a);
    const avg = f => Math.round(g.reduce((s, r) => s + f(r), 0) / g.length);
    return {
      'せいかいりつ': Math.round(a * 100) + '%',
      'クリア': `${g.filter(r => r.won).length} / ${g.length}`,
      'とどいた ステージ': (g.reduce((s, r) => s + (r.won ? 3 : r.stage), 0) / g.length).toFixed(1),
      'といた もんだい': avg(r => r.answered),
      'すすんだ マス': avg(r => r.nodes),
      'エラー': g.reduce((s, r) => s + r.errors.length, 0)
    };
  });
  console.table(rows);
  const errs = res.flatMap(r => r.errors);
  if (errs.length) { console.log('\n⚠ エラー:'); [...new Set(errs)].slice(0, 10).forEach(e => console.log('  ' + e)); process.exitCode = 1; }
  else console.log('\n✅ エラーなし');
  if (shots) console.log('スクリーンショット: ' + SHOT_DIR);
})();
