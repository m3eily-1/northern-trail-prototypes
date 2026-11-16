// Practical sections for the mirage direction. DOM cards share ONE effect: an SVG
// heat-haze displacement filter that only the hovered card (or a list that is
// resolving after a filter change) wears for a moment. No extra WebGL cost.
import { env, t, asset, pad2, esc, maskWords, onEnter } from './util.js';

const P = {
  en: {
    all: 'All',
    region: 'Region',
    stop: 'Stop',
    showAll: (n) => `Show all ${n}`,
    showFewer: 'Show fewer',
    results: (n) => `${n} ${n === 1 ? 'experience' : 'experiences'}`,
    from: (n) => `From SAR ${n}`,
    free: 'Free',
    newTab: 'opens in a new tab',
    stays: 'Stays',
  },
  ar: {
    all: 'الكل',
    region: 'المنطقة',
    stop: 'المحطة',
    showAll: (n) => `اعرض الكل (${n})`,
    showFewer: 'اعرض أقل',
    results: (n) => (n === 1 ? 'تجربة واحدة' : n === 2 ? 'تجربتان' : n <= 10 ? `${n} تجارب` : `${n} تجربة`),
    from: (n) => `تبدأ من ${n} ر.س`,
    free: 'مجانًا',
    newTab: 'يفتح في نافذة جديدة',
    stays: 'الإقامة',
  },
}[env.lang];

const num = (n) => Number(n).toLocaleString('en-US');
const priceLabel = (p) => (p == null ? '' : p === 0 ? P.free : P.from(num(p)));
const ARROW = '<svg class="lx-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11.5 5.5 16 10l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const PLUS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const DOWN = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13M4.5 10.5 10 16l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';
const TIP_ICONS = {
  plane: '<path d="M3 13.5 21 6l-4.5 13-4-5.5zM12.5 13.5 21 6M6.5 12l1.2 5.5 2.6-2.4"/>',
  temperature: '<path d="M10 14.5V4.5h4v10a4 4 0 1 1-4 0zM12 16.5V9M16.5 6h3M16.5 9.5h2.5M16.5 13h3"/>',
  route: '<path d="M5 20c0-5 4-4.5 7-7.5s1-6 6-8M17 4.5V2M17 2.5l4 1.5-4 1.5"/><path d="M5 18a2 2 0 1 0 0 4 2 2 0 1 0 0-4z"/>',
  clock: '<path d="M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 1 0 0-17zM12 7v5l3.5 2"/>',
  fuel: '<path d="M4 21V4h10v17M2.5 21h13M6.5 7h5v4h-5zM14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V17a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
};
const tipIcon = (k) => `<svg class="lx-tip__svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round">${TIP_ICONS[k] || TIP_ICONS.clock}</svg>`;

/* ---------------- the one shared effect ---------------- */

const canHaze = !env.reduced && !env.touch && window.innerWidth >= 768;

