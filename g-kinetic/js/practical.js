// PRACTICAL: tours, stays, tips, FAQ. Kinetic headers (words slide in, velocity skew),
// a type-driven stop filter (outlined words fill when chosen) with a rolling result count,
// identical cards in one grid with a FLIP reflow. One function per section (portable).
import { h, L, lang, asset, pad2, makeRoller, kinetic, reduced, isPhone } from './lib.js';

const S = {
  en: {
    all: 'All', filter: 'Filter tours by stop', more: 'Show all', less: 'Show fewer', free: 'Free',
    from: (n) => `From SAR ${n}`, by: 'By', tours: 'tours and experiences', stays: 'places to stay',
    tipsK: 'Before you go', faqK: 'Questions', newTab: 'opens webook in a new tab',
  },
  ar: {
    all: 'الكل', filter: 'تصفية الجولات حسب المحطة', more: 'عرض الكل', less: 'عرض أقل', free: 'مجانًا',
    from: (n) => `تبدأ من ${n} ر.س`, by: 'تنظيم', tours: 'جولات وتجارب', stays: 'أماكن إقامة',
    tipsK: 'قبل أن تنطلق', faqK: 'أسئلة', newTab: 'يفتح webook في نافذة جديدة',
  },
}[lang];

const num = (n) => Number(n).toLocaleString('en-US');
export const priceLabel = (p) => (p == null ? '' : p === 0 ? S.free : S.from(num(p)));

