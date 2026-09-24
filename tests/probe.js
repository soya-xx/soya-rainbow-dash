// 逐个攻击模式搜索躲法：在指定关卡（默认第 10 关，最快最密）下，单个动作或两个动作组合能否躲开
const load = require('./load');
const G = load(src => src.replace('var api = {', `var api = { probe: function (s, pi, acts) {
  resetWorld(true); mode = GS_TITLE; setStage(s); seqArr[0] = pi; seqLen = 1; nextPatTick = 10;
  for (var k = 0; k < NA; k++) aStart[k] = -1;
  for (k = 0; k < acts.length; k++) { aType[k] = acts[k][0]; aStart[k] = 10 + acts[k][1]; aParam[k] = acts[k][2]; }
  var end = 10 + Math.round(PATTERNS[pi].len * curTS) + 50;
  while (tick < end) { step(true); if (fell) return -99; }
  return patMin[0];
}, npat: function () { return NPAT; },`));
const J = 1, J2 = 2, SL = 4, DA = 5;
const variants = [[J, 0], [J2, 6], [J2, 10], [J2, 14], [J2, 18], [J2, 22], [SL, 15], [SL, 25], [SL, 35], [SL, 45], [DA, 8], [DA, 20], [DA, 34]];
const name = v => ({1: 'JUMP', 2: 'JUMP2', 4: 'SLIDE', 5: 'DASH'})[v[0]] + (v[1] ? '(' + v[1] + ')' : '');
const stage = +(process.argv[2] || 9);
let fail = 0;
for (let pi = 0; pi < G.npat(); pi++) {
  let best = null, bestS = -999;
  for (const v of variants) for (let t = 0; t <= 120; t++) {
    const s = G.probe(stage, pi, [[v[0], t, v[1]]]);
    if (s > bestS) { bestS = s; best = name(v) + '@' + t; }
  }
  let pairInfo = '', ok = bestS >= 0;
  if (bestS < 0) {
    let pb = null, pbS = -999;
    for (const v1 of variants) for (const v2 of variants) for (let t1 = 0; t1 <= 110; t1 += 3) for (let t2 = t1 + 4; t2 <= 120; t2 += 3) {
      const s = G.probe(stage, pi, [[v1[0], t1, v1[1]], [v2[0], t2, v2[1]]]);
      if (s > pbS) { pbS = s; pb = name(v1) + '@' + t1 + ' + ' + name(v2) + '@' + t2; }
      if (pbS >= 1) break;
    }
    pairInfo = ` | pair best sep ${pbS.toFixed(2)} via ${pb}`;
    ok = pbS >= 0;
  }
  if (!ok) fail++;
  console.log(`stage ${stage + 1} pattern ${pi}: single best sep ${bestS.toFixed(2)} via ${best}${pairInfo}${ok ? '' : '  <-- 无解'}`);
}
console.log(fail ? `RESULT: FAIL (${fail} 种攻击无解)` : 'RESULT: PASS');
process.exitCode = fail ? 1 : 0;
