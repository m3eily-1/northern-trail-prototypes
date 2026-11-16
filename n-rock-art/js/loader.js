// Loading moment: a camel is pecked into the dark rock while content and fonts
// arrive, then the torch flares and the cliff opens on the hero.
import { peck, animatePeck } from './peck.js';
import { ui, rtl, reduced } from './i18n.js';

export function initLoader(ready) {
  const el = document.getElementById('loader');
  const html = document.documentElement;
  if (!html.classList.contains('has-loader')) {
    el.remove();
    return Promise.resolve();
  }
  el.querySelector('.loader__label').textContent = ui.loading;
  const cv = el.querySelector('.loader__canvas');
  const bar = el.querySelector('.loader__bar i');
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(cv.clientWidth * dpr);
  cv.height = Math.round(cv.clientHeight * dpr);
  const job = peck(cv, { kind: 'motif', name: 'camel', flip: rtl }, { dpr, seed: 3, spacing: 4, rtl });

  let skipped = false;
  const skip = () => (skipped = true);
  el.addEventListener('click', skip);
  addEventListener('keydown', skip, { once: true });

  const pecking = animatePeck(job, 1350, (beat) => {
    bar.style.transform = `scaleX(${Math.min(1, (beat + 1) / 22)})`;
  });
  const cap = new Promise((r) => setTimeout(r, 4000));
  const all = Promise.race([Promise.all([pecking, ready]), cap, new Promise((r) => {
    const iv = setInterval(() => skipped && (clearInterval(iv), r()), 50);
  })]);

  return all.then(
    () =>
      new Promise((resolve) => {
        job.draw(0, job.count);
        bar.style.transform = 'scaleX(1)';
        el.classList.add('is-lit');
        setTimeout(() => {
          el.classList.add('is-out');
          html.classList.remove('has-loader');
          html.classList.add('is-ready');
          resolve();
          setTimeout(() => el.remove(), reduced ? 0 : 900);
        }, 380);
      })
  );
}
