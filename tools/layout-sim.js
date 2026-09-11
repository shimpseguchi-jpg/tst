#!/usr/bin/env node
/*
 * 盤面レイアウトの自動評価ツール
 *
 *   node tools/layout-sim.js check              いまの index.html の配置を評価する
 *   node tools/layout-sim.js search [案数] [球数] ランダムに案を作って上位を表示する
 *
 * index.html から物理演算のコードをそのまま抜き出して使うので、
 * ゲーム本体を書きかえれば評価もそれに追従します。
 */
const fs = require('fs');
const path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
const src = fs.readFileSync(HTML, 'utf8');

function slice(a, b){
  const i = src.indexOf(a), j = src.indexOf(b, i);
  if(i < 0 || j < 0) throw new Error('index.html の構造が変わっています: ' + a);
  return src.slice(i, j);
}
const GEOM = slice('function seg(', '/* ---- バンパー');
const FLIP = slice('/* ---- フリッパー ---- */', '/* ================= サウンド');
const PHYS = slice('/* ================= 物理 ================= */', '/* ================= 描画');

const CX = 210, ARC = {x:245, y:275, r:225};
const BALLS = 400, MAXT = 60, DT = 1/60;

/* ---- 本体の物理コードで1球ぶんの世界をつくる ---- */
function makeSim(layout){
  return new Function(`
    const BR=11, GRAV=1000, VMAX=1500, DRAIN_Y=810;
    const AIM_Y0=530, AIM_Y1=690, SLOW_MAX=${layout.slowMax==null?0.62:layout.slowMax};
    const BUMP_KICK=${layout.bumpKick||430}, SLING_KICK=${layout.slingKick||430}, POST_KICK=${layout.postKick||260};
    ${GEOM}
    const BUMP_MOVE = ${JSON.stringify(layout.move || {ax:16,ay:8,sp:0.55})};
    const bumpers = ${JSON.stringify(layout.bumpers)}.map(b=>Object.assign({val:0,flash:0,cool:0},b));
    bumpers.forEach(b=>{ b.x=b.hx; b.y=b.hy; });
    const posts   = ${JSON.stringify(layout.posts)};
    ${FLIP}
    const ball={x:435,y:750,vx:0,vy:0,live:false};
    const G={stuck:0,score:0,flips:0};
    const stats={bump:0, perB:[0,0,0], dead:false, lane:false};
    const sfx={bump(){},post(){},flip(){}};
    function hitBumper(b){ if(b.cool>0) return; b.cool=0.25; stats.bump++; stats.perB[bumpers.indexOf(b)]++; }
    function setReady(){ stats.lane=true; ball.live=false; }
    function loseBall(){ stats.dead=true; }
    ${PHYS}
    return {ball,bumpers,flippers,stats,stepPhysics,aimSlowFactor,SLOW_MAX,G};
  `)();
}

/* ---- フリッパーAI ----
   人間と同じように「見えてから REACT 秒おくれて」振る。
   この遅れを入れないと、どんな配置でも全部打ち返せてしまい差が出ない。   */
const REACT = +process.env.REACT || 0.25;   // 反応時間（秒）。REACT=0.45 で幼い子を想定できる
function ai(sim, st, dt){
  const b = sim.ball;
  for(let i=0;i<2;i++){
    const f = sim.flippers[i], s = st[i];
    if(s.hold > 0){ s.hold -= dt; f.held = true; if(s.hold <= 0){ f.held=false; s.cool=0.22; } continue; }
    if(s.cool > 0){ s.cool -= dt; f.held = false; continue; }
    const zone = b.vy > 0 && b.y > 600 && b.y < 738 &&
      (i===0 ? (b.x > f.px-16 && b.x < f.px+105) : (b.x < f.px+16 && b.x > f.px-105));
    if(zone && s.pend < 0) s.pend = REACT + (Math.random()-0.5)*0.10;
    if(s.pend >= 0){ s.pend -= dt; if(s.pend <= 0){ s.hold = 0.13; s.pend = -1; f.held = true; } }
    else f.held = false;
  }
}

