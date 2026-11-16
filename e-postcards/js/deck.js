// Signature: the 16 stops as a deck of postcards.
// Desktop: pinned "table"; scrolling deals cards from a pile, click flips, drag tosses.
// Phone: swipeable stack. Reduced motion: every postcard laid out, front and back.
import {
  t, asset, esc, pad2, clamp, h, L, isRTL, dirSign, reduced,
  postmarkSVG, stampHTML, stampIcon, fitRings, REGION_COLOR, REGION_ART, dateLine
} from './util.js';

/* ---------- data ---------- */

function buildItems(data) {
  const out = [];
  let prev = null;
  data.stops.forEach((s, i) => {
    if (s.region !== prev) {
      out.push({ type: 'region', region: data.regions.find((r) => r.key === s.region) });
      prev = s.region;
    }
    out.push({ type: 'stop', stop: s, i, region: data.regions.find((r) => r.key === s.region) });
  });
  return out;
}

/* ---------- card markup ---------- */

const total = (data) => pad2(data.stops.length);
const stopLabel = (n, data) => `${L.stop} ${pad2(n)} / ${total(data)}`;

function frontHTML(it, data) {
  const s = it.stop;
  const drive = s.drive
    ? `<span class="pc__drivelabel">${L.driveFrom}</span><strong>${esc(t(s.drive))}</strong>`
    : `<strong>${L.start}</strong>`;
  return `<div class="pc__face pc__front">
    <img class="pc__photo" src="${asset(s.photo)}" alt="" decoding="async" draggable="false">
    <span class="pc__scrim" aria-hidden="true"></span>
    <span class="pc__num">${stopLabel(s.n, data)}</span>
    <span class="pc__flipicon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg></span>
    <div class="pc__cap">
      <h3 class="pc__name">${esc(t(s.name))}</h3>
      <p class="pc__drive">${drive}</p>
    </div>
  </div>`;
}

function backHTML(it, data) {
  const s = it.stop;
  const name = t(s.name);
  const stamp = s.sticker
    ? `<img class="pb__sticker" src="${asset(s.sticker)}" alt="" decoding="async" draggable="false">`
    : stampHTML({ color: REGION_COLOR[s.region], art: stampIcon(it.i), name, num: pad2(s.n) });
  const ringName = isRTL ? name : name.toUpperCase();
  const ring = `${ringName} • ${L.trail.toUpperCase()}`;
  return `<div class="pc__face pc__back">
    <p class="pb__head">${L.postcard}</p>
    <div class="pb__text">
      <p class="pb__region">${esc(t(it.region.name))}</p>
      <p class="pb__desc">${esc(t(s.desc))}</p>
    </div>
    <p class="pb__sign">${stopLabel(s.n, data)}${s.drive ? ` <span aria-hidden="true">·</span> ${esc(t(s.drive))}` : ''}</p>
    <span class="pb__rule" aria-hidden="true"></span>
    <div class="pb__stampzone" aria-hidden="true">
      <span class="pb__stamp">${stamp}</span>
      ${postmarkSVG({ ring, mid: pad2(s.n), sub: dateLine(), cls: 'pb__pm' })}
    </div>
    <div class="pb__lines">
      <p class="pb__line"><span class="pb__to">${L.to}</span> ${L.you}</p>
      <p class="pb__line">${L.trail}</p>
      <p class="pb__line">${esc(name)}, ${esc(t(it.region.name))}</p>
    </div>
  </div>`;
}

function regionHTML(it) {
  const r = it.region;
  return `<div class="pc__face pc__front pc__region" style="--tone:${REGION_COLOR[r.key]}">
    ${stampHTML({ color: 'var(--paper)', art: REGION_ART[r.key], cls: 'pc__regionstamp' })}
    <div class="pc__regiontext">
      <p class="pc__welcome">${L.welcome}</p>
      <h3 class="pc__regionname">${esc(t(r.name))}</h3>
      <p class="pc__regioncount">${esc(t(r.count))}</p>
    </div>
  </div>`;
}

