// Practical sections for the trip builder: bookable tours and stays that can be
// added to a planned day, a pre-trip checklist, and FAQs. One init per section.
import { t, asset, pad2, tr, h, icons, lang, isReduced, phoneMQ, onReveal } from './util.js';
import { kindIcon } from './extras.js';

const P = {
  en: {
    toursEyebrow: 'Book along the way',
    staysEyebrow: 'Where to sleep',
    tipsEyebrow: 'Before you go',
    faqEyebrow: 'Good to know',
    all: 'All',
    onRoute: 'On my route',
    region: 'Region',
    stop: 'Stop',
    showAll: (n) => `Show all ${n}`,
    showFewer: 'Show fewer',
    results: (n) => `${n} ${n === 1 ? 'experience' : 'experiences'}`,
    from: (n) => `From SAR ${n}`,
    free: 'Free',
    newTab: 'opens in a new tab',
    ready: (a, b) => `${a} of ${b} ready`,
    tick: 'Tick off as you prepare',
    addFor: (n) => `Add ${n} to a day`,
    perNight: (n) => `SAR ${n}`,
  },
  ar: {
    toursEyebrow: 'احجز على الطريق',
    staysEyebrow: 'أين تبيت',
    tipsEyebrow: 'قبل أن تنطلق',
    faqEyebrow: 'معلومات مفيدة',
    all: 'الكل',
    onRoute: 'على مساري',
    region: 'المنطقة',
    stop: 'المحطة',
    showAll: (n) => `اعرض الكل (${n})`,
    showFewer: 'اعرض أقل',
    results: (n) => (n === 1 ? 'تجربة واحدة' : n === 2 ? 'تجربتان' : n <= 10 ? `${n} تجارب` : `${n} تجربة`),
    from: (n) => `تبدأ من ${n} ر.س`,
    free: 'مجانًا',
    newTab: 'يفتح في نافذة جديدة',
    ready: (a, b) => `${a} من ${b} جاهزة`,
    tick: 'علّم كل نصيحة عند تجهيزها',
    addFor: (n) => `أضف ${n} إلى يوم`,
    perNight: (n) => `${n} ر.س`,
  },
}[lang];

const num = (n) => Number(n).toLocaleString('en-US');
const priceLabel = (p) => (p == null ? '' : p === 0 ? P.free : P.from(num(p)));

const tipIcons = {
  plane: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 13.5 21 6l-4.5 13-4-5.5zM12.5 13.5 21 6M6.5 12l1.2 5.5 2.6-2.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  temperature: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14.5V4.5h4v10a4 4 0 1 1-4 0zM12 16.5V9M16.5 6h3M16.5 9.5h2.5M16.5 13h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20c0-5 4-4.5 7-7.5s1-6 6-8M17 4.5V2M17 2.5l4 1.5-4 1.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="5" cy="20" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  fuel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V4h10v17M2.5 21h13M6.5 7h5v4h-5zM14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V8l-3-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};

function head(id, eyebrow, title, sub) {
  return h(
    'div',
    { class: 'kx__head', 'data-reveal': '' },
    h('p', { class: 'nt-eyebrow kx__eyebrow', text: eyebrow }),
    h('h2', { class: 'nt-h2', id, text: title }),
    sub ? h('p', { class: 'kx__sub', text: sub }) : null
  );
}

