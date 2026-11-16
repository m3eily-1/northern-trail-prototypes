// Procedural panorama of the north, built once per window size. Every band is
// one long strip that the drive scene slides at its own speed (parallax).
// Bands: far ridges (Tuwaiq escarpment, Aja near Hail), rolling hills, dunes
// with Qassim farms, mud-brick villages, palms, and the near roadside.
import { asset, rng, smooth, clamp } from './util.js';
import { stopSign, regionSign, endSign } from './signs.js';

export const LEAD = 0.5; // stops of road before the first and after the last sign
export const LAYERS = { far: 0.03, hills: 0.09, dune: 0.22, vil: 0.42, palm: 0.62, near: 1 };

// Region weights along the journey (stop index 0..15).
export function regionAt(J) {
  const q = smooth(6.6, 7.6, J);
  const h = smooth(12.6, 13.6, J);
  return { riyadh: 1 - q, qassim: q * (1 - h), hail: h };
}

const ICON = (n) => asset(`assets/img/icon-${n}.png`);
const ICON_RATIO = { 1: 640 / 555, 2: 585 / 640, 3: 640 / 358, 4: 635 / 640, 5: 640 / 517, 6: 640 / 615 };

export function layerLength(W, G, f, n) {
  return Math.ceil(W + (n - 1 + LEAD * 2) * G * f + 8);
}

function path(len, h, fn, step = 12) {
  let d = `M0 ${h} L0 ${(h - fn(0)).toFixed(1)}`;
  for (let x = step; x <= len + step; x += step) d += ` L${x} ${(h - fn(x)).toFixed(1)}`;
  return `${d} L${len + step} ${h} Z`;
}

const svg = (w, h, cls, inner) =>
  `<svg class="${cls}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${inner}</svg>`;

// Far band: three ridges that rise and sink with the region (they barely slide).
function farBand(W, H, G, n) {
  const len = layerLength(W, G, LAYERS.far, n);
  const h = Math.round(H * 0.75); // svg covers the bottom 75% of the window
  const base = h - H * 0.37; // height of the horizon line (window y = 0.62H)
  const r = rng(11);
  const ph = [r() * 6, r() * 6, r() * 6];

  // Tuwaiq escarpment: long flat mesas with cliff steps.
  const mesa = (x) => {
    const step = Math.floor(x / 260);
    const lift = [0.06, 0.08, 0.05, 0.09, 0.07, 0.065][step % 6] * H;
    const edge = smooth(0, 40, x % 260) * (1 - smooth(200, 260, x % 260) * 0.35);
    return base + lift * (0.72 + 0.28 * edge) + Math.sin(x / 33 + ph[0]) * 2;
  };
  // Qassim: low and gentle.
  const low = (x) => base + H * 0.02 * (1 + Math.sin(x / 140 + ph[1]) * 0.6 + Math.sin(x / 47) * 0.2);
  // Aja: jagged granite peaks.
  const tri = (x, p) => {
    const k = (x / p) % 1;
    return 1 - Math.abs(k * 2 - 1);
  };
  const aja = (x) =>
    base + H * (0.05 + 0.15 * Math.pow(tri(x + 90, 330), 1.6) + 0.07 * Math.pow(tri(x + 20, 141), 2) + 0.025 * tri(x, 37));

  // A few long, flat cloud streaks high in the sky.
  let clouds = '';
  const cr = rng(5);
  for (let x = 40; x < len; x += 260 + cr() * 360) {
    const cw = 140 + cr() * 260;
    clouds += `<i class="cloud" style="inset-inline-start:${x.toFixed(0)}px;top:${(10 + cr() * 22).toFixed(1)}%;width:${cw.toFixed(0)}px;--o:${(0.35 + cr() * 0.4).toFixed(2)}"></i>`;
  }
  return {
    len,
    html:
      clouds +
      svg(len, h, 'ridge ridge--low', `<path d="${path(len, h, low, 16)}"/>`) +
      svg(len, h, 'ridge ridge--mesa', `<path d="${path(len, h, mesa, 8)}"/>`) +
      svg(len, h, 'ridge ridge--aja', `<path d="${path(len, h, aja, 6)}"/>`)
  };
}

function hillsBand(W, H, G, n) {
  const len = layerLength(W, G, LAYERS.hills, n);
  const h = Math.round(H * 0.42);
  const base = h - H * 0.1;
  const r = rng(23);
  const a = r() * 6;
  const fn = (x) => base + H * 0.035 * (1 + Math.sin(x / 210 + a)) + H * 0.012 * Math.sin(x / 63 + a * 2);
  return { len, html: svg(len, h, 'hills', `<path d="${path(len, h, fn, 14)}"/>`) };
}

