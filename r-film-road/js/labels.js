// Small chrome labels (allowed to be written by us), both languages.
export const LABELS = {
  en: {
    reel: 'Northern Trail',
    loading: 'Loading',
    reelFilm: 'Reel 01 · Brand film',
    skip: 'Skip intro',
    here: 'You are here',
    scroll: 'Scroll',
    pause: 'Pause film',
    play: 'Play film',
    cursorPause: 'Pause',
    cursorPlay: 'Play',
    intro: 'Intro',
    chapter: 'Chapter',
    of: 'of',
    stops: 'The stops',
    stopsEyebrow: '16 stops · 1,200 km',
    hint: 'Drag or scroll',
    hintTouch: 'Swipe',
    hintDrag: 'Drag, swipe or use the arrows',
    prevStop: 'Previous stop',
    nextStop: 'Next stop',
    stopOf: (n, total) => `Stop ${n} of ${total}`,
    region: 'Region',
    start: 'Starting point',
    fromPrev: 'from the previous stop',
    about: 'About this stop',
    explore: 'Explore this stop',
    drag: 'Drag',
    view: 'View',
    tipsK: 'Before you go',
    faqK: 'Questions',
    results: (n) => `${n} results`,
    more: (n) => `Show all ${n}`,
    less: 'Show fewer',
    free: 'Free',
    from: (n) => `From ¤${n}`,
    night: (n) => `From ¤${n} per night`,
    stay: 'Stay',
    all: 'All',
    where: 'Where',
    kind: 'Type',
    filterTours: 'Filter tours and experiences',
    filterStays: 'Filter places to stay',
    filterRegion: 'Show stops by region',
    none: 'Nothing matches these filters.',
    clear: 'Clear filters',
    newTab: 'opens webook in a new tab',
    soon: 'Booking link coming soon',
  },
  ar: {
    reel: 'مسار الشمال',
    loading: 'جارٍ التحميل',
    reelFilm: 'البكرة 01 · الفيلم',
    skip: 'تخطي المقدمة',
    here: 'أنت هنا',
    scroll: 'مرّر',
    pause: 'إيقاف الفيلم',
    play: 'تشغيل الفيلم',
    cursorPause: 'إيقاف',
    cursorPlay: 'تشغيل',
    intro: 'مقدمة',
    chapter: 'الفصل',
    of: 'من',
    stops: 'المحطات',
    stopsEyebrow: '16 محطة · 1,200 كم',
    hint: 'اسحب أو مرّر',
    hintTouch: 'اسحب',
    hintDrag: 'اسحب أو استخدم الأسهم',
    prevStop: 'المحطة السابقة',
    nextStop: 'المحطة التالية',
    stopOf: (n, total) => `المحطة ${n} من ${total}`,
    region: 'المنطقة',
    start: 'نقطة الانطلاق',
    fromPrev: 'من المحطة السابقة',
    about: 'عن المحطة',
    explore: 'اكتشف المحطة',
    drag: 'اسحب',
    view: 'عرض',
    tipsK: 'قبل أن تنطلق',
    faqK: 'أسئلة',
    results: (n) => (n === 1 ? 'نتيجة واحدة' : n === 2 ? 'نتيجتان' : n >= 3 && n <= 10 ? `${n} نتائج` : `${n} نتيجة`),
    more: (n) => `عرض الكل (${n})`,
    less: 'عرض أقل',
    free: 'مجانًا',
    from: (n) => `تبدأ من ¤${n}`,
    night: (n) => `تبدأ من ¤${n} لليلة`,
    stay: 'إقامة',
    all: 'الكل',
    where: 'المكان',
    kind: 'النوع',
    filterTours: 'تصفية الجولات والتجارب',
    filterStays: 'تصفية أماكن الإقامة',
    filterRegion: 'عرض المحطات حسب المنطقة',
    none: 'لا توجد نتائج لهذه الخيارات.',
    clear: 'مسح التصفية',
    newTab: 'يفتح webook في نافذة جديدة',
    soon: 'رابط الحجز قريبًا',
  },
};

export const pad2 = (n) => String(n).padStart(2, '0');

// Split a heading into word masks: <span class="ntc-w"><span>word</span></span>
export function splitWords(el, text) {
  el.textContent = '';
  const words = String(text).split(/\s+/).filter(Boolean);
  words.forEach((w, i) => {
    const outer = document.createElement('span');
    outer.className = 'ntc-w';
    const inner = document.createElement('span');
    inner.textContent = w;
    inner.style.setProperty('--i', i);
    outer.appendChild(inner);
    el.appendChild(outer);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  el.setAttribute('aria-label', text);
  return words.length;
}
