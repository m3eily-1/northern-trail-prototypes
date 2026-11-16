// Procedural terrain for the Northern Trail flyover.
// World units: 1 unit = 5 km. +x = east, -z = north (geography is never mirrored).

export const GEO = { lng0: 43.76, lat0: 26.37 };
const KZ = 111 / 5; // units per degree latitude
const KX = KZ * Math.cos((GEO.lat0 * Math.PI) / 180);

export function ll(lng, lat) {
  return { x: (lng - GEO.lng0) * KX, z: -(lat - GEO.lat0) * KZ };
}

// ---------- seeded simplex noise (2D) ----------
function mulberry(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const rand = mulberry(1200);

const perm = new Uint8Array(512);
(() => {
  const r = mulberry(16);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const t = p[i]; p[i] = p[j]; p[j] = t;
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
})();
const G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

export function simplex(x, y) {
  const s = (x + y) * F2;
  const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t), y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let n = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) { const g = G[perm[ii + perm[jj]] & 7]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) { const g = G[perm[ii + i1 + perm[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) { const g = G[perm[ii + 1 + perm[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
  return 70 * n; // ~[-1, 1]
}

export function fbm(x, y, oct = 4) {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let o = 0; o < oct; o++) { s += a * simplex(x * f, y * f); n += a; a *= 0.5; f *= 2.03; }
  return s / n;
}

function ridged(x, y, oct = 4) {
  let a = 0.5, f = 1, s = 0, n = 0;
  for (let o = 0; o < oct; o++) { s += a * (1 - Math.abs(simplex(x * f, y * f))); n += a; a *= 0.5; f *= 2.1; }
  return s / n;
}

export const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// ---------- polylines ----------
function poly(pts) {
  return pts.map(([lng, lat]) => ll(lng, lat));
}

function distSeg(px, pz, a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  const l2 = dx * dx + dz * dz || 1;
  let t = ((px - a.x) * dx + (pz - a.z) * dz) / l2;
  t = Math.max(0, Math.min(1, t));
  const qx = a.x + dx * t - px, qz = a.z + dz * t - pz;
  return { d: Math.sqrt(qx * qx + qz * qz), cross: dx * (pz - a.z) - dz * (px - a.x) };
}

function distPoly(px, pz, pts) {
  let best = 1e9, side = 1;
  for (let i = 0; i < pts.length - 1; i++) {
    const r = distSeg(px, pz, pts[i], pts[i + 1]);
    if (r.d < best) { best = r.d; side = r.cross; }
  }
  return { d: best, side };
}

// Stylised geography (approximate, for mood, not survey accuracy).
const TUWAIQ = poly([[46.55, 23.6], [46.3, 24.4], [46.02, 25.0], [45.62, 25.7], [45.25, 26.15], [44.95, 26.55]]);
const AJA = poly([[41.2, 27.1], [41.38, 27.45], [41.52, 27.8], [41.6, 27.98]]);
const SALMA = poly([[42.02, 27.62], [42.3, 27.43], [42.55, 27.25]]);
const SINMAN = poly([[40.82, 28.08], [40.9, 28.11]]); // Jabal Umm Sinman beside Jubbah
const RUMMAH = poly([[42.1, 25.55], [42.9, 25.85], [43.45, 26.02], [43.85, 26.2], [44.35, 26.5], [44.9, 26.85], [45.6, 27.3]]);
const THUWAYRAT = poly([[44.35, 26.95], [44.75, 26.45], [45.1, 26.1], [45.55, 25.65]]);
const DAHNA = poly([[44.2, 28.4], [45.6, 27.3], [46.9, 26.1], [47.6, 24.6], [47.8, 23.6]]);
const FARMS = [[43.97, 26.33, 2.4], [43.99, 26.08, 2.0], [44.22, 25.86, 1.8], [43.66, 26.14, 1.6], [43.5, 25.87, 1.6], [43.68, 26.5, 1.2], [44.82, 26.3, 1.4], [41.7, 27.45, 1.2]];

export const LANDMARKS = {
  salma: ll(42.3, 27.43),
  aja: ll(41.4, 27.5),
  nafud: ll(41.6, 28.25),
  qassim: ll(43.9, 26.2),
  diriyah: ll(46.45, 24.85),
};

export const FARM_CENTERS = FARMS.map(([lng, lat, r]) => ({ ...ll(lng, lat), r: r * 4.5 }));

// Builds the height sampler; route = [{x,z}] dense polyline of the trail, stops = [{x,z}].
export function makeField(route, stops) {
  // Coarse spatial hash for route distance.
  const cell = 4;
  const grid = new Map();
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i], b = route[i + 1];
    const x0 = Math.floor(Math.min(a.x, b.x) / cell) - 1, x1 = Math.floor(Math.max(a.x, b.x) / cell) + 1;
    const z0 = Math.floor(Math.min(a.z, b.z) / cell) - 1, z1 = Math.floor(Math.max(a.z, b.z) / cell) + 1;
    for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
      const k = gx + ',' + gz;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(i);
    }
  }
  function routeDist(x, z) {
    const list = grid.get(Math.floor(x / cell) + ',' + Math.floor(z / cell));
    if (!list) return 99;
    let best = 99;
    for (const i of list) { const r = distSeg(x, z, route[i], route[i + 1]); if (r.d < best) best = r.d; }
    return best;
  }

  function sample(x, z) {
    // gentle Najd plain with stepped plateaus
    const n1 = fbm(x * 0.016 + 3.1, z * 0.016 - 7.4, 4);
    let base = 0.45 + n1 * 0.45;
    const t = Math.max(0, base) * 4;
    const fl = Math.floor(t);
    const terr = (fl + smooth(0.72, 0.98, t - fl)) / 4;

    // farm basins and route corridor: smooth (no terraces)
    let farm = 0;
    for (const f of FARM_CENTERS) {
      const d = Math.hypot(x - f.x, z - f.z);
      farm = Math.max(farm, 1 - smooth(f.r * 0.7, f.r * 1.15, d));
    }
    const rd = routeDist(x, z);
    const corridor = 1 - smooth(0.6, 3.2, rd);
    let h = terr + (base - terr) * Math.max(farm, corridor * 0.85);

    // Tuwaiq escarpment: raised plateau east of the line, sharp cliff on the west face
    const tw = distPoly(x, z, TUWAIQ);
    const east = tw.side > 0 ? 1 : -1;
    const sd = tw.d * east;
    const cliffN = fbm(x * 0.12, z * 0.12, 3) * 0.5;
    const esc = smooth(-0.3 + cliffN, 0.9 + cliffN, sd) * (1 - smooth(18, 42, sd)) * 1.15;
    h += esc * (1 - corridor * 0.55);

    // mountains (Aja, Salma) and sandstone outcrop at Jubbah
    let mount = 0;
    const rNoise = ridged(x * 0.22 + 11, z * 0.22 - 5, 4);
    const ja = distPoly(x, z, AJA).d;
    if (ja < 8) { const m = smooth(7.5, 1.2, ja); mount += m * (1.8 + 2.4 * rNoise); }
    const js = distPoly(x, z, SALMA).d;
    if (js < 6) { const m = smooth(5.5, 0.9, js); mount += m * (1.2 + 1.9 * rNoise); }
    const ju = distPoly(x, z, SINMAN).d;
    if (ju < 3.5) { const m = smooth(3.2, 0.4, ju); mount += m * (0.7 + 1.1 * rNoise); }
    // scattered granite knolls around Hail
    const hail = ll(41.69, 27.52);
    const dh = Math.hypot(x - hail.x, z - hail.z);
    if (dh < 22) {
      const k = Math.max(0, ridged(x * 0.35, z * 0.35, 3) - 0.62) * 3.2;
      mount += k * smooth(22, 6, dh);
    }

    // dunes: Nafud (north), Thuwayrat belt, Dahna arc
    const nafud = smooth(-31, -40, z) * (1 - smooth(46, 70, x));
    const thu = smooth(3.4, 0.8, distPoly(x, z, THUWAYRAT).d);
    const dah = smooth(6.5, 2.0, distPoly(x, z, DAHNA).d);
    let dune = Math.max(nafud, thu * 0.9, dah);
    const warp = fbm(x * 0.05, z * 0.05, 3) * 3.2;
    const phase = (x * 0.62 + z * 0.78) * 1.05 + warp;
    const crest = Math.pow(0.5 + 0.5 * Math.sin(phase), 2.4);
    const dSmall = 0.5 + 0.5 * Math.sin(x * 2.1 - z * 1.3 + warp * 2);
    let duneH = (crest * 0.85 + dSmall * 0.12 + 0.12) * dune;

    // Wadi ar-Rummah: shallow green valley through Qassim
    const wd = distPoly(x, z, RUMMAH).d;
    const wadi = Math.exp(-(wd * wd) / (2 * 1.3 * 1.3));
    h -= wadi * 0.45;

    // keep the road corridor and town sites calm
    let town = 0;
    for (const s of stops) {
      const d = Math.hypot(x - s.x, z - s.z);
      if (d < 3.2) town = Math.max(town, 1 - smooth(1.0, 3.2, d));
    }
    const calm = Math.max(corridor, town);
    h += mount * (1 - calm * 0.92) + duneH * (1 - calm * 0.85);

    const green = Math.max(wadi * 0.9, farm * 0.55) * (1 - Math.min(1, mount));
    return { h, mount: Math.min(1, mount / 2.2), dune: dune * (1 - calm * 0.6), esc, green, farm, crest };
  }

  return { sample, routeDist };
}
