// Practical sections, passport edition: tours as boarding passes (the stop's stamp thuds onto the
// pass on hover and the stub tears at the perforation), stays as visa pages with a holographic
// sheen and a machine-readable line, tips as stamp-slot notes, and the FAQ as a declaration form
// whose box gets an ink tick when a question opens. One module, one greylabel section each part.
import { esc, pad2, mqPhone } from './i18n.js';
import { stampArt, stampMeta } from './stamp.js';

const L = {
  en: {
    section: 'Page',
    all: 'All stops',
    filter: 'Filter tours by stop',
    showAll: (n) => `Show all ${n}`,
    showFewer: 'Show fewer',
    showing: (a, b) => `Showing ${a} of ${b}`,
    free: 'Free',
    from: (p) => `From SAR ${p}`,
    pass: 'Boarding pass',
    stop: 'Stop',
    type: 'Type',
    by: 'Organizer',
    visa: 'Visa',
    city: 'City',
    note: 'Note',
    declaration: 'Traveller declaration',
    newTab: 'opens webook in a new tab',
  },
  ar: {
    section: 'صفحة',
    all: 'كل المحطات',
    filter: 'تصفية الجولات حسب المحطة',
    showAll: (n) => `عرض الكل (${n})`,
    showFewer: 'عرض أقل',
    showing: (a, b) => `${a} من ${b}`,
    free: 'مجانًا',
    from: (p) => `تبدأ من ${p} ر.س`,
    pass: 'بطاقة صعود',
    stop: 'المحطة',
    type: 'النوع',
    by: 'المنظم',
    visa: 'تأشيرة',
    city: 'المدينة',
    note: 'ملاحظة',
    declaration: 'إقرار المسافر',
    newTab: 'يفتح webook في نافذة جديدة',
  },
};

const ARROW = '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>';
const CHEV = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 7.5 10 13l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>';
const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="tick" d="M4 13.5 9.5 19 20 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"/></svg>';
const PENDING = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 1.5h8M4 14.5h8M5 1.5v3L8 8l3-3.5v-3M5 14.5v-3L8 8l3 3.5v3" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

const TIP_ICON = {
  plane: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 18l24-9-6 16-6-6-5 5v-7z"/><path d="M16 19l12-10"/></svg>',
  temperature: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 5h6v14.5a5.5 5.5 0 1 1-6 0z"/><path d="M16 12v11" stroke-linecap="square"/><path d="M22 9h4M22 13h3" stroke-linecap="square"/></svg>',
  route: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="4" y="4" width="6" height="6"/><rect x="22" y="22" width="6" height="6"/><path d="M10 7h11a4 4 0 0 1 0 8H11a4 4 0 0 0 0 8h11" stroke-dasharray="3 3"/></svg>',
  clock: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="5" y="5" width="22" height="22"/><path d="M16 9v7.5h6"/></svg>',
  fuel: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M6 27V6h13v21M4 27h17"/><path d="M9 10h7v5H9z"/><path d="M19 13h3l3 3v8a2 2 0 0 0 4 0V11l-3-3"/></svg>',
};

// Machine-readable zone line for a visa: Latin only, like the real thing
const mrz = (name, city) => {
  const clean = (s) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '<').replace(/^<|<$/g, '');
  return `V<NTRAIL<<${clean(name)}<<${clean(city)}`.padEnd(44, '<').slice(0, 44);
};

