// A stop's own page (the second layer of the greylabel): opened from a stop card on the landing
// page. Content per stop comes from Visit Saudi's Northern Trail stop pages (assets/stops.json);
// what can be booked comes from content.json (webook tours, priced stays, bundles) and goes into
// the same trip list as the landing page.
//
// Sections: hero, sticky "on this page" tabs, overview with the trail ruler, getting there and
// weather, places to discover, book here (postcards) and bundles, more to do, dining, stays,
// tips and FAQ, previous and next stop.
import { pad2 } from './labels.js?v=24';
import { initWebook } from './webook.js?v=24';
import { initTrip, TRIP_ICON } from './trip.js?v=24';
import { makePostcard } from './postcards.js?v=24';
import { initBundles } from './bundles.js?v=24';
import { bkCard } from './book.js?v=24';

const html = document.documentElement;
const lang = html.lang === 'ar' ? 'ar' : 'en';
const rtl = lang === 'ar';
const reduced = html.classList.contains('is-reduced-motion');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const num = (n) => Number(n).toLocaleString('en-US');

const SL = {
  en: {
    trail: 'Northern Trail',
    stopOf: (n, t) => `Stop ${n} of ${t}`,
    start: 'Starting point of the trail',
    fromPrev: (d, name) => `${d} from ${name}`,
    onPage: 'On this page',
    overview: 'Overview',
    getting: 'Getting there',
    places: 'Places',
    book: 'Book',
    more: 'More to do',
    dining: 'Dining',
    stay: 'Stay',
    tips: 'Tips',
    faq: 'FAQs',
    onTrail: 'On the trail',
    rulerAria: 'All 16 stops',
    goStop: (n, name) => `Stop ${n}: ${name}`,
    weatherSub: 'High and low through the year, °C',
    directions: 'Get directions',
    website: 'Website',
    newTab: 'opens in a new tab',
    bookTitle: (s) => `Book in ${s}`,
    bookSub: 'Experiences on webook. Add them to your trip and book everything at once.',
    nearTitle: (r) => `Book nearby in the ${r}`,
    nearSub: (s) => `No webook experiences start in ${s} yet. These start nearby on the same stretch of road.`,
    bundleTitle: 'Bundles for this part of the road',
    bundleSub: 'An experience and a stay nearby, added to your trip together.',
    moreTitle: (s) => `More to do in ${s}`,
    moreSub: 'Experiences listed on Visit Saudi, the official tourism site.',
    stayTitle: (s) => `Where to stay in ${s}`,
    stayNear: (r) => `Stays in the ${r}`,
    staySub: 'Places to stay on Visit Saudi’s list for this stop.',
    stayNearSub: 'There is no stay listed for this stop yet. These are the nearest on the trail.',
    stayK: 'Stay',
    night: (n) => `From SAR ${n} per night`,
    prev: 'Previous stop',
    next: 'Next stop',
    showAll: (n) => `Show all (${n})`,
    showLess: 'Show fewer',
    drive: (d) => `${d} drive`,
    back: 'All stops',
    end: 'End of the trail',
    notFound: 'This stop could not be found.',
  },
  ar: {
    trail: 'مسار الشمال',
    stopOf: (n, t) => `المحطة ${n} من ${t}`,
    start: 'نقطة انطلاق المسار',
    fromPrev: (d, name) => `${d} من ${name}`,
    onPage: 'في هذه الصفحة',
    overview: 'نظرة عامة',
    getting: 'الوصول',
    places: 'الأماكن',
    book: 'احجز',
    more: 'المزيد',
    dining: 'المطاعم',
    stay: 'الإقامة',
    tips: 'نصائح',
    faq: 'الأسئلة',
    onTrail: 'على المسار',
    rulerAria: 'المحطات الست عشرة',
    goStop: (n, name) => `المحطة ${n}: ${name}`,
    weatherSub: 'درجات الحرارة العظمى والصغرى خلال العام، °م',
    directions: 'الاتجاهات',
    website: 'الموقع الإلكتروني',
    newTab: 'يفتح في نافذة جديدة',
    bookTitle: (s) => `احجز في ${s}`,
    bookSub: 'تجارب على webook. أضفها إلى رحلتك واحجز كل شيء مرة واحدة.',
    nearTitle: (r) => `احجز بالقرب في ${r}`,
    nearSub: (s) => `لا توجد تجارب على webook تبدأ من ${s} بعد. هذه تبدأ بالقرب على الجزء نفسه من الطريق.`,
    bundleTitle: 'باقات لهذا الجزء من الطريق',
    bundleSub: 'تجربة وإقامة قريبة، تُضافان إلى رحلتك معًا.',
    moreTitle: (s) => `المزيد في ${s}`,
    moreSub: 'تجارب مدرجة في روح السعودية، الموقع الرسمي للسياحة.',
    stayTitle: (s) => `أين تقيم في ${s}`,
    stayNear: (r) => `الإقامة في ${r}`,
    staySub: 'أماكن إقامة من قائمة روح السعودية لهذه المحطة.',
    stayNearSub: 'لا توجد إقامة مدرجة لهذه المحطة بعد. هذه الأقرب على المسار.',
    stayK: 'إقامة',
    night: (n) => `تبدأ من ${n} ر.س لليلة`,
    prev: 'المحطة السابقة',
    next: 'المحطة التالية',
    showAll: (n) => `عرض الكل (${n})`,
    showLess: 'عرض أقل',
    drive: (d) => `${d} بالسيارة`,
    back: 'كل المحطات',
    end: 'نهاية المسار',
    notFound: 'تعذّر العثور على هذه المحطة.',
  },
};
const L = SL[lang];