function cardHTML(it, i, data) {
  if (it.type === 'region') {
    return `<div class="pc pc--region" data-i="${i}">
      <span class="pc__shadow" aria-hidden="true"></span>
      <div class="pc__inner">${regionHTML(it)}</div>
    </div>`;
  }
  return `<div class="pc pc--stop" data-i="${i}" role="button" tabindex="-1" aria-pressed="false">
    <span class="pc__shadow" aria-hidden="true"></span>
    <div class="pc__inner">${frontHTML(it, data)}${backHTML(it, data)}</div>
  </div>`;
}

const deckTitle = (data) => {
  const label = t(data.intro.stats[1].label);
  return `${data.stops.length} ${isRTL ? label : label.charAt(0).toLowerCase() + label.slice(1)}`;
};

function makeCards(host, items, data) {
  return items.map((it, i) => {
    const el = h(cardHTML(it, i, data));
    host.append(el);
    return {
      el,
      it,
      i,
      inner: el.querySelector('.pc__inner'),
      shadow: el.querySelector('.pc__shadow'),
      front: el.querySelector('.pc__front'),
      back: el.querySelector('.pc__back'),
      flipped: false
    };
  });
}

/* ---------- shared flip ---------- */

function setFlip(c, on, instant = false) {
  const gsap = window.gsap;
  if (c.it.type !== 'stop') {
    if (!instant) gsap.fromTo(c.inner, { rotation: 0 }, { keyframes: [{ rotation: -2.5 }, { rotation: 2 }, { rotation: -1 }, { rotation: 0 }], duration: 0.45, ease: 'none' });
    return;
  }
  if (c.flipped === on) return;
  c.flipped = on;
  c.el.setAttribute('aria-pressed', String(on));
  c.front.setAttribute('aria-hidden', String(on));
  c.back.setAttribute('aria-hidden', String(!on));
  c.el.classList.toggle('is-flipped', on);
  gsap.killTweensOf(c.inner);
  gsap.killTweensOf(c.shadow);
  if (instant) {
    gsap.set(c.inner, { rotationY: on ? 180 * dirSign : 0, z: 0 });
    gsap.set(c.shadow, { scaleX: 1 });
    return;
  }
  gsap.to(c.inner, { rotationY: on ? 180 * dirSign : 0, duration: 0.9, ease: 'power3.inOut' });
  gsap.to(c.inner, { z: 70, duration: 0.45, yoyo: true, repeat: 1, ease: 'power2.out' });
  gsap.timeline()
    .to(c.shadow, { scaleX: 0.12, opacity: 0.6, duration: 0.45, ease: 'power2.in' })
    .to(c.shadow, { scaleX: 1, opacity: 1, duration: 0.45, ease: 'power2.out' });
}

/* ---------- mount ---------- */

export function mountDeck(root, data) {
  const items = buildItems(data);
  const mq = matchMedia('(min-width: 900px)');
  let ctrl = null;
  const start = () => {
    ctrl?.destroy();
    root.className = 'deck';
    root.innerHTML = '';
    if (reduced) ctrl = staticDeck(root, items, data, !mq.matches);
    else ctrl = mq.matches ? tableDeck(root, items, data) : swipeDeck(root, items, data);
    document.fonts.ready.then(() => fitRings(root));
  };
  start();
  mq.addEventListener('change', start);
  return {
    refresh: () => ctrl?.refresh?.(),
    get ctrl() { return ctrl; }
  };
}

/* ======================================================================
   Desktop: the table
   ====================================================================== */

