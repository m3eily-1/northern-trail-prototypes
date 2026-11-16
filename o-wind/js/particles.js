// Sand particles: one fixed, click-through canvas over the page. Burst grains
// live in page coordinates (they scroll with the content they came from);
// a few ambient grains drift in viewport space. Counts are capped and the
// canvas is not touched at all when nothing is airborne.
import { wind, onFrame } from './wind.js';
import { reduced, isPhone } from './i18n.js';

// Brand sand tones, dark to light.
export const SAND = [
  [130, 70, 40], // sand-dark
  [168, 104, 47],
  [200, 140, 60], // sand
  [219, 170, 98],
  [236, 203, 140],
  [255, 245, 200] // cream
];

const phone = isPhone();
const MAX = phone ? 650 : 2400;
const AMB = phone ? 26 : 70;
const ALPHAS = [0.28, 0.55, 0.8, 1];

const px = new Float32Array(MAX);
const py = new Float32Array(MAX);
const vx = new Float32Array(MAX);
const vy = new Float32Array(MAX);
const life = new Float32Array(MAX);
const maxLife = new Float32Array(MAX);
const size = new Float32Array(MAX);
const col = new Uint8Array(MAX);
const bucket = new Uint8Array(MAX);
let head = 0;
let alive = 0;

const ax = new Float32Array(AMB);
const ay = new Float32Array(AMB);
const as = new Float32Array(AMB);
const aa = new Float32Array(AMB);

let canvas;
let ctx;
let W = 0;
let H = 0;
let dpr = 1;
let drewLast = false;
let ambientOn = true;
const styles = [];

export const budget = phone ? 0.3 : 1; // spawn scale for callers

export function initParticles() {
  if (reduced) return;
  canvas = document.createElement('canvas');
  canvas.className = 'sandfx';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  for (const c of SAND) for (const a of ALPHAS) styles.push(`rgba(${c[0]},${c[1]},${c[2]},${a})`);
  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < AMB; i++) seedAmbient(i, true);
  onFrame(tick);
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2);
  W = document.documentElement.clientWidth;
  H = window.innerHeight;
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
}

function seedAmbient(i, anywhere) {
  ax[i] = anywhere ? Math.random() * W : wind.dir > 0 ? -10 - Math.random() * 60 : W + 10 + Math.random() * 60;
  ay[i] = Math.random() * H;
  as[i] = 0.6 + Math.random() * 1.4;
  aa[i] = 0.15 + Math.random() * 0.25;
}

export function setAmbient(on) {
  ambientOn = on;
}

// Spawn one grain at page coords (x, y).
export function spawn(x, y, svx, svy, c = 2, s = 2, l = 1.4) {
  if (!ctx) return;
  const i = head;
  head = (head + 1) % MAX;
  if (life[i] <= 0) alive++;
  px[i] = x;
  py[i] = y;
  vx[i] = svx;
  vy[i] = svy;
  life[i] = maxLife[i] = l * (0.7 + Math.random() * 0.6);
  size[i] = s;
  col[i] = c;
}

// A puff of grains from a rectangle in client coords (used by small reveals).
export function puff(rect, n, c0 = 1, c1 = 4, power = 1) {
  if (!ctx) return;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const count = Math.round(n * budget);
  for (let k = 0; k < count; k++) {
    const x = rect.left + Math.random() * rect.width + sx;
    const y = rect.top + Math.random() * rect.height + sy;
    spawn(
      x,
      y,
      wind.dir * (60 + Math.random() * 240) * power,
      -20 - Math.random() * 70,
      c0 + Math.floor(Math.random() * (c1 - c0 + 1)),
      1 + Math.random() * 1.8,
      1 + Math.random() * 0.8
    );
  }
}

function tick(dt) {
  const t = wind.time;
  const sx = window.scrollX;
  const sy = window.scrollY;
  const gust = wind.gust;
  const dir = wind.dir;
  const targetVX = dir * (140 + gust * 520);
  const pxp = wind.px;
  const pyp = wind.py;
  const pv = wind.pspeed > 120 && wind.pointerIn;

  const needAmb = ambientOn;
  if (!alive && !needAmb && !drewLast) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  drewLast = false;

  // ambient drift (viewport space)
  if (needAmb) {
    const sv = wind.scrollV;
    ctx.fillStyle = 'rgba(200,140,60,1)';
    for (let i = 0; i < AMB; i++) {
      ax[i] += dir * (30 + gust * 420) * as[i] * dt;
      ay[i] += (Math.sin(t * 1.3 + i) * 8 - sv * 0.06) * dt;
      if (ax[i] < -80 || ax[i] > W + 80 || ay[i] < -20 || ay[i] > H + 20) seedAmbient(i, false);
      ctx.globalAlpha = aa[i] * (0.5 + Math.min(1, gust) * 0.7);
      const len = 1.4 + gust * 10 * as[i];
      ctx.fillRect(dir > 0 ? ax[i] - len : ax[i], ay[i], len, 1.3);
    }
    ctx.globalAlpha = 1;
    drewLast = true;
  }

  if (!alive) return;

  // update bursts
  let n = 0;
  const drag = Math.min(1, dt * 1.6);
  for (let i = 0; i < MAX; i++) {
    if (life[i] <= 0) {
      bucket[i] = 255;
      continue;
    }
    life[i] -= dt;
    if (life[i] <= 0) {
      alive--;
      bucket[i] = 255;
      continue;
    }
    // ease toward the wind, plus a little curl
    vx[i] += (targetVX - vx[i]) * drag * 0.7;
    vy[i] += (Math.sin(px[i] * 0.013 + t * 2.1 + i) * 70 - 12 - vy[i] * 0.6) * dt;
    if (pv) {
      const dx = px[i] - sx - pxp;
      const dy = py[i] - sy - pyp;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14400) {
        const f = (1 - d2 / 14400) * dt * 5;
        vx[i] += wind.pvx * f;
        vy[i] += wind.pvy * f;
      }
    }
    px[i] += vx[i] * dt;
    py[i] += vy[i] * dt;
    const yy = py[i] - sy;
    const xx = px[i] - sx;
    if (yy < -20 || yy > H + 20 || xx < -40 || xx > W + 40) {
      bucket[i] = 255;
      continue;
    }
    const r = life[i] / maxLife[i];
    const a = r > 0.75 ? 3 : r > 0.45 ? 2 : r > 0.2 ? 1 : 0;
    bucket[i] = col[i] * 4 + a;
    n++;
  }
  if (!n) return;

  // draw grouped by style to keep fillStyle changes to ~24 per frame
  for (let b = 0; b < styles.length; b++) {
    let set = false;
    for (let i = 0; i < MAX; i++) {
      if (bucket[i] !== b) continue;
      if (!set) {
        ctx.fillStyle = styles[b];
        set = true;
      }
      const s = size[i];
      const len = Math.min(9, s + Math.abs(vx[i]) * 0.012);
      const x = px[i] - sx;
      ctx.fillRect(vx[i] > 0 ? x - len : x, py[i] - sy, len, s);
    }
  }
  drewLast = true;
}