const ARROW = '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const OUT = '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 14 14 6M8 6h6v6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const PIN = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 18s5.5-5.2 5.5-9.5a5.5 5.5 0 0 0-11 0C4.5 12.8 10 18 10 18Z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="10" cy="8.5" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const CLOCK = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const FLAG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 14V2.5M4 3h8l-1.75 3L12 9H4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
// travel modes, keyed by the icon file Visit Saudi uses for each
const MODE = {
  'airport.svg': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 13.5 21 6.5c.9-.3 1.6.8.9 1.4L14 15l-1 6-2.5-1-1-4.5-4 1.5L4 19l-.5-3 2-1.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  'transportation.svg': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 16v-4l2-5h14l2 5v4zM3 12h18M5 16v3M19 16v3" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7.5" cy="14" r="1" fill="currentColor"/><circle cx="16.5" cy="14" r="1" fill="currentColor"/></svg>',
  'metro_station.svg': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v12H6zM6 10h12M9 15l-3 5M15 15l3 5M8 18h8" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="9" cy="12.5" r="1" fill="currentColor"/><circle cx="15" cy="12.5" r="1" fill="currentColor"/></svg>',
  'metro-riyadh.svg': null,
  'public-transportation.svg': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v13H4zM4 11h16M7 17v3M17 17v3M8 4v7" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="7.5" cy="14" r="1" fill="currentColor"/><circle cx="16.5" cy="14" r="1" fill="currentColor"/></svg>',
  'bus_stations.svg': null,
};
MODE['metro-riyadh.svg'] = MODE['metro_station.svg'];
MODE['bus_stations.svg'] = MODE['public-transportation.svg'];

const letters = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
const isMap = (u) => /maps\.app\.goo\.gl|google\.[a-z.]+\/maps|goo\.gl\/maps/.test(u || '');
const isWeb = (u) => /^https?:\/\//.test(u || '');

