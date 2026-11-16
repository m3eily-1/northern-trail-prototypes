// Hand-drawn landscape silhouettes, generated as SVG strings.
// Every tile is TW x TH units, seamless (periodic ridges, objects kept off the edges).
// Fills are CSS variables (--c<layer><material><face>) so the time engine can relight them.
// Casting objects use var(--sh, ...) so a <use> clone can turn them into a ground shadow.

export const TW = 3000;
export const TH = 1000;

const r1 = (v) => Math.round(v * 10) / 10;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rr = (rnd, a, b) => a + (b - a) * rnd();

// fill helpers
const F = (L, m, f) => `style="fill:var(--sh,var(--c${L}${m}${f}))"`;
const G = (L, m, f = 'C') => `style="fill:var(--c${L}${m}${f})"`;

const poly = (pts, st) => `<path d="M${pts.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L')}Z" ${st}/>`;

function smoothClosed(pts) {
  const n = pts.length;
  let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
  }
  return d + 'Z';
}

// periodic noise: integer frequencies over the tile width
function pnoise(rnd, amp, freqs) {
  const terms = freqs.map((f) => [rr(rnd, 0.4, 1) * amp, f, rr(rnd, 0, Math.PI * 2)]);
  const sum = terms.reduce((s, t) => s + t[0], 0) || 1;
  return (x) => (terms.reduce((s, [a, f, p]) => s + a * Math.sin((2 * Math.PI * f * x) / TW + p), 0) * amp) / sum;
}

const wrapDx = (x, px) => ((((x - px + TW / 2) % TW) + TW) % TW) - TW / 2;

// Peak feature (mountain or dune); periodic so a slope can wrap across the seam.
function peak(px, py, kl, kr, p = 1, jit = null) {
  return {
    px,
    y: (x) => {
      const dx = wrapDx(x, px);
      const k = dx < 0 ? kl : kr;
      return py + (k * Math.pow(Math.abs(dx), p)) / Math.pow(100, p - 1) + (jit ? jit(x) : 0);
    },
  };
}
// Flat-topped mesa
function mesa(x0, x1, top, slope, jit = null) {
  return {
    px: x1,
    y: (x) => {
      const c = (x0 + x1) / 2;
      const dx = wrapDx(x, c);
      const half = (x1 - x0) / 2;
      const over = Math.abs(dx) - half;
      return top + (over > 0 ? over * slope : 0) + (jit ? jit(x) : 0);
    },
  };
}

function envelope(base, feats, step = 8) {
  const pts = [];
  for (let x = 0; x <= TW + 0.01; x += step) {
    let y = base(x);
    let o = -1;
    for (let i = 0; i < feats.length; i++) {
      const v = feats[i].y(x);
      if (v < y) {
        y = v;
        o = i;
      }
    }
    pts.push([x, y, o]);
  }
  return pts;
}
const areaD = (pts, bottom = TH) =>
  `M0 ${bottom}L${pts.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L')}L${TW} ${bottom}Z`;

// shaded facets: the side of each feature facing away from the light-left
function facets(pts, feats, bottom, st) {
  let out = '';
  let run = [];
  const flush = () => {
    if (run.length > 2) {
      const a = run[0];
      const b = run[run.length - 1];
      const poly2 = run.map((p) => [p[0], p[1]]);
      poly2.push([b[0], bottom], [a[0] + (b[0] - a[0]) * 0.28, bottom]);
      out += poly(poly2, st);
    }
    run = [];
  };
  for (const p of pts) {
    const o = p[2];
    if (o >= 0 && wrapDx(p[0], feats[o].px) >= 0) {
      if (run.length && run[run.length - 1][2] !== o) flush();
      run.push(p);
    } else flush();
  }
  flush();
  return out;
}

function ridgeLayer(L, m, base, feats, bottom, shadeBottom, step = 8) {
  const pts = envelope(base, feats, step);
  return `<path d="${areaD(pts, bottom)}" ${G(L, m, 'A')}/>` + facets(pts, feats, shadeBottom, G(L, m, 'B'));
}

/* ---------- objects ---------- */

function crenels(L, m, x0, x1, top, size, faceFor) {
  const n = Math.max(2, Math.round((x1 - x0) / (size * 1.25)));
  const w = (x1 - x0) / n;
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = x0 + i * w + w * 0.1;
    const b = x0 + (i + 1) * w - w * 0.1;
    s += poly([[a, top + 0.5], [(a + b) / 2, top - size], [b, top + 0.5]], F(L, m, faceFor((a + b) / 2)));
  }
  return s;
}

