// 基本回归：标题演示、不操作会死、按演示时机能过第 1 关
const load = require('./load');
let t0 = Date.now();
const G = load();
console.log('init+solve ms', Date.now() - t0);
const rep = G.report.map(r => [r.start, r.ok, +(+r.sep).toFixed(2)]);
console.log('autopilot', JSON.stringify(rep));
let fail = 0;
if (G.report.some(r => !r.ok)) { console.log('FAIL: 自动演示有动作找不到安全时机'); fail++; }
// 1) 标题演示连跑两轮，必须一直活着
let wraps = 0, prev = 0;
for (let f = 0; f < 2400; f++) { G.tickReal(); G.render(); const s = G.get(); if (s.tick < prev) wraps++; prev = s.tick; if (!s.alive) break; }
const ts = G.get();
console.log('title: wraps', wraps, 'mode', ts.mode, 'alive', ts.alive);
if (wraps < 2 || !ts.alive) { console.log('FAIL: 标题演示没有连续跑完两轮'); fail++; }
// 2) 开局什么都不按，应在第一颗陨石处死亡并进入 Game Over
G.startGame();
let f = 0; while (G.get().mode === 1 && f < 3000) { G.tickReal(); G.render(); f++; }
console.log('idle play: died at tick', G.get().lastTick, 'mode', G.get().mode, 'score', Math.floor(G.get().score));
for (let i = 0; i < 120; i++) { G.tickReal(); G.render(); }
console.log('after 120 frames mode', G.get().mode, '(3 = game over)');
if (G.get().mode !== 3) { console.log('FAIL: 不操作没有进入 Game Over'); fail++; }
// 3) 按自动演示的时机输入，应通过第 1 关进入第 2 关
G.startGame();
const aStart = Array.from(G.aStart), types = [1, 5, 2, 4, 5, 1, 3], params = [0, 26, 15, 34, 34, 0, 0];
let maxStage = 0; f = 0;
while (f < 4000 && G.get().mode === 1) {
  const t = G.get().tick; let j = 0, jh = 0, d = 0, ds = 0, dh = 0;
  if (G.get().stage === 0) for (let k = 0; k < 7; k++) { const s = aStart[k]; if (s < 0 || t < s) continue; const u = t - s, ty = types[k], p = params[k];
    if (ty === 1 || ty === 3) { if (u === 0) j = 1; if (u < 40) jh = 1; }
    else if (ty === 2) { if (u === 0 || u === p) j = 1; if (u < 40 + p) jh = 1; }
    else if (ty === 4) { if (u < p) d = 1; }
    else if (ty === 5) { if (u === 0) ds = 1; if (u < 6 + p) dh = 1; } }
  G.input(j, jh, d, ds, dh);
  G.tickReal(); G.render(); f++;
  maxStage = Math.max(maxStage, G.get().stage);
}
const s = G.get();
console.log('scripted play: reached stage', maxStage + 1, 'mode', s.mode, 'alive', s.alive, 'tick', s.lastTick, 'score', Math.floor(s.score));
if (maxStage < 1) { console.log('FAIL: 按演示时机没能进入第 2 关'); fail++; }
console.log(fail ? `RESULT: FAIL (${fail})` : 'RESULT: PASS');
process.exitCode = fail ? 1 : 0;
