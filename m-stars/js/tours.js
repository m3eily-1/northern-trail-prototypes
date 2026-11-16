// Tours and Experiences as star-catalogue cards. Filter by region or stop (only
// filters that have items); cards twinkle out and in on change.
import { t, esc, asset, lang, reduced, ui, pad2, priceLabel } from './i18n.js';
import { compactMQ, reveal, splitWords, starGlyph, arrowIcon } from './util.js';

export function initTours(data) {
  const root = document.getElementById('tours');
  const S = data.sections.tours;
  const tours = data.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  const filters = [{ key: 'all', label: ui.all, n: tours.length, group: 'r', test: () => true }];
  data.regions.forEach((r) => {
    const n = tours.filter((x) => x.region === r.key).length;
    if (n) filters.push({ key: `r:${r.key}`, label: t(r.name), n, group: 'r', test: (x) => x.region === r.key });
  });
  data.stops.forEach((s) => {
    const n = tours.filter((x) => x.stop === s.key).length;
    if (n) filters.push({ key: `s:${s.key}`, label: t(s.name), n, group: 's', test: (x) => x.stop === s.key });
  });

  const chip = (f) =>
    `<button class="chip" type="button" data-f="${f.key}" aria-pressed="${f.key === 'all'}"><span class="chip__dot" aria-hidden="true"></span><span class="chip__l">${esc(f.label)}</span><span class="chip__n">${f.n}</span></button>`;

  const card = (x, i) => {
    const stop = stopBy[x.stop];
    const region = regionBy[x.region];
    const price = priceLabel(x.price);
    return `<li class="tc" data-i="${i}">
      <a class="tc__a" href="${esc(x.href[lang] || x.href.en)}" target="_blank" rel="noopener">
        <span class="tc__photo"><img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async"><span class="tc__cross" aria-hidden="true"></span></span>
        <span class="tc__body">
          <span class="tc__row"><span class="tc__cat">T-${pad2(i + 1)}</span><span class="tc__type">${esc(t(x.type))}</span></span>
          <span class="tc__title" title="${esc(t(x.title))}">${esc(t(x.title))}</span>
          <span class="tc__where">${starGlyph('tc__glyph')}<span class="tc__stop">${esc(stop ? t(stop.name) : '')}</span><span class="tc__region">${esc(region ? t(region.name) : '')}</span></span>
          <span class="tc__until">${esc(t(x.until))}</span>
          <span class="tc__foot">
            <span class="tc__price">${price ? esc(price) : ''}</span>
            <span class="tc__cta">${esc(t(S.cta))}${arrowIcon('m-arrow tc__arrow')}<span class="m-sr">, ${esc(ui.newTab)}</span></span>
          </span>
        </span>
      </a>
    </li>`;
  };

  root.innerHTML = `
    <div class="nt-wrap">
      <header class="px__head">
        <p class="m-eyebrow" data-r>${starGlyph()}<span>${esc(ui.catalogue)}</span></p>
        <h2 class="m-h2 m-split" id="tours-title">${esc(t(S.title))}</h2>
        <p class="px__sub" data-r>${esc(t(S.sub))}</p>
      </header>
      <div class="tf" data-r>
        <div class="tf__g" role="group" aria-label="${esc(ui.region)}"><span class="tf__l" aria-hidden="true">${esc(ui.region)}</span><div class="tf__chips">${filters.filter((f) => f.group === 'r').map(chip).join('')}</div></div>
        <div class="tf__g" role="group" aria-label="${esc(ui.stopF)}"><span class="tf__l" aria-hidden="true">${esc(ui.stopF)}</span><div class="tf__chips">${filters.filter((f) => f.group === 's').map(chip).join('')}</div></div>
      </div>
      <ul class="tc-grid">${tours.map(card).join('')}</ul>
      <div class="tc-more">
        <p class="tc-status" aria-live="polite"></p>
        <button class="m-ghost tc-more__btn" type="button"><span class="tc-more__l"></span>${starGlyph()}</button>
      </div>
    </div>`;

  const h2 = root.querySelector('h2');
  splitWords(h2);
  reveal(h2);
  root.querySelectorAll('[data-r]').forEach((el) => reveal(el));

  const grid = root.querySelector('.tc-grid');
  const cards = [...grid.children];
  const status = root.querySelector('.tc-status');
  const more = root.querySelector('.tc-more__btn');
  const moreL = root.querySelector('.tc-more__l');
  let filter = filters[0];
  const per = () => (compactMQ.matches ? 4 : 8);
  let limit = per();
  let busy = false;

  const matching = () => cards.filter((c) => filter.test(tours[+c.dataset.i]));

  function layout() {
    const m = matching();
    const shown = m.slice(0, limit);
    cards.forEach((c) => (c.hidden = !shown.includes(c)));
    shown.forEach((c, k) => c.style.setProperty('--k', String(k % per())));
    const rest = m.length - shown.length;
    more.hidden = rest <= 0;
    moreL.textContent = ui.more(Math.min(rest, per()));
    status.textContent = ui.showing(shown.length, m.length);
    return shown;
  }

  async function swap(mutate, keep = false) {
    if (busy) return;
    busy = true;
    const before = cards.filter((c) => !c.hidden);
    if (!reduced && !keep) {
      before.forEach((c) => c.classList.add('is-out'));
      await new Promise((r) => setTimeout(r, 220));
    }
    mutate();
    const shown = layout();
    before.forEach((c) => c.classList.remove('is-out'));
    const fresh = keep ? shown.filter((c) => !before.includes(c)) : shown;
    if (!reduced) {
      fresh.forEach((c) => c.classList.add('is-pre'));
      void grid.offsetWidth;
      requestAnimationFrame(() => fresh.forEach((c) => c.classList.remove('is-pre')));
    }
    busy = false;
    return fresh;
  }

  root.querySelectorAll('.chip').forEach((b) =>
    b.addEventListener('click', () => {
      const f = filters.find((x) => x.key === b.dataset.f);
      if (f === filter) return;
      root.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      swap(() => {
        filter = f;
        limit = per();
      });
    })
  );
  more.addEventListener('click', () => {
    swap(() => (limit += per()), true).then((fresh) => {
      const a = fresh && fresh[0] && fresh[0].querySelector('a');
      if (a) a.focus({ preventScroll: true });
    });
  });
  compactMQ.addEventListener('change', () => {
    limit = per();
    layout();
  });
  layout();
  reveal(grid);
}
