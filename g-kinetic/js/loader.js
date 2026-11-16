// Loading moment: 0 to 1,200 counts in giant Bukra while both names lock into place.
import { splitLetters, t, reduced } from './lib.js';

export function runLoader() {
  const root = document.getElementById('loader');
  const html = document.documentElement;
  if (!root) return Promise.resolve();
  if (html.classList.contains('no-intro') || reduced) {
    root.remove();
    return Promise.resolve();
  }
  try { sessionStorage.setItem('nt-g-intro', '1'); } catch (e) {}

  const en = root.querySelector('[data-split="en"]');
  const ar = root.querySelector('[data-split="ar"]');
  const num = root.querySelector('.loader__num');
  root.querySelector('.loader__unit').textContent = t('km');
  const letters = [...splitLetters(en, en.textContent, 'en'), ...splitLetters(ar, ar.textContent, 'ar')].filter((s) => !s.classList.contains('ch--sp'));

  html.classList.add('is-loading');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rnd = (a, b) => a + Math.random() * (b - a);

  return new Promise((resolve) => {
    const counter = { v: 0 };
    const fmt = (v) => Math.round(v).toLocaleString('en-US');
    const tl = gsap.timeline({
      onComplete: () => {
        html.classList.remove('is-loading');
        root.remove();
        resolve();
      },
    });
    tl.from(letters, {
      x: () => rnd(-vw * 0.45, vw * 0.45),
      y: () => rnd(-vh * 0.35, vh * 0.35),
      rotation: () => rnd(-120, 120),
      scale: () => rnd(0.4, 2.2),
      opacity: 0,
      duration: 1.5,
      ease: 'expo.out',
      stagger: { each: 0.035, from: 'random' },
    }, 0.1)
      .to(counter, {
        v: 1200, duration: 1.7, ease: 'power3.inOut',
        onUpdate: () => (num.textContent = fmt(counter.v)),
      }, 0.1)
      .to(root.querySelector('.loader__inner'), { yPercent: -6, opacity: 0, duration: 0.5, ease: 'power2.in' }, 2.0)
      .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut' }, 2.15)
      .add(() => { html.classList.add('intro-revealed'); window.dispatchEvent(new CustomEvent('nt:intro-reveal')); }, 2.35);
  });
}
