// Practical sections, shared logic: labels, price strings, tour filter + "show all", FAQ accordion.
// Markup lives in the direction's own template module; this file only reads data-* hooks.

export const PUI = {
  en: {
    all: 'All', filter: 'Filter tours by stop or region', byRegion: 'Region', byStop: 'Stop',
    showAll: 'Show all', showLess: 'Show fewer', showing: 'Showing', of: 'of', free: 'Free',
    sar: 'SAR', newTab: 'opens webook in a new tab', tip: 'Tip', q: 'Q',
  },
  ar: {
    all: 'الكل', filter: 'تصفية الجولات حسب المحطة أو المنطقة', byRegion: 'المنطقة', byStop: 'المحطة',
    showAll: 'عرض الكل', showLess: 'عرض أقل', showing: 'المعروض', of: 'من', free: 'مجانًا',
    sar: 'ر.س', newTab: 'يفتح webook في نافذة جديدة', tip: 'نصيحة', q: 'س',
  },
};

export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
export const pad = (n) => String(n).padStart(2, '0');
const num = (n) => Number(n).toLocaleString('en-US');

export function model(c, L) {
  const u = PUI[L];
  const stopBy = Object.fromEntries(c.stops.map((s, i) => [s.key, { ...s, i }]));
  const regionBy = Object.fromEntries(c.regions.map((r) => [r.key, r]));
  const tourPrice = (p) => {
    if (p === null || p === undefined) return '';
    if (p === 0) return u.free;
    return L === 'ar' ? `تبدأ من ${num(p)} ر.س` : `From SAR ${num(p)}`;
  };
  const stayPrice = (p) => {
    if (p === null || p === undefined) return '';
    const s = c.sections.stays;
    return L === 'ar' ? `${s.from.ar} ${num(p)} ر.س ${s.night.ar}` : `${s.from.en} SAR ${num(p)} ${s.night.en}`;
  };
  // filters that actually have items, in route order
  const regionCounts = {}, stopCounts = {};
  c.tours.forEach((t) => {
    regionCounts[t.region] = (regionCounts[t.region] || 0) + 1;
    stopCounts[t.stop] = (stopCounts[t.stop] || 0) + 1;
  });
  const regions = c.regions.filter((r) => regionCounts[r.key]).map((r) => ({ key: r.key, name: r.name[L], n: regionCounts[r.key] }));
  const stops = c.stops.filter((s) => stopCounts[s.key]).map((s) => ({ key: s.key, name: s.name[L], n: stopCounts[s.key], i: c.stops.indexOf(s), region: s.region }));
  return { u, L, stopBy, regionBy, tourPrice, stayPrice, regions, stops, total: c.tours.length };
}

const reduceMQ = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Tours: buttons [data-f="all|r:<key>|s:<key>"] with aria-pressed, cards [data-tour] with
 * data-stop/data-region, a [data-more] button and a [data-count] live line.
 * Newly shown cards get .is-in with --k for a staggered entrance (CSS decides the motion).
 */
export function wireTours(root, { m, page = 8, onFilter } = {}) {
  const btns = [...root.querySelectorAll('[data-f]')];
  const cards = [...root.querySelectorAll('[data-tour]')];
  const more = root.querySelector('[data-more]');
  const count = root.querySelector('[data-count]');
  let f = 'all';
  let open = false;
  const match = (el) => f === 'all' || (f.startsWith('r:') ? el.dataset.region === f.slice(2) : el.dataset.stop === f.slice(2));

  function apply(animate) {
    const hits = cards.filter(match);
    let k = 0;
    cards.forEach((el) => {
      const idx = hits.indexOf(el);
      const show = idx >= 0 && (open || idx < page);
      const was = !el.hidden;
      el.hidden = !show;
      el.classList.remove('is-in');
      if (show && animate && !reduceMQ()) {
        el.style.setProperty('--k', String(k++));
        void el.offsetWidth; // restart the entrance
        el.classList.add('is-in');
      } else if (show && !was) el.style.setProperty('--k', '0');
    });
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
    const shown = cards.filter((el) => !el.hidden).length;
    if (count) count.textContent = `${m.u.showing} ${shown} ${m.u.of} ${hits.length}`;
    if (more) {
      more.hidden = hits.length <= page;
      more.setAttribute('aria-expanded', String(open));
      const lab = more.querySelector('[data-more-label]') || more;
      lab.textContent = open ? m.u.showLess : `${m.u.showAll} (${hits.length})`;
    }
    onFilter && onFilter(f, hits);
  }

  btns.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.f === f) return;
    f = b.dataset.f;
    open = false;
    apply(true);
  }));
  if (more) more.addEventListener('click', () => {
    const wasOpen = open;
    open = !open;
    apply(!wasOpen);
    if (wasOpen) {
      const head = root.querySelector('[data-tours-top]') || root;
      const r = head.getBoundingClientRect();
      if (r.top < 0) window.scrollBy({ top: r.top - 80, behavior: 'auto' });
    }
  });
  apply(false);
  return { set: (v) => { f = v; open = false; apply(true); } };
}

/** FAQ: [data-faq-btn] buttons with aria-expanded/aria-controls; one item open at a time. */
export function wireFaq(root, { first = 0 } = {}) {
  const btns = [...root.querySelectorAll('[data-faq-btn]')];
  const panel = (b) => document.getElementById(b.getAttribute('aria-controls'));
  const set = (b, on) => {
    b.setAttribute('aria-expanded', String(on));
    b.closest('[data-faq-item]')?.classList.toggle('is-open', on);
    const p = panel(b);
    if (p) { if (on) p.removeAttribute('inert'); else p.setAttribute('inert', ''); }
  };
  btns.forEach((b, i) => {
    set(b, i === first);
    b.addEventListener('click', () => {
      const on = b.getAttribute('aria-expanded') !== 'true';
      btns.forEach((o) => set(o, o === b ? on : false));
    });
  });
}

export const TIP_ICON = {
  plane: '<path d="M21 12.5 13 8V3.5L11.5 2 10 3.5V8l-8 4.5V15l8-2.5v5L8 19v2l3.5-1 3.5 1v-2l-2-1.5v-5l8 2.5z"/>',
  temperature: '<path d="M10 3h4v11a4 4 0 1 1-4 0z"/><path d="M12 9v7"/><path d="M17 5h3M17 9h3"/>',
  route: '<rect x="3" y="16" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/><path d="M8 18.5h8.5a3 3 0 0 0 0-6h-9a3 3 0 0 1 0-6H16"/>',
  clock: '<rect x="3.5" y="3.5" width="17" height="17"/><path d="M12 7.5V12l3 2"/>',
  fuel: '<path d="M4 21V3.5h9V21M2.5 21h12"/><path d="M7 7.5h3"/><path d="M13 9h2.5l2 2v6.5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
};
export const tipIcon = (k, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">${TIP_ICON[k] || TIP_ICON.route}</svg>`;

export const ARROW = '<svg class="pr-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true" focusable="false"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
export const PLUS = '<svg class="pr-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true" focusable="false"><path class="pr-plus__h" d="M5 12h14"/><path class="pr-plus__v" d="M12 5v14"/></svg>';

/** Arabic-safe coordinate readout with Western digits. */
export const coord = (lat, lng) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(2)}°${lng >= 0 ? 'E' : 'W'}`;