function createHaze() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'lx-defs');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <filter id="lx-haze" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.008 0.06" numOctaves="2" seed="3" result="n"></feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="0" xChannelSelector="R" yChannelSelector="G"></feDisplacementMap>
    </filter>`;
  document.body.append(svg);
  const turb = svg.querySelector('feTurbulence');
  const disp = svg.querySelector('feDisplacementMap');
  let target = null;
  let amp = 0;
  let goal = 0;
  let raf = 0;
  let t0 = performance.now();
  const loop = (now) => {
    amp += (goal - amp) * (goal > amp ? 0.14 : 0.07);
    const tt = (now - t0) / 1000;
    // rising air: the noise drifts upward, its strength breathes
    turb.setAttribute('baseFrequency', `${(0.008 + Math.sin(tt * 1.3) * 0.0015).toFixed(4)} ${(0.06 + Math.sin(tt * 2.1) * 0.012).toFixed(4)}`);
    disp.setAttribute('scale', (amp * (0.8 + Math.sin(tt * 3.2) * 0.2)).toFixed(2));
    if (goal === 0 && amp < 0.3) {
      disp.setAttribute('scale', '0');
      target?.classList.remove('is-haze');
      target = null;
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(loop);
  };
  const run = () => { if (!raf) { t0 = performance.now(); raf = requestAnimationFrame(loop); } };
  return {
    // hover: one card at a time wears the filter
    on(el, strength = 18) {
      if (target && target !== el) target.classList.remove('is-haze');
      target = el;
      el.classList.add('is-haze');
      goal = strength;
      run();
    },
    off(el) { if (el === target) goal = 0; },
    // a list resolving out of the haze (filter change, show more)
    burst(el, strength = 46) {
      if (target && target !== el) target.classList.remove('is-haze');
      target = el;
      el.classList.add('is-haze');
      amp = strength;
      goal = 0;
      run();
    },
  };
}

let haze = null;
function bindHaze(card, strength) {
  if (!canHaze) return;
  card.addEventListener('pointerenter', () => haze.on(card, strength));
  card.addEventListener('pointerleave', () => haze.off(card));
  card.addEventListener('focusin', () => haze.on(card, strength * 0.6));
  card.addEventListener('focusout', () => haze.off(card));
}

function head(id, title, sub, cls = '') {
  return `<header class="lx-head ${cls}">
      <h2 class="lx-h" id="${id}">${maskWords(title)}</h2>
      ${sub ? `<p class="lx-sub" data-lx-reveal>${esc(sub)}</p>` : ''}
    </header>`;
}

function reveal(root) {
  onEnter(root.querySelectorAll('.lx-head'), null, { rootMargin: '0px 0px -15% 0px' });
  onEnter(root.querySelectorAll('[data-lx-reveal]'), null, { rootMargin: '0px 0px -10% 0px' });
}

/* ---------------- tours ---------------- */

function renderTours(section, data) {
  const S = data.sections.tours;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const tours = data.tours;
  const filters = [{ key: 'all', label: P.all, test: () => true }];
  data.regions.forEach((r) => {
    const n = tours.filter((x) => x.region === r.key).length;
    if (n) filters.push({ key: `r:${r.key}`, label: t(r.name), n, test: (x) => x.region === r.key });
  });
  data.stops.forEach((s) => {
    const n = tours.filter((x) => x.stop === s.key).length;
    if (n) filters.push({ key: `s:${s.key}`, label: t(s.name), n, test: (x) => x.stop === s.key });
  });
  const fb = (f) => `<button class="lx-f" type="button" data-f="${f.key}" aria-pressed="${f.key === 'all'}"><span>${esc(f.label)}</span>${f.n ? `<span class="lx-f__n">${f.n}</span>` : ''}</button>`;

  const card = (x, i) => {
    const stop = stopBy[x.stop];
    const price = priceLabel(x.price);
    const title = t(x.title);
    return `<li class="lx-tour" data-i="${i}">
      <a class="lx-tour__a" href="${esc(x.href[env.lang] || x.href.en)}" target="_blank" rel="noopener">
        <span class="lx-ph lx-ph--tour${x.photoIsStop ? ' lx-ph--alt' : ''}"${x.photoIsStop ? ` style="--ox:${[20, 80, 50, 15, 85, 35, 65][i % 7]}%;--oy:${[30, 60, 80, 45, 25, 70, 50][i % 7]}%"` : ''}><img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async"></span>
        <span class="lx-tour__meta"><span class="lx-tour__type">${esc(t(x.type))}</span><span class="lx-tour__stop">${stop ? `${pad2(stop.n)} ${esc(t(stop.name))}` : ''}</span></span>
        <h3 class="lx-tour__title" title="${esc(title)}">${esc(title)}</h3>
        <span class="lx-tour__until">${esc(t(x.until))}</span>
        <span class="lx-tour__foot">
          <span class="lx-tour__price">${price ? esc(price) : '&nbsp;'}</span>
          <span class="lx-cta">${esc(t(S.cta))}${ARROW}<span class="lx-sr">, ${esc(P.newTab)}</span></span>
        </span>
      </a>
    </li>`;
  };

  section.innerHTML = `
    <div class="nt-wrap lx-wrap">
      ${head('tours-title', t(S.title), t(S.sub))}
      <div class="lx-filters" data-lx-reveal>
        <div class="lx-fg" role="group" aria-label="${esc(P.region)}">${filters.filter((f) => !f.key.startsWith('s:')).map(fb).join('')}</div>
        <div class="lx-fg" role="group" aria-label="${esc(P.stop)}"><span class="lx-fg__l" aria-hidden="true">${esc(P.stop)}</span>${filters.filter((f) => f.key.startsWith('s:')).map(fb).join('')}</div>
      </div>
      <ul class="lx-tours">${tours.map(card).join('')}</ul>
      <div class="lx-morebar"><button class="lx-more" type="button"></button></div>
      <p class="lx-sr" aria-live="polite" data-live></p>
    </div>`;

  const list = section.querySelector('.lx-tours');
  const cards = [...list.children];
  const btns = [...section.querySelectorAll('.lx-f')];
  const more = section.querySelector('.lx-more');
  const live = section.querySelector('[data-live]');
  let filter = filters[0];
  let open = false;
  const limit = () => (env.phone() ? 4 : 8);

  function apply() {
    const m = cards.filter((c) => filter.test(tours[+c.dataset.i]));
    const cap = open ? m.length : limit();
    cards.forEach((c) => (c.hidden = true));
    m.forEach((c, k) => {
      c.hidden = k >= cap;
      c.style.setProperty('--k', String(k % 8));
    });
    more.hidden = m.length <= limit();
    more.innerHTML = `<span>${esc(open ? P.showFewer : P.showAll(m.length))}</span><span class="lx-more__ic${open ? ' is-up' : ''}">${DOWN}</span>`;
    return m.length;
  }

  // Filter change: the old set evaporates, the new one condenses out of the haze.
  let busy = false;
  async function change(fn) {
    if (busy) return;
    busy = true;
    if (!env.reduced) {
      list.classList.add('is-out');
      await new Promise((r) => setTimeout(r, 260));
    }
    const n = fn();
    list.classList.remove('is-out');
    if (!env.reduced) {
      list.classList.add('is-condense');
      void list.offsetWidth;
      list.classList.remove('is-condense');
      if (canHaze) haze.burst(list);
    }
    busy = false;
    return n;
  }

  btns.forEach((b) =>
    b.addEventListener('click', async () => {
      const f = filters.find((x) => x.key === b.dataset.f);
      if (f === filter) return;
      btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      const n = await change(() => { filter = f; open = false; return apply(); });
      live.textContent = P.results(n);
    })
  );
  more.addEventListener('click', async () => {
    const wasOpen = open;
    await change(() => { open = !open; return apply(); });
    if (wasOpen) list.scrollIntoView({ block: 'start', behavior: env.reduced ? 'auto' : 'smooth' });
  });
  addEventListener('resize', () => apply());
  apply();
  cards.forEach((c) => bindHaze(c.querySelector('.lx-tour__a'), 20));
  onEnter([list], null, { rootMargin: '0px 0px -10% 0px' });
  reveal(section);
}

/* ---------------- stays ---------------- */

function renderStays(section, data) {
  const S = data.sections.stays;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));
  const card = (s, i) => {
    const price = s.priceFrom != null
      ? `<span class="lx-stay__price"><span>${esc(t(S.from))}</span> <b>${env.lang === 'ar' ? `${num(s.priceFrom)} ر.س` : `SAR ${num(s.priceFrom)}`}</b> <span>${esc(t(S.night))}</span></span>`
      : '<span class="lx-stay__price">&nbsp;</span>';
    const status = s.href
      ? `<span class="lx-cta">${esc(t(data.sections.tours.cta))}${ARROW}</span>`
      : `<span class="lx-soon"><i aria-hidden="true"></i>${esc(t(S.soon))}</span>`;
    const inner = `
      <span class="lx-ph lx-ph--stay"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="1000" height="750"></span>
      <span class="lx-stay__txt">
        <span class="lx-stay__where">${esc(t(s.city))} · ${esc(t(regionBy[s.region]?.name))}</span>
        <h3 class="lx-stay__name">${esc(t(s.name))}</h3>
        <span class="lx-stay__tag">${esc(t(s.tagline))}</span>
        <span class="lx-stay__desc">${esc(t(s.desc))}</span>
        <span class="lx-stay__foot">${price}${status}</span>
      </span>`;
    return `<li class="lx-stay" style="--k:${i}">${s.href ? `<a class="lx-stay__in" href="${esc(s.href[env.lang] || s.href.en || s.href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="lx-stay__in">${inner}</div>`}</li>`;
  };
  section.innerHTML = `
    <div class="nt-wrap lx-wrap">
      ${head('stays-title', t(S.title), t(S.sub))}
      <ul class="lx-stays">${data.stays.map(card).join('')}</ul>
    </div>`;
  const list = section.querySelector('.lx-stays');
  section.querySelectorAll('.lx-stay__in').forEach((c) => bindHaze(c, 16));
  onEnter([list], null, { rootMargin: '0px 0px -10% 0px' });
  reveal(section);
}

/* ---------------- tips ---------------- */

function renderTips(section, data) {
  const S = data.sections.tips;
  section.innerHTML = `
    <div class="nt-wrap lx-wrap">
      ${head('tips-title', t(S.title), '')}
      <ol class="lx-tips">${data.tips
        .map(
          (x, i) => `<li class="lx-tip" style="--k:${i}">
            <span class="lx-tip__n">${pad2(i + 1)}</span>
            <span class="lx-tip__ic">${tipIcon(x.icon)}</span>
            <h3 class="lx-tip__title">${esc(t(x.title))}</h3>
            <p class="lx-tip__text">${esc(t(x.text))}</p>
          </li>`
        )
        .join('')}</ol>
    </div>`;
  onEnter(section.querySelectorAll('.lx-tip'), null, { rootMargin: '0px 0px -10% 0px' });
  reveal(section);
}

/* ---------------- faq ---------------- */

function renderFaq(section, data) {
  const S = data.sections.faq;
  section.innerHTML = `
    <div class="nt-wrap lx-wrap lx-split">
      ${head('faq-title', t(S.title), '', 'lx-head--side')}
      <div class="lx-faq">${data.faq
        .map(
          (f, i) => `<div class="lx-faq__item">
            <h3 class="lx-faq__h"><button class="lx-faq__btn" type="button" id="lx-q-${i}" aria-expanded="false" aria-controls="lx-a-${i}">
              <span class="lx-faq__n">${pad2(i + 1)}</span><span class="lx-faq__q">${esc(t(f.q))}</span><span class="lx-faq__ic">${PLUS}</span>
            </button></h3>
            <div class="lx-faq__a" id="lx-a-${i}" role="region" aria-labelledby="lx-q-${i}"><div class="lx-faq__ai"><p>${esc(t(f.a))}</p></div></div>
          </div>`
        )
        .join('')}</div>
    </div>`;
  const btns = [...section.querySelectorAll('.lx-faq__btn')];
  const set = (open) =>
    btns.forEach((b) => {
      const on = b === open;
      b.setAttribute('aria-expanded', String(on));
      b.closest('.lx-faq__item').classList.toggle('is-open', on);
      section.querySelector(`#${b.getAttribute('aria-controls')}`).inert = !on;
    });
  btns.forEach((b) => b.addEventListener('click', () => set(b.getAttribute('aria-expanded') === 'true' ? null : b)));
  set(btns[0]);
  onEnter(section.querySelectorAll('.lx-faq__item'), null, { rootMargin: '0px 0px -8% 0px' });
  reveal(section);
}

export function renderPractical(data) {
  if (canHaze) haze = createHaze();
  const $ = (s) => document.querySelector(s);
  renderTours($('#tours'), data);
  renderStays($('#stays'), data);
  renderTips($('#tips'), data);
  renderFaq($('#faq'), data);
}
