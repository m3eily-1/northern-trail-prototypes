// Tours and Experiences as option E's postcards: each tour is a slightly tilted postcard with the
// stop name on the photo and the price as a perforated postage stamp. Filters are plain buttons
// (regions, then stops). Shows 8, then "Show all".
import { pad2 } from './labels.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const num = (n) => Number(n).toLocaleString('en-US');
const TILT = [-0.8, 0.6, -0.4, 0.9, -0.6, 0.5, -0.9, 0.4];
const MONTHS = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};
const U = {
  en: { fullDay: 'Full day', all: 'All', filter: 'Filter tours by stop or region', showAll: 'Show all', showLess: 'Show fewer', showing: 'Showing', of: 'of', free: 'Free', trail: 'Northern Trail', tours: 'Tours', newTab: 'opens webook in a new tab' },
  ar: { fullDay: 'يوم كامل', all: 'الكل', filter: 'تصفية الجولات حسب المحطة أو المنطقة', showAll: 'عرض الكل', showLess: 'عرض أقل', showing: 'المعروض', of: 'من', free: 'مجانًا', trail: 'مسار الشمال', tours: 'جولات', newTab: 'يفتح webook في نافذة جديدة' },
};

let uidN = 0;
// Round postmark (viewBox 200 x 200): text around the ring, a big number between two rules, a date.
function postmark({ ring, mid, sub, rtl }) {
  const id = `r-pm-${++uidN}`;
  const r = 80;
  const C = 2 * Math.PI * r;
  const fit = rtl ? '' : `textLength="${(C * 0.985).toFixed(1)}" lengthAdjust="spacing"`;
  return `<svg class="postmark" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <g class="pm-ink" filter="url(#r-ink-rough)">
      <circle cx="100" cy="100" r="96" class="pm-o"/>
      <circle cx="100" cy="100" r="64" class="pm-i"/>
      <path id="${id}" d="M ${100 - r} 100 a ${r} ${r} 0 1 1 ${r * 2} 0 a ${r} ${r} 0 1 1 ${-r * 2} 0" fill="none" stroke="none"/>
      <text class="pm-ring" dy="5"><textPath href="#${id}" ${fit}>${esc(ring)} • </textPath></text>
      <line x1="34" y1="86" x2="166" y2="86"/><line x1="34" y1="126" x2="166" y2="126"/>
      <text class="pm-mid" x="100" y="118" text-anchor="middle">${esc(mid)}</text>
      <text class="pm-sub" x="100" y="148" text-anchor="middle">${esc(sub)}</text>
    </g>
  </svg>`;
}

// Arabic ring text cannot be letter-spaced without breaking the joins, so its size is fitted.
function fitRings(scope) {
  scope.querySelectorAll('.pm-ring:not([data-fit])').forEach((el) => {
    try {
      const len = el.querySelector('textPath').getComputedTextLength();
      if (!len) return;
      const fs = parseFloat(getComputedStyle(el).fontSize) || 15;
      el.style.fontSize = ((fs * 2 * Math.PI * 80 * 0.975) / len).toFixed(2) + 'px';
      el.dataset.fit = '1';
    } catch (e) {
      /* not rendered yet */
    }
  });
}

// One postcard. Shared by the landing page and the stop pages.
export function makePostcard(ctx) {
  const { data, t, lang, rtl, asset, trip } = ctx;
  const u = U[lang];
  const stopBy = Object.fromEntries(data.stops.map((s, i) => [s.key, { ...s, i }]));

  const priceStamp = (p) => {
    if (p == null) return '<span class="pt__stamp pt__stamp--blank" aria-hidden="true"></span>';
    const inner = p === 0
      ? `<span class="pt__val">${esc(u.free)}</span>`
      : `<span class="pt__from">${rtl ? 'تبدأ من' : 'From'}</span><span class="pt__val">${num(p)}</span><span class="pt__cur">${rtl ? 'ر.س' : 'SAR'}</span>`;
    return `<span class="pt__stamp" aria-hidden="true"><span class="stamp__paper" style="--stamp:var(--nt-sand-dark)">${inner}</span></span>`;
  };
  const priceText = (p) => (p == null ? '' : p === 0 ? u.free : rtl ? `تبدأ من ${num(p)} ر.س` : `From SAR ${num(p)}`);

  return (x, i) => {
    const s = stopBy[x.stop];
    const meta = [t(x.type), x.duration ? t(x.duration) : x.organizer].filter(Boolean).map(esc).join(' · ');
    return `<li class="pt" data-tour data-stop="${x.stop}" data-region="${x.region}" data-full="${x.fullDay ? 1 : 0}" style="--tilt:${TILT[i % TILT.length]}deg">
      <a class="pt__a" href="${esc(t(x.href))}" target="_blank" rel="noopener">
        <span class="pt__photo">
          <img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async" draggable="false">
          <span class="pt__place">${esc(t(s.name))}</span>
          ${priceStamp(x.price)}
        </span>
        <span class="pt__body">
          <span class="pt__meta">${meta}</span>
          <span class="pt__title">${esc(t(x.title))}</span>
          <span class="pt__until">${esc(t(x.until))}</span>
          <span class="ntc-sr">${esc(priceText(x.price))}</span>
        </span>
        <span class="ntc-sr"> (${esc(u.newTab)})</span>
      </a>
      ${trip && x.price != null ? trip.button(`t:${x.slug}`) : ''}
    </li>`;
  };
}

