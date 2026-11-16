// Stops: a horizontal reel of 16 tall cards with region dividers. On desktop the section pins and
// vertical scroll drives the strip; dragging (with inertia) and horizontal wheel also drive it by
// scrolling the page, so there is one source of truth. The card nearest the centre grows slightly.
// Phones and reduced motion get a native horizontal swipe strip with snap.
import { pad2 } from './labels.js';

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
  const progressEl = root.querySelector('.ntc-stops__progress');
  const total = data.stops.length;
  const native = isPhone || reduced;

  root.querySelector('.ntc-stops__eyebrow').textContent = L.stopsEyebrow;
  if (isPhone) root.querySelector('.ntc-stops__hint span').textContent = L.hintTouch;

  // ---- build strip
  const cards = [];
  data.regions.forEach((region, ri) => {
    const div = document.createElement('li');
    div.className = 'ntc-divider';
    div.innerHTML = `
      <span class="ntc-divider__idx">${L.region} ${pad2(ri + 1)}</span>
      <span class="ntc-divider__name"><strong>${t(region.name)}</strong><span>${t(region.count)}</span></span>`;
    track.appendChild(div);

    data.stops
      .filter((s) => s.region === region.key)
      .forEach((s, si) => {
        const li = document.createElement('li');
        li.className = 'ntc-card';
        li.dataset.cursor = 'view';
        const drive = s.drive ? t(s.drive) : L.start;
        const driveTitle = s.drive ? `${t(s.drive)} ${L.fromPrev}` : L.start;
        li.innerHTML = `
          <div class="ntc-card__inner">
            <button class="ntc-card__photo" type="button" aria-expanded="false" aria-label="${t(s.name)}: ${L.about}">
              <img src="${asset(s.photo)}" alt="" decoding="async" draggable="false">
              <span class="ntc-card__desc">
                <span class="ntc-card__desc-label">${L.about}</span>
                <p>${t(s.desc)}</p>
              </span>
            </button>
            <div class="ntc-card__meta">
              <span class="ntc-card__num">${pad2(s.n)}</span>
              <span class="ntc-card__drive" title="${driveTitle}">${s.drive ? CLOCK : FLAG}<span>${drive}</span><span class="ntc-sr">${s.drive ? L.fromPrev : ''}</span></span>
            </div>
            <h3 class="ntc-card__name">${t(s.name)}</h3>
            ${s.sticker ? `<img class="ntc-card__sticker" src="${asset(s.sticker)}" alt="" loading="lazy" draggable="false" style="--r:${si % 2 ? -9 : 8}deg">` : ''}
          </div>`;
        track.appendChild(li);
        cards.push({ el: li, inner: li.querySelector('.ntc-card__inner'), n: s.n });
      });
  });

  // tap / click toggles the description (hover also shows it on fine pointers)
  let suppressClick = false;
  cards.forEach(({ el }) => {
    const btn = el.querySelector('.ntc-card__photo');
    btn.addEventListener('click', (e) => {
      if (suppressClick) {
        e.preventDefault();
        return;
      }
      const open = !el.classList.contains('is-open');
      cards.forEach((c) => {
        c.el.classList.remove('is-open');
        c.el.querySelector('.ntc-card__photo').setAttribute('aria-expanded', 'false');
      });
      el.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  let current = 0;
  function updateCounter(idx) {
    if (idx === current) return;
    current = idx;
    counter.textContent = L.stopOf(pad2(idx), total);
  }
  updateCounter(1);

  // nearest card to the viewport centre; optional scale emphasis
  function measure(scale) {
    const cx = window.innerWidth / 2;
    let best = 1;
    let bestD = Infinity;
    const rects = cards.map((c) => c.el.getBoundingClientRect());
    rects.forEach((r, i) => {
      const d = Math.abs(r.left + r.width / 2 - cx);
      if (d < bestD) {
        bestD = d;
        best = cards[i].n;
      }
      if (scale) {
        const k = Math.max(0, 1 - d / (r.width * 1.4));
        const s = 1 + 0.05 * k * k * (3 - 2 * k);
        cards[i].inner.style.transform = `scale(${s.toFixed(4)})`;
      }
    });
    updateCounter(best);
  }

  // ---------- native strip
  if (native) {
    root.classList.add('is-native');
    let raf = 0;
    viewport.addEventListener(
      'scroll',
      () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          measure(false);
          const max = viewport.scrollWidth - viewport.clientWidth;
          const p = max > 0 ? Math.abs(viewport.scrollLeft) / max : 0;
          progressEl.style.setProperty('--p', p.toFixed(4));
        });
      },
      { passive: true }
    );
    return {};
  }

  // ---------- pinned desktop reel
  const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
  const sign = rtl ? 1 : -1;
  const tween = gsap.to(track, {
    x: () => sign * distance(),
    ease: 'none',
    onUpdate: () => measure(true),
  });
  const st = ScrollTrigger.create({
    trigger: stage,
    start: 'top 64px',
    end: () => `+=${distance()}`,
    pin: stage,
    animation: tween,
    scrub: 0.5,
    invalidateOnRefresh: true,
    onUpdate: (self) => progressEl.style.setProperty('--p', self.progress.toFixed(4)),
    onRefresh: () => measure(true),
  });

  const clampScroll = (y) => Math.max(st.start, Math.min(st.end, y));

  // drag with inertia: horizontal pointer motion becomes page scroll inside the pin range
  let dragging = false;
  let startX = 0;
  let lastX = 0;
  let lastT = 0;
  let v = 0;
  let inertia = 0;
  let moved = 0;
  const drift = rtl ? 1 : -1; // pointer moving toward inline start advances the reel

  function stopInertia() {
    cancelAnimationFrame(inertia);
    inertia = 0;
  }

  viewport.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    stopInertia();
    dragging = true;
    moved = 0;
    startX = lastX = e.clientX;
    lastT = performance.now();
    v = 0;
    viewport.setPointerCapture(e.pointerId);
  });
  viewport.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dt = Math.max(1, now - lastT);
    lastX = e.clientX;
    lastT = now;
    moved = Math.max(moved, Math.abs(e.clientX - startX));
    if (moved > 6) root.classList.add('is-dragging');
    const dy = dx * drift;
    window.scrollTo(0, clampScroll(window.scrollY + dy));
    v = v * 0.6 + (dy / dt) * 16.7 * 0.4; // px per frame
  });
  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-dragging');
    if (viewport.hasPointerCapture(e.pointerId)) viewport.releasePointerCapture(e.pointerId);
    if (moved > 6) {
      suppressClick = true;
      setTimeout(() => {
        suppressClick = false;
      }, 0);
    }
    if (performance.now() - lastT > 80) v = 0;
    const step = () => {
      v *= 0.94;
      if (Math.abs(v) < 0.4) {
        inertia = 0;
        return;
      }
      const y = clampScroll(window.scrollY + v);
      if (y === st.start || y === st.end) v = 0;
      window.scrollTo(0, y);
      inertia = requestAnimationFrame(step);
    };
    inertia = requestAnimationFrame(step);
  };
  viewport.addEventListener('pointerup', end);
  viewport.addEventListener('pointercancel', end);
  window.addEventListener('wheel', stopInertia, { passive: true });

  // horizontal trackpad swipes drive the reel too
  viewport.addEventListener(
    'wheel',
    (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      window.scrollTo(0, clampScroll(window.scrollY + e.deltaX * (rtl ? -1 : 1)));
    },
    { passive: false }
  );

  // keyboard: focusing a card scrolls the page so the card sits in the centre
  track.addEventListener('focusin', (e) => {
    const li = e.target.closest('.ntc-card, .ntc-divider');
    if (!li) return;
    const d = distance();
    if (!d) return;
    const fromStart = rtl ? track.scrollWidth - (li.offsetLeft + li.offsetWidth) : li.offsetLeft;
    const p = Math.max(0, Math.min(1, (fromStart + li.offsetWidth / 2 - viewport.clientWidth / 2) / d));
    window.scrollTo(0, st.start + p * (st.end - st.start));
  });

  return { st };
}
