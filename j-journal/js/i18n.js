// Language + small chrome labels. All real copy comes from content.json.
export const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
export const rtl = lang === 'ar';
export const reduced = document.documentElement.classList.contains('is-reduced');

const chrome = {
  en: {
    glance: 'Northern Trail at a glance',
    skip: 'Tap to skip',
    pause: 'Pause film',
    play: 'Play film',
    scroll: 'Scroll',
    stopOf: (n, t) => `Stop ${n} of ${t}`,
    fromLast: 'from the last stop',
    start: 'Start here',
    scratch: 'Scratch to reveal',
    reveal: 'Reveal',
    revealLabel: (name) => `Reveal the photo of ${name}`,
    revealed: 'Revealed',
    part: (n, t) => `Part ${n} of ${t}`,
    contents: 'Contents',
    turn: 'Turn the page',
    hint: 'Scratch each photo to reveal the stop',
    printNo: (n) => `No. ${n}`,
    route: (a, b) => `${a} to ${b}`,
    done: 'Done',
    stops: 'stops'
  },
  ar: {
    glance: 'مسار الشمال في لمحة',
    skip: 'اضغط للتخطي',
    pause: 'إيقاف الفيلم مؤقتًا',
    play: 'تشغيل الفيلم',
    scroll: 'مرّر',
    stopOf: (n, t) => `المحطة ${n} من ${t}`,
    fromLast: 'من المحطة السابقة',
    start: 'نقطة البداية',
    scratch: 'اكشط لتظهر الصورة',
    reveal: 'اكشف',
    revealLabel: (name) => `اكشف صورة ${name}`,
    revealed: 'تم الكشف',
    part: (n, t) => `الجزء ${n} من ${t}`,
    contents: 'المحتويات',
    turn: 'اقلب الصفحة',
    hint: 'اكشط كل صورة لتكشف المحطة',
    printNo: (n) => `رقم ${n}`,
    route: (a, b) => `من ${a} إلى ${b}`,
    done: 'تمت',
    stops: 'محطات'
  }
};

export const ui = chrome[lang];
export const other = { en: chrome.en, ar: chrome.ar };

// Pick a localized string from a {en, ar} object.
export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en);

export const pad2 = (n) => String(n).padStart(2, '0');

export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const asset = (p) => (p ? `../${p}` : '');
