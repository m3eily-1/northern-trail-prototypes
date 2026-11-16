// Small chrome labels (allowed to be written by us), both languages.
export const LABELS = {
  en: {
    reel: 'Northern Trail',
    loading: 'Loading',
    reelFilm: 'Reel 01 · Brand film',
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
    stopOf: (n, total) => `Stop ${n} of ${total}`,
    region: 'Region',
    start: 'Starting point',
    fromPrev: 'from the previous stop',
    about: 'About this stop',
    drag: 'Drag',
    view: 'View',
  },
  ar: {
    reel: 'مسار الشمال',
    loading: 'جارٍ التحميل',
    reelFilm: 'البكرة 01 · الفيلم',
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
    stopOf: (n, total) => `المحطة ${n} من ${total}`,
    region: 'المنطقة',
    start: 'نقطة الانطلاق',
    fromPrev: 'من المحطة السابقة',
    about: 'عن المحطة',
    drag: 'اسحب',
    view: 'عرض',
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