function vents(L, x, y, s) {
  // Najdi triangular vents: two below, one above
  const t = (cx, cy) => poly([[cx - s / 2, cy], [cx, cy - s * 1.1], [cx + s / 2, cy]], F(L, 'dark', 'C'));
  return t(x - s * 0.62, y) + t(x + s * 0.62, y) + t(x, y - s * 1.25);
}

function tower(L, x, g, w, h, rnd) {
  const wt = w * 0.8;
  const top = g - h;
  const split = 0.58;
  const xl0 = x - w / 2;
  const xr0 = x + w / 2;
  const xl1 = x - wt / 2;
  const xr1 = x + wt / 2;
  const xs0 = xl0 + w * split;
  const xs1 = xl1 + wt * split;
  let s = '';
  s += poly([[xl0, g], [xl1, top], [xs1, top], [xs0, g]], F(L, 'mud', 'A'));
  s += poly([[xs0, g], [xs1, top], [xr1, top], [xr0, g]], F(L, 'mud', 'B'));
  const cw = wt * 1.08;
  s += poly([[x - cw / 2, top - 1], [x + cw / 2, top - 1], [x + cw / 2, top + 6], [x - cw / 2, top + 6]], F(L, 'dark', 'C'));
  s += crenels(L, 'mud', x - cw / 2, x + cw / 2, top - 1, 12, (cx) => (cx < xs1 ? 'A' : 'B'));
  // ledge bands
  [0.34, 0.66].forEach((r) => {
    const y = g - h * r;
    const half = (w / 2) * (1 - r) + (wt / 2) * r;
    s += poly([[x - half - 1, y], [x + half + 1, y], [x + half + 1, y + 3], [x - half - 1, y + 3]], F(L, 'dark', 'C'));
  });
  // vents on the lit face, slit on the side
  const rows = h > 180 ? [0.22, 0.5, 0.8] : [0.3, 0.7];
  rows.forEach((r) => {
    const y = g - h * r + 10;
    const lx = (xl0 * (1 - r) + xl1 * r + xs0 * (1 - r) + xs1 * r) / 2;
    s += vents(L, lx, y, 6);
    const rx = (xs0 * (1 - r) + xs1 * r + xr0 * (1 - r) + xr1 * r) / 2;
    s += poly([[rx - 2, y], [rx - 2, y - 12], [rx + 2, y - 12], [rx + 2, y]], F(L, 'dark', 'C'));
  });
  if (rnd() > 0.5) {
    const y = g;
    const dx = (xl0 + xs0) / 2;
    s += poly([[dx - 9, y], [dx - 9, y - 26], [dx + 9, y - 26], [dx + 9, y]], F(L, 'dark', 'C'));
  }
  return s;
}

function wall(L, x0, x1, g, h, rnd, gate = null) {
  let s = poly([[x0, g + 2], [x0, g - h], [x1, g - h], [x1, g + 2]], F(L, 'mud', 'C'));
  s += poly([[x0, g - h], [x1, g - h], [x1, g - h + 5], [x0, g - h + 5]], F(L, 'mud', 'B'));
  s += crenels(L, 'mud', x0, x1, g - h, 10, () => 'C');
  for (let x = x0 + 50; x < x1 - 30; x += rr(rnd, 80, 120)) {
    if (gate !== null && Math.abs(x - gate) < 40) continue;
    s += vents(L, x, g - h * 0.5, 5);
  }
  if (gate !== null) {
    s += poly([[gate - 16, g + 2], [gate - 16, g - h * 0.66], [gate + 16, g - h * 0.66], [gate + 16, g + 2]], F(L, 'dark', 'C'));
    s += poly([[gate - 22, g - h * 0.66 - 6], [gate + 22, g - h * 0.66 - 6], [gate + 22, g - h * 0.66], [gate - 22, g - h * 0.66]], F(L, 'mud', 'B'));
  }
  return s;
}

function house(L, x, g, w, h, d, rnd) {
  let s = poly([[x, g + 2], [x, g - h], [x + w, g - h], [x + w, g + 2]], F(L, 'mud', 'A'));
  s += poly([[x + w, g + 2], [x + w, g - h], [x + w + d, g - h], [x + w + d, g + 2]], F(L, 'mud', 'B'));
  s += crenels(L, 'mud', x, x + w + d, g - h, 9, (cx) => (cx < x + w ? 'A' : 'B'));
  s += poly([[x + w * 0.3, g + 2], [x + w * 0.3, g - h * 0.5], [x + w * 0.3 + 18, g - h * 0.5], [x + w * 0.3 + 18, g + 2]], F(L, 'dark', 'C'));
  s += vents(L, x + w * 0.72, g - h * 0.62, 5);
  if (rnd() > 0.4) s += vents(L, x + w * 0.16, g - h * 0.7, 5);
  return s;
}

