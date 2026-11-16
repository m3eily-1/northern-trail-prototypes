// The night sky: seeded star fields, glow sprites, a milky-way band and the
// projection that places the 16 stops by their real latitude and longitude.

export function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const CREAM = '255,245,200';
export const LAVENDER = '160,110,180';
export const LAV_LIGHT = '205,170,222';
export const SAND = '200,140,60';

// Soft round glow used for bright stars, the active flare and the comet head.
export function sprite(rgb = CREAM, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = size / 2;
  const grd = g.createRadialGradient(r, r, 0, r, r, r);
  grd.addColorStop(0, `rgba(${rgb},1)`);
  grd.addColorStop(0.08, `rgba(${rgb},0.9)`);
  grd.addColorStop(0.22, `rgba(${rgb},0.32)`);
  grd.addColorStop(0.5, `rgba(${rgb},0.08)`);
  grd.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grd;
  g.fillRect(0, 0, size, size);
  return c;
}

// Projection: equirectangular, corrected by cos(latitude) so distances read true.
// Returns x/y in "degrees" centred on the bounding box of the given points.
export function makeProjection(points) {
  const lat0 = points.reduce((a, p) => a + p.lat, 0) / points.length;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const xs = points.map((p) => p.lng * k);
  const ys = points.map((p) => -p.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const project = (lat, lng) => ({ x: lng * k - cx, y: -lat - cy });
  return {
    project,
    k,
    w: maxX - minX,
    h: maxY - minY,
    lngAt: (x) => (x + cx) / k,
    latAt: (y) => -(y + cy),
    xAtLng: (lng) => lng * k - cx,
    yAtLat: (lat) => -lat - cy
  };
}

// Star field inside a disc of radius R (px). Mostly faint pin-pricks, a few
// bright ones drawn with the glow sprite, a handful tinted lavender or sand.
export function makeField(count, R, seed = 7) {
  const r = rng(seed);
  const stars = [];
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * R;
    const m = Math.pow(r(), 3.2);
    const tint = r();
    stars.push({
      x: Math.cos(a) * d,
      y: Math.sin(a) * d,
      s: 0.6 + m * 1.6,
      a: 0.25 + m * 0.75,
      big: m > 0.55,
      tw: 0.15 + r() * 0.55,
      sp: 0.6 + r() * 2.2,
      ph: r() * Math.PI * 2,
      c: tint > 0.9 ? LAV_LIGHT : tint > 0.84 ? SAND : CREAM
    });
  }
  return stars;
}

const spriteCache = {};
const sp = (rgb) => (spriteCache[rgb] ||= sprite(rgb, 64));

// Draws the field around the current origin (caller sets translate/rotate).
export function drawField(ctx, stars, time, twinkle = true, alphaMul = 1) {
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    let a = s.a * alphaMul;
    if (twinkle) a *= 1 - s.tw * 0.5 * (1 + Math.sin(time * s.sp + s.ph));
    if (s.big) {
      const size = s.s * 9;
      ctx.globalAlpha = a;
      ctx.drawImage(sp(s.c), s.x - size / 2, s.y - size / 2, size, size);
    } else {
      ctx.globalAlpha = a;
      ctx.fillStyle = `rgb(${s.c})`;
      ctx.fillRect(s.x - s.s / 2, s.y - s.s / 2, s.s, s.s);
    }
  }
  ctx.globalAlpha = 1;
}

// A soft milky-way band, pre-rendered once at low resolution.
export function milkyWay(size = 512, seed = 11) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = rng(seed);
  const h = size / 2;
  const ang = -0.62;
  const dx = Math.cos(ang);
  const dy = Math.sin(ang);
  const gauss = () => (r() + r() + r() + r() - 2) / 2;
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 240; i++) {
    const u = (r() * 2 - 1) * 1.1;
    const v = gauss() * 0.22 + Math.sin(u * 2.4) * 0.06;
    const x = h + u * dx * h - v * dy * h;
    const y = h + u * dy * h + v * dx * h;
    const rad = (0.04 + r() * 0.1) * size;
    const col = r() > 0.4 ? LAVENDER : r() > 0.3 ? SAND : CREAM;
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    grd.addColorStop(0, `rgba(${col},${0.025 + r() * 0.03})`);
    grd.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = grd;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // Blur once to dissolve gradient dithering before the canvas is scaled up.
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const o = out.getContext('2d');
  o.filter = `blur(${Math.round(size / 90)}px)`;
  o.drawImage(c, 0, 0);
  return out;
}

// A small tile of static stars for section backgrounds (CSS background-image).
export function starTile(size = 420, seed = 3) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const r = rng(seed);
  for (let i = 0; i < 70; i++) {
    const m = Math.pow(r(), 3);
    g.fillStyle = `rgba(${r() > 0.9 ? LAV_LIGHT : CREAM},${0.12 + m * 0.5})`;
    const s = 0.8 + m * 1.4;
    g.fillRect(r() * size, r() * size, s, s);
  }
  return c.toDataURL('image/png');
}

// Builds the constellation as an SVG path + star circles inside a viewBox.
export function constellationSVG(stops, { w = 1000, h = 600, pad = 40, cls = '' } = {}) {
  const P = makeProjection(stops);
  const sc = Math.min((w - pad * 2) / P.w, (h - pad * 2) / P.h);
  const pts = stops.map((s) => {
    const p = P.project(s.lat, s.lng);
    return [w / 2 + p.x * sc, h / 2 + p.y * sc];
  });
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return { pts, d, sc, P, w, h, cls };
}
