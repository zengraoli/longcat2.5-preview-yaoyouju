/**
 * 生成本地图标 PNG（24x24 网格，2 倍输出 48x48）。
 * 用法：node scripts/gen-icons.js
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 48; // 输出边长
const GRID = 24; // 逻辑网格
const SCALE = SIZE / GRID;

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function writePng(file, pixels /* SIZE*SIZE rgba buffer */) {
  const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    pixels.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0);
  ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8bit RGBA
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

function hexColor(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function drawIcon(colorHex, primitives) {
  const img = Buffer.alloc(SIZE * SIZE * 4);
  const [r, g, b] = hexColor(colorHex);
  const px = (x, y, a) => {
    const gx = Math.round((x + 0.5) * SCALE - 0.5);
    const gy = Math.round((y + 0.5) * SCALE - 0.5);
    for (let dy = 0; dy < SCALE; dy++) {
      for (let dx = 0; dx < SCALE; dx++) {
        const X = gx + dx, Y = gy + dy;
        if (X < 0 || Y < 0 || X >= SIZE || Y >= SIZE) continue;
        const i = (Y * SIZE + X) * 4;
        img[i] = r; img[i + 1] = g; img[i + 2] = b; img[i + 3] = Math.round(a * 255);
      }
    }
  };
  const line = (x1, y1, x2, y2, w = 2) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const steps = Math.max(1, Math.ceil(len * 2));
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
      for (let oy = -w / 2; oy < w / 2; oy++) for (let ox = -w / 2; ox < w / 2; ox++) {
        if (ox * ox + oy * oy <= (w / 2) * (w / 2)) px(x + ox, y + oy, 1);
      }
    }
  };
  const circle = (cx, cy, rad, w = 2) => {
    const steps = Math.max(16, Math.ceil(rad * 8));
    for (let i = 0; i < steps; i++) {
      const a1 = (i / steps) * Math.PI * 2;
      const a2 = ((i + 1) / steps) * Math.PI * 2;
      line(cx + Math.cos(a1) * rad, cy + Math.sin(a1) * rad, cx + Math.cos(a2) * rad, cy + Math.sin(a2) * rad, w);
    }
  };
  const dot = (cx, cy, rad) => {
    for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
      if (x * x + y * y <= rad * rad) px(cx + x, cy + y, 1);
    }
  };
  const poly = (pts, close = false, w = 2) => {
    for (let i = 0; i < pts.length - 1; i++) line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w);
    if (close) line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], w);
  };
  const fillPoly = (pts) => {
    const ys = pts.map((p) => p[1]);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % pts.length];
        if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
          xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        for (let x = Math.round(xs[i]); x <= Math.round(xs[i + 1]); x++) px(x, y, 1);
      }
    }
  };
  const arc = (cx, cy, rad, a1, a2, w = 2) => {
    const steps = Math.max(8, Math.ceil(Math.abs(a2 - a1) * rad));
    for (let i = 0; i < steps; i++) {
      const t1 = a1 + ((a2 - a1) * i) / steps;
      const t2 = a1 + ((a2 - a1) * (i + 1)) / steps;
      line(cx + Math.cos(t1) * rad, cy + Math.sin(t1) * rad, cx + Math.cos(t2) * rad, cy + Math.sin(t2) * rad, w);
    }
  };

  for (const p of primitives) {
    if (p.t === 'line') line(p.x1, p.y1, p.x2, p.y2, p.w || 2);
    else if (p.t === 'poly') poly(p.pts, p.close, p.w || 2);
    else if (p.t === 'circle') circle(p.cx, p.cy, p.r, p.w || 2);
    else if (p.t === 'dot') dot(p.cx, p.cy, p.r);
    else if (p.t === 'arc') arc(p.cx, p.cy, p.r, p.a1, p.a2, p.w || 2);
    else if (p.t === 'fillPoly') fillPoly(p.pts);
  }
  return img;
}