function palm(L, x, g, h, sc, lean, rnd) {
  const cx = x + lean;
  const cy = g - h;
  const w0 = 7 * sc;
  const w1 = 4.5 * sc;
  const mx = x + lean * 0.35;
  const my = g - h * 0.5;
  let s = `<path d="M${r1(x - w0)} ${g + 2}Q${r1(mx - w0 * 0.9)} ${r1(my)} ${r1(cx - w1)} ${r1(cy)}L${r1(cx + w1)} ${r1(cy)}Q${r1(mx + w0 * 0.9)} ${r1(my)} ${r1(x + w0)} ${g + 2}Z" ${F(L, 'trunk', 'C')}/>`;
  const angles = [-172, -150, -128, -106, -88, -68, -46, -24, -6, 160, 20];
  angles.forEach((a0) => {
    const a = ((a0 + rr(rnd, -6, 6)) * Math.PI) / 180;
    const len = 58 * sc * rr(rnd, 0.82, 1.12);
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const droop = len * (0.3 + 0.25 * (1 - Math.abs(dy)));
    const tx = cx + dx * len;
    const ty = cy + dy * len * 0.75 + droop;
    const c1x = cx + dx * len * 0.55;
    const c1y = cy + dy * len * 0.6 - len * 0.12;
    const nx = -dy;
    const wdt = 7 * sc;
    const c2x = c1x + nx * wdt;
    const c2y = c1y + dx * wdt + wdt * 0.6;
    const face = dx < -0.05 ? 'A' : dx > 0.05 ? 'B' : 'C';
    s += `<path d="M${r1(cx)} ${r1(cy)}Q${r1(c1x)} ${r1(c1y)} ${r1(tx)} ${r1(ty)}Q${r1(c2x)} ${r1(c2y)} ${r1(cx)} ${r1(cy + 3 * sc)}Z" ${F(L, 'palm', face)}/>`;
  });
  return s;
}

function acacia(L, x, g, h, w, rnd) {
  const top = g - h;
  let s = `<path d="M${x - 4} ${g + 2}L${x - 3} ${r1(g - h * 0.45)}L${r1(x - w * 0.22)} ${r1(top + 10)}L${r1(x - w * 0.18)} ${r1(top + 12)}L${x + 1} ${r1(g - h * 0.5)}L${r1(x + w * 0.2)} ${r1(top + 10)}L${r1(x + w * 0.24)} ${r1(top + 13)}L${x + 4} ${r1(g - h * 0.4)}L${x + 4} ${g + 2}Z" ${F(L, 'trunk', 'C')}/>`;
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const a = Math.PI + (Math.PI * i) / 10;
    pts.push([x + Math.cos(a) * w * 0.5 * rr(rnd, 0.92, 1.05), top + 14 + Math.sin(a) * 26 * rr(rnd, 0.8, 1.2)]);
  }
  pts.push([x + w * 0.42, top + 22], [x - w * 0.42, top + 22]);
  s += `<path d="${smoothClosed(pts)}" ${F(L, 'palm', 'B')}/>`;
  const hi = pts.slice(0, 6).concat([[x, top + 16], [x - w * 0.4, top + 18]]);
  s += `<path d="${smoothClosed(hi)}" ${F(L, 'palm', 'A')}/>`;
  return s;
}

function shrub(L, x, g, w, h, m = 'palm') {
  return (
    poly([[x - w / 2, g + 2], [x - w * 0.42, g - h * 0.6], [x - w * 0.2, g - h], [x + w * 0.05, g - h * 0.92], [x + w * 0.05, g + 2]], F(L, m, 'A')) +
    poly([[x + w * 0.05, g + 2], [x + w * 0.05, g - h * 0.92], [x + w * 0.3, g - h * 0.8], [x + w / 2, g - h * 0.3], [x + w / 2, g + 2]], F(L, m, 'B'))
  );
}