const ARROW = '<svg class="flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4.5l5.5 5.5-5.5 5.5"/></svg>';
const PLUS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path class="px-v" d="M10 3v14"/><path d="M3 10h14"/></svg>';
export const ICONS = {
  plane: '<path d="M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z"/>',
  temperature: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><path d="M11.5 10v7"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19h8a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 3.5"/>',
  fuel: '<path d="M3 22h12M4 9h10M14 22V3H4v19M14 13h3v4.5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.route}</svg>`;

// ---------- kinetic section header ----------
function header(idx, eyebrow, title, sub) {
  const words = title.split(' ');
  const t = h('h2', { class: 'px-title', id: `px-title-${idx}` }, words.map((w, j) => [h('span', { class: 'px-w' }, h('span', { class: 'px-wi' }, w)), j < words.length - 1 ? ' ' : null]));
  const head = h('header', { class: 'px-head' },
    h('p', { class: 'px-eyebrow' }, h('span', { class: 'px-idx' }, `${pad2(idx)} / 04`), h('span', {}, eyebrow)),
    t,
    sub ? h('p', { class: 'px-sub' }, sub) : null);
  return { head, title: t };
}
function animateHeader(hd) {
  hd.head.closest('section')?.setAttribute('aria-labelledby', hd.title.id);
  kinetic([hd.title], { skew: 5, stretch: 0.04 });
  if (reduced) return;
  const dir = lang === 'ar' ? 1 : -1;
  gsap.fromTo(hd.title.querySelectorAll('.px-wi'), { xPercent: 70 * dir, opacity: 0 }, {
    xPercent: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08,
    scrollTrigger: { trigger: hd.head, start: 'top 85%', once: true },
  });
  gsap.from(hd.head.querySelectorAll('.px-eyebrow, .px-sub'), {
    y: 20, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.1, delay: 0.15,
    scrollTrigger: { trigger: hd.head, start: 'top 85%', once: true },
  });
}
function revealBatch(els) {
  if (reduced) return;
  gsap.set(els, { opacity: 0, y: 48 });
  ScrollTrigger.batch(els, {
    start: 'top 92%', once: true,
    onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity' }),
  });
}

// ---------- cards ----------
function tourCard(t, stopName, i) {
  const href = t.href ? L(t.href) : null;
  const price = priceLabel(t.price);
  const el = h(href ? 'a' : 'article', {
    class: `pc pc--tour${t.photoIsStop ? ' pc--tint' : ''}`, href, target: href ? '_blank' : null, rel: href ? 'noopener' : null,
    'data-stop': t.stop, style: `--tint:${TINTS[i % TINTS.length]}`,
  },
    h('span', { class: 'pc__media' },
      h('img', { class: 'pc__img', src: asset(t.photo), alt: '', loading: 'lazy', decoding: 'async' }),
      h('span', { class: 'pc__type' }, L(t.type))),
    h('span', { class: 'pc__body' },
      h('span', { class: 'pc__meta' }, stopName),
      h('span', { class: 'pc__title', title: L(t.title) }, L(t.title)),
      h('span', { class: 'pc__org' }, t.organizer ? `${S.by} ${t.organizer}` : ' '),
      h('span', { class: 'pc__until' }, L(t.until)),
      h('span', { class: 'pc__price' }, price || ' ')),
    h('span', { class: 'pc__foot' },
      href ? h('span', { class: 'pc__cta' }, h('span', {}, L(t.ctaLabel)), h('span', { class: 'sr-only' }, `(${S.newTab})`)) : null,
      href ? h('span', { class: 'pc__arrow', html: ARROW }) : null),
  );
  return el;
}

const TINTS = ['#824628', '#5a6432', '#7a4f8a'];

function stayCard(s, sec, regionName) {
  const href = s.href ? (typeof s.href === 'string' ? s.href : L(s.href)) : null;
  const price = s.priceFrom != null ? `${L(sec.from)} ${lang === 'ar' ? `${num(s.priceFrom)} ر.س` : `SAR ${num(s.priceFrom)}`} ${L(sec.night)}` : ' ';
  return h(href ? 'a' : 'article', { class: `pc pc--stay${href ? '' : ' is-soon'}`, href, target: href ? '_blank' : null, rel: href ? 'noopener' : null },
    h('span', { class: 'pc__media' }, h('img', { class: 'pc__img', src: asset(s.photo), alt: '', loading: 'lazy', decoding: 'async' })),
    h('span', { class: 'pc__body' },
      h('span', { class: 'pc__meta' }, `${L(s.city)} · ${regionName}`),
      h('span', { class: 'pc__title pc__title--stay' }, L(s.name)),
      h('span', { class: 'pc__tag' }, L(s.tagline)),
      h('span', { class: 'pc__desc' }, L(s.desc)),
      h('span', { class: 'pc__price' }, price)),
    h('span', { class: 'pc__foot' },
      href
        ? [h('span', { class: 'pc__cta' }, L(sec.cta)), h('span', { class: 'pc__arrow', html: ARROW })]
        : h('span', { class: 'pc__soon' }, h('span', { class: 'pc__soon-dot', 'aria-hidden': 'true' }), L(sec.soon))),
  );
}

// ---------- 1. Tours ----------
function initTours(data, root) {
  const sec = data.sections.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const tours = data.tours.map((t) => ({ ...t, ctaLabel: sec.cta }));
  const hd = header(1, L(sec.sub), L(sec.title));
  const keys = data.stops.map((s) => s.key).filter((k) => tours.some((t) => t.stop === k));
  const opts = [['all', S.all, tours.length, null], ...keys.map((k) => [k, L(stopBy[k].name), tours.filter((t) => t.stop === k).length, stopBy[k].region])];

  const filt = h('div', { class: 'kf', role: 'group', 'aria-label': S.filter });
  const bar = h('span', { class: 'kf__bar', 'aria-hidden': 'true' });
  const btns = opts.map(([k, label, n, region]) => {
    const b = h('button', { class: 'kf__btn', type: 'button', 'aria-pressed': String(k === 'all'), 'data-k': k },
      h('span', { class: 'kf__word' }, label), h('sup', { class: 'kf__n' }, String(n)));
    if (region) b.dataset.region = region;
    filt.append(b);
    return b;
  });
  filt.append(bar);
  const countNum = h('span', { class: 'kc__num' });
  const count = h('p', { class: 'kc', 'aria-live': 'polite' }, countNum, h('span', { class: 'kc__label' }, S.tours));
  const grid = h('div', { class: 'pgrid' });
  const cards = tours.map((t, i) => ({ t, el: tourCard(t, `${pad2(stopBy[t.stop].n)} · ${L(stopBy[t.stop].name)}`, i) }));
  cards.forEach((c) => grid.append(c.el));
  const more = h('button', { class: 'px-more', type: 'button' });
  root.append(h('div', { class: 'nt-wrap' }, hd.head, h('div', { class: 'px-bar' }, h('div', { class: 'kf__scroll' }, filt), count), grid, h('div', { class: 'px-more-row' }, more)));
  animateHeader(hd);

  let key = 'all';
  let open = false;
  let roller = null;
  const limit = () => (isPhone() ? 4 : 8);
  const matches = () => cards.filter((c) => key === 'all' || c.t.stop === key);
  const setCount = (n, play) => {
    roller = makeRoller(countNum, String(n));
    countNum.setAttribute('aria-label', `${n} ${S.tours}`);
    if (play) roller.play(0.9);
  };
  const apply = () => {
    const m = matches();
    const lim = open ? Infinity : limit();
    cards.forEach((c) => (c.el.hidden = true));
    m.forEach((c, i) => (c.el.hidden = i >= lim));
    more.hidden = m.length <= limit();
    more.textContent = open ? S.less : `${S.more} (${m.length})`;
    more.setAttribute('aria-expanded', String(open));
  };
  const moveBar = (instant) => {
    const b = btns.find((x) => x.dataset.k === key);
    const w = b.querySelector('.kf__word');
    const tr = { x: w.offsetLeft + b.offsetLeft, width: w.offsetWidth };
    if (reduced || instant || !window.gsap) { bar.style.transform = `translateX(${tr.x}px)`; bar.style.width = tr.width + 'px'; return; }
    gsap.to(bar, { ...tr, duration: 0.6, ease: 'expo.out' });
  };
  const flip = (mutate) => {
    if (reduced || !window.gsap) { mutate(); window.ScrollTrigger?.refresh(); return; }
    const before = new Map(cards.filter((c) => !c.el.hidden).map((c) => [c, c.el.getBoundingClientRect()]));
    mutate();
    const shown = cards.filter((c) => !c.el.hidden);
    shown.forEach((c, i) => {
      const a = before.get(c);
      gsap.killTweensOf(c.el);
      if (!a) {
        gsap.fromTo(c.el, { opacity: 0, y: 40, skewY: lang === 'ar' ? -3 : 3 }, { opacity: 1, y: 0, skewY: 0, duration: 0.7, delay: 0.05 + Math.min(i, 8) * 0.04, ease: 'expo.out', clearProps: 'transform,opacity' });
        return;
      }
      const b = c.el.getBoundingClientRect();
      gsap.fromTo(c.el, { x: a.left - b.left, y: a.top - b.top }, { x: 0, y: 0, duration: 0.7, ease: 'expo.inOut', clearProps: 'transform' });
    });
    gsap.delayedCall(0.75, () => ScrollTrigger.refresh());
  };
  btns.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.k === key) return;
    key = b.dataset.k;
    open = false;
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    moveBar();
    setCount(matches().length, true);
    flip(apply);
    b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }));
  more.addEventListener('click', () => {
    const wasOpen = open;
    flip(() => { open = !open; apply(); });
    if (wasOpen) grid.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  });
  apply();
  setCount(tours.length, false);
  if (!reduced) ScrollTrigger.create({ trigger: count, start: 'top 90%', once: true, onEnter: () => roller.play(1.3) });
  revealBatch(cards.filter((c) => !c.el.hidden).map((c) => c.el));
  return { refresh: () => { apply(); moveBar(true); } };
}

