// Dune silhouettes: real dune profiles have a long gentle windward slope and a
// short steep lee face downwind, so the shapes mirror with the wind in Arabic.
// Layers parallax against the scroll at different depths.
import { rtl, reduced } from './i18n.js';
import { onFrame } from './wind.js';

function rand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// One silhouette path in a W x H box; crest heights between lo..hi (0..1 of H).
export function dunePath(seed, { W = 1440, H = 200, n = 4, lo = 0.25, hi = 0.75 } = {}) {
  const r = rand(seed);
  const segs = [];
  let x = -r() * (W / n) * 0.5;
  while (x < W + 40) {
    const w = (W / n) * (0.7 + r() * 0.6);
    segs.push({ x0: x, w, h: lo + r() * (hi - lo), f: 0.62 + r() * 0.16 });
    x += w;
  }
  const pts = [];
  const step = 8;
  for (let px = 0; px <= W; px += step) {
    let y = 0;
    for (const s of segs) {
      if (px < s.x0 || px > s.x0 + s.w) continue;
      const u = (px - s.x0) / s.w;
      // windward: slow convex rise to the crest at f; lee: steep concave drop
      const v = u < s.f ? Math.sin((u / s.f) * Math.PI * 0.5) ** 1.6 : 1 - ((u - s.f) / (1 - s.f)) ** 0.55;
      y = Math.max(y, v * s.h);
    }
    const X = rtl ? W - px : px;
    pts.push([X, H - y * H]);
  }
  if (rtl) pts.reverse();
  // the base runs well below the band so parallax never opens a gap
  return `M0 ${H + 160} L${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')} L${W} ${H + 160} Z`;
}

// Layered dunes SVG band. layers: [{seed, fill, depth, lo, hi, n}]
export function dunes(layers, cls = '') {
  return `<div class="dunes ${cls}" aria-hidden="true">${layers
    .map(
      (l) =>
        `<svg class="dunes__l" data-depth="${l.depth || 0}" viewBox="0 0 1440 200" preserveAspectRatio="none" focusable="false"><path d="${dunePath(l.seed, l)}" fill="${l.fill}"/></svg>`
    )
    .join('')}</div>`;
}

// Parallax: deeper layers lag the scroll. Only bands near the viewport update.
export function initDunes() {
  if (reduced) return;
  const bands = [...document.querySelectorAll('.dunes')];
  const near = new Set();
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => (e.isIntersecting ? near.add(e.target) : near.delete(e.target))),
    { rootMargin: '20% 0px' }
  );
  bands.forEach((b) => io.observe(b));
  onFrame(() => {
    if (!near.size) return;
    const vh = window.innerHeight;
    for (const b of near) {
      const r = b.getBoundingClientRect();
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 around centre
      for (const l of b.children) {
        const d = +l.dataset.depth;
        if (d) l.style.transform = `translate3d(0, ${(p * d * 60).toFixed(1)}px, 0)`;
      }
    }
  });
}
