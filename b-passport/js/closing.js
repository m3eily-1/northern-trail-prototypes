// Closing: "Passport complete". The full grid, the tagline and the closing line; every stamp peels
// off and can be dragged, tossed, shuffled and put back.
import { esc, pad2, mqPhone } from './i18n.js';
import { stampArt, stampMeta, completeStampSVG } from './stamp.js';
import { passportPageHTML } from './passport.js';
import { TossField } from './toss.js';

export function mountClosing(root, ctx) {
  const { C, lang, t, reduced, asset } = ctx;
  const gsap = window.gsap;
  const stops = C.stops;
  const metas = stops.map(stampMeta);
  const phoneMQ = mqPhone();

  const completeHead = `<span class="pp__complete" aria-hidden="true">${completeStampSVG(t.completeStamp, '16 / 16')}</span>`;

  root.innerHTML = `
    <div class="nt-wrap close__inner">
      <div class="close__copy">
        <p class="nt-eyebrow close__eyebrow"><span>${t.complete}</span><span class="close__count">16 / 16</span></p>
        <p class="close__tag" lang="ar" dir="rtl">${esc(C.hero.tagline)}</p>
        <p class="close__line">${esc(C.closing.line[lang])}</p>
        <div class="close__actions">
          <button class="nt-btn nt-btn--light close__shuffle" type="button">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h3.5c3.5 0 4.5 8 8 8H17M3 14h3.5c1.4 0 2.4-1.3 3.2-3M17 6h-2.5c-1.4 0-2.4 1.3-3.2 3M14.5 3.5 17 6l-2.5 2.5M14.5 11.5 17 14l-2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>
            <span>${t.shuffle}</span>
          </button>
          <button class="nt-btn nt-btn--ghost close__back" type="button">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>
            <span>${t.putBack}</span>
          </button>
        </div>
        <img class="close__logo" src="${asset(C.logo.cream)}" alt="${lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165">
      </div>
      <div class="close__pp">
        <div class="pp pp--static">
          <div class="pp__book">${passportPageHTML(C, lang, t, asset, { idPrefix: 'cl', showCounter: false, extraPage: completeHead })}</div>
        </div>
        <p class="close__hint" aria-hidden="true">
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 9V4.5a1.5 1.5 0 0 1 3 0V9m0-1.5a1.5 1.5 0 0 1 3 0V9m0-.5a1.5 1.5 0 0 1 3 0v3.5c0 3-2 5.5-5 5.5H10c-2 0-3-1-4-2.5L3.5 11a1.4 1.4 0 0 1 2.3-1.6L7 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
          <span>${t.dragStamps}</span>
        </p>
      </div>
    </div>
    <div class="close__field" aria-hidden="true">
      ${stops.map((s) => `
        <div class="toss toss--stamp${s.sticker ? ' is-sticker' : ''}" data-n="${s.n}">
          <div class="toss__in">
            ${s.sticker ? `<img class="toss__shadow" src="${asset(s.sticker)}" alt="" draggable="false">` : '<span class="toss__shadow"></span>'}
            <div class="toss__face">${stampArt(s, asset)}</div>
          </div>
        </div>`).join('')}
    </div>`;

  // Slots in the closing page are buttons only in the stops section; here they are print.
  root.querySelectorAll('.slot__btn').forEach((b) => { b.tabIndex = -1; b.setAttribute('aria-hidden', 'true'); });

  const field = root.querySelector('.close__field');
  const copy = root.querySelector('.close__copy');
  const slots = [...root.querySelectorAll('.pp__grid .slot')];
  const els = [...field.querySelectorAll('.toss')];
  const hint = root.querySelector('.close__hint');

  const rel = (el, pad = 0) => {
    const fr = field.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { l: r.left - fr.left - pad, t: r.top - fr.top - pad, r: r.right - fr.left + pad, b: r.bottom - fr.top + pad, w: r.width, h: r.height };
  };
  const protect = () => [rel(copy, 12)];
  const slotOf = (it) => slots[+it.el.dataset.n - 1];
  const tf = new TossField(field, {
    protect, reduced, margin: 8, restShadow: 0.18,
    onGrab: () => hint.classList.add('is-used'),
    onLoose: (it) => slotOf(it).classList.remove('is-stamped'),
    onDock: (it) => slotOf(it).classList.add('is-stamped'),
  });
  slots.forEach((s) => s.classList.add('is-stamped'));

  const INSET = 6;
  function dockSpots() {
    return slots.map((sl) => {
      const r = rel(sl);
      return { x: r.l + INSET, y: r.t + INSET, size: r.w - INSET * 2 };
    });
  }

  function layout(first) {
    tf.measure();
    const spots = dockSpots();
    els.forEach((el, i) => { el.style.width = `${spots[i].size}px`; el.style.height = `${spots[i].size}px`; });
    tf.items.forEach((it, i) => {
      tf.resizeItem(it);
      if (first || !it.moved) tf.place(it, spots[i].x, spots[i].y, metas[i].rot);
    });
    if (!first) tf.clampAll();
  }

  els.forEach((el, i) => tf.add(el, { rot: metas[i].rot }));
  layout(true);

  // Re-measure once fonts/images settle the page height, and on resize.
  let rz;
  const relayout = () => { clearTimeout(rz); rz = setTimeout(() => layout(false), 100); };
  window.addEventListener('resize', relayout);
  new ResizeObserver(relayout).observe(root);
  phoneMQ.addEventListener('change', relayout);

  // Shuffle: toss every stamp to a random free spot.
  function freeSpot(it) {
    const m = 12;
    // never toss above the visible top of the section
    const fr = field.getBoundingClientRect();
    const top = Math.max(m, 64 + 8 - fr.top);
    const bottom = tf.H - it.h - m;
    const y0 = Math.min(top, bottom);
    const yr = Math.max(1, bottom - y0);
    let best = null;
    for (let tries = 0; tries < 60; tries++) {
      const x = m + Math.random() * Math.max(1, tf.W - it.w - m * 2);
      const y = y0 + Math.random() * yr;
      if (!tf.overlaps(it, x, y)) return { x, y };
      best = { x, y };
    }
    return tf.exitFor({ ...it, x: best.x, y: best.y }, protect()[0]);
  }

  root.querySelector('.close__shuffle').addEventListener('click', () => {
    hint.classList.add('is-used');
    tf.measure();
    tf.items.forEach((it, i) => {
      const spot = freeSpot(it);
      const spin = (Math.random() * 2 - 1) * 260;
      if (reduced) tf.fling(it, spot.x, spot.y, 0);
      else setTimeout(() => tf.fling(it, spot.x, spot.y, spin), i * 28);
    });
  });

  root.querySelector('.close__back').addEventListener('click', () => {
    const spots = dockSpots();
    tf.items.forEach((it, i) => {
      if (reduced) tf.sendHome(it, spots[i].x, spots[i].y, metas[i].rot, { docked: true });
      else setTimeout(() => tf.sendHome(it, spots[i].x, spots[i].y, metas[i].rot, { docked: true }), (15 - i) * 22);
    });
  });

  // "Complete" stamp lands in the passport header when the section comes into view.
  const complete = root.querySelector('.pp__complete');
  const page = root.querySelector('.pp__page');
  if (!reduced && gsap) {
    gsap.set(complete, { autoAlpha: 0 });
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.timeline({ delay: 0.25 })
        .fromTo(complete, { autoAlpha: 0, scale: 1.7, rotation: -22 }, { autoAlpha: 1, duration: 0.1 }, 0)
        .to(complete, { scale: 0.94, rotation: -6, duration: 0.22, ease: 'power4.in' }, 0)
        .add(() => {
          gsap.fromTo(page, { x: 0, y: 0 }, {
            keyframes: [{ x: -3, y: 2, duration: 0.05 }, { x: 3, y: -2, duration: 0.05 }, { x: -1.5, y: 1, duration: 0.05 }, { x: 0, y: 0, duration: 0.06 }],
            clearProps: 'transform',
          });
        }, 0.22)
        .to(complete, { scale: 1, rotation: -8, duration: 0.6, ease: 'elastic.out(1.1, 0.45)' }, 0.22);
    }, { threshold: 0.45 });
    io.observe(page);
  } else if (complete) {
    complete.style.transform = 'rotate(-8deg)';
  }

  return { debug: () => tf.items.map((it) => ({ x: Math.round(it.x), y: Math.round(it.y), moved: it.moved })) };
}
