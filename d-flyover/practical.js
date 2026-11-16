// Practical sections for the flyover: the map's pin + HUD language, DOM only (the 3D stage has ended).
import { model, wireTours, wireFaq, esc, pad, tipIcon, ARROW, PLUS, coord } from './practical-core.js';

const clock = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17"/><path d="M12 7.5V12l3 2"/></svg>';

function head(idx, title, sub, id) {
  return `<header class="pr-head" data-reveal>
    <p class="pr-hud"><span class="pr-hud__x" aria-hidden="true"></span><span class="pr-hud__n">${pad(idx)}</span><span class="pr-hud__of">/ 04</span></p>
    <h2 class="nt-h2 pr-title" id="${id}">${esc(title)}</h2>
    ${sub ? `<p class="pr-sub">${esc(sub)}</p>` : ''}
  </header>`;
}

function tourCard(t, m, c, L) {
  const s = m.stopBy[t.stop];
  const price = m.tourPrice(t.price);
  const meta = [t.type[L], t.organizer].filter(Boolean).map(esc).join('<span class="pr-dot" aria-hidden="true"></span>');
  return `<li class="dt" data-tour data-stop="${t.stop}" data-region="${t.region}">
    <a class="dt__a" href="${esc(t.href[L])}" target="_blank" rel="noopener">
      <span class="dt__media">
        <img src="../${t.photo}" alt="" loading="lazy" decoding="async" width="600" height="450">
        <span class="dt__pin"><b>${pad(s.i + 1)}</b><span>${esc(s.name[L])}</span></span>
        <span class="dt__ll" dir="ltr">${coord(s.lat, s.lng)}</span>
        <span class="lock" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </span>
      <span class="dt__body">
        <span class="dt__meta">${meta}</span>
        <span class="dt__title">${esc(t.title[L])}</span>
        <span class="dt__until">${clock}${esc(t.until[L])}</span>
        <span class="dt__foot">
          <span class="dt__price">${esc(price)}</span>
          <span class="dt__cta">${esc(c.sections.tours.cta[L])}${ARROW}</span>
        </span>
      </span>
      <span class="sr-only"> (${esc(m.u.newTab)})</span>
    </a>
  </li>`;
}

function stayCard(s, m, c, L) {
  const price = m.stayPrice(s.priceFrom);
  const region = m.regionBy[s.region];
  const inner = `
      <span class="ds__media">
        <img src="../${s.photo}" alt="" loading="lazy" decoding="async" width="800" height="600">
        <span class="ds__ll" dir="ltr">${coord(s.lat, s.lng)}</span>
        <span class="lock" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </span>
      <span class="ds__body">
        <span class="ds__where"><span class="ds__sq" data-region="${s.region}" aria-hidden="true"></span>${esc(s.city[L])}<span class="pr-dot" aria-hidden="true"></span>${esc(region.name[L])}</span>
        <span class="ds__name">${esc(s.name[L])}</span>
        <span class="ds__tag">${esc(s.tagline[L])}</span>
        <span class="ds__desc">${esc(s.desc[L])}</span>
        <span class="ds__foot">
          <span class="ds__price">${esc(price)}</span>
          ${s.href ? `<span class="dt__cta">${esc(c.sections.tours.cta[L])}${ARROW}</span>` : `<span class="ds__soon"><i aria-hidden="true"></i>${esc(c.sections.stays.soon[L])}</span>`}
        </span>
      </span>`;
  const href = s.href && (s.href[L] || s.href);
  return `<li class="ds${href ? ' ds--link' : ''}" data-reveal>${href ? `<a class="ds__a" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="ds__a">${inner}</div>`}</li>`;
}

