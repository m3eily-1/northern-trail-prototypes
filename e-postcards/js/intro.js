// Intro: what the trail is, four stat postcards and three pillar postcards (square, coloured format).
import { t, asset, esc, onVisible, reduced } from './util.js';

const STAT_TONE = ['sand-dark', 'green', 'cream', 'gray'];
const TILT = [-1.6, 1.1, -0.7, 1.5];

export function mountIntro(root, data) {
  const { intro, pillars } = data;
  const stats = intro.stats
    .map(
      (s, i) => `<li class="sq sq--stat sq--${STAT_TONE[i % 4]}" style="--tilt:${TILT[i % 4]}deg">
        <span class="sq__corner" aria-hidden="true"></span>
        <p class="sq__value"><span class="sq__num">${esc(s.value)}</span>${s.unit ? `<span class="sq__unit">${esc(t(s.unit))}</span>` : ''}</p>
        <p class="sq__label">${esc(t(s.label))}</p>
      </li>`
    )
    .join('');
  const pills = pillars
    .map(
      (p, i) => `<li class="sq sq--pillar" style="--tone:${p.color};--tilt:${TILT[(i + 1) % 4]}deg">
        <div class="sq__art"><img src="${asset(p.art)}" alt="" decoding="async"></div>
        <div class="sq__cap">
          <h3 class="sq__name">${esc(t(p.name))}</h3>
          <p class="sq__line">${esc(t(p.line))}</p>
        </div>
      </li>`
    )
    .join('');

  root.innerHTML = `
    <div class="nt-wrap intro__grid">
      <div class="intro__text">
        <h2 class="nt-h2" id="intro-title">${esc(t(intro.title))}</h2>
        <p class="nt-lede">${esc(t(intro.body))}</p>
      </div>
      <ul class="intro__stats" role="list">${stats}</ul>
    </div>
    <div class="intro__rail">
      <ul class="nt-wrap intro__pillars" role="list">${pills}</ul>
    </div>`;

  if (reduced) return;
  const gsap = window.gsap;
  const deal = (els) => {
    els.forEach((e) => e.classList.add('is-dealing'));
    gsap.set(els, { y: 80, rotation: (i) => (i % 2 ? 9 : -9), autoAlpha: 0 });
    return () =>
      gsap.to(els, {
        y: 0,
        rotation: (i, el) => parseFloat(el.style.getPropertyValue('--tilt')) || 0,
        autoAlpha: 1,
        duration: 0.9,
        stagger: 0.09,
        ease: 'back.out(1.3)',
        clearProps: 'transform,opacity,visibility',
        onComplete: () => els.forEach((e) => e.classList.remove('is-dealing'))
      });
  };
  const text = root.querySelectorAll('.intro__text > *');
  gsap.set(text, { y: 24, autoAlpha: 0 });
  onVisible(root.querySelector('.intro__text'), () =>
    gsap.to(text, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' })
  );
  const statEls = root.querySelectorAll('.sq--stat');
  onVisible(root.querySelector('.intro__stats'), deal(statEls));
  const pillEls = root.querySelectorAll('.sq--pillar');
  onVisible(root.querySelector('.intro__pillars'), deal(pillEls));
}
