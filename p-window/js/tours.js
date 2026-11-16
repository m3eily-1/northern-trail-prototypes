// Rest stop, part 1: tours and experiences as tickets pinned on the rest-stop
// board. Filter by region or stop; tickets unpin and re-pin when it changes.
import { t, esc, asset, ui, lang, reduced, priceLabel, icons, splitWords, inview } from './util.js';

const DESK = 8; // tickets shown before "Show all" on wide screens

export function initTours(data) {
  const root = document.getElementById('tours');
  const S = data.sections.tours;
  const tours = data.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));

  const filters = [{ key: 'all', label: ui.all, n: tours.length, group: 0, test: () => true }];
  data.regions.forEach((r) => {
    const n = tours.filter((x) => x.region === r.key).length;
    if (n) filters.push({ key: `r:${r.key}`, label: t(r.name), n, group: 1, test: (x) => x.region === r.key });
  });
  data.stops.forEach((s) => {
    const n = tours.filter((x) => x.stop === s.key).length;
    if (n) filters.push({ key: `s:${s.key}`, label: t(s.name), n, group: 2, test: (x) => x.stop === s.key });
  });

  const chip = (f) =>
    `<button class="chip" type="button" data-f="${f.key}" aria-pressed="${f.key === 'all'}"><span>${esc(f.label)}</span><span class="chip__n">${f.n}</span></button>`;
  const group = (g, label) => {
    const list = filters.filter((f) => f.group === g);
    return `<div class="chips__g" role="group" aria-label="${esc(label)}">${g ? `<span class="chips__l" aria-hidden="true">${esc(label)}</span>` : ''}<div class="chips__row">${list.map(chip).join('')}</div></div>`;
  };

  const ticket = (x, i) => {
    const stop = stopBy[x.stop];
    const price = priceLabel(x.price);
    const title = t(x.title);
    return `<li class="tk" data-i="${i}">
      <a class="tk__a" href="${esc(x.href[lang] || x.href.en)}" target="_blank" rel="noopener">
        <i class="tk__pin" aria-hidden="true"></i>
        <span class="tk__photo"><img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async"></span>
        <span class="tk__body">
          <span class="tk__type">${esc(t(x.type))}</span>
          <h3 class="tk__title" title="${esc(title)}">${esc(title)}</h3>
          <span class="tk__meta"><span>${esc(stop ? t(stop.name) : '')}</span><span>${esc(t(x.until))}</span></span>
        </span>
        <span class="tk__perf" aria-hidden="true"></span>
        <span class="tk__stub">
          <span class="tk__price">${price ? esc(price) : ''}</span>
          <span class="tk__cta">${esc(t(S.cta))}${icons.ext}<span class="sr-only">, ${esc(ui.newTab)}</span></span>
        </span>
      </a>
    </li>`;
  };

  root.innerHTML = `
    <div class="rest" aria-hidden="true">
      <div class="nt-wrap rest__in">
        <div class="rest__sign"><span class="rest__p">P</span><span class="rest__t">${esc(ui.restStop)}</span></div>
        <p class="rest__line">${esc(ui.restLine)}</p>
      </div>
    </div>
    <div class="nt-wrap">
      <header class="pr__head">
        <p class="nt-eyebrow pr__eyebrow">${esc(ui.pinned)}</p>
        <h2 class="nt-h2 pr__title" id="tours-title">${esc(t(S.title))}</h2>
        <p class="pr__sub">${esc(t(S.sub))}</p>
      </header>
      <div class="board">
        <div class="chips">${group(0, ui.all)}${group(1, ui.region)}${group(2, ui.stop)}</div>
        <ul class="tk-list">${tours.map(ticket).join('')}</ul>
        <div class="board__foot">
          <p class="board__count" aria-live="polite"></p>
          <button class="nt-btn nt-btn--light board__more" type="button" aria-expanded="false"></button>
        </div>
      </div>
    </div>`;

  splitWords(root.querySelector('.pr__title'));
  inview(root.querySelector('.pr__head'));
  inview(root.querySelector('.rest'));
  const board = root.querySelector('.board');
  inview(board, '0px 0px -10% 0px');

  const list = root.querySelector('.tk-list');
  const cards = [...list.children];
  const count = root.querySelector('.board__count');
  const more = root.querySelector('.board__more');
  const chips = [...root.querySelectorAll('.chip')];
  let filter = filters[0];
  let all = false;
  let busy = false;

  function apply() {
    const m = cards.filter((c) => filter.test(tours[+c.dataset.i]));
    cards.forEach((c) => {
      const on = m.includes(c);
      c.hidden = !on;
      c.classList.toggle('is-extra', on && m.indexOf(c) >= DESK && !all);
    });
    m.forEach((c, j) => c.style.setProperty('--j', String(j % DESK)));
    more.hidden = m.length <= DESK;
    more.textContent = all ? ui.showLess : ui.showAll(m.length);
    more.setAttribute('aria-expanded', String(all));
    count.textContent = ui.onBoard(m.length);
    return m;
  }

  async function swap(fn) {
    if (busy) return;
    busy = true;
    if (!reduced) {
      list.classList.add('is-out');
      await new Promise((r) => setTimeout(r, 260));
    }
    fn();
    apply();
    if (!reduced) {
      list.classList.remove('is-out');
      list.classList.add('is-pin');
      void list.offsetWidth;
      list.classList.remove('is-pin');
    }
    busy = false;
  }

  chips.forEach((b) =>
    b.addEventListener('click', () => {
      const f = filters.find((x) => x.key === b.dataset.f);
      if (f === filter) return;
      chips.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      swap(() => {
        filter = f;
        all = false;
      });
    })
  );
  more.addEventListener('click', () => {
    all = !all;
    apply();
    if (!all) board.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  });
  apply();
}
