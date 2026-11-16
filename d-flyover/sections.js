// Section renderers: each returns markup for one section, driven by content.json.

export const UI = {
  en: {
    trail: 'Northern Trail', loading: 'Loading the north', scroll: 'Scroll to fly', pause: 'Pause film', play: 'Play film',
    stop: 'Stop', of: 'of', from: 'from', start: 'Starting point', next: 'Next stop', prev: 'Previous stop',
    drive: 'drive', stops: 'Stops', again: 'Fly it again', lang: 'العربية', langCode: 'ar', map: 'The route', km: 'km',
    skip: 'Skip the flyover', top: 'Back to the film',
  },
  ar: {
    trail: 'مسار الشمال', loading: 'نرسم الشمال', scroll: 'مرّر للتحليق', pause: 'إيقاف الفيلم مؤقتًا', play: 'تشغيل الفيلم',
    stop: 'المحطة', of: 'من', from: 'من', start: 'نقطة الانطلاق', next: 'المحطة التالية', prev: 'المحطة السابقة',
    drive: 'قيادة', stops: 'المحطات', again: 'حلّق من جديد', lang: 'English', langCode: 'en', map: 'المسار', km: 'كم',
    skip: 'تخطَّ التحليق', top: 'العودة إلى الفيلم',
  },
};

export const pad = (n) => String(n).padStart(2, '0');
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const words = (s) => s.split(/\s+/).map((w, i) => `<span class="w"><span class="w__i" style="--i:${i}">${esc(w)}</span></span>`).join(' ');

export const ICONS = {
  'riyadh': 3, 'al-qasab': 6, 'shaqra': 4, 'ushaiqer': 5, 'al-majmaah': 4, 'al-ghat': 1, 'al-zulfi': 2,
  'al-mithnab': 2, 'ar-rass': 3, 'al-bukayriyah': 5, 'uyun-al-jiwa': 1,
};

const svg = {
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 4v16M5 13l7 7 7-7"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l12-7.5z" fill="currentColor"/></svg>',
  prev: '<svg class="nt-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg class="nt-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17"/><path d="M12 7.5V12l3 2"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 20V4M5 11l7-7 7 7"/></svg>',
};
export { svg as ICON_SVG };

export function langHref(code) {
  const q = new URLSearchParams(location.search);
  if (code === 'en') q.delete('lang'); else q.set('lang', code);
  const s = q.toString();
  return location.pathname + (s ? '?' + s : '');
}

export function heroHTML(c, L, ui, phone) {
  const film = phone ? c.film.mobile : c.film.desktop;
  return `
  <div class="hero__media">
    <video class="hero__video" id="hero-video" muted playsinline loop preload="metadata" poster="../${c.film.poster}">
      <source src="../${film}" type="video/mp4">
    </video>
  </div>
  <div class="hero__scrim"></div>
  <div class="hero__top nt-wrap">
    <img class="hero__logo" src="../${c.logo.cream}" alt="${esc(ui.trail)}" width="296" height="165">
    <a class="chip-btn" href="${langHref(ui.langCode)}" hreflang="${ui.langCode}" lang="${ui.langCode}">${ui.lang}</a>
  </div>
  <div class="hero__content nt-wrap">
    <p class="hero__tag" lang="ar" dir="rtl">${esc(c.hero.tagline)}</p>
    <h1 class="hero__title">${words(c.hero.title[L])}</h1>
    <p class="hero__sub">${esc(c.hero.sub[L])}</p>
    <div class="hero__row">
      <a class="nt-btn nt-btn--light hero__cta" href="#track" data-goto="0">${esc(c.hero.cta[L])}${svg.down.replace('<svg', '<svg class="nt-down"')}</a>
      <span class="hero__scroll" aria-hidden="true"><span class="hero__scroll-line"></span>${ui.scroll}</span>
      <button class="sq-btn hero__pause" id="hero-pause" type="button" aria-label="${ui.pause}" aria-pressed="false">${svg.pause}</button>
    </div>
  </div>`;
}

export function introHTML(c, L, ui) {
  const stats = c.intro.stats.map((s) => `
      <li class="stat">
        <p class="stat__v"><span class="stat__num">${esc(s.value)}</span>${s.unit ? `<span class="stat__unit">${esc(s.unit[L])}</span>` : ''}</p>
        <p class="stat__l">${esc(s.label[L])}</p>
      </li>`).join('');
  return `
  <div class="nt-wrap intro__wrap">
    <div class="panel intro__panel" data-reveal>
      <p class="nt-eyebrow panel__eyebrow">${esc(ui.trail)}</p>
      <h2 class="nt-h2">${esc(c.intro.title[L])}</h2>
      <p class="nt-lede intro__body">${esc(c.intro.body[L])}</p>
      <ul class="stats">${stats}</ul>
    </div>
  </div>`;
}