function duneBand(W, H, G, n, Jx) {
  const len = layerLength(W, G, LAYERS.dune, n);
  const h = Math.round(H * 0.34);
  const r = rng(37);
  const p1 = r() * 6;
  const p2 = r() * 6;
  const amp = (x) => {
    const w = regionAt(Jx(x));
    return H * (0.075 * w.riyadh + 0.018 * w.qassim + 0.05 * w.hail);
  };
  const back = (x) => H * 0.24 + amp(x) * Math.pow(Math.abs(Math.sin(x / 190 + p1)), 0.8);
  const front = (x) => H * 0.19 + amp(x) * 0.7 * Math.pow(Math.abs(Math.sin(x / 120 + p2)), 1.2);

  // Qassim farms: rows of green fields on the flat land.
  let farms = '';
  const fr = rng(41);
  for (let x = 0; x < len; ) {
    const w = 80 + fr() * 220;
    const q = regionAt(Jx(x + w / 2)).qassim;
    if (q > 0.6 && fr() > 0.25) {
      const y = h - H * 0.21 - fr() * H * 0.02;
      const fh = H * (0.016 + fr() * 0.012);
      const c = fr() > 0.5 ? 'farm farm--a' : 'farm farm--b';
      farms += `<path class="${c}" d="M${x.toFixed(0)} ${(y + fh).toFixed(1)} L${(x + 10).toFixed(0)} ${y.toFixed(1)} L${(x + w).toFixed(0)} ${y.toFixed(1)} L${(x + w - 10).toFixed(0)} ${(y + fh).toFixed(1)} Z"/>`;
    }
    x += w + 12 + fr() * 60;
  }
  return {
    len,
    html: svg(len, h, 'dunes', `<path class="dune dune--back" d="${path(len, h, back, 10)}"/>${farms}<path class="dune dune--front" d="${path(len, h, front, 10)}"/>`)
  };
}

// A small Najdi mud-brick cluster: boxes with stepped triangle crenellations.
function mudCluster(r, H) {
  const blocks = 2 + Math.floor(r() * 3);
  const unit = H * 0.026;
  let x = 0;
  let out = '';
  let maxH = 0;
  const shades = ['#c88c3c', '#b67a38', '#a46a32', '#d39a50'];
  for (let i = 0; i < blocks; i++) {
    const w = unit * (3 + Math.floor(r() * 4));
    const hh = unit * (2.5 + Math.floor(r() * 4));
    const tower = r() > 0.72;
    const bh = tower ? hh * 1.6 : hh;
    maxH = Math.max(maxH, bh + unit);
    out += `<g data-x="${x}" data-w="${w}" data-h="${bh}" data-c="${shades[Math.floor(r() * shades.length)]}"></g>`;
    x += w - unit * 0.4;
  }
  const W = Math.ceil(x + unit);
  const Ht = Math.ceil(maxH);
  // Second pass: draw with known height.
  out = out.replace(/<g data-x="([\d.]+)" data-w="([\d.]+)" data-h="([\d.]+)" data-c="(#\w+)"><\/g>/g, (_, sx, sw, sh, c) => {
    const bx = +sx;
    const bw = +sw;
    const bh = +sh;
    const top = Ht - bh;
    let s = `<rect x="${bx.toFixed(1)}" y="${top.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${c}"/>`;
    // crenellations
    const teeth = Math.max(2, Math.floor(bw / (unit * 0.9)));
    const tw = bw / teeth;
    for (let k = 0; k < teeth; k++) {
      const tx = bx + k * tw;
      s += `<path d="M${tx.toFixed(1)} ${top.toFixed(1)} L${(tx + tw / 2).toFixed(1)} ${(top - unit * 0.55).toFixed(1)} L${(tx + tw).toFixed(1)} ${top.toFixed(1)} Z" fill="${c}"/>`;
    }
    // window slits and a door
    const rows = Math.max(1, Math.floor(bh / (unit * 2.2)));
    for (let k = 0; k < rows; k++) {
      const wy = top + unit * 0.9 + k * unit * 2;
      if (wy > Ht - unit * 1.8) break;
      s += `<rect x="${(bx + bw * 0.3).toFixed(1)}" y="${wy.toFixed(1)}" width="${(unit * 0.38).toFixed(1)}" height="${(unit * 0.8).toFixed(1)}" fill="#6b3a21"/>`;
      if (bw > unit * 4) s += `<rect x="${(bx + bw * 0.62).toFixed(1)}" y="${wy.toFixed(1)}" width="${(unit * 0.38).toFixed(1)}" height="${(unit * 0.8).toFixed(1)}" fill="#6b3a21"/>`;
    }
    s += `<rect x="${(bx + bw * 0.12).toFixed(1)}" y="${top.toFixed(1)}" width="${(bw * 0.06).toFixed(1)}" height="${bh.toFixed(1)}" fill="rgba(255,245,200,.16)"/>`;
    return s;
  });
  return { w: W, h: Ht, html: `<svg class="mud" width="${W}" height="${Ht}" viewBox="0 0 ${W} ${Ht}" aria-hidden="true" focusable="false">${out}</svg>` };
}

