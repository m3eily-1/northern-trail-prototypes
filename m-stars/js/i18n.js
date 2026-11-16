// Language, reduced-motion flag and the small chrome labels this direction adds.
// All real copy comes from content.json.
export const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
export const rtl = lang === 'ar';
export const reduced = document.documentElement.classList.contains('is-reduced');

export const pad2 = (n) => String(n).padStart(2, '0');
export const num = (n) => Number(n).toLocaleString('en-US');

const chrome = {
  en: {
    aligning: 'Aligning the sky',
    skip: 'Click to skip',
    pause: 'Pause film',
    play: 'Play film',
    scroll: 'Scroll',
    readouts: 'Chart readouts',
    constellations: 'Three constellations',
    constellationN: (n) => `Constellation ${pad2(n)}`,
    route: (a, b) => `${a} to ${b}`,
    stop: 'Stop',
    stopOf: (n, t) => `Stop ${pad2(n)} of ${t}`,
    fromLast: 'from the last stop',
    start: 'Starting point',
    drag: 'Drag to turn the sky',
    reset: 'Turn the sky back to north',
    goTo: (name, n, t) => `${name}, stop ${n} of ${t}`,
    starsLabel: 'Stops on the star chart',
    N: 'N',
    E: 'E',
    catalogue: 'Catalogue',
    all: 'All',
    region: 'Region',
    stopF: 'Stop',
    more: (n) => `Show ${n} more`,
    showing: (a, b) => `Showing ${a} of ${b}`,
    from: (n) => `From SAR ${n}`,
    free: 'Free',
    newTab: 'opens webook in a new tab',
    camps: 'Night camps',
    stayN: (n) => `Stay ${pad2(n)}`,
    legendStop: 'Stop',
    legendCamp: 'Place to stay',
    notes: "Navigator's notes",
    noteN: (n) => `Note ${pad2(n)}`,
    log: 'Star log',
    logN: (n) => `Log ${pad2(n)}`,
    back: 'Back to the first star'
  },
  ar: {
    aligning: 'نضبط السماء',
    skip: 'انقر للتخطي',
    pause: 'إيقاف الفيلم مؤقتًا',
    play: 'تشغيل الفيلم',
    scroll: 'مرّر',
    readouts: 'قراءات الخريطة',
    constellations: 'ثلاث كوكبات',
    constellationN: (n) => `الكوكبة ${pad2(n)}`,
    route: (a, b) => `من ${a} إلى ${b}`,
    stop: 'المحطة',
    stopOf: (n, t) => `المحطة ${pad2(n)} من ${t}`,
    fromLast: 'من المحطة السابقة',
    start: 'نقطة الانطلاق',
    drag: 'اسحب لتدوير السماء',
    reset: 'أعد السماء إلى الشمال',
    goTo: (name, n, t) => `${name}، المحطة ${n} من ${t}`,
    starsLabel: 'المحطات على خريطة النجوم',
    N: 'ش',
    E: 'ق',
    catalogue: 'الفهرس',
    all: 'الكل',
    region: 'المنطقة',
    stopF: 'المحطة',
    more: (n) => `عرض المزيد (${n})`,
    showing: (a, b) => `عرض ${a} من ${b}`,
    from: (n) => `تبدأ من ${n} ر.س`,
    free: 'مجانًا',
    newTab: 'يفتح webook في نافذة جديدة',
    camps: 'محطات المبيت',
    stayN: (n) => `إقامة ${pad2(n)}`,
    legendStop: 'محطة',
    legendCamp: 'مكان للإقامة',
    notes: 'ملاحظات الملّاح',
    noteN: (n) => `ملاحظة ${pad2(n)}`,
    log: 'سجل النجوم',
    logN: (n) => `سجل ${pad2(n)}`,
    back: 'عودة إلى النجمة الأولى'
  }
};

export const ui = chrome[lang];

// Pick a localized string from a {en, ar} object.
export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en);

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const asset = (p) => (p ? `../${p}` : '');

// Each number + degree sign is isolated so it reads correctly inside Arabic text.
const iso = (v) => (rtl ? `\u2066${v}°\u2069` : `${v}°`);
export const coord = (lat, lng) => `${iso(lat.toFixed(3))} ${ui.N}  ${iso(lng.toFixed(3))} ${ui.E}`;

export const priceLabel = (p) => (p == null ? '' : p === 0 ? ui.free : ui.from(num(p)));
