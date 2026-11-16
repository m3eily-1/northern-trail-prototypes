// Practical pages at the back of the journal: tours as taped-in tickets (filter
// by circling a word, turn pages of tickets), stays as taped prints, tips as a
// pen-drawn checklist, FAQs as a notes page. Each is its own section module.
import { t, esc, asset, lang, rtl, reduced } from './i18n.js';
import { makePen, renderPaths, marginArrow, stopSketch } from './sketches.js';
import { inview } from './scroll.js';

const L = {
  en: {
    show: 'Show',
    region: 'Region',
    stop: 'Stop',
    all: 'All',
    showing: (n) => `${n} ${n === 1 ? 'ticket' : 'tickets'} on these pages`,
    page: (a, b) => `Page ${a} of ${b}`,
    prev: 'Previous page',
    next: 'Next page',
    from: (n) => `From SAR ${n}`,
    free: 'Free',
    newTab: 'opens webook in a new tab',
    noted: 'Noted on the road',
    faqNote: 'Questions people ask before the drive',
    tipNote: 'Read before you set off'
  },
  ar: {
    show: 'عرض',
    region: 'المنطقة',
    stop: 'المحطة',
    all: 'الكل',
    showing: (n) => (n === 1 ? 'تذكرة واحدة في هذه الصفحات' : n === 2 ? 'تذكرتان في هذه الصفحات' : `${n} تذاكر في هذه الصفحات`),
    page: (a, b) => `صفحة ${a} من ${b}`,
    prev: 'الصفحة السابقة',
    next: 'الصفحة التالية',
    from: (n) => `تبدأ من ${n} ر.س`,
    free: 'مجانًا',
    newTab: 'يفتح webook في نافذة جديدة',
    noted: 'ملاحظات من الطريق',
    faqNote: 'أسئلة تُطرح قبل الانطلاق',
    tipNote: 'اقرأها قبل الانطلاق'
  }
}[lang];

const num = (n) => Number(n).toLocaleString('en-US');
export const priceLabel = (p) => (p == null ? '' : p === 0 ? L.free : L.from(num(p)));
const phoneMQ = matchMedia('(max-width: 899px)');

function uline(seed) {
  const p = makePen(seed, 0.5);
  return renderPaths([p.curve([[2, 9], [50, 4], [110, 8], [170, 4], [236, 7]]), p.curve([[24, 14], [110, 11], [210, 12]])], {
    viewBox: '0 0 240 18',
    cls: 'uline pr-uline'
  }).replace('<svg ', '<svg preserveAspectRatio="none" ');
}

function ring(seed) {
  const p = makePen(seed, 0.9);
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = -0.6 + (i / 12) * Math.PI * 2;
    pts.push([50 + Math.cos(a) * (46 + i * 0.25), 20 + Math.sin(a) * (16 + i * 0.12)]);
  }
  return renderPaths([p.curve(pts)], { viewBox: '0 0 100 40', cls: 'pr-ring' }).replace('<svg ', '<svg preserveAspectRatio="none" ');
}

function penArrow(seed) {
  const p = makePen(seed, 0.4);
  return renderPaths([p.curve([[3, 12], [12, 10], [22, 12], [31, 11]]), p.line([[24, 5], [32, 11], [24, 18]])], {
    viewBox: '0 0 36 24',
    cls: 'pr-arrow'
  });
}

// Pen-drawn line icons for the tips (same wobbly ink as the sketches).
function tipIcon(kind, seed) {
  const p = makePen(seed, 0.45);
  let list;
  if (kind === 'plane') {
    list = [
      p.line([[5, 27], [35, 12]]),
      p.line([[17, 21], [22, 34], [26, 32], [23, 18]]),
      p.line([[19, 20], [14, 8], [18, 7], [26, 16]]),
      p.line([[9, 25], [6, 18], [9, 18], [13, 23]])
    ];
  } else if (kind === 'temperature') {
    list = [p.line([[17, 25], [17, 7], [23, 7], [23, 25]]), p.circle(20, 30, 5.5), p.line([[20, 28], [20, 14]]), p.line([[26, 11], [30, 11]]), p.line([[26, 16], [29, 16]]), p.line([[26, 21], [30, 21]])];
  } else if (kind === 'route') {
    list = [p.curve([[8, 33], [12, 24], [22, 26], [25, 18], [30, 12]]), p.circle(8, 33, 2.6), p.line([[30, 13], [30, 3]]), p.line([[30, 3.5], [37, 6], [30, 8.5]])];
  } else if (kind === 'clock') {
    list = [p.circle(20, 20, 14), p.line([[20, 11], [20, 20], [27, 24]]), p.line([[20, 4], [20, 7]]), p.line([[36, 20], [33, 20]])];
  } else {
    list = [
      p.line([[9, 35], [9, 7], [24, 7], [24, 35]]),
      p.line([[12, 11], [21, 11], [21, 18], [12, 18]], true),
      p.curve([[24, 15], [30, 16], [30, 29], [34, 30], [34, 12], [31, 9]]),
      p.line([[6, 35], [27, 35]])
    ];
  }
  return renderPaths(list, { viewBox: '0 0 40 40', cls: 'doodle pr-ico' });
}