function place(x, inner, bottomPct, extra = '') {
  return `<div class="it" style="inset-inline-start:${x.toFixed(0)}px;bottom:${bottomPct}%${extra}">${inner}</div>`;
}

function villageBand(W, H, G, n, Jx) {
  const len = layerLength(W, G, LAYERS.vil, n);
  const r = rng(53);
  const pick = (w) => {
    const v = r();
    if (w.hail > 0.5) return [3, 6, 'mud', 1, 3, 6][Math.floor(v * 6)];
    if (w.qassim > 0.5) return [5, 'mud', 4, 'mud', 5][Math.floor(v * 5)];
    return [4, 'mud', 1, 'mud', 5, 4][Math.floor(v * 6)];
  };
  let out = '';
  for (let x = 40; x < len - 40; ) {
    const w = regionAt(Jx(x));
    const kind = pick(w);
    if (kind === 'mud') {
      const m = mudCluster(r, H);
      out += place(x, m.html, 25.5);
      x += m.w + 120 + r() * 260;
    } else {
      const hh = H * (kind === 3 ? 0.17 : kind === 6 ? 0.22 : 0.2 + r() * 0.07);
      const ww = hh * ICON_RATIO[kind];
      out += place(x, `<img src="${ICON(kind)}" alt="" width="${ww.toFixed(0)}" height="${hh.toFixed(0)}" decoding="async" draggable="false">`, 24.5);
      x += ww + 160 + r() * 320;
    }
  }
  return { len, html: out };
}

function palmBand(W, H, G, n, Jx) {
  const len = layerLength(W, G, LAYERS.palm, n);
  const r = rng(71);
  let out = '';
  for (let x = 20; x < len - 20; ) {
    const w = regionAt(Jx(x));
    const dense = w.qassim;
    const gap = dense > 0.5 ? 46 + r() * 90 : w.hail > 0.5 ? 380 + r() * 520 : 200 + r() * 420;
    const group = dense > 0.5 ? 1 : 1 + Math.floor(r() * 3);
    for (let g = 0; g < group && x < len - 20; g++) {
      const hh = H * (0.17 + r() * 0.15) * (dense > 0.5 ? 1 : 0.9);
      const ww = hh * ICON_RATIO[2];
      const flip = r() > 0.5 ? ';--sx:-1' : '';
      out += place(x, `<img src="${ICON(2)}" alt="" width="${ww.toFixed(0)}" height="${hh.toFixed(0)}" decoding="async" draggable="false">`, (15.5 + r() * 1.5).toFixed(1), flip);
      x += ww * (0.45 + r() * 0.3);
    }
    x += gap;
  }
  return { len, html: out };
}

function nearBand(W, H, G, data) {
  const n = data.stops.length;
  const len = layerLength(W, G, 1, n);
  const signX = (k) => (k + LEAD) * G + W * 0.66;
  let out = '<i class="ground"></i><i class="posts"></i><i class="posts posts--refl"></i>';
  const firstOf = {};
  data.stops.forEach((s, i) => {
    if (firstOf[s.region] == null) firstOf[s.region] = i;
  });
  data.regions.forEach((rg) => {
    const k = firstOf[rg.key];
    if (k == null) return;
    out += regionSign(rg, (k - 0.5 + LEAD) * G + W * 0.5);
  });
  data.stops.forEach((s, i) => (out += stopSign(s, signX(i))));
  out += endSign((n - 0.5 + LEAD) * G + W * 0.5);
  return { len, html: out };
}

// Build all bands. Returns html + length per band.
export function buildScenery(W, H, G, data) {
  const n = data.stops.length;
  const Jx = (f) => (x) => clamp((x - W * 0.5) / (G * f) - LEAD, -1, n);
  return {
    far: farBand(W, H, G, n),
    hills: hillsBand(W, H, G, n),
    dune: duneBand(W, H, G, n, Jx(LAYERS.dune)),
    vil: villageBand(W, H, G, n, Jx(LAYERS.vil)),
    palm: palmBand(W, H, G, n, Jx(LAYERS.palm)),
    near: nearBand(W, H, G, data)
  };
}
