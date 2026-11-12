// Practical sections as paper craft: a card folder with index tabs (tour filter), cut-paper
// cards that pop up from flat and tilt under the pointer, a folded leaflet of tips and FAQ
// strips that unfold. Each section is built by its own function (one section = one file later).
import { h, tr, asset, RM, RTL, FINE, PHONE, pad2, splitWords, LANG } from './core.js';

const S = {
  en: {
    all: 'All stops', filter: 'Filter tours by stop', more: 'Show all', less: 'Show fewer', free: 'Free',
    from: (n) => `From SAR ${n}`, by: 'By', count: (n) => `${n} ${n === 1 ? 'experience' : 'experiences'}`,
    tipsK: 'Before you go', faqK: 'Good to know', newTab: 'opens webook in a new tab', stayK: 'Where to stay',
  },
  ar: {
    all: 'كل المحطات', filter: 'تصفية الجولات حسب المحطة', more: 'عرض الكل', less: 'عرض أقل', free: 'مجانًا',
    from: (n) => `تبدأ من ${n} ر.س`, by: 'تنظيم', count: (n) => `التجارب المعروضة: ${n}`,
    tipsK: 'قبل أن تنطلق', faqK: 'معلومات تهمك', newTab: 'يفتح webook في نافذة جديدة', stayK: 'أين تقيم',
  },
}[LANG];