function boulder(L, m, x, g, rx, ry, rnd) {
  const cy = g - ry * 0.85;
  const pts = [];
  for (let i = 0; i < 9; i++) {
    const a = (Math.PI * 2 * i) / 9 - Math.PI / 2;
    const j = rr(rnd, 0.86, 1.12);
    pts.push([x + Math.cos(a) * rx * j, Math.min(g + 3, cy + Math.sin(a) * ry * j)]);
  }
  let s = `<path d="${smoothClosed(pts)}" ${F(L, m, 'A')}/>`;
  const sh = pts.filter((p, i) => i >= 1 && i <= 5);
  sh.push([x + rx * 0.05, cy + ry * 0.2], [x + rx * 0.12, cy - ry * 0.6]);
  s += `<path d="${smoothClosed(sh)}" ${F(L, m, 'B')}/>`;
  return s;
}

function outcrop(L, x, g, w, h, rnd, glyphs = true) {
  const P = [
    [x - w * 0.5, g + 3],
    [x - w * 0.36, g - h * 0.3],
    [x - w * 0.3 * rr(rnd, 0.9, 1.1), g - h * 0.55],
    [x - w * 0.52, g - h * 0.8],
    [x - w * 0.22, g - h],
    [x + w * 0.24, g - h * rr(rnd, 0.94, 1)],
    [x + w * 0.52, g - h * 0.78],
    [x + w * 0.3, g - h * 0.52],
    [x + w * 0.4, g - h * 0.24],
    [x + w * 0.52, g + 3],
  ];
  let s = `<path d="${smoothClosed(P)}" ${F(L, 'red', 'A')}/>`;
  const S = [P[5], P[6], P[7], P[8], P[9], [x + w * 0.12, g + 3], [x + w * 0.02, g - h * 0.4], [x + w * 0.1, g - h * 0.82]];
  s += `<path d="${smoothClosed(S)}" ${F(L, 'red', 'B')}/>`;
  // strata
  for (let r = 0.18; r < 0.9; r += rr(rnd, 0.14, 0.2)) {
    const y = g - h * r;
    const half = w * (r > 0.6 ? 0.42 : 0.3);
    s += `<path d="M${r1(x - half)} ${r1(y)}Q${r1(x)} ${r1(y + 4)} ${r1(x + half)} ${r1(y - 2)}" style="fill:none;stroke:var(--sh,var(--c${L}redB));stroke-width:2;opacity:.55"/>`;
  }
  if (glyphs) {
    const gx = x - w * 0.18;
    const gy = g - h * 0.6;
    const st = `style="fill:none;stroke:var(--sh,var(--c${L}glyphC));stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round"`;
    const camel = 'M-10 0Q-6 -9 0 -8Q4 -14 8 -8Q12 -7 13 -3L17 -12L21 -12M-10 0Q0 3 13 -3M-8 0L-9 11M-3 1L-3 11M7 -1L7 11M11 -2L12 11';
    const ibex = 'M-8 0L8 0M-7 0L-8 8M-4 0L-4 8M5 0L5 8M8 0L9 8M8 0L11 -5L13 -4M11 -5Q8 -15 -1 -12M-8 0L-10 -3';
    const man = 'M0 -12L0 -2M-6 -13L0 -8L6 -13M0 -2L-4 6M0 -2L4 6M-1.6 -15.4a1.8 1.8 0 1 0 3.2 0a1.8 1.8 0 1 0 -3.2 0';
    const pick = [camel, ibex, man, camel, ibex];
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const px = gx + rr(rnd, -w * 0.12, w * 0.16);
      const py = gy + i * 24 + rr(rnd, -4, 4);
      s += `<path d="${pick[(i + Math.floor(rnd() * 3)) % pick.length]}" transform="translate(${r1(px)} ${r1(py)}) scale(${r1(rr(rnd, 1, 1.3))})" ${st}/>`;
    }
  }
  return s;
}

