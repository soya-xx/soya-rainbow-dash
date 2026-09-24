// 标题演示截图拼图：node shots.js [逻辑帧列表] [放大倍数] [输出 png]
const fs = require('fs'), zlib = require('zlib');
const load = require('./load');
const G = load();
const targets = (process.argv[2] || '60,117,127,243,370,380,395,500,621,771,800,880').split(',').map(Number);
const S = +(process.argv[3] || 2), COLS = +(process.argv[5] || 3), FW = G.W, FH = G.H;
const shots = [], seen = new Set();
for (let f = 0; f < 2000 && shots.length < targets.length; f++) {
  G.tickReal(); G.render();
  const lt = G.get().lastTick;
  if (G.get().warpT < 0 && targets.includes(lt) && !seen.has(lt)) { seen.add(lt); shots.push(Uint32Array.from(G.fb)); }
}
const n = shots.length, rows = Math.ceil(n / COLS), w = FW * S * COLS + (COLS - 1) * 4, hgt = FH * S * rows + (rows - 1) * 4;
const raw = Buffer.alloc((w * 3 + 1) * hgt, 0x40);
for (let y = 0; y < hgt; y++) raw[y * (w * 3 + 1)] = 0;
shots.forEach((fb, i) => {
  const cx = (i % COLS) * (FW * S + 4), cy = ((i / COLS) | 0) * (FH * S + 4);
  for (let y = 0; y < FH * S; y++) for (let x = 0; x < FW * S; x++) {
    const v = fb[((y / S) | 0) * FW + ((x / S) | 0)];
    const o = (cy + y) * (w * 3 + 1) + 1 + (cx + x) * 3;
    raw[o] = v & 255; raw[o + 1] = (v >> 8) & 255; raw[o + 2] = (v >> 16) & 255;
  }
});
function crc32(b) { let c, t = []; for (let k = 0; k < 256; k++) { c = k; for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[k] = c >>> 0; } let crc = -1; for (const x of b) crc = t[(crc ^ x) & 255] ^ (crc >>> 8); return (crc ^ -1) >>> 0; }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); }
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(hgt, 4); ihdr[8] = 8; ihdr[9] = 2;
const out = process.argv[4] || 'shots.png';
fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
console.log(out, n, 'shots');