const ICONS = {
  // ---- 底部 Tab（普通 / 选中由调用方换色）----
  home: [
    { t: 'poly', pts: [[4, 11], [12, 4], [20, 11]], w: 2 },
    { t: 'line', x1: 6.5, y1: 9.5, x2: 6.5, y2: 19.5, w: 2 },
    { t: 'line', x1: 17.5, y1: 9.5, x2: 17.5, y2: 19.5, w: 2 },
    { t: 'line', x1: 6.5, y1: 19.5, x2: 17.5, y2: 19.5, w: 2 },
  ],
  chat: [
    { t: 'arc', cx: 15, cy: 6, r: 5.5, a1: -Math.PI / 2, a2: Math.PI / 2, w: 2 },
    { t: 'line', x1: 4, y1: 6, x2: 15, y2: 6, w: 2 },
    { t: 'arc', cx: 6, cy: 12, r: 6, a1: Math.PI / 2, a2: Math.PI, w: 2 },
    { t: 'line', x1: 4, y1: 18, x2: 6, y2: 18, w: 2 },
    { t: 'arc', cx: 10, cy: 18, r: 4, a1: Math.PI, a2: Math.PI / 2, w: 2 },
    { t: 'line', x1: 14, y1: 18, x2: 19, y2: 18, w: 2 },
    { t: 'arc', cx: 19, cy: 13, r: 5, a1: Math.PI / 2, a2: 0, w: 2 },
  ],
  pulse: [
    { t: 'poly', pts: [[3, 12], [8, 12], [10, 6], [13, 18], [15, 12], [21, 12]], w: 2 },
  ],
  doc: [
    { t: 'line', x1: 6.5, y1: 4, x2: 17.5, y2: 4, w: 2 },
    { t: 'line', x1: 6.5, y1: 4, x2: 6.5, y2: 20, w: 2 },
    { t: 'line', x1: 6.5, y1: 20, x2: 17.5, y2: 20, w: 2 },
    { t: 'line', x1: 17.5, y1: 4, x2: 17.5, y2: 20, w: 2 },
    { t: 'line', x1: 9.5, y1: 9, x2: 14.5, y2: 9, w: 1.6 },
    { t: 'line', x1: 9.5, y1: 12.5, x2: 14.5, y2: 12.5, w: 1.6 },
    { t: 'line', x1: 9.5, y1: 16, x2: 13, y2: 16, w: 1.6 },
  ],
  person: [
    { t: 'circle', cx: 12, cy: 8, r: 3.6, w: 2 },
    { t: 'arc', cx: 12, cy: 21.5, r: 6.5, a1: Math.PI, a2: 0, w: 2 },
    { t: 'line', x1: 5.5, y1: 21.5, x2: 18.5, y2: 21.5, w: 2 },
  ],
  // ---- 功能图标 ----
  pen: [
    { t: 'line', x1: 5, y1: 19, x2: 13, y2: 11, w: 3 },
    { t: 'line', x1: 13, y1: 11, x2: 18, y2: 16, w: 1.6 },
    { t: 'line', x1: 4, y1: 20, x2: 6, y2: 18, w: 1.6 },
  ],
  upload: [
    { t: 'line', x1: 12, y1: 15, x2: 12, y2: 6, w: 2 },
    { t: 'poly', pts: [[8, 10], [12, 6], [16, 10]], w: 2 },
    { t: 'line', x1: 5, y1: 16, x2: 5, y2: 20, w: 2 },
    { t: 'line', x1: 5, y1: 20, x2: 19, y2: 20, w: 2 },
    { t: 'line', x1: 19, y1: 16, x2: 19, y2: 20, w: 2 },
  ],
  play: [
    { t: 'fillPoly', pts: [[7, 6], [7, 18], [20, 12]] },
  ],
  info: [
    { t: 'circle', cx: 12, cy: 12, r: 8, w: 2 },
    { t: 'dot', cx: 12, cy: 8.5, r: 1.3 },
    { t: 'line', x1: 12, y1: 12, x2: 12, y2: 16.5, w: 2 },
  ],
  warn: [
    { t: 'poly', pts: [[12, 4], [20, 18.5], [4, 18.5]], close: true, w: 2 },
    { t: 'line', x1: 12, y1: 9.5, x2: 12, y2: 13.5, w: 2 },
    { t: 'dot', cx: 12, cy: 16, r: 1.1 },
  ],
  error: [
    { t: 'circle', cx: 12, cy: 12, r: 8, w: 2 },
    { t: 'line', x1: 8.5, y1: 8.5, x2: 15.5, y2: 15.5, w: 2 },
    { t: 'line', x1: 15.5, y1: 8.5, x2: 8.5, y2: 15.5, w: 2 },
  ],
  check: [
    { t: 'poly', pts: [[5, 12.5], [10, 17.5], [19, 6.5]], w: 2 },
  ],
  calendar: [
    { t: 'line', x1: 4.5, y1: 6.5, x2: 19.5, y2: 6.5, w: 2 },
    { t: 'line', x1: 4.5, y1: 6.5, x2: 4.5, y2: 19.5, w: 2 },
    { t: 'line', x1: 4.5, y1: 19.5, x2: 19.5, y2: 19.5, w: 2 },
    { t: 'line', x1: 19.5, y1: 6.5, x2: 19.5, y2: 19.5, w: 2 },
    { t: 'line', x1: 4.5, y1: 10.5, x2: 19.5, y2: 10.5, w: 2 },
    { t: 'line', x1: 8, y1: 3.5, x2: 8, y2: 7, w: 2 },
    { t: 'line', x1: 16, y1: 3.5, x2: 16, y2: 7, w: 2 },
  ],
  search: [
    { t: 'circle', cx: 10.5, cy: 10.5, r: 6, w: 2 },
    { t: 'line', x1: 15, y1: 15, x2: 20, y2: 20, w: 2 },
  ],
  share: [
    { t: 'circle', cx: 6, cy: 12, r: 2.2, w: 2 },
    { t: 'circle', cx: 17, cy: 6, r: 2.2, w: 2 },
    { t: 'circle', cx: 17, cy: 18, r: 2.2, w: 2 },
    { t: 'line', x1: 8, y1: 11, x2: 15, y2: 7, w: 2 },
    { t: 'line', x1: 8, y1: 13, x2: 15, y2: 17, w: 2 },
  ],
  gear: [
    { t: 'circle', cx: 12, cy: 12, r: 3.2, w: 2 },
    ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
      const r = (a * Math.PI) / 180;
      return { t: 'line', x1: 12 + Math.cos(r) * 5.5, y1: 12 + Math.sin(r) * 5.5, x2: 12 + Math.cos(r) * 8.5, y2: 12 + Math.sin(r) * 8.5, w: 2.6 };
    }),
  ],
  shield: [
    { t: 'poly', pts: [[12, 3.5], [18.5, 6], [18.5, 12.5], [12, 20.5], [5.5, 12.5], [5.5, 6]], close: true, w: 2 },
    { t: 'poly', pts: [[9, 11.5], [11, 13.5], [15, 9.5]], w: 2 },
  ],
  download: [
    { t: 'line', x1: 12, y1: 5, x2: 12, y2: 14, w: 2 },
    { t: 'poly', pts: [[8, 10], [12, 14], [16, 10]], w: 2 },
    { t: 'line', x1: 5, y1: 16, x2: 5, y2: 20, w: 2 },
    { t: 'line', x1: 5, y1: 20, x2: 19, y2: 20, w: 2 },
    { t: 'line', x1: 19, y1: 16, x2: 19, y2: 20, w: 2 },
  ],
  trash: [
    { t: 'line', x1: 4, y1: 5, x2: 20, y2: 5, w: 2 },
    { t: 'line', x1: 10, y1: 3, x2: 14, y2: 3, w: 2 },
    { t: 'line', x1: 6.5, y1: 7, x2: 6.5, y2: 19.5, w: 2 },
    { t: 'line', x1: 6.5, y1: 19.5, x2: 17.5, y2: 19.5, w: 2 },
    { t: 'line', x1: 17.5, y1: 19.5, x2: 17.5, y2: 7, w: 2 },
    { t: 'line', x1: 17.5, y1: 7, x2: 14, y2: 7, w: 2 },
    { t: 'line', x1: 10, y1: 10, x2: 10, y2: 16.5, w: 1.6 },
    { t: 'line', x1: 14, y1: 10, x2: 14, y2: 16.5, w: 1.6 },
  ],
  bell: [
    { t: 'arc', cx: 12, cy: 8.5, r: 5.5, a1: Math.PI * 0.75, a2: Math.PI * 2.25, w: 2 },
    { t: 'line', x1: 5.2, y1: 17.5, x2: 18.8, y2: 17.5, w: 2 },
    { t: 'circle', cx: 12, cy: 19.8, r: 1.6, w: 2 },
  ],
  clock: [
    { t: 'circle', cx: 12, cy: 12, r: 8, w: 2 },
    { t: 'line', x1: 12, y1: 12, x2: 12, y2: 7.5, w: 2 },
    { t: 'line', x1: 12, y1: 12, x2: 15.5, y2: 13.5, w: 2 },
  ],
  close: [
    { t: 'line', x1: 6, y1: 6, x2: 18, y2: 18, w: 2 },
    { t: 'line', x1: 18, y1: 6, x2: 6, y2: 18, w: 2 },
  ],
  chevron_left: [
    { t: 'poly', pts: [[14, 5], [8, 12], [14, 19]], w: 2 },
  ],
  plus: [
    { t: 'line', x1: 12, y1: 5.5, x2: 12, y2: 18.5, w: 2 },
    { t: 'line', x1: 5.5, y1: 12, x2: 18.5, y2: 12, w: 2 },
  ],
  image: [
    { t: 'line', x1: 4.5, y1: 5.5, x2: 19.5, y2: 5.5, w: 2 },
    { t: 'line', x1: 4.5, y1: 5.5, x2: 4.5, y2: 18.5, w: 2 },
    { t: 'line', x1: 4.5, y1: 18.5, x2: 19.5, y2: 18.5, w: 2 },
    { t: 'line', x1: 19.5, y1: 5.5, x2: 19.5, y2: 18.5, w: 2 },
    { t: 'circle', cx: 9, cy: 10, r: 1.6, w: 1.6 },
    { t: 'poly', pts: [[6, 17], [10.5, 12.5], [13.5, 15], [15.5, 13], [18, 15.5]], w: 1.6 },
  ],
  logout: [
    { t: 'line', x1: 4, y1: 10, x2: 4, y2: 20, w: 2 },
    { t: 'line', x1: 4, y1: 10, x2: 12, y2: 10, w: 2 },
    { t: 'line', x1: 4, y1: 20, x2: 12, y2: 20, w: 2 },
    { t: 'line', x1: 9.5, y1: 15, x2: 19, y2: 15, w: 2 },
    { t: 'poly', pts: [[15.5, 11.5], [19, 15], [15.5, 18.5]], w: 2 },
  ],
  more: [
    { t: 'dot', cx: 5, cy: 12, r: 1.4 },
    { t: 'dot', cx: 12, cy: 12, r: 1.4 },
    { t: 'dot', cx: 19, cy: 12, r: 1.4 },
  ],
  edit: [
    { t: 'line', x1: 5, y1: 19, x2: 13, y1: 11, w: 3 },
    { t: 'line', x1: 13, y1: 11, x2: 18, y2: 16, w: 1.6 },
    { t: 'line', x1: 11, y1: 13, x2: 15, y2: 17, w: 1.6 },
  ],
  heart: [
    { t: 'fillPoly', pts: [[12, 20], [4.5, 12.5], [5, 7.5], [8, 5], [11, 7.5], [12, 9.5], [13, 7.5], [16, 5], [19, 7.5], [19.5, 12.5]] },
  ],
  send: [
    { t: 'poly', pts: [[4, 12], [20, 4], [13, 20], [10.5, 14.5]], close: true, w: 2 },
    { t: 'line', x1: 10.5, y1: 14.5, x2: 20, y2: 4, w: 2 },
  ],
  flag: [
    { t: 'line', x1: 7, y1: 4, x2: 7, y2: 20, w: 2 },
    { t: 'poly', pts: [[7, 4.5], [18, 4.5], [15.5, 9], [18, 13.5], [7, 13.5]], w: 2 },
  ],
  pin: [
    { t: 'poly', pts: [[12, 3], [18, 9], [12, 21], [6, 9]], close: true, w: 2 },
    { t: 'circle', cx: 12, cy: 9.5, r: 2.6, w: 1.8 },
  ],
  wifi_off: [
    { t: 'arc', cx: 12, cy: 13, r: 3.6, a1: Math.PI * 0.7, a2: Math.PI * 2.3, w: 2 },
    { t: 'arc', cx: 12, cy: 13, r: 7, a1: Math.PI * 0.7, a2: Math.PI * 2.3, w: 2 },
    { t: 'arc', cx: 12, cy: 13, r: 11, a1: Math.PI * 0.7, a2: Math.PI * 2.3, w: 2 },
    { t: 'dot', cx: 12, cy: 20, r: 1.4 },
    { t: 'line', x1: 5.5, y1: 19.5, x2: 18.5, y2: 5.5, w: 2.4 },
  ],
  person: [
    { t: 'circle', cx: 12, cy: 8, r: 3.6, w: 2 },
    { t: 'arc', cx: 12, cy: 21.5, r: 6.5, a1: Math.PI, a2: 0, w: 2 },
    { t: 'line', x1: 5.5, y1: 21.5, x2: 18.5, y2: 21.5, w: 2 },
  ],
};

