// 游戏内界面截图：开局横幅、游玩中 HUD、死亡、Game Over、第 2 关横幅、暂停
const fs = require('fs'), zlib = require('zlib');
const load = require('./load');
const G = load(src => src.replace('var api = {', 'var api = { pause: function (v) { paused = v; },'));
const out = process.argv[2] || 'screens.png', S = +(process.argv[3] || 2);
const shots = [];
const snap = () => { G.render(); shots.push(Uint32Array.from(G.fb)); };
// 按演示时机玩到第 2 关
G.startGame();
const aStart = Array.from(G.aStart), types = [1, 5, 2, 4, 5, 1, 3], params = [0, 26, 15, 34, 34, 0, 0];
const want = new Set([30, 300, 640]); let f = 0, gotStage2 = false, gotDeath = false;
while (f < 5000) {
  const s = G.get(), t = s.tick; let j = 0, jh = 0, d = 0, ds = 0, dh = 0;
  if (s.stage === 0) for (let k = 0; k < 7; k++) { const st = aStart[k]; if (st < 0 || t < st) continue; const u = t - st, ty = types[k], p = params[k];
    if (ty === 1 || ty === 3) { if (u === 0) j = 1; if (u < 40) jh = 1; }
    else if (ty === 2) { if (u === 0 || u === p) j = 1; if (u < 40 + p) jh = 1; }
    else if (ty === 4) { if (u < p) d = 1; }
    else if (ty === 5) { if (u === 0) ds = 1; if (u < 6 + p) dh = 1; } }
  G.input(j, jh, d, ds, dh);
  G.tickReal(); f++;
  const s2 = G.get();
  if (s2.stage === 0 && want.has(s2.lastTick)) { want.delete(s2.lastTick); snap(); }
  if (!gotStage2 && s2.stage === 1 && s2.warpT < 0 && s2.lastTick > 20) { gotStage2 = true; snap(); G.pause(1); G.tickReal(); snap(); G.pause(0); }
  if (s2.mode === 2 && !gotDeath) { gotDeath = true; for (let i = 0; i < 12; i++) G.tickReal(); snap(); }
  if (s2.mode === 3 && s2.lastTick > 0) { for (let i = 0; i < 60; i++) G.tickReal(); snap(); break; }
}
const FW = G.W, FH = G.H, COLS = 2, n = shots.length, rows = Math.ceil(n / COLS), w = FW * S * COLS + (COLS - 1) * 4, hgt = FH * S * rows + (rows - 1) * 4;
const raw = Buffer.alloc((w * 3 + 1) * hgt, 0x40);
for (let y = 0; y < hgt; y++) raw[y * (w * 3 + 1)] = 0;
shots.forEach((fb, i) => {
  const cx = (i % COLS) * (FW * S + 4), cy = ((i / COLS) | 0) * (FH * S + 4);
  for (let y = 0; y < FH * S; y++) for (let x = 0; x < FW * S; x++) {
    const v = fb[((y / S) | 0) * FW + ((x / S) | 0)], o = (cy + y) * (w * 3 + 1) + 1 + (cx + x) * 3;
    raw[o] = v & 255; raw[o + 1] = (v >> 8) & 255; raw[o + 2] = (v >> 16) & 255;
  }
});
function crc32(b) { let c, t = []; for (let k = 0; k < 256; k++) { c = k; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[k] = c >>> 0; } let crc = -1; for (const x of b) crc = t[(crc ^ x) & 255] ^ (crc >>> 8); return (crc ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(hgt, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out, n, 'screens');
