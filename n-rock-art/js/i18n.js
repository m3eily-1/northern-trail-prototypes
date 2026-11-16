// Language, helpers and the small chrome labels. All real copy comes from content.json.
export const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
export const rtl = lang === 'ar';
export const reduced = document.documentElement.classList.contains('is-reduced');
export const touch = document.documentElement.classList.contains('is-touch');

const chrome = {
  en: {
    loading: 'Lighting the torch',
    pause: 'Pause film',
    play: 'Play film',
    scroll: 'Scroll',
    torch: 'Move the torch to find the carvings',
    torchTouch: 'Drag a finger to move the torch',
    glance: 'At a glance',
    pillars: 'Three sides of the North',
    route: 'The route',
    routeSub: '16 stops carved along 1,200 km, from Diriyah to the rock art of Jubbah.',
    stopOf: (n, t) => `Stop ${n} of ${t}`,
    drive: 'from the last stop',
    start: 'Start of the trail',
    end: 'End of the trail',
    all: 'All',
    region: 'Region',
    stop: 'Stop',
    show: 'Show',
    showMore: 'Show more',
    showing: (n) => `${n} ${n === 1 ? 'tour' : 'tours'} shown`,
    from: (n) => `From SAR ${n}`,
    free: 'Free',
    perNight: (from, n, night) => `${from} SAR ${n} ${night}`,
    newTab: 'opens webook in a new tab',
    tipsSub: 'Marked on the stones before the drive',
    faqSub: 'Questions people ask before the drive',
    stops: 'stops'
  },
  ar: {
    loading: 'نُشعل الشعلة',
    pause: 'إيقاف الفيلم مؤقتًا',
    play: 'تشغيل الفيلم',
    scroll: 'مرّر',
    torch: 'حرّك الشعلة لتكتشف النقوش',
    torchTouch: 'اسحب بإصبعك لتحريك الشعلة',
    glance: 'في لمحة',
    pillars: 'ثلاثة وجوه للشمال',
    route: 'المسار',
    routeSub: '16 محطة منقوشة على امتداد 1,200 كم، من الدرعية إلى نقوش جُبّة الصخرية.',
    stopOf: (n, t) => `المحطة ${n} من ${t}`,
    drive: 'من المحطة السابقة',
    start: 'بداية المسار',
    end: 'نهاية المسار',
    all: 'الكل',
    region: 'المنطقة',
    stop: 'المحطة',
    show: 'عرض',
    showMore: 'عرض المزيد',
    showing: (n) => (n === 1 ? 'جولة واحدة معروضة' : n === 2 ? 'جولتان معروضتان' : `${n} جولات معروضة`),
    from: (n) => `تبدأ من ${n} ر.س`,
    free: 'مجانًا',
    perNight: (from, n, night) => `${from} ${n} ر.س ${night}`,
    newTab: 'يفتح webook في نافذة جديدة',
    tipsSub: 'علامات على الحجر قبل الانطلاق',
    faqSub: 'أسئلة تُطرح قبل الانطلاق',
    stops: 'محطات'
  }
};

export const ui = chrome[lang];

// Pick a localized string from an {en, ar} object.
export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en);
export const pad2 = (n) => String(n).padStart(2, '0');
export const num = (n) => Number(n).toLocaleString('en-US');
export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const asset = (p) => (p ? `../${p}` : '');
export const priceLabel = (p) => (p == null ? '' : p === 0 ? ui.free : ui.from(num(p)));

// Split text into words wrapped for the chisel reveal (keeps spaces as text nodes).
export function chiselWords(text) {
  return String(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => `<span class="cw" style="--w:${i}">${esc(w)}</span>`)
    .join(' ');
}
