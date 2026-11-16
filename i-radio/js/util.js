// Shared helpers. No global state: everything is derived from <html lang/dir>.

export const lang = () => (document.documentElement.lang === 'ar' ? 'ar' : 'en');
export const isRTL = () => document.documentElement.dir === 'rtl';
export const reducedMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
export const isReduced = () => reducedMQ.matches;

export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang()] ?? o.en ?? '');
export const asset = (p) => (p ? '../' + p : '');

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export const pad2 = (n) => String(n).padStart(2, '0');

// Minutes as a drive time ("1 h 33 min" / "1 س 33 د"), never a song length.
export const hm = (mins) => {
  const m = Math.max(0, Math.round(mins));
  const H = Math.floor(m / 60);
  const M = m % 60;
  const u = lang() === 'ar' ? { h: 'س', m: 'د' } : { h: 'h', m: 'min' };
  if (!H) return `${M} ${u.m}`;
  return M ? `${H} ${u.h} ${M} ${u.m}` : `${H} ${u.h}`;
};

// Small chrome labels written for this prototype (both languages).
const L = {
  en: {
    skip: 'Skip', pause: 'Pause', play: 'Play', onAir: 'On air', scroll: 'Scroll',
    soundOn: 'Sound on', soundOff: 'Sound off', sound: 'Ambient sound',
    track: 'Track', of: 'of', tripTime: 'Trip time', drive: 'Drive', start: 'Starting point',
    liner: 'Liner notes', tracklist: 'Tracklist', total: 'Total', tuning: 'Tuning',
    dial: 'Tuning dial', dialHint: 'Drag the dial, scroll or use the arrow keys',
    swipe: 'Swipe to tune', prev: 'Previous stop', next: 'Next stop', presets: 'Presets', seek: 'Seek',
    side: 'Side', sides: ['A', 'B', 'C'], mixtape: 'The mixtape', h: 'h',
    back: 'Back to track 01', close: 'Close', signoff: 'Signing off', nowPlaying: 'Now playing',
    tracks: 'tracks', openList: 'Open tracklist',
  },
  ar: {
    skip: 'تخطَّ', pause: 'إيقاف مؤقت', play: 'تشغيل', onAir: 'على الهواء', scroll: 'مرّر',
    soundOn: 'تشغيل الصوت', soundOff: 'إيقاف الصوت', sound: 'الصوت المحيط',
    track: 'المحطة', of: 'من', tripTime: 'زمن الرحلة', drive: 'القيادة', start: 'نقطة الانطلاق',
    liner: 'عن المحطة', tracklist: 'قائمة المحطات', total: 'المجموع', tuning: 'جارٍ الموالفة',
    dial: 'قرص الموالفة', dialHint: 'أدر القرص أو مرّر أو استخدم الأسهم',
    swipe: 'اسحب للموالفة', prev: 'المحطة السابقة', next: 'المحطة التالية', presets: 'المحطات المحفوظة', seek: 'تنقّل',
    side: 'الوجه', sides: ['أ', 'ب', 'ج'], mixtape: 'شريط الرحلة', h: 'س',
    back: 'العودة إلى المحطة 01', close: 'إغلاق', signoff: 'نهاية البث', nowPlaying: 'يُبث الآن',
    tracks: 'محطة', openList: 'افتح قائمة المحطات',
  },
};
export const l = (k) => L[lang()][k] ?? L.en[k];

// Short region names for tight chrome (band, presets).
export const regionShort = (r) =>
  lang() === 'ar' ? t(r.name).replace(/^منطقة\s+/, '') : t(r.name).replace(/\s+region$/i, '');

// Reveal-on-view using brand.css [data-reveal] / .is-revealed.
export function observeReveals(root) {
  const els = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || isReduced()) {
    els.forEach((e) => e.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add('is-revealed');
          io.unobserve(en.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
  );
  els.forEach((e) => io.observe(e));
}

// Time-based tween that also finishes when rAF is paused (hidden tab).
export function tween(dur, onUpdate, ease = (x) => 1 - Math.pow(1 - x, 3)) {
  const t0 = performance.now();
  let done = false;
  let raf = 0;
  const finish = () => {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    onUpdate(1);
  };
  const step = () => {
    if (done) return;
    const p = Math.min(1, (performance.now() - t0) / dur);
    onUpdate(ease(p));
    if (p < 1) raf = requestAnimationFrame(step);
    else done = true;
  };
  raf = requestAnimationFrame(step);
  const guard = setTimeout(finish, dur + 80);
  return { cancel: () => { done = true; cancelAnimationFrame(raf); clearTimeout(guard); } };
}

export const icons = {
  pause: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3v12H5zM12 4h3v12h-3z" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>',
  prev: '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 4h2.5v12H4zM16 4v12L7.5 10z" fill="currentColor"/></svg>',
  next: '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M13.5 4H16v12h-2.5zM4 4v12l8.5-6z" fill="currentColor"/></svg>',
  speaker: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 7h3l4-3.5v13L6 13H3z" fill="currentColor"/><path class="ico-waves" d="M13 7.2a4 4 0 0 1 0 5.6M15.2 5a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="ico-x" d="M13 8l4 4M17 8l-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  list: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5h2v2H3zM7 5h10v2H7zM3 9h2v2H3zM7 9h10v2H7zM3 13h2v2H3zM7 13h10v2H7z" fill="currentColor"/></svg>',
  close: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  arrow: '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  down: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v12M5 10l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
};
