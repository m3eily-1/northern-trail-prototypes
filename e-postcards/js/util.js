// Shared helpers for the Postcards direction. No global state beyond read-only config.

const params = new URLSearchParams(location.search);

export const lang = params.get('lang') === 'ar' ? 'ar' : 'en';
export const isRTL = lang === 'ar';
export const dirSign = isRTL ? -1 : 1; // +1 means "towards inline-end" is +x
export const reduced =
  matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('reduced') || !window.gsap;

export const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en ?? '');
export const asset = (p) => (p ? '../' + p : '');
export const pad2 = (n) => String(n).padStart(2, '0');
export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function h(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

let uidN = 0;
export const uid = (p = 'u') => `${p}-${++uidN}`;

// Small chrome labels (allowed by the brief), both languages.
const LABELS = {
  en: {
    stop: 'Stop',
    of: '/',
    start: 'Starting point',
    driveFrom: 'Drive from the last stop',
    postcard: 'Post card',
    to: 'To',
    you: 'You',
    trail: 'Northern Trail',
    welcome: 'Welcome to',
    flipHint: 'Click a card to flip it. Drag it to toss it.',
    tapHint: 'Swipe to deal. Tap to flip.',
    tidy: 'Tidy the pile',
    left: 'to go',
    prev: 'Previous postcard',
    next: 'Next postcard',
    pause: 'Pause film',
    play: 'Play film',
    send: 'Send a postcard',
    sent: 'Postcard sent',
    again: 'Send another',
    fan: 'See the stops',
    skip: 'Skip',
    lang: 'Language',
    regionsLabel: 'Regions'
  },
  ar: {
    stop: 'المحطة',
    of: '/',
    start: 'نقطة الانطلاق',
    driveFrom: 'القيادة من المحطة السابقة',
    postcard: 'بطاقة بريدية',
    to: 'إلى',
    you: 'أنت',
    trail: 'مسار الشمال',
    welcome: 'أهلًا بك في',
    flipHint: 'انقر على البطاقة لقلبها. اسحبها لرميها.',
    tapHint: 'اسحب للتنقل. المس للقلب.',
    tidy: 'رتّب البطاقات',
    left: 'متبقية',
    prev: 'البطاقة السابقة',
    next: 'البطاقة التالية',
    pause: 'إيقاف الفيلم',
    play: 'تشغيل الفيلم',
    send: 'أرسل بطاقة بريدية',
    sent: 'أُرسلت البطاقة',
    again: 'أرسل بطاقة أخرى',
    fan: 'شاهد المحطات',
    skip: 'تخطَّ',
    lang: 'اللغة',
    regionsLabel: 'المناطق'
  }
};
export const L = LABELS[lang];

const MONTHS = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
};
export function dateLine(d = new Date()) {
  return `${pad2(d.getDate())} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
}

export const REGION_COLOR = { riyadh: '#824628', qassim: '#5a6432', hail: '#a06eb4' };
export const REGION_ART = { riyadh: 'assets/img/icon-4.png', qassim: 'assets/img/icon-2.png', hail: 'assets/img/icon-1.png' };
const STAMP_ICONS = [4, 5, 3, 2, 1, 6];
export const stampIcon = (i) => `assets/img/icon-${STAMP_ICONS[i % STAMP_ICONS.length]}.png`;

// Circle path for textPath, starting at 9 o'clock going clockwise.
const circlePath = (cx, cy, r) => `M ${cx - r} ${cy} a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0`;

/**
 * Round postmark. viewBox 0 0 200 200 (plus wavy cancellation lines when `waves`).
 * ring: text that runs around; mid: big centre text; sub: small line under the rules.
 */
export function postmarkSVG({ ring, mid = '', sub = '', waves = false, logo = '', cls = '' }) {
  const id = uid('pmp');
  const r = 80;
  const C = 2 * Math.PI * r;
  const ringText = `${ring} • `;
  // Latin can be spread to fill the ring exactly; Arabic keeps its joining, so it is sized instead.
  const fit = isRTL ? '' : `textLength="${(C * 0.985).toFixed(1)}" lengthAdjust="spacing"`;
  const w = waves ? 420 : 200;
  const wavePaths = waves
    ? [0, 1, 2, 3, 4]
        .map((k) => {
          const y = 64 + k * 18;
          let d = `M 196 ${y}`;
          for (let x = 196; x < 410; x += 30) d += ` q 7.5 -7 15 0 t 15 0`;
          return `<path d="${d}" />`;
        })
        .join('')
    : '';
  const centre = logo
    ? `<image href="${logo}" x="52" y="52" width="96" height="54" />
       <line x1="40" y1="118" x2="160" y2="118" /><line x1="40" y1="146" x2="160" y2="146" />
       <text class="pm-sub" x="100" y="137" text-anchor="middle">${esc(sub)}</text>`
    : `<line x1="34" y1="86" x2="166" y2="86" /><line x1="34" y1="126" x2="166" y2="126" />
       <text class="pm-mid" x="100" y="118" text-anchor="middle">${esc(mid)}</text>
       <text class="pm-sub" x="100" y="148" text-anchor="middle">${esc(sub)}</text>`;
  return `<svg class="postmark ${cls}" viewBox="0 0 ${w} 200" aria-hidden="true" focusable="false">
    <g class="pm-ink" filter="url(#ink-rough)">
      <circle cx="100" cy="100" r="96" class="pm-o" />
      <circle cx="100" cy="100" r="64" class="pm-i" />
      <path id="${id}" d="${circlePath(100, 100, r)}" fill="none" stroke="none" />
      <text class="pm-ring" dy="5"><textPath href="#${id}" ${fit}>${esc(ringText)}</textPath></text>
      ${centre}
      ${wavePaths ? `<g class="pm-waves">${wavePaths}</g>` : ''}
    </g>
  </svg>`;
}

/** Perforated stamp in brand colours (for stops without a sticker). */
export function stampHTML({ color, art, name = '', num = '', cls = '' }) {
  return `<span class="stamp ${cls}" aria-hidden="true">
    <span class="stamp__paper" style="--stamp:${color}">
      <img src="${asset(art)}" alt="" decoding="async" draggable="false">
      ${name ? `<span class="stamp__name">${esc(name)}</span>` : ''}
      ${num ? `<span class="stamp__num">${esc(num)}</span>` : ''}
    </span>
  </span>`;
}

/** Arabic ring text cannot be letter-spaced without breaking joins, so scale its font to fill the ring. */
export function fitRings(scope = document) {
  if (!isRTL) return;
  scope.querySelectorAll('.pm-ring:not([data-fit])').forEach((el) => {
    const tp = el.querySelector('textPath');
    try {
      const len = tp.getComputedTextLength();
      if (!len) return;
      const fs = parseFloat(getComputedStyle(el).fontSize) || 15;
      const target = 2 * Math.PI * 80 * 0.975;
      el.style.fontSize = (fs * target / len).toFixed(2) + 'px';
      el.dataset.fit = '1';
    } catch (e) { /* not rendered yet */ }
  });
}

export function onVisible(el, cb, opts = { rootMargin: '0px 0px -12% 0px' }) {
  if (!('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        io.disconnect();
        cb();
      }
    });
  }, opts);
  io.observe(el);
}

export const store = {
  get(k) {
    try { return sessionStorage.getItem(k); } catch (e) { return null; }
  },
  set(k, v) {
    try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ }
  }
};
