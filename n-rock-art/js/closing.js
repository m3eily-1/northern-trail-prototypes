// Closing: the end of the trail at Jubbah. The tagline is pecked into the cliff
// and the Jubbah rocks (from the stop photo) are pecked as the last horizon,
// with a caravan arriving.
import { t, esc, asset, chiselWords } from './i18n.js';
import { carveHTML } from './carve.js';

export function initClosing(data) {
  const root = document.getElementById('closing');
  const tag = data.hero.tagline;
  const jubbah = data.stops.find((s) => s.key === 'jubbah');
  root.innerHTML = `
    <div class="nt-wrap closing__in">
      <h2 class="closing__title" id="closing-title" lang="ar" dir="rtl">
        <span class="sr">${esc(tag)}</span>
        ${carveHTML(`text:${tag}`, { cls: 'closing__tag', ar: 3, seed: 502, spacing: 2.8, density: 0.96, floor: 0.88, pad: 4, scale: 0.7 })}
      </h2>
      <p class="closing__line" data-words>${chiselWords(t(data.closing.line))}</p>
      <div class="closing__mark" data-rise>
        <img class="closing__logo" src="${asset(data.logo.cream)}" alt="${document.documentElement.lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165">
        <img class="closing__sticker" src="${asset(data.stickers.salma)}" alt="" loading="lazy" decoding="async">
      </div>
    </div>
    <div class="closing__ridge" aria-hidden="true">
      ${carveHTML(`stipple:${asset(jubbah.photo)}`, { cls: 'closing__stipple', ar: 2.6, seed: 501, spacing: 3.4, density: 1, floor: 0.32, fy: 0.85, pad: 0 })}
      ${carveHTML('motif:caravan', { cls: 'closing__caravan', ar: 4, seed: 503, spacing: 3.6 })}
    </div>`;
}
