// 角色特写：node crops.js 逻辑帧列表 放大倍数 输出.png [开局模式 play]
const fs = require('fs'), zlib = require('zlib');
const load = require('./load');
const G = load();
const targets = (process.argv[2] || '60,117,127').split(',').map(Number);
const S = +(process.argv[3] || 5), out = process.argv[4] || "crops.png", CW = +(process.env.CW || 96), CH = +(process.env.CH || 72), COLS = +(process.env.COLS || 6);
if (process.argv[5] === 'play') G.startGame();
const shots = [], seen = new Set();
for (let f = 0; f < 3000 && shots.length < targets.length; f++) {
  if (process.argv[5] === 'play') G.input(0, 0, 0, 0, 0);
  G.tickReal(); G.render();
  const s = G.get(), lt = s.lastTick;
  if (s.warpT < 0 && targets.includes(lt) && !seen.has(lt)) {
    seen.add(lt);
    // 以角色为中心裁剪（画面坐标 = 逻辑坐标 * R - 相机）
    const fb = Uint32Array.from(G.fb), cx = Math.round(s.anchorX * G.R) - 4, cy = Math.round(s.anchorY * G.R) - 20;
    shots.push({ fb, x0: Math.max(0, Math.min(G.W - CW, cx - CW / 2)), y0: Math.max(0, Math.min(G.H - CH, cy - CH / 2)) });
  }
}
const n = shots.length, rows = Math.ceil(n / COLS), w = CW * S * COLS + (COLS - 1) * 4, hgt = CH * S * rows + (rows - 1) * 4;
const raw = Buffer.alloc((w * 3 + 1) * hgt, 0x40);
for (let y = 0; y < hgt; y++) raw[y * (w * 3 + 1)] = 0;
shots.forEach((sh, i) => {
  const ox = (i % COLS) * (CW * S + 4), oy = ((i / COLS) | 0) * (CH * S + 4);
  for (let y = 0; y < CH * S; y++) for (let x = 0; x < CW * S; x++) {
    const v = sh.fb[(sh.y0 + ((y / S) | 0)) * G.W + sh.x0 + ((x / S) | 0)];
    const o = (oy + y) * (w * 3 + 1) + 1 + (ox + x) * 3;
    raw[o] = v & 255; raw[o + 1] = (v >> 8) & 255; raw[o + 2] = (v >> 16) & 255;
  }
});
function crc32(b) { let c, t = []; for (let k = 0; k < 256; k++) { c = k; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[k] = c >>> 0; } let crc = -1; for (const x of b) crc = t[(crc ^ x) & 255] ^ (crc >>> 8); return (crc ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(hgt, 4); ihdr[8] = 8; ihdr[9] = 2;
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out, n, 'crops');
