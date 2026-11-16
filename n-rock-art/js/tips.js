// Visitor tips: five standing marker stones, each with its sign pecked in.
import { t, esc, ui, pad2, chiselWords } from './i18n.js';
import { carveHTML } from './carve.js';

const KNOWN = ['plane', 'temperature', 'route', 'clock', 'fuel'];

export function initTips(data) {
  const root = document.getElementById('tips');
  const S = data.sections.tips;
  root.innerHTML = `
    <div class="nt-wrap">
      <header class="pr__head">
        <h2 class="h2" id="tips-title" data-chisel>${esc(t(S.title))}</h2>
        <p class="pr__sub" data-words>${chiselWords(ui.tipsSub)}</p>
      </header>
      <ol class="markers">
        ${data.tips
          .map(
            (x, i) => `<li class="marker" data-rise style="--i:${i}">
              ${carveHTML(`motif:${KNOWN.includes(x.icon) ? x.icon : 'route'}`, { cls: 'marker__ico', ar: 1, seed: 200 + i, spacing: 1.7, density: 0.95, floor: 0.6, pad: 3 })}
              <p class="marker__n">${pad2(i + 1)}</p>
              <h3 class="marker__title">${esc(t(x.title))}</h3>
              <p class="marker__text">${esc(t(x.text))}</p>
            </li>`
          )
          .join('')}
      </ol>
    </div>`;
}