function evaluate(layout, balls = BALLS){
  let hits=0, perB=[0,0,0], zero=0, life=0, fhSum=0, fhN=0, capped=0, slowF=0, allF=0, maxRun=0, topF=0;
  let returns=0, descents=0, catches=0, arrSpd=0, arrN=0, noTouch=0;
  for(let n=0;n<balls;n++){
    const sim = makeSim(layout);
    for(const b of sim.bumpers) b.cool = 0;
    const st=[{hold:0,cool:0,pend:-1},{hold:0,cool:0,pend:-1}];
    sim.ball.x=435; sim.ball.y=750; sim.ball.live=true;
    sim.ball.vy = -(1150 + 520*Math.random());
    sim.ball.vx = (Math.random()-0.5)*40;
    let t=0, fh=-1, run=0, lastFlips=0, touching=false;
    let slow=0, wasAbove=true, pendingCatch=-1, ballCatches=0;
    while(t < MAXT && !sim.stats.dead && !sim.stats.lane){
      // ゲーム本体と同じスロー再生（プレイヤーの体感時間で測るため）
      const want = sim.aimSlowFactor(sim.ball);
      slow += (want - slow) * Math.min(1, DT*8);
      const ts = 1 - sim.SLOW_MAX*slow;
      for(const b of sim.bumpers) if(b.cool>0) b.cool -= DT*ts;
      ai(sim, st, DT);                       // AIの反応は実時間
      sim.stepPhysics(DT*ts);                // 世界はゆっくり進む
      t += DT; allF++;
      // フリッパーの高さまで落ちてきた回数と、打ち返せた回数
      const above = sim.ball.y < 620;
      if(wasAbove && !above && sim.ball.vy > 0){
        descents++; pendingCatch = 1.0; arrSpd += Math.hypot(sim.ball.vx, sim.ball.vy); arrN++;
      }
      wasAbove = above;
      if(pendingCatch > 0) pendingCatch -= DT;
      const sp = Math.hypot(sim.ball.vx, sim.ball.vy);
      if(sim.ball.y < 470) topF++;
      if(sp < 45){ slowF++; run++; if(run>maxRun) maxRun=run; } else run = 0;
      if(fh < 0 && sim.stats.bump > 0) fh = t;
      const nowTouching = sim.G.flips > lastFlips;      // フリッパーに触れているか
      if(nowTouching && !touching){
        returns++; ballCatches++;
        if(pendingCatch > 0){ catches++; pendingCatch = -1; }
      }
      touching = nowTouching; lastFlips = sim.G.flips;
    }
    if(ballCatches === 0) noTouch++;
    if(t >= MAXT) capped++;
    hits += sim.stats.bump;
    for(let i=0;i<3;i++) perB[i] += sim.stats.perB[i];
    if(sim.stats.bump === 0) zero++;
    if(fh >= 0){ fhSum += fh; fhN++; }
    life += t;
  }
  const tot = perB.reduce((a,b)=>a+b,0) || 1;
  const share = perB.map(v=>v/tot);
  return {
    share:   share.map(v=>Math.round(v*100)),
    balance: Math.min(...share)/Math.max(...share),
    zeroRate: zero/balls,
    firstHit: fhN ? fhSum/fhN : 99,
    hitsPerMin: hits/(life/60),
    life: life/balls,
    topRate: topF/(allF||1),
    capped: capped/balls,
    returnsPerMin: returns/(life/60),
    returnsPerBall: returns/balls,
    catchRate: descents ? catches/descents : 0,     // 落ちてきた球を打ち返せた割合
    arrivalSpeed: arrN ? arrSpd/arrN : 0,           // フリッパーに届いたときの速さ
    noTouchRate: noTouch/balls,                     // 一度も打ち返せずに終わった球
    slowRate: slowF/(allF||1),
    maxSlow: maxRun/60
  };
}