// ---------- 2. Stays ----------
function initStays(data, root) {
  const sec = data.sections.stays;
  const reg = Object.fromEntries(data.regions.map((r) => [r.key, L(r.name)]));
  const hd = header(2, L(sec.sub), L(sec.title));
  const grid = h('div', { class: 'pgrid pgrid--stays' }, data.stays.map((s) => stayCard(s, { ...sec, cta: data.sections.tours.cta }, reg[s.region])));
  root.append(h('div', { class: 'nt-wrap' }, hd.head, grid));
  animateHeader(hd);
  revealBatch([...grid.children]);
}

// ---------- 3. Tips ----------
function initTips(data, root) {
  const hd = header(3, S.tipsK, L(data.sections.tips.title));
  const list = h('ol', { class: 'tips' }, data.tips.map((t, i) => h('li', { class: `tip tip--${i % 5}` },
    h('span', { class: 'tip__top' }, h('span', { class: 'tip__n', 'data-n': pad2(i + 1) }), h('span', { class: 'tip__ic', html: icon(t.icon) })),
    h('h3', { class: 'tip__title' }, L(t.title)),
    h('p', { class: 'tip__text' }, L(t.text)))));
  root.append(h('div', { class: 'nt-wrap' }, hd.head, list));
  animateHeader(hd);
  const rolls = [...list.querySelectorAll('.tip__n')].map((n) => makeRoller(n, n.dataset.n));
  revealBatch([...list.children]);
  if (!reduced) ScrollTrigger.create({ trigger: list, start: 'top 85%', once: true, onEnter: () => rolls.forEach((r, i) => r.play(1.2, 0.15 + i * 0.08)) });
}

