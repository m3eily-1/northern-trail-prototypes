// Practical sections, each its own module: tours (cards arrive buried and
// blow clear, again on every filter change), stays (a gentle drift in on the
// breeze), tips (carved stone wind-markers with pennants that answer the
// gust) and FAQs (the answer surfaces as its sand slides off).
import { t, ui, esc, asset, num, lang, reduced, isPhone, phoneMQ, priceLabel, arrowSvg, inview, pad2 } from './i18n.js';
import { bury, coverOf } from './cover.js';
import { wind, onFrame } from './wind.js';
import { puff } from './particles.js';

function head(id, title, sub) {
  return `<header class="pr__head">
      <h2 class="o-h2 pr__h sand-text" id="${id}">${esc(title)}</h2>
      ${sub ? `<p class="pr__sub reveal">${esc(sub)}</p>` : ''}
    </header>`;
}

const buryHead = (root) => {
  const h = root.querySelector('.pr__h');
  bury(h, { kind: 'text', rate: 0.6 });
  root.querySelectorAll('.pr__head .reveal').forEach((el) => inview(el));
};

/* ------------------------------------------------------------ tours */

export function initTours(data) {
  const root = document.getElementById('tours');
  const S = data.sections.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const tours = data.tours;

  const filters = [{ key: 'all', label: ui.all, n: tours.length, test: () => true, g: 0 }];
  data.regions.forEach((r) => {
    const n = tours.filter((x) => x.region === r.key).length;
    if (n) filters.push({ key: `r:${r.key}`, label: t(r.name), n, g: 1, test: (x) => x.region === r.key });
  });
  data.stops.forEach((s) => {
    const n = tours.filter((x) => x.stop === s.key).length;
    if (n) filters.push({ key: `s:${s.key}`, label: t(s.name), n, g: 2, test: (x) => x.stop === s.key });
  });

  const chip = (f) =>
    `<button class="chip" type="button" data-f="${f.key}" aria-pressed="${f.key === 'all'}"><span>${esc(f.label)}</span><span class="chip__n">${f.n}</span></button>`;
  const group = (g, label) =>
    `<div class="fgroup" role="group" aria-label="${esc(label)}"><span class="fgroup__l" aria-hidden="true">${esc(label)}</span><div class="fgroup__b">${filters
      .filter((f) => f.g === g)
      .map(chip)
      .join('')}</div></div>`;

  const card = (x, i) => {
    const stop = stopBy[x.stop];
    const price = priceLabel(x.price);
    const href = x.href[lang] || x.href.en;
    return `<li class="tc" data-i="${i}">
      <a class="tc__a" href="${esc(href)}" target="_blank" rel="noopener">
        <span class="tc__photo"><img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async" width="800" height="600"></span>
        <span class="tc__body">
          <span class="tc__type">${esc(t(x.type))}</span>
          <span class="tc__title" title="${esc(t(x.title))}">${esc(t(x.title))}</span>
          <span class="tc__meta">${esc(stop ? t(stop.name) : '')}<span aria-hidden="true"> · </span>${esc(t(x.until))}</span>
          <span class="tc__foot">
            <span class="tc__price">${price ? esc(price) : ''}</span>
            <span class="tc__cta">${esc(t(S.cta))}${arrowSvg()}<span class="sr">, ${esc(ui.newTab)}</span></span>
          </span>
        </span>
      </a>
    </li>`;
  };

  root.innerHTML = `
    <div class="nt-wrap">
      ${head('tours-title', t(S.title), t(S.sub))}
      <div class="filters reveal">${group(0, ui.show)}${group(1, ui.region)}${group(2, ui.stop)}</div>
      <ul class="cards cards--tours">${tours.map(card).join('')}</ul>
      <div class="more">
        <p class="more__n" aria-live="polite"></p>
        <button class="nt-btn more__btn" type="button"><span>${esc(ui.more)}</span>
          <svg class="nt-down" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13M4 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
        </button>
      </div>
    </div>`;
  buryHead(root);
  inview(root.querySelector('.filters'));

  const list = root.querySelector('.cards');
  const cards = [...list.children];
  const moreBtn = root.querySelector('.more__btn');
  const moreN = root.querySelector('.more__n');
  let filter = filters[0];
  let shownCount = 0;
  const step = () => (isPhone() ? 4 : 8);

  const coverFor = (li) => {
    if (reduced || isPhone()) return null;
    const a = li.querySelector('.tc__a');
    return coverOf(a) || bury(a, { kind: 'rect', rate: 0.85, startAt: 0.92, cell: 2, spawn: 0.7 });
  };

  function render(limit, fresh) {
    const m = cards.filter((c) => filter.test(tours[+c.dataset.i]));
    shownCount = Math.min(m.length, limit);
    const show = new Set(m.slice(0, shownCount));
    cards.forEach((c) => {
      const was = !c.hidden;
      c.hidden = !show.has(c);
      if (!c.hidden && (!was || fresh)) {
        if (reduced) return;
        if (isPhone()) {
          c.classList.remove('is-in');
          void c.offsetWidth;
          c.classList.add('fade');
          requestAnimationFrame(() => c.classList.add('is-in'));
        } else {
          const cv = coverFor(c);
          if (cv && (cv.built || cv.done)) cv.rebury();
        }
      }
    });
    moreN.textContent = ui.showing(shownCount, m.length);
    moreBtn.hidden = shownCount >= m.length;
  }

  root.querySelectorAll('.chip[data-f]').forEach((b) =>
    b.addEventListener('click', () => {
      const f = filters.find((x) => x.key === b.dataset.f);
      if (f === filter) return;
      root.querySelectorAll('.chip[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      filter = f;
      // a gust off the chip
      const r = b.getBoundingClientRect();
      puff(r, 40, 1, 4, 1.2);
      render(step(), true);
    })
  );
  moreBtn.addEventListener('click', () => {
    const before = shownCount;
    render(shownCount + step(), false);
    const first = cards.filter((c) => !c.hidden)[before];
    if (first) first.querySelector('a').focus({ preventScroll: true });
  });
  phoneMQ.addEventListener('change', () => render(Math.max(shownCount, step()), false));

  render(step(), false);
  if (!reduced)
    cards.forEach((c) => {
      if (isPhone()) {
        c.classList.add('fade');
        inview(c, '0px 0px -6% 0px');
      } else coverFor(c);
    });
}

/* ------------------------------------------------------------ stays */

export function initStays(data) {
  const root = document.getElementById('stays');
  const S = data.sections.stays;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  const card = (s, i) => {
    const price = s.priceFrom != null ? ui.perNight(t(S.from), num(s.priceFrom), t(S.night)) : '';
    const href = s.href ? (typeof s.href === 'string' ? s.href : s.href[lang] || s.href.en) : null;
    const inner = `
      <span class="sc__photo"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="1000" height="750"></span>
      <span class="sc__body">
        <span class="sc__where">${esc(t(s.city))}<span aria-hidden="true"> · </span>${esc(t(regionBy[s.region]?.name))}</span>
        <span class="sc__name">${esc(t(s.name))}</span>
        <span class="sc__tag">${esc(t(s.tagline))}</span>
        <span class="sc__desc">${esc(t(s.desc))}</span>
        <span class="sc__foot">
          <span class="sc__price">${price ? esc(price) : ''}</span>
          ${
            href
              ? `<span class="tc__cta">${esc(t(data.sections.tours.cta))}${arrowSvg()}<span class="sr">, ${esc(ui.newTab)}</span></span>`
              : `<span class="sc__soon">${hourglass()}<span>${esc(t(S.soon))}</span></span>`
          }
        </span>
      </span>`;
    return `<li class="sc drift" style="--i:${i % 4}">${
      href ? `<a class="sc__in" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="sc__in">${inner}</div>`
    }</li>`;
  };

  root.innerHTML = `
    <div class="nt-wrap">
      ${head('stays-title', t(S.title), t(S.sub))}
      <ul class="cards cards--stays">${data.stays.map(card).join('')}</ul>
    </div>`;
  buryHead(root);
  root.querySelectorAll('.sc').forEach((el) => inview(el, '0px 0px -8% 0px'));
}

function hourglass() {
  return '<svg class="sc__ico" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5 2h10M5 18h10M6 2c0 5 8 5 8 8s-8 3-8 8M14 2c0 5-8 5-8 8s8 3 8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>';
}

/* ------------------------------------------------------------ tips */

const TIP_ICONS = {
  plane: '<path d="M3 13l16-6-4 9-4-3-3 4-1-5z" />',
  temperature: '<path d="M10 3v10M7 15a3 3 0 1 0 6 0 3 3 0 0 0-6 0M13 6h3M13 9h2" />',
  route: '<path d="M5 18V12h10V6M15 2v4M15 2l4 2-4 2" /><path d="M3 18h4" />',
  clock: '<path d="M3 11a8 8 0 1 0 16 0 8 8 0 0 0-16 0M11 6v5l3 2" />',
  fuel: '<path d="M4 19V4h9v15M2 19h13M6 7h5v4H6zM13 9h3v7h2V7l-2-3" />'
};

export function initTips(data) {
  const root = document.getElementById('tips');
  const S = data.sections.tips;
  root.innerHTML = `
    <div class="nt-wrap">
      ${head('tips-title', t(S.title), '')}
      <ol class="markers">
        ${data.tips
          .map(
            (x, i) => `<li class="mk reveal" style="--i:${i}">
              <span class="mk__pole" aria-hidden="true"><span class="mk__flag"></span></span>
              <div class="mk__stone">
                <p class="mk__n"><span class="sr">${esc(ui.tip(i + 1))}</span><span aria-hidden="true">${pad2(i + 1)}</span></p>
                <svg class="mk__ico" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" stroke-linejoin="miter">${TIP_ICONS[x.icon] || TIP_ICONS.route}</g></svg>
                <h3 class="mk__title">${esc(t(x.title))}</h3>
                <p class="mk__text">${esc(t(x.text))}</p>
              </div>
            </li>`
          )
          .join('')}
      </ol>
    </div>`;
  buryHead(root);
  const items = [...root.querySelectorAll('.mk')];
  items.forEach((el) => inview(el, '0px 0px -6% 0px'));
  if (reduced) return;

  // pennants answer the wind: the stronger the gust, the flatter they fly
  const flags = items.map((el) => el.querySelector('.mk__flag'));
  let near = false;
  new IntersectionObserver(([e]) => (near = e.isIntersecting)).observe(root);
  const hover = new Set();
  items.forEach((el, i) => {
    el.addEventListener('pointerenter', () => hover.add(i));
    el.addEventListener('pointerleave', () => hover.delete(i));
  });
  onFrame(() => {
    if (!near) return;
    const tm = wind.time;
    flags.forEach((f, i) => {
      const g = Math.min(1.4, wind.gust + (hover.has(i) ? 0.9 : 0));
      const flap = Math.sin(tm * (5 + g * 9) + i * 1.7) * (10 - g * 5) * (1 - g * 0.35);
      const lift = -30 + g * 26; // droops in calm, flies flat in a gust
      f.style.transform = `rotate(${(lift + flap) * wind.dir}deg) scaleX(${0.8 + Math.min(1, g) * 0.25})`;
    });
  });
}

/* ------------------------------------------------------------ faq */

export function initFaq(data) {
  const root = document.getElementById('faq');
  const S = data.sections.faq;
  root.innerHTML = `
    <div class="nt-wrap faq__wrap">
      <div class="faq__start">${head('faq-title', t(S.title), '')}</div>
      <div class="faq__list">
        ${data.faq
          .map(
            (f, i) => `<div class="faq__item">
              <h3 class="faq__q">
                <button class="faq__btn" type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
                  <span class="faq__n" aria-hidden="true">${pad2(i + 1)}</span>
                  <span class="faq__qt">${esc(t(f.q))}</span>
                  <span class="faq__pm" aria-hidden="true"></span>
                </button>
              </h3>
              <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
                <div class="faq__ai"><div class="faq__sand"><p>${esc(t(f.a))}</p></div></div>
              </div>
            </div>`
          )
          .join('')}
      </div>
    </div>`;
  buryHead(root);
  const btns = [...root.querySelectorAll('.faq__btn')];
  const set = (open, animate) =>
    btns.forEach((b) => {
      const on = b === open;
      const item = b.closest('.faq__item');
      const was = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(on));
      item.classList.toggle('is-open', on);
      const panel = document.getElementById(b.getAttribute('aria-controls'));
      panel.inert = !on;
      if (on && !was && animate && !reduced) {
        item.classList.remove('is-slide');
        void item.offsetWidth;
        item.classList.add('is-slide');
        setTimeout(() => {
          const r = panel.getBoundingClientRect();
          if (r.height > 8) puff({ left: r.left, top: r.top, width: r.width, height: Math.min(r.height, 120) }, isPhone() ? 30 : 90, 1, 4, 1.1);
        }, 120);
      }
    });
  btns.forEach((b) => b.addEventListener('click', () => set(b.getAttribute('aria-expanded') === 'true' ? null : b, true)));
  set(btns[0], false);
  root.querySelectorAll('.faq__item').forEach((el) => inview(el));
}

export function initPractical(data) {
  initTours(data);
  initStays(data);
  initTips(data);
  initFaq(data);
}
