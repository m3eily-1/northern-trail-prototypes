// Loading moment: paper layers fold up from flat into the logo scene, once per session.
import { h, buildLayers } from './core.js';
import { LOADER } from './scenes.js';

export function runLoader(gsap, ready) {
  const root = document.querySelector('.loader');
  const html = document.documentElement;
  if (!html.classList.contains('is-loading')) {
    root.remove();
    return ready;
  }

  const stage = h('div', { class: 'ld-stage' });
  const box = h('div', { class: 'ld-box' });
  stage.append(box);
  root.append(stage);
  const layers = buildLayers(box, LOADER.layers, 'ld-lyr');
  const card = h('div', { class: 'ld-card' }, h('img', { src: '../assets/svg/logo-dark.svg', alt: '' }), h('span', { class: 'ld-card__stand' }));
  box.append(card);

  gsap.set(layers, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
  gsap.set(card, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });

  const intro = gsap.timeline({ delay: 0.15 });
  intro
    .to(layers, { autoAlpha: 1, duration: 0.12, stagger: 0.16 }, 0)
    .to(layers, { rotationX: 0, duration: 0.9, ease: 'back.out(1.5)', stagger: 0.16 }, 0)
    .to(card, { autoAlpha: 1, duration: 0.12 }, 0.6)
    .to(card, { rotationX: 0, duration: 0.8, ease: 'back.out(2.2)' }, 0.6);

  const introDone = new Promise((res) => intro.eventCallback('onComplete', res));

  return Promise.all([introDone, ready]).then(
    ([, data]) =>
      new Promise((res) => {
        try { sessionStorage.setItem('nt-h-loader', '1'); } catch (e) {}
        const out = gsap.timeline({ delay: 0.25, onComplete: () => root.remove() });
        out
          .to(card, { rotationX: -90, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, 0)
          .to([...layers].reverse(), { rotationX: 90, duration: 0.5, ease: 'power2.in', stagger: 0.06 }, 0.1)
          .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'power3.inOut' }, 0.35)
          .add(() => { html.classList.remove('is-loading'); res(data); }, 0.45);
      }),
  );
}