// ---------- 4. FAQ ----------
function initFaq(data, root) {
  const hd = header(4, S.faqK, L(data.sections.faq.title));
  const items = data.faq.map((f, i) => {
    const id = `faq-g-${i}`;
    const btn = h('button', { class: 'qa__btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': id, id: id + '-b' },
      h('span', { class: 'qa__n' }, pad2(i + 1)),
      h('span', { class: 'qa__q' }, L(f.q)),
      h('span', { class: 'qa__ic', html: PLUS }));
    const panel = h('div', { class: 'qa__panel', id, role: 'region', 'aria-labelledby': id + '-b' }, h('div', { class: 'qa__inner' }, h('p', { class: 'qa__a' }, L(f.a))));
    const li = h('li', { class: 'qa' }, h('h3', { class: 'qa__h' }, btn), panel);
    return { li, btn, panel };
  });
  const set = (k) => items.forEach((it, i) => {
    const on = i === k;
    it.btn.setAttribute('aria-expanded', String(on));
    it.li.classList.toggle('is-open', on);
  });
  items.forEach((it, i) => it.btn.addEventListener('click', () => {
    const on = it.btn.getAttribute('aria-expanded') === 'true';
    set(on ? -1 : i);
    if (!on && !reduced) gsap.fromTo(it.li.querySelector('.qa__a'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.1 });
    setTimeout(() => window.ScrollTrigger?.refresh(), 520);
  }));
  const list = h('ol', { class: 'qas' }, items.map((x) => x.li));
  root.append(h('div', { class: 'nt-wrap' }, hd.head, list));
  animateHeader(hd);
  if (!reduced) {
    items.forEach((it) => ScrollTrigger.create({ trigger: it.li, start: 'top 92%', once: true, onEnter: () => {
      gsap.fromTo(it.li, { '--rule': 0 }, { '--rule': 1, duration: 1.1, ease: 'expo.out' });
      gsap.from(it.btn, { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform,opacity' });
    } }));
  }
}

export function initPractical(data) {
  const tours = initTours(data, document.getElementById('tours'));
  initStays(data, document.getElementById('stays'));
  initTips(data, document.getElementById('tips'));
  initFaq(data, document.getElementById('faq'));
  return { refresh: tours.refresh };
}
