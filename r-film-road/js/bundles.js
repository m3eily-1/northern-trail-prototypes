// Trip bundles: an experience and a stay that sit on the same part of the road, shown as one card
// with both photos, both prices and the total for one guest and one night. "Add both to trip"
// puts the pair in the trip list. Only priced items are paired (they come from content.json).
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const num = (n) => Number(n).toLocaleString('en-US');

export const BUNDLES = [
  {
    key: 'riyadh-heritage',
    tour: 'riyadh-heritage-culture-tour-museum-souk-masmak-diriyah-private-tour',
    stay: 'malfakum-al-diriyah',
    title: { en: 'A heritage day in Riyadh', ar: 'يوم تراثي في الرياض' },
  },
  {
    key: 'riyadh-dunes',
    tour: 'riyadh-red-sand-dunes-camel-ride-quad-sandboarding-adventure',
    stay: 'malfakum-al-diriyah',
    title: { en: 'Red sand dunes, then Diriyah', ar: 'الكثبان الحمراء ثم الدرعية' },
  },
  {
    key: 'shaqra-ushaiqer',
    tour: 'shaqra-ushaiger-tour-up-to-3-pax',
    stay: 'malfakum-al-diriyah',
    title: { en: 'Shaqra and Ushaiqer in a day', ar: 'شقراء وأشيقر في يوم' },
  },
  {
    key: 'unaizah',
    tour: 'northern-trail',
    stay: 'al-malfa-resort',
    title: { en: 'The trail through Unaizah', ar: 'المسار عبر عنيزة' },
  },
  {
    key: 'hail-heritage',
    tour: 'discover-the-heritage-of-hail-private-tour',
    stay: 'millennium-hotel-hail',
    title: { en: 'Heritage of Hail', ar: 'تراث حائل' },
  },
];

const U = {
  en: {
    title: 'Trip bundles',
    sub: 'An experience and a place to stay on the same stretch of road. Add both to your trip in one tap.',
    eyebrow: 'Experience + stay',
    together: 'Together from',
    basis: '1 guest, 1 night',
    addBoth: 'Add both to trip',
    perGuest: 'per guest',
    perNight: 'per night',
    sar: (n) => `SAR ${n}`,
    free: 'Free',
    all: 'All',
    filter: 'Show bundles by region',
  },
  ar: {
    title: 'باقات الرحلة',
    sub: 'تجربة ومكان إقامة على الجزء نفسه من الطريق. أضفهما إلى رحلتك بلمسة واحدة.',
    eyebrow: 'تجربة + إقامة',
    together: 'معًا تبدأ من',
    basis: 'ضيف واحد، ليلة واحدة',
    addBoth: 'أضف الاثنين إلى رحلتك',
    perGuest: 'للضيف',
    perNight: 'لليلة',
    sar: (n) => `${n} ر.س`,
    free: 'مجانًا',
    all: 'الكل',
    filter: 'عرض الباقات حسب المنطقة',
  },
};

const TOUR_I = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 16 8 6l3 6 2-3 4 7z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const STAY_I = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 15V6M3 11h14v4M6 9.5h3M17 15v-4a2 2 0 0 0-2-2h-4v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

// resolve a bundle to its two items (or null when one is missing or unpriced)
export function resolveBundle(b, data) {
  const tour = data.tours.find((x) => x.slug === b.tour);
  const stay = data.stays.find((x) => x.key === b.stay);
  if (!tour || !stay || tour.price == null || stay.priceFrom == null) return null;
  return { ...b, tourItem: tour, stayItem: stay, region: tour.region, total: tour.price + stay.priceFrom };
}

