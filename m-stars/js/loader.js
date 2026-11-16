// Loading moment: the sky fades in, the route ignites star by star as a
// constellation, a readout counts to 100, then a circular aperture opens from
// the hero's planisphere window onto the page.
import { ui } from './i18n.js';
import { constellationSVG, rng } from './sky.js';

const KEY = 'nt-m-stars-intro';

export function initLoader(data) {
  const el = document.getElementById('loader');
  const html = document.documentElement;
  if (!el) return Promise.resolve();
  if (!html.classList.contains('has-loader')) {
    el.remove();
    return Promise.resolve();
  }

  const W = 1000;
  const H = 620;
  const C = constellationSVG(data.stops, { w: W, h: H, pad: 70 });
  const r = rng(21);
  let bg = '';
  for (let i = 0; i < 110; i++) {
    const m = Math.pow(r(), 3);
    bg += `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${(0.7 + m * 1.8).toFixed(2)}" style="--d:${Math.round(r() * 700)}ms;--a:${(0.25 + m * 0.7).toFixed(2)}"/>`;
  }
  // Ignite each star when the drawing line reaches it.
  const seg = C.pts.map((p, i) => (i ? Math.hypot(p[0] - C.pts[i - 1][0], p[1] - C.pts[i - 1][1]) : 0));
  const total = seg.reduce((a, b) => a + b, 0);
  let acc = 0;
  const DRAW = 1500;
  const START = 350;
  const stars = C.pts
    .map((p, i) => {
      acc += seg[i];
      const d = Math.round(START + (acc / total) * DRAW);
      return `<g class="ml-star" style="--d:${d}ms" transform="translate(${p[0].toFixed(1)} ${p[1].toFixed(1)})"><circle class="ml-star__halo" r="14"/><circle class="ml-star__core" r="${i === 0 || i === C.pts.length - 1 ? 4.5 : 3.2}"/></g>`;
    })
    .join('');

  el.innerHTML = `
    <div class="ml-sky">
      <svg class="ml-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <g class="ml-bg">${bg}</g>
        <path class="ml-route" d="${C.d}" pathLength="1" style="--d:${START}ms;--draw:${DRAW}ms"/>
        ${stars}
      </svg>
    </div>
    <div class="ml-meta">
      <span class="ml-label">${ui.aligning}</span>
      <span class="ml-pct"><span class="ml-pct__n">000</span><span class="ml-pct__u">%</span></span>
    </div>
    <p class="ml-skip">${ui.skip}</p>`;

  const pct = el.querySelector('.ml-pct__n');
  requestAnimationFrame(() => el.classList.add('is-on'));

  return new Promise((resolve) => {
    let done = false;
    const t0 = performance.now();
    const DUR = START + DRAW + 550;
    const finish = () => {
      if (done) return;
      done = true;
      const win = document.querySelector('.sphere__window');
      if (win) {
        const a = win.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        el.style.setProperty('--ix', `${a.left + a.width / 2 - b.left}px`);
        el.style.setProperty('--iy', `${a.top + a.height / 2 - b.top}px`);
        el.style.setProperty('--i0', `${a.width / 2}px`);
      }
      el.classList.add('is-out');
      html.classList.remove('has-loader');
      html.classList.add('is-ready');
      try {
        sessionStorage.setItem(KEY, '1');
      } catch (e) {}
      resolve();
      setTimeout(() => el.remove(), 1400);
    };
    const tick = (now) => {
      if (done) return;
      // The readout follows the line as it draws from Riyadh to Jubbah.
      const k = Math.min(1, Math.max(0, (now - t0 - START) / DRAW));
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      pct.textContent = String(Math.round(e * 100)).padStart(3, '0');
      if (now - t0 < DUR) requestAnimationFrame(tick);
      else finish();
    };
    requestAnimationFrame(tick);
    el.addEventListener('pointerdown', finish, { once: true });
    window.addEventListener('keydown', finish, { once: true });
  });
}

