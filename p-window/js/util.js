// Shared helpers for the Window seat direction: language, chrome labels,
// formatting, word-split reveals and small math. All real copy comes from
// content.json; only small UI labels live here, in both languages.
const params = new URLSearchParams(location.search);

export const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
export const other = lang === 'ar' ? 'en' : 'ar';
export const rtl = lang === 'ar';
export const reduced = document.documentElement.classList.contains('is-reduced');
export const has = (k) => params.has(k);

export const t = (o, l = lang) => (o == null ? '' : typeof o === 'string' ? o : o[l] ?? o.en ?? '');
export const asset = (p) => (p ? `../${p}` : '');
export const pad2 = (n) => String(n).padStart(2, '0');
export const num = (n, d = 0) =>
  Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, x) => a + (b - a) * x;
export const smooth = (a, b, x) => {
  const k = clamp((x - a) / (b - a));
  return k * k * (3 - 2 * k);
};

// Seeded random so the scenery is the same on every visit.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const L = {
  en: {
    brand: 'Northern Trail',
    windowSeat: 'Window seat',
    takeSeat: 'Take the window seat',
    pause: 'Pause film',
    play: 'Play film',
    scroll: 'Scroll',
    km: 'km',
    travelled: 'travelled',
    driveHint: 'Scroll to drive',
    dragHint: 'or drag the view',
    stopOf: (n) => `Stop ${pad2(n)} of 16`,
    fromLast: 'from the last stop',
    start: 'Start of the trail',
    next: 'Next stop',
    arrived: 'End of the trail',
    journey: 'Journey progress. Wind the handle or use the arrow keys to move between stops.',
    goTo: (name) => `Go to ${name}`,
    stopsNav: 'Stops',
    stickers: 'Stickers',
    beforeOff: 'Before you set off',
    outWindow: 'Out of the window',
    restStop: 'Rest stop',
    pinned: 'Pinned on the board',
    overnight: 'Overnight',
    restLine: 'Pull over, stretch your legs, plan the next leg.',
    all: 'All',
    region: 'Region',
    stop: 'Stop',
    from: (n) => `From SAR ${num(n)}`,
    free: 'Free',
    showAll: (n) => `Show all ${n}`,
    showLess: 'Show fewer',
    onBoard: (n) => `${n} on the board`,
    newTab: 'opens webook in a new tab',
    checklist: 'Road-trip checklist',
    ready: (a, b) => `${a} of ${b} ready`,
    allReady: 'All set. Enjoy the drive.',
    info: 'Information',
    kiosk: 'Touch a question',
    again: 'Drive it again',
    swipe: 'Swipe'
  },
  ar: {
    brand: 'مسار الشمال',
    windowSeat: 'مقعد النافذة',
    takeSeat: 'خذ مقعدك بجوار النافذة',
    pause: 'إيقاف الفيلم مؤقتًا',
    play: 'تشغيل الفيلم',
    scroll: 'مرّر',
    km: 'كم',
    travelled: 'مقطوعة',
    driveHint: 'مرّر لتنطلق',
    dragHint: 'أو اسحب المنظر',
    stopOf: (n) => `المحطة ${n} من 16`,
    fromLast: 'من المحطة السابقة',
    start: 'بداية المسار',
    next: 'المحطة التالية',
    arrived: 'نهاية المسار',
    journey: 'تقدّم الرحلة. أدِر المقبض أو استخدم مفاتيح الأسهم للتنقل بين المحطات.',
    goTo: (name) => `انتقل إلى ${name}`,
    stopsNav: 'المحطات',
    stickers: 'الملصقات',
    beforeOff: 'قبل الانطلاق',
    outWindow: 'من النافذة',
    restStop: 'استراحة',
    pinned: 'على لوحة الاستراحة',
    overnight: 'للمبيت',
    restLine: 'توقّف قليلًا، وخطّط للمرحلة التالية.',
    all: 'الكل',
    region: 'المنطقة',
    stop: 'المحطة',
    from: (n) => `تبدأ من ${num(n)} ر.س`,
    free: 'مجانًا',
    showAll: (n) => `عرض الكل (${n})`,
    showLess: 'عرض أقل',
    onBoard: (n) => `${n} على اللوحة`,
    newTab: 'يفتح webook في نافذة جديدة',
    checklist: 'قائمة الرحلة',
    ready: (a, b) => `${a} من ${b} جاهزة`,
    allReady: 'كل شيء جاهز. استمتع بالطريق.',
    info: 'معلومات',
    kiosk: 'اختر سؤالًا',
    again: 'انطلق من جديد',
    swipe: 'اسحب'
  }
};

export const ui = L[lang];
export const labels = L;

export const priceLabel = (p) => (p == null ? '' : p === 0 ? ui.free : ui.from(p));

// Inline icons (stroke = currentColor). Arrows are drawn for LTR and get the
// .flip class so RTL mirrors them.
export const icons = {
  arrow: '<svg class="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v15M6 13l6 6 6-6"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20V5M6 11l6-6 6 6"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path class="v" d="M12 5v14"/><path d="M5 12h14"/></svg>',
  ext: '<svg class="flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8"/></svg>'
};

// Split a heading into masked words for a rise-in reveal. Words, not letters,
// so Arabic keeps its joins.
export function splitWords(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.innerHTML = words
    .map((w, i) => `<span class="w" aria-hidden="true"><span class="w__in" style="--i:${i}">${esc(w)}</span></span>`)
    .join(' ');
  el.classList.add('is-split');
  return el;
}

// Add .is-in once an element enters the viewport (CSS takes over from there).
const ios = new Map();
export function inview(el, margin = '0px 0px -12% 0px', cb) {
  if (!el) return;
  if (reduced || !('IntersectionObserver' in window)) {
    el.classList.add('is-in');
    cb && cb(el);
    return;
  }
  let io = ios.get(margin);
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
          const f = e.target.__inview;
          if (f) f(e.target);
        }
      },
      { rootMargin: margin, threshold: 0.01 }
    );
    ios.set(margin, io);
  }
  el.__inview = cb;
  io.observe(el);
}

// Cumulative km per stop. The source gives drive minutes per leg and 1,200 km
// in total, so km travelled is shared out in proportion to drive time.
export function kmTable(stops) {
  const total = stops.reduce((a, s) => a + (s.driveMinutes || 0), 0) || 1;
  let acc = 0;
  return stops.map((s) => {
    acc += s.driveMinutes || 0;
    return Math.round((acc / total) * 1200);
  });
}

export const gsap = () => window.gsap || null;
