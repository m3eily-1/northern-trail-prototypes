// Shared helpers. No global state beyond the read-only environment flags.
const root = document.documentElement;

export const env = {
  lang: root.lang === 'ar' ? 'ar' : 'en',
  rtl: root.dir === 'rtl',
  reduced: root.classList.contains('rm'),
  phone: () => window.innerWidth < 768,
  touch: window.matchMedia('(hover: none)').matches,
};

export const t = (obj) => (obj == null ? '' : typeof obj === 'string' ? obj : obj[env.lang] ?? obj.en ?? '');

export const asset = (p) => (p ? '../' + p : '');

// Small chrome labels written for this prototype (both languages).
export const L = {
  loading: { en: 'Loading the road', ar: 'نجهّز الطريق' },
  skip: { en: 'Click to skip', ar: 'انقر للتخطي' },
  pause: { en: 'Pause film', ar: 'إيقاف الفيلم' },
  play: { en: 'Play film', ar: 'تشغيل الفيلم' },
  scroll: { en: 'Scroll', ar: 'مرّر' },
  stop: { en: 'Stop', ar: 'المحطة' },
  of: { en: 'of', ar: 'من' },
  start: { en: 'Starting point', ar: 'نقطة البداية' },
  fromPrev: { en: 'from the previous stop', ar: 'من المحطة السابقة' },
  stops: { en: 'Stops', ar: 'المحطات' },
  hint: { en: 'Move to stir the heat. Click to ripple.', ar: 'حرّك المؤشر لتحريك السراب، وانقر لتموّجه.' },
  langSwitch: { en: 'Language', ar: 'اللغة' },
};

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

export const pad2 = (n) => String(n).padStart(2, '0');

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Wrap each word in a line mask (outer clips, inner slides up).
export function maskWords(text, cls = 'mw') {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => `<span class="${cls}"><span class="${cls}__i" style="--i:${i}">${esc(w)}</span></span>`)
    .join(' ');
}

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Observe once: adds `is-in` and calls cb the first time the element enters.
export function onEnter(nodes, cb, opts = {}) {
  const list = Array.from(nodes);
  if (!('IntersectionObserver' in window) || env.reduced) {
    list.forEach((n) => { n.classList.add('is-in'); cb && cb(n); });
    return () => {};
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      cb && cb(e.target);
      io.unobserve(e.target);
    });
  }, { rootMargin: opts.rootMargin || '0px 0px -15% 0px', threshold: opts.threshold ?? 0.01 });
  list.forEach((n) => io.observe(n));
  return () => io.disconnect();
}

// rAF with a timer fallback: hidden tabs pause rAF, the timer keeps time-based work moving.
export function tick(fn) {
  let done = false;
  const run = () => { if (done) return; done = true; clearTimeout(to); fn(performance.now()); };
  const id = requestAnimationFrame(run);
  const to = setTimeout(() => { cancelAnimationFrame(id); run(); }, 60);
}