const REGION_C = { riyadh: '#c88c3c', qassim: '#5a6432', hail: '#a06eb4' };
const num = (n) => Number(n).toLocaleString('en-US');
const price = (p) => (p == null ? '' : p === 0 ? S.free : S.from(num(p)));
const ARROW = '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-flip"><path d="M4 10h11M10.5 5.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
const ICONS = {
  plane: '<path d="M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z"/>',
  temperature: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><path d="M11.5 10v7"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19h8a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 3.5"/>',
  fuel: '<path d="M3 22h12M4 9h10M14 22V3H4v19M14 13h3v4.5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.route}</svg>`;

// ---------- shared bits ----------
function head(idx, eyebrow, title, sub, art) {
  const t = h('h2', { class: 'pr-title', id: `pr-title-${idx}` });
  const words = splitWords(t, title);
  const artEl = art ? h('div', { class: 'pr-art', 'aria-hidden': 'true' }, h('img', { src: asset(art), alt: '', loading: 'lazy', decoding: 'async' }), h('span', { class: 'pr-art__stand' })) : null;
  const el = h('header', { class: 'pr-head' },
    h('div', { class: 'pr-head__txt' }, h('p', { class: 'nt-eyebrow pr-eyebrow' }, h('span', { class: 'pr-idx' }, `${pad2(idx)} / 04`), h('span', {}, eyebrow)), t, sub ? h('p', { class: 'pr-sub' }, sub) : null),
    artEl);
  return { el, title: t, words, art: artEl };
}
function headScroll(gsap, hd) {
  if (RM) return;
  gsap.set(hd.words, { yPercent: 110 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: hd.el, start: 'top 82%', once: true } });
  tl.to(hd.words, { yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06 }, 0)
    .from(hd.el.querySelectorAll('.pr-eyebrow, .pr-sub'), { autoAlpha: 0, y: 16, duration: 0.7, ease: 'power2.out', stagger: 0.1 }, 0.1);
  if (hd.art) tl.fromTo(hd.art, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' }, { rotationX: 0, autoAlpha: 1, duration: 0.9, ease: 'back.out(2.2)' }, 0.25);
}
function section(cls, hd, ...kids) {
  return h('section', { class: `pr ${cls}`, 'aria-labelledby': hd.title.id }, h('div', { class: 'nt-wrap pr-wrap' }, hd.el, ...kids));
}

// cut-paper card: <li perspective> <a|article pop target> <paper tilt target>
function card({ href, cls, photo, tint, badge, meta, title, lines, foot }) {
  const paper = h('span', { class: 'cp__paper' },
    h('span', { class: 'cp__photo' }, h('img', { src: asset(photo), alt: '', loading: 'lazy', decoding: 'async' }), badge ? h('span', { class: 'cp__badge' }, badge) : null, h('span', { class: 'cp__mount cp__mount--a' }), h('span', { class: 'cp__mount cp__mount--b' })),
    h('span', { class: 'cp__body' }, h('span', { class: 'cp__meta' }, meta), title, ...lines),
    foot,
    h('span', { class: 'cp__sheen', 'aria-hidden': 'true' }));
  const a = h(href ? 'a' : 'article', { class: `cp ${cls}`, href, target: href ? '_blank' : null, rel: href ? 'noopener' : null }, paper);
  const li = h('li', { class: 'cp-li', style: tint ? `--tint:${tint}` : null }, a);
  return { li, a, paper };
}
function tilt(gsap, cards) {
  if (RM) return;
  cards.forEach((c) => {
    const rx = gsap.quickTo(c.paper, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(c.paper, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    c.a.addEventListener('pointermove', (e) => {
      if (!FINE.matches || PHONE.matches) return;
      const r = c.a.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width;
      const ny = (e.clientY - r.top) / r.height;
      rx((0.5 - ny) * 10);
      ry((nx - 0.5) * 12);
      c.paper.style.setProperty('--mx', `${(nx * 100).toFixed(1)}%`);
      c.paper.style.setProperty('--my', `${(ny * 100).toFixed(1)}%`);
    });
    c.a.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}
const pop = (gsap, els, delay = 0) => gsap.fromTo(els, { rotationX: 90, autoAlpha: 0 }, { rotationX: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.07, delay, transformOrigin: '50% 100%', overwrite: true });
function popOnScroll(gsap, ScrollTrigger, els) {
  if (RM) return;
  gsap.set(els, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
  ScrollTrigger.batch(els, { start: 'top 90%', once: true, onEnter: (b) => pop(gsap, b) });
}

// ---------- 1. Tours: card folder with index tabs ----------
function tours(data) {
  const sec = data.sections.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const regionName = (k) => tr(data.regions.find((r) => r.key === k).name);
  const hd = head(1, tr(sec.sub), tr(sec.title), null, 'assets/img/icon-1.png');
  const keys = data.stops.map((s) => s.key).filter((k) => data.tours.some((t) => t.stop === k));

  const tabs = h('div', { class: 'tabs', role: 'group', 'aria-label': S.filter });
  const tabBtns = [['all', S.all, null], ...keys.map((k) => [k, tr(stopBy[k].name), stopBy[k].region])].map(([k, label, region]) => {
    const n = k === 'all' ? data.tours.length : data.tours.filter((t) => t.stop === k).length;
    const b = h('button', { class: 'tab', type: 'button', 'aria-pressed': String(k === 'all'), 'data-k': k, style: `--rc:${region ? REGION_C[region] : '#824628'}` },
      h('span', { class: 'tab__name' }, label),
      h('span', { class: 'tab__sub' }, region ? `${regionName(region)} · ${n}` : `${data.regions.length} ${LANG === 'ar' ? 'مناطق' : 'regions'} · ${n}`));
    tabs.append(b);
    return b;
  });
  const count = h('p', { class: 'folder__count', 'aria-live': 'polite' });
  const list = h('ul', { class: 'cgrid' });
  const cards = data.tours.map((t, i) => {
    const s = stopBy[t.stop];
    const href = t.href ? tr(t.href) : null;
    const c = card({
      href, cls: 'cp--tour', photo: t.photo, tint: t.photoIsStop ? ['#c88c3c', '#5a6432', '#a06eb4'][i % 3] : null,
      badge: tr(t.type), meta: `${pad2(s.n)} · ${tr(s.name)}`,
      title: h('span', { class: 'cp__title', title: tr(t.title) }, tr(t.title)),
      lines: [h('span', { class: 'cp__line' }, t.organizer ? `${S.by} ${t.organizer}` : ' '), h('span', { class: 'cp__line' }, tr(t.until)), h('span', { class: 'cp__price' }, price(t.price) || ' ')],
      foot: h('span', { class: 'cp__foot' }, h('span', {}, tr(sec.cta)), h('span', { class: 'sr-only' }, `(${S.newTab})`), h('span', { class: 'cp__arrow', html: ARROW })),
    });
    if (t.photoIsStop) c.li.classList.add('cp-li--tint');
    c.stop = t.stop;
    list.append(c.li);
    return c;
  });
  const more = h('button', { class: 'pr-more', type: 'button' });
  const panel = h('div', { class: 'folder__panel' }, count, list, h('div', { class: 'pr-more-row' }, more));
  const el = section('pr--tours', hd, h('div', { class: 'folder' }, h('div', { class: 'tabs-scroll' }, tabs), panel));

  let key = 'all';
  let open = false;
  let busy = false;
  const limit = () => (PHONE.matches ? 4 : 8);
  const match = () => cards.filter((c) => key === 'all' || c.stop === key);
  const apply = () => {
    const m = match();
    const lim = open ? Infinity : limit();
    cards.forEach((c) => (c.li.hidden = true));
    m.forEach((c, i) => (c.li.hidden = i >= lim));
    more.hidden = m.length <= limit();
    more.textContent = open ? S.less : `${S.more} (${m.length})`;
    more.setAttribute('aria-expanded', String(open));
    count.textContent = S.count(m.length);
  };
  apply();

  function scroll(gsap, ScrollTrigger) {
    headScroll(gsap, hd);
    tilt(gsap, cards);
    popOnScroll(gsap, ScrollTrigger, cards.filter((c) => !c.li.hidden).map((c) => c.a));
    if (!RM) ScrollTrigger.create({ trigger: el.querySelector('.folder'), start: 'top 92%', once: true, onEnter: () => gsap.fromTo(tabBtns, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(2)', stagger: 0.05, clearProps: 'transform,opacity,visibility' }) });
    const change = (mutate) => {
      if (RM) { mutate(); ScrollTrigger.refresh(); return; }
      if (busy) return;
      busy = true;
      const out = cards.filter((c) => !c.li.hidden).map((c) => c.a);
      gsap.to(out, {
        rotationX: 90, autoAlpha: 0, duration: 0.24, ease: 'power2.in', stagger: 0.02, transformOrigin: '50% 100%', overwrite: true,
        onComplete: () => {
          mutate();
          const inn = cards.filter((c) => !c.li.hidden).map((c) => c.a);
          gsap.set(inn, { rotationX: 90, autoAlpha: 0 });
          pop(gsap, inn, 0.05);
          ScrollTrigger.refresh();
          gsap.delayedCall(0.4, () => (busy = false));
        },
      });
    };
    tabBtns.forEach((b) => b.addEventListener('click', () => {
      if (b.dataset.k === key || busy) return;
      key = b.dataset.k;
      open = false;
      tabBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      b.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: RM ? 'auto' : 'smooth' });
      change(apply);
    }));
    more.addEventListener('click', () => {
      const was = open;
      change(() => { open = !open; apply(); });
      if (was) panel.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' });
    });
    PHONE.addEventListener('change', apply);
  }
  return { el, scroll };
}

// ---------- 2. Stays ----------
function stays(data) {
  const sec = data.sections.stays;
  const regionName = (k) => tr(data.regions.find((r) => r.key === k).name);
  const hd = head(2, S.stayK, tr(sec.title), tr(sec.sub), 'assets/img/icon-5.png');
  const list = h('ul', { class: 'cgrid cgrid--stays' });
  const cards = data.stays.map((s) => {
    const href = s.href ? (typeof s.href === 'string' ? s.href : tr(s.href)) : null;
    const p = s.priceFrom != null ? `${tr(sec.from)} ${LANG === 'ar' ? `${num(s.priceFrom)} ر.س` : `SAR ${num(s.priceFrom)}`} ${tr(sec.night)}` : ' ';
    const c = card({
      href, cls: `cp--stay${href ? '' : ' is-soon'}`, photo: s.photo, meta: `${tr(s.city)} · ${regionName(s.region)}`,
      title: h('span', { class: 'cp__title cp__title--one' }, tr(s.name)),
      lines: [h('span', { class: 'cp__tagline' }, tr(s.tagline)), h('span', { class: 'cp__desc' }, tr(s.desc)), h('span', { class: 'cp__price' }, p)],
      foot: href
        ? h('span', { class: 'cp__foot' }, h('span', {}, tr(data.sections.tours.cta)), h('span', { class: 'cp__arrow', html: ARROW }))
        : h('span', { class: 'cp__foot cp__foot--soon' }, h('span', { class: 'cp__soon-mark', 'aria-hidden': 'true' }), tr(sec.soon)),
    });
    list.append(c.li);
    return c;
  });
  const el = section('pr--stays', hd, list);
  return { el, scroll: (gsap, ST) => { headScroll(gsap, hd); tilt(gsap, cards); popOnScroll(gsap, ST, cards.map((c) => c.a)); } };
}

// ---------- 3. Tips: a folded leaflet ----------
function tips(data) {
  const hd = head(3, S.tipsK, tr(data.sections.tips.title), null, 'assets/img/icon-2.png');
  const list = h('ol', { class: 'leaflet' }, data.tips.map((t, i) => h('li', { class: `leaf leaf--${i % 2 ? 'b' : 'a'}`, style: `--i:${i}` },
    h('span', { class: 'leaf__shade', 'aria-hidden': 'true' }),
    h('span', { class: 'leaf__top' }, h('span', { class: 'leaf__ic', html: icon(t.icon) }), h('span', { class: 'leaf__n' }, pad2(i + 1))),
    h('h3', { class: 'leaf__title' }, tr(t.title)),
    h('p', { class: 'leaf__text' }, tr(t.text)))));
  const el = section('pr--tips', hd, list);
  return {
    el,
    scroll: (gsap, ScrollTrigger) => {
      headScroll(gsap, hd);
      if (RM) { list.classList.add('is-open'); return; }
      ScrollTrigger.create({ trigger: list, start: 'top 85%', once: true, onEnter: () => list.classList.add('is-open') });
    },
  };
}

// ---------- 4. FAQ: paper strips that unfold ----------
function faq(data) {
  const hd = head(4, S.faqK, tr(data.sections.faq.title), null, 'assets/img/icon-6.png');
  const items = data.faq.map((f, i) => {
    const id = `pr-faq-${i}`;
    const btn = h('button', { class: 'strip__btn', type: 'button', id: `${id}-b`, 'aria-expanded': 'false', 'aria-controls': id },
      h('span', { class: 'strip__n' }, pad2(i + 1)), h('span', { class: 'strip__q' }, tr(f.q)), h('span', { class: 'strip__ic', 'aria-hidden': 'true' }));
    const panel = h('div', { class: 'strip__panel', id, role: 'region', 'aria-labelledby': `${id}-b` }, h('div', { class: 'strip__fold' }, h('p', { class: 'strip__a' }, tr(f.a))));
    return { li: h('li', { class: 'strip' }, h('h3', { class: 'strip__h' }, btn), panel), btn };
  });
  items.forEach((it, i) => it.btn.addEventListener('click', () => {
    const was = it.btn.getAttribute('aria-expanded') === 'true';
    items.forEach((x, k) => {
      const on = !was && k === i;
      x.btn.setAttribute('aria-expanded', String(on));
      x.li.classList.toggle('is-open', on);
    });
    setTimeout(() => window.ScrollTrigger && window.ScrollTrigger.refresh(), 600);
  }));
  const list = h('ol', { class: 'strips' }, items.map((x) => x.li));
  const el = section('pr--faq', hd, list);
  return { el, scroll: (gsap, ST) => { headScroll(gsap, hd); popOnScroll(gsap, ST, items.map((x) => x.li)); } };
}

export function createPractical(data) {
  const parts = [tours(data), stays(data), tips(data), faq(data)];
  return { els: parts.map((p) => p.el), scroll: (gsap, ST) => parts.forEach((p) => p.scroll(gsap, ST)) };
}
