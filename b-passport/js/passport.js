// Signature: a sticky passport page with 16 stamp slots. Scrolling the stop entries lands each
// stop's stamp into its slot (scale 1.6 -> 1 with overshoot, a quick twist, a square ink burst and a
// micro shake of the passport only). On phones the passport collapses to a sticky strip of the
// latest stamps that can expand into the full page.
import { esc, pad2, mqPhone } from './i18n.js';
import { stampArt, stampMeta } from './stamp.js';

export function passportPageHTML(C, lang, t, asset, { idPrefix = 'pp', showCounter = true, extraPage = '' } = {}) {
  return `
    <div class="pp__page">
      <header class="pp__head">
        <div class="pp__id">
          <img class="pp__logo" src="${asset(C.logo.dark)}" alt="" width="296" height="165">
          <p class="pp__title">${t.passport}</p>
        </div>
        ${showCounter ? counterHTML(t) : ''}
      </header>
      <ol class="pp__grid">
        ${C.stops.map((s) => `
          <li class="slot" data-n="${s.n}">
            <button class="slot__btn" type="button" aria-label="${esc(t.goTo(pad2(s.n), s.name[lang]))}">
              <span class="slot__no">${pad2(s.n)}</span>
              <span class="slot__name">${esc(s.name[lang])}</span>
            </button>
            <span class="slot__stamp${s.sticker ? ' is-sticker' : ''}" aria-hidden="true" data-id="${idPrefix}-${s.n}"></span>
          </li>`).join('')}
      </ol>
      <p class="pp__mrz" dir="ltr" aria-hidden="true">
        <span>P&lt;NTRAIL&lt;&lt;RIYADH&lt;QASSIM&lt;HAIL&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
        <span>1200KM&lt;&lt;16STOPS&lt;&lt;DIRIYAH&lt;TO&lt;JUBBAH&lt;&lt;&lt;&lt;&lt;&lt;</span>
      </p>
      ${extraPage}
    </div>`;
}

function reel() {
  return `<span class="reel"><span class="reel__strip">${'0123456789'.split('').map((d) => `<span>${d}</span>`).join('')}</span></span>`;
}

function counterHTML(t) {
  return `<p class="counter">
      <span class="counter__num" aria-hidden="true">${reel()}${reel()}</span>
      <span class="counter__of" aria-hidden="true">/ 16</span>
      <span class="counter__label" aria-hidden="true">${t.collected}</span>
      <span class="sr-only counter__sr">0 / 16 ${t.collected}</span>
    </p>`;
}

function setReels(counterEl, value, t) {
  if (!counterEl) return;
  const s = pad2(value);
  counterEl.querySelectorAll('.reel__strip').forEach((strip, i) => strip.style.setProperty('--d', s[i]));
  const sr = counterEl.querySelector('.counter__sr');
  if (sr) sr.textContent = `${s} / 16 ${t.collected}`;
}

