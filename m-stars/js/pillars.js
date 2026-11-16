// Pillars as named constellations: like an old star atlas, the brand
// illustration sits faintly behind the stars and the lines join them on reveal.
import { t, esc, asset, ui } from './i18n.js';
import { reveal, splitWords, starGlyph } from './util.js';

// Star positions in the illustration's own pixel space (icon PNG sizes), traced
// along its silhouette, plus which stars join up.
const FIGURES = {
  'assets/img/icon-1.png': {
    w: 640,
    h: 555,
    pts: [[45, 488], [160, 183], [275, 67], [371, 161], [330, 300], [470, 272], [595, 322], [467, 483]],
    big: [2, 5],
    edges: [[0, 1], [1, 2], [2, 3], [3, 5], [4, 5], [5, 6], [5, 7]]
  },
  'assets/img/icon-2.png': {
    w: 585,
    h: 640,
    pts: [[257, 173], [29, 237], [234, 32], [468, 64], [544, 211], [158, 339], [386, 320], [310, 557]],
    big: [0, 7],
    edges: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7]]
  },
  'assets/img/icon-4.png': {
    w: 635,
    h: 640,
    pts: [[57, 595], [44, 333], [184, 32], [330, 275], [394, 115], [470, 64], [610, 352], [483, 531]],
    big: [2, 5],
    edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]]
  }
};

function figure(art) {
  const f = FIGURES[art];
  if (!f) return '';
  const lines = f.edges
    .map(([a, b], i) => `<path d="M${f.pts[a].join(' ')} L${f.pts[b].join(' ')}" pathLength="1" style="--i:${i}"/>`)
    .join('');
  const stars = f.pts
    .map((p, i) => {
      const big = f.big.includes(i);
      return `<g class="cn__star${big ? ' is-big' : ''}" transform="translate(${p[0]} ${p[1]})" style="--i:${i}"><circle class="cn__halo" r="${big ? 30 : 20}"/><circle class="cn__core" r="${big ? 9 : 6}"/></g>`;
    })
    .join('');
  return `<svg class="cn__svg" viewBox="0 0 ${f.w} ${f.h}" aria-hidden="true" focusable="false"><g class="cn__lines">${lines}</g>${stars}</svg>`;
}

export function initPillars(data) {
  const root = document.getElementById('pillars');
  root.innerHTML = `
    <div class="nt-wrap">
      <header class="pillars__head">
        <p class="m-eyebrow m-eyebrow--glyph" data-r aria-hidden="true">${starGlyph()}</p>
        <h2 class="m-h2 m-split" id="pillars-title">${esc(ui.constellations)}</h2>
      </header>
      <ol class="cn-list">
        ${data.pillars
          .map((p, i) => {
            const f = FIGURES[p.art] || { w: 1, h: 1 };
            return `<li class="cn" style="--pc:${p.color};--k:${i}">
              <div class="cn__sky">
                <span class="cn__corners" aria-hidden="true"></span>
                <div class="cn__fig" style="aspect-ratio:${f.w} / ${f.h}">
                  <img class="cn__art" src="${asset(p.art)}" alt="" loading="lazy" decoding="async">
                  ${figure(p.art)}
                </div>
              </div>
              <div class="cn__txt">
                <p class="cn__n"><span class="cn__sw" aria-hidden="true"></span>${esc(ui.constellationN(i + 1))}</p>
                <h3 class="cn__name">${esc(t(p.name))}</h3>
                <p class="cn__line">${esc(t(p.line))}</p>
              </div>
            </li>`;
          })
          .join('')}
      </ol>
    </div>`;

  const h2 = root.querySelector('h2');
  splitWords(h2);
  reveal(h2);
  root.querySelectorAll('[data-r]').forEach((el) => reveal(el));
  root.querySelectorAll('.cn').forEach((el) => reveal(el));
}