function fort(L, x, g, rnd) {
  // rocky hill with a mud fort
  let s = '';
  const hillW = 520;
  const hillH = 150;
  const hp = [];
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (Math.PI * i) / 8;
    hp.push([x + Math.cos(a) * hillW * 0.5, g - Math.max(0, -Math.sin(a)) * hillH * rr(rnd, 0.85, 1.08) + 3]);
  }
  hp.push([x + hillW * 0.5, g + 3], [x - hillW * 0.5, g + 3]);
  s += `<path d="${smoothClosed(hp)}" ${F(L, 'rock', 'A')}/>`;
  s += poly([[x + 20, g - hillH + 6], [x + 150, g - hillH * 0.7], [x + hillW * 0.5, g + 3], [x + 60, g + 3]], F(L, 'rock', 'B'));
  for (let i = 0; i < 5; i++) s += boulder(L, 'rock', x + rr(rnd, -200, 210), g, rr(rnd, 26, 48), rr(rnd, 18, 32), rnd);
  const fg = g - hillH + 14;
  s += poly([[x - 150, fg + 30], [x - 150, fg - 50], [x + 130, fg - 50], [x + 130, fg + 30]], F(L, 'mud', 'A'));
  s += poly([[x + 130, fg + 30], [x + 130, fg - 50], [x + 160, fg - 50], [x + 160, fg + 30]], F(L, 'mud', 'B'));
  s += crenels(L, 'mud', x - 150, x + 160, fg - 50, 9, (cx) => (cx < x + 130 ? 'A' : 'B'));
  s += tower(L, x - 140, fg + 24, 46, 120, rnd);
  s += tower(L, x + 30, fg + 20, 58, 150, rnd);
  s += tower(L, x + 150, fg + 26, 40, 104, rnd);
  return s;
}

function grassTuft(L, x, g, h, m = 'field') {
  return `<path d="M${x - 8} ${g + 2}Q${x - 10} ${g - h * 0.6} ${x - 16} ${g - h}Q${x - 4} ${g - h * 0.5} ${x} ${g - h * 1.1}Q${x + 3} ${g - h * 0.5} ${x + 15} ${g - h * 0.9}Q${x + 9} ${g - h * 0.4} ${x + 8} ${g + 2}Z" ${F(L, m, 'C')}/>`;
}

/* ---------- region tiles per layer ---------- */
// Each returns { ground, cast } (ground drawn first, then the shadow clone, then casters).

const R = {};

// L0 clouds (shared, no region)
export function clouds(seed = 7) {
  const rnd = rng(seed);
  let s = '';
  const xs = [260, 980, 1650, 2380];
  xs.forEach((x0) => {
    const y = rr(rnd, 110, 330);
    const w = rr(rnd, 260, 460);
    const n = 4;
    for (let i = 0; i < n; i++) {
      const cx = x0 + (i - n / 2) * w * 0.22 + rr(rnd, -20, 20);
      const cy = y + rr(rnd, -8, 8);
      const rx = w * rr(rnd, 0.18, 0.32);
      s += `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(rr(rnd, 6, 13))}"/>`;
    }
  });
  return s;
}

