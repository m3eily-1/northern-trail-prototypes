// Loading moment: the sun rises over a flat horizon as the percentage counts.
// The sky uses the same palette engine as the page (05:00 to 06:02), so the loader hands
// over to the hero at exactly the dawn the journey starts with.

import { sky, rgb, clamp, mix } from './time.js';

export function runLoader(el, tasks, { min = 2400, max = 7000 } = {}) {
  const pct = el.querySelector('[data-pct]');
  let done = 0;
  tasks.forEach((p) => Promise.resolve(p).finally(() => done++));
  const t0 = performance.now();
  let shown = 0;
  return new Promise((resolve) => {
    function tick(now) {
      const el2 = now - t0;
      const real = tasks.length ? done / tasks.length : 1;
      const timeCap = clamp(el2 / min);
      const target = el2 > max ? 1 : Math.min(real * 0.92 + 0.08 * timeCap, timeCap);
      shown += (target - shown) * 0.08;
      if (target >= 1 && shown > 0.995) shown = 1;
      paint(shown);
      if (shown >= 1) {
        setTimeout(() => {
          el.classList.add('is-exit');
          try {
            sessionStorage.setItem('nt-f-dawn', '1');
          } catch (e) {}
          resolve();
          setTimeout(() => {
            document.documentElement.classList.remove('is-loading');
            el.remove();
          }, 1100);
        }, 280);
        return;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });

  function paint(p) {
    const s = sky(300 + 62 * p);
    el.style.setProperty('--l-top', rgb(s.top));
    el.style.setProperty('--l-mid', rgb(s.mid));
    el.style.setProperty('--l-hor', rgb(s.hor));
    el.style.setProperty('--l-p', p.toFixed(4));
    el.style.setProperty('--l-sun', rgb(mix([255, 196, 140], [255, 238, 200], p)));
    pct.textContent = String(Math.round(p * 100));
  }
}
