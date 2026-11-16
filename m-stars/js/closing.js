// Closing: the whole constellation, complete, over a sand-dark horizon glow, then
// the tagline and the logo.
import { t, esc, asset, lang, ui } from './i18n.js';
import { reveal, splitWords, starGlyph } from './util.js';
import { constellationSVG } from './sky.js';

export function initClosing(data) {
  const root = document.getElementById('closing');
  const C = constellationSVG(data.stops, { w: 1000, h: 560, pad: 40 });
  const stars = C.pts
    .map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === 0 || i === C.pts.length - 1 ? 5 : 3.4}" style="--k:${i}"/>`)
    .join('');
  root.innerHTML = `
    <svg class="closing__sky" viewBox="0 0 1000 560" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      <path d="${C.d}" pathLength="1"/>${stars}
    </svg>
    <div class="closing__in nt-wrap">
      <h2 class="closing__tag m-split" id="closing-title" lang="ar" dir="rtl">${esc(data.hero.tagline)}</h2>
      <p class="closing__line" data-r>${esc(t(data.closing.line))}</p>
      <img class="closing__logo" data-r src="${asset(data.logo.cream)}" alt="${lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165" loading="lazy">
      <a class="m-ghost closing__back" data-r href="#stops">${starGlyph()}<span>${esc(ui.back)}</span></a>
    </div>
    <span class="closing__horizon" aria-hidden="true"></span>`;
  const h2 = root.querySelector('h2');
  splitWords(h2);
  reveal(h2);
  reveal(root.querySelector('.closing__sky'));
  root.querySelectorAll('[data-r]').forEach((el) => reveal(el));
}
