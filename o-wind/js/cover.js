// Sand covers: the signature. An element arrives buried under a layer of sand
// grains (a low-res canvas, one pixel per grain, scaled up crisply). The wind
// erodes it from the upwind edge; every grain that lets go becomes a particle
// that flies off downwind. Scroll speed and pointer sweeps feed the wind; a
// fast swipe over a cover gouges grains out where the pointer passes.
//
// Kinds:
//  rect  - a rippled sand layer over the whole element (photos, cards, hero)
//  text  - grains sampled from the element's own glyphs (headlines)
//  image - grains sampled from an image's alpha (illustrations)
//
// Text stays real DOM underneath; covers are aria-hidden and click-through.
import { wind, onFrame } from './wind.js';
import { spawn, SAND, budget } from './particles.js';
import { reduced, isPhone, clamp } from './i18n.js';

const covers = new Set();
const visible = new Set();
const phone = isPhone();

// ---------- noise ----------
function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y) => vnoise(x, y) * 0.6 + vnoise(x * 2.1 + 17, y * 2.1 + 3) * 0.28 + vnoise(x * 4.3 + 5, y * 4.3 + 11) * 0.12;

// ---------- palettes ----------
// Each palette: [trough, mid, crest] as SAND indices + rgb stops.
const PAL = {
  sand: { stops: [[176, 116, 50], [200, 140, 60], [226, 182, 110], [240, 212, 152]], idx: [1, 2, 3, 4] },
  light: { stops: [[214, 166, 96], [232, 196, 132], [246, 222, 168], [255, 242, 198]], idx: [3, 4, 4, 5] },
  deep: { stops: [[150, 88, 44], [176, 116, 50], [200, 140, 60], [222, 176, 104]], idx: [1, 1, 2, 3] }
};

function lerpStops(stops, f) {
  const n = stops.length - 1;
  const x = clamp(f) * n;
  const i = Math.min(n - 1, Math.floor(x));
  const k = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, Math.round(clamp(f) * n)];
}

// ---------- the cover ----------
class Cover {
  constructor(el, opts) {
    this.el = el;
    this.kind = opts.kind || 'rect';
    this.cell = opts.cell || (phone ? 3 : 2);
    this.pal = PAL[opts.palette || 'sand'];
    this.rate = opts.rate || 0.5; // base progress per second once started
    this.manual = !!opts.manual;
    this.startAt = opts.startAt ?? 0.82; // start when top passes this fraction of vh
    this.spawnScale = (opts.spawn ?? 1) * budget;
    this.img = opts.img || null;
    this.onClear = opts.onClear || null;
    this.ripples = opts.ripples ?? this.kind === 'rect';
    this.p = 0;
    this.started = false;
    this.done = false;
    this.built = false;
    this.canvas = null;
    el.classList.add('sand-wait');
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  }

