// Small shared helpers: media queries, easing, reveals, word splitting, count-ups.
import { esc, reduced } from './i18n.js';

export const compactMQ = matchMedia('(max-width: 899px)');
export const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutBack = (x) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

// Reveal: add .is-in once the element enters the viewport.
const callbacks = new WeakMap();
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
      const cb = callbacks.get(e.target);
      if (cb) cb(e.target);
    });
  },
  { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }
);

export function reveal(el, cb) {
  if (!el) return;
  if (cb) callbacks.set(el, cb);
  if (reduced) {
    el.classList.add('is-in');
    if (cb) cb(el);
    return;
  }
  io.observe(el);
}

// Split a heading into word spans for the "coming into focus" reveal. Arabic
// letters only join within a word, so splitting on spaces keeps shaping intact.
export function splitWords(el) {
  const text = el.textContent.trim();
  // Keep a number with its short unit ("1,200 km", "1,200 كم") on one line.
  const words = [];
  text.split(/\s+/).forEach((w) => {
    const prev = words[words.length - 1];
    if (prev && /^[\d.,]+$/.test(prev) && w.length <= 4) words[words.length - 1] = `${prev}\u00a0${w}`;
    else words.push(w);
  });
  el.innerHTML = words
    .map((w, i) => `<span class="w" style="--wi:${i}">${esc(w)}</span>`)
    .join(' ');
  return el;
}

// Count a number up from zero, keeping the final formatting (commas, decimals).
export function countUp(el, finalText, duration = 1600) {
  const clean = String(finalText).replace(/,/g, '');
  const to = parseFloat(clean);
  const decimals = (clean.split('.')[1] || '').length;
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (reduced || !isFinite(to)) {
    el.textContent = finalText;
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / duration);
    el.textContent = fmt(to * easeOutExpo(k));
    if (k < 1) requestAnimationFrame(step);
    else el.textContent = finalText;
  };
  requestAnimationFrame(step);
}

// A RAF loop that only runs while its element is on screen and the tab is visible.
export function visibleLoop(el, frame) {
  let on = false;
  let raf = 0;
  let inView = false;
  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    frame(now);
  };
  const sync = () => {
    const want = inView && !document.hidden;
    if (want && !on) {
      on = true;
      raf = requestAnimationFrame(tick);
    } else if (!want && on) {
      on = false;
      cancelAnimationFrame(raf);
    }
  };
  new IntersectionObserver((es) => {
    inView = es[es.length - 1].isIntersecting;
    sync();
  }).observe(el);
  document.addEventListener('visibilitychange', sync);
  return { sync };
}

export const starGlyph = (cls = 'm-glyph') =>
  `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 0 L9.4 6.6 L16 8 L9.4 9.4 L8 16 L6.6 9.4 L0 8 L6.6 6.6 Z"/></svg>`;

export const arrowIcon = (cls = 'm-arrow') =>
  `<svg class="${cls}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M3 10h13M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>`;