export function mountPassport(root, ctx) {
  const { C, lang, t, reduced, rtl, asset } = ctx;
  const gsap = window.gsap;
  const stops = C.stops;
  const total = stops.length;
  const metas = stops.map(stampMeta);
  const phoneMQ = mqPhone();
  const regionOf = Object.fromEntries(C.regions.map((r) => [r.key, r]));

  const driveIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 2 4 18M13 2l3 16M10 3v2.5M10 8.5v3M10 14.5V17" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const flagIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 18V2.5M5 3h10l-2.5 3.5L15 10H5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  let lastRegion = null;
  const entriesHTML = stops.map((s, i) => {
    let region = '';
    if (s.region !== lastRegion) {
      lastRegion = s.region;
      const r = regionOf[s.region];
      region = `<div class="region" data-reveal><span class="region__name">${esc(r.name[lang])}</span><span class="region__rule" aria-hidden="true"></span><span class="region__count">${esc(r.count[lang])}</span></div>`;
    }
    const prev = stops[i - 1];
    const drive = s.drive
      ? `${driveIcon}<span><b>${esc(s.drive[lang])}</b> ${esc(t.from(prev.name[lang]))}</span>`
      : `${flagIcon}<span><b>${t.start}</b></span>`;
    return `${region}
      <article class="entry" id="stop-${pad2(s.n)}" data-n="${s.n}">
        <figure class="entry__ph">
          <img src="${asset(s.photo)}" alt="${esc(s.name[lang])}" loading="lazy" decoding="async">
          <span class="entry__tag" aria-hidden="true">${pad2(s.n)}</span>
        </figure>
        <div class="entry__body">
          <p class="entry__no">${t.stop(pad2(s.n), total)}</p>
          <h3 class="entry__name">${esc(s.name[lang])}</h3>
          <p class="entry__drive">${drive}</p>
          <p class="entry__desc">${esc(s.desc[lang])}</p>
        </div>
      </article>`;
  }).join('');

  root.innerHTML = `
    <div class="nt-wrap">
      <header class="stops__head" data-reveal>
        <p class="nt-eyebrow">${t.stopsEyebrow}</p>
        <h2 class="nt-h2">${t.stopsTitle}</h2>
        <p class="stops__hint">${t.stopsHint}</p>
      </header>
      <div class="stops__layout">
        <aside class="stops__pp" aria-label="${t.passport}">
          <div class="pp" data-expanded="false">
            <div class="pp__strip">
              <div class="pp__strip-id">
                <span class="pp__strip-label">${t.passportShort}</span>
                <span class="pp__strip-count" aria-hidden="true"><b>00</b> / 16</span>
              </div>
              <div class="pp__track-wrap" aria-hidden="true">
                <div class="pp__track">
                  ${stops.map((s) => `<span class="mini" data-n="${s.n}"><span class="mini__no">${pad2(s.n)}</span><span class="mini__stamp${s.sticker ? ' is-sticker' : ''}"></span></span>`).join('')}
                </div>
              </div>
              <button class="ctrl ctrl--cream pp__toggle" type="button" aria-expanded="false" aria-controls="pp-book" aria-label="${t.showPassport}">
                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4.5 7.5 10 13l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>
              </button>
            </div>
            <div class="pp__book" id="pp-book">
              <div class="pp__shake">${passportPageHTML(C, lang, t, asset)}</div>
            </div>
          </div>
        </aside>
        <div class="entries">${entriesHTML}</div>
      </div>
    </div>`;

  const pp = root.querySelector('.pp');
  const shakeBook = root.querySelector('.pp__shake');
  const strip = root.querySelector('.pp__strip');
  const track = root.querySelector('.pp__track');
  const trackWrap = root.querySelector('.pp__track-wrap');
  const toggle = root.querySelector('.pp__toggle');
  const counter = root.querySelector('.counter');
  const stripCount = root.querySelector('.pp__strip-count b');
  const entries = [...root.querySelectorAll('.entry')];
  const slots = [...root.querySelectorAll('.pp__grid .slot')];
  const slotStamps = slots.map((sl) => sl.querySelector('.slot__stamp'));
  const minis = [...root.querySelectorAll('.mini')];
  const miniStamps = minis.map((m) => m.querySelector('.mini__stamp'));

  // Fill stamp art (hidden until landed)
  stops.forEach((s, i) => {
    const art = stampArt(s, asset);
    slotStamps[i].innerHTML = art;
    miniStamps[i].innerHTML = art;
    if (gsap) gsap.set([slotStamps[i], miniStamps[i]], { autoAlpha: 0, rotation: metas[i].rot });
  });

  const isCompact = () => phoneMQ.matches && pp.dataset.expanded !== 'true';

  // ---- state
  let target = -1;
  const scheduled = new Map(); // n -> delayedCall
  const landed = new Set();

  function updateCount() {
    setReels(counter, landed.size, t);
    stripCount.textContent = pad2(landed.size);
  }

  function burst(host, color, size) {
    const n = 8;
    const frag = document.createDocumentFragment();
    const parts = [];
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      p.className = 'ink-dot';
      const s = Math.round(size * (0.035 + Math.random() * 0.03));
      p.style.width = p.style.height = `${Math.max(3, s)}px`;
      p.style.background = color;
      frag.appendChild(p);
      parts.push(p);
    }
    const ring = document.createElement('i');
    ring.className = 'ink-ring';
    ring.style.borderColor = color;
    frag.appendChild(ring);
    host.appendChild(frag);
    parts.forEach((p, i) => {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const d = size * (0.42 + Math.random() * 0.22);
      gsap.fromTo(p, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d, rotation: Math.random() * 180 - 90, scale: 0.4, opacity: 0,
        duration: 0.55 + Math.random() * 0.2, ease: 'power3.out', onComplete: () => p.remove(),
      });
    });
    gsap.fromTo(ring, { scale: 0.86, opacity: 0.55 }, { scale: 1.22, opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => ring.remove() });
  }

  function shake(el, amp) {
    gsap.fromTo(el, { x: 0, y: 0, rotation: 0 }, {
      keyframes: [
        { x: -amp, y: amp * 0.6, rotation: -0.25, duration: 0.05 },
        { x: amp * 0.8, y: -amp * 0.5, rotation: 0.2, duration: 0.05 },
        { x: -amp * 0.5, y: amp * 0.3, rotation: -0.1, duration: 0.05 },
        { x: amp * 0.25, y: 0, rotation: 0, duration: 0.05 },
        { x: 0, y: 0, rotation: 0, duration: 0.06 },
      ],
      ease: 'none',
      clearProps: 'transform',
    });
  }

  function land(n, animate) {
    const i = n - 1;
    const rot = metas[i].rot;
    const compact = isCompact();
    const animEl = compact ? miniStamps[i] : slotStamps[i];
    const other = compact ? slotStamps[i] : miniStamps[i];
    gsap.killTweensOf([animEl, other]);
    gsap.set(other, { autoAlpha: 1, scale: 1, rotation: rot, y: 0 });
    const impact = () => {
      landed.add(n);
      slots[i].classList.add('is-stamped');
      minis[i].classList.add('is-stamped');
      updateCount();
    };
    if (!animate) {
      gsap.set(animEl, { autoAlpha: 1, scale: 1, rotation: rot, y: 0 });
      impact();
      return;
    }
    if (reduced) {
      gsap.fromTo(animEl, { autoAlpha: 0, scale: 1, rotation: rot, y: 0 }, { autoAlpha: 1, duration: 0.25 });
      impact();
      return;
    }
    const host = compact ? minis[i] : slots[i];
    const size = host.offsetWidth;
    const tl = gsap.timeline();
    tl.fromTo(animEl, { autoAlpha: 0, scale: 1.6, rotation: rot + (rtl ? 18 : -18), y: -size * 0.08 },
      { autoAlpha: 1, duration: 0.1, ease: 'none' }, 0)
      .to(animEl, { scale: 0.93, rotation: rot + (rtl ? -2.5 : 2.5), y: 0, duration: 0.2, ease: 'power4.in' }, 0)
      .add(() => {
        impact();
        burst(host, metas[i].color, compact ? size * 1.5 : size);
        shake(compact ? strip : shakeBook, compact ? 2 : 3);
        host.classList.add('is-thud');
        setTimeout(() => host.classList.remove('is-thud'), 260);
      }, 0.2)
      .to(animEl, { scale: 1, rotation: rot, duration: 0.6, ease: 'elastic.out(1.15, 0.42)' }, 0.2);
  }

  function lift(n, animate) {
    const i = n - 1;
    landed.delete(n);
    slots[i].classList.remove('is-stamped');
    minis[i].classList.remove('is-stamped');
    const els = [slotStamps[i], miniStamps[i]];
    gsap.killTweensOf(els);
    if (!animate || reduced) gsap.set(els, { autoAlpha: 0 });
    else gsap.to(els, { autoAlpha: 0, scale: 1.12, y: -4, duration: 0.22, ease: 'power2.out' });
    updateCount();
  }

  function sync(k, animate) {
    if (k === target) return;
    target = k;
    // remove stamps beyond the reader
    for (let n = total; n > k; n--) {
      if (scheduled.has(n)) { scheduled.get(n).kill(); scheduled.delete(n); }
      if (landed.has(n)) lift(n, animate);
    }
    // land the ones reached, cascading if several were passed at once
    let q = 0;
    for (let n = 1; n <= k; n++) {
      if (landed.has(n) || scheduled.has(n)) continue;
      if (!animate) { land(n, false); continue; }
      const call = gsap.delayedCall(q * 0.13, () => { scheduled.delete(n); land(n, true); });
      scheduled.set(n, call);
      q++;
    }
    // highlight + strip position
    entries.forEach((e, i) => {
      e.classList.toggle('is-reached', i < k);
      e.classList.toggle('is-current', i === k - 1);
    });
    slots.forEach((s, i) => s.classList.toggle('is-current', i === k - 1));
    minis.forEach((m, i) => m.classList.toggle('is-current', i === k - 1));
    positionTrack(k);
  }

  function positionTrack(k) {
    const step = minis[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
    const wrapW = trackWrap.clientWidth;
    const shown = Math.max(1, k);
    const offset = Math.max(0, Math.min(shown * step - (step - minis[0].offsetWidth) - wrapW, total * step - wrapW));
    track.style.transform = `translate3d(${rtl ? offset : -offset}px, 0, 0)`;
  }

  function compute() {
    const line = innerHeight * 0.62;
    let k = 0;
    for (const e of entries) {
      if (e.getBoundingClientRect().top < line) k++;
      else break;
    }
    return k;
  }

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; sync(compute(), true); });
  };

  // Expand / collapse (phones)
  function setExpanded(open) {
    pp.dataset.expanded = String(open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? t.hidePassport : t.showPassport);
    if (open && !reduced) {
      gsap.fromTo(root.querySelector('.pp__book'), { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.45, ease: 'power3.out', clearProps: 'clipPath' });
    }
  }
  toggle.addEventListener('click', () => setExpanded(pp.dataset.expanded !== 'true'));
  trackWrap.addEventListener('click', () => setExpanded(true));
  phoneMQ.addEventListener('change', () => { setExpanded(false); positionTrack(Math.max(0, target)); });

  // Slot -> jump to that stop
  slots.forEach((sl, i) => {
    sl.querySelector('.slot__btn').addEventListener('click', () => {
      if (phoneMQ.matches) setExpanded(false);
      const e = entries[i];
      const y = e.getBoundingClientRect().top + scrollY - innerHeight * 0.62 + 24;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  // initial state without animation, then live
  sync(compute(), false);
  updateCount();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  return { debug: () => ({ target, landed: [...landed].sort((a, b) => a - b), compact: isCompact() }) };
}

export { setReels, counterHTML };