// FLIP for list filtering: survivors glide, newcomers pop in.
function flipList(list, mutate) {
  const els = [...list.children];
  const first = new Map(els.filter((e) => !e.hidden).map((e) => [e, e.getBoundingClientRect()]));
  mutate();
  if (isReduced()) return;
  let k = 0;
  els.forEach((e) => {
    if (e.hidden) return;
    const a = first.get(e);
    const b = e.getBoundingClientRect();
    if (a) {
      const dx = a.left - b.left;
      const dy = a.top - b.top;
      if (Math.abs(dx) + Math.abs(dy) > 1) e.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
    } else {
      e.animate([{ opacity: 0, transform: 'translateY(12px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 40 * k++, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' });
    }
  });
}

function addButton(kind, id, name, extras) {
  const label = h('span', { class: 'kx-add__l', text: tr.addTo });
  const b = h('button', { class: 'kx-add', type: 'button', 'aria-haspopup': 'menu', 'aria-expanded': 'false', 'aria-label': P.addFor(name) }, h('span', { class: 'kx-add__ic', html: icons.plus }), label);
  b.addEventListener('click', () => extras.openMenu(kind, id, b));
  const sync = () => {
    const d = extras.dayOf(kind, id);
    const card = b.closest('[data-kx]');
    card?.classList.toggle('is-planned', d >= 0);
    card?.style.setProperty('--dc', d >= 0 ? extras.dayColors[d] : '');
    label.textContent = d >= 0 ? tr.inDay(d + 1) : tr.addTo;
    b.querySelector('.kx-add__ic').innerHTML = d >= 0 ? icons.check : icons.plus;
  };
  extras.onChange(sync);
  queueMicrotask(sync);
  return b;
}

/* ------------------------------------------------------------ tours */

export function initTours(root, data, planner, extras) {
  const S = data.sections.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const tours = data.tours;
  const filters = [{ key: 'all', label: P.all, test: () => true }];
  filters.push({ key: 'route', label: P.onRoute, dynamic: true, test: (x) => planner.getPlan().plan.flat().includes(stopBy[x.stop]?.n) });
  data.regions.forEach((r) => {
    const n = tours.filter((x) => x.region === r.key).length;
    if (n) filters.push({ key: `r:${r.key}`, label: t(r.name), n, test: (x) => x.region === r.key });
  });
  data.stops.forEach((s) => {
    const n = tours.filter((x) => x.stop === s.key).length;
    if (n) filters.push({ key: `s:${s.key}`, label: `${pad2(s.n)} ${t(s.name)}`, n, test: (x) => x.stop === s.key });
  });

  const fbar = h('div', { class: 'kx-filters', role: 'group', 'aria-label': `${P.region} / ${P.stop}` });
  const btns = filters.map((f) => {
    const cnt = h('span', { class: 'kx-f__n', text: f.n != null ? String(f.n) : '' });
    const b = h('button', { class: 'kx-f' + (f.dynamic ? ' kx-f--route' : ''), type: 'button', 'data-f': f.key, 'aria-pressed': String(f.key === 'all') }, f.dynamic ? h('span', { class: 'kx-f__ic', html: icons.car }) : null, h('span', { text: f.label }), cnt);
    b._cnt = cnt;
    fbar.append(b);
    return b;
  });

  const list = h('ul', { class: 'kx-tours' });
  const cards = tours.map((x, i) => {
    const stop = stopBy[x.stop];
    const name = t(x.title);
    const price = priceLabel(x.price);
    const li = h(
      'li',
      { class: 'kx-tour', 'data-kx': '', 'data-i': i },
      h('span', { class: 'kx-tour__thumb' + (x.photoIsStop ? ' kx-tour__thumb--alt' : ''), style: x.photoIsStop ? `--ox:${[20, 80, 50, 15, 85, 35, 65][i % 7]}%;--oy:${[30, 60, 80, 45, 25, 70, 50][i % 7]}%` : null }, h('img', { src: asset(x.photo), alt: '', loading: 'lazy', decoding: 'async' }), stop ? h('span', { class: 'kx-tour__n', text: pad2(stop.n) }) : null),
      h(
        'div',
        { class: 'kx-tour__txt' },
        h('p', { class: 'kx-tour__meta' }, h('span', { class: 'kx-tour__type', text: t(x.type) }), h('span', { class: 'kx-dot', 'aria-hidden': 'true', text: '·' }), h('span', { text: stop ? t(stop.name) : '' })),
        h('h3', { class: 'kx-tour__title', title: name, text: name }),
        h('p', { class: 'kx-tour__until', text: t(x.until) }),
        h('p', { class: 'kx-tour__price', text: price || ' ' })
      ),
      h(
        'div',
        { class: 'kx-tour__acts' },
        h('a', { class: 'kx-book', href: x.href[lang] || x.href.en, target: '_blank', rel: 'noopener' }, h('span', { text: t(S.cta) }), h('span', { class: 'k-sr', text: `: ${name}, ${P.newTab}` }), h('span', { class: 'kx-book__ic', html: icons.arrow })),
        addButton('tour', x.slug, name, extras)
      )
    );
    list.append(li);
    return li;
  });

  const more = h('button', { class: 'nt-btn k-tool--line kx-more', type: 'button' });
  const live = h('p', { class: 'k-sr', 'aria-live': 'polite' });
  root.append(h('div', { class: 'nt-wrap kx__wrap' }, h('div', { class: 'kx__top' }, head('tours-title', P.toursEyebrow, t(S.title), t(S.sub))), fbar, list, h('div', { class: 'kx-morebar' }, more), live));

  let filter = filters[0];
  let open = false;
  const limit = () => (phoneMQ.matches ? 6 : 8);

  function apply() {
    const m = cards.filter((c) => filter.test(tours[+c.dataset.i]));
    const cap = open ? m.length : limit();
    cards.forEach((c) => (c.hidden = true));
    m.forEach((c, k) => (c.hidden = k >= cap));
    more.hidden = m.length <= limit();
    more.innerHTML = '';
    more.append(h('span', { text: open ? P.showFewer : P.showAll(m.length) }), h('span', { class: 'kx-more__ic' + (open ? ' is-up' : ''), html: icons.down }));
    // the dynamic "on my route" count
    const r = btns[1];
    const rn = tours.filter(filters[1].test).length;
    r._cnt.textContent = String(rn);
    r.hidden = rn === 0;
    if (filter.key === 'route' && rn === 0) {
      filter = filters[0];
      btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === 'all')));
      return apply();
    }
    return m.length;
  }

  btns.forEach((b, i) =>
    b.addEventListener('click', () => {
      if (filters[i] === filter) return;
      filter = filters[i];
      open = false;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      let n = 0;
      flipList(list, () => (n = apply()));
      live.textContent = P.results(n);
    })
  );
  more.addEventListener('click', () => {
    const wasOpen = open;
    open = !open;
    flipList(list, apply);
    if (wasOpen) list.scrollIntoView({ block: 'start', behavior: isReduced() ? 'auto' : 'smooth' });
  });
  extras.onChange(() => apply());
  phoneMQ.addEventListener('change', apply);
  apply();
  revealList(root, list);
}