/* RIYADH: Tuwaiq-like escarpment, distant Diriyah village, Najdi walls + towers */
R.riyadh = {
  1: () => {
    const rnd = rng(11);
    const base = pnoise(rnd, 4, [3, 7]);
    const feats = [
      mesa(180, 760, 586, 0.32, pnoise(rnd, 3, [40, 70])),
      mesa(1020, 1260, 604, 0.4),
      mesa(1500, 2300, 580, 0.28, pnoise(rnd, 3, [50, 90])),
      mesa(2560, 2800, 600, 0.4),
    ];
    return { ground: ridgeLayer(1, 'rock', (x) => 632 + base(x), feats, TH, 660), cast: '' };
  },
  2: () => {
    const rnd = rng(12);
    const g = 668;
    let s = `<path d="${areaD(envelope((x) => g + pnoise(rnd, 3, [4, 9])(x), []))}" ${G(2, 'sand')}/>`;
    [[300, 9], [1350, 12], [2350, 8]].forEach(([cx, n]) => {
      for (let i = 0; i < n; i++) {
        const x = cx + (i - n / 2) * rr(rnd, 34, 46);
        const w = rr(rnd, 28, 54);
        const h = rr(rnd, 18, 40);
        s += poly([[x, g + 2], [x, g - h], [x + w, g - h], [x + w, g + 2]], G(2, 'mud', rnd() > 0.5 ? 'A' : 'C'));
        s += crenels(2, 'mud', x, x + w, g - h, 5, () => 'C').replace(/var\(--sh,(var\([^)]+\))\)/g, '$1');
      }
      for (let i = 0; i < 3; i++) {
        const x = cx + rr(rnd, -n * 22, n * 22);
        s += tower(2, x, g, rr(rnd, 18, 26), rr(rnd, 60, 104), rnd).replace(/var\(--sh,(var\([^)]+\))\)/g, '$1');
      }
      for (let i = 0; i < 5; i++) {
        s += palm(2, cx + rr(rnd, -n * 30, n * 30), g, rr(rnd, 34, 56), 0.4, rr(rnd, -4, 4), rnd).replace(/var\(--sh,(var\([^)]+\))\)/g, '$1');
      }
    });
    return { ground: s, cast: '' };
  },
  3: () => {
    const rnd = rng(13);
    const g = 735;
    const ground = `<path d="${areaD(envelope((x) => g + pnoise(rnd, 5, [3, 8])(x), []))}" ${G(3, 'sand')}/>`;
    let c = '';
    // compound one
    [330, 700, 790].forEach((x) => (c += palm(3, x, g - 2, rr(rnd, 180, 235), 1.1, rr(rnd, -14, 14), rnd)));
    c += wall(3, 200, 900, g, 74, rnd, 520);
    c += tower(3, 200, g, 76, 214, rnd);
    c += tower(3, 640, g, 62, 168, rnd);
    c += tower(3, 900, g, 80, 242, rnd);
    // watchtower and house
    c += house(3, 1160, g, 170, 108, 28, rnd);
    c += tower(3, 1450, g, 84, 270, rnd);
    [1610, 1690, 1760].forEach((x) => (c += palm(3, x, g, rr(rnd, 170, 230), 1.05, rr(rnd, -16, 16), rnd)));
    // compound two
    c += house(3, 2040, g, 150, 140, 26, rnd);
    [2420, 2500].forEach((x) => (c += palm(3, x, g - 2, rr(rnd, 190, 230), 1.1, rr(rnd, -12, 12), rnd)));
    c += wall(3, 1920, 2620, g, 70, rnd, 2280);
    c += tower(3, 1920, g, 70, 196, rnd);
    c += tower(3, 2620, g, 74, 226, rnd);
    c += shrub(3, 2800, g, 60, 30);
    return { ground, cast: c };
  },
  4: () => {
    const rnd = rng(14);
    const g = 830;
    const feats = [];
    for (let x = 200; x < TW; x += rr(rnd, 380, 620)) feats.push(peak(x, g - rr(rnd, 18, 46), 0.16, 0.26, 1.35));
    const ground = ridgeLayer(4, 'sand', (x) => g + pnoise(rnd, 3, [5, 11])(x), feats, TH, TH, 10);
    let c = '';
    for (let x = 120; x < TW - 100; x += rr(rnd, 240, 420)) c += shrub(4, x, g + 8, rr(rnd, 40, 70), rr(rnd, 22, 36));
    c += acacia(4, 1180, g + 6, 150, 190, rnd);
    c += acacia(4, 2540, g + 6, 120, 160, rnd);
    return { ground, cast: c };
  },
};

/* QASSIM: flat farmland horizon, palm groves, fields */
R.qassim = {
  1: () => {
    const rnd = rng(21);
    let s = `<path d="${areaD(envelope((x) => 632 + pnoise(rnd, 6, [4, 9, 15])(x), []))}" ${G(1, 'sand', 'A')}/>`;
    for (let x = 60; x < TW - 60; x += rr(rnd, 26, 70)) {
      if (rnd() < 0.3) continue;
      s += palm(1, x, 634, rr(rnd, 14, 26), 0.22, 0, rnd).replace(/var\(--sh,(var\([^)]+\))\)/g, '$1');
    }
    return { ground: s, cast: '' };
  },
  2: () => {
    const rnd = rng(22);
    const g = 668;
    let s = `<path d="${areaD(envelope((x) => g + pnoise(rnd, 3, [4, 9])(x), []))}" ${G(2, 'field', 'C')}/>`;
    for (let x = 40; x < TW - 40; x += rr(rnd, 22, 40)) {
      if (Math.sin(x / 210) > 0.75 && rnd() < 0.8) continue;
      s += palm(2, x, g, rr(rnd, 46, 92), rr(rnd, 0.42, 0.6), rr(rnd, -6, 6), rnd).replace(/var\(--sh,(var\([^)]+\))\)/g, '$1');
    }
    return { ground: s, cast: '' };
  },
  3: () => {
    const rnd = rng(23);
    const g = 735;
    let ground = `<path d="${areaD(envelope((x) => g + pnoise(rnd, 3, [3, 7])(x), []))}" ${G(3, 'sand', 'B')}/>`;
    // field strips
    const bands = [[742, 754, 'field', 'A'], [760, 776, 'field', 'C'], [782, 800, 'field', 'A'], [806, 830, 'field', 'C']];
    bands.forEach(([a, b, m, f]) => (ground += `<path d="M0 ${a}L${TW} ${a}L${TW} ${b}L0 ${b}Z" ${G(3, m, f)}/>`));
    for (let x = 30; x < TW; x += 46) ground += `<ellipse cx="${x}" cy="771" rx="14" ry="5" ${G(3, 'palm', 'B')}/>`;
    let c = '';
    const groves = [[160, 6], [820, 4], [1480, 7], [2300, 5]];
    groves.forEach(([x0, n]) => {
      for (let i = 0; i < n; i++) c += palm(3, x0 + i * rr(rnd, 64, 80), g + 2, rr(rnd, 170, 260), rr(rnd, 1.05, 1.3), rr(rnd, -18, 18), rnd);
    });
    c += house(3, 1150, g, 160, 92, 26, rnd);
    c += wall(3, 1080, 1150, g, 44, rnd);
    c += wall(3, 1336, 1420, g, 44, rnd);
    c += house(3, 2700, g, 120, 80, 22, rnd);
    return { ground, cast: c };
  },
  4: () => {
    const rnd = rng(24);
    const g = 830;
    const feats = [];
    for (let x = 300; x < TW; x += rr(rnd, 500, 800)) feats.push(peak(x, g - rr(rnd, 10, 24), 0.12, 0.18, 1.3));
    const ground = ridgeLayer(4, 'sand', (x) => g + pnoise(rnd, 3, [5, 11])(x), feats, TH, TH, 10);
    let c = '';
    for (let x = 80; x < TW - 80; x += rr(rnd, 70, 160)) c += grassTuft(4, x, g + 10, rr(rnd, 18, 34));
    c += palm(4, 760, g + 10, 330, 1.9, -24, rnd);
    c += palm(4, 2140, g + 10, 300, 1.8, 20, rnd);
    for (let x = 300; x < TW - 200; x += rr(rnd, 380, 600)) c += shrub(4, x, g + 8, rr(rnd, 50, 80), rr(rnd, 24, 40), 'field');
    return { ground, cast: c };
  },
};

