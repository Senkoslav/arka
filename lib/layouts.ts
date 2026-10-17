// Рассадки зала. Чистые функции без three.js — их можно импортировать и на сервере
// (например, чтобы вывести вместимость), и в 3D-сцене.

export const ROOM = { W: 13.7, D: 9.0, H: 4.5 } as const;
/** Колонны (центры, м) */
export const COLUMNS: ReadonlyArray<readonly [number, number]> = [[-2.2, -1.6], [3.0, -1.6]];
/** Кухня-зона вдоль северной стены */
export const KITCHEN = { x0: 2.4, x1: 5.4 } as const;

export type LayoutName = 'empty' | 'lecture' | 'longtable' | 'islands';
export interface Chair { x: number; z: number; ry: number; delay?: number }
export interface TableSpec { w: number; d: number; x: number; z: number; ry?: number; white?: boolean }

const clearOf = (x: number, z: number, r: number) =>
  !COLUMNS.some(([cx, cz]) => Math.hypot(cx - x, cz - z) < r) && !(x > KITCHEN.x0 - 0.3 && z < -ROOM.D / 2 + 1.25);

const ISLANDS: Array<[number, number]> = [[-4.4, 2.4], [-0.6, 2.4], [3.4, 2.4], [-4.6, -1.3], [0.4, -1.9], [5.2, -0.7]];

export function layoutChairs(name: LayoutName): Chair[] {
  const ch: Chair[] = [];
  if (name === 'lecture') {
    for (let row = 0; row < 5; row++) {
      const z = 1.75 - row * 0.95;
      for (let x = -5.4; x <= 5.41; x += 0.6) {
        if (Math.abs(x) < 0.5) continue;
        if (clearOf(x, z, 0.75)) ch.push({ x, z, ry: 0 });
      }
    }
  } else if (name === 'longtable') {
    for (let i = 0; i < 12; i++) {
      const x = -3.85 + i * 0.7;
      ch.push({ x, z: 0.2, ry: 0 }, { x, z: 2.2, ry: Math.PI });
    }
    ch.push({ x: -4.65, z: 1.2, ry: Math.PI / 2 }, { x: 4.65, z: 1.2, ry: -Math.PI / 2 });
  } else if (name === 'islands') {
    ISLANDS.forEach(([x, z]) => [-0.55, 0, 0.55].forEach(o => {
      ch.push({ x: x + o, z: z - 0.78, ry: 0 }, { x: x + o, z: z + 0.78, ry: Math.PI });
    }));
  }
  return ch;
}

export function layoutTables(name: LayoutName): TableSpec[] {
  if (name === 'lecture') return [{ w: 1.4, d: 0.7, x: 1.6, z: 3.2, ry: Math.PI, white: true }];
  if (name === 'longtable') return [{ w: 8.4, d: 1.4, x: 0, z: 1.2 }];
  if (name === 'islands') return ISLANDS.map(([x, z]) => ({ w: 1.7, d: 0.9, x, z }));
  return [];
}

/** Вместимость каждого формата — считается по реально расставленным стульям */
export const CAPACITY: Record<LayoutName, number> = {
  empty: 0,
  lecture: layoutChairs('lecture').length,
  longtable: layoutChairs('longtable').length,
  islands: layoutChairs('islands').length,
};
