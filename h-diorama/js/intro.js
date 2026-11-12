// Intro: title, body, four stats and the three pillars as small pop-up paper cards.
import { h, tr, asset, RM } from './core.js';

// darken a hex colour (keeps cream text at AA on the lavender pillar)
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function createIntro(data) {
  const head = h(
    'header',
    { class: 'intro__head' },
    h('h2', { class: 'nt-h2 intro__title' }, tr(data.intro.title)),
    h('p', { class: 'nt-lede intro__body' }, tr(data.intro.body)),
  );

  const stats = h(
    'ul',
    { class: 'intro__stats pops' },
    data.intro.stats.map((s) =>
      h(
        'li',
        { class: 'popcard' },
        h(
          'div',
          { class: 'popcard__face stat' },
          h('p', { class: 'stat__value' }, h('span', { class: 'stat__num' }, s.value), s.unit ? h('span', { class: 'stat__unit' }, tr(s.unit)) : null),
          h('p', { class: 'stat__label' }, tr(s.label)),
        ),
      ),
    ),
  );

  const pillars = h(
    'ul',
    { class: 'intro__pillars pops' },
    data.pillars.map((p) => {
      const bg = p.key === 'desert' ? shade(p.color, 0.72) : p.color;
      return h(
        'li',
        { class: 'popcard popcard--pillar' },
        h(
          'div',
          { class: 'popcard__face pillar', style: `--pc:${bg}` },
          h('div', { class: 'pillar__art' }, h('img', { src: asset(p.art), alt: '', loading: 'lazy', decoding: 'async' }), h('span', { class: 'pillar__stand' })),
          h('h3', { class: 'pillar__name' }, tr(p.name)),
          h('p', { class: 'pillar__line' }, tr(p.line)),
        ),
      );
    }),
  );

  const el = h('section', { class: 'intro', 'aria-labelledby': 'intro-title' }, h('div', { class: 'nt-wrap intro__wrap' }, head, stats, pillars));
  head.querySelector('h2').id = 'intro-title';

  function scroll(gsap) {
    if (RM) return;
    gsap.set(head.children, { autoAlpha: 0, y: 24 });
    gsap.to(head.children, {
      autoAlpha: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: head, start: 'top 80%', once: true },
    });

    [stats, pillars].forEach((list) => {
      const faces = list.querySelectorAll('.popcard__face');
      const arts = list.querySelectorAll('.pillar__art');
      gsap.set(faces, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
      if (arts.length) gsap.set(arts, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
      const tl = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 82%', once: true } });
      tl.to(faces, { autoAlpha: 1, duration: 0.1, stagger: 0.12 }, 0)
        .to(faces, { rotationX: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.12 }, 0);
      if (arts.length) {
        tl.to(arts, { autoAlpha: 1, duration: 0.1, stagger: 0.12 }, 0.45)
          .to(arts, { rotationX: 0, duration: 0.8, ease: 'back.out(2.4)', stagger: 0.12 }, 0.45);
      }
    });
  }

  return { el, scroll };
}
