// Practical sections, cinema edition. Tours run as a film strip (sprocket rails, edge codes,
// viewfinder corners on hover, filter = a hard cut), stays are a contact sheet with grease-pencil
// selection, tips roll as end credits, and the FAQ is a scene list whose answers play as
// subtitles. Owns its DOM root; no globals.
import { pad2, splitWords } from './labels.js';

const T = {
  en: {
    reel: 'Reel',
    all: 'All stops',
    filter: 'Filter tours by stop',
    frames: (n) => `${n} ${n === 1 ? 'frame' : 'frames'}`,
    prev: 'Previous tours',
    next: 'Next tours',
    free: 'Free',
    from: (p) => `From SAR ${p}`,
    by: 'By',
    newTab: 'opens webook in a new tab',
    swipe: 'Swipe the strip',
    drag: 'Drag or use the arrows',
  },
  ar: {
    reel: 'البكرة',
    all: 'كل المحطات',
    filter: 'تصفية الجولات حسب المحطة',
    frames: (n) => `${n} ${n === 1 ? 'لقطة' : n <= 10 ? 'لقطات' : 'لقطة'}`,
    prev: 'الجولات السابقة',
    next: 'الجولات التالية',
    free: 'مجانًا',
    from: (p) => `تبدأ من ${p} ر.س`,
    by: 'تنظيم',
    newTab: 'يفتح webook في نافذة جديدة',
    swipe: 'اسحب الشريط',
    drag: 'اسحب أو استخدم الأسهم',
  },
};

const ARROW = '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>';
const PLUS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>';
const HOLD = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 5v6M10 5v6" stroke="currentColor" stroke-width="1.5"/></svg>';

