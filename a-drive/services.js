/* Direction A: The Drive. Service area after the road ends.
   Four practical sections styled as a highway rest stop at night: each section opens with an
   exit sign, tours are pump-board cards whose price rolls like a fuel-pump counter, stays are
   motel boards with an unlit "coming soon" lamp, tips are road signs that pop up, and the FAQ is a
   row of kilometre markers. Self-contained: everything comes from content.json via ctx. */

const UI = {
  en: {
    exit: 'Exit',
    all: 'All stops',
    filter: 'Filter tours by stop',
    showAll: (n) => `Show all ${n}`,
    showFewer: 'Show fewer',
    showing: (a, b) => `${a} of ${b}`,
    free: 'Free',
    sar: 'SAR',
    by: 'By',
    newTab: 'opens webook in a new tab',
    stop: 'Stop',
  },
  ar: {
    exit: 'مخرج',
    all: 'كل المحطات',
    filter: 'تصفية الجولات حسب المحطة',
    showAll: (n) => `عرض الكل (${n})`,
    showFewer: 'عرض أقل',
    showing: (a, b) => `${a} من ${b}`,
    free: 'مجانًا',
    sar: 'ر.س',
    by: 'تنظيم',
    newTab: 'يفتح webook في نافذة جديدة',
    stop: 'محطة',
  },
};

const ICON = {
  arrow: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M4 10h11M11 5l5 5-5 5"/></svg>',
  clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1.5" y="1.5" width="13" height="13"/><path d="M8 4v4.5h3"/></svg>',
  pin: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 14.5s-4.5-4.6-4.5-8a4.5 4.5 0 0 1 9 0c0 3.4-4.5 8-4.5 8z"/><path d="M8 8.2v-.1"/></svg>',
  plus: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M10 4v12M4 10h12"/></svg>',
  // sign pictograms
  ticket: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M4 9h24v4a3 3 0 0 0 0 6v4H4v-4a3 3 0 0 0 0-6z"/><path d="M20 9v14" stroke-dasharray="2 3"/></svg>',
  bed: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M4 8v18M4 20h24v6M28 20v-4a4 4 0 0 0-4-4H14v8"/><rect x="7" y="13" width="5" height="4"/></svg>',
  info: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M16 14v11M13 25h6M13 14h3"/><path d="M16 8v.5" stroke-width="3.4"/></svg>',
  ask: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"><path d="M11 11a5 5 0 1 1 7 4.6c-1.3.6-2 1.5-2 2.9V20"/><path d="M16 25v.5" stroke-width="3.4"/></svg>',
};