/* HAIL: the Aja and Salma ranges, granite boulders, a fort on a hill */
R.hail = {
  1: () => {
    const rnd = rng(31);
    const jit = pnoise(rnd, 12, [37, 61, 89]);
    const feats = [
      peak(260, 418, 0.62, 0.8, 1, jit),
      peak(720, 470, 0.7, 0.55, 1, jit),
      peak(1150, 386, 0.58, 0.72, 1, jit),
      peak(1640, 452, 0.66, 0.6, 1, jit),
      peak(2080, 400, 0.6, 0.86, 1, jit),
      peak(2560, 440, 0.7, 0.62, 1, jit),
    ];
    return { ground: ridgeLayer(1, 'rock', (x) => 640 + pnoise(rnd, 4, [5, 9])(x), feats, TH, 700, 6), cast: '' };
  },
  2: () => {
    const rnd = rng(32);
    const jit = pnoise(rnd, 5, [29, 47]);
    const feats = [];
    for (let x = 140; x < TW; x += rr(rnd, 300, 460)) feats.push(peak(x, rr(rnd, 540, 600), 0.18, 0.22, 1.55, jit));
    return { ground: ridgeLayer(2, 'rock', (x) => 668 + pnoise(rnd, 3, [4, 8])(x), feats, TH, 700, 8), cast: '' };
  },
  3: () => {
    const rnd = rng(33);
    const g = 735;
    const ground = `<path d="${areaD(envelope((x) => g + pnoise(rnd, 5, [3, 8])(x), []))}" ${G(3, 'sand', 'B')}/>`;
    let c = '';
    [[260, 6], [980, 4], [2500, 6]].forEach(([x0, n]) => {
      for (let i = 0; i < n; i++) c += boulder(3, 'rock', x0 + rr(rnd, -120, 120), g + 2, rr(rnd, 40, 110), rr(rnd, 30, 80), rnd);
    });
    c += fort(3, 1720, g, rnd);
    c += acacia(3, 620, g, 120, 150, rnd);
    c += acacia(3, 2160, g, 104, 140, rnd);
    c += acacia(3, 2860, g, 90, 110, rnd);
    return { ground, cast: c };
  },
  4: () => {
    const rnd = rng(34);
    const g = 830;
    const ground = `<path d="${areaD(envelope((x) => g + pnoise(rnd, 4, [5, 11])(x), []))}" ${G(4, 'sand', 'B')}/>`;
    let c = '';
    for (let x = 120; x < TW - 100; x += rr(rnd, 180, 340)) c += boulder(4, 'rock', x, g + 8, rr(rnd, 20, 62), rr(rnd, 16, 44), rnd);
    for (let x = 220; x < TW - 100; x += rr(rnd, 300, 520)) c += shrub(4, x, g + 8, rr(rnd, 40, 66), rr(rnd, 22, 34));
    c += acacia(4, 1500, g + 6, 160, 200, rnd);
    return { ground, cast: c };
  },
};

