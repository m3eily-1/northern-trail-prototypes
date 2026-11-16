// Shared helpers: language, labels, formatting, small DOM utilities.
const params = new URLSearchParams(location.search);

export const lang = params.get('lang') === 'ar' ? 'ar' : 'en';
export const isRTL = lang === 'ar';
export const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
export const isReduced = () => reducedMQ.matches || params.has('reduced');
export const phoneMQ = matchMedia('(max-width: 899px)');

export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en ?? '');
export const asset = (p) => (p ? '../' + p : '');
export const pad2 = (n) => String(n).padStart(2, '0');
export const num = (n, d = 0) =>
  n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Chrome labels written for this prototype (both languages, no em dashes).
const L = {
  en: {
    brand: 'Northern Trail',
    plan: 'Plan your trip',
    planner: 'Trip planner',
    plannerHint: 'Drag stops into your days, or use + to add them. Reorder inside a day, drag back to remove.',
    plannerHintPhone: 'Tap + on a stop to add it to a day.',
    stops: 'Stops',
    stopsLeft: 'left',
    day: 'Day',
    addDay: 'Add day',
    removeDay: 'Remove day',
    autoPlan: 'Auto-plan',
    reset: 'Reset',
    share: 'Share my trip',
    km: 'km',
    h: 'h',
    driving: 'Driving',
    distance: 'Distance',
    planned: 'Planned',
    of: 'of',
    dropHere: 'Drop stops here',
    allPlanned: 'Every stop is in your plan',
    prev: 'Previous stop',
    next: 'Next stop',
    inDay: (d) => `In Day ${d}`,
    emptyDay: 'Nothing planned yet',
    addTo: 'Add to day',
    moveTo: 'Move to',
    backToStops: 'Back to stops',
    moveUp: 'Move up',
    moveDown: 'Move down',
    details: 'View details',
    close: 'Close',
    copy: 'Copy summary',
    copied: 'Copied',
    pause: 'Pause film',
    play: 'Play film',
    skip: 'Skip',
    stopOf: (n) => `Stop ${pad2(n)} of 16`,
    fromPrev: 'from the previous stop',
    start: 'Start of the trail',
    over: 'Over 4 h of driving',
    myTrip: 'My Northern Trail',
    tripDays: (d) => `${d} ${d === 1 ? 'day' : 'days'}`,
    addedTo: (name, d) => `${name} added to Day ${d}`,
    movedBack: (name) => `${name} is back in the stops list`,
    emptyShare: 'Your plan is empty. Add a few stops or let Auto-plan do it.',
    route: 'Route',
    finish: 'Finish',
    lang: 'العربية',
    langCode: 'AR',
    region: (r) => r,
    drag: 'Drag',
    scroll: 'Scroll',
    stopsCount: (n) => `${n} ${n === 1 ? 'stop' : 'stops'}`,
    menuFor: (name) => `Add ${name} to a day`,
    detailsFor: (name) => `${name}, details`,
  },
  ar: {
    brand: 'مسار الشمال',
    plan: 'خطّط رحلتك',
    planner: 'مخطط الرحلة',
    plannerHint: 'اسحب المحطات إلى أيامك أو استخدم + لإضافتها. رتّبها داخل اليوم، واسحبها للخارج لإزالتها.',
    plannerHintPhone: 'اضغط + على أي محطة لإضافتها إلى يوم.',
    stops: 'المحطات',
    stopsLeft: 'متبقية',
    day: 'اليوم',
    addDay: 'أضف يومًا',
    removeDay: 'احذف اليوم',
    autoPlan: 'خطة تلقائية',
    reset: 'إعادة ضبط',
    share: 'شارك رحلتك',
    km: 'كم',
    h: 'ساعة',
    driving: 'القيادة',
    distance: 'المسافة',
    planned: 'المخطط',
    of: 'من',
    dropHere: 'أفلت المحطات هنا',
    allPlanned: 'كل المحطات في خطتك',
    prev: 'المحطة السابقة',
    next: 'المحطة التالية',
    inDay: (d) => `في اليوم ${d}`,
    emptyDay: 'لا شيء بعد',
    addTo: 'أضف إلى يوم',
    moveTo: 'انقل إلى',
    backToStops: 'أعدها إلى المحطات',
    moveUp: 'انقل للأعلى',
    moveDown: 'انقل للأسفل',
    details: 'التفاصيل',
    close: 'إغلاق',
    copy: 'انسخ الملخص',
    copied: 'تم النسخ',
    pause: 'أوقف الفيلم',
    play: 'شغّل الفيلم',
    skip: 'تخطٍّ',
    stopOf: (n) => `المحطة ${pad2(n)} من 16`,
    fromPrev: 'من المحطة السابقة',
    start: 'بداية المسار',
    over: 'أكثر من 4 ساعات قيادة',
    myTrip: 'رحلتي في مسار الشمال',
    tripDays: (d) => (d === 1 ? 'يوم واحد' : d === 2 ? 'يومان' : `${d} أيام`),
    addedTo: (name, d) => `أُضيفت ${name} إلى اليوم ${d}`,
    movedBack: (name) => `عادت ${name} إلى قائمة المحطات`,
    emptyShare: 'خطتك فارغة. أضف بعض المحطات أو دع الخطة التلقائية تتولى ذلك.',
    route: 'المسار',
    finish: 'النهاية',
    lang: 'English',
    langCode: 'EN',
    drag: 'اسحب',
    scroll: 'مرّر',
    stopsCount: (n) => (n === 1 ? 'محطة واحدة' : n === 2 ? 'محطتان' : n <= 10 ? `${n} محطات` : `${n} محطة`),
    menuFor: (name) => `أضف ${name} إلى يوم`,
    detailsFor: (name) => `${name}، التفاصيل`,
  },
};
export const tr = L[lang];