/* ---- よい盤面の条件を1つの数字にまとめる ---- */
function band(v, lo, hi, w){
  if(v>=lo && v<=hi) return w;
  const d = v<lo ? (lo-v)/lo : (v-hi)/hi;
  return w - Math.min(w*2, d*w*1.5);
}
function score(m){
  return -3.0*m.zeroRate                        // まとに当たらない球は最悪
       + 3.0*m.balance                          // 3つのまとが平等に当たること
       - 0.22*Math.min(m.firstHit, 10)          // 早く当たること
       + 0.10*Math.min(m.returnsPerBall, 20)    // ★1球あたり自分のバーに返ってくる回数
       - 1.0*m.noTouchRate                       // 一度も打ち返せずに終わる球
       + band(m.hitsPerMin, 14, 34, 0.7)        // 忙しすぎず暇すぎず
       + band(m.topRate, 0.20, 0.46, 0.4)       // 上に張りつきすぎない
       - 1.5*Math.max(0, m.capped-0.25)
       - 4.0*Math.max(0, m.slowRate-0.02)       // どこかに挟まっていないか
       - 1.0*Math.max(0, m.maxSlow-1.0);
}

/* ---- レイアウトの妥当性 ---- */
function valid(L){
  const {bumpers:bs, posts:ps} = L;
  const mv = L.move || {ax:16, ay:8};
  // 動くので、いちばん外側まで出たときで判定する（実効半径に振れ幅を足す）
  const eff = b => ({x:b.hx, y:b.hy, r:b.r + Math.max(mv.ax, mv.ay)});
  for(const b of bs){
    const e = eff(b);
    if(e.x-e.r < 26 || e.x+e.r > 394) return false;
    if(e.y-e.r < 70 || e.y+e.r > 545) return false;
    if(Math.hypot(e.x-ARC.x, e.y-ARC.y) + e.r > 221) return false;
  }
  const clear = (a, b, gap) => Math.hypot(a.x-b.x, a.y-b.y) >= a.r+b.r+gap;
  for(let i=0;i<bs.length;i++) for(let j=i+1;j<bs.length;j++)
    if(!clear(eff(bs[i]), eff(bs[j]), 24)) return false;
  for(const p of ps){
    if(p.x-p.r < 24 || p.x+p.r > 396) return false;
    if(Math.hypot(p.x-ARC.x, p.y-ARC.y) + p.r > 221) return false;
    for(const b of bs) if(!clear(p, eff(b), 24)) return false;
  }
  for(let i=0;i<ps.length;i++) for(let j=i+1;j<ps.length;j++) if(!clear(ps[i],ps[j],24)) return false;
  return true;
}

const R = (a,b)=> a + Math.random()*(b-a);
const P = a => a[Math.floor(Math.random()*a.length)];
function randomLayout(){
  const r = P([32,34,36,38,40,42,44]);
  const shape = P(['down','row','up','stack']);
  const half = R(70, 140);
  let bs;
  if(shape==='down'){ const yt=R(190,330), ys=yt+R(70,160);
    bs=[{hx:CX-half,hy:yt,r},{hx:CX,hy:ys,r},{hx:CX+half,hy:yt,r}]; }
  else if(shape==='up'){ const ys=R(290,430), yt=ys-R(70,150);
    bs=[{hx:CX-half,hy:ys,r},{hx:CX,hy:yt,r},{hx:CX+half,hy:ys,r}]; }
  else if(shape==='row'){ const y=R(190,420);
    bs=[{hx:CX-half,hy:y,r},{hx:CX,hy:y,r},{hx:CX+half,hy:y,r}]; }
  else { const y0=R(180,280), gap=R(2*r+30,140), dx=R(0,60);
    bs=[{hx:CX-dx,hy:y0,r},{hx:CX+dx,hy:y0+gap,r},{hx:CX-dx,hy:y0+2*gap,r}]; }
  const ps=[];
  if(P([0,1,1,1])){ const py=R(250,360), px=R(34,115), pr=P([12,14,16]);
    ps.push({x:px,y:py,r:pr},{x:420-px,y:py,r:pr}); }
  if(P([0,1])){ const py=R(420,530), px=R(48,115), pr=P([11,13,15]);
    ps.push({x:px,y:py,r:pr},{x:420-px,y:py,r:pr}); }
  bs.forEach((b,i)=>{ b.hx=Math.round(b.hx); b.hy=Math.round(b.hy);
                      b.ph = [0,1.7,0][i]; b.dir = i===2 ? -1 : 1; });
  ps.forEach(p=>{ p.x=Math.round(p.x); p.y=Math.round(p.y); });
  return {bumpers:bs, posts:ps, shape, move:{ax:P([6,10,14,18]), ay:P([4,8,12]), sp:P([0.45,0.55,0.7])}};
}

