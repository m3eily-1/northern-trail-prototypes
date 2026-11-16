// Time of day engine (pure functions, no DOM).
// Clock minutes since midnight drive every colour on the page: sky, light, fog, sun, stars.

export const DAY0 = 360; // 06:00, departure from Diriyah
export const PRE0 = 300; // 05:00, top of the page (before dawn)
export const NIGHT = 1275; // 21:15, camp under the stars
export const SUNRISE = 360;
export const SUNSET = 1080;

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, x) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};
export const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export function cumulativeTimes(stops) {
  let t = DAY0;
  return stops.map((s) => (t += s.driveMinutes || 0));
}

const pad = (n) => String(n).padStart(2, '0');
export function fmtClock(m) {
  const mm = Math.floor(m + 1e-6);
  return pad(Math.floor(mm / 60) % 24) + ':' + pad(mm % 60);
}

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const mix = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const rgb = (c, a) =>
  a === undefined
    ? `rgb(${Math.round(clamp(c[0], 0, 255))} ${Math.round(clamp(c[1], 0, 255))} ${Math.round(clamp(c[2], 0, 255))})`
    : `rgb(${Math.round(clamp(c[0], 0, 255))} ${Math.round(clamp(c[1], 0, 255))} ${Math.round(clamp(c[2], 0, 255))} / ${a.toFixed(3)})`;

function keys(list) {
  return list.map((row) => row.map((v, i) => (i > 0 && typeof v === 'string' ? hex(v) : v)));
}

function track(k, t) {
  if (t <= k[0][0]) return k[0].slice(1);
  const last = k[k.length - 1];
  if (t >= last[0]) return last.slice(1);
  let i = 0;
  while (t >= k[i + 1][0]) i++;
  const a = k[i];
  const b = k[i + 1];
  const f = (t - a[0]) / (b[0] - a[0]);
  return a.slice(1).map((v, j) => (Array.isArray(v) ? mix(v, b[j + 1], f) : lerp(v, b[j + 1], f)));
}

// [minute, sky top, sky mid, horizon]
const SKY = keys([
  [300, '#070a1f', '#10163a', '#1f2050'],
  [330, '#0b1030', '#1c2252', '#3a3060'],
  [350, '#18204a', '#4a3f78', '#c87a6a'],
  [362, '#2c3a72', '#8a6a9a', '#f4a46a'],
  [390, '#4a6aa6', '#b8a0b8', '#ffcf96'],
  [450, '#5a8cc8', '#a8c4e0', '#fbe2b8'],
  [600, '#3f86d0', '#8fbde6', '#f4ecd6'],
  [750, '#4a92d8', '#b2d6f0', '#fff7e6'],
  [900, '#4f86c4', '#9cc0e0', '#f8e0b0'],
  [990, '#5878b0', '#b5a8b8', '#ffc070'],
  [1050, '#3f4c8a', '#c27088', '#ff9048'],
  [1085, '#262c62', '#7a4a7c', '#e8704a'],
  [1120, '#141a42', '#3a2c5a', '#8a4a58'],
  [1172, '#080c26', '#141838', '#2a2346'],
  [1290, '#04071a', '#0c1030', '#1c1a3a'],
]);

// [minute, light colour, intensity]
const LIGHT = keys([
  [300, '#6070b0', 0.14],
  [345, '#8070b0', 0.22],
  [362, '#ff9a70', 0.5],
  [400, '#ffcf9a', 0.75],
  [480, '#fff0d8', 0.92],
  [750, '#ffffff', 1.06],
  [930, '#fff0d0', 0.98],
  [1000, '#ffc070', 0.9],
  [1060, '#ff8a50', 0.72],
  [1090, '#c06a80', 0.45],
  [1130, '#6a6aa8', 0.25],
  [1180, '#4a5a9a', 0.14],
  [1290, '#4a5a9a', 0.12],
]);

// [minute, cloud opacity]
const CLOUD = keys([
  [300, 0.12],
  [350, 0.35],
  [400, 0.6],
  [600, 0.4],
  [750, 0.1],
  [900, 0.3],
  [1040, 0.75],
  [1110, 0.55],
  [1200, 0.12],
]);

export const MATS = {
  sand: hex('#d8a466'),
  mud: hex('#c98a4e'),
  rock: hex('#94705e'),
  red: hex('#b5603c'),
  dune: hex('#d4844c'),
  palm: hex('#5f6b34'),
  field: hex('#86913c'),
  trunk: hex('#7a5434'),
  dark: hex('#5a3220'),
  glyph: hex('#f6d6ac'),
  road: hex('#4d4844'),
  line: hex('#f4e9c8'),
  car: hex('#ebe1c8'),
};

export function sky(t) {
  const [top, mid, hor] = track(SKY, t);
  return { top, mid, hor };
}

export function sun(t) {
  const theta = (Math.PI * (t - SUNRISE)) / (SUNSET - SUNRISE);
  const el = 72 * Math.sin(theta);
  return { theta, el, up: smooth(-4, 8, el) };
}

// Everything the scene needs for one moment of the day.
export function palette(t) {
  const s = sky(t);
  const [lc, li] = track(LIGHT, t);
  const sn = sun(t);
  const night = 1 - smooth(-14, 2, sn.el);
  const noon = smooth(610, 700, t) * (1 - smooth(800, 880, t));
  const golden = sn.up * (1 - smooth(10, 26, sn.el));
  const low = 1 - smooth(4, 30, sn.el);
  const sunCol = mix(hex('#fff6dc'), hex('#ff7436'), low);
  const side = Math.cos(sn.theta) * sn.up;
  const elR = (Math.max(sn.el, 5) * Math.PI) / 180;
  const shadowLen = Math.min(3.2, 1 / Math.tan(elR));
  return {
    t,
    sky: s,
    light: lc,
    I: li,
    sun: sn,
    sunCol,
    night,
    noon,
    golden,
    side,
    shadow: { k: (side >= 0 ? 1 : -1) * shadowLen * 0.5, op: sn.up * 0.34 },
    stars: Math.max(1 - smooth(328, 360, t), smooth(1095, 1165, t)),
    milky: Math.max((1 - smooth(300, 340, t)) * 0.6, smooth(1150, 1240, t)),
    cloudOp: track(CLOUD, t)[0],
    cloudCol: mix(mix(lc, [255, 255, 255], 0.35 * (1 - night)), s.mid, 0.25 + night * 0.5),
    beams: Math.max(smooth(1075, 1125, t), 1 - smooth(335, 362, t)),
    fire: smooth(1170, 1250, t),
  };
}

// Light a base material for a depth layer with a fog amount.
export function shade(p, base, fog) {
  const L = p.light;
  const I = p.I;
  const top = p.sky.top;
  const c = [0, 1, 2].map((i) => base[i] * (L[i] / 255) * I + base[i] * (top[i] / 255) * 0.3);
  const fk = clamp(fog * (1 + 0.3 * p.noon - 0.35 * p.night), 0, 0.92);
  const f = mix(c, p.sky.hor, fk);
  const k = 0.07 + 0.18 * p.side;
  const flat = 1 - p.night * 0.6;
  return {
    A: f.map((v) => v * (1 + k * flat)),
    B: f.map((v) => v * (1 - k * flat)),
    C: f,
  };
}
