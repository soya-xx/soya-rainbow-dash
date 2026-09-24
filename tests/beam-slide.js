// 高位光束（攻击模式 3，以及夹击模式 8 的第二道）：站着不动必须被打中，扑地滑行必须能钻过去
const load = require('./load');
const G = load(src => src.replace('var api = {', `var api = { probe: function (s, pi, acts) {
  resetWorld(true); mode = GS_TITLE; setStage(s); seqArr[0] = pi; seqLen = 1; nextPatTick = 10;
  for (var k = 0; k < NA; k++) aStart[k] = -1;
  for (k = 0; k < acts.length; k++) { aType[k] = acts[k][0]; aStart[k] = 10 + acts[k][1]; aParam[k] = acts[k][2]; }
  var end = 10 + Math.round(PATTERNS[pi].len * curTS) + 50;
  while (tick < end) { step(true); if (fell) return -99; }
  return patMin[0];
},`));
let fail = 0;
for (const st of [0, 9]) {
  const idle = G.probe(st, 3, []);
  let best = -999, at = -1;
  for (const len of [25, 35, 45]) for (let t = 0; t <= 60; t++) { const s = G.probe(st, 3, [[4, t, len]]); if (s > best) { best = s; at = t + '/' + len; } }
  const ok = idle < 0 && best >= 0;
  if (!ok) fail++;
  console.log(`stage ${st + 1}: 站着不动 sep ${idle.toFixed(2)}（应 <0）| 只用滑行 best sep ${best.toFixed(2)} @起始/时长 ${at}（应 >=0）${ok ? '' : '  <-- FAIL'}`);
}
console.log(fail ? 'RESULT: FAIL' : 'RESULT: PASS');
process.exitCode = fail ? 1 : 0;
