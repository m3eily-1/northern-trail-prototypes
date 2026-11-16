// Chapters: the three pillars as pinned full-bleed scenes. Each scene crossfades two film stills
// with a slow push-in; the next chapter enters with a clip-path wipe from the inline end, led by
// a cream hairline. Titles reveal with word masks when a chapter becomes active.
import { splitWords, pad2 } from './labels.js';

// film stills per pillar (heritage: majlis + tea; farms: palms + shared meal; desert: dunes + road)
const STILLS = {
  heritage: [7, 0],
  farms: [6, 5],
  desert: [3, 2],
};

export function initChapters(root, ctx) {
  const { gsap, ScrollTrigger, data, t, L, rtl, asset, reduced, isPhone } = ctx;
  const stage = root.querySelector('.ntc-chapters__stage');
  const edge = root.querySelector('.ntc-chapters__edge');
  const n = data.pillars.length;

  const bars = document.createElement('div');
  bars.className = 'ntc-chapters__bars';
  bars.setAttribute('aria-hidden', 'true');
  bars.innerHTML = '<i></i>'.repeat(n);
  stage.appendChild(bars);
  const barEls = [...bars.children];

  const loads = [];
  const chs = data.pillars.map((p, i) => {
    const el = document.createElement('article');
    el.className = 'ntc-ch';
    el.style.setProperty('--ch-color', p.color);
    const stills = (STILLS[p.key] || [i, i + 1]).map((k) => asset(data.film.frames[k]));
    el.innerHTML = `
      <div class="ntc-ch__media">
        ${stills.map((src) => `<img class="ntc-ch__still" src="${src}" alt="" decoding="async">`).join('')}
      </div>
      <div class="ntc-ch__tint"></div>
      <div class="ntc-ch__scrim"></div>
      <div class="ntc-ch__inner nt-wrap">
        <header class="ntc-ch__top">
          <p class="ntc-ch__label"><span>${L.chapter}</span><b>${pad2(i + 1)}</b><span>/ ${pad2(n)}</span></p>
        </header>
        <div class="ntc-ch__bottom">
          <div class="ntc-ch__text">
            <h2 class="ntc-ch__title"></h2>
            <p class="ntc-ch__line">${t(p.line)}</p>
          </div>
          <img class="ntc-ch__art" src="${asset(p.art)}" alt="" decoding="async">
        </div>
      </div>`;
    splitWords(el.querySelector('.ntc-ch__title'), t(p.name));
    stage.insertBefore(el, edge);
    if (i === 0) {
      el.querySelectorAll('img').forEach((img) => {
        loads.push(img.decode ? img.decode().catch(() => {}) : Promise.resolve());
      });
    }
    return el;
  });
  const ready = Promise.all(loads);

  if (reduced) {
    chs.forEach((c) => c.classList.add('is-active'));
    return { ready };
  }

  let active = -1;
  let entered = false;
  function setActive(i) {
    if (i >= 0 && !entered) return;
    if (i === active) return;
    active = i;
    chs.forEach((c, k) => c.classList.toggle('is-active', k === i));
  }

  const HOLD = 1;
  const WIPE = 0.7;
  const hidden = rtl ? 'inset(0% 100% 0% 0%)' : 'inset(0% 0% 0% 100%)';
  const shown = 'inset(0% 0% 0% 0%)';
  const W = () => stage.offsetWidth;
  const dir = rtl ? 1 : -1; // direction the outgoing content drifts

  gsap.set(chs.slice(1), { clipPath: hidden });

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stage,
      start: 'top 64px',
      end: () => `+=${stage.offsetHeight * (isPhone ? 2.2 : 3.2)}`,
      pin: stage,
      scrub: 0.6,
      invalidateOnRefresh: true,
    },
    onUpdate() {
      const time = tl.time();
      const span = HOLD + WIPE;
      const idx = Math.min(n - 1, Math.max(0, Math.floor((time - HOLD - WIPE * 0.5) / span) + 1));
      setActive(idx);
      const total = tl.duration();
      barEls.forEach((b, k) => {
        const s0 = k === 0 ? 0 : k * span - WIPE * 0.5;
        const s1 = k === n - 1 ? total : (k + 1) * span - WIPE * 0.5;
        b.style.setProperty('--f', Math.max(0, Math.min(1, (time - s0) / (s1 - s0))).toFixed(3));
      });
    },
  });

  chs.forEach((c, i) => {
    const [a, b] = c.querySelectorAll('.ntc-ch__still');
    const t0 = i * (HOLD + WIPE);
    const from = i === 0 ? 0 : t0 - WIPE;
    tl.fromTo([a, b], { scale: 1.14 }, { scale: 1, duration: HOLD + WIPE * 2 }, from);
    if (b) tl.to(b, { opacity: 1, duration: HOLD * 0.45, ease: 'power1.inOut' }, t0 + HOLD * 0.25);
    if (i < n - 1) {
      const next = chs[i + 1];
      const at = t0 + HOLD;
      tl.to(next, { clipPath: shown, duration: WIPE, ease: 'power3.inOut' }, at);
      tl.to(c.querySelector('.ntc-ch__inner'), { xPercent: 8 * dir, opacity: 0, duration: WIPE, ease: 'power2.in' }, at);
      tl.set(edge, { autoAlpha: 1 }, at);
      tl.fromTo(
        edge,
        { x: () => (rtl ? 0 : W()) },
        { x: () => (rtl ? W() : 0), duration: WIPE, ease: 'power3.inOut', immediateRender: false },
        at
      );
      tl.set(edge, { autoAlpha: 0 }, at + WIPE);
    }
  });
  // trailing hold so the last chapter reads before unpinning
  tl.to({}, { duration: HOLD * 0.6 });

  // Chapter one reveals as the section arrives (before the pin engages).
  ScrollTrigger.create({
    trigger: root,
    start: 'top 55%',
    onEnter: () => {
      entered = true;
      if (active < 0) setActive(0);
    },
    onLeaveBack: () => {
      setActive(-1);
      entered = false;
    },
  });

  return { ready };
}