function revealList(root, list) {
  root.querySelectorAll('[data-reveal]').forEach((el) => onReveal(el, () => el.classList.add('is-revealed')));
  onReveal(list, () => {
    list.classList.add('is-in');
    if (isReduced()) return;
    [...list.children].filter((c) => !c.hidden).forEach((c, k) =>
      c.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 50 * k, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' })
    );
  });
}

/* ------------------------------------------------------------ stays */

export function initStays(root, data, extras) {
  const S = data.sections.stays;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));
  const list = h('ul', { class: 'kx-stays' });
  data.stays.forEach((s) => {
    const name = t(s.name);
    const price = s.priceFrom != null ? h('p', { class: 'kx-stay__price' }, h('span', { class: 'kx-stay__from', text: t(S.from) }), h('b', { text: P.perNight(num(s.priceFrom)) }), h('span', { class: 'kx-stay__from', text: t(S.night) })) : h('p', { class: 'kx-stay__price kx-stay__price--none', text: ' ' });
    const status = s.href
      ? h('a', { class: 'kx-book', href: s.href[lang] || s.href.en || s.href, target: '_blank', rel: 'noopener' }, h('span', { text: t(data.sections.tours.cta) }), h('span', { class: 'kx-book__ic', html: icons.arrow }))
      : h('p', { class: 'kx-soon' }, h('span', { class: 'kx-soon__dot', 'aria-hidden': 'true' }), h('span', { text: t(S.soon) }));
    list.append(
      h(
        'li',
        { class: 'kx-stay', 'data-kx': '' },
        h('span', { class: 'kx-stay__photo' }, h('img', { src: asset(s.photo), alt: '', loading: 'lazy', decoding: 'async', width: 1000, height: 750 }), h('span', { class: 'kx-stay__badge', html: kindIcon.stay })),
        h(
          'div',
          { class: 'kx-stay__txt' },
          h('p', { class: 'kx-stay__where', text: `${t(s.city)} · ${t(regionBy[s.region]?.name)}` }),
          h('h3', { class: 'kx-stay__name', text: name }),
          h('p', { class: 'kx-stay__tag', text: t(s.tagline) }),
          h('p', { class: 'kx-stay__desc', text: t(s.desc) }),
          price,
          status
        ),
        addButton('stay', s.key, name, extras)
      )
    );
  });
  root.append(h('div', { class: 'nt-wrap kx__wrap' }, h('div', { class: 'kx__top' }, head('stays-title', P.staysEyebrow, t(S.title), t(S.sub))), h('div', { class: 'kx-rail' }, list)));
  revealList(root, list);
}

/* ------------------------------------------------------------ tips */

