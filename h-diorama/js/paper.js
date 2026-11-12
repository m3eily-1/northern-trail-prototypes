// Paper-cut shape generators. Everything is drawn in a 1600 x 1000 viewBox and
// returned as SVG path data, so a layer is just a list of { fill, d } parts.

export const VB_W = 1600;
export const VB_H = 1000;
const BASE = 1060; // shapes run below the visible bottom so the cut never shows

// tiny seeded random so the scenes are identical on every load
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

// smooth ridge through points (Catmull-Rom to Bezier), closed to the base
export function ridge(pts, base = BASE) {
  let d = `M${f(pts[0][0])},${base}L${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return `${d}L${f(pts[pts.length - 1][0])},${base}Z`;
}

// straight-edged ridge (mountains, mesas)
export function jag(pts, base = BASE) {
  return `M${f(pts[0][0])},${base}` + pts.map((p) => `L${f(p[0])},${f(p[1])}`).join('') + `L${f(pts[pts.length - 1][0])},${base}Z`;
}

// closed smooth blob (boulders, bushes)
export function blob(cx, cy, rx, ry, seed = 1, n = 9) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.82 + r() * 0.3;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    if (i === 0) d += `M${f(p1[0])},${f(p1[1])}`;
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
  }
  return d + 'Z';
}

export function circle(cx, cy, r) {
  return `M${f(cx - r)},${f(cy)}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;
}

export function cloud(x, y, w) {
  const h = w * 0.22;
  return (
    circle(x + w * 0.28, y, h * 0.9) +
    circle(x + w * 0.55, y - h * 0.35, h * 1.15) +
    circle(x + w * 0.78, y + h * 0.05, h * 0.8) +
    `M${f(x)},${f(y + h * 0.5)}L${f(x + w)},${f(y + h * 0.5)}L${f(x + w)},${f(y + h * 0.1)}L${f(x)},${f(y + h * 0.1)}Z`
  );
}

// date palm: tapered trunk + drooping fronds
export function palm(x, base, h, lean = 0, s = 1, seed = 1) {
  const r = rng(seed);
  const tx = x + lean;
  const ty = base - h;
  const w0 = 12 * s;
  const w1 = 7 * s;
  let d = `M${f(x - w0)},${base}Q${f(x + lean * 0.2 - w0)},${f(base - h * 0.55)} ${f(tx - w1)},${f(ty)}L${f(tx + w1)},${f(ty)}Q${f(x + lean * 0.2 + w0)},${f(base - h * 0.55)} ${f(x + w0)},${base}Z`;
  const angles = [-172, -148, -124, -100, -78, -54, -30, -8];
  angles.forEach((deg) => {
    const a = ((deg + (r() - 0.5) * 12) * Math.PI) / 180;
    const len = (92 + r() * 28) * s;
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    const tipX = tx + dx * len;
    const tipY = ty + dy * len * 0.7 + len * 0.42;
    const mx = tx + dx * len * 0.55;
    const my = ty + dy * len * 0.55 - len * 0.12;
    const vx = tipX - tx;
    const vy = tipY - ty;
    const vl = Math.hypot(vx, vy) || 1;
    const nx = (-vy / vl) * 14 * s;
    const ny = (vx / vl) * 14 * s;
    d += `M${f(tx)},${f(ty)}Q${f(mx - nx * 0.4)},${f(my - ny * 0.4)} ${f(tipX)},${f(tipY)}Q${f(mx + nx)},${f(my + ny)} ${f(tx)},${f(ty)}Z`;
  });
  return d;
}