function tableDeck(root, items, data) {
  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  const N = items.length;
  const nStops = data.stops.length;
  root.classList.add('deck--table');

  const regions = data.regions
    .map(
      (r) => `<li class="tb__region" data-region="${r.key}" style="--tone:${REGION_COLOR[r.key]}">
        <span class="tb__swatch" aria-hidden="true"></span>
        <span class="tb__rname">${esc(t(r.name))}</span>
        <span class="tb__rcount">${esc(t(r.count))}</span>
      </li>`
    )
    .join('');
  const ticks = data.stops.map(() => '<li></li>').join('');
  const pile = [0, 1, 2]
    .map(() => `<span class="tb__pilecard"><span class="tb__pilehead">${L.postcard}</span><span class="tb__pilerule"></span><span class="tb__pilestamp"></span></span>`)
    .join('');

  root.innerHTML = `
    <div class="tb">
      <header class="tb__head nt-wrap">
        <h2 class="nt-h2 tb__title" id="deck-title">${esc(deckTitle(data))}</h2>
        <p class="tb__count"><span class="tb__countlabel">${L.stop}</span><span class="tb__num">01</span><span class="tb__total">/ ${total(data)}</span></p>
      </header>
      <div class="tb__table">
        <div class="tb__frame nt-wrap">
          <ol class="tb__regions" aria-label="${L.regionsLabel}">${regions}</ol>
          <div class="tb__pile" aria-hidden="true">
            <span class="tb__pilestack">${pile}</span>
            <p class="tb__left"><strong class="tb__leftnum">${nStops}</strong> ${L.left}</p>
          </div>
        </div>
        <div class="tb__anchor"></div>
      </div>
      <footer class="tb__foot nt-wrap">
        <ol class="tb__ticks" aria-hidden="true">${ticks}</ol>
        <p class="tb__hint">${L.flipHint}</p>
        <button class="nt-btn tb__tidy" type="button" disabled>${L.tidy}</button>
      </footer>
      <p class="sr-only" aria-live="polite"></p>
    </div>`;

  const stage = root.querySelector('.tb');
  const table = root.querySelector('.tb__table');
  const anchor = root.querySelector('.tb__anchor');
  const pileEl = root.querySelector('.tb__pilestack');
  const numEl = root.querySelector('.tb__num');
  const leftNum = root.querySelector('.tb__leftnum');
  const pileWrap = root.querySelector('.tb__pile');
  const tidyBtn = root.querySelector('.tb__tidy');
  const live = root.querySelector('[aria-live]');
  const tickEls = [...root.querySelectorAll('.tb__ticks li')];
  const regionEls = [...root.querySelectorAll('.tb__region')];

  const cards = makeCards(anchor, items, data);
  cards.forEach((c) => {
    c.rest = { x: ((c.i * 53) % 9 - 4) * 6, y: ((c.i * 29) % 7 - 3) * 5, r: (((c.i * 37) % 11) - 5) * 0.75 };
    c.pose = { ...c.rest };
    c.dealt = false;
    c.visible = false;
    c.scattered = false;
  });

  let pileVec = { x: 0, y: 0 };
  let z = 10;
  let dealtN = 0;
  let entered = false;
  const pilePose = () => ({ x: pileVec.x, y: pileVec.y, rotation: 12 * dirSign, scale: 0.46 });

  const measure = () => {
    const a = anchor.getBoundingClientRect();
    const p = pileEl.getBoundingClientRect();
    pileVec = { x: p.left + p.width / 2 - (a.left + a.width / 2), y: p.top + p.height / 2 - (a.top + a.height / 2) };
    cards.forEach((c) => {
      if (!c.dealt) gsap.set(c.el, { ...pilePose(), autoAlpha: 0 });
    });
  };

  const thud = () => gsap.fromTo(pileEl, { y: 0 }, { keyframes: [{ y: 2 }, { y: -1 }, { y: 0 }], duration: 0.25, ease: 'none' });

  function deal(c, delay) {
    c.dealt = true;
    c.scattered = false;
    c.pose = { ...c.rest };
    gsap.killTweensOf(c.el);
    if (!c.visible) gsap.set(c.el, { ...pilePose(), autoAlpha: 1 });
    c.visible = true;
    c.el.style.zIndex = ++z;
    c.el.classList.add('is-lifted');
    gsap.timeline({ delay })
      .to(c.el, { x: c.rest.x, y: c.rest.y, rotation: c.rest.r, scale: 1.05, duration: 0.62, ease: 'power3.out' })
      .to(c.el, { scale: 1, duration: 0.16, ease: 'power2.in', onComplete: () => { c.el.classList.remove('is-lifted'); thud(); } });
  }

  function undeal(c, delay) {
    c.dealt = false;
    c.scattered = false;
    gsap.killTweensOf(c.el);
    if (c.flipped) setFlip(c, false);
    c.el.classList.add('is-lifted');
    c.el.style.zIndex = ++z;
    gsap.to(c.el, {
      ...pilePose(),
      delay,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set(c.el, { autoAlpha: 0 });
        c.visible = false;
        c.el.classList.remove('is-lifted');
      }
    });
  }

  function updateUI() {
    const cur = cards[dealtN - 1];
    cards.forEach((c) => c.el.getAttribute('role') && c.el.setAttribute('tabindex', c === cur ? '0' : '-1'));
    const dealtStops = cards.filter((c) => c.dealt && c.it.type === 'stop').length;
    numEl.textContent = pad2(Math.max(1, dealtStops));
    leftNum.textContent = String(nStops - dealtStops);
    pileWrap.classList.toggle('is-empty', dealtStops >= nStops);
    tickEls.forEach((li, i) => li.classList.toggle('is-on', i < dealtStops));
    const regionKey = cur ? (cur.it.type === 'stop' ? cur.it.stop.region : cur.it.region.key) : data.regions[0].key;
    regionEls.forEach((li) => li.toggleAttribute('aria-current', li.dataset.region === regionKey));
    tidyBtn.disabled = !cards.some((c) => c.dealt && c.scattered);
    if (cur) live.textContent = cur.it.type === 'stop' ? `${stopLabel(cur.it.stop.n, data)}: ${t(cur.it.stop.name)}` : `${L.welcome} ${t(cur.it.region.name)}`;
  }

  function sync(target) {
    target = clamp(target, 0, N);
    if (target === dealtN) return;
    if (target > dealtN) {
      let k = 0;
      for (let i = dealtN; i < target; i++) deal(cards[i], k++ * 0.09);
    } else {
      let k = 0;
      for (let i = dealtN - 1; i >= target; i--) undeal(cards[i], k++ * 0.06);
    }
    dealtN = target;
    updateUI();
  }

  /* ----- scroll: pinned scene, one card per step ----- */
  const stepPx = () => Math.round(window.innerHeight * 0.5);
  const st = ST.create({
    trigger: stage,
    start: 'top top+=64',
    end: () => '+=' + stepPx() * (N - 1),
    pin: true,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onRefresh: measure,
    onUpdate: (self) => {
      if (entered) sync(1 + Math.round(self.progress * (N - 1)));
    }
  });
  const enter = ST.create({
    trigger: stage,
    start: 'top 70%',
    onEnter: () => { entered = true; sync(Math.max(1, 1 + Math.round(st.progress * (N - 1)))); },
    onLeaveBack: () => { entered = false; sync(0); }
  });
  measure();
  if (enter.progress > 0 || window.scrollY > enter.start) {
    entered = true;
    sync(1 + Math.round(st.progress * (N - 1)));
  }

  /* ----- pointer: click to flip, drag to toss ----- */
  let drag = null;
  const bounds = () => {
    const tr = table.getBoundingClientRect();
    const a = anchor.getBoundingClientRect();
    const cx = a.left + a.width / 2;
    const cy = a.top + a.height / 2;
    return {
      minX: tr.left - cx + a.width * 0.12,
      maxX: tr.right - cx - a.width * 0.12,
      minY: tr.top - cy + a.height * 0.5 + 8,
      maxY: tr.bottom - cy - a.height * 0.5 - 8
    };
  };

  const onDown = (e) => {
    const el = e.target.closest('.pc');
    if (!el || e.button !== 0) return;
    const c = cards[+el.dataset.i];
    if (!c.dealt) return;
    gsap.killTweensOf(c.el);
    drag = {
      c,
      id: e.pointerId,
      sx: e.clientX,
      sy: e.clientY,
      x0: gsap.getProperty(c.el, 'x'),
      y0: gsap.getProperty(c.el, 'y'),
      r0: gsap.getProperty(c.el, 'rotation'),
      moved: false,
      samples: [{ t: performance.now(), x: e.clientX, y: e.clientY }]
    };
    try { el.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
  };

  const velocity = (s) => {
    const now = performance.now();
    const recent = s.filter((p) => now - p.t < 120);
    if (recent.length < 2) return { x: 0, y: 0 };
    const a = recent[0];
    const b = recent[recent.length - 1];
    const dt = Math.max(1, b.t - a.t);
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
  };

  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      drag.moved = true;
      drag.c.el.style.zIndex = ++z;
      drag.c.el.classList.add('is-lifted', 'is-dragging');
      gsap.to(drag.c.el, { scale: 1.04, duration: 0.2, ease: 'power2.out' });
    }
    drag.samples.push({ t: performance.now(), x: e.clientX, y: e.clientY });
    if (drag.samples.length > 8) drag.samples.shift();
    const v = velocity(drag.samples);
    gsap.set(drag.c.el, { x: drag.x0 + dx, y: drag.y0 + dy });
    gsap.to(drag.c.el, { rotation: drag.r0 + clamp(v.x * 9, -16, 16), duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  };

  const settle = (c) => c.el.classList.remove('is-lifted', 'is-dragging');

  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    const c = d.c;
    if (!d.moved) {
      if (e.type === 'pointerup') setFlip(c, !c.flipped);
      return;
    }
    const v = velocity(d.samples);
    const speed = Math.hypot(v.x, v.y);
    const x = gsap.getProperty(c.el, 'x');
    const y = gsap.getProperty(c.el, 'y');
    const dist = Math.hypot(x - c.pose.x, y - c.pose.y);
    if (e.type === 'pointerup' && (speed > 0.55 || dist > 200)) {
      // toss: glide with inertia, keep it on the table
      const b = bounds();
      const glide = 300;
      const tx = clamp(x + v.x * glide, b.minX, b.maxX);
      const ty = clamp(y + v.y * glide, b.minY, b.maxY);
      const hitEdge = tx !== x + v.x * glide || ty !== y + v.y * glide;
      const spin = clamp(v.x * 22, -32, 32);
      c.pose = { x: tx, y: ty, r: gsap.getProperty(c.el, 'rotation') + spin };
      c.scattered = true;
      gsap.timeline({ onComplete: () => settle(c) })
        .to(c.el, { x: tx, y: ty, rotation: c.pose.r, duration: 0.7 + Math.min(0.5, speed * 0.25), ease: hitEdge ? 'back.out(1.6)' : 'power3.out' })
        .to(c.el, { scale: 1, duration: 0.16, ease: 'power2.in' }, '-=0.2');
    } else {
      gsap.to(c.el, { x: c.pose.x, y: c.pose.y, rotation: c.pose.r, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.55)', onComplete: () => settle(c) });
    }
    updateUI();
  };

  const onKey = (e) => {
    const el = e.target.closest('.pc');
    if (!el || (e.key !== 'Enter' && e.key !== ' ')) return;
    e.preventDefault();
    const c = cards[+el.dataset.i];
    setFlip(c, !c.flipped);
  };

  const tidy = () => {
    let k = 0;
    cards.forEach((c) => {
      if (!c.dealt) return;
      c.scattered = false;
      c.pose = { ...c.rest };
      c.el.style.zIndex = 10 + c.i;
      gsap.to(c.el, { x: c.rest.x, y: c.rest.y, rotation: c.rest.r, scale: 1, duration: 0.6, delay: k++ * 0.03, ease: 'power3.inOut' });
    });
    z = 10 + N;
    updateUI();
  };

  anchor.addEventListener('pointerdown', onDown);
  anchor.addEventListener('pointermove', onMove);
  anchor.addEventListener('pointerup', onUp);
  anchor.addEventListener('pointercancel', onUp);
  anchor.addEventListener('keydown', onKey);
  tidyBtn.addEventListener('click', tidy);

  return {
    refresh: () => ST.refresh(),
    destroy() {
      st.kill();
      enter.kill();
      cards.forEach((c) => gsap.killTweensOf([c.el, c.inner, c.shadow]));
    },
    // exposed for verification
    _state: () => ({ dealtN, flipped: cards.filter((c) => c.flipped).length, scattered: cards.filter((c) => c.scattered).length }),
    _sync: sync,
    _flip: (i) => setFlip(cards[i], !cards[i].flipped)
  };
}