// Page-wise placement on a two-page spread: the first half fills the start
// page (two columns), the rest the end page. Phones ignore --c/--r.
function placeOnPages(els, cols = 2, firstCol = [1, 4]) {
  const k = Math.ceil(els.length / 2);
  els.forEach((el, i) => {
    const onEnd = i >= k;
    const j = onEnd ? i - k : i;
    el.style.setProperty('--c', String(firstCol[onEnd ? 1 : 0] + (j % cols)));
    el.style.setProperty('--r', String(1 + Math.floor(j / cols)));
    el.style.setProperty('--i', String(i));
  });
}

function head(id, title, sub, seed, aside = '') {
  return `
    <header class="pr__head">
      <div class="pr__title">
        <h2 class="pr__h" id="${id}">${esc(title)}</h2>
        ${uline(seed)}
        ${sub ? `<p class="pr__sub">${esc(sub)}</p>` : ''}
      </div>
      ${aside ? `<div class="pr__aside">${aside}</div>` : ''}
    </header>`;
}

/* ------------------------------------------------------------ tours */

export function initTours(data) {
  const root = document.getElementById('tours');
  const S = data.sections.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const tours = data.tours;

  const filters = [{ key: 'all', label: L.all, group: 0, test: () => true }];
  data.regions.forEach((r) => {
    const n = tours.filter((x) => x.region === r.key).length;
    if (n) filters.push({ key: `r:${r.key}`, label: t(r.name), n, group: 1, test: (x) => x.region === r.key });
  });
  data.stops.forEach((s) => {
    const n = tours.filter((x) => x.stop === s.key).length;
    if (n) filters.push({ key: `s:${s.key}`, label: t(s.name), n, group: 2, test: (x) => x.stop === s.key });
  });

  const fBtn = (f, i) =>
    `<button class="pr-f" type="button" data-f="${f.key}" aria-pressed="${f.key === 'all'}"><span class="pr-f__l">${esc(f.label)}</span>${f.n ? `<span class="pr-f__n">${f.n}</span>` : ''}${ring(30 + i)}</button>`;
  const group = (g, label) => {
    const list = filters.filter((f) => f.group === g);
    return `<div class="pr-fg" role="group" aria-label="${esc(label)}"><span class="pr-fg__l" aria-hidden="true">${esc(label)}</span><div class="pr-fg__b">${list.map((f) => fBtn(f, filters.indexOf(f))).join('')}</div></div>`;
  };
  const aside = `<div class="pr-filters">${group(0, L.show)}${group(1, L.region)}${group(2, L.stop)}</div>`;

  const ticket = (x, i) => {
    const stop = stopBy[x.stop];
    const price = priceLabel(x.price);
    return `<li class="tk" data-i="${i}" style="--rot:${[-1.4, 1.1, -0.6, 1.6, -1.8, 0.8][i % 6]}deg">
      <a class="tk__a" href="${esc(x.href[lang] || x.href.en)}" target="_blank" rel="noopener">
        <span class="tape tk__tape" aria-hidden="true"></span>
        ${
          x.photoIsStop && stop
            ? `<span class="tk__photo tk__photo--sketch">${stopSketch(stop.key)}</span>`
            : `<span class="tk__photo"><img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async"></span>`
        }
        <span class="tk__body">
          <span class="tk__stamp">${esc(t(x.type))}</span>
          <h3 class="tk__title" title="${esc(t(x.title))}">${esc(t(x.title))}</h3>
          <span class="tk__meta"><span class="tk__stop">${esc(stop ? t(stop.name) : '')}</span><span class="tk__until">${esc(t(x.until))}</span></span>
        </span>
        <span class="tk__stub">
          <span class="tk__price">${price ? esc(price) : '&nbsp;'}</span>
          <span class="tk__cta">${esc(t(S.cta))}${penArrow(70 + i)}<span class="pr-sr">, ${esc(L.newTab)}</span></span>
        </span>
      </a>
    </li>`;
  };

  root.innerHTML = `
    <div class="spread pr__spread">
      ${head('tours-title', t(S.title), t(S.sub), 41, aside)}
      <ul class="pr-cards pr-cards--tours">${tours.map(ticket).join('')}</ul>
      <nav class="pr-pager" aria-label="${esc(t(S.title))}">
        <button class="pr-pager__btn pr-pager__prev" type="button">${penArrow(91)}<span>${esc(L.prev)}</span></button>
        <p class="pr-pager__n" aria-live="polite"></p>
        <button class="pr-pager__btn pr-pager__next" type="button"><span>${esc(L.next)}</span>${penArrow(92)}</button>
      </nav>
      <p class="pr-sr pr-live" aria-live="polite"></p>
    </div>`;

  const list = root.querySelector('.pr-cards');
  const cards = [...list.children];
  const pager = root.querySelector('.pr-pager');
  const prev = pager.querySelector('.pr-pager__prev');
  const next = pager.querySelector('.pr-pager__next');
  const pageN = pager.querySelector('.pr-pager__n');
  const live = root.querySelector('.pr-live');
  let filter = filters[0];
  let page = 0;
  let busy = false;

  const perPage = () => (phoneMQ.matches ? 4 : 8);
  const matching = () => cards.filter((c) => filter.test(tours[+c.dataset.i]));

  function layout() {
    const m = matching();
    const per = perPage();
    const pages = Math.max(1, Math.ceil(m.length / per));
    page = Math.min(page, pages - 1);
    const shown = m.slice(page * per, page * per + per);
    cards.forEach((c) => (c.hidden = !shown.includes(c)));
    placeOnPages(shown);
    pager.hidden = pages < 2;
    pageN.textContent = L.page(page + 1, pages);
    prev.disabled = page === 0;
    next.disabled = page >= pages - 1;
    return shown;
  }

  // Old tickets peel off, new ones are taped in with a stagger.
  async function swap(mutate, dir = 1) {
    if (busy) return;
    busy = true;
    const old = cards.filter((c) => !c.hidden);
    if (!reduced) {
      list.style.setProperty('--dir', String(rtl ? -dir : dir));
      old.forEach((c) => c.classList.add('is-out'));
      await new Promise((r) => setTimeout(r, 280));
    }
    mutate();
    const shown = layout();
    old.forEach((c) => c.classList.remove('is-out'));
    if (!reduced) {
      shown.forEach((c) => c.classList.add('is-drop'));
      void list.offsetWidth;
      requestAnimationFrame(() => requestAnimationFrame(() => shown.forEach((c) => c.classList.remove('is-drop'))));
      setTimeout(() => shown.forEach((c) => c.classList.remove('is-drop')), 80);
    }
    busy = false;
  }

  root.querySelectorAll('.pr-f').forEach((b) =>
    b.addEventListener('click', () => {
      const f = filters.find((x) => x.key === b.dataset.f);
      if (f === filter) return;
      root.querySelectorAll('.pr-f').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      swap(() => {
        filter = f;
        page = 0;
      }).then(() => (live.textContent = L.showing(matching().length)));
    })
  );
  const go = (d) => {
    swap(() => (page += d), d);
    const top = root.getBoundingClientRect().top;
    if (top < 0) root.querySelector('.pr-cards').scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  phoneMQ.addEventListener('change', layout);

  layout();
  inview(root.querySelector('.pr__head'));
  inview(list, '0px 0px -10% 0px');
}

/* ------------------------------------------------------------ stays */

export function initStays(data) {
  const root = document.getElementById('stays');
  const S = data.sections.stays;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  const card = (s, i) => {
    const price = s.priceFrom != null ? `${t(S.from)} ${lang === 'ar' ? `${num(s.priceFrom)} ر.س` : `SAR ${num(s.priceFrom)}`} ${t(S.night)}` : '';
    const inner = `
      <span class="tape st__tape" aria-hidden="true"></span>
      <span class="st__photo"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="1000" height="750"></span>
      <span class="st__body">
        <span class="st__where">${esc(t(s.city))}<span aria-hidden="true"> · </span>${esc(t(regionBy[s.region]?.name))}</span>
        <h3 class="st__name">${esc(t(s.name))}</h3>
        <span class="st__tag">${esc(t(s.tagline))}</span>
        <span class="st__desc">${esc(t(s.desc))}</span>
        <span class="st__foot">
          <span class="st__price">${price ? esc(price) : '&nbsp;'}</span>
          ${
            s.href
              ? `<span class="tk__cta">${esc(t(data.sections.tours.cta))}${penArrow(120 + i)}</span>`
              : `<span class="st__soon">${clockDood(130 + i)}<span>${esc(t(S.soon))}</span></span>`
          }
        </span>
      </span>`;
    return `<li class="st" style="--i:${i};--rot:${[1.2, -1, 0.7, -1.5][i % 4]}deg">${
      s.href ? `<a class="st__in" href="${esc(s.href[lang] || s.href.en || s.href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="st__in">${inner}</div>`
    }</li>`;
  };

  root.innerHTML = `
    <div class="spread pr__spread">
      ${head('stays-title', t(S.title), t(S.sub), 52)}
      <ul class="pr-cards pr-cards--stays">${data.stays.map(card).join('')}</ul>
    </div>`;
  const items = [...root.querySelectorAll('.st')];
  placeOnPages(items);
  inview(root.querySelector('.pr__head'));
  inview(root.querySelector('.pr-cards'), '0px 0px -10% 0px');
}

function clockDood(seed) {
  const p = makePen(seed, 0.4);
  return renderPaths([p.circle(10, 10, 7.5), p.line([[10, 5.5], [10, 10], [13.5, 12]])], { viewBox: '0 0 20 20', cls: 'doodle pr-clock' });
}

/* ------------------------------------------------------------ tips */

export function initTips(data) {
  const root = document.getElementById('tips');
  const S = data.sections.tips;
  const tips = data.tips;
  root.innerHTML = `
    <div class="spread pr__spread">
      ${head('tips-title', t(S.title), L.tipNote, 63)}
      <ol class="pr-tips">${tips
        .map(
          (x, i) => `<li class="tip" style="--i:${i}">
            <span class="tip__ico">${tipIcon(x.icon, 200 + i)}</span>
            <div class="tip__txt">
              <p class="tip__n">${String(i + 1).padStart(2, '0')}</p>
              <h3 class="tip__title">${esc(t(x.title))}</h3>
              <p class="tip__text">${esc(t(x.text))}</p>
            </div>
          </li>`
        )
        .join('')}
        <li class="tip tip--sticker" aria-hidden="true"><img src="${asset(data.stickers.jubbah)}" alt="" loading="lazy"><span class="tip__note">${marginArrow(77)}<span>${esc(L.noted)}</span></span></li>
      </ol>
    </div>`;
  const items = [...root.querySelectorAll('.tip')];
  // tips 1-3 on the start page, 4-5 + the sticker on the end page
  items.forEach((el, i) => {
    const onEnd = i >= 3;
    el.style.setProperty('--c', onEnd ? '4' : '1');
    el.style.setProperty('--r', String(1 + (onEnd ? i - 3 : i)));
  });
  inview(root.querySelector('.pr__head'));
  items.forEach((el) => inview(el, '0px 0px -12% 0px'));
}

/* ------------------------------------------------------------ faq */

export function initFaq(data) {
  const root = document.getElementById('faq');
  const S = data.sections.faq;
  const plus = (i) => {
    const p = makePen(300 + i, 0.4);
    return renderPaths([p.line([[4, 12], [20, 12]]), p.line([[12, 4], [12, 20]])], { viewBox: '0 0 24 24', cls: 'faq__plus' });
  };
  root.innerHTML = `
    <div class="spread pr__spread pr__spread--faq">
      <div class="faq__start">
        ${head('faq-title', t(S.title), L.faqNote, 74)}
        <img class="faq__sticker" src="${asset(data.logo.stickerPng)}" alt="" loading="lazy">
      </div>
      <div class="faq__list">
        ${data.faq
          .map(
            (f, i) => `<div class="faq__item">
              <h3 class="faq__q">
                <button class="faq__btn" type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
                  <span class="faq__n">${String(i + 1).padStart(2, '0')}</span>
                  <span class="faq__qt">${esc(t(f.q))}${uline(400 + i).replace('uline pr-uline', 'faq__ul')}</span>
                  ${plus(i)}
                </button>
              </h3>
              <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
                <div class="faq__ai"><p>${esc(t(f.a))}</p></div>
              </div>
            </div>`
          )
          .join('')}
      </div>
    </div>`;
  const btns = [...root.querySelectorAll('.faq__btn')];
  const set = (open) =>
    btns.forEach((b) => {
      const on = b === open;
      b.setAttribute('aria-expanded', String(on));
      b.closest('.faq__item').classList.toggle('is-open', on);
      document.getElementById(b.getAttribute('aria-controls')).inert = !on;
    });
  btns.forEach((b) => b.addEventListener('click', () => set(b.getAttribute('aria-expanded') === 'true' ? null : b)));
  set(btns[0]);
  inview(root.querySelector('.pr__head'));
  inview(root.querySelector('.faq__list'));
}

export function initPractical(data) {
  initTours(data);
  initStays(data);
  initTips(data);
  initFaq(data);
  document.querySelectorAll('.pr .pr__spread').forEach((s) => s.insertAdjacentHTML('afterbegin', '<i class="pr__rule" aria-hidden="true"></i>'));
}
