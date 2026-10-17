/* АРКА 123 — 3D-модель зала (three.js r147).
   Размеры по материалам заказчика: 123 м², потолок 4,5 м, два арочных окна 4 × 3,5 м
   с видом на Национальную библиотеку. Единицы — метры. Начало координат — центр пола.
   Окна — на западной стене (x = −W/2), Библиотека — за ними. */
import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { RHOMBI } from './rhombi';
import { COLUMNS, KITCHEN, ROOM, layoutChairs, layoutTables, type LayoutName, type Chair } from './layouts';

export type ViewName = 'plan' | 'inside' | 'window';
export interface ArkaScene {
  attach(el: HTMLElement): void;
  resize(): void;
  setTourProgress(p: number): void;
  setMode(m: 'tour' | 'orbit', view?: ViewName): void;
  goView(name: ViewName, instant?: boolean): void;
  setMood(m: number): void;
  setLayout(name: LayoutName): void;
  setVisible(v: boolean): void;
  dispose(): void;
}
const { W, D, H } = ROOM;
const WALL_TOP = 4.4, THICK = 0.4;
// Окно 4 × 3,5 м: подоконник 0,8 м, верх арки 4,15 м, подъём дуги 1,25 м
const WIN_BASE = { w: 4.0, sill: 0.8, top: 4.15, rise: 1.25, centers: [-2.25, 2.25] };
const WIN_R = (WIN_BASE.w * WIN_BASE.w / 4 + WIN_BASE.rise * WIN_BASE.rise) / (2 * WIN_BASE.rise);
const WIN = { ...WIN_BASE, r: WIN_R, cy: WIN_BASE.top - WIN_R /* центр дуги */ };

/* ---------- helpers ---------- */
type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;
function rng(seed: number) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function canvasTex(w: number, h: number, draw: Draw, repeat?: [number, number]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new T.CanvasTexture(c);
  t.encoding = T.sRGBEncoding; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function mergeGeos(geos: T.BufferGeometry[]) {
  const pos: number[] = [], nor: number[] = [], idx: number[] = []; let off = 0;
  geos.forEach(g => {
    const p = Array.from(g.attributes.position.array as ArrayLike<number>), n = Array.from(g.attributes.normal.array as ArrayLike<number>);
    pos.push(...p); nor.push(...n);
    const ix: ArrayLike<number> = g.index ? g.index.array : [...Array(p.length / 3).keys()];
    for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off);
    off += p.length / 3;
  });
  const out = new T.BufferGeometry();
  out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
  out.setIndex(idx);
  return out;
}
function box(w: number, h: number, d: number, x = 0, y = 0, z = 0) { const g = new T.BoxGeometry(w, h, d); g.translate(x || 0, y || 0, z || 0); return g; }
function mesh(geo: T.BufferGeometry, mat: T.Material, opts?: { noCast?: boolean }) {
  const m = new T.Mesh(geo, mat);
  m.castShadow = !(opts && opts.noCast); m.receiveShadow = true;
  return m;
}