/* JUBBAH: Nafud red dunes, sandstone buttes, rock-art outcrops */
R.jubbah = {
  1: () => {
    const rnd = rng(41);
    const feats = [];
    for (let x = 120; x < TW; x += rr(rnd, 280, 420)) feats.push(peak(x, rr(rnd, 588, 616), 0.1, 0.2, 1.45));
    return { ground: ridgeLayer(1, 'dune', (x) => 640 + pnoise(rnd, 3, [4, 9])(x), feats, TH, 680, 8), cast: '' };
  },
  2: () => {
    const rnd = rng(42);
    const feats = [
      mesa(220, 520, 548, 1.6, pnoise(rnd, 3, [60, 90])),
      mesa(900, 1040, 590, 1.4),
      mesa(1400, 1820, 556, 1.5, pnoise(rnd, 3, [70, 110])),
      mesa(2280, 2480, 576, 1.8),
      mesa(2700, 2820, 604, 1.4),
    ];
    return { ground: ridgeLayer(2, 'red', (x) => 668 + pnoise(rnd, 4, [4, 9])(x), feats, TH, 700, 6), cast: '' };
  },
  3: () => {
    const rnd = rng(43);
    const g = 735;
    const ground = `<path d="${areaD(envelope((x) => g + pnoise(rnd, 5, [3, 8])(x), []))}" ${G(3, 'dune', 'C')}/>`;
    let c = '';
    c += outcrop(3, 360, g, 230, 250, rnd);
    c += outcrop(3, 980, g, 160, 180, rnd, false);
    c += outcrop(3, 1500, g, 260, 290, rnd);
    c += outcrop(3, 2120, g, 180, 200, rnd);
    c += outcrop(3, 2680, g, 240, 230, rnd, false);
    for (let i = 0; i < 6; i++) c += boulder(3, 'red', rr(rnd, 100, TW - 100), g + 2, rr(rnd, 24, 48), rr(rnd, 16, 30), rnd);
    c += shrub(3, 1220, g, 60, 30);
    c += shrub(3, 1860, g, 50, 26);
    return { ground, cast: c };
  },
  4: () => {
    const rnd = rng(44);
    const g = 830;
    const feats = [];
    for (let x = 180; x < TW; x += rr(rnd, 340, 560)) feats.push(peak(x, g - rr(rnd, 26, 60), 0.14, 0.28, 1.4));
    const ground = ridgeLayer(4, 'dune', (x) => g + pnoise(rnd, 3, [5, 11])(x), feats, TH, TH, 10);
    let c = '';
    for (let x = 140; x < TW - 100; x += rr(rnd, 260, 460)) c += shrub(4, x, g + 8, rr(rnd, 40, 70), rr(rnd, 20, 34));
    return { ground, cast: c };
  },
};

// L5 road: shoulder, asphalt, moving dashes, km posts
export function road(region) {
  const m = region === 'jubbah' ? 'dune' : 'sand';
  let s = `<path d="M0 878Q750 872 1500 878T${TW} 878L${TW} ${TH}L0 ${TH}Z" ${G(5, m, 'C')}/>`;
  s += `<path d="M0 908L${TW} 908L${TW} 986L0 986Z" ${G(5, 'road', 'C')}/>`;
  s += `<path d="M0 913L${TW} 913L${TW} 916L0 916Z" ${G(5, 'line', 'C')} opacity=".7"/>`;
  s += `<path d="M0 980L${TW} 980L${TW} 983L0 983Z" ${G(5, 'line', 'C')} opacity=".55"/>`;
  for (let x = 30; x < TW; x += 150) s += `<path d="M${x} 946L${x + 66} 946L${x + 66} 951L${x} 951Z" ${G(5, 'line', 'C')}/>`;
  [640, 2140].forEach((x) => {
    s += `<path d="M${x} 908L${x} 862L${x + 7} 862L${x + 7} 908Z" ${G(5, 'line', 'B')}/>`;
    s += `<path d="M${x} 862L${x + 7} 862L${x + 7} 872L${x} 872Z" fill="#b8412e"/>`;
  });
  return s;
}

export const REGIONS = ['riyadh', 'qassim', 'hail', 'jubbah'];

export function regionTile(region, layer) {
  return R[region][layer]();
}