export function mountPractical(root, ctx) {
  const { C, lang, reduced, asset } = ctx;
  const gsap = window.gsap;
  const t = L[lang];
  const tx = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] ?? o.en));
  const S = C.sections;
  const phoneMQ = mqPhone();
  const stopBy = Object.fromEntries(C.stops.map((s) => [s.key, s]));
  const regionBy = Object.fromEntries(C.regions.map((r) => [r.key, r]));

  const head = (n, title, sub, id) => `
    <header class="tv-head" data-reveal>
      <span class="tv-head__stamp" aria-hidden="true"><span>${t.section}</span><b>${pad2(n)}</b></span>
      <div class="tv-head__text">
        <h2 class="nt-h2" id="${id}">${esc(title)}</h2>
        ${sub ? `<p class="tv-head__sub">${esc(sub)}</p>` : ''}
      </div>
    </header>`;

  /* ---------------- tours: boarding passes ---------------- */
  const tours = C.tours;
  const tourStops = C.stops.map((s) => s.key).filter((k) => tours.some((x) => x.stop === k));
  const count = (k) => tours.filter((x) => x.stop === k).length;
  const priceText = (p) => (p == null ? '' : p === 0 ? t.free : t.from(p));

  const pass = (x) => {
    const st = stopBy[x.stop];
    const meta = stampMeta(st);
    return `
      <li class="bp" data-pr-card data-stop="${x.stop}" data-region="${x.region}">
        <a class="bp__link" href="${esc(tx(x.href))}" target="_blank" rel="noopener">
          <div class="bp__band">
            <span>${t.pass}</span>
            <span class="bp__type">${esc(tx(x.type))}</span>
          </div>
          <figure class="bp__ph"><img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async"></figure>
          <div class="bp__main">
            <h3 class="bp__title">${esc(tx(x.title))}</h3>
            <dl class="bp__fields">
              <div><dt>${t.stop}</dt><dd><b dir="ltr">${pad2(st.n)}</b> ${esc(tx(st.name))}</dd></div>
              <div><dt>${t.by}</dt><dd>${esc(x.organizer || regionBy[x.region].name[lang])}</dd></div>
            </dl>
            <p class="bp__until">${esc(tx(x.until))}</p>
            <span class="bp__stamp${st.sticker ? ' is-sticker' : ''}" style="--rot:${meta.rot}deg" aria-hidden="true">${stampArt(st, asset)}</span>
          </div>
          <div class="bp__stub">
            <span class="bp__price">${esc(priceText(x.price))}</span>
            <span class="bp__cta"><span>${esc(tx(S.tours.cta))}</span>${ARROW}</span>
            <span class="bp__code" aria-hidden="true"></span>
          </div>
          <span class="sr-only">(${t.newTab})</span>
        </a>
      </li>`;
  };

  /* ---------------- stays: visa pages ---------------- */
  const stays = [...C.stays].sort((a, b) => ['riyadh', 'qassim', 'hail'].indexOf(a.region) - ['riyadh', 'qassim', 'hail'].indexOf(b.region));
  const visa = (s, i) => {
    const price = s.priceFrom != null
      ? (lang === 'ar' ? `${tx(S.stays.from)} ${s.priceFrom} ر.س ${tx(S.stays.night)}` : `${tx(S.stays.from)} SAR ${s.priceFrom} ${tx(S.stays.night)}`)
      : '';
    const href = s.href ? tx(s.href) : null;
    const inner = `
      <div class="visa__top"><span>${t.visa} <b dir="ltr">${pad2(i + 1)}</b></span><span>${esc(regionBy[s.region].name[lang])}</span></div>
      <div class="visa__grid">
        <figure class="visa__ph"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async"></figure>
        <div class="visa__id">
          <p class="visa__label">${t.city}</p>
          <p class="visa__city">${esc(tx(s.city))}</p>
        </div>
      </div>
      <h3 class="visa__name">${esc(tx(s.name))}</h3>
      <p class="visa__tag">${esc(tx(s.tagline))}</p>
      <p class="visa__desc">${esc(tx(s.desc))}</p>
      <div class="visa__foot">
        <p class="visa__price">${esc(price)}</p>
        ${href
          ? `<span class="bp__cta"><span>${esc(tx(S.tours.cta))}</span>${ARROW}</span>`
          : `<p class="visa__soon">${PENDING}<span>${esc(tx(S.stays.soon))}</span></p>`}
      </div>
      <p class="visa__mrz" dir="ltr" aria-hidden="true">${esc(mrz(s.name.en, s.city.en))}</p>
      <span class="visa__sheen" aria-hidden="true"></span>`;
    return `<li class="visa" data-pr-stay>${href
      ? `<a class="visa__card" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="visa__card">${inner}</article>`}</li>`;
  };

  root.innerHTML = `
    <section class="tv tv--tours" data-pr="tours" aria-labelledby="tv-tours">
      <div class="nt-wrap">
        ${head(1, tx(S.tours.title), tx(S.tours.sub), 'tv-tours')}
        <div class="tv-filters" role="group" aria-label="${t.filter}" data-reveal>
          <button class="tab" type="button" data-filter="all" aria-pressed="true"><span>${t.all}</span><b dir="ltr">${tours.length}</b></button>
          ${tourStops.map((k) => `<button class="tab" type="button" data-filter="${k}" aria-pressed="false"><span>${esc(tx(stopBy[k].name))}</span><b dir="ltr">${count(k)}</b></button>`).join('')}
        </div>
        <p class="tv-count" aria-live="polite"></p>
        <ul class="bps">${tours.map(pass).join('')}</ul>
        <div class="tv-more"><button class="nt-btn tv-more__btn" type="button" aria-expanded="false"></button></div>
      </div>
    </section>

    <section class="tv tv--stays" data-pr="stays" aria-labelledby="tv-stays">
      <div class="nt-wrap">${head(2, tx(S.stays.title), tx(S.stays.sub), 'tv-stays')}</div>
      <ul class="visas nt-wrap">${stays.map(visa).join('')}</ul>
    </section>

    <section class="tv tv--tips" data-pr="tips" aria-labelledby="tv-tips">
      <div class="nt-wrap">
        ${head(3, tx(S.tips.title), '', 'tv-tips')}
        <ol class="notes">
          ${C.tips.map((x, i) => `
            <li class="note" data-pr-tip data-reveal style="--d:${i * 90}ms">
              <span class="note__slot" aria-hidden="true"><span class="note__ink">${TIP_ICON[x.icon] || TIP_ICON.route}</span></span>
              <div class="note__text">
                <p class="note__no">${t.note} ${pad2(i + 1)}</p>
                <h3 class="note__title">${esc(tx(x.title))}</h3>
                <p class="note__body">${esc(tx(x.text))}</p>
              </div>
            </li>`).join('')}
        </ol>
      </div>
    </section>

    <section class="tv tv--faq" data-pr="faq" aria-labelledby="tv-faq">
      <div class="nt-wrap">
        ${head(4, tx(S.faq.title), '', 'tv-faq')}
        <div class="form" data-reveal>
          <p class="form__head" aria-hidden="true"><span>${t.declaration}</span><span dir="ltr">${pad2(C.faq.length)} / ${pad2(C.faq.length)}</span></p>
          <ul class="form__list">
            ${C.faq.map((f, i) => `
              <li class="fq">
                <h3 class="fq__h">
                  <button class="fq__q" type="button" id="fq-q-${i}" aria-expanded="false" aria-controls="fq-a-${i}">
                    <span class="fq__box" aria-hidden="true">${TICK}</span>
                    <span class="fq__no" aria-hidden="true">${pad2(i + 1)}</span>
                    <span class="fq__text">${esc(tx(f.q))}</span>
                    <span class="fq__chev" aria-hidden="true">${CHEV}</span>
                  </button>
                </h3>
                <div class="fq__a" id="fq-a-${i}" role="region" aria-labelledby="fq-q-${i}">
                  <div class="fq__inner"><p>${esc(tx(f.a))}</p></div>
                </div>
              </li>`).join('')}
          </ul>
        </div>
      </div>
    </section>`;

  /* ---------------- tours: filter + show more ---------------- */
  const cards = [...root.querySelectorAll('.bp')];
  const tabs = [...root.querySelectorAll('.tab')];
  const moreBtn = root.querySelector('.tv-more__btn');
  const countEl = root.querySelector('.tv-count');
  const st = { filter: 'all', open: false };
  const limit = () => (matchMedia('(max-width: 767px)').matches ? 4 : 6);

  function apply(animate) {
    const match = cards.filter((c) => st.filter === 'all' || c.dataset.stop === st.filter);
    const shown = st.open ? match : match.slice(0, limit());
    const leaving = cards.filter((c) => !c.hidden && !shown.includes(c));
    const entering = shown.filter((c) => c.hidden);
    const swap = () => {
      cards.forEach((c) => { c.hidden = !shown.includes(c); });
      countEl.textContent = t.showing(shown.length, match.length);
      moreBtn.parentElement.hidden = match.length <= limit();
      moreBtn.textContent = st.open ? t.showFewer : t.showAll(match.length);
      moreBtn.setAttribute('aria-expanded', String(st.open));
    };
    if (!animate || reduced || !gsap) { swap(); return; }
    gsap.killTweensOf(cards);
    const deal = () => {
      swap();
      gsap.set(leaving, { clearProps: 'opacity,visibility,transform' });
      // passes are dealt onto the counter, one after another, with a small tilt
      gsap.fromTo(entering,
        { autoAlpha: 0, y: 36, rotation: (i) => (i % 2 ? 2.5 : -2.5) },
        { autoAlpha: 1, y: 0, rotation: 0, duration: 0.6, ease: 'back.out(1.6)', stagger: 0.06, clearProps: 'opacity,visibility,transform' });
    };
    if (!leaving.length) { deal(); return; }
    gsap.to(leaving, { autoAlpha: 0, y: -12, scale: 0.97, duration: 0.2, ease: 'power2.in', stagger: 0.02, onComplete: deal });
  }
  tabs.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.filter === st.filter) return;
    st.filter = b.dataset.filter;
    st.open = false;
    tabs.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply(true);
  }));
  moreBtn.addEventListener('click', () => { st.open = !st.open; apply(true); });
  phoneMQ.addEventListener('change', () => apply(false));
  apply(false);

  // Hover / focus: the stop's stamp thuds onto the pass
  if (!reduced && gsap) {
    cards.forEach((c) => {
      const stamp = c.querySelector('.bp__stamp');
      const rot = parseFloat(stamp.style.getPropertyValue('--rot')) || 0;
      gsap.set(stamp, { autoAlpha: 0 });
      const thud = () => {
        gsap.killTweensOf(stamp);
        gsap.timeline()
          .fromTo(stamp, { autoAlpha: 0, scale: 1.7, rotation: rot - 16 }, { autoAlpha: 0.9, duration: 0.08, ease: 'none' }, 0)
          .to(stamp, { scale: 0.94, rotation: rot + 2, duration: 0.18, ease: 'power4.in' }, 0)
          .to(stamp, { scale: 1, rotation: rot, duration: 0.5, ease: 'elastic.out(1.1, 0.45)' }, 0.18);
      };
      const lift = () => { gsap.killTweensOf(stamp); gsap.to(stamp, { autoAlpha: 0, duration: 0.25 }); };
      const a = c.querySelector('a');
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') thud(); });
      a.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') lift(); });
      a.addEventListener('focus', thud);
      a.addEventListener('blur', lift);
    });
  }

  /* ---------------- FAQ: one open at a time ---------------- */
  const items = [...root.querySelectorAll('.fq')];
  const setOpen = (idx) => items.forEach((it, i) => {
    it.classList.toggle('is-open', i === idx);
    it.querySelector('.fq__q').setAttribute('aria-expanded', String(i === idx));
  });
  items.forEach((it, i) => it.querySelector('.fq__q').addEventListener('click', () => setOpen(it.classList.contains('is-open') ? -1 : i)));
  setOpen(0);

  /* ---------------- reveals for card groups ---------------- */
  const groups = [...root.querySelectorAll('.bps, .visas')];
  if (reduced || !('IntersectionObserver' in window)) {
    groups.forEach((g) => g.classList.add('is-in', 'is-settled'));
  } else {
    root.classList.add('can-reveal');
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      setTimeout(() => e.target.classList.add('is-settled'), 1400);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    groups.forEach((g) => io.observe(g));
  }
  // reduced motion: the generic [data-reveal] rule only applies with motion, nothing to do
}