export function bundleCard(b, ctx, i = 0) {
  const { t, lang, asset, trip, data } = ctx;
  const u = U[lang];
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const region = data.regions.find((r) => r.key === b.region);
  const price = (n) => (n === 0 ? u.free : u.sar(num(n)));
  return `
    <li class="bn-card" data-region="${b.region}" style="--i:${i}">
      <div class="bn-card__media">
        <span class="bn-card__ph"><img src="${asset(b.tourItem.photo)}" alt="" loading="lazy" decoding="async"></span>
        <span class="bn-card__ph"><img src="${asset(b.stayItem.photo)}" alt="" loading="lazy" decoding="async"></span>
        <span class="bn-card__plus" aria-hidden="true">+</span>
      </div>
      <div class="bn-card__body">
        <p class="bn-card__k">${esc(u.eyebrow)} · ${esc(t(region?.name))}</p>
        <h3 class="bn-card__t">${esc(t(b.title))}</h3>
        <ul class="bn-card__items">
          <li><span class="bn-card__i">${TOUR_I}</span><span class="bn-card__n"><a href="${esc(t(b.tourItem.href))}" target="_blank" rel="noopener">${esc(t(b.tourItem.title))}</a><small>${esc(t(stopBy[b.tourItem.stop]?.name))}${b.tourItem.duration ? ` · ${esc(t(b.tourItem.duration))}` : ''}</small></span><span class="bn-card__p">${esc(price(b.tourItem.price))}<small>${esc(u.perGuest)}</small></span></li>
          <li><span class="bn-card__i">${STAY_I}</span><span class="bn-card__n"><span>${esc(t(b.stayItem.name))}</span><small>${esc(t(b.stayItem.city))}</small></span><span class="bn-card__p">${esc(price(b.stayItem.priceFrom))}<small>${esc(u.perNight)}</small></span></li>
        </ul>
        <div class="bn-card__foot">
          <p class="bn-card__sum"><span>${esc(u.together)}</span><b>${esc(price(b.total))}</b><small>${esc(u.basis)}</small></p>
          ${trip ? trip.button([`t:${b.tour}`, `s:${b.stay}`], { label: u.addBoth }) : ''}
        </div>
      </div>
    </li>`;
}

// The landing page section (all bundles, region chips) or a stop page block (one region).
export function initBundles(root, ctx, { region = null, title, sub, headingId = 'bn-title' } = {}) {
  const { t, lang, data, reduced } = ctx;
  const u = U[lang];
  const list = BUNDLES.map((b) => resolveBundle(b, data))
    .filter(Boolean)
    .filter((b) => !region || b.region === region);
  if (!list.length) {
    root.hidden = true;
    return null;
  }
  const regions = data.regions.filter((r) => list.some((b) => b.region === r.key));
  root.innerHTML = `
    <div class="nt-wrap">
      <header class="bn__head">
        <div>
          <h2 class="bn__title" id="${headingId}">${esc(title || u.title)}</h2>
          <p class="bn__sub">${esc(sub || u.sub)}</p>
        </div>
        ${!region && regions.length > 1
          ? `<div class="bk-chips bn__chips" role="group" aria-label="${esc(u.filter)}"><div class="bk-chips__group">${[['all', u.all, list.length], ...regions.map((r) => [r.key, t(r.name), list.filter((b) => b.region === r.key).length])]
              .map(([k, l, n], i) => `<button class="bk-chip" type="button" data-k="${k}" aria-pressed="${i === 0}"><span>${esc(l)}</span><b>${n}</b></button>`)
              .join('')}</div></div>`
          : ''}
      </header>
      <ul class="bn__grid">${list.map((b, i) => bundleCard(b, ctx, i)).join('')}</ul>
    </div>`;

  root.querySelector('.bn__chips')?.addEventListener('click', (e) => {
    const c = e.target.closest('.bk-chip');
    if (!c) return;
    root.querySelectorAll('.bn__chips .bk-chip').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    root.querySelectorAll('.bn-card').forEach((el) => (el.hidden = c.dataset.k !== 'all' && el.dataset.region !== c.dataset.k));
    window.ScrollTrigger?.refresh();
  });

  ctx.trip?.sync(root);
  if (!reduced) {
    root.classList.add('can-rise');
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -10% 0px' }
    );
    io.observe(root.querySelector('.bn__grid'));
  }
  return list;
}
