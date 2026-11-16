// Closing: the wind drops at dusk. The tagline is the last thing the wind
// uncovers; the stickers sit half buried in the dune and pop up as you arrive.
import { t, esc, asset, inview } from './i18n.js';
import { bury } from './cover.js';
import { dunes } from './dunes.js';

export function initClosing(data) {
  const root = document.getElementById('closing');
  const stickers = Object.values(data.stickers);
  root.innerHTML = `
    ${dunes(
      [
        { seed: 91, fill: 'rgba(200,140,60,0.45)', depth: 1.1, lo: 0.4, hi: 0.9, n: 3 },
        { seed: 97, fill: 'rgba(168,104,47,0.8)', depth: 0.5, lo: 0.25, hi: 0.6, n: 4 },
        { seed: 103, fill: 'var(--nt-sand-dark)', depth: 0, lo: 0.08, hi: 0.3, n: 5 }
      ],
      'dunes--closing'
    )}
    <div class="closing__body"><div class="closing__in nt-wrap">
      <h2 class="closing__tag sand-text" id="closing-title" lang="ar" dir="rtl">${esc(data.hero.tagline)}</h2>
      <p class="closing__line reveal">${esc(t(data.closing.line))}</p>
      <ul class="closing__stickers" aria-hidden="true">
        ${stickers.map((s, i) => `<li style="--i:${i}"><img src="${asset(s)}" alt="" loading="lazy" decoding="async"></li>`).join('')}
      </ul>
      <img class="closing__logo reveal" src="${asset(data.logo.cream)}" alt="${esc(t({ en: 'Northern Trail', ar: 'مسار الشمال' }))}" width="296" height="165" loading="lazy">
    </div></div>`;
  bury(root.querySelector('.closing__tag'), { kind: 'text', palette: 'light', rate: 0.4, startAt: 0.8 });
  root.querySelectorAll('.reveal').forEach((el) => inview(el));
  inview(root.querySelector('.closing__stickers'), '0px 0px -5% 0px');
}
