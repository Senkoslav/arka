// Подготовка поз гида (фирменный персонаж) для components/Tour.tsx.
//
//   node scripts/guide-poses.mjs wave=путь.png present=путь.png ...
//
// На входе — PNG 1024×1536 с уже вырезанным фоном. На выходе — public/img/guide-<имя>.webp.
// Все позы ложатся на один холст с одинаковым масштабом: ступни на одной линии, ось ног —
// в одной точке. Поэтому при смене позы девушка не прыгает, а меняет только жест.
// Позы зеркалятся, чтобы гид справа указывал внутрь экрана — на зал и окна;
// брошь-логотип после зеркалирования возвращается в прямое положение.

import sharp from 'sharp';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MIRROR = true;
// Холст в пикселях исходника: ось ног — на AX, нижний край ступней — на FEET.
// Запас слева — под вытянутую руку (после зеркалирования), справа — под поднятую ладонь.
const CW = 775, CH = 1524, AX = 485, FEET = 1518;
const OUT_H = 1200; // ≈ 2× от максимальной высоты гида на экране

const args = process.argv.slice(2);
if (!args.length) {
  console.error('Пример: node scripts/guide-poses.mjs tablet=~/Downloads/поза.png');
  process.exit(1);
}

for (const arg of args) {
  const eq = arg.indexOf('=');
  const name = arg.slice(0, eq);
  const file = arg.slice(eq + 1).replace(/^~(?=\/)/, os.homedir());
  if (eq < 1 || !/^[a-z0-9-]+$/.test(name)) throw new Error(`Ожидается имя=путь, получено: ${arg}`);

  const { data: src, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (x, y) => (y * w + x) * 4;
  const solid = (x, y) => src[px(x, y) + 3] > 128;

  // Рост: первая и последняя строка с непрозрачными пикселями
  let top = -1, bottom = -1;
  for (let y = 0; y < h && top < 0; y++) for (let x = 0; x < w; x++) if (solid(x, y)) { top = y; break; }
  for (let y = h - 1; y >= 0 && bottom < 0; y--) for (let x = 0; x < w; x++) if (solid(x, y)) { bottom = y; break; }
  if (top < 0) throw new Error(`${file}: изображение пустое — фон должен быть прозрачным`);
  const tall = bottom - top;

  // Ось тела — середина ног (ниже кистей рук, которые на уровне пояса)
  let axisSum = 0, rows = 0;
  for (let y = Math.round(top + tall * 0.6); y < top + tall * 0.92; y++) {
    let l = -1, r = -1;
    for (let x = 0; x < w; x++) if (solid(x, y)) { if (l < 0) l = x; r = x; }
    if (l >= 0) { axisSum += (l + r) / 2; rows++; }
  }
  if (!rows) throw new Error(`${file}: не найдены ноги — нужна фигура в полный рост`);
  const axis = axisSum / rows;

  // Брошь — золотые пиксели на левом лацкане (справа от оси в исходнике).
  // Золото отличаем от кожи по G/R: у золота ≈ 0.85, у кожи ≈ 0.7.
  const gold = [];
  for (let y = Math.round(top + tall * 0.17); y < top + tall * 0.3; y++) {
    for (let x = Math.round(axis + 20); x < Math.min(axis + 150, w); x++) {
      const i = px(x, y), R = src[i], G = src[i + 1], B = src[i + 2];
      if (src[i + 3] > 200 && R > 150 && G > R * 0.75 && B < G * 0.8 && R - B > 50) gold.push([x, y]);
    }
  }
  // Отсекаем случайные пиксели кожи на шее: оставляем только кластер вокруг медианы
  const median = k => gold.map(p => p[k]).sort((a, b) => a - b)[gold.length >> 1];
  const mx = median(0), my = median(1);
  const core = gold.filter(([x, y]) => Math.abs(x - mx) < 30 && Math.abs(y - my) < 30);
  let bx0 = w, bx1 = -1, by0 = h, by1 = -1;
  for (const [x, y] of core) { bx0 = Math.min(bx0, x); bx1 = Math.max(bx1, x); by0 = Math.min(by0, y); by1 = Math.max(by1, y); }
  const brooch = core.length > 30;
  if (brooch) { bx0 -= 4; bx1 += 4; by0 -= 4; by1 += 4; }
  else console.warn(`${name}: брошь не найдена — останется как есть`);

  // Перенос на общий холст (с зеркалированием)
  const ax = MIRROR ? w - 1 - axis : axis;
  const offX = Math.round(ax - AX), offY = bottom - FEET;
  const out = Buffer.alloc(CW * CH * 4);
  let clipped = 0;
  for (let y = 0; y < CH; y++) {
    const sy = y + offY;
    if (sy < 0 || sy >= h) continue;
    for (let x = 0; x < CW; x++) {
      const fx = x + offX; // координата в (зеркальном) исходнике
      if (fx < 0 || fx >= w) continue;
      let sx = MIRROR ? w - 1 - fx : fx;
      // Внутри броши берём пиксели без зеркалирования, чтобы «123» читалось
      if (MIRROR && brooch && sy >= by0 && sy <= by1 && sx >= bx0 && sx <= bx1) sx = bx0 + bx1 - sx;
      src.copy(out, (y * CW + x) * 4, px(sx, sy), px(sx, sy) + 4);
    }
  }
  // Проверка, что рука не обрезана краем холста
  for (let y = top; y <= bottom; y++) for (let x = 0; x < w; x++) {
    if (!solid(x, y)) continue;
    const cx = (MIRROR ? w - 1 - x : x) - offX, cy = y - offY;
    if (cx < 0 || cx >= CW || cy < 0 || cy >= CH) clipped++;
  }
  if (clipped) console.warn(`${name}: ${clipped} px фигуры не поместились на холст — увеличьте CW/AX`);

  const dest = path.join(ROOT, 'public', 'img', `guide-${name}.webp`);
  const res = await sharp(out, { raw: { width: CW, height: CH, channels: 4 } })
    .resize({ height: OUT_H })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(dest);
  console.log(`${dest}: ${res.width}×${res.height}, ${Math.round(res.size / 1024)} КБ · рост ${tall}px, ось ${Math.round(axis)}, брошь ${brooch ? `${bx0}–${bx1}×${by0}–${by1}` : '—'}`);
}