async function boot() {
  initWebook(lang);
  const [data, pages] = await Promise.all([
    fetch('../assets/content.json').then((r) => r.json()),
    fetch('../assets/stops.json').then((r) => r.json()),
  ]);
  const t = (o) => (o && typeof o === 'object' ? o[lang] ?? o.en : o);
  const asset = (p) => (p ? `../${p}` : '');
  const isPhone = matchMedia('(max-width: 767px)').matches;
  const ctx = { data, lang, rtl, t, asset, reduced, isPhone };
  ctx.trip = initTrip({ ...ctx, page: 'index.html' });

  const root = document.getElementById('sp');
  const key = new URLSearchParams(location.search).get('stop') || data.stops[0].key;
  const idx = data.stops.findIndex((s) => s.key === key);
  if (idx < 0) {
    root.innerHTML = `<div class="nt-wrap sp-404"><p>${esc(L.notFound)}</p><a class="nt-btn nt-btn--light" href="index.html?lang=${lang}#stops">${esc(L.back)}</a></div>`;
    return;
  }
  const s = data.stops[idx];
  const prev = data.stops[idx - 1];
  const next = data.stops[idx + 1];
  const P = pages[key]?.[lang] || {};
  const region = data.regions.find((r) => r.key === s.region);
  const name = t(s.name);
  const regionName = t(region.name);
  const total = data.stops.length;
  const stopHref = (k) => `stop.html?stop=${k}&lang=${lang}`;
  document.title = `${name} | ${L.trail}`;

  // ---------- what can be booked ----------
  const toursHere = data.tours.filter((x) => x.stop === key);
  const toursNear = toursHere.length ? [] : data.tours.filter((x) => x.region === s.region).slice(0, 4);
  const priced = Object.fromEntries(data.stays.map((x) => [letters(x.name.en).slice(0, 6), x]));
  const enStays = pages[key]?.en?.stays || [];
  const staysVS = (P.stays || []).map((c, i) => ({ ...c, match: priced[letters(enStays[i]?.t).slice(0, 6)] || null }));
  const nearestStay = (x) => {
    let best = null;
    let bd = Infinity;
    data.stops.forEach((st) => {
      const d = (st.lat - x.lat) ** 2 + (st.lng - x.lng) ** 2;
      if (d < bd) (bd = d), (best = st.key);
    });
    return best;
  };
  const staysRegion = staysVS.length ? [] : data.stays.filter((x) => x.region === s.region).sort((a, b) => (nearestStay(a) === key ? -1 : 0) - (nearestStay(b) === key ? -1 : 0));

  // ---------- sections that exist for this stop ----------
  const has = {
    getting: (P.get || []).length || (P.weather || []).length,
    places: (P.places || []).length,
    book: toursHere.length || toursNear.length,
    more: (P.tours || []).length,
    dining: (P.dining || []).length || (P.extra || []).length,
    stay: staysVS.length || staysRegion.length,
    tips: (P.tips || []).length || (P.faq || []).length,
  };
  const tabs = [
    ['overview', L.overview, true],
    ['getting-there', L.getting, has.getting],
    ['places', L.places, has.places],
    ['book', L.book, has.book],
    ['more', L.more, has.more],
    ['dining', L.dining, has.dining],
    ['stay', L.stay, has.stay],
    ['tips', `${L.tips} · ${L.faq}`, has.tips],
  ].filter((x) => x[2]);

  const head = (id, title, sub, k) => `
    <header class="sp-head sp-rv">
      ${k ? `<p class="sp-k">${esc(k)}</p>` : ''}
      <h2 class="sp-h" id="${id}">${esc(title)}</h2>
      ${sub ? `<p class="sp-sub">${esc(sub)}</p>` : ''}
    </header>`;

  // places get directions; dining gets its website; "more to do" items stay unlinked
  // (they are booked elsewhere, so a webook page should not send people away to book)
  const placeCard = (c, i, noWeb) => {
    const link = isMap(c.url) ? [L.directions, PIN] : isWeb(c.url) && noWeb !== true ? [L.website, OUT] : null;
    return `
      <li class="sp-card sp-rv" style="--i:${i % 4}">
        <span class="sp-card__media"><img src="${asset(c.img)}" alt="" loading="lazy" decoding="async"></span>
        <h3 class="sp-card__t">${esc(c.t)}</h3>
        ${c.d ? `<p class="sp-card__d">${esc(c.d)}</p>` : ''}
        ${link ? `<a class="sp-card__link" href="${esc(c.url)}" target="_blank" rel="noopener">${link[1]}<span>${esc(link[0])}</span><span class="ntc-sr"> (${esc(L.newTab)})</span></a>` : ''}
      </li>`;
  };

  const heroImg = P.hero ? asset(P.hero) : asset(s.photo);
  const heroImgM = P.heroM ? asset(P.heroM) : heroImg;
  const drive = s.drive && prev ? L.fromPrev(t(s.drive), t(prev.name)) : L.start;

  // the trail ruler: every stop as a link, this one marked, region breaks between groups
  const ruler = `
    <nav class="sp-ruler" aria-label="${esc(L.rulerAria)}">
      <ol class="sp-ruler__list">
        ${data.stops
          .map((x, i) => {
            const br = i > 0 && data.stops[i - 1].region !== x.region ? ' is-break' : '';
            const cur = x.key === key;
            return `<li class="sp-ruler__i${br}${cur ? ' is-current' : ''}${i < idx ? ' is-past' : ''}"><a href="${stopHref(x.key)}" aria-label="${esc(L.goStop(pad2(x.n), t(x.name)))}"${cur ? ' aria-current="page"' : ''}><i></i><span>${pad2(x.n)}</span></a></li>`;
          })
          .join('')}
      </ol>
    </nav>`;

  const seasons = P.weather || [];
  const tmax = 50;

  root.innerHTML = `
    <section class="sp-hero" aria-labelledby="sp-title">
      <picture class="sp-hero__media">
        <source media="(max-width: 767px)" srcset="${heroImgM}">
        <img src="${heroImg}" alt="" fetchpriority="high">
      </picture>
      <div class="sp-hero__scrim"></div>
      <div class="nt-wrap sp-hero__in">
        <nav class="sp-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><a href="index.html?lang=${lang}#stops">${esc(L.trail)}</a></li>
            <li><span>${esc(regionName)}</span></li>
            <li><span aria-current="page">${esc(name)}</span></li>
          </ol>
        </nav>
        <div class="sp-hero__copy">
          <p class="sp-hero__k"><b>${pad2(s.n)}</b><span>${esc(L.stopOf(pad2(s.n), total))} · ${esc(regionName)}</span></p>
          <h1 class="sp-hero__title" id="sp-title">${esc(name)}</h1>
          <p class="sp-hero__sub">${esc(t(s.desc))}</p>
          <p class="sp-hero__drive">${s.drive ? CLOCK : FLAG}<span>${esc(drive)}</span></p>
        </div>
      </div>
    </section>

    <nav class="sp-jump" aria-label="${esc(L.onPage)}">
      <div class="nt-wrap sp-jump__in">
        <ol class="sp-jump__list">${tabs.map(([id, label]) => `<li><a href="#${id}" data-jump="${id}">${esc(label)}</a></li>`).join('')}</ol>
        <div class="sp-jump__step">
          ${prev ? `<a class="sp-jump__btn" href="${stopHref(prev.key)}" aria-label="${esc(L.prev)}: ${esc(t(prev.name))}"><svg class="nt-flip sp-back" viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H5M9 5l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></a>` : '<span class="sp-jump__btn is-off" aria-hidden="true"></span>'}
          <span class="sp-jump__n">${pad2(s.n)}<small>/${total}</small></span>
          ${next ? `<a class="sp-jump__btn" href="${stopHref(next.key)}" aria-label="${esc(L.next)}: ${esc(t(next.name))}">${ARROW}</a>` : '<span class="sp-jump__btn is-off" aria-hidden="true"></span>'}
        </div>
      </div>
    </nav>

    <section class="sp-sec sp-about" id="overview" aria-labelledby="sp-ov">
      <div class="nt-wrap">
        <div class="sp-about__grid">
          <div class="sp-rv">
            <p class="sp-k">${esc(L.overview)}</p>
            <h2 class="sp-h" id="sp-ov">${esc(P.aboutTitle || name)}</h2>
          </div>
          <div class="sp-rv">
            <p class="sp-about__p">${esc(P.about || t(s.desc))}</p>
            ${(P.tags || []).length ? `<ul class="sp-tags">${P.tags.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
          </div>
        </div>
        <div class="sp-about__trail sp-rv">
          <p class="sp-k">${esc(L.onTrail)}</p>
          ${ruler}
        </div>
      </div>
    </section>

    ${has.getting ? `
    <div class="sadu sadu--deep" aria-hidden="true"></div>
    <section class="sp-sec sp-get" id="getting-there" aria-labelledby="sp-get-t">
      <div class="nt-wrap">
        ${head('sp-get-t', P.getTitle || L.getting)}
        <div class="sp-get__grid">
          <ul class="sp-modes">
            ${(P.get || []).map((g, i) => `<li class="sp-mode sp-rv" style="--i:${i}"><span class="sp-mode__i">${MODE[g.icon] || MODE['transportation.svg']}</span><div><h3 class="sp-mode__t">${esc(g.t)}</h3><p class="sp-mode__d">${esc(g.d)}</p></div></li>`).join('')}
          </ul>
          ${seasons.length ? `
          <div class="sp-weather sp-rv">
            <h3 class="sp-weather__t">${esc(P.weatherTitle || '')}</h3>
            <p class="sp-weather__s">${esc(L.weatherSub)}</p>
            <ul class="sp-weather__list">
              ${seasons.map((w) => {
                const lo = Math.round(parseFloat(w.lo));
                const hi = Math.round(parseFloat(w.hi));
                return `<li><span class="sp-weather__l">${esc(w.label)}</span><span class="sp-weather__bar" aria-hidden="true"><i style="--a:${(lo / tmax) * 100}%;--b:${(hi / tmax) * 100}%"></i></span><span class="sp-weather__v" dir="ltr">${lo}° – ${hi}°</span></li>`;
              }).join('')}
            </ul>
          </div>` : ''}
        </div>
      </div>
    </section>` : ''}

    ${has.places ? `
    <section class="sp-sec sp-places" id="places" aria-labelledby="sp-pl-t">
      <div class="nt-wrap">
        ${head('sp-pl-t', P.placesTitle)}
        <ul class="sp-grid">${P.places.map((c, i) => placeCard(c, i)).join('')}</ul>
      </div>
    </section>` : ''}

    ${has.book ? `
    <section class="sp-sec sp-book post" id="book" aria-labelledby="sp-bk-t">
      <div class="nt-wrap">
        ${toursHere.length ? head('sp-bk-t', L.bookTitle(name), L.bookSub) : head('sp-bk-t', L.nearTitle(regionName), L.nearSub(name))}
        <ul class="pt-grid sp-pt" role="list"></ul>
        <div class="pp__more-row"><button class="nt-btn sp-pt__more" type="button" aria-expanded="false" hidden></button></div>
      </div>
    </section>` : ''}
    <section class="bn sp-bn" id="sp-bundles" aria-labelledby="sp-bn-t"></section>

    ${has.more ? `
    <section class="sp-sec sp-more" id="more" aria-labelledby="sp-mo-t">
      <div class="nt-wrap">
        ${head('sp-mo-t', L.moreTitle(name), L.moreSub)}
        <ul class="sp-grid">${P.tours.map((c, i) => placeCard(c, i, true)).join('')}</ul>
      </div>
    </section>` : ''}

    ${has.dining ? `
    <section class="sp-sec sp-more sp-dining" id="dining" aria-labelledby="sp-di-t">
      <div class="nt-wrap">
        ${(P.dining || []).length ? `${head('sp-di-t', P.diningTitle)}<ul class="sp-grid">${P.dining.map((c, i) => placeCard(c, i)).join('')}</ul>` : ''}
        ${(P.extra || []).map((x, i) => `<div class="sp-extra">${head(`sp-ex-${i}`, x.title)}<ul class="sp-grid">${x.cards.map((c, i) => placeCard(c, i)).join('')}</ul></div>`).join('')}
      </div>
    </section>` : ''}

    ${has.stay ? `
    <section class="sp-sec bk bk--stays sp-stay" id="stay" aria-labelledby="sp-st-t">
      <div class="nt-wrap">
        ${staysVS.length ? head('sp-st-t', P.staysTitle || L.stayTitle(name), L.staySub) : head('sp-st-t', L.stayNear(regionName), L.stayNearSub)}
        <ul class="bk__grid">
          ${staysVS.length
            ? staysVS.map((c) => bkCard({
                href: c.match ? null : isWeb(c.url) ? c.url : null,
                photo: asset(c.img),
                meta: `${L.stayK} · ${c.city || name}`,
                title: c.t,
                place: c.city || name,
                price: c.match?.priceFrom != null ? L.night(num(c.match.priceFrom)) : '',
                newTab: L.newTab,
                after: c.match ? ctx.trip.button(`s:${c.match.key}`) : '',
              })).join('')
            : staysRegion.map((x) => bkCard({
                href: null,
                photo: asset(x.photo),
                meta: `${L.stayK} · ${t(x.city)}`,
                title: t(x.name),
                place: t(x.city),
                price: x.priceFrom != null ? L.night(num(x.priceFrom)) : '',
                newTab: L.newTab,
                after: x.priceFrom != null ? ctx.trip.button(`s:${x.key}`) : '',
              })).join('')}
        </ul>
      </div>
    </section>` : ''}

    ${has.tips ? `
    <div class="sadu sadu--stone" aria-hidden="true"></div>
    <section class="sp-sec sp-tips" id="tips" aria-labelledby="sp-tp-t">
      <div class="nt-wrap sp-tips__grid">
        ${(P.tips || []).length ? `
        <div>
          ${head('sp-tp-t', P.tipsTitle)}
          <ol class="sp-tiplist">${P.tips.map((x, i) => `<li class="sp-rv" style="--i:${i}"><span class="sp-tiplist__n" dir="ltr">${pad2(i + 1)}</span><p>${esc(x)}</p></li>`).join('')}</ol>
        </div>` : ''}
        ${(P.faq || []).length ? `
        <div>
          ${head('sp-fq-t', P.faqTitle)}
          <div class="sp-faq">${P.faq.map((x) => `<details class="sp-qa"><summary><span>${esc(x.q)}</span><i aria-hidden="true"></i></summary><p>${esc(x.a)}</p></details>`).join('')}</div>
        </div>` : ''}
      </div>
    </section>` : ''}

    <nav class="sp-next" aria-label="${esc(L.prev)} / ${esc(L.next)}">
      ${[[prev, L.prev, s.drive], [next, L.next, next?.drive]].map(([x, label, d], i) => x
        ? `<a class="sp-next__a${i ? ' is-next' : ''}" href="${stopHref(x.key)}">
            <img src="${asset(pages[x.key]?.[lang]?.hero || x.photo)}" alt="" loading="lazy">
            <span class="sp-next__in">
              <span class="sp-next__k">${esc(label)} · ${pad2(x.n)}</span>
              <span class="sp-next__t">${esc(t(x.name))}</span>
              ${d ? `<span class="sp-next__d">${CLOCK}${esc(L.drive(t(d)))}</span>` : ''}
            </span>
            <span class="sp-next__go" aria-hidden="true">${i ? ARROW : '<svg class="nt-flip" viewBox="0 0 20 20"><path d="M16 10H5M9 5l-5 5 5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>'}</span>
          </a>`
        : `<a class="sp-next__a is-home${i ? ' is-next' : ''}" href="index.html?lang=${lang}#stops"><span class="sp-next__in"><span class="sp-next__k">${esc(i ? L.end : L.trail)}</span><span class="sp-next__t">${esc(L.back)}</span></span><span class="sp-next__go" aria-hidden="true">${ARROW}</span></a>`).join('')}
    </nav>`;
  root.removeAttribute('aria-busy');

  // bookable postcards and the region's bundles
  const grid = root.querySelector('.sp-pt');
  if (grid) {
    const card = makePostcard(ctx);
    const list = toursHere.length ? toursHere : toursNear;
    grid.innerHTML = list.map(card).join('');
    // long lists (Riyadh has 18) show a first page, then "Show all"
    const pageN = isPhone ? 4 : 8;
    const more = root.querySelector('.sp-pt__more');
    let openAll = false;
    const apply = () => {
      grid.querySelectorAll('.pt').forEach((el, i) => (el.hidden = !openAll && i >= pageN));
      more.hidden = list.length <= pageN;
      more.textContent = openAll ? L.showLess : L.showAll(list.length);
      more.setAttribute('aria-expanded', String(openAll));
    };
    more.addEventListener('click', () => {
      openAll = !openAll;
      apply();
      if (openAll) grid.querySelectorAll('.pt').forEach((el, i) => i >= pageN && el.classList.add('is-in'));
      else root.querySelector('#book').scrollIntoView({ block: 'start' });
    });
    apply();
  }
  initBundles(root.querySelector('#sp-bundles'), ctx, { region: s.region, title: L.bundleTitle, sub: L.bundleSub, headingId: 'sp-bn-t' });
  ctx.trip.sync(root);

  // ---------- jump tabs: active section, smooth jump under the sticky bars ----------
  const jump = root.querySelector('.sp-jump');
  const links = [...jump.querySelectorAll('[data-jump]')];
  const secs = links.map((a) => root.querySelector(`#${a.dataset.jump}`)).filter(Boolean);
  const setOn = (id) => {
    links.forEach((a) => {
      const on = a.dataset.jump === id;
      a.classList.toggle('is-on', on);
      if (on) {
        a.setAttribute('aria-current', 'true');
        const list = jump.querySelector('.sp-jump__list');
        const r = a.getBoundingClientRect();
        const lr = list.getBoundingClientRect();
        if (r.left < lr.left || r.right > lr.right) list.scrollBy({ left: r.left - lr.left - 16, behavior: reduced ? 'auto' : 'smooth' });
      } else a.removeAttribute('aria-current');
    });
  };
  const spy = () => {
    const y = 64 + jump.offsetHeight + 24;
    let cur = secs[0]?.id;
    secs.forEach((sec) => {
      if (sec.getBoundingClientRect().top <= y) cur = sec.id;
    });
    setOn(cur);
  };
  addEventListener('scroll', spy, { passive: true });
  spy();
  links.forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = root.querySelector(`#${a.dataset.jump}`);
      const y = sec.getBoundingClientRect().top + scrollY - 64 - jump.offsetHeight + 1;
      scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
      history.replaceState(null, '', `#${a.dataset.jump}`);
    })
  );
  jump.classList.toggle('is-stuck', false);
  new IntersectionObserver(([e]) => jump.classList.toggle('is-stuck', e.intersectionRatio < 1), { threshold: 1, rootMargin: '-65px 0px 0px 0px' }).observe(jump);

  // keep the current stop in view on the trail ruler
  const rl = root.querySelector('.sp-ruler__list');
  const cur = rl.querySelector('.is-current');
  if (rl.scrollWidth > rl.clientWidth) rl.scrollLeft = cur.offsetLeft - rl.clientWidth / 2 + cur.offsetWidth / 2;

  // ---------- reveals ----------
  if (!reduced) {
    root.classList.add('can-reveal');
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -8% 0px' }
    );
    root.querySelectorAll('.sp-rv').forEach((el) => io.observe(el));
    if (grid) {
      grid.querySelectorAll('.pt').forEach((el, i) => el.style.setProperty('--k', String(i)));
      const gio = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        grid.querySelectorAll('.pt').forEach((el) => el.classList.add('is-in'));
        gio.disconnect();
      }, { rootMargin: '0px 0px -10% 0px' });
      gio.observe(grid);
    }
  }
  root.querySelector('.sp-hero').classList.add('is-in');

  // arriving with #section: land below the sticky bars
  if (location.hash) {
    const sec = root.querySelector(location.hash);
    if (sec) requestAnimationFrame(() => scrollTo(0, sec.getBoundingClientRect().top + scrollY - 64 - jump.offsetHeight + 1));
  }
}

boot().catch((e) => {
  console.error(e);
});