// acacia: forked trunk + flat umbrella canopy
export function acacia(x, base, h, w, seed = 3) {
  const top = base - h;
  let d = `M${f(x - 6)},${base}L${f(x - 4)},${f(base - h * 0.45)}L${f(x - w * 0.22)},${f(top + 14)}L${f(x - w * 0.18)},${f(top + 10)}L${f(x + 2)},${f(base - h * 0.52)}L${f(x + w * 0.2)},${f(top + 10)}L${f(x + w * 0.24)},${f(top + 14)}L${f(x + 7)},${f(base - h * 0.42)}L${f(x + 6)},${base}Z`;
  const r = rng(seed);
  const pts = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x - w / 2 + t * w, top - Math.sin(t * Math.PI) * 26 - r() * 10]);
  }
  let c = `M${f(x - w / 2)},${f(top + 16)}`;
  pts.forEach((p) => (c += `L${f(p[0])},${f(p[1])}`));
  c += `L${f(x + w / 2)},${f(top + 16)}Z`;
  return d + c;
}

// Najdi mud building: body + triangular parapet + triangle window holes
export function najdi(x, base, w, h, seed = 2) {
  const r = rng(seed);
  const t = 16;
  const n = Math.max(2, Math.floor(w / t));
  const tw = w / n;
  let d = `M${f(x)},${base}L${f(x)},${f(base - h)}`;
  for (let i = 0; i < n; i++) {
    const px = x + i * tw;
    d += `L${f(px + tw * 0.15)},${f(base - h)}L${f(px + tw * 0.5)},${f(base - h - 11)}L${f(px + tw * 0.85)},${f(base - h)}`;
  }
  d += `L${f(x + w)},${f(base - h)}L${f(x + w)},${base}Z`;
  // window holes (evenodd)
  const rows = Math.max(1, Math.floor(h / 60));
  for (let row = 0; row < rows; row++) {
    const wy = base - h + 28 + row * 54;
    const cols = Math.max(1, Math.floor(w / 46));
    for (let c = 0; c < cols; c++) {
      if (r() < 0.3) continue;
      const wx = x + (w / cols) * (c + 0.5);
      d += `M${f(wx - 6)},${f(wy + 10)}L${f(wx + 6)},${f(wy + 10)}L${f(wx)},${f(wy)}Z`;
    }
  }
  return d;
}

// tapered Najdi watchtower with crenels and slit windows
export function tower(x, base, w, h) {
  const tw = w * 0.74;
  const top = base - h;
  let d = `M${f(x - w / 2)},${base}L${f(x - tw / 2)},${f(top)}`;
  const n = 4;
  for (let i = 0; i < n; i++) {
    const px = x - tw / 2 + (tw / n) * i;
    d += `L${f(px)},${f(top - 14)}L${f(px + tw / n / 2)},${f(top - 14)}L${f(px + tw / n / 2)},${f(top)}`;
  }
  d += `L${f(x + tw / 2)},${f(top - 14)}L${f(x + tw / 2)},${f(top)}L${f(x + w / 2)},${base}Z`;
  for (let i = 0; i < 4; i++) {
    const wy = top + 30 + i * (h / 5);
    d += `M${f(x - 3)},${f(wy)}L${f(x - 3)},${f(wy + 18)}L${f(x + 3)},${f(wy + 18)}L${f(x + 3)},${f(wy)}Z`;
  }
  return d;
}

// fort on a hill: walls + corner towers
export function fort(x, base, w, h) {
  let d = najdi(x, base, w, h * 0.62, 9);
  d += tower(x + 18, base, 40, h);
  d += tower(x + w - 18, base, 40, h * 0.92);
  d += najdi(x + w * 0.32, base - h * 0.62, w * 0.36, h * 0.3, 5);
  return d;
}

export function shrubs(x0, x1, base, count, seed = 5, size = 1) {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < count; i++) {
    const x = x0 + r() * (x1 - x0);
    const s = (14 + r() * 18) * size;
    d += blob(x, base, s * 1.3, s, seed + i * 7, 7);
  }
  return d;
}

export function stars(n, seed, yMax) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ x: r() * VB_W, y: 20 + r() * (yMax - 20), r: 1.4 + r() * 2.6, tw: r() < 0.35 });
  }
  return out;
}
