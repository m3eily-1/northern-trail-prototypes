// PILLARS: three colour-block bands; giant names slide in from the inline start, art rises.
import { h, L, asset, pad2, isRTL, reduced, kinetic } from './lib.js';

export function initPillars(data) {
  const root = document.getElementById('pillars');
  const names = [];
  data.pillars.forEach((p, i) => {
    const words = L(p.name).split(' ');
    const name = h('h2', { class: 'band__name' }, words.map((w, j) => [h('span', { class: 'band__w' }, h('span', { class: 'band__wi' }, w)), j < words.length - 1 ? ' ' : null]));
    names.push(name);
    root.append(h('article', { class: `band band--${p.key}`, style: `--band:${p.color}` },
      h('div', { class: 'nt-wrap band__grid' },
        h('p', { class: 'band__i nt-eyebrow' }, `${pad2(i + 1)} / ${pad2(data.pillars.length)}`),
        name,
        h('p', { class: 'band__line' }, L(p.line)),
        h('div', { class: 'band__art' }, h('img', { src: asset(p.art), alt: '', loading: 'lazy' })),
      )));
  });
  kinetic(names.map((n) => n), { skew: 5, stretch: 0.04 });

  if (reduced) return;
  const dir = isRTL ? 1 : -1;
  root.querySelectorAll('.band').forEach((band) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: band, start: 'top 90%', end: 'center 50%', scrub: 0.6 } });
    tl.fromTo(band.querySelectorAll('.band__wi'), { xPercent: 60 * dir, opacity: 0 }, { xPercent: 0, opacity: 1, ease: 'power3.out', stagger: 0.12 }, 0)
      .fromTo(band.querySelector('.band__art img'), { yPercent: 30, rotation: -6 * dir, scale: 0.85 }, { yPercent: 0, rotation: 0, scale: 1, ease: 'power2.out' }, 0)
      .fromTo(band.querySelector('.band__line'), { y: 32, opacity: 0 }, { y: 0, opacity: 1, ease: 'power2.out' }, 0.3)
      .fromTo(band.querySelector('.band__i'), { opacity: 0 }, { opacity: 1 }, 0);
  });
}