/* ======================================================================
   Phone: swipeable stack
   ====================================================================== */

function swipeDeck(root, items, data) {
  const gsap = window.gsap;
  const N = items.length;
  root.classList.add('deck--swipe', 'deck--portrait');
  const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>`;
  root.innerHTML = `
    <div class="nt-wrap sw">
      <header class="sw__head">
        <h2 class="nt-h2" id="deck-title">${esc(deckTitle(data))}</h2>
        <p class="sw__hint">${L.tapHint}</p>
      </header>
      <div class="sw__stage" tabindex="0" aria-roledescription="carousel" aria-label="${esc(deckTitle(data))}"></div>
      <div class="sw__bar">
        <button class="sw__btn sw__prev" type="button" aria-label="${L.prev}">${arrow}</button>
        <div class="sw__meta">
          <p class="sw__count" aria-live="polite"></p>
          <span class="sw__progress" aria-hidden="true"><i></i></span>
        </div>
        <button class="sw__btn sw__next" type="button" aria-label="${L.next}">${arrow}</button>
      </div>
    </div>`;
  const stage = root.querySelector('.sw__stage');
  const countEl = root.querySelector('.sw__count');
  const bar = root.querySelector('.sw__progress i');
  const prevBtn = root.querySelector('.sw__prev');
  const nextBtn = root.querySelector('.sw__next');
  const cards = makeCards(stage, items, data);
  const exitSign = isRTL ? 1 : -1; // where "next" cards leave to (LTR: left)
  let idx = 0;
  let W = stage.clientWidth;

  const pose = (o) => {
    if (o < 0) return { x: exitSign * (W + 48), y: 0, rotation: exitSign * 16, scale: 1 };
    if (o === 0) return { x: 0, y: 0, rotation: 0, scale: 1 };
    if (o === 1) return { x: 0, y: 14, rotation: 2.5 * dirSign, scale: 0.95 };
    if (o === 2) return { x: 0, y: 28, rotation: -2 * dirSign, scale: 0.9 };
    return { x: 0, y: 28, rotation: 0, scale: 0.9 };
  };

  function layout(dur = 0.5, ease = 'power3.out') {
    cards.forEach((c, i) => {
      const o = i - idx;
      c.el.style.zIndex = o < 0 ? 60 + i : 50 - o;
      c.el.toggleAttribute('inert', o !== 0);
      const p = pose(o);
      const show = o >= 0 && o <= 2;
      gsap.killTweensOf(c.el);
      if (show) gsap.set(c.el, { autoAlpha: 1 });
      gsap.to(c.el, {
        ...p,
        duration: dur,
        ease,
        onComplete: () => {
          if (!show) gsap.set(c.el, { autoAlpha: 0 });
          if (o !== 0 && c.flipped) setFlip(c, false, true);
        }
      });
    });
    const cur = cards[idx];
    const stopsBefore = cards.slice(0, idx + 1).filter((c) => c.it.type === 'stop').length;
    countEl.textContent = cur.it.type === 'stop' ? stopLabel(cur.it.stop.n, data) : `${L.welcome} ${t(cur.it.region.name)}`;
    gsap.to(bar, { scaleX: Math.max(0.02, stopsBefore / data.stops.length), duration: dur, ease: 'power2.out' });
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx === N - 1;
  }

  cards.forEach((c, i) => gsap.set(c.el, { ...pose(i), transformOrigin: '50% 100%', autoAlpha: i <= 2 ? 1 : 0 }));
  layout(0);

  const go = (d) => {
    const n = clamp(idx + d, 0, N - 1);
    if (n === idx) return;
    idx = n;
    layout(0.55);
  };

  let drag = null;
  const onDown = (e) => {
    if (e.button !== 0) return;
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, axis: null, dx: 0, samples: [{ t: performance.now(), x: e.clientX }] };
  };
  const onMove = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.axis) {
      if (Math.hypot(dx, dy) < 8) return;
      drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (drag.axis === 'y') { drag = null; return; }
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }
    drag.dx = dx;
    drag.samples.push({ t: performance.now(), x: e.clientX });
    if (drag.samples.length > 6) drag.samples.shift();
    const top = cards[idx];
    const prev = cards[idx - 1];
    const towardNext = dx * exitSign > 0;
    if (towardNext && idx < N - 1) {
      gsap.set(top.el, { x: dx, rotation: dx * 0.05, y: Math.abs(dx) * 0.04 });
      const k = clamp(Math.abs(dx) / (W * 0.5), 0, 1);
      const p1 = pose(1);
      gsap.set(cards[idx + 1].el, { y: p1.y * (1 - k), scale: p1.scale + (1 - p1.scale) * k, rotation: p1.rotation * (1 - k) });
      if (prev) gsap.set(prev.el, pose(-1));
    } else if (!towardNext && idx > 0) {
      gsap.set(top.el, pose(0));
      const p = pose(-1);
      gsap.set(prev.el, { autoAlpha: 1, x: p.x + dx, rotation: p.rotation * (1 - clamp(Math.abs(dx) / W, 0, 1)) });
    } else {
      gsap.set(top.el, { x: dx * 0.25, rotation: dx * 0.012 });
    }
  };
  const onUp = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    if (!d.axis) {
      if (e.type === 'pointerup') setFlip(cards[idx], !cards[idx].flipped);
      return;
    }
    const s = d.samples;
    const vx = s.length > 1 ? (s[s.length - 1].x - s[0].x) / Math.max(1, s[s.length - 1].t - s[0].t) : 0;
    const commit = e.type === 'pointerup' && (Math.abs(d.dx) > W * 0.28 || Math.abs(vx) > 0.5);
    const towardNext = (Math.abs(vx) > 0.5 ? vx : d.dx) * exitSign > 0;
    if (commit && towardNext && idx < N - 1) go(1);
    else if (commit && !towardNext && idx > 0) go(-1);
    else layout(0.6, 'back.out(1.6)');
  };
  const onKey = (e) => {
    const nextKey = isRTL ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRTL ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === nextKey) { e.preventDefault(); go(1); }
    else if (e.key === prevKey) { e.preventDefault(); go(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlip(cards[idx], !cards[idx].flipped); }
  };
  const onResize = () => { W = stage.clientWidth; layout(0); };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onUp);
  stage.addEventListener('keydown', onKey);
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  window.addEventListener('resize', onResize);

  return {
    destroy() {
      window.removeEventListener('resize', onResize);
      cards.forEach((c) => gsap.killTweensOf([c.el, c.inner, c.shadow]));
    },
    _state: () => ({ idx, flipped: cards[idx].flipped }),
    _go: go,
    _flip: () => setFlip(cards[idx], !cards[idx].flipped)
  };
}

/* ======================================================================
   Reduced motion: every postcard visible, front and back side by side
   ====================================================================== */

function staticDeck(root, items, data, portrait) {
  root.classList.add('deck--static');
  if (portrait) root.classList.add('deck--portrait');
  const rows = items
    .map((it) =>
      it.type === 'region'
        ? `<li class="st__region"><div class="st__card st__card--region">${regionHTML(it)}</div></li>`
        : `<li class="st__row">
            <div class="st__card">${frontHTML(it, data)}</div>
            <div class="st__card">${backHTML(it, data)}</div>
          </li>`
    )
    .join('');
  root.innerHTML = `
    <div class="nt-wrap st">
      <h2 class="nt-h2" id="deck-title">${esc(deckTitle(data))}</h2>
      <ol class="st__list" role="list">${rows}</ol>
    </div>`;
  return { destroy() {} };
}
