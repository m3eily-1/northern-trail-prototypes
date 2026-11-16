// Shared helpers for the Kinetic Type direction. No global state beyond read-only env.

const params = new URLSearchParams(location.search);
export const lang = params.get('lang') === 'ar' ? 'ar' : 'en';
export const other = lang === 'ar' ? 'en' : 'ar';
export const isRTL = lang === 'ar';
export const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.gsap;
export const phoneMQ = window.matchMedia('(max-width: 767px)');
export const isPhone = () => phoneMQ.matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const L = (o, l = lang) => (o == null ? '' : typeof o === 'string' ? o : o[l] ?? o.en);
export const asset = (p) => (p ? '../' + p : '');
export const pad2 = (n) => String(n).padStart(2, '0');
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const STR = {
  en: {
    km: 'km', min: 'min', h: 'h', scroll: 'Scroll', all: 'All', riyadh: 'Riyadh', qassim: 'Qassim', hail: 'Hail',
    close: 'Close', prev: 'Previous stop', next: 'Next stop', pause: 'Pause film', play: 'Play film',
    stop: 'Stop', of: 'of', start: 'Start of the trail', drive: 'Drive from the previous stop', region: 'Region',
    to: 'to', filter: 'Filter stops by region', open: 'Open stop', stops: 'stops',
  },
  ar: {
    km: 'كم', min: 'دقيقة', h: 'ساعة', scroll: 'مرّر للأسفل', all: 'الكل', riyadh: 'الرياض', qassim: 'القصيم', hail: 'حائل',
    close: 'إغلاق', prev: 'المحطة السابقة', next: 'المحطة التالية', pause: 'إيقاف الفيلم', play: 'تشغيل الفيلم',
    stop: 'المحطة', of: 'من', start: 'بداية المسار', drive: 'القيادة من المحطة السابقة', region: 'المنطقة',
    to: 'إلى', filter: 'تصفية المحطات حسب المنطقة', open: 'افتح المحطة', stops: 'محطة',
  },
};
export const t = (k, l = lang) => STR[l][k] ?? k;

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat(Infinity)) if (kid != null) el.append(kid);
  return el;
}

// ---------- Letter splitting (Arabic keeps its joins via ZWJ) ----------
const ZWJ = '‍';
const RIGHT_ONLY = new Set([...'اأإآٱدذرزوؤة']);
const NON_JOIN = new Set(['ء', ' ']);
const MARK = /[ؐ-ًؚ-ٰٟۖ-ۭ]/;
const isArabicLetter = (c) => /[ؠ-يٱ-ۓ]/.test(c);

function clusters(text) {
  const out = [];
  for (const c of text) {
    if (MARK.test(c) && out.length) out[out.length - 1] += c;
    else out.push(c);
  }
  return out;
}

/** Split text into inline-block letter spans. Returns array of spans (spaces are spans too). */
export function splitLetters(el, text, script = 'en') {
  el.textContent = '';
  const cl = clusters(text);
  const spans = [];
  cl.forEach((c, i) => {
    const base = c[0];
    if (base === ' ') {
      const sp = h('span', { class: 'ch ch--sp' }, ' ');
      el.append(sp);
      spans.push(sp);
      return;
    }
    let s = c;
    if (script === 'ar' && isArabicLetter(base)) {
      const prev = cl[i - 1]?.[0];
      const next = cl[i + 1]?.[0];
      const joinsPrev = prev && isArabicLetter(prev) && !RIGHT_ONLY.has(prev) && !NON_JOIN.has(prev) && !NON_JOIN.has(base);
      const joinsNext = next && isArabicLetter(next) && !RIGHT_ONLY.has(base) && !NON_JOIN.has(base) && !NON_JOIN.has(next);
      s = (joinsPrev ? ZWJ : '') + c + (joinsNext ? ZWJ : '');
    }
    const span = h('span', { class: 'ch' }, s);
    el.append(span);
    spans.push(span);
  });
  return spans;
}

// ---------- Fit text to a width (Swiss justified display lines) ----------
/** el must be display:inline-block + white-space:nowrap. Sets font-size so its width = target. */
export function fitText(el, target, { max = 2000, min = 12 } = {}) {
  el.style.fontSize = '100px';
  const w = el.getBoundingClientRect().width || el.offsetWidth;
  if (!w) return 0;
  const size = clamp((100 * target) / w, min, max);
  el.style.fontSize = size.toFixed(2) + 'px';
  return size;
}

// ---------- Number roller (odometer digits) ----------
const DIGITS = '01234567890123456789';
export function makeRoller(el, value) {
  el.textContent = '';
  el.classList.add('roller');
  el.setAttribute('aria-label', value);
  const cols = [];
  for (const ch of value) {
    if (/\d/.test(ch)) {
      const slot = h('span', { class: 'roll', 'aria-hidden': 'true' });
      const strip = h('span', { class: 'roll__strip' });
      for (const d of DIGITS) strip.append(h('span', { class: 'roll__d' }, d));
      const sizer = h('span', { class: 'roll__sizer' }, ch);
      slot.append(sizer, strip);
      el.append(slot);
      cols.push({ strip, d: +ch });
    } else {
      el.append(h('span', { class: 'roll__ch', 'aria-hidden': 'true' }, ch));
    }
  }
  const set = (p) => {
    // p 0..1 progress; each column lands on 10 + d, staggered
    cols.forEach((c, i) => {
      const target = 10 + c.d;
      const local = clamp(p * (1 + cols.length * 0.12) - i * 0.12, 0, 1);
      const idx = target * local;
      c.strip.style.transform = `translateY(${(-idx * 100) / DIGITS.length}%)`;
    });
  };
  set(reduced ? 1 : 0);
  let played = false;
  return {
    set,
    play(dur = 1.4, delay = 0) {
      if (reduced || !window.gsap) return set(1);
      played = true;
      const o = { p: 0 };
      set(0);
      return gsap.to(o, { p: 1, duration: dur, delay, ease: 'expo.out', onUpdate: () => set(o.p) });
    },
    get played() { return played; },
  };
}

// ---------- Scroll velocity (smoothed, px per ms) ----------
const subs = new Set();
let vel = 0;
let lastY = window.scrollY;
let lastT = performance.now();
let running = false;
function tick(now) {
  const y = window.scrollY;
  const dt = Math.max(8, now - lastT);
  const raw = (y - lastY) / dt;
  vel += (raw - vel) * 0.12;
  if (Math.abs(vel) < 0.0005) vel = 0;
  lastY = y;
  lastT = now;
  subs.forEach((fn) => fn(vel, now));
  requestAnimationFrame(tick);
}
export function onVelocity(fn) {
  subs.add(fn);
  if (!running) {
    running = true;
    requestAnimationFrame(tick);
  }
  return () => subs.delete(fn);
}

/** Apply velocity skew/stretch to elements while they are on screen. */
export function kinetic(els, { skew = 7, stretch = 0.06, k = 3.2 } = {}) {
  if (reduced) return;
  const live = new Set();
  const io = new IntersectionObserver((ents) => ents.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target))));
  els.forEach((e) => io.observe(e));
  onVelocity((v) => {
    const s = clamp(-v * k, -skew, skew);
    const sx = 1 + clamp(Math.abs(v) * stretch * 1.4, 0, stretch);
    const tr = Math.abs(s) < 0.02 ? '' : `skewX(${s.toFixed(2)}deg) scaleX(${sx.toFixed(3)})`;
    live.forEach((e) => { if (e._kt !== tr) { e.style.transform = tr; e._kt = tr; } });
  });
}

export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((n) => (n.textContent = t(n.dataset.i18n)));
}
