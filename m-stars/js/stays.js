// Accommodations as night camps marked on a small route chart. Hovering an entry
// lights its camp on the chart and the other way round. Links stay off until
// webook sends them (href null shows the "coming soon" status, no link).
import { t, esc, asset, lang, ui, pad2, num } from './i18n.js';
import { compactMQ, reveal, splitWords, starGlyph, arrowIcon } from './util.js';
import { makeProjection } from './sky.js';

export function initStays(data) {
  const root = document.getElementById('stays');
  const S = data.sections.stays;
  const stays = data.stays;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  // Chart geometry: fit the stops and the stays together.
  const all = [...data.stops, ...stays];
  const P = makeProjection(all);
  const VW = 640;
  const VH = 460;
  const pad = 44;
  const sc = Math.min((VW - pad * 2) / P.w, (VH - pad * 2) / P.h);
  const at = (lat, lng) => {
    const p = P.project(lat, lng);
    return [VW / 2 + p.x * sc, VH / 2 + p.y * sc];
  };
  const route = data.stops.map((s) => at(s.lat, s.lng));
  let grat = '';
  for (let lat = 25; lat <= 28; lat++) {
    const y = VH / 2 + P.yAtLat(lat) * sc;
    grat += `<line x1="0" y1="${y.toFixed(1)}" x2="${VW}" y2="${y.toFixed(1)}"/><text x="6" y="${(y - 5).toFixed(1)}">${lat}°${ui.N}</text>`;
  }
  for (let lng = 41; lng <= 46; lng++) {
    const x = VW / 2 + P.xAtLng(lng) * sc;
    grat += `<line x1="${x.toFixed(1)}" y1="0" x2="${x.toFixed(1)}" y2="${VH}"/><text x="${(x + 5).toFixed(1)}" y="${VH - 8}">${lng}°${ui.E}</text>`;
  }
  // Camp labels: push numbers apart when camps sit close together.
  const camps = stays.map((s) => at(s.lat, s.lng));
  const labels = camps.map((p) => [p[0] + 12, p[1] - 10]);
  for (let pass = 0; pass < 40; pass++) {
    for (let a = 0; a < labels.length; a++)
      for (let b = a + 1; b < labels.length; b++) {
        const dx = labels[b][0] - labels[a][0];
        const dy = labels[b][1] - labels[a][1];
        if (Math.abs(dx) < 22 && Math.abs(dy) < 15) {
          const push = (15 - Math.abs(dy)) / 2 + 0.5;
          const sgn = dy >= 0 ? 1 : -1;
          labels[a][1] -= push * sgn;
          labels[b][1] += push * sgn;
        }
      }
  }
  const svg = `<svg class="sy__svg" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${esc(t(S.title))}">
    <g class="sy__grat" aria-hidden="true">${grat}</g>
    <path class="sy__route" d="${route.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}" pathLength="1"/>
    <g class="sy__stops" aria-hidden="true">${route.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === 0 || i === route.length - 1 ? 4 : 2.6}"/>`).join('')}</g>
    <g class="sy__camps">${camps
      .map(
        (p, i) => `<g class="camp" data-i="${i}" style="--k:${i}">
          <line class="camp__lead" x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${(labels[i][0] - 2).toFixed(1)}" y2="${(labels[i][1] + 1).toFixed(1)}"/>
          <circle class="camp__ring" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="16"/>
          <path class="camp__tri" d="M${p[0].toFixed(1)} ${(p[1] - 7).toFixed(1)} l6.5 11 h-13 z"/>
          <text class="camp__n" x="${labels[i][0].toFixed(1)}" y="${labels[i][1].toFixed(1)}">${pad2(i + 1)}</text>
        </g>`
      )
      .join('')}</g>
  </svg>`;

  const price = (p) => (p == null ? '' : `${t(S.from)} ${lang === 'ar' ? `${num(p)} ر.س` : `SAR ${num(p)}`} ${t(S.night)}`);
  const clock =
    '<svg class="sy-card__clock" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10 6v4l2.6 1.8" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square"/></svg>';

  const card = (s, i) => {
    const href = s.href && (typeof s.href === 'string' ? s.href : s.href[lang] || s.href.en);
    const where = `${esc(t(s.city))}<span class="sy-card__sep" aria-hidden="true"></span>${esc(t(regionBy[s.region]?.name))}`;
    const foot = href
      ? `<span class="sy-card__cta">${esc(t(data.sections.tours.cta))}${arrowIcon()}<span class="m-sr">, ${esc(ui.newTab)}</span></span>`
      : `<span class="sy-card__soon">${clock}<span>${esc(t(S.soon))}</span></span>`;
    const inner = (tag) => `
      <span class="sy-card__photo"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="1000" height="750"></span>
      <span class="sy-card__body">
        <span class="sy-card__top"><span class="sy-card__n">${esc(ui.stayN(i + 1))}</span><span class="sy-card__where">${where}</span></span>
        <${tag} class="sy-card__name">${esc(t(s.name))}</${tag}>
        <span class="sy-card__tag">${esc(t(s.tagline))}</span>
        <span class="sy-card__desc">${esc(t(s.desc))}</span>
        <span class="sy-card__foot"><span class="sy-card__price">${esc(price(s.priceFrom))}</span>${foot}</span>
      </span>`;
    return `<li class="sy-card" data-i="${i}">${
      href ? `<a class="sy-card__in" href="${esc(href)}" target="_blank" rel="noopener">${inner('span')}</a>` : `<div class="sy-card__in">${inner('h3')}</div>`
    }</li>`;
  };

  root.innerHTML = `
    <div class="nt-wrap">
      <header class="px__head">
        <p class="m-eyebrow" data-r>${starGlyph()}<span>${esc(ui.camps)}</span></p>
        <h2 class="m-h2 m-split" id="stays-title">${esc(t(S.title))}</h2>
        <p class="px__sub" data-r>${esc(t(S.sub))}</p>
      </header>
      <div class="sy">
        <figure class="sy__chart">
          <span class="m-corners" aria-hidden="true"></span>
          ${svg}
          <figcaption class="sy__legend">
            <span class="sy__key"><i class="sy__key-stop" aria-hidden="true"></i>${esc(ui.legendStop)}</span>
            <span class="sy__key"><i class="sy__key-camp" aria-hidden="true"></i>${esc(ui.legendCamp)}</span>
          </figcaption>
        </figure>
        <ol class="sy__list">${stays.map(card).join('')}</ol>
      </div>
    </div>`;

  const h2 = root.querySelector('h2');
  splitWords(h2);
  reveal(h2);
  root.querySelectorAll('[data-r]').forEach((el) => reveal(el));
  const chart = root.querySelector('.sy__chart');
  reveal(chart);
  const items = [...root.querySelectorAll('.sy-card')];
  items.forEach((el) => reveal(el));
  const marks = [...root.querySelectorAll('.camp')];

  const light = (i) => {
    marks.forEach((m, k) => m.classList.toggle('is-on', k === i));
    items.forEach((m, k) => m.classList.toggle('is-on', k === i));
    chart.classList.toggle('has-on', i >= 0);
  };
  items.forEach((el, i) => {
    el.addEventListener('pointerenter', () => light(i));
    el.addEventListener('pointerleave', () => light(-1));
    el.addEventListener('focusin', () => light(i));
    el.addEventListener('focusout', () => light(-1));
  });
  marks.forEach((m, i) => {
    m.addEventListener('pointerenter', () => light(i));
    m.addEventListener('pointerleave', () => light(-1));
    m.addEventListener('click', () => {
      if (compactMQ.matches) items[i].scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  });
}
