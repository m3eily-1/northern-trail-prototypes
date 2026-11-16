// Intro: what the trail is, four numbers cut into the cliff, and the three
// pillars as carved tablets (each with its brand illustration pecked in).
import { t, esc, ui, chiselWords } from './i18n.js';
import { carveHTML } from './carve.js';

export function initIntro(data) {
  const root = document.getElementById('intro');
  const { intro } = data;
  root.innerHTML = `
    <div class="nt-wrap intro__grid">
      <div class="intro__copy">
        <p class="eyebrow" data-rise>${esc(ui.glance)}</p>
        <h2 class="h2" id="intro-title" data-chisel>${esc(t(intro.title))}</h2>
        <p class="lede" data-words>${chiselWords(t(intro.body))}</p>
      </div>
      ${carveHTML('img:../assets/img/icon-6.png', { cls: 'intro__art', ar: 640 / 615, seed: 21, spacing: 4, edge: 80 })}
      <ul class="stats">
        ${intro.stats
          .map(
            (s, i) => `<li class="stat" data-rise style="--i:${i}">
              <p class="stat__v"><span class="stat__num">${esc(s.value)}</span>${s.unit ? `<span class="stat__u">${esc(t(s.unit))}</span>` : ''}</p>
              <p class="stat__l">${esc(t(s.label))}</p>
            </li>`
          )
          .join('')}
      </ul>
    </div>`;
}

export function initPillars(data) {
  const root = document.getElementById('pillars');
  root.setAttribute('aria-label', data.pillars.map((p) => t(p.name)).join(', '));
  root.removeAttribute('aria-labelledby');
  root.innerHTML = `
    <div class="nt-wrap">
      <ul class="pillars__list">
        ${data.pillars
          .map(
            (p, i) => `<li class="pillar" data-rise style="--i:${i};--pig:${p.color}">
              ${carveHTML(`img:../${p.art}`, { cls: 'pillar__art', ar: 1.25, seed: 30 + i, spacing: 3.8, edge: 80, floor: 0.38 })}
              <div class="pillar__txt">
                <h3 class="pillar__name">${esc(t(p.name))}</h3>
                <p class="pillar__line">${esc(t(p.line))}</p>
              </div>
            </li>`
          )
          .join('')}
      </ul>
    </div>`;
}
