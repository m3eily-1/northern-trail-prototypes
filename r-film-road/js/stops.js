// Stops: a horizontal reel of 16 tall cards with region dividers (direction C, without the
// stickers and the custom cursor). On desktop the section pins and vertical scroll drives the
// strip; dragging (with inertia) and horizontal wheel also drive it by scrolling the page, so there
// is one source of truth. Phones and reduced motion get a native horizontal swipe strip with snap.
//
// The road underneath: a car drives a dotted road (direction N's path) from the first stop to the
// last. The focus point slides across the screen with the car, so the card above the car is always
// the stop the car has reached. The card in focus grows slightly.
import { pad2 } from './labels.js?v=27';
import { initRoad } from './road.js?v=27';

const CLOCK =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M8 4.5V8l2.5 1.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
const FLAG =
  '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 14V2.5M4 3h8l-1.75 3L12 9H4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

export function initStops(root, ctx) {
  const { gsap, ScrollTrigger, data, t, L, rtl, asset, reduced, isPhone } = ctx;
  const stage = root.querySelector('.ntc-stops__stage');
  const viewport = root.querySelector('.ntc-stops__viewport');
  const track = root.querySelector('.ntc-stops__track');
  const counter = root.querySelector('.ntc-stops__counter');
  const road = initRoad(root.querySelector('.r-road'), ctx);
  const total = data.stops.length;

  root.querySelector('.ntc-stops__eyebrow').textContent = L.stopsEyebrow;
  root.querySelector('.ntc-stops__hint span').textContent = isPhone ? L.hintTouch : L.hintDrag;

  // ---- build strip
  const cards = [];
  data.regions.forEach((region, ri) => {
    const div = document.createElement('li');
    div.className = 'ntc-divider';
    div.dataset.region = region.key;
    // Each region opens with a road sign: Arabic over English like Saudi guide signs, the stop
    // count, and an arrow pointing the way the trail runs. Two posts carry it down to the road.
    div.innerHTML = `
      <div class="r-sign">
        <span class="r-sign__k">${L.region} ${pad2(ri + 1)}</span>
        <strong class="r-sign__name" lang="ar" dir="rtl">${region.name.ar}</strong>
        <strong class="r-sign__name r-sign__name--en" lang="en" dir="ltr">${region.name.en}</strong>
        <span class="r-sign__meta"><span>${t(region.count)}</span><svg class="r-sign__arrow nt-flip" viewBox="0 0 40 24" aria-hidden="true"><path d="M2 12h30M24 3l10 9-10 9" fill="none" stroke="currentColor" stroke-width="3.5"/></svg></span>
      </div>
      <span class="r-sign__posts" aria-hidden="true"><i></i><i></i></span>`;
    track.appendChild(div);

    data.stops
      .filter((s) => s.region === region.key)
      .forEach((s) => {
        const li = document.createElement('li');
        li.className = 'ntc-card';
        li.dataset.region = region.key;
        const drive = s.drive ? t(s.drive) : L.start;
        const driveTitle = s.drive ? `${t(s.drive)} ${L.fromPrev}` : L.start;
        li.innerHTML = `
          <div class="ntc-card__inner">
            <a class="ntc-card__photo" href="stop.html?stop=${s.key}&amp;lang=${ctx.lang}" draggable="false" aria-label="${t(s.name)}: ${L.explore}">
              <img src="${asset(s.photo)}" alt="" decoding="async" draggable="false">
              <span class="ntc-card__here" aria-hidden="true"><i></i>${L.here}</span>
              <span class="ntc-card__desc" aria-hidden="true">
                <p>${t(s.desc)}</p>
                <span class="ntc-card__cta">${L.explore}<svg class="nt-flip" viewBox="0 0 20 20"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></span>
              </span>
              <span class="ntc-card__go" aria-hidden="true"><svg class="nt-flip" viewBox="0 0 20 20"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg></span>
            </a>
            <div class="ntc-card__meta">
              <span class="ntc-card__num">${pad2(s.n)}</span>
              <span class="ntc-card__drive" title="${driveTitle}">${s.drive ? CLOCK : FLAG}<span>${drive}</span><span class="ntc-sr">${s.drive ? L.fromPrev : ''}</span></span>
            </div>
            <h3 class="ntc-card__name">${t(s.name)}</h3>
          </div>`;
        track.appendChild(li);
        cards.push({ el: li, inner: li.querySelector('.ntc-card__inner'), n: s.n, name: t(s.name), region: region.key });
      });
  });

  // ---- region filter: show one region's stops (the road then shows just those stops)
  let vis = cards;
  let region = 'all';
  const chips = document.createElement('div');
  chips.className = 'ntc-stops__filters';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', L.filterRegion);
  chips.innerHTML = [['all', L.all, cards.length], ...data.regions.map((r) => [r.key, t(r.name), cards.filter((c) => c.region === r.key).length])]
    .map(([k, label, n]) => `<button class="bk-chip" type="button" data-k="${k}" aria-pressed="${k === 'all'}"><span>${label}</span><b>${n}</b></button>`)
    .join('');
  root.querySelector('.ntc-stops__head').appendChild(chips);
  let onFilter = () => {};
  chips.addEventListener('click', (e) => {
    const c = e.target.closest('.bk-chip');
    if (!c || c.dataset.k === region) return;
    region = c.dataset.k;
    chips.querySelectorAll('.bk-chip').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    track.querySelectorAll('li').forEach((li) => (li.hidden = region !== 'all' && li.dataset.region !== region));
    vis = cards.filter((x) => !x.el.hidden);
    root.classList.toggle('is-filtered', region !== 'all');
    onFilter();
  });

  // the whole card opens the stop's own page; a drag that ends on a card does not count as a click
  let suppressClick = false;
  cards.forEach(({ el }) => {
    const link = el.querySelector('.ntc-card__photo');
    link.addEventListener('click', (e) => {
      if (suppressClick) e.preventDefault();
    });
    el.addEventListener('click', (e) => {
      if (suppressClick || e.target.closest('a')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) window.open(link.href, '_blank');
      else location.href = link.href;
    });
  });

  let current = 0;
  function updateCounter(idx) {
    if (idx === current) return;
    current = idx;
    counter.textContent = L.stopOf(pad2(idx), total);
  }
  updateCounter(1);

  // the stop the car is at: framed, labelled, the rest of the reel steps back
  let activeEl = null;
  function setActive(c) {
    if (!c || c.el === activeEl) return;
    activeEl?.classList.remove('is-active');
    activeEl = c.el;
    activeEl.classList.add('is-active');
  }
  root.classList.add('has-active');

  let nearest = 0;
  let still = false; // the visible stops fit without scrolling: the car parks under the chosen one
  let chosen = 0;
  // Focus point: slides with the car from the road's start edge (p = 0) to its end edge (p = 1).
  const focusX = (p) => {
    const r = road.box();
    return rtl ? r.right - p * r.width : r.left + p * r.width;
  };

  // nearest card to the focus point; optional scale emphasis
  let measure = function (p, scale) {
    if (still) {
      updateCounter(vis[chosen].n);
      setActive(vis[chosen]);
      nearest = chosen;
      road.set(frNow[chosen], chosen);
      vis.forEach((c, i) => (c.inner.style.transform = scale && i === chosen ? 'scale(1.05)' : ''));
      return;
    }
    const fx = focusX(p);
    let best = 0;
    let bestD = Infinity;
    vis.forEach((c, i) => {
      const r = c.el.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - fx);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
      if (scale) {
        const k = Math.max(0, 1 - d / (r.width * 1.4));
        const s = 1 + 0.05 * k * k * (3 - 2 * k);
        c.inner.style.transform = `scale(${s.toFixed(4)})`;
      }
    });
    updateCounter(vis[best].n);
    setActive(vis[best]);
    nearest = best;
    road.set(p, best);
  }

  // Progress at which each card sits right above the car (shift = how far the strip has moved).
  let frNow = [];
  function placeNodes(shift, D) {
    const r = road.box();
    still = D < 1;
    if (chosen >= vis.length) chosen = 0;
    const fr = vis.map((c) => {
      const b = c.el.getBoundingClientRect();
      const c0 = b.left + b.width / 2 - shift;
      const p = rtl ? (r.right - c0) / (D + r.width) : (c0 - r.left) / (D + r.width);
      return Math.max(0, Math.min(1, p));
    });
    road.nodes(fr, vis);
    frNow = fr;
    return fr;
  }

  // ---------- the strip moves only when you move it: drag (mouse), swipe (touch), trackpad, the
  // arrows, the road dots or the keyboard. Page scroll never drives it.
  root.classList.add('is-native');
  let raf = 0;
  const max = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  const prog = () => (max() > 0 ? Math.abs(viewport.scrollLeft) / max() : 0);
  let fr = [];
  const relayout = () => {
    fr = placeNodes(-viewport.scrollLeft, max());
    measure(prog(), false);
  };
  const goTo = (i) => {
    i = Math.max(0, Math.min(vis.length - 1, i));
    chosen = i;
    if (still) return measure(0, false);
    viewport.scrollTo({ left: (rtl ? -1 : 1) * fr[i] * max(), behavior: reduced ? 'auto' : 'smooth' });
  };

  // After a swipe or drag, glide to the nearest stop so its card sits right above the car.
  let settleT = 0;
  let holding = false;
  let settleAt = 0;
  const settle = () => {
    if (holding || !fr.length || still) return;
    const target = (rtl ? -1 : 1) * fr[settleAt] * max();
    if (Math.abs(viewport.scrollLeft - target) > 2) viewport.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' });
  };
  const queueSettle = () => {
    clearTimeout(settleT);
    settleT = setTimeout(settle, 160);
  };
  viewport.addEventListener('touchstart', () => (holding = true), { passive: true });
  viewport.addEventListener('touchend', () => {
    holding = false;
    queueSettle();
  });
  viewport.addEventListener(
    'scroll',
    () => {
      queueSettle();
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        measure(prog(), false);
        settleAt = nearest;
      });
    },
    { passive: true }
  );

  // mouse: grab and drag the strip sideways (touch and trackpads scroll it natively)
  let dragging = false;
  let startX = 0;
  let startLeft = 0;
  let moved = 0;
  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true;
    holding = true;
    moved = 0;
    startX = e.clientX;
    startLeft = viewport.scrollLeft;
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    // capture only once it is a real drag, so a plain click still reaches the card link
    if (moved > 6 && !viewport.hasPointerCapture(e.pointerId)) {
      viewport.setPointerCapture(e.pointerId);
      root.classList.add('is-dragging');
    }
    viewport.scrollLeft = startLeft - dx;
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    holding = false;
    root.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    if (moved > 6) {
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
    }
    queueSettle();
  };
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);

  // arrows: one stop back or forward
  const step = document.createElement('div');
  step.className = 'r-step';
  step.innerHTML = `
    <button class="r-step__btn" type="button" data-d="-1" aria-label="${L.prevStop}"><svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4 6.5 10l6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>
    <button class="r-step__btn" type="button" data-d="1" aria-label="${L.nextStop}"><svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="m7.5 4 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2"/></svg></button>`;
  root.querySelector('.ntc-stops__status').appendChild(step);
  const stepBtns = [...step.querySelectorAll('button')];
  stepBtns.forEach((b) => b.addEventListener('click', () => goTo((still ? chosen : nearest) + Number(b.dataset.d))));
  const syncStep = () => {
    const at = still ? chosen : nearest;
    stepBtns[0].disabled = at <= 0;
    stepBtns[1].disabled = at >= vis.length - 1;
  };
  const measure0 = measure;
  measure = (p, scale) => {
    measure0(p, scale);
    syncStep();
  };

  // keyboard: focusing a card brings it over the car
  track.addEventListener('focusin', (e) => {
    const i = vis.findIndex((c) => c.el.contains(e.target));
    if (i >= 0 && i !== nearest) goTo(i);
  });

  road.onJump(goTo);
  onFilter = () => {
    chosen = 0;
    viewport.scrollLeft = 0;
    relayout();
  };
  let rt;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(relayout, 150);
  });
  requestAnimationFrame(relayout);
  return {};
}