export function initPostcards(root, ctx) {
  const { data, t, lang, rtl, reduced, isPhone } = ctx;
  const u = U[lang];
  const d = new Date();
  const date = `${pad2(d.getDate())} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`;
  const sec = data.sections.tours;
  const tours = data.tours;
  const card = makePostcard(ctx);

  const counts = (key) => tours.reduce((m, x) => ((m[x[key]] = (m[x[key]] || 0) + 1), m), {});
  const rc = counts('region');
  const sc = counts('stop');
  const tag = (f, label, n) => `<button class="bk-chip" type="button" data-f="${f}" aria-pressed="false"><span>${esc(label)}</span><b>${n}</b></button>`;

  root.innerHTML = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">
      <filter id="r-ink-rough" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="9" result="g"/>
        <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.7" result="gm"/>
        <feComposite in="d" in2="gm" operator="in"/>
      </filter>
    </svg>
    <div class="nt-wrap">
      <header class="ph">
        <div class="ph__text">
          <h2 class="ph__title" id="pp-tours-t">${esc(t(sec.title))}</h2>
          <p class="ph__sub">${esc(t(sec.sub))}</p>
        </div>
        <span class="ph__pm" aria-hidden="true">${postmark({ ring: rtl ? `${u.tours} • ${u.trail}` : `${u.tours.toUpperCase()} • ${u.trail.toUpperCase()}`, mid: '01', sub: date, rtl })}</span>
      </header>
      <div class="bk-chips" role="group" aria-label="${esc(u.filter)}">
        <div class="bk-chips__group">${tag('all', u.all, tours.length)}${tag('d:full', u.fullDay, tours.filter((x) => x.fullDay).length)}${data.regions.filter((r) => rc[r.key]).map((r) => tag('r:' + r.key, t(r.name), rc[r.key])).join('')}</div>
        <div class="bk-chips__group">${data.stops.filter((s) => sc[s.key]).map((s) => tag('s:' + s.key, t(s.name), sc[s.key])).join('')}</div>
      </div>
      <p class="pp__count" aria-live="polite"></p>
      <ul class="pt-grid" role="list">${tours.map(card).join('')}</ul>
      <div class="pp__more-row"><button class="nt-btn pp__more" type="button" aria-expanded="false"></button></div>
    </div>`;

  // ---------- filters + show all ----------
  const btns = [...root.querySelectorAll('[data-f]')];
  const cards = [...root.querySelectorAll('[data-tour]')];
  const more = root.querySelector('.pp__more');
  const count = root.querySelector('.pp__count');
  const page = isPhone ? 4 : 8;
  let f = 'all';
  let open = false;
  const match = (el) =>
    f === 'all' || (f === 'd:full' ? el.dataset.full === '1' : f.startsWith('r:') ? el.dataset.region === f.slice(2) : el.dataset.stop === f.slice(2));
  function apply(animate) {
    const hits = cards.filter(match);
    let k = 0;
    cards.forEach((el) => {
      const idx = hits.indexOf(el);
      const show = idx >= 0 && (open || idx < page);
      el.hidden = !show;
      el.classList.remove('is-in');
      if (show && animate && !reduced) {
        el.style.setProperty('--k', String(k++));
        void el.offsetWidth; // restart the deal-in
        el.classList.add('is-in');
      }
    });
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === f)));
    count.textContent = `${u.showing} ${cards.filter((el) => !el.hidden).length} ${u.of} ${hits.length}`;
    more.hidden = hits.length <= page;
    more.setAttribute('aria-expanded', String(open));
    more.textContent = open ? u.showLess : `${u.showAll} (${hits.length})`;
    ctx.trip?.sync(root);
    window.ScrollTrigger?.refresh();
  }
  btns.forEach((b) =>
    b.addEventListener('click', () => {
      if (b.dataset.f === f) return;
      f = b.dataset.f;
      open = false;
      apply(true);
    })
  );
  more.addEventListener('click', () => {
    const wasOpen = open;
    open = !open;
    apply(!wasOpen);
    if (wasOpen) {
      const r = root.getBoundingClientRect();
      if (r.top < 0) window.scrollBy({ top: r.top - 80, behavior: 'auto' });
    }
  });
  apply(false);

  if (rtl) document.fonts.ready.then(() => fitRings(root));

  // the header postmark thumps on, the first cards deal in, when the section arrives
  if (reduced) {
    root.querySelector('.ph').classList.add('is-revealed');
    return;
  }
  root.classList.add('is-waiting');
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target.classList.contains('ph')) e.target.classList.add('is-revealed');
        else {
          root.classList.remove('is-waiting');
          apply(true);
        }
      }),
    { rootMargin: '0px 0px -12% 0px' }
  );
  io.observe(root.querySelector('.ph'));
  io.observe(root.querySelector('.pt-grid'));
}

