// Rest stop, part 2: places to stay as roadside motel and camp signs. While a
// stay has no webook link yet, its bulbs stay unlit and it shows the quiet
// "coming soon" line instead of a CTA.
import { t, esc, asset, ui, lang, num, icons, splitWords, inview } from './util.js';

export function initStays(data) {
  const root = document.getElementById('stays');
  const S = data.sections.stays;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  const price = (s) =>
    s.priceFrom == null ? '' : `${t(S.from)} ${lang === 'ar' ? `${num(s.priceFrom)} ر.س` : `SAR ${num(s.priceFrom)}`} ${t(S.night)}`;

  const card = (s, i) => {
    const href = s.href ? (typeof s.href === 'string' ? s.href : s.href[lang] || s.href.en) : null;
    const inner = `
      <div class="st__sign">
        <span class="st__bulbs" aria-hidden="true">${'<i></i>'.repeat(9)}</span>
        <h3 class="st__name">${esc(t(s.name))}</h3>
        <span class="st__where">${esc(t(s.city))}<i aria-hidden="true"></i>${esc(t(regionBy[s.region]?.name))}</span>
      </div>
      <i class="st__poles" aria-hidden="true"></i>
      <span class="st__photo"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="1000" height="750"></span>
      <span class="st__body">
        <span class="st__tag">${esc(t(s.tagline))}</span>
        <span class="st__desc">${esc(t(s.desc))}</span>
      </span>
      <span class="st__foot">
        <span class="st__price">${esc(price(s))}</span>
        ${
          href
            ? `<span class="st__cta">${esc(t(data.sections.tours.cta))}${icons.ext}<span class="sr-only">, ${esc(ui.newTab)}</span></span>`
            : `<span class="st__soon"><i aria-hidden="true"></i>${esc(t(S.soon))}</span>`
        }
      </span>`;
    return `<li class="st${href ? ' is-linked' : ''}" style="--i:${i}">${
      href ? `<a class="st__in" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="st__in">${inner}</div>`
    }</li>`;
  };

  root.innerHTML = `
    <div class="nt-wrap">
      <header class="pr__head">
        <p class="nt-eyebrow pr__eyebrow">${esc(ui.overnight)}</p>
        <h2 class="nt-h2 pr__title" id="stays-title">${esc(t(S.title))}</h2>
        <p class="pr__sub">${esc(t(S.sub))}</p>
      </header>
      <ul class="st-list">${data.stays.map(card).join('')}</ul>
      <p class="swipe-hint" aria-hidden="true">${esc(ui.swipe)}${icons.arrow}</p>
    </div>`;

  splitWords(root.querySelector('.pr__title'));
  inview(root.querySelector('.pr__head'));
  inview(root.querySelector('.st-list'), '0px 0px -10% 0px');
}