const TIP_ICON = {
  plane: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 18l24-9-6 16-6-6-5 5v-7z"/><path d="M16 19l12-10"/></svg>',
  temperature: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 5h6v14.5a5.5 5.5 0 1 1-6 0z"/><path d="M16 12v11" stroke-linecap="square"/><path d="M22 9h4M22 13h3" stroke-linecap="square"/></svg>',
  route: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="4" y="4" width="6" height="6"/><rect x="22" y="22" width="6" height="6"/><path d="M10 7h11a4 4 0 0 1 0 8H11a4 4 0 0 0 0 8h11" stroke-dasharray="3 3"/></svg>',
  clock: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><rect x="5" y="5" width="22" height="22"/><path d="M16 9v7.5h6"/></svg>',
  fuel: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M6 27V6h13v21M4 27h17"/><path d="M9 10h7v5H9z"/><path d="M19 13h3l3 3v8a2 2 0 0 0 4 0V11l-3-3"/></svg>',
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function initPractical(root, ctx) {
  const { gsap, data, lang, rtl, t, asset, reduced, isPhone, fine } = ctx;
  const P = T[lang];
  const S = data.sections;
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  const head = (n, title, sub, id) => `
    <header class="ntc-pr__head nt-wrap">
      <p class="ntc-pr__label"><span>${P.reel}</span><b>${pad2(n)}</b><span>/ 05</span></p>
      <h2 class="ntc-pr__title" id="${id}" data-split="${esc(title)}"></h2>
      ${sub ? `<p class="ntc-pr__sub">${esc(sub)}</p>` : ''}
    </header>`;

  /* ---------------- tours: film strip ---------------- */
  const tours = data.tours;
  const tourStops = data.stops.map((s) => s.key).filter((k) => tours.some((x) => x.stop === k));
  const priceText = (p) => (p == null ? '' : p === 0 ? P.free : P.from(p));

  const frame = (x, i) => {
    const st = stopBy[x.stop];
    return `
      <li class="ntc-frame" data-pr-card data-stop="${x.stop}">
        <a class="ntc-frame__link" href="${esc(t(x.href))}" target="_blank" rel="noopener" draggable="false">
          <span class="ntc-frame__ph">
            <img src="${asset(x.photo)}" alt="" loading="lazy" decoding="async" draggable="false">
            <span class="ntc-frame__code" dir="ltr" aria-hidden="true">NT ${pad2(i + 1)}A</span>
            <span class="ntc-vf" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
          </span>
          <span class="ntc-frame__meta"><b dir="ltr">${pad2(st.n)}</b><span>${esc(t(st.name))}</span><span class="ntc-frame__type">${esc(t(x.type))}</span></span>
          <span class="ntc-frame__title">${esc(t(x.title))}</span>
          <span class="ntc-frame__line">${esc(t(x.until))}</span>
          <span class="ntc-frame__line ntc-frame__org">${x.organizer ? `${P.by} ${esc(x.organizer)}` : ''}</span>
          <span class="ntc-frame__foot">
            <span class="ntc-frame__price">${esc(priceText(x.price))}</span>
            <span class="ntc-frame__cta"><span>${esc(t(S.tours.cta))}</span>${ARROW}</span>
          </span>
          <span class="ntc-sr">(${P.newTab})</span>
        </a>
      </li>`;
  };

  /* ---------------- stays: contact sheet ---------------- */
  const stays = [...data.stays].sort((a, b) => ['riyadh', 'qassim', 'hail'].indexOf(a.region) - ['riyadh', 'qassim', 'hail'].indexOf(b.region));
  const still = (s, i) => {
    const price = s.priceFrom != null
      ? (lang === 'ar' ? `${t(S.stays.from)} ${s.priceFrom} ر.س ${t(S.stays.night)}` : `${t(S.stays.from)} SAR ${s.priceFrom} ${t(S.stays.night)}`)
      : '';
    const href = s.href ? t(s.href) : null;
    const inner = `
      <span class="ntc-still__edge" dir="ltr" aria-hidden="true"><span>NT 400</span><span>${pad2(i + 1)}</span></span>
      <span class="ntc-still__ph"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async"></span>
      <span class="ntc-still__where">${esc(t(s.city))} · ${esc(t(regionBy[s.region].name))}</span>
      <h3 class="ntc-still__name">${esc(t(s.name))}</h3>
      <p class="ntc-still__tag">${esc(t(s.tagline))}</p>
      <p class="ntc-still__desc">${esc(t(s.desc))}</p>
      <span class="ntc-still__foot">
        <span class="ntc-still__price">${esc(price)}</span>
        ${href
          ? `<span class="ntc-frame__cta"><span>${esc(t(S.tours.cta))}</span>${ARROW}</span>`
          : `<span class="ntc-still__soon">${HOLD}<span>${esc(t(S.stays.soon))}</span></span>`}
      </span>
      <span class="ntc-still__pencil" aria-hidden="true"></span>`;
    return `<li class="ntc-still" data-pr-stay>${href
      ? `<a class="ntc-still__card" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>`
      : `<article class="ntc-still__card">${inner}</article>`}</li>`;
  };

  root.innerHTML = `
    <section class="ntc-pr ntc-pr--tours" data-pr="tours" aria-labelledby="pr-tours">
      ${head(2, t(S.tours.title), t(S.tours.sub), 'pr-tours')}
      <div class="ntc-pr__bar nt-wrap">
        <div class="ntc-scenes" role="group" aria-label="${P.filter}">
          <button class="ntc-scene" type="button" data-filter="all" aria-pressed="true"><span>${P.all}</span><b dir="ltr">${tours.length}</b></button>
          ${tourStops.map((k) => `<button class="ntc-scene" type="button" data-filter="${k}" aria-pressed="false"><span>${esc(t(stopBy[k].name))}</span><b dir="ltr">${tours.filter((x) => x.stop === k).length}</b></button>`).join('')}
        </div>
        <div class="ntc-strip-nav">
          <p class="ntc-strip-count" aria-live="polite"></p>
          <button class="ntc-strip-btn" type="button" data-step="-1" aria-label="${P.prev}">${ARROW}</button>
          <button class="ntc-strip-btn" type="button" data-step="1" aria-label="${P.next}">${ARROW}</button>
        </div>
      </div>
      <div class="ntc-strip">
        <ul class="ntc-strip__track">${tours.map(frame).join('')}</ul>
      </div>
      <p class="ntc-strip-hint nt-wrap" aria-hidden="true">${isPhone ? P.swipe : P.drag}</p>
    </section>

    <section class="ntc-pr ntc-pr--stays" data-pr="stays" aria-labelledby="pr-stays">
      ${head(3, t(S.stays.title), t(S.stays.sub), 'pr-stays')}
      <div class="ntc-sheet-wrap">
        <ul class="ntc-sheet nt-wrap">${stays.map(still).join('')}</ul>
      </div>
    </section>

    <section class="ntc-pr ntc-pr--tips" data-pr="tips" aria-labelledby="pr-tips">
      ${head(4, t(S.tips.title), '', 'pr-tips')}
      <ol class="ntc-credits nt-wrap">
        ${data.tips.map((x, i) => `
          <li class="ntc-credit" data-pr-tip style="--i:${i}">
            <div class="ntc-credit__role">
              <span class="ntc-credit__icon" aria-hidden="true">${TIP_ICON[x.icon] || TIP_ICON.route}</span>
              <h3>${esc(t(x.title))}</h3>
            </div>
            <p class="ntc-credit__text">${esc(t(x.text))}</p>
          </li>`).join('')}
      </ol>
    </section>

    <section class="ntc-pr ntc-pr--faq" data-pr="faq" aria-labelledby="pr-faq">
      ${head(5, t(S.faq.title), '', 'pr-faq')}
      <ul class="ntc-scenelist nt-wrap">
        ${data.faq.map((f, i) => `
          <li class="ntc-q">
            <h3 class="ntc-q__h">
              <button class="ntc-q__btn" type="button" id="pr-q-${i}" aria-expanded="false" aria-controls="pr-a-${i}">
                <span class="ntc-q__tc" dir="ltr" aria-hidden="true">00:${pad2(i * 2 + 1)}:${pad2((i * 17) % 60)}</span>
                <span class="ntc-q__text">${esc(t(f.q))}</span>
                <span class="ntc-q__icon" aria-hidden="true">${PLUS}</span>
              </button>
            </h3>
            <div class="ntc-q__a" id="pr-a-${i}" role="region" aria-labelledby="pr-q-${i}">
              <div class="ntc-q__inner"><p>${esc(t(f.a))}</p></div>
            </div>
          </li>`).join('')}
      </ul>
    </section>`;

  root.querySelectorAll('[data-split]').forEach((h) => splitWords(h, h.dataset.split));

  /* ---------------- strip: filter, arrows, drag ---------------- */
  const strip = root.querySelector('.ntc-strip');
  const frames = [...root.querySelectorAll('.ntc-frame')];
  const scenes = [...root.querySelectorAll('.ntc-scene')];
  const count = root.querySelector('.ntc-strip-count');
  const btns = [...root.querySelectorAll('.ntc-strip-btn')];
  let filter = 'all';

  const scrollStart = () => strip.scrollTo({ left: 0, behavior: 'auto' });
  function updateNav() {
    const max = strip.scrollWidth - strip.clientWidth;
    const pos = Math.abs(strip.scrollLeft);
    btns[0].disabled = pos <= 2;
    btns[1].disabled = pos >= max - 2;
  }
  function apply(animate) {
    const shown = frames.filter((f) => filter === 'all' || f.dataset.stop === filter);
    const swap = () => {
      frames.forEach((f) => { f.hidden = !shown.includes(f); });
      count.textContent = P.frames(shown.length);
      scrollStart();
      updateNav();
    };
    if (!animate || reduced) { swap(); return; }
    // a hard cut: the strip wipes shut, the new scene wipes open frame by frame
    const visible = frames.filter((f) => !f.hidden);
    const shut = rtl ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)';
    gsap.killTweensOf(frames);
    gsap.to(visible, {
      clipPath: shut, duration: 0.22, ease: 'power2.in', stagger: 0.02,
      onComplete: () => {
        swap();
        gsap.set(visible, { clearProps: 'clipPath' });
        gsap.fromTo(shown, { clipPath: rtl ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)' }, {
          clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power3.out', stagger: 0.05, clearProps: 'clipPath',
        });
      },
    });
  }
  scenes.forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.filter === filter) return;
    filter = b.dataset.filter;
    scenes.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    apply(true);
  }));
  btns.forEach((b) => b.addEventListener('click', () => {
    const step = (frames.find((f) => !f.hidden)?.offsetWidth || 300) + 24;
    const dir = Number(b.dataset.step) * (rtl ? -1 : 1);
    strip.scrollBy({ left: dir * step, behavior: reduced ? 'auto' : 'smooth' });
  }));
  strip.addEventListener('scroll', () => requestAnimationFrame(updateNav), { passive: true });
  window.addEventListener('resize', updateNav);
  apply(false);

  // mouse drag-to-scroll with click suppression (touch uses native swipe)
  if (fine) {
    let down = false;
    let moved = 0;
    let sx = 0;
    let sl = 0;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft;
    });
    window.addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 6) { strip.classList.add('is-dragging'); strip.scrollLeft = sl - dx; }
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      setTimeout(() => strip.classList.remove('is-dragging'), 0);
    });
    strip.addEventListener('click', (e) => { if (moved > 6) { e.preventDefault(); moved = 0; } }, true);
  }

  /* ---------------- FAQ: one open at a time ---------------- */
  const qs = [...root.querySelectorAll('.ntc-q')];
  const setOpen = (idx) => qs.forEach((q, i) => {
    q.classList.toggle('is-open', i === idx);
    q.querySelector('.ntc-q__btn').setAttribute('aria-expanded', String(i === idx));
  });
  qs.forEach((q, i) => q.querySelector('.ntc-q__btn').addEventListener('click', () => setOpen(q.classList.contains('is-open') ? -1 : i)));
  setOpen(0);

  /* ---------------- reveals ---------------- */
  const heads = [...root.querySelectorAll('.ntc-pr__head')];
  const groups = [...root.querySelectorAll('.ntc-strip, .ntc-sheet, .ntc-credits, .ntc-scenelist, .ntc-pr__bar')];
  if (reduced || !('IntersectionObserver' in window)) {
    heads.forEach((h) => h.classList.add('is-active'));
    groups.forEach((g) => g.classList.add('is-in', 'is-settled'));
    return {};
  }
  root.classList.add('can-reveal');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add(e.target.classList.contains('ntc-pr__head') ? 'is-active' : 'is-in');
    setTimeout(() => e.target.classList.add('is-settled'), 1600);
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  [...heads, ...groups].forEach((n) => io.observe(n));
  return {};
}