// Line icons for the tips (content.json names them)
const TIP_ICON = {
  plane: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 18l24-9-6 16-6-6-5 5v-7z"/><path d="M16 19l12-10"/></svg>',
  temperature: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 5h6v14.5a5.5 5.5 0 1 1-6 0z"/><path d="M16 12v11" stroke-linecap="square"/><path d="M22 9h4M22 13h3" stroke-linecap="square"/></svg>',
  route: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="4" y="4" width="6" height="6"/><rect x="22" y="22" width="6" height="6"/><path d="M10 7h11a4 4 0 0 1 0 8H11a4 4 0 0 0 0 8h11" stroke-dasharray="3 3"/></svg>',
  clock: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><rect x="5" y="5" width="22" height="22"/><path d="M16 9v7.5h6"/></svg>',
  fuel: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M6 27V6h13v21M4 27h17"/><path d="M9 10h7v5H9z"/><path d="M19 13h3l3 3v8a2 2 0 0 0 4 0V11l-3-3"/></svg>',
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pad2 = (n) => String(n).padStart(2, '0');

export function mountServices(root, ctx) {
  const { C, LANG, REDUCE, gsap, phoneMQ } = ctx;
  const L = UI[LANG];
  const tx = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[LANG] ?? o.en));
  const asset = (p) => (p ? `../${p}` : '');
  const S = C.sections;
  const stopBy = Object.fromEntries(C.stops.map((s) => [s.key, s]));
  const regionBy = Object.fromEntries(C.regions.map((r) => [r.key, r]));

  /* ---------------- shared bits ---------------- */

  const exitSign = (n, icon, title, sub, id) => `
    <header class="svc-head" data-svc-reveal>
      <div class="svc-sign">
        <span class="svc-sign__tab">${esc(L.exit)} <b>${pad2(n)}</b></span>
        <div class="svc-sign__panel">
          <span class="svc-sign__icon" aria-hidden="true">${icon}</span>
          <div class="svc-sign__text">
            <h2 class="svc-sign__title" id="${id}">${esc(title)}</h2>
            ${sub ? `<p class="svc-sign__sub">${esc(sub)}</p>` : ''}
          </div>
        </div>
        <div class="svc-sign__posts" aria-hidden="true"><i></i><i></i></div>
      </div>
    </header>`;

  // Pump readout: each digit is a 0-9 strip that rolls into place on hover
  const pump = (value, label) => {
    if (value == null) return '<span class="pump pump--none"></span>';
    if (value === 0) return `<span class="pump pump--free"><span class="pump__word">${esc(L.free)}</span></span>`;
    const digits = String(value).split('').map((d) => `
      <span class="pump__d"><span class="pump__s" style="--d:${d}">${'0123456789'.split('').map((k) => `<span>${k}</span>`).join('')}</span></span>`).join('');
    return `<span class="pump" aria-hidden="true"><span class="pump__cur">${esc(L.sar)}</span><span class="pump__digits" dir="ltr">${digits}</span></span><span class="sr-only">${esc(label)}</span>`;
  };
  const priceLabel = (p) => (p == null ? '' : p === 0 ? L.free : LANG === 'ar' ? `تبدأ من ${p} ر.س` : `From SAR ${p}`);

  /* ---------------- tours ---------------- */

  const tours = C.tours;
  const order = C.stops.map((s) => s.key);
  const tourStops = order.filter((k) => tours.some((t) => t.stop === k));
  const counts = Object.fromEntries(tourStops.map((k) => [k, tours.filter((t) => t.stop === k).length]));

  const tourCard = (t, i) => {
    const st = stopBy[t.stop];
    const href = t.href ? tx(t.href) : null;
    const price = priceLabel(t.price);
    const org = t.organizer ? `${L.by} ${t.organizer}` : '';
    return `
      <li class="tour" data-pr-card data-stop="${t.stop}" data-i="${i}">
        <a class="tour__link" href="${esc(href)}" target="_blank" rel="noopener">
          <figure class="tour__ph"><img src="${asset(t.photo)}" alt="" loading="lazy" decoding="async"></figure>
          <div class="tour__body">
            <div class="tour__meta">
              <span class="plate" aria-hidden="true">${pad2(st.n)}</span>
              <span class="tour__stop">${esc(tx(st.name))}</span>
              <span class="tour__type">${esc(tx(t.type))}</span>
            </div>
            <h3 class="tour__title" title="${esc(tx(t.title))}">${esc(tx(t.title))}</h3>
            <p class="tour__line">${ICON.clock}<span>${esc(tx(t.until))}</span></p>
            <p class="tour__org">${esc(org)}</p>
          </div>
          <div class="tour__foot">
            ${pump(t.price, price)}
            <span class="tour__cta"><span>${esc(tx(S.tours.cta))}</span>${ICON.arrow}</span>
          </div>
          <span class="sr-only">(${esc(L.newTab)})</span>
        </a>
      </li>`;
  };

  const chip = (key, label, n, plate) => `
    <button class="chip" type="button" data-filter="${key}" aria-pressed="${key === 'all'}">
      ${plate ? `<span class="plate" aria-hidden="true">${plate}</span>` : ''}
      <span class="chip__label">${esc(label)}</span>
      <span class="chip__n">${n}</span>
    </button>`;

  /* ---------------- stays ---------------- */

  const stayCard = (s) => {
    const r = regionBy[s.region];
    const price = s.priceFrom != null
      ? (LANG === 'ar'
        ? `${tx(S.stays.from)} ${s.priceFrom} ${L.sar} ${tx(S.stays.night)}`
        : `${tx(S.stays.from)} ${L.sar} ${s.priceFrom} ${tx(S.stays.night)}`)
      : '';
    const href = s.href ? tx(s.href) : null;
    const inner = `
      <figure class="stay__ph">
        <img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async">
        <span class="stay__region">${esc(tx(r.name))}</span>
      </figure>
      <div class="stay__body">
        <p class="stay__city">${ICON.pin}<span>${esc(tx(s.city))}</span></p>
        <h3 class="stay__name">${esc(tx(s.name))}</h3>
        <p class="stay__tag">${esc(tx(s.tagline))}</p>
        <p class="stay__desc">${esc(tx(s.desc))}</p>
      </div>
      <div class="stay__foot">
        <p class="stay__price">${esc(price)}</p>
        ${href
          ? `<span class="tour__cta"><span>${esc(tx(S.tours.cta))}</span>${ICON.arrow}</span>`
          : `<p class="stay__soon"><span class="lamp" aria-hidden="true"></span><span>${esc(tx(S.stays.soon))}</span></p>`}
      </div>`;
    return `<li class="stay" data-pr-stay>${href
      ? `<a class="stay__card" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="stay__card">${inner}</article>`}</li>`;
  };
  const stays = [...C.stays].sort((a, b) => ['riyadh', 'qassim', 'hail'].indexOf(a.region) - ['riyadh', 'qassim', 'hail'].indexOf(b.region));

  /* ---------------- render ---------------- */

  root.innerHTML = `
    <div class="svc-lot" aria-hidden="true"></div>

    <section class="svc svc--tours" data-pr="tours" aria-labelledby="svc-tours">
      <div class="nt-wrap">
        ${exitSign(1, ICON.ticket, tx(S.tours.title), tx(S.tours.sub), 'svc-tours')}
        <div class="filters" role="group" aria-label="${esc(L.filter)}" data-svc-reveal>
          ${chip('all', L.all, tours.length)}
          ${tourStops.map((k) => chip(k, tx(stopBy[k].name), counts[k], pad2(stopBy[k].n))).join('')}
        </div>
        <p class="tours__count" aria-live="polite" data-count></p>
        <ul class="tours">${tours.map(tourCard).join('')}</ul>
        <div class="tours__more"><button class="more" type="button" data-more aria-expanded="false"></button></div>
      </div>
    </section>

    <section class="svc svc--stays" data-pr="stays" aria-labelledby="svc-stays">
      <div class="nt-wrap">
        ${exitSign(2, ICON.bed, tx(S.stays.title), tx(S.stays.sub), 'svc-stays')}
      </div>
      <div class="stays-wrap">
        <ul class="stays nt-wrap">${stays.map(stayCard).join('')}</ul>
      </div>
    </section>

    <section class="svc svc--tips" data-pr="tips" aria-labelledby="svc-tips">
      <div class="nt-wrap">
        ${exitSign(3, ICON.info, tx(S.tips.title), '', 'svc-tips')}
        <ol class="tips">
          ${C.tips.map((t, i) => `
            <li class="tip" data-pr-tip style="--k:${i}">
              <div class="tip__sign" aria-hidden="true">${TIP_ICON[t.icon] || ICON.info}</div>
              <div class="tip__text">
                <h3 class="tip__title"><span class="tip__n">${pad2(i + 1)}</span>${esc(tx(t.title))}</h3>
                <p class="tip__body">${esc(tx(t.text))}</p>
              </div>
            </li>`).join('')}
        </ol>
      </div>
    </section>

    <section class="svc svc--faq" data-pr="faq" aria-labelledby="svc-faq">
      <div class="nt-wrap">
        ${exitSign(4, ICON.ask, tx(S.faq.title), '', 'svc-faq')}
        <ul class="faq">
          ${C.faq.map((f, i) => `
            <li class="faq__item">
              <h3 class="faq__h">
                <button class="faq__q" type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
                  <span class="plate faq__plate" aria-hidden="true">${pad2(i + 1)}</span>
                  <span class="faq__text">${esc(tx(f.q))}</span>
                  <span class="faq__icon" aria-hidden="true">${ICON.plus}</span>
                </button>
              </h3>
              <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
                <div class="faq__inner"><p>${esc(tx(f.a))}</p></div>
              </div>
            </li>`).join('')}
        </ul>
      </div>
    </section>`;

  /* ---------------- tours: filter + show more ---------------- */

  const cards = [...root.querySelectorAll('.tour')];
  const chips = [...root.querySelectorAll('.chip')];
  const more = root.querySelector('[data-more]');
  const countEl = root.querySelector('[data-count]');
  const state = { filter: 'all', expanded: false };
  const limit = () => (phoneMQ.matches ? 4 : 8);

  function visibleSet() {
    const match = cards.filter((c) => state.filter === 'all' || c.dataset.stop === state.filter);
    const shown = state.expanded ? match : match.slice(0, limit());
    return { match, shown };
  }

  function apply(animate) {
    const { match, shown } = visibleSet();
    const prev = cards.filter((c) => !c.hidden);
    const swap = () => {
      cards.forEach((c) => { c.hidden = !shown.includes(c); });
      shown.forEach((c, k) => c.style.setProperty('--k', String(k % 8)));
      countEl.textContent = L.showing(shown.length, match.length);
      more.parentElement.hidden = match.length <= limit();
      more.textContent = state.expanded ? L.showFewer : L.showAll(match.length);
      more.setAttribute('aria-expanded', String(state.expanded));
    };
    if (!animate || REDUCE || !gsap) { swap(); return; }
    const leaving = prev.filter((c) => !shown.includes(c));
    const entering = shown.filter((c) => c.hidden);
    gsap.killTweensOf(cards);
    const enter = () => {
      swap();
      gsap.set(leaving, { clearProps: 'opacity,visibility,transform' });
      // cars pulling in: each card drives up into its bay
      gsap.fromTo(entering, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.05, clearProps: 'opacity,visibility,transform' });
    };
    if (!leaving.length) { enter(); return; }
    gsap.to(leaving, { autoAlpha: 0, y: 16, duration: 0.18, ease: 'power2.in', stagger: 0.015, onComplete: enter });
  }

  chips.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.filter === state.filter) return;
    state.filter = b.dataset.filter;
    state.expanded = false;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    apply(true);
  }));
  more.addEventListener('click', () => {
    state.expanded = !state.expanded;
    apply(true);
    if (!state.expanded) root.querySelector('.filters').scrollIntoView({ block: 'center', behavior: REDUCE ? 'auto' : 'smooth' });
  });
  phoneMQ.addEventListener('change', () => apply(false));
  apply(false);

  // Fuel-pump roll on hover / focus: digits spin up from zero
  if (!REDUCE) {
    const roll = (card) => {
      const strips = card.querySelectorAll('.pump__s');
      if (!strips.length) return;
      strips.forEach((s) => { s.style.transition = 'none'; s.style.transform = 'translate3d(0,0,0)'; });
      // eslint-disable-next-line no-unused-expressions
      card.offsetWidth;
      strips.forEach((s, i) => {
        s.style.transition = `transform ${0.5 + i * 0.12}s cubic-bezier(0.2, 0.9, 0.25, 1.05)`;
        s.style.transform = '';
      });
    };
    cards.forEach((c) => {
      const a = c.querySelector('a');
      a.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') roll(c); });
      a.addEventListener('focus', () => roll(c));
    });
  }

  /* ---------------- FAQ accordion: one open at a time ---------------- */

  const items = [...root.querySelectorAll('.faq__item')];
  const setOpen = (idx) => {
    items.forEach((it, i) => {
      const open = i === idx;
      it.classList.toggle('is-open', open);
      it.querySelector('.faq__q').setAttribute('aria-expanded', String(open));
    });
  };
  items.forEach((it, i) => it.querySelector('.faq__q').addEventListener('click', () => {
    setOpen(it.classList.contains('is-open') ? -1 : i);
  }));
  setOpen(0);

  /* ---------------- reveals ---------------- */

  const revealTargets = [
    ...root.querySelectorAll('[data-svc-reveal]'),
    ...root.querySelectorAll('.tours'),
    ...root.querySelectorAll('.stays'),
    ...root.querySelectorAll('.tips'),
    ...root.querySelectorAll('.faq'),
  ];
  if (REDUCE || !('IntersectionObserver' in window)) {
    revealTargets.forEach((n) => n.classList.add('is-in'));
  } else {
    root.classList.add('can-reveal');
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      setTimeout(() => e.target.classList.add('is-settled'), 1400);
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    revealTargets.forEach((n) => io.observe(n));
  }
}
