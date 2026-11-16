// Static 2D map (reduced motion or no WebGL): SVG of the true route + full stop list.
import { ll, LANDMARKS } from './terrain.js';
import { esc, pad, ICON_SVG } from './sections.js';

// label placement per stop: [dx, dy, anchor] (anchor in screen terms, svg is forced ltr)
const LBL = {
  'riyadh': [16, 5, 'start'], 'thadiq': [0, -16, 'middle'], 'al-qasab': [4, 26, 'middle'], 'shaqra': [-4, 28, 'end'],
  'ushaiqer': [-16, 0, 'end'], 'al-majmaah': [16, 5, 'start'], 'al-ghat': [16, 5, 'start'], 'al-zulfi': [14, -10, 'start'],
  'al-mithnab': [0, 26, 'middle'], 'unaizah': [16, 8, 'start'], 'ar-rass': [0, 26, 'middle'], 'buraydah': [14, -12, 'start'],
  'al-bukayriyah': [-16, 5, 'end'], 'uyun-al-jiwa': [0, -16, 'middle'], 'hail': [16, 5, 'start'], 'jubbah': [16, 5, 'start'],
};

// sticker offsets (top-left corner relative to the stop)
const STK = { thadiq: [10, -124], unaizah: [-40, 64], buraydah: [24, -118], hail: [-96, 22], jubbah: [28, -60] };

function smoothPath(pts) {
  let d = `M${pts[0].X.toFixed(1)},${pts[0].Y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.X + (p2.X - p0.X) / 6, c1y = p1.Y + (p2.Y - p0.Y) / 6;
    const c2x = p2.X - (p3.X - p1.X) / 6, c2y = p2.Y - (p3.Y - p1.Y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.X.toFixed(1)},${p2.Y.toFixed(1)}`;
  }
  return d;
}

export function renderStatic(el, c, L, ui) {
  const K = 9, OX = 64, OZ = 54;
  const P = (p) => ({ X: (p.x + OX) * K, Y: (p.z + OZ) * K });
  const pts = c.stops.map((s) => P(ll(s.lng, s.lat)));
  const VW = 128 * K, VH = 98 * K;
  const mtn = (cx, cy, n, s) => Array.from({ length: n }, (_, i) => {
    const x = cx + (i - n / 2) * s * 0.9, y = cy + Math.sin(i * 1.7) * s * 0.4;
    return `<path d="M${x - s},${y + s * 0.6} L${x},${y - s * 0.7} L${x + s},${y + s * 0.6}Z" />`;
  }).join('');
  const aja = P(LANDMARKS.aja), salma = P(LANDMARKS.salma);
  const dunes = Array.from({ length: 9 }, (_, i) => {
    const y = 48 + i * 16, x0 = 40 + (i % 2) * 30;
    return `<path d="M${x0},${y} q30,-12 60,0 t60,0 t60,0 t60,0 t60,0" />`;
  }).join('');

  const stickers = c.stops.map((s, i) => {
    if (!s.sticker) return '';
    const p = pts[i], w = 84, h = 96;
    const [ox, oy] = STK[s.key] || [20, -114];
    return `<image href="../${s.sticker}" x="${(p.X + ox).toFixed(0)}" y="${(p.Y + oy).toFixed(0)}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>`;
  }).join('');

  const markers = c.stops.map((s, i) => {
    const p = pts[i], [dx, dy, an] = LBL[s.key] || [14, 5, 'start'];
    return `<g class="smap__stop"><rect x="${(p.X - 9).toFixed(1)}" y="${(p.Y - 9).toFixed(1)}" width="18" height="18"/>
      <text class="smap__n" x="${p.X.toFixed(1)}" y="${(p.Y + 4).toFixed(1)}" text-anchor="middle">${i + 1}</text>
      <text class="smap__lbl" x="${(p.X + dx).toFixed(1)}" y="${(p.Y + dy).toFixed(1)}" text-anchor="${an}">${esc(s.name[L])}</text></g>`;
  }).join('');

  const regions = c.regions.map((r) => `<li class="smap__reg" data-region="${r.key}"><span class="smap__sw"></span><span class="smap__rn">${esc(r.name[L])}</span><span class="smap__rc">${esc(r.count[L])}</span></li>`).join('');

  const cards = c.stops.map((s, i) => {
    const prev = c.stops[i - 1];
    const drive = s.drive ? `${esc(s.drive[L])} ${ui.from} ${esc(prev.name[L])}` : ui.start;
    return `<li class="scard" data-reveal>
      <div class="scard__media"><img src="../${s.photo}" alt="" loading="lazy" width="600" height="600"></div>
      <div class="scard__body">
        <p class="scard__meta"><span class="scard__num">${pad(i + 1)}</span><span class="scard__of">/ ${pad(c.stops.length)}</span></p>
        <h3 class="scard__name">${esc(s.name[L])}</h3>
        <p class="scard__drive">${ICON_SVG.clock}<span>${drive}</span></p>
        <p class="scard__desc">${esc(s.desc[L])}</p>
      </div>
    </li>`;
  }).join('');

  el.innerHTML = `
  <div class="nt-wrap smap__wrap">
    <header class="smap__head" data-reveal>
      <p class="nt-eyebrow panel__eyebrow">${ui.map}</p>
      <h2 class="nt-h2">${esc(c.hero.title[L])}</h2>
      <ul class="smap__regs">${regions}</ul>
    </header>
    <figure class="smap__fig" data-reveal>
      <svg class="smap__svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${esc(c.hero.sub[L])}">
        <rect width="${VW}" height="${VH}" class="smap__bg"/>
        <g class="smap__dunes">${dunes}</g>
        <g class="smap__mtn">${mtn(aja.X, aja.Y, 5, 18)}${mtn(salma.X, salma.Y, 4, 14)}</g>
        <path class="smap__edge" d="${smoothPath(pts)}"/>
        <path class="smap__road" d="${smoothPath(pts)}"/>
        ${stickers}
        <image href="../${c.stickers.salma}" x="${(salma.X + 18).toFixed(0)}" y="${(salma.Y - 40).toFixed(0)}" width="76" height="82"/>
        ${markers}
      </svg>
    </figure>
    <ol class="scards">${cards}</ol>
  </div>`;
}
