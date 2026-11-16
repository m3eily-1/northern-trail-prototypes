// Accommodations: campfire-lit cards. Firelight flickers up from below each
// photo. While a stay has no webook link the card is not a link and shows the
// "coming soon" status; when an href arrives it becomes a link like the tours.
import { t, esc, asset, ui, lang, num, chiselWords } from './i18n.js';

const arrow =
  '<svg viewBox="0 0 20 20" aria-hidden="true" class="tab__arrow"><path d="M3 10h13M11 4.5 16.5 10 11 15.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';

export function initStays(data) {
  const root = document.getElementById('stays');
  const S = data.sections.stays;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  const card = (s, i) => {
    const price = s.priceFrom != null ? ui.perNight(t(S.from), num(s.priceFrom), t(S.night)) : '';
    const href = s.href ? (typeof s.href === 'string' ? s.href : s.href[lang] || s.href.en) : null;
    const inner = `
      <span class="fire__photo"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="1000" height="750"><i class="fire__glow" aria-hidden="true"></i></span>
      <span class="fire__body">
        <span class="fire__where">${esc(t(s.city))}<span aria-hidden="true" class="tab__dot"></span>${esc(t(regionBy[s.region]?.name))}</span>
        <h3 class="fire__name">${esc(t(s.name))}</h3>
        <span class="fire__tag">${esc(t(s.tagline))}</span>
        <span class="fire__desc">${esc(t(s.desc))}</span>
        <span class="fire__foot">
          <span class="fire__price">${price ? esc(price) : ''}</span>
          ${
            href
              ? `<span class="tab__cta">${esc(t(data.sections.tours.cta))}${arrow}<span class="sr">, ${esc(ui.newTab)}</span></span>`
              : `<span class="fire__soon"><i class="fire__ember" aria-hidden="true"></i><span>${esc(t(S.soon))}</span></span>`
          }
        </span>
      </span>`;
    return `<li class="fire" style="--i:${i}">${
      href ? `<a class="fire__in" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="fire__in">${inner}</div>`
    }</li>`;
  };

  root.innerHTML = `
    <div class="nt-wrap">
      <header class="pr__head">
        <h2 class="h2" id="stays-title" data-chisel>${esc(t(S.title))}</h2>
        <p class="pr__sub" data-words>${chiselWords(t(S.sub))}</p>
      </header>
      <ul class="fires" tabindex="0" aria-labelledby="stays-title" data-stagger>${data.stays.map(card).join('')}</ul>
    </div>`;
}