export function initTips(root, data) {
  const S = data.sections.tips;
  const KEY = 'nt-k-tips';
  let done = [];
  try { done = new URLSearchParams(location.search).has('fresh') ? [] : JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { done = []; }
  const n = data.tips.length;
  const bar = h('span', { class: 'kx-prog__fill' });
  const count = h('span', { class: 'kx-prog__t' });
  const prog = h('div', { class: 'kx-prog', 'aria-live': 'polite' }, count, h('span', { class: 'kx-prog__bar', 'aria-hidden': 'true' }, bar));
  const list = h('ol', { class: 'kx-tips' });
  const sync = () => {
    const k = list.querySelectorAll('[aria-pressed="true"]').length;
    count.textContent = P.ready(k, n);
    bar.style.transform = `scaleX(${k / n})`;
    try { localStorage.setItem(KEY, JSON.stringify([...list.querySelectorAll('.kx-tip')].map((li, i) => (li.classList.contains('is-done') ? i : -1)).filter((i) => i >= 0))); } catch (e) { /* storage blocked */ }
  };
  data.tips.forEach((tip, i) => {
    const on = done.includes(i);
    const check = h('button', { class: 'kx-check', type: 'button', 'aria-pressed': String(on), 'aria-label': t(tip.title), html: icons.check });
    const li = h(
      'li',
      { class: 'kx-tip' + (on ? ' is-done' : '') },
      h('span', { class: 'kx-tip__ic', html: tipIcons[tip.icon] || icons.info }),
      h('div', { class: 'kx-tip__txt' }, h('h3', { class: 'kx-tip__title', text: t(tip.title) }), h('p', { class: 'kx-tip__text', text: t(tip.text) })),
      check
    );
    check.addEventListener('click', () => {
      const v = check.getAttribute('aria-pressed') !== 'true';
      check.setAttribute('aria-pressed', String(v));
      li.classList.toggle('is-done', v);
      if (v && !isReduced()) check.animate([{ transform: 'scale(1)' }, { transform: 'scale(.86)', offset: 0.35 }, { transform: 'scale(1.08)', offset: 0.7 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
      sync();
    });
    list.append(li);
  });
  root.append(
    h(
      'div',
      { class: 'nt-wrap kx__wrap kx__split' },
      h('div', { class: 'kx__side' }, head('tips-title', P.tipsEyebrow, t(S.title), P.tick), prog),
      list
    )
  );
  sync();
  revealList(root, list);
}

/* ------------------------------------------------------------ faq */

export function initFaq(root, data) {
  const S = data.sections.faq;
  const list = h('div', { class: 'kx-faq' });
  const btns = data.faq.map((f, i) => {
    const b = h(
      'button',
      { class: 'kx-faq__btn', type: 'button', id: `kx-q-${i}`, 'aria-expanded': 'false', 'aria-controls': `kx-a-${i}` },
      h('span', { class: 'kx-faq__n', text: pad2(i + 1) }),
      h('span', { class: 'kx-faq__q', text: t(f.q) }),
      h('span', { class: 'kx-faq__ic', html: icons.plus })
    );
    const panel = h('div', { class: 'kx-faq__a', id: `kx-a-${i}`, role: 'region', 'aria-labelledby': `kx-q-${i}` }, h('div', { class: 'kx-faq__ai' }, h('p', { text: t(f.a) })));
    b._panel = panel;
    list.append(h('div', { class: 'kx-faq__item' }, h('h3', { class: 'kx-faq__h' }, b), panel));
    return b;
  });
  const set = (open) =>
    btns.forEach((b) => {
      const on = b === open;
      b.setAttribute('aria-expanded', String(on));
      b.parentElement.parentElement.classList.toggle('is-open', on);
      b._panel.inert = !on;
    });
  btns.forEach((b) => b.addEventListener('click', () => set(b.getAttribute('aria-expanded') === 'true' ? null : b)));
  set(btns[0]);
  root.append(h('div', { class: 'nt-wrap kx__wrap kx__split' }, h('div', { class: 'kx__side' }, head('faq-title', P.faqEyebrow, t(S.title))), list));
  revealList(root, list);
}

export function initPractical(data, planner, extras) {
  initTours(document.getElementById('tours'), data, planner, extras);
  initStays(document.getElementById('stays'), data, extras);
  initTips(document.getElementById('tips'), data);
  initFaq(document.getElementById('faq'), data);
}

