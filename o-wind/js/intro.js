// Intro (what the trail is + four stats) and the three pillars. Headlines and
// stat figures are made of sand that blows off; pillar art is buried in grains
// sampled from the illustration's own silhouette.
import { t, esc, asset, lang, isPhone, inview } from './i18n.js';
import { bury } from './cover.js';
import { dunes } from './dunes.js';

export function initIntro(data) {
  const root = document.getElementById('intro');
  const I = data.intro;
  root.innerHTML = `
    <div class="nt-wrap intro__wrap">
      <div class="intro__head">
        <h2 class="o-h2 intro__title sand-text" id="intro-title">${esc(t(I.title))}</h2>
        <p class="intro__body reveal">${esc(t(I.body))}</p>
      </div>
      <ul class="stats">
        ${I.stats
          .map(
            (s, i) => `<li class="stat reveal" style="--i:${i}">
              <p class="stat__v sand-text"><span class="stat__n">${esc(s.value)}</span>${s.unit ? `<span class="stat__u">${esc(t(s.unit))}</span>` : ''}</p>
              <p class="stat__l">${esc(t(s.label))}</p>
            </li>`
          )
          .join('')}
      </ul>
    </div>`;

  root.querySelectorAll('.sand-text').forEach((el, i) => bury(el, { kind: 'text', rate: i ? 0.55 : 0.45, startAt: 0.86 }));
  root.querySelectorAll('.reveal').forEach((el) => inview(el));
}

export function initPillars(data) {
  const root = document.getElementById('pillars');
  root.setAttribute('aria-label', lang === 'ar' ? 'ركائز المسار' : 'Pillars of the trail');
  root.innerHTML = `
    <div class="nt-wrap">
      <ul class="pillars__list">
        ${data.pillars
          .map(
            (p, i) => `<li class="pillar" style="--c:${p.color};--i:${i}">
              <div class="pillar__art"><img src="${asset(p.art)}" alt="" width="640" height="555" decoding="async"></div>
              <div class="pillar__txt reveal">
                <p class="pillar__n">${String(i + 1).padStart(2, '0')}</p>
                <h3 class="pillar__name">${esc(t(p.name))}</h3>
                <p class="pillar__line">${esc(t(p.line))}</p>
              </div>
            </li>`
          )
          .join('')}
      </ul>
    </div>
    ${dunes(
      [
        { seed: 51, fill: 'rgba(200,140,60,0.35)', depth: 1, lo: 0.35, hi: 0.85, n: 3 },
        { seed: 63, fill: 'rgba(200,140,60,0.6)', depth: 0.5, lo: 0.25, hi: 0.6, n: 4 },
        { seed: 71, fill: 'var(--o-dune)', depth: 0, lo: 0.1, hi: 0.35, n: 5 }
      ],
      'dunes--stops'
    )}`;

  root.querySelectorAll('.pillar').forEach((li, i) => {
    const art = li.querySelector('.pillar__art');
    const img = art.querySelector('img');
    bury(art, { kind: 'image', img, rate: 0.5, startAt: 0.8, cell: isPhone() ? 3 : 2, palette: 'sand' });
    inview(li.querySelector('.reveal'));
    void i;
  });
}