export function pillarsHTML(c, L) {
  return c.pillars.map((p, i) => `
  <div class="pillar" data-pillar="${i}" style="--pc:${p.color}">
    <div class="nt-wrap pillar__wrap">
      <article class="panel pillar__panel" data-reveal>
        <img class="pillar__art" src="../${p.art}" alt="" width="320" height="320" loading="lazy">
        <div class="pillar__text">
          <p class="pillar__idx">${pad(i + 1)} <span>/ ${pad(c.pillars.length)}</span></p>
          <h3 class="pillar__name">${esc(p.name[L])}</h3>
          <p class="pillar__line">${esc(p.line[L])}</p>
        </div>
      </article>
    </div>
  </div>`).join('');
}

export function hudHTML(c, L, ui) {
  const N = c.stops.length;
  const rail = c.stops.map((s, i) => `
      <li><button class="rail__btn" type="button" data-goto="${i}" data-region="${s.region}" aria-label="${esc(ui.stop)} ${pad(i + 1)}: ${esc(s.name[L])}">
        <span class="rail__num">${pad(i + 1)}</span><span class="rail__name">${esc(s.name[L])}</span>
      </button></li>`).join('');
  const segs = c.stops.map((s, i) => `<span class="pbar__seg" data-region="${s.region}" data-i="${i}"></span>`).join('');
  return `
  <nav class="rail" aria-label="${esc(ui.stops)}">
    <div class="rail__line"><span class="rail__fill" id="rail-fill"></span></div>
    <ol class="rail__list">${rail}</ol>
  </nav>
  <div class="pbar" aria-hidden="true"><div class="pbar__segs">${segs}</div></div>
  <article class="card" id="card" aria-live="polite">
    <div class="card__media"><img id="card-img" alt="" width="600" height="600"></div>
    <div class="card__head">
      <p class="card__meta"><span class="card__num" id="card-num">01</span><span class="card__of">/ ${pad(N)}</span><span class="card__region" id="card-region"></span></p>
      <h3 class="card__name" id="card-name"></h3>
      <p class="card__drive">${svg.clock}<span id="card-drive"></span></p>
    </div>
    <p class="card__desc" id="card-desc"></p>
    <div class="card__nav">
      <button class="sq-btn sq-btn--dark" type="button" id="card-prev" aria-label="${ui.prev}">${svg.prev}</button>
      <button class="sq-btn sq-btn--dark" type="button" id="card-next" aria-label="${ui.next}">${svg.next}</button>
    </div>
  </article>
  <div class="leg" id="leg" aria-hidden="true">
    <p class="leg__eyebrow">${ui.next}</p>
    <p class="leg__name" id="leg-name"></p>
    <p class="leg__drive">${svg.clock}<span id="leg-drive"></span></p>
    <div class="leg__bar"><span id="leg-fill"></span></div>
  </div>
  <p class="hint" id="hint" aria-hidden="true"><span class="hint__line"></span>${ui.scroll}</p>`;
}

export function trackHTML(c, L, ui) {
  // Screen-reader list of every stop (the visual version lives in the 3D HUD).
  return `<h2 class="sr-only">${esc(ui.stops)}</h2><ol class="sr-only">${c.stops.map((s, i) => `<li>${pad(i + 1)}. ${esc(s.name[L])}. ${s.drive ? esc(s.drive[L]) + '. ' : ''}${esc(s.desc[L])}</li>`).join('')}</ol>`;
}

export function closingHTML(c, L, ui) {
  return `
  <div class="nt-wrap closing__wrap">
    <p class="closing__tag" lang="ar" dir="rtl" data-reveal>${esc(c.hero.tagline)}</p>
    <p class="closing__line" data-reveal>${esc(c.closing.line[L])}</p>
    <div class="closing__row" data-reveal>
      <img class="closing__logo" src="../${c.logo.cream}" alt="${esc(ui.trail)}" width="296" height="165">
      <a class="nt-btn nt-btn--light closing__again" href="#track" data-goto="0">${ui.again}${svg.up.replace('<svg', '<svg class="nt-down"')}</a>
    </div>
  </div>`;
}