const outDir = path.join(__dirname, '..', 'src', 'static', 'icons');
fs.mkdirSync(outDir, { recursive: true });

const COLORS = {
  normal: '#98A1AE',
  active: '#0F6E74',
  primary: '#0F6E74',
  info: '#2F6FD8',
  warn: '#C77700',
  error: '#D93B3B',
  ok: '#1E9E5A',
};

const jobs = [];
// Tab 图标：普通 + 选中
for (const key of ['home', 'chat', 'pulse', 'doc', 'person']) {
  jobs.push([`tab_${key}.png`, key, COLORS.normal]);
  jobs.push([`tab_${key}_active.png`, key, COLORS.active]);
}
// 功能图标（固定颜色）
const fixed = {
  pen: 'primary', upload: 'primary', play: 'primary', info: 'info', warn: 'warn',
  heart: 'error', send: 'primary', flag: 'error', doc: 'primary', pulse: 'primary', chat: 'primary',
  pin: 'primary', person: 'primary', wifi_off: 'warn',
  error: 'error', check: 'ok', calendar: 'primary', search: 'primary', share: 'primary',
  gear: 'normal', shield: 'primary', download: 'normal', trash: 'error', bell: 'normal',
  clock: 'normal', close: 'normal', chevron_left: 'normal', plus: 'normal', image: 'primary',
  logout: 'normal', more: 'normal', edit: 'primary',
};
for (const [name, color] of Object.entries(fixed)) {
  jobs.push([`ic_${name}.png`, name, COLORS[color]]);
}

for (const [file, icon, color] of jobs) {
  writePng(path.join(outDir, file), drawIcon(color, ICONS[icon]));
}
console.log(`generated ${jobs.length} icons -> ${outDir}`);