export function practicalHTML(c, L) {
  const m = model(c, L);
  const S = c.sections;
  const regionBtns = m.regions.map((r) => `<button class="fpin fpin--region" type="button" data-f="r:${r.key}" aria-pressed="false"><span class="fpin__sw" data-region="${r.key}" aria-hidden="true"></span><span class="fpin__t">${esc(r.name)}</span><span class="fpin__n">${r.n}</span></button>`).join('');
  const stopBtns = m.stops.map((s) => `<button class="fpin" type="button" data-f="s:${s.key}" aria-pressed="false"><b class="fpin__b">${pad(s.i + 1)}</b><span class="fpin__t">${esc(s.name)}</span><span class="fpin__n">${s.n}</span></button>`).join('');
  const tips = c.tips.map((t, i) => `<li class="dtip" data-reveal style="--d:${i}">
      <span class="dtip__ic">${tipIcon(t.icon)}</span>
      <span class="dtip__n">${pad(i + 1)}</span>
      <h3 class="dtip__t">${esc(t.title[L])}</h3>
      <p class="dtip__p">${esc(t.text[L])}</p>
    </li>`).join('');
  const faq = c.faq.map((f, i) => `<li class="dq" data-faq-item>
      <h3 class="dq__h"><button class="dq__btn" type="button" id="dq-b${i}" aria-controls="dq-p${i}" aria-expanded="false" data-faq-btn>
        <span class="dq__n">${pad(i + 1)}</span><span class="dq__q">${esc(f.q[L])}</span><span class="dq__ic">${PLUS}</span>
      </button></h3>
      <div class="dq__p" id="dq-p${i}" role="region" aria-labelledby="dq-b${i}"><div class="dq__clip"><p class="dq__a">${esc(f.a[L])}</p></div></div>
    </li>`).join('');

  return `
  <section class="pr-sec pr-tours" aria-labelledby="pr-tours-t" data-tours-top>
    <div class="nt-wrap">
      ${head(1, S.tours.title[L], S.tours.sub[L], 'pr-tours-t')}
      <div class="fbar" role="group" aria-label="${esc(m.u.filter)}" data-reveal>
        <div class="fbar__row">
          <button class="fpin fpin--all" type="button" data-f="all" aria-pressed="true"><span class="fpin__t">${m.u.all}</span><span class="fpin__n">${m.total}</span></button>
          ${regionBtns}
        </div>
        <div class="fbar__row fbar__route"><span class="fbar__line" aria-hidden="true"></span>${stopBtns}</div>
      </div>
      <p class="pr-count" data-count aria-live="polite"></p>
      <ul class="dt-grid" role="list">${c.tours.map((t) => tourCard(t, m, c, L)).join('')}</ul>
      <div class="pr-more-row"><button class="pr-more" type="button" data-more aria-expanded="false"><span data-more-label></span>${PLUS}</button></div>
    </div>
  </section>
  <section class="pr-sec pr-stays" aria-labelledby="pr-stays-t">
    <div class="nt-wrap">
      ${head(2, S.stays.title[L], S.stays.sub[L], 'pr-stays-t')}
      <ul class="ds-grid" role="list">${c.stays.map((s) => stayCard(s, m, c, L)).join('')}</ul>
    </div>
  </section>
  <section class="pr-sec pr-tips" aria-labelledby="pr-tips-t">
    <div class="nt-wrap">
      ${head(3, S.tips.title[L], '', 'pr-tips-t')}
      <ul class="dtip-grid" role="list">${tips}</ul>
    </div>
  </section>
  <section class="pr-sec pr-faq" aria-labelledby="pr-faq-t">
    <div class="nt-wrap pr-faq__wrap">
      ${head(4, S.faq.title[L], '', 'pr-faq-t')}
      <ul class="dq-list" role="list" data-reveal>${faq}</ul>
    </div>
  </section>`;
}

export function mountPractical(root, c, L) {
  root.innerHTML = practicalHTML(c, L);
  const m = model(c, L);
  const phone = window.matchMedia('(max-width: 767px)').matches;
  wireTours(root.querySelector('.pr-tours'), { m, page: phone ? 4 : 8 });
  wireFaq(root.querySelector('.pr-faq'));
}
