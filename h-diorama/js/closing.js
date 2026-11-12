// Closing: a night diorama with stars, the tagline, the closing line and the logo.
import { h, tr, RM, PHONE, buildLayers } from './core.js';
import { NIGHT } from './scenes.js';

export function createClosing(data) {
  const box = h('div', { class: 'cl__box' });
  const stage = h('div', { class: 'cl__stage', 'aria-hidden': 'true' }, box);
  const layers = buildLayers(box, NIGHT.layers, 'lyr');
  // stars live on the sky layer
  const starSvg = `<svg class="cl__stars" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMax slice">${NIGHT.stars
    .map((s, i) => `<circle cx="${s.x.toFixed(1)}" cy="${s.y.toFixed(1)}" r="${s.r.toFixed(1)}" fill="#fff5c8"${s.tw ? ` class="tw" style="animation-delay:${((i * 0.37) % 3).toFixed(2)}s"` : ''}/>`)
    .join('')}</svg>`;
  layers[0].insertAdjacentHTML('beforeend', starSvg);

  const tagline = h('p', { class: 'cl__tagline', lang: 'ar', dir: 'rtl' }, data.hero.tagline);
  const line = h('p', { class: 'cl__line' }, tr(data.closing.line));
  const logo = h('img', { class: 'cl__logo', src: '../' + data.logo.cream, alt: 'Northern Trail' });
  const copy = h('div', { class: 'cl__copy' }, tagline, line, logo);
  const el = h('section', { class: 'cl', 'aria-label': data.hero.tagline }, stage, copy);

  function layout(gsap) {
    const P = PHONE.matches ? 900 : 1400;
    const gap = PHONE.matches ? 40 : 64;
    box.parentElement.style.perspective = `${P}px`;
    const H = stage.offsetHeight;
    const vis = layers.filter((l) => l.offsetParent !== null);
    vis.forEach((l, i) => {
      const z = -(vis.length - 1 - i) * gap;
      const s = (P - z) / P;
      const bottom = l.offsetTop + l.offsetHeight - H / 2;
      gsap.set(l, { z, scale: s, y: bottom * (s - 1), transformOrigin: '50% 100%' });
    });
  }

  function scroll(gsap) {
    layout(gsap);
    window.addEventListener('resize', () => layout(gsap));
    if (RM) return;
    gsap.set(layers, { rotationX: 90, autoAlpha: 0 });
    gsap.set(copy.children, { autoAlpha: 0, y: 24 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', end: 'top 64px', scrub: 0.6 } });
    tl.to(layers, { autoAlpha: 1, duration: 0.05, stagger: 0.12 }, 0)
      .to(layers, { rotationX: 0, duration: 0.6, ease: 'back.out(1.4)', stagger: 0.12 }, 0)
      .to(copy.children, { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.12 }, 0.55);
  }

  return { el, scroll };
}
