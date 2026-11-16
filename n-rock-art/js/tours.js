// Tours and Experiences: stone tablets. Filter by region or stop (only filters
// that have tours). Tablets lift and catch the torch on hover; each links to its
// webook booking page for the current language.
import { t, esc, asset, ui, lang, reduced, priceLabel, chiselWords } from './i18n.js';

const arrow =
  '<svg viewBox="0 0 20 20" aria-hidden="true" class="tab__arrow"><path d="M3 10h13M11 4.5 16.5 10 11 15.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';

export function initTours(data) {
  const root = document.getElementById('tours');
  const S = data.sections.tours;
  const tours = data.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const phone = matchMedia('(max-width: 767px)');

  const filters = [{ key: 'all', label: ui.all, n: tours.length, group: 0, test: () => true }];
  data.regions.forEach((r) => {
    const n = tours.filter((x) => x.region === r.key).length;
    if (n) filters.push({ key: `r:${r.key}`, label: t(r.name), n, group: 1, test: (x) => x.region === r.key });
  });
  data.stops.forEach((s) => {
    const n = tours.filter((x) => x.stop === s.key).length;
    if (n) filters.push({ key: `s:${s.key}`, label: t(s.name), n, group: 2, test: (x) => x.stop === s.key });
  });

  const btn = (f) =>
    `<button class="chip chip--f" type="button" data-f="${f.key}" aria-pressed="${f.key === 'all'}"><span>${esc(f.label)}</span><span class="chip__n">${f.n}</span></button>`;
  const group = (g, label) =>
    `<div class="filters__g" role="group" aria-label="${esc(label)}"><span class="filters__l" aria-hidden="true">${esc(label)}</span><div class="filters__b">${filters
      .filter((f) => f.group === g)
      .map(btn)
      .join('')}</div></div>`;

  const card = (x, i) => {
    const stop = stopBy[x.stop];
    const price = priceLabel(x.price);
    return `<li class="tab" data-i="${i}">
      <a class="tab__a" href="${esc(x.href[lang] || x.href.en)}" target="_blank" rel="noopener">
        <span class="tab__photo"><img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async"></span>
        <span class="tab__body">
          <span class="tab__type">${esc(t(x.type))}</span>
          <h3 class="tab__title">${esc(t(x.title))}</h3>
          <span class="tab__meta"><span>${esc(stop ? t(stop.name) : '')}</span><span aria-hidden="true" class="tab__dot"></span><span>${esc(t(x.until))}</span></span>
          <span class="tab__foot">
            <span class="tab__price">${price ? esc(price) : ''}</span>
            <span class="tab__cta">${esc(t(S.cta))}${arrow}<span class="sr">, ${esc(ui.newTab)}</span></span>
          </span>
        </span>
      </a>
    </li>`;
  };

  root.innerHTML = `
    <div class="nt-wrap">
      <header class="pr__head">
        <h2 class="h2" id="tours-title" data-chisel>${esc(t(S.title))}</h2>
        <p class="pr__sub" data-words>${chiselWords(t(S.sub))}</p>
      </header>
      <div class="filters" data-rise>${group(0, ui.show)}${group(1, ui.region)}${group(2, ui.stop)}</div>
      <ul class="tabs">${tours.map(card).join('')}</ul>
      <div class="tabs__more">
        <button class="nt-btn nt-btn--light more" type="button"><span>${esc(ui.showMore)}</span></button>
        <p class="tabs__count" aria-live="polite"></p>
      </div>
    </div>`;

  const list = root.querySelector('.tabs');
  const cards = [...list.children];
  const more = root.querySelector('.more');
  const count = root.querySelector('.tabs__count');
  let filter = filters[0];
  let limit = 0;
  const per = () => (phone.matches ? 4 : 8);

  function layout(animate) {
    const m = cards.filter((c) => filter.test(tours[+c.dataset.i]));
    const shown = m.slice(0, limit);
    let k = 0;
    cards.forEach((c) => {
      const on = shown.includes(c);
      const was = !c.hidden;
      c.hidden = !on;
      if (on && animate && !was && !reduced) {
        c.style.setProperty('--d', String(k++));
        c.classList.remove('is-cut');
        void c.offsetWidth;
        c.classList.add('is-cut');
      }
    });
    more.hidden = m.length <= limit;
    count.textContent = ui.showing(shown.length) + (m.length > shown.length ? ` / ${m.length}` : '');
  }

  root.querySelectorAll('.chip--f').forEach((b) =>
    b.addEventListener('click', () => {
      const f = filters.find((x) => x.key === b.dataset.f);
      root.querySelectorAll('.chip--f').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      filter = f;
      limit = per();
      cards.forEach((c) => (c.hidden = true));
      layout(true);
    })
  );
  more.addEventListener('click', () => {
    const first = cards.filter((c) => !c.hidden).length;
    limit += per();
    layout(true);
    const next = cards.filter((c) => !c.hidden)[first];
    next && next.querySelector('a').focus({ preventScroll: true });
  });

  // pointer glint on each tablet (cheap: a CSS var on hover only)
  list.addEventListener('pointermove', (e) => {
    const a = e.target.closest('.tab__a');
    if (!a || e.pointerType === 'touch') return;
    const r = a.getBoundingClientRect();
    a.style.setProperty('--gx', `${e.clientX - r.left}px`);
    a.style.setProperty('--gy', `${e.clientY - r.top}px`);
  });

  limit = per();
  layout(false);
}