  build() {
    if (this.done) return;
    const el = this.el;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;
    const cell = this.cell;
    const pad = this.kind === 'text' ? Math.ceil(parseFloat(getComputedStyle(el).fontSize) * 0.18) + 4 : 0;
    const cols = Math.ceil((w + pad * 2) / cell);
    const rows = Math.ceil((h + pad * 2) / cell);
    const N = cols * rows;
    if (N > 400000) return;

    // mask: which cells hold sand
    let mask = null;
    if (this.kind !== 'rect') {
      mask = this.kind === 'text' ? textMask(el, cols, rows, cell, pad) : imageMask(el, this.img, cols, rows, cell);
      // nothing to sample: never leave the content hidden
      if (!mask) return this.finish();
    }

    let canvas = this.canvas;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.className = 'sand-cover';
      canvas.setAttribute('aria-hidden', 'true');
      el.appendChild(canvas);
      this.canvas = canvas;
    }
    canvas.width = cols;
    canvas.height = rows;
    canvas.style.width = `${cols * cell}px`;
    canvas.style.height = `${rows * cell}px`;
    canvas.style.insetInlineStart = '';
    canvas.style.left = `${-pad}px`;
    canvas.style.top = `${-pad}px`;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(cols, rows);
    const d = img.data;
    const cidx = new Uint8Array(N);
    const thr = new Float32Array(N);
    const dir = wind.dir;
    const seed = Math.random() * 100;
    const stops = this.pal.stops;
    const pidx = this.pal.idx;
    let count = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        if (mask && !mask[i]) continue;
        const n = fbm(x / 26 + seed, y / 26);
        let f;
        if (this.ripples) {
          // wind ripples: crests perpendicular to the wind, steep on the lee side
          // broad dune shading + regular ripples with a sharp lee edge
          const big = fbm((x * cell) / 260 + seed, (y * cell) / 170);
          const ph = (x * cell) / 34 + Math.sin((y * cell) / 150 + n * 3) * 0.6 + n * 0.8;
          const s = ph - Math.floor(ph);
          const lee = dir > 0 ? s : 1 - s;
          const r = lee < 0.86 ? lee / 0.86 : (1 - lee) / 0.14;
          f = 0.34 + r * 0.17 + (big - 0.5) * 0.9;
        } else {
          f = 0.3 + (n - 0.5) * 0.9 + (y / rows) * -0.15 + 0.12;
        }
        const g = (hash(x * 3 + 7, y * 5 + 1) - 0.5) * (this.ripples ? 0.26 : 0.32);
        const c = lerpStops(stops, f + g);
        const o = i * 4;
        d[o] = c[0];
        d[o + 1] = c[1];
        d[o + 2] = c[2];
        d[o + 3] = 255;
        cidx[i] = pidx[c[3]];
        // erosion threshold: mostly along the wind, ragged by noise
        const u = dir > 0 ? x / cols : 1 - x / cols;
        thr[i] = u * 0.66 + fbm(x / 14 + 40, y / 14 + seed) * 0.3 + hash(x, y + 99) * 0.04;
        count++;
      }
    }
    // counting sort by threshold
    const Q = 1024;
    const hist = new Uint32Array(Q + 1);
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < N; i++) {
      if (d[i * 4 + 3]) {
        if (thr[i] < lo) lo = thr[i];
        if (thr[i] > hi) hi = thr[i];
      }
    }
    const span = Math.max(1e-6, hi - lo);
    const q = new Uint16Array(N);
    for (let i = 0; i < N; i++) {
      if (!d[i * 4 + 3]) continue;
      const b = Math.min(Q - 1, Math.floor(((thr[i] - lo) / span) * Q));
      q[i] = b;
      hist[b + 1]++;
    }
    for (let b = 1; b <= Q; b++) hist[b] += hist[b - 1];
    const order = new Uint32Array(count);
    for (let i = 0; i < N; i++) if (d[i * 4 + 3]) order[hist[q[i]]++] = i;

    // keep progress across rebuilds (resize)
    const doneN = Math.floor(this.p * count);
    for (let k = 0; k < doneN; k++) d[order[k] * 4 + 3] = 0;

    Object.assign(this, { ctx, img, d, cidx, order, cols, rows, pad, N: count, idx: doneN, built: true, dirty: true });
    ctx.putImageData(img, 0, 0);
    this.el.classList.remove('sand-wait');
    this.el.classList.add('sand-on');
  }

  start() {
    this.started = true;
  }

  // reset to fully buried (tour filter change)
  rebury() {
    if (reduced) return;
    this.p = 0;
    this.started = false;
    this.done = false;
    this.built = false;
    this.el.classList.remove('is-clear', 'sand-on');
    this.el.classList.add('sand-wait');
    covers.add(this);
    // re-observe so both observers report afresh
    unobserve(this);
    observe(this);
  }

  // advance the sweep and the pointer brush; returns true while still active
  step(dt, rect) {
    if (!this.built || this.done) return;
    const vh = window.innerHeight;
    if (!this.started && !this.manual && rect.top < vh * this.startAt && rect.bottom > vh * 0.08) this.started = true;

    const sx = window.scrollX;
    const sy = window.scrollY;
    const ox = rect.left - this.pad + sx;
    const oy = rect.top - this.pad + sy;
    const cell = this.cell;
    const dir = wind.dir;

    // pointer brush: a sweep over the cover gouges grains out downstream
    if (wind.pointerIn && wind.pspeed > 160) {
      const lx = wind.px - rect.left + this.pad;
      const ly = wind.py - rect.top + this.pad;
      const r = Math.min(64, 16 + wind.pspeed * 0.022);
      if (lx > -r && ly > -r && lx < this.cols * cell + r && ly < this.rows * cell + r) {
        this.brush(lx / cell, ly / cell, r / cell, ox, oy);
        if (!this.manual || this.started) this.started = true;
        this.p = Math.max(this.p, 0.0001);
      }
    }

    if (this.started) {
      const rate = this.rate + Math.min(1.5, Math.abs(wind.scrollV) * 0.0011) + Math.min(0.6, wind.pspeed * 0.00025) + wind.gust * 0.3;
      this.p = Math.min(1, this.p + dt * rate);
      const target = Math.floor(this.p * this.N);
      const n = target - this.idx;
      if (n > 0) {
        const quota = Math.min(n, Math.round((phone ? 26 : 90) * this.spawnScale * (1 + wind.gust)));
        const chance = quota / n;
        const { d, order, cols, cidx } = this;
        for (let k = this.idx; k < target; k++) {
          const i = order[k];
          const o = i * 4 + 3;
          if (!d[o]) continue;
          d[o] = 0;
          if (Math.random() < chance) {
            const cx = i % cols;
            const cy = (i / cols) | 0;
            spawn(
              ox + (cx + 0.5) * cell,
              oy + (cy + 0.5) * cell,
              dir * (90 + Math.random() * 260) * (1 + wind.gust),
              -30 - Math.random() * 90,
              cidx[i],
              cell * (0.7 + Math.random() * 0.8),
              0.9 + Math.random() * 0.9
            );
          }
        }
        this.idx = target;
        this.dirty = true;
      }
    }

    if (this.dirty) {
      this.ctx.putImageData(this.img, 0, 0);
      this.dirty = false;
    }
    if (this.p >= 1) this.finish();
  }

  brush(cx, cy, r, ox, oy) {
    const { d, cols, rows, cidx, cell } = this;
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(cols - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(rows - 1, Math.ceil(cy + r));
    const r2 = r * r;
    let spawned = 0;
    const cap = Math.round((phone ? 14 : 60) * this.spawnScale);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const q = (dx * dx + dy * dy) / r2;
        if (q > 1) continue;
        const i = y * cols + x;
        const o = i * 4 + 3;
        if (!d[o] || Math.random() > 1 - q * 0.75) continue;
        d[o] = 0;
        this.dirty = true;
        if (spawned < cap && Math.random() < 0.35) {
          spawned++;
          spawn(
            ox + (x + 0.5) * cell,
            oy + (y + 0.5) * cell,
            wind.pvx * (0.35 + Math.random() * 0.4) + wind.dir * 60,
            wind.pvy * (0.35 + Math.random() * 0.4) - 30,
            cidx[i],
            cell * (0.7 + Math.random() * 0.8),
            0.8 + Math.random() * 0.8
          );
        }
      }
    }
  }

  finish() {
    this.done = true;
    this.p = 1;
    covers.delete(this);
    visible.delete(this);
    unobserve(this);
    const c = this.canvas;
    this.canvas = null;
    this.d = this.img = this.order = this.cidx = null;
    if (c) c.remove();
    this.el.classList.remove('sand-on', 'sand-wait');
    this.el.classList.add('is-clear');
    if (this.onClear) this.onClear(this);
  }
}