/* ---- 現在の index.html から配置を読む ---- */
function currentLayout(){
  const bumpers = [...src.matchAll(/\{hx:\s*(\d+),hy:(\d+),r:(\d+),\s*ph:([\d.]+),\s*dir:\s*(-?1)/g)]
    .map(m=>({hx:+m[1], hy:+m[2], r:+m[3], ph:+m[4], dir:+m[5]}));
  const posts = [...src.match(/const posts = \[([^;]+);/)[1]
    .matchAll(/\{x:(\d+),\s*y:(\d+),\s*r:(\d+)\}/g)]
    .map(m=>({x:+m[1], y:+m[2], r:+m[3]}));
  const mm = src.match(/const BUMP_MOVE = \{ax:(\d+), ?ay:(\d+), ?sp:([\d.]+)\}/);
  const move = {ax:+mm[1], ay:+mm[2], sp:+mm[3]};
  const kk = src.match(/const BUMP_KICK = (\d+), SLING_KICK = (\d+), POST_KICK = (\d+)/);
  return {bumpers, posts, move, bumpKick:+kk[1], slingKick:+kk[2], postKick:+kk[3]};
}

const f = (n,d=2)=> (+n).toFixed(d);
function report(name, m){
  console.log(
    name.padEnd(22),
    'score', f(score(m)),
    ' 分布', JSON.stringify(m.share).padStart(13),
    ' 均等さ', f(m.balance),
    ' 無得点球', f(m.zeroRate,3),
    ' 初打', (f(m.firstHit,1)+'s').padStart(5),
    ' 返球/球', f(m.returnsPerBall,1).padStart(5),
    ' 打返せた率', f(m.catchRate,2).padStart(5),
    ' 打/分', f(m.hitsPerMin,1).padStart(5),
    ' 寿命', (f(m.life,1)+'s').padStart(6),
    ' 上部', (f(m.topRate*100,0)+'%').padStart(4),
    ' 最長停滞', f(m.maxSlow,2)+'s');
}

module.exports = {evaluate, score, valid, randomLayout, currentLayout, BALLS};

if(require.main !== module) return;

const cmd = process.argv[2] || 'check';
if(cmd === 'check'){
  const L = currentLayout();
  console.log('いまの配置  バンパー', JSON.stringify(L.bumpers));
  console.log('            ピン    ', JSON.stringify(L.posts));
  report('index.html', evaluate(L));
} else if(cmd === 'search'){
  const n = +process.argv[3] || 100;
  const balls = +process.argv[4] || 60;
  const out = [];
  let made = 0;
  while(made < n){
    const L = randomLayout();
    if(!valid(L)) continue;
    made++;
    out.push({L, m:evaluate(L, balls)});
    if(made % 20 === 0) process.stderr.write(`  ${made}/${n}\n`);
  }
  out.sort((a,b)=>score(b.m)-score(a.m));
  console.log(`--- 上位10案（${n}案 × ${balls}球）---`);
  out.slice(0,10).forEach((e,i)=>{
    report('#'+(i+1)+' '+e.L.shape, e.m);
    console.log('    バンパー', JSON.stringify(e.L.bumpers.map(b=>({hx:b.hx,hy:b.hy,r:b.r}))),
                ' ピン', JSON.stringify(e.L.posts), ' 動き', JSON.stringify(e.L.move));
  });
  console.log('\n--- 比較：いまの index.html ---');
  report('index.html', evaluate(currentLayout(), balls));
} else {
  console.log('使い方: node tools/layout-sim.js [check|search] [案数] [球数]');
}
