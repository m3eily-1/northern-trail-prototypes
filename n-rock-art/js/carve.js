// Carvings: any element `.carve[data-src]` becomes a pecked petroglyph that is
// computed shortly before it scrolls in, chiselled in when it is seen, and lit
// by the torch afterwards (see torch.js). Sources:
//   motif:<name>   a hand-drawn Jubbah motif (camel, ibex, figure, palm, rider, caravan, tip icons)
//   img:<path>     a brand illustration, carved along its colour edges
//   stipple:<path> a photo, pecked by brightness
//   text:<string>  Bukra lettering
import { peck, animatePeck } from './peck.js';
import { lit } from './torch.js';
import { reduced, rtl } from './i18n.js';

const imgCache = new Map();
function loadImg(src) {
  if (!imgCache.has(src)) {
    imgCache.set(
      src,
      new Promise((res, rej) => {
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => res(im);
        im.onerror = rej;
        im.src = src;
      })
    );
  }
  return imgCache.get(src);
}

// HTML for a carving. `ar` is the aspect ratio (w / h).
export function carveHTML(src, { cls = '', ar = 1, floor, seed = 1, spacing, density, flip, edge, pad, scale, fy, label } = {}) {
  const data = [
    `data-src="${src.replace(/"/g, '&quot;')}"`,
    `data-seed="${seed}"`,
    spacing ? `data-spacing="${spacing}"` : '',
    density != null ? `data-density="${density}"` : '',
    flip ? 'data-flip="1"' : '',
    edge ? `data-edge="${edge}"` : '',
    pad != null ? `data-pad="${pad}"` : '',
    scale ? `data-scale="${scale}"` : '',
    fy != null ? `data-fy="${fy}"` : ''
  ].join(' ');
  const style = `--ar:${ar};${floor != null ? `--floor:${floor};` : ''}`;
  return `<div class="carve ${cls}" ${data} style="${style}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><canvas></canvas></div>`;
}

async function prepare(el) {
  if (el.__job) return el.__job;
  el.__job = (async () => {
    const cv = el.querySelector('canvas');
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.max(8, Math.round(el.clientWidth * dpr));
    const h = Math.max(8, Math.round(el.clientHeight * dpr));
    cv.width = w;
    cv.height = h;
    const d = el.dataset;
    const [kind, ...rest] = d.src.split(':');
    const val = rest.join(':');
    let src;
    if (kind === 'motif') src = { kind, name: val, flip: !!d.flip !== rtl };
    else if (kind === 'text') {
      const family = 'nt-bukra';
      try {
        await document.fonts.load(`700 80px ${family}`, val);
      } catch (e) {}
      src = { kind, text: val, family: `${family}, nt-plex, sans-serif`, dir: rtl ? 'rtl' : 'ltr', scale: d.scale ? +d.scale : 0.8 };
    } else src = { kind, img: await loadImg(val), flip: !!d.flip, cover: kind === 'stipple', fy: d.fy != null ? +d.fy : 0.5 };
    return peck(cv, src, {
      dpr,
      seed: +d.seed || 1,
      spacing: d.spacing ? +d.spacing : undefined,
      density: d.density != null ? +d.density : undefined,
      edge: d.edge ? +d.edge : undefined,
      pad: d.pad != null ? +d.pad : undefined,
      rtl
    });
  })();
  return el.__job;
}

async function strike(el) {
  if (el.__struck) return;
  el.__struck = true;
  const job = await prepare(el);
  if (reduced) job.draw(0, job.count);
  else {
    el.classList.add('is-pecking');
    const ms = Math.min(1600, 500 + job.count * 0.05);
    await animatePeck(job, ms);
    el.classList.remove('is-pecking');
  }
  el.classList.add('is-carved');
}

let near;
let seen;
export function initCarvings(scope = document) {
  if (!near) {
    near = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          near.unobserve(e.target);
          (window.requestIdleCallback || setTimeout)(() => prepare(e.target), { timeout: 400 });
        }),
      { rootMargin: '900px 0px' }
    );
    seen = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          seen.unobserve(e.target);
          strike(e.target);
        }),
      { rootMargin: '0px 0px -4% 0px', threshold: 0.1 }
    );
  }
  scope.querySelectorAll('.carve:not([data-carve-init])').forEach((el) => {
    el.setAttribute('data-carve-init', '');
    near.observe(el);
    seen.observe(el);
    lit(el);
  });
}

// Draw immediately (used by the loader and for things above the fold).
export async function carveNow(el, animate = true, ms) {
  el.setAttribute('data-carve-init', '');
  const job = await prepare(el);
  el.__struck = true;
  if (!animate || reduced) job.draw(0, job.count);
  else await animatePeck(job, ms || 1200);
  el.classList.add('is-carved');
  return job;
}