// ---------- masks ----------
const AR_RE = /[؀-ۿ]/;

function textMask(el, cols, rows, cell, pad) {
  const off = document.createElement('canvas');
  off.width = cols;
  off.height = rows;
  const c = off.getContext('2d', { willReadFrequently: true });
  c.scale(1 / cell, 1 / cell);
  c.fillStyle = '#000';
  c.strokeStyle = '#000';
  c.lineJoin = 'round';
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  const base = el.getBoundingClientRect();
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let any = false;
  let node;
  while ((node = walker.nextNode())) {
    const parent = node.parentElement;
    if (!parent || parent.closest('.sand-cover, [aria-hidden="true"].skip-sand')) continue;
    const cs = getComputedStyle(parent);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const fs = parseFloat(cs.fontSize);
    c.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    if ('letterSpacing' in c) c.letterSpacing = cs.letterSpacing === 'normal' ? '0px' : cs.letterSpacing;
    c.lineWidth = Math.max(2.5, fs * 0.07);
    const text = node.textContent;
    const re = /\S+/g;
    let m;
    while ((m = re.exec(text))) {
      range.setStart(node, m.index);
      range.setEnd(node, m.index + m[0].length);
      const rects = range.getClientRects();
      if (!rects.length) continue;
      const r = rects[0];
      const word = m[0];
      c.direction = AR_RE.test(word) ? 'rtl' : 'ltr';
      const mt = c.measureText(word);
      const asc = mt.fontBoundingBoxAscent ?? fs * 0.8;
      const des = mt.fontBoundingBoxDescent ?? fs * 0.2;
      const x = r.left - base.left + r.width / 2 + pad;
      const y = r.top - base.top + (r.height - (asc + des)) / 2 + asc + pad;
      // squeeze to the measured DOM width so canvas and DOM agree exactly
      const sxk = mt.width > 0 ? r.width / mt.width : 1;
      c.save();
      c.translate(x, y);
      c.scale(clamp(sxk, 0.8, 1.25), 1);
      c.fillText(word, 0, 0);
      c.strokeText(word, 0, 0);
      c.restore();
      any = true;
    }
  }
  if (!any) return null;
  const a = c.getImageData(0, 0, cols, rows).data;
  const mask = new Uint8Array(cols * rows);
  for (let i = 0; i < mask.length; i++) mask[i] = a[i * 4 + 3] > 16 ? 1 : 0;
  return mask;
}