/* ---------- textures ---------- */
// «Ёлочка»: планка 0,6 × 0,1 м. Текстура покрывает 1,697 × 1,697 м и бесшовно повторяется.
function herringbone() {
  const S = 1024, cols = 4, cw = S / cols, p = S / 12;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d')!; const img = ctx.createImageData(S, S); const d = img.data;
  const hash = (a: number, b: number) => { let h = (a * 374761393 + b * 668265263) ^ 0x5bd1e995; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const k = Math.floor(x / cw), lx = x - k * cw, s = (k % 2) ? 1 : -1;
    const q = y + s * lx, idx = Math.floor(q / p), fq = q / p - idx;
    const id = ((idx % 12) + 12) % 12, h = hash(k, id);
    const along = lx - s * y;
    const grain = Math.sin(q * 0.55 + h * 40 + Math.sin(along * 0.021 + h * 9) * 2.2) * 0.5 + 0.5;
    let t = 0.86 + h * 0.22 + grain * 0.06 - 0.03;
    const seam = (fq < 0.018 || fq > 0.982 || lx < 1.2 || lx > cw - 1.2) ? 0.62 : 1;
    t *= seam;
    const i = (y * S + x) * 4;
    d[i] = Math.min(255, 201 * t); d[i + 1] = Math.min(255, 152 * t); d[i + 2] = Math.min(255, 96 * t); d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new T.CanvasTexture(c); tex.encoding = T.sRGBEncoding; tex.anisotropy = 8;
  tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(W / 1.697, D / 1.697);
  return tex;
}
function plaster(rep: [number, number]) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#ebe7e0'; g.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 2600; i++) {
      const a = r() * 0.05; g.fillStyle = r() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(120,105,90,${a * 0.8})`;
      const s = 6 + r() * 38; g.beginPath(); g.ellipse(r() * w, r() * h, s, s * (0.4 + r() * 0.6), r() * 3, 0, 7); g.fill();
    }
  }, rep);
}
function frosted() {
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = 'rgba(232,238,240,0.55)'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(250,252,252,0.85)';
    [[0.47, 0.13], [0.66, 0.02], [0.70, 0.02]].forEach(([y, hh]) => g.fillRect(0, h * (1 - y - hh), w, h * hh));
  });
}
function slide() {
  return canvasTex(1024, 576, (g, w, h) => {
    g.fillStyle = '#f6f4ef'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#203640'; g.fillRect(0, 0, 18, h);
    g.font = '600 64px Manrope, Arial, sans-serif'; g.fillText('Мастер-класс', 80, 170);
    g.font = '400 34px Arial, sans-serif'; g.fillStyle = '#5d6a70'; g.fillText('Встречаемся напротив Библиотеки', 80, 230);
    g.fillStyle = '#f0b04a'; [0.5, 0.75, 0.38, 0.9].forEach((v, i) => g.fillRect(80 + i * 120, h - 70 - v * 220, 80, v * 220));
    g.strokeStyle = '#203640'; g.lineWidth = 14;
    g.beginPath(); g.moveTo(700, 500); g.lineTo(700, 330); g.arc(800, 330, 100, Math.PI, 0); g.lineTo(900, 500); g.closePath(); g.stroke();
  });
}

/* ---------- build ---------- */
export function buildScene(container: HTMLElement): ArkaScene {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%';

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(58, 1, 0.05, 3000);

  /* materials */
  const M = {
    floor: new T.MeshStandardMaterial({ map: herringbone(), roughness: 0.55, metalness: 0 }),
    wall: new T.MeshStandardMaterial({ map: plaster([3, 1.2]), roughness: 0.95 }),
    wallS: new T.MeshStandardMaterial({ map: plaster([1, 0.5]), roughness: 0.95 }),
    graphite: new T.MeshStandardMaterial({ color: 0x2b3236, roughness: 0.8 }),
    ceiling: new T.MeshStandardMaterial({ color: 0x24292c, roughness: 0.9 }),
    black: new T.MeshStandardMaterial({ color: 0x15191b, roughness: 0.5, metalness: 0.3 }),
    white: new T.MeshStandardMaterial({ color: 0xeceeee, roughness: 0.5 }),
    glass: new T.MeshPhysicalMaterial({ color: 0xcfe0e6, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.12, depthWrite: false }),
    frost: new T.MeshStandardMaterial({ map: frosted(), transparent: true, roughness: 0.4, depthWrite: false }),
    led: new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
    ledStrip: new T.MeshBasicMaterial({ color: 0xbfe6ff, toneMapped: false }),
    oakTop: new T.MeshStandardMaterial({ color: 0xd8bf96, roughness: 0.55 }),
    seat: new T.MeshStandardMaterial({ color: 0x2c4350, roughness: 0.75 }),
    screen: new T.MeshBasicMaterial({ map: slide(), toneMapped: false }),
  };

  const room = new T.Group(); scene.add(room);
  const walls: Array<{ group: T.Object3D; center: T.Vector3; n: T.Vector3 }> = [];   // для «кукольного домика» в режиме обзора

  /* пол */
  const floor = mesh(new T.PlaneGeometry(W, D), M.floor, { noCast: true });
  floor.rotation.x = -Math.PI / 2; room.add(floor);

  /* стена с окнами (запад) */
  function archShape(cz: number, inset: number) {
    const hw = WIN.w / 2 - inset, sh = new T.Shape();
    const r = WIN.r - inset, cy = WIN.cy;
    const a0 = Math.asin(hw / r);
    sh.moveTo(cz - hw, WIN.sill + inset);
    sh.lineTo(cz + hw, WIN.sill + inset);
    sh.lineTo(cz + hw, cy + r * Math.cos(a0));
    sh.absarc(cz, cy, r, Math.PI / 2 - a0, Math.PI / 2 + a0, false);
    sh.lineTo(cz - hw, WIN.sill + inset);
    return sh;
  }
  const winWallGroup = new T.Group();
  {
    const sh = new T.Shape();
    sh.moveTo(-D / 2, 0); sh.lineTo(D / 2, 0); sh.lineTo(D / 2, WALL_TOP); sh.lineTo(-D / 2, WALL_TOP); sh.lineTo(-D / 2, 0);
    WIN.centers.forEach(cz => sh.holes.push(archShape(cz, 0)));
    const g = new T.ExtrudeGeometry(sh, { depth: THICK, bevelEnabled: false, curveSegments: 40 });
    const wm = M.wall.clone(); wm.map = plaster([0.25, 0.25]);
    const wall = mesh(g, wm);
    wall.rotation.y = Math.PI / 2; wall.position.x = -W / 2 - THICK;
    winWallGroup.add(wall);
    // рамы
    WIN.centers.forEach(cz => {
      const fs = archShape(cz, 0); fs.holes.push(archShape(cz, 0.09));
      const fg = new T.ExtrudeGeometry(fs, { depth: 0.08, bevelEnabled: false, curveSegments: 40 });
      const frame = mesh(fg, M.black); frame.rotation.y = Math.PI / 2; frame.position.x = -W / 2 - THICK * 0.55;
      winWallGroup.add(frame);
      const yTop = (z: number) => WIN.cy + Math.sqrt(WIN.r * WIN.r - z * z);
      [-0.68, 0.68].forEach(o => {
        const h = yTop(o) - WIN.sill;
        winWallGroup.add(mesh(box(0.08, h, 0.07, -W / 2 - THICK * 0.5, WIN.sill + h / 2, cz + o), M.black));
      });
      winWallGroup.add(mesh(box(0.08, 0.07, WIN.w, -W / 2 - THICK * 0.5, 2.25, cz), M.black));
      const gl = new T.Mesh(new T.ShapeGeometry(archShape(cz, 0.05), 40), M.glass);
      gl.rotation.y = Math.PI / 2; gl.position.x = -W / 2 - THICK * 0.5; gl.renderOrder = 2;
      winWallGroup.add(gl);
      // подоконник и радиатор
      winWallGroup.add(mesh(box(0.42, 0.04, WIN.w + 0.1, -W / 2 - THICK + 0.21, WIN.sill - 0.02, cz), M.black));
      const rad = new T.Group();
      for (let i = 0; i < 26; i++) rad.add(mesh(box(0.08, 0.5, 0.045, -W / 2 + 0.07, 0.42, cz - 0.85 + i * 0.068), M.graphite));
      winWallGroup.add(rad);
    });
  }
  room.add(winWallGroup);
  walls.push({ group: winWallGroup, center: new T.Vector3(-W / 2, 2, 0), n: new T.Vector3(1, 0, 0) });

  /* северная стена: часы, кухня, белые панели */
  const north = new T.Group();
  north.add(mesh(box(W, WALL_TOP, 0.2, 0, WALL_TOP / 2, -D / 2 - 0.1), M.wall));
  // часы
  const clock = new T.Group();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2, big = i % 3 === 0;
    const m = new T.Mesh(box(big ? 0.07 : 0.05, big ? 0.16 : 0.05, 0.02), M.black);
    m.position.set(Math.sin(a) * 0.62, Math.cos(a) * 0.62, 0); m.rotation.z = -a; clock.add(m);
  }
  const hand1 = new T.Mesh(box(0.035, 0.45, 0.02, 0, 0.2, 0), M.black); hand1.rotation.z = -1.1; clock.add(hand1);
  const hand2 = new T.Mesh(box(0.045, 0.32, 0.02, 0, 0.14, 0), M.black); hand2.rotation.z = 2.2; clock.add(hand2);
  clock.position.set(-1.2, 2.7, -D / 2 + 0.02); north.add(clock);
  // кухня-зона
  const kx = (KITCHEN.x0 + KITCHEN.x1) / 2, kw = KITCHEN.x1 - KITCHEN.x0;
  north.add(mesh(box(kw, 0.88, 0.6, kx, 0.44, -D / 2 + 0.3), M.graphite));
  north.add(mesh(box(kw + 0.02, 0.04, 0.62, kx, 0.9, -D / 2 + 0.31), M.black));
  north.add(mesh(box(kw, 0.03, 0.02, kx, 1.45, -D / 2 + 0.01), M.ledStrip));
  north.add(mesh(box(kw, 0.55, 0.02, kx, 1.2, -D / 2 + 0.005), new T.MeshStandardMaterial({ color: 0x3d4e57, roughness: 0.3, metalness: 0.2 })));
  north.add(mesh(box(kw, 1.3, 0.38, kx, 2.25, -D / 2 + 0.19), M.graphite));
  north.add(mesh(box(kw, 1.5, 0.45, kx, 3.65, -D / 2 + 0.22), M.graphite));
  north.add(mesh(box(W / 2 - KITCHEN.x1, 3.4, 0.45, (KITCHEN.x1 + W / 2) / 2, 1.7, -D / 2 + 0.22), M.white));
  for (let i = 0; i < 3; i++) north.add(mesh(box(0.012, 3.38, 0.01, KITCHEN.x1 + 0.45 + i * 0.45, 1.7, -D / 2 + 0.45), M.graphite, { noCast: true }));
  room.add(north);
  walls.push({ group: north, center: new T.Vector3(0, 2, -D / 2), n: new T.Vector3(0, 0, 1) });

  /* южная стена */
  const south = new T.Group();
  south.add(mesh(box(W, WALL_TOP, 0.2, 0, WALL_TOP / 2, D / 2 + 0.1), M.wall));
  south.add(mesh(box(0.55, WALL_TOP, 0.35, -W / 2 + 1.0, WALL_TOP / 2, D / 2 - 0.1), M.graphite));
  room.add(south);
  walls.push({ group: south, center: new T.Vector3(0, 2, D / 2), n: new T.Vector3(0, 0, -1) });

  /* восточная стена: стеклянная перегородка */
  const east = new T.Group();
  const back = new T.Mesh(new T.PlaneGeometry(D + 4, WALL_TOP + 1), new T.MeshStandardMaterial({ color: 0x9aa3a6, roughness: 1 }));
  back.rotation.y = -Math.PI / 2; back.position.set(W / 2 + 2.2, WALL_TOP / 2, 0); east.add(back);
  const panes = 6, pw = D / panes;
  for (let i = 0; i < panes; i++) {
    const z = -D / 2 + pw / 2 + i * pw;
    const p = new T.Mesh(new T.PlaneGeometry(pw, 3.1), M.frost);
    p.rotation.y = -Math.PI / 2; p.position.set(W / 2, 1.55, z); p.renderOrder = 3; east.add(p);
    east.add(mesh(box(0.06, 3.1, 0.04, W / 2, 1.55, z - pw / 2), M.white));
  }
  east.add(mesh(box(0.25, WALL_TOP - 3.1, D, W / 2 + 0.05, 3.1 + (WALL_TOP - 3.1) / 2, 0), M.white));
  east.add(mesh(box(0.06, 0.05, D, W / 2, 3.1, 0), M.white));
  room.add(east);
  walls.push({ group: east, center: new T.Vector3(W / 2, 2, 0), n: new T.Vector3(-1, 0, 0) });

  /* плинтус */
  [[W, 0.08, 0.02, 0, -D / 2 + 0.01], [W, 0.08, 0.02, 0, D / 2 - 0.01]].forEach(a => room.add(mesh(box(a[0], a[1], a[2], a[3], 0.04, a[4]), M.black, { noCast: true })));

  /* колонны */
  COLUMNS.forEach(([x, z]) => room.add(mesh(box(0.55, H, 0.55, x, H / 2, z), M.graphite)));

  /* потолок: тёмный, балки, 33 световые панели */
  const ceil = new T.Group();
  const cp = new T.Mesh(new T.PlaneGeometry(W + 1, D + 1), M.ceiling); cp.rotation.x = Math.PI / 2; cp.position.y = H; cp.castShadow = true; ceil.add(cp);
  for (let x = -W / 2 + 1.4; x < W / 2; x += 2.75) ceil.add(mesh(box(0.32, 0.45, D, x, H - 0.225, 0), M.ceiling));
  ceil.add(mesh(box(W, 0.4, 0.5, 0, H - 0.55, -D / 2 + 1.1), M.ceiling));
  const duct = new T.Mesh(new T.CylinderGeometry(0.16, 0.16, W, 16), M.ceiling); duct.rotation.z = Math.PI / 2; duct.position.set(0, H - 0.4, 2.3); ceil.add(duct);
  const r = rng(123), ledGeo = new T.BoxGeometry(1.5, 0.035, 0.06), wireMat = new T.LineBasicMaterial({ color: 0x111111 });
  const ledPts: Array<[number, number]> = [];
  let placed = 0, tries = 0;
  while (placed < 33 && tries < 2000) {
    tries++;
    const x = -W / 2 + 0.9 + r() * (W - 1.8), z = -D / 2 + 0.9 + r() * (D - 1.8);
    if (ledPts.some(p => Math.hypot(p[0] - x, p[1] - z) < 1.35)) continue;
    ledPts.push([x, z]); placed++;
    const m = new T.Mesh(ledGeo, M.led); m.position.set(x, 3.95 - r() * 0.15, z); m.rotation.y = (r() - 0.5) * 1.9; ceil.add(m);
    const gw = new T.BufferGeometry().setFromPoints([new T.Vector3(x, m.position.y, z), new T.Vector3(x, H, z)]);
    ceil.add(new T.Line(gw, wireMat));
  }
  room.add(ceil);

  /* ---------- снаружи: небо, город, Библиотека ---------- */
  const skyU = { top: { value: new T.Color() }, mid: { value: new T.Color() }, bot: { value: new T.Color() }, sunDir: { value: new T.Vector3() }, sunCol: { value: new T.Color() } };
  const sky = new T.Mesh(new T.SphereGeometry(1500, 32, 16), new T.ShaderMaterial({
    uniforms: skyU, side: T.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top,mid,bot,sunCol,sunDir; varying vec3 vP; void main(){ float h=vP.y; vec3 c = h>0.0 ? mix(mid,top,pow(clamp(h*1.6,0.0,1.0),0.7)) : mix(mid,bot,clamp(-h*6.0,0.0,1.0)); float s=max(dot(vP,normalize(sunDir)),0.0); c += sunCol*(pow(s,600.0)*1.5 + pow(s,8.0)*0.25); gl_FragColor=vec4(c,1.0); }'
  }));
  scene.add(sky);
  const outside = new T.Group(); scene.add(outside);
  const fog = new T.Fog(0xcfe0ea, 140, 1200); scene.fog = fog;
  const slab = mesh(box(W + 0.8, 0.5, D + 0.8, 0, -0.27, 0), new T.MeshStandardMaterial({ color: 0xb9b6ae, roughness: 1 })); room.add(slab);
  const GY = -8;
  const ground = new T.Mesh(new T.PlaneGeometry(1600, 1600), new T.MeshStandardMaterial({ color: 0x7c8a6e, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = GY; ground.receiveShadow = true; outside.add(ground);
  const asphalt = new T.MeshStandardMaterial({ color: 0x55595b, roughness: 1 });
  const road = new T.Mesh(new T.PlaneGeometry(26, 1600), asphalt); road.rotation.x = -Math.PI / 2; road.position.set(-38, GY + 0.02, 0); outside.add(road);
  const lot = new T.Mesh(new T.PlaneGeometry(70, 120), asphalt); lot.rotation.x = -Math.PI / 2; lot.position.set(-95, GY + 0.02, -10); outside.add(lot);
  // машины на парковке
  const carGeo = new T.BoxGeometry(4.3, 1.4, 1.9), carMat = new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.4 });
  const cars = new T.InstancedMesh(carGeo, carMat, 160); let ci = 0; const mtx = new T.Matrix4(), col = new T.Color();
  const cr = rng(5);
  for (let row = 0; row < 8; row++) for (let i = 0; i < 20; i++) {
    if (cr() < 0.25) continue;
    mtx.makeRotationY(Math.PI / 2); mtx.setPosition(-120 + row * 7.5, GY + 0.7, -60 + i * 2.6 + (row % 2) * 1.3);
    cars.setMatrixAt(ci, mtx); cars.setColorAt(ci, col.setHSL(cr(), 0.15 + cr() * 0.3, 0.25 + cr() * 0.5)); ci++;
  }
  cars.count = ci; outside.add(cars);
  // деревья (осень)
  const treeGeo = new T.IcosahedronGeometry(1, 0), treeMat = new T.MeshStandardMaterial({ roughness: 0.9, flatShading: true });
  const trees = new T.InstancedMesh(treeGeo, treeMat, 140); const tr = rng(11); let ti = 0;
  const q = new T.Quaternion(), sc = new T.Vector3(), ps = new T.Vector3();
  for (let i = 0; i < 140; i++) {
    const x = -48 - tr() * 130, z = -140 + tr() * 280;
    if (x < -55 && x > -132 && z > -72 && z < 52) continue;
    const s = 2.2 + tr() * 2.2; sc.set(s, s * (1.1 + tr() * 0.4), s); ps.set(x, GY + s * 1.1, z);
    q.setFromEuler(new T.Euler(0, tr() * 6, 0)); mtx.compose(ps, q, sc); trees.setMatrixAt(ti, mtx);
    trees.setColorAt(ti, col.setHSL(0.06 + tr() * 0.17, 0.5, 0.26 + tr() * 0.14)); ti++;
  }
  trees.count = ti; outside.add(trees);
  // соседние дома
  const bmat = new T.MeshStandardMaterial({ color: 0xc9cdcf, roughness: 0.8 });
  const gmat = new T.MeshStandardMaterial({ color: 0x5f7d8c, roughness: 0.2, metalness: 0.5 });
  const br = rng(21);
  for (let i = 0; i < 22; i++) {
    const x = -230 - br() * 260, z = -360 + br() * 720; if (Math.abs(z + 10) < 70 && x > -330) continue;
    const h = 20 + br() * 70, w = 18 + br() * 30;
    const b = new T.Mesh(new T.BoxGeometry(w, h, 14 + br() * 30), br() > 0.6 ? gmat : bmat); b.position.set(x, GY + h / 2, z); outside.add(b);
  }
  // Национальная библиотека: ромбокубооктаэдр на стилобате
  const lib = new T.Group();
  const stylo = new T.Mesh(new T.BoxGeometry(96, 10, 96), new T.MeshStandardMaterial({ color: 0xd3d4cf, roughness: 0.85 }));
  stylo.position.y = 5; stylo.receiveShadow = true; lib.add(stylo);
  const stylo2 = new T.Mesh(new T.BoxGeometry(70, 4, 70), stylo.material); stylo2.position.y = 12; lib.add(stylo2);
  const R = RHOMBI, rg = new T.BufferGeometry();
  rg.setAttribute('position', new T.Float32BufferAttribute(R.v, 3)); rg.setIndex(R.i);
  const rgn = rg.toNonIndexed(); rgn.computeVertexNormals();
  const libMat = new T.MeshStandardMaterial({ color: 0x3f6f80, roughness: 0.22, metalness: 0.55, flatShading: true, emissive: 0x000000 });
  const rhombi = new T.Mesh(rgn, libMat); rhombi.scale.setScalar(27); rhombi.position.y = 14 + 27; rhombi.castShadow = true; lib.add(rhombi);
  const edgeMat = new T.LineBasicMaterial({ color: 0x1d3a45 });
  const edges = new T.LineSegments(new T.EdgesGeometry(rgn, 10), edgeMat); edges.scale.copy(rhombi.scale); edges.position.copy(rhombi.position); lib.add(edges);
  lib.position.set(-175, GY, -14);
  outside.add(lib);

  /* ---------- свет ---------- */
  const hemi = new T.HemisphereLight(0xdfe8ee, 0x8a7158, 0.55); scene.add(hemi);
  const amb = new T.AmbientLight(0xffffff, 0.18); scene.add(amb);
  const sun = new T.DirectionalLight(0xffffff, 2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 140 });
  scene.add(sun); scene.add(sun.target);
  const fills = [[-3.5, 0], [0.5, 0], [4.5, 0]].map(([x, z]) => { const l = new T.PointLight(0xfff4e6, 0.35, 14, 1.6); l.position.set(x, 3.7, z); scene.add(l); return l; });

  const MOODS = {
    day: { top: 0x5f93c4, mid: 0xcfe0ea, bot: 0x9aa59a, sunCol: 0xfff1d8, sun: [-40, 30, 14], sunI: 1.5, hemi: 0.5, fill: 0.25, exp: 0.95, libE: 0x000000, edge: 0x1d3a45, led: 0xf2f6ff },
    evening: { top: 0x24345a, mid: 0xf3a65d, bot: 0x6b5a50, sunCol: 0xffa24a, sun: [-60, 7, -18], sunI: 2.4, hemi: 0.3, fill: 0.7, exp: 1.0, libE: 0x0c2a33, edge: 0x7fe0ff, led: 0xffffff },
  };
  const tmpA = new T.Color(), tmpB = new T.Color();
  function setMood(m: number) {
    const a = MOODS.day, b = MOODS.evening, L = (x: number, y: number) => x + (y - x) * m;
    const lc = (ca: number, cb: number, target: T.Color) => target.copy(tmpA.set(ca)).lerp(tmpB.set(cb), m);
    lc(a.top, b.top, skyU.top.value); lc(a.mid, b.mid, skyU.mid.value); lc(a.bot, b.bot, skyU.bot.value);
    lc(a.sunCol, b.sunCol, skyU.sunCol.value); lc(a.sunCol, b.sunCol, sun.color);
    const sp = a.sun.map((v, i) => L(v, b.sun[i])); sun.position.set(sp[0], sp[1], sp[2]); skyU.sunDir.value.set(sp[0], sp[1], sp[2]).normalize();
    sun.intensity = L(a.sunI, b.sunI); hemi.intensity = L(a.hemi, b.hemi);
    fills.forEach(f => f.intensity = L(a.fill, b.fill));
    renderer.toneMappingExposure = L(a.exp, b.exp);
    lc(a.libE, b.libE, libMat.emissive); fog.color.copy(skyU.mid.value); lc(a.edge, b.edge, edgeMat.color);
  }
  setMood(0);

  /* ---------- мебель и рассадки ---------- */
  const legGeo = mergeGeos([[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([x, z]) => box(0.025, 0.44, 0.025, x, 0.22, z)));
  const chairParts = [
    new T.InstancedMesh(box(0.46, 0.06, 0.44, 0, 0.47, 0.01), M.seat, 140),
    new T.InstancedMesh(box(0.46, 0.42, 0.05, 0, 0.74, -0.2), M.seat, 140),
    new T.InstancedMesh(legGeo, M.black, 140),
  ];
  chairParts.forEach(p => { p.count = 0; p.castShadow = true; p.receiveShadow = true; p.instanceMatrix.setUsage(T.DynamicDrawUsage); scene.add(p); });
  let chairs: Chair[] = [];
  const anim = { t: 1, out: false };
  const furn = new T.Group(); scene.add(furn);
  const _m = new T.Matrix4(), _q = new T.Quaternion(), _s = new T.Vector3(), _p = new T.Vector3(), _e = new T.Euler();
  function writeChairs() {
    chairs.forEach((c, i) => {
      let k = anim.out ? 1 - anim.t : Math.min(1, Math.max(0, (anim.t - (c.delay ?? 0)) / 0.35));
      k = 1 - Math.pow(1 - k, 3);
      _p.set(c.x, (1 - k) * 0.6, c.z); _e.set(0, c.ry, 0); _q.setFromEuler(_e); _s.setScalar(Math.max(k, 0.0001));
      _m.compose(_p, _q, _s); chairParts.forEach(p => p.setMatrixAt(i, _m));
    });
    chairParts.forEach(p => { p.count = chairs.length; p.instanceMatrix.needsUpdate = true; });
  }
  function table(w: number, d: number, x: number, z: number, ry = 0, top?: T.Material) {
    const g = new T.Group();
    g.add(mesh(box(w, 0.04, d, 0, 0.74, 0), top || M.oakTop));
    [-1, 1].forEach(s => { g.add(mesh(box(0.05, 0.72, d * 0.8, s * (w / 2 - 0.12), 0.36, 0), M.black)); });
    g.position.set(x, 0, z); g.rotation.y = ry; return g;
  }
  /** Экран, проектор и кафедра для формата «мастер-класс» */
  function lectureProps(): T.Object3D[] {
    const scr = new T.Group();
    scr.add(mesh(box(4.2, 2.45, 0.05, 0, 2.45, D / 2 - 0.06), M.black));
    const s = new T.Mesh(new T.PlaneGeometry(4.0, 2.25), M.screen); s.position.set(0, 2.45, D / 2 - 0.09); s.rotation.y = Math.PI; scr.add(s);
    scr.add(mesh(box(0.4, 0.14, 0.35, 0, 3.65, 0.6), M.white));
    const beamG = new T.ConeGeometry(2.3, 3.9, 4, 1, true); beamG.rotateY(Math.PI / 4); beamG.rotateX(-Math.PI / 2); beamG.translate(0, 0, 1.95);
    const beam = new T.Mesh(beamG, new T.MeshBasicMaterial({ color: 0xfff3d6, transparent: true, opacity: 0.05, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
    beam.position.set(0, 3.6, 0.75); beam.scale.set(1, 0.58, 1); beam.lookAt(0, 2.45, D / 2); scr.add(beam);
    const lect = new T.Group(); lect.add(mesh(box(0.55, 1.1, 0.45, 0, 0.55, 0), M.graphite)); lect.add(mesh(box(0.6, 0.04, 0.5, 0, 1.12, 0), M.black)); lect.position.set(-1.7, 0, 3.1);
    return [scr, lect];
  }
  function layoutItems(name: LayoutName): T.Object3D[] {
    const items: T.Object3D[] = name === 'lecture' ? lectureProps() : [];
    layoutTables(name).forEach(t => items.push(table(t.w, t.d, t.x, t.z, t.ry ?? 0, t.white ? M.white : undefined)));
    return items;
  }
  let current: LayoutName = 'empty';
  let switching: gsap.core.Timeline | null = null;
  function setLayout(name: LayoutName) {
    if (name === current) return;
    current = name;
    if (switching) switching.kill();
    const oldItems = furn.children.slice();
    const nextChairs = layoutChairs(name), nextItems = layoutItems(name);
    const tl = gsap.timeline();
    switching = tl;
    if (chairs.length || oldItems.length) {
      anim.out = true; anim.t = 0;
      tl.to(anim, { t: 1, duration: 0.3, ease: 'power1.in', onUpdate: writeChairs });
      oldItems.forEach(o => tl.to(o.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3, ease: 'power1.in' }, 0));
    }
    tl.add(() => {
      oldItems.forEach(o => furn.remove(o));
      chairs = nextChairs.map(c => ({ ...c, delay: (Math.hypot(c.x, c.z - 1) / 8) * 0.65 }));
      anim.out = false; anim.t = 0; writeChairs();
      nextItems.forEach((o, i) => { o.scale.setScalar(0.001); furn.add(o); gsap.to(o.scale, { x: 1, y: 1, z: 1, duration: 0.55, delay: 0.05 * i, ease: 'back.out(1.6)' }); });
    });
    tl.to(anim, { t: 1, duration: 1.0, ease: 'none', onUpdate: writeChairs });
  }

  /* ---------- камера ---------- */
  type V3 = [number, number, number];
  // Маршрут прогулки: точки камеры и куда она смотрит (по шагам на сайте)
  const TOUR: { pos: V3[]; tgt: V3[] } = {
    pos: [[6.3, 1.7, 3.6], [3.4, 1.55, 2.0], [0.6, 1.25, 1.6], [-3.4, 1.6, 0.4], [-6.3, 1.72, -2.25]],
    tgt: [[-6.5, 1.7, -0.6], [-6.5, 1.6, 0.2], [-3.5, 4.3, -0.6], [-7.0, 2.3, -2.2], [-175, 30, -14]],
  };
  const posCurve = new T.CatmullRomCurve3(TOUR.pos.map(p => new T.Vector3(...p)), false, 'centripetal');
  const V = (a: V3) => new T.Vector3(...a);
  function tourAt(p: number, outPos: T.Vector3, outTgt: T.Vector3) {
    p = Math.min(1, Math.max(0, p));
    posCurve.getPoint(p, outPos);
    const n = TOUR.tgt.length - 1, f = p * n, i = Math.min(n - 1, Math.floor(f)), k = f - i;
    const e = k * k * (3 - 2 * k);
    // смешиваем направления, а не точки — иначе дальняя цель «тянет» камеру
    const d0 = V(TOUR.tgt[i]).sub(V(TOUR.pos[i])).normalize(), d1 = V(TOUR.tgt[i + 1]).sub(V(TOUR.pos[i + 1])).normalize();
    outTgt.copy(outPos).add(d0.lerp(d1, e).normalize().multiplyScalar(10));
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  {
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enableZoom = false; controls.enablePan = false;
    controls.maxPolarAngle = Math.PI * 0.49; controls.enabled = false;
  }
  const VIEWS: Record<ViewName, { pos: V3; tgt: V3; fov: number }> = {
    plan: { pos: [9.5, 11.5, 10.5], tgt: [0, 0.6, 0], fov: 42 },
    inside: { pos: [6.0, 1.65, 3.4], tgt: [-1.5, 1.4, -0.4], fov: 62 },
    window: { pos: [-4.2, 1.6, 2.2], tgt: [-7.5, 2.4, -1.4], fov: 62 },
  };
  function goView(name: ViewName, instant = false) {
    const v = VIEWS[name]; if (!v) return;
    const from = { p: camera.position.clone(), t: controls.target.clone(), f: camera.fov };
    const o = { k: 0 };
    const apply = () => {
      const e = o.k;
      camera.position.lerpVectors(from.p, V(v.pos), e); controls.target.lerpVectors(from.t, V(v.tgt), e);
      camera.fov = from.f + (v.fov - from.f) * e; camera.updateProjectionMatrix();
    };
    if (instant) { o.k = 1; apply(); return; }
    gsap.to(o, { k: 1, duration: 1.1, ease: 'power3.inOut', onUpdate: apply });
  }

  /* ---------- «кукольный домик»: прячем стены между камерой и залом ---------- */
  let dollhouse = false;
  function updateWalls() {
    const cp = camera.position;
    walls.forEach(w => { w.group.visible = !dollhouse || cp.clone().sub(w.center).dot(w.n) > 0; });
    ceil.visible = !dollhouse || cp.y < H;
  }

  /* ---------- цикл ---------- */
  let mode: 'tour' | 'orbit' = 'tour', tourP = 0, tourShown = 0, moodNow = 0, moodTarget = 0, running = true, visible = true;
  const camPos = new T.Vector3(), camTgt = new T.Vector3();
  function resize() {
    const el = renderer.domElement.parentElement; if (!el) return;
    const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  function attach(el: HTMLElement) { if (renderer.domElement.parentElement !== el) el.appendChild(renderer.domElement); ro.disconnect(); ro.observe(el); resize(); }
  attach(container);

  const clock3 = new T.Clock();
  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock3.getDelta(), 0.05);
    if (Math.abs(moodTarget - moodNow) > 0.002) { moodNow += (moodTarget - moodNow) * Math.min(1, dt * 3); setMood(moodNow); }
    if (mode === 'tour') {
      tourShown += (tourP - tourShown) * Math.min(1, dt * 5);
      tourAt(tourShown, camPos, camTgt);
      camera.position.copy(camPos); camera.lookAt(camTgt);
      if (camera.fov !== 58) { camera.fov = 58; camera.updateProjectionMatrix(); }
    } else {
      controls.update();
    }
    updateWalls();
    renderer.render(scene, camera);
  }
  tourAt(0, camPos, camTgt); camera.position.copy(camPos); camera.lookAt(camTgt);
  frame();

  return {
    attach, resize,
    setTourProgress(p) { tourP = p; },
    setMode(m, view) {
      mode = m;
      dollhouse = m === 'orbit';
      controls.enabled = m === 'orbit';
      if (m === 'orbit') goView(view || 'plan', true);
    },
    goView,
    setMood(m) { moodTarget = m; },
    setLayout,
    setVisible(v) { visible = v; if (v) clock3.getDelta(); },
    dispose() {
      running = false; ro.disconnect(); controls.dispose();
      scene.traverse(o => {
        const m = o as T.Mesh;
        if (m.geometry) m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach(mt => { Object.values(mt).forEach(v => { if (v instanceof T.Texture) v.dispose(); }); mt.dispose(); });
      });
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
