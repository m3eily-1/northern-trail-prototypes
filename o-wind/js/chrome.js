// Small chrome: the page grain and the wind gauge (desktop only). The gauge
// shows the wind you are making: scroll faster or sweep the pointer and the
// bars fill.
import { esc, arrowSvg, reduced } from './i18n.js';
import { wind, onFrame } from './wind.js';

export function initGrain() {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const x = c.getContext('2d');
  const img = x.createImageData(160, 160);
  // transparent warm noise: dark and light specks
  for (let i = 0; i < img.data.length; i += 4) {
    const r = Math.random();
    const light = r > 0.5;
    img.data[i] = light ? 255 : 70;
    img.data[i + 1] = light ? 245 : 45;
    img.data[i + 2] = light ? 210 : 25;
    img.data[i + 3] = Math.round(Math.abs(r - 0.5) * 2 * 34);
  }
  x.putImageData(img, 0, 0);
  const url = `url(${c.toDataURL('image/png')})`;
  document.documentElement.style.setProperty('--o-noise', url);
}

export function initGauge(ui) {
  if (reduced) return;
  const el = document.querySelector('.gauge');
  if (!el) return;
  const N = 7;
  el.innerHTML = `${arrowSvg('gauge__arr')}<span class="gauge__l">${esc(ui.wind)}</span><span class="gauge__bars">${'<i></i>'.repeat(N)}</span>`;
  const bars = [...el.querySelectorAll('i')];
  let last = -1;
  let idle = 0;
  onFrame((dt) => {
    // the gauge shows up only while you are making wind
    if (wind.gust > 0.12) idle = 0;
    else idle += dt;
    el.classList.toggle('is-live', idle < 1.4);
    const lvl = Math.min(N, Math.round((0.12 + wind.gust) * (N / 1.1)));
    if (lvl === last) return;
    last = lvl;
    bars.forEach((b, i) => b.classList.toggle('on', i < lvl));
    el.classList.toggle('is-gust', lvl >= 5);
  });
  // only once the hero has cleared
  setTimeout(() => el.classList.add('is-on'), 1800);
}
