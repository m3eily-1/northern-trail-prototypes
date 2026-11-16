// Language, environment flags and small chrome labels. All real copy comes
// from content.json; only short UI labels live here, in both languages.
export const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
export const rtl = lang === 'ar';
export const reduced = document.documentElement.classList.contains('is-reduced');
export const phoneMQ = matchMedia('(max-width: 767px)');
export const isPhone = () => phoneMQ.matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

// The wind blows toward the reading direction: right in English, left in Arabic.
export const WIND_DIR = rtl ? -1 : 1;

const chrome = {
  en: {
    loading: 'Loading',
    pause: 'Pause film',
    play: 'Play film',
    scroll: 'Scroll',
    sweep: 'Sweep the sand away',
    sweepTouch: 'Scroll to clear the sand',
    wind: 'Wind',
    stopOf: (n, total) => `Stop ${n} of ${total}`,
    fromLast: 'from the last stop',
    start: 'Start of the trail',
    end: 'End of the trail',
    km: 'km',
    show: 'Show',
    region: 'Region',
    stop: 'Stop',
    all: 'All',
    more: 'Show more',
    showing: (a, b) => `Showing ${a} of ${b}`,
    from: (n) => `From SAR ${n}`,
    free: 'Free',
    newTab: 'opens webook in a new tab',
    perNight: (from, n, night) => `${from} SAR ${n} ${night}`,
    tip: (n) => `Tip ${n}`,
    marker: 'Marker',
    stops: 'stops'
  },
  ar: {
    loading: 'جارٍ التحميل',
    pause: 'إيقاف الفيلم مؤقتًا',
    play: 'تشغيل الفيلم',
    scroll: 'مرّر',
    sweep: 'أزح الرمال بالمؤشر',
    sweepTouch: 'مرّر لتزيح الرمال',
    wind: 'الريح',
    stopOf: (n, total) => `المحطة ${n} من ${total}`,
    fromLast: 'من المحطة السابقة',
    start: 'بداية المسار',
    end: 'نهاية المسار',
    km: 'كم',
    show: 'عرض',
    region: 'المنطقة',
    stop: 'المحطة',
    all: 'الكل',
    more: 'عرض المزيد',
    showing: (a, b) => `عرض ${a} من ${b}`,
    from: (n) => `تبدأ من ${n} ر.س`,
    free: 'مجانًا',
    newTab: 'يفتح webook في نافذة جديدة',
    perNight: (from, n, night) => `${from} ${n} ر.س ${night}`,
    tip: (n) => `نصيحة ${n}`,
    marker: 'علامة',
    stops: 'محطات'
  }
};

export const ui = chrome[lang];

// Pick a localized string from a {en, ar} object.
export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en);

export const pad2 = (n) => String(n).padStart(2, '0');

export const num = (n) => Number(n).toLocaleString('en-US');

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const asset = (p) => (p ? `../${p}` : '');

export const priceLabel = (p) => (p == null ? '' : p === 0 ? ui.free : ui.from(num(p)));

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// Arrow that points with the wind (mirrored in Arabic via CSS).
export const arrowSvg = (cls = '') =>
  `<svg class="arr ${cls}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M2 10h15M11 4l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;

// Add .is-in once an element is in view (CSS handles the reveal).
let io;
export function inview(el, margin = '0px 0px -10% 0px') {
  if (!el) return;
  if (reduced || !('IntersectionObserver' in window)) {
    el.classList.add('is-in');
    return;
  }
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: margin, threshold: 0.01 }
    );
  }
  io.observe(el);
}