function imageMask(el, img, cols, rows, cell) {
  if (!img || !img.complete || !img.naturalWidth) return null;
  const off = document.createElement('canvas');
  off.width = cols;
  off.height = rows;
  const c = off.getContext('2d', { willReadFrequently: true });
  // match object-fit: contain inside the element box
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const ir = img.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  // the image box inside the element (in cells)
  const ix = (ir.left - er.left) / cell;
  const iy = (ir.top - er.top) / cell;
  const iwc = ir.width / cell;
  const ihc = ir.height / cell;
  const kk = Math.min(iwc / iw, ihc / ih);
  const dw = iw * kk;
  const dh = ih * kk;
  c.drawImage(img, ix + (iwc - dw) / 2, iy + (ihc - dh) / 2, dw, dh);
  // dilate a touch so edges are fully hidden
  const a = c.getImageData(0, 0, cols, rows).data;
  const mask = new Uint8Array(cols * rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let on = 0;
      for (let dy = -1; dy <= 1 && !on; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= cols || yy >= rows) continue;
          if (a[(yy * cols + xx) * 4 + 3] > 24) {
            on = 1;
            break;
          }
        }
      }
      mask[y * cols + x] = on;
    }
  }
  return mask;
}

// ---------- registry ----------
let buildIO;
let visIO;
const byEl = new WeakMap();

function observe(cv) {
  buildIO.observe(cv.el);
  visIO.observe(cv.el);
}
function unobserve(cv) {
  buildIO.unobserve(cv.el);
  visIO.unobserve(cv.el);
}

function ensureIO() {
  if (buildIO) return;
  // build a screen ahead so nothing is seen uncovered
  buildIO = new IntersectionObserver(
    (es) => {
      for (const e of es) {
        if (!e.isIntersecting) continue;
        const cv = byEl.get(e.target);
        if (cv && !cv.built && !cv.done) whenReady(cv, () => cv.build());
      }
    },
    { rootMargin: '120% 0px 120% 0px' }
  );
  visIO = new IntersectionObserver(
    (es) => {
      for (const e of es) {
        const cv = byEl.get(e.target);
        if (!cv) continue;
        if (e.isIntersecting) visible.add(cv);
        else visible.delete(cv);
      }
    },
    { rootMargin: '10% 0px 10% 0px' }
  );
  onFrame(tick);
  let rw = window.innerWidth;
  let tm;
  window.addEventListener('resize', () => {
    if (window.innerWidth === rw) return;
    rw = window.innerWidth;
    clearTimeout(tm);
    tm = setTimeout(() => {
      for (const cv of covers) if (cv.built && !cv.done) cv.build();
    }, 200);
  });
}

function whenReady(cv, fn) {
  if (cv.kind === 'image' && cv.img && !(cv.img.complete && cv.img.naturalWidth)) {
    cv.img.addEventListener('load', fn, { once: true });
    cv.img.addEventListener('error', () => cv.finish(), { once: true });
    return;
  }
  fn();
}

function tick(dt) {
  for (const cv of visible) {
    if (!cv.built || cv.done) continue;
    cv.step(dt, cv.el.getBoundingClientRect());
  }
}

// Bury an element. Returns the cover (or null when motion is reduced).
export function bury(el, opts = {}) {
  if (reduced || !el) return null;
  ensureIO();
  const cv = new Cover(el, opts);
  covers.add(cv);
  byEl.set(el, cv);
  observe(cv);
  return cv;
}

export function coverOf(el) {
  return byEl.get(el) || null;
}

