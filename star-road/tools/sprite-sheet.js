/* まなびスターロード - ドット絵の かくにん よう
 *
 *   node tools/sprite-sheet.js            # ぜんぶを 1まいの PNGに ならべる
 *   node tools/sprite-sheet.js slime inu  # なまえを していすると そこだけ
 *   SCALE=8 node tools/sprite-sheet.js    # おおきさを かえる
 *   node tools/sprite-sheet.js --out docs/sprites.png
 *
 * ブラウザも ライブラリも つかわず PNGを かきだすので、
 * ドットを なおす → すぐ みる、を くりかえせます。
 */
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

global.window = global;
require(path.resolve(__dirname, '..', 'js', 'sprites.js'));

const SCALE = parseInt(process.env.SCALE || '6', 10);
const PAD = 6;
const BG = [24, 18, 38, 255];
const GRID = [46, 40, 68, 255];

function hex(c) {
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), 255];
}

function crc32(buf) {
  let c, table = crc32.t;
  if (!table) {
    table = crc32.t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function writePng(file, w, h, px) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    px.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]));
}

const argv = process.argv.slice(2);
const names = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--out');
const ids = names.length ? names : Object.keys(Sprites.SPRITES);
const cell = 32 * SCALE + PAD * 2;
const cols = Math.min(ids.length, 6);
const rows = Math.ceil(ids.length / cols);
const W = cols * cell, H = rows * cell;
const px = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) px.set(BG, i * 4);
// ますめの せん
for (let r = 0; r <= rows; r++) for (let x = 0; x < W; x++) {
  const y = Math.min(H - 1, r * cell); px.set(GRID, (y * W + x) * 4);
}
for (let c = 0; c <= cols; c++) for (let y = 0; y < H; y++) {
  const x = Math.min(W - 1, c * cell); px.set(GRID, (y * W + x) * 4);
}

ids.forEach((id, i) => {
  const sp = Sprites.get(id);
  if (!sp) { console.log('しらない スプライト: ' + id); return; }
  const cx = (i % cols) * cell, cy = Math.floor(i / cols) * cell;
  const ox = cx + Math.round((cell - sp.w * SCALE) / 2);
  const oy = cy + Math.round((cell - sp.h * SCALE) / 2);
  for (let y = 0; y < sp.h; y++) for (let x = 0; x < sp.w; x++) {
    const col = Sprites.PAL[sp.rows[y][x]];
    if (!col) continue;
    const rgba = hex(col);
    for (let dy = 0; dy < SCALE; dy++) for (let dx = 0; dx < SCALE; dx++) {
      const X = ox + x * SCALE + dx, Y = oy + y * SCALE + dy;
      if (X >= 0 && X < W && Y >= 0 && Y < H) px.set(rgba, (Y * W + X) * 4);
    }
  }
});

const oi = process.argv.indexOf('--out');
const out = oi >= 0 && process.argv[oi + 1]
  ? path.resolve(process.cwd(), process.argv[oi + 1])
  : path.resolve(__dirname, '..', '.shots', 'sprites.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
writePng(out, W, H, px);
console.log(`${ids.length}まい → ${out}  (${W}×${H})`);
console.log('ならび：');
ids.forEach((id, i) => process.stdout.write(id + ((i % cols === cols - 1) ? '\n' : '  ')));