// Duration in minutes to a compact label: "2 h 10 min" / "2 س 10 د".
export function dur(min) {
  min = Math.round(min);
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (lang === 'ar') return h ? (m ? `${h} س ${m} د` : `${h} س`) : `${m} د`;
  return h ? (m ? `${h} h ${m} min` : `${h} h`) : `${m} min`;
}

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}

// Reveal once when an element enters the viewport.
export function onReveal(el, cb, margin = '0px 0px -12% 0px') {
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver(
    (ents) => {
      for (const e of ents) if (e.isIntersecting) {
        io.disconnect();
        cb();
      }
    },
    { rootMargin: margin }
  );
  io.observe(el);
}

let liveTimer;
export function announce(msg) {
  const live = document.querySelector('.k-live');
  if (!live) return;
  live.textContent = msg;
  live.classList.add('is-on');
  clearTimeout(liveTimer);
  liveTimer = setTimeout(() => live.classList.remove('is-on'), 2600);
}

export const icons = {
  car: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 11.5 5.6 7a1.5 1.5 0 0 1 1.4-1h6a1.5 1.5 0 0 1 1.4 1l1.6 4.5M3.5 11.5h13v3.5h-13zM5.5 15v1.5M14.5 15v1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><circle cx="6.5" cy="13.2" r=".9" fill="currentColor"/><circle cx="13.5" cy="13.2" r=".9" fill="currentColor"/></svg>',
  plus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  dots: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="4.5" cy="10" r="1.6" fill="currentColor"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/><circle cx="15.5" cy="10" r="1.6" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  pause: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>',
  arrow: '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-flip"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  down: '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-down"><path d="M10 4v11M5.5 11 10 15.5 14.5 11" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  spark: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5l1.6 4.9 4.9 1.6-4.9 1.6L10 15.5l-1.6-4.9L3.5 9l4.9-1.6zM15.5 13.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" fill="currentColor"/></svg>',
  share: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v10M6 6.5 10 2.5l4 4M4 10v7h12v-7" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  reset: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 9.5a5.5 5.5 0 1 1 1.6 4.4M4.5 4.5v5h5" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>',
  warn: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 18 17H2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8v4.5" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="14.6" r=".9" fill="currentColor"/></svg>',
  up: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 16V5M5.5 9 10 4.5 14.5 9" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5 8 14.5 16 6" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  back: '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-flip"><path d="M16 10H5M9 5.5 4.5 10 9 14.5" stroke="currentColor" stroke-width="1.8" fill="none"/></svg>',
  info: '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9v5" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="6.5" r=".9" fill="currentColor"/></svg>',
};
