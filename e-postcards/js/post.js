// Practical sections as the postal desk: tours are postcards with the price as the stamp,
// filters are luggage tags, stays are hotel labels, tips are a sheet of stamps, FAQ are letters.
import { asset, L, isRTL, reduced, postmarkSVG, dateLine, fitRings, REGION_COLOR, onVisible } from './util.js';
import { model, wireTours, wireFaq, esc, pad, tipIcon, ARROW } from './practical-core.js';

const lang = isRTL ? 'ar' : 'en';
const TILT = [-0.8, 0.6, -0.4, 0.9, -0.6, 0.5, -0.9, 0.4];
const ENV = '<svg class="pq__env" viewBox="0 0 32 24" aria-hidden="true" focusable="false"><rect x="1" y="1" width="30" height="22" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="pq__flap" d="M1 1l15 11L31 1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="miter"/></svg>';

function head(title, sub, id, ring, n) {
  return `<header class="ph" data-reveal>
    <div class="ph__text">
      <h2 class="nt-h2 ph__title" id="${id}">${esc(title)}</h2>
      ${sub ? `<p class="ph__sub">${esc(sub)}</p>` : ''}
    </div>
    <span class="ph__pm" aria-hidden="true">${postmarkSVG({ ring, mid: pad(n), sub: dateLine() })}</span>
  </header>`;
}

function stampPrice(m, p) {
  const label = m.tourPrice(p);
  if (!label) return '<span class="pt__stamp pt__stamp--blank" aria-hidden="true"></span>';
  const free = p === 0;
  return `<span class="pt__stamp" aria-hidden="true"><span class="stamp__paper" style="--stamp:var(--nt-sand-dark)">
      ${free ? `<span class="pt__val">${esc(label)}</span>` : `<span class="pt__from">${isRTL ? 'تبدأ من' : 'From'}</span><span class="pt__val">${Number(p).toLocaleString('en-US')}</span><span class="pt__cur">${isRTL ? 'ر.س' : 'SAR'}</span>`}
    </span></span>`;
}

function tourCard(tr, i, m, c) {
  const s = m.stopBy[tr.stop];
  const price = m.tourPrice(tr.price);
  const meta = [tr.type[lang], tr.organizer].filter(Boolean).map(esc).join(' · ');
  const ringName = isRTL ? s.name.ar : s.name.en.toUpperCase();
  return `<li class="pt" data-tour data-stop="${tr.stop}" data-region="${tr.region}" style="--tilt:${TILT[i % TILT.length]}deg">
    <a class="pt__a" href="${esc(tr.href[lang])}" target="_blank" rel="noopener">
      <span class="pt__photo">
        <img src="${asset(tr.photo)}" alt="" loading="lazy" decoding="async" draggable="false">
        <span class="pt__place">${esc(s.name[lang])}</span>
        ${stampPrice(m, tr.price)}
        <span class="pt__pm" aria-hidden="true">${postmarkSVG({ ring: `${ringName} • ${isRTL ? L.trail : L.trail.toUpperCase()}`, mid: pad(s.i + 1), sub: dateLine() })}</span>
      </span>
      <span class="pt__body">
        <span class="pt__meta">${meta}</span>
        <span class="pt__title">${esc(tr.title[lang])}</span>
        <span class="pt__until">${esc(tr.until[lang])}</span>
        <span class="pt__foot">
          <span class="sr-only">${esc(price)}</span>
          <span class="pt__cta">${esc(c.sections.tours.cta[lang])}${ARROW}</span>
        </span>
      </span>
      <span class="sr-only"> (${esc(m.u.newTab)})</span>
    </a>
  </li>`;
}

function stayCard(s, i, m, c) {
  const price = m.stayPrice(s.priceFrom);
  const href = s.href && (s.href[lang] || s.href);
  const inner = `
      <span class="pl__photo"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" draggable="false"></span>
      <span class="pl__label">
        <span class="pl__where" style="--tone:${REGION_COLOR[s.region]}"><i aria-hidden="true"></i>${esc(s.city[lang])} · ${esc(m.regionBy[s.region].name[lang])}</span>
        <span class="pl__name">${esc(s.name[lang])}</span>
        <span class="pl__tag">${esc(s.tagline[lang])}</span>
        <span class="pl__desc">${esc(s.desc[lang])}</span>
        <span class="pl__foot">
          <span class="pl__price">${esc(price)}</span>
          ${href ? `<span class="pt__cta">${esc(c.sections.tours.cta[lang])}${ARROW}</span>` : `<span class="pl__soon">${esc(c.sections.stays.soon[lang])}</span>`}
        </span>
      </span>`;
  return `<li class="pl" data-reveal style="--d:${i % 4};--tilt:${TILT[(i + 3) % TILT.length]}deg">${href ? `<a class="pl__a" href="${esc(href)}" target="_blank" rel="noopener">${inner}</a>` : `<div class="pl__a">${inner}</div>`}</li>`;
}

export function mountPost(root, c) {
  const m = model(c, lang);
  const S = c.sections;
  const tag = (f, label, n, tone) => `<button class="ptag" type="button" data-f="${f}" aria-pressed="false"${tone ? ` style="--tone:${tone}"` : ''}><span class="ptag__hole" aria-hidden="true"></span><span class="ptag__t">${esc(label)}</span><span class="ptag__n">${n}</span></button>`;
  const tips = c.tips.map((tp, i) => `<li class="ps" data-reveal style="--d:${i};--tone:${['var(--nt-sand-dark)', 'var(--nt-green)', 'var(--nt-sand)', 'var(--nt-lavender)', 'var(--nt-gray)'][i % 5]}">
      <span class="ps__stamp" aria-hidden="true"><span class="stamp__paper" style="--stamp:var(--tone)">${tipIcon(tp.icon, 'ps__ic')}<span class="ps__no">${pad(i + 1)}</span></span></span>
      <span class="ps__text"><h3 class="ps__t">${esc(tp.title[lang])}</h3><p class="ps__p">${esc(tp.text[lang])}</p></span>
    </li>`).join('');
  const faq = c.faq.map((f, i) => `<li class="pq" data-faq-item>
      <h3 class="pq__h"><button class="pq__btn" type="button" id="pq-b${i}" aria-controls="pq-p${i}" aria-expanded="false" data-faq-btn>
        <span class="pq__no">${isRTL ? 'رقم' : 'No.'} ${pad(i + 1)}</span><span class="pq__q">${esc(f.q[lang])}</span>${ENV}
      </button></h3>
      <div class="pq__p" id="pq-p${i}" role="region" aria-labelledby="pq-b${i}"><div class="pq__clip"><p class="pq__a">${esc(f.a[lang])}</p></div></div>
    </li>`).join('');
  const ring = (s) => (isRTL ? `${s} • ${L.trail}` : `${s.toUpperCase()} • ${L.trail.toUpperCase()}`);

  root.innerHTML = `
  <section class="pp pp--tours" aria-labelledby="pp-tours-t" data-tours-top>
    <div class="nt-wrap">
      ${head(S.tours.title[lang], S.tours.sub[lang], 'pp-tours-t', ring(isRTL ? 'جولات' : 'Tours'), 1)}
      <div class="ptags" role="group" aria-label="${esc(m.u.filter)}" data-reveal>
        <div class="ptags__row">${tag('all', m.u.all, m.total)}${m.regions.map((r) => tag('r:' + r.key, r.name, r.n, REGION_COLOR[r.key])).join('')}</div>
        <div class="ptags__row">${m.stops.map((s) => tag('s:' + s.key, s.name, s.n, REGION_COLOR[s.region])).join('')}</div>
      </div>
      <p class="pp__count" data-count aria-live="polite"></p>
      <ul class="pt-grid" role="list" data-reveal>${c.tours.map((tr, i) => tourCard(tr, i, m, c)).join('')}</ul>
      <div class="pp__more-row"><button class="nt-btn pp__more" type="button" data-more aria-expanded="false"><span data-more-label></span></button></div>
    </div>
  </section>
  <section class="pp pp--stays" aria-labelledby="pp-stays-t">
    <div class="nt-wrap">
      ${head(S.stays.title[lang], S.stays.sub[lang], 'pp-stays-t', ring(isRTL ? 'إقامة' : 'Stays'), 2)}
      <ul class="pl-grid" role="list">${c.stays.map((s, i) => stayCard(s, i, m, c)).join('')}</ul>
    </div>
  </section>
  <section class="pp pp--tips" aria-labelledby="pp-tips-t">
    <div class="nt-wrap">
      ${head(S.tips.title[lang], '', 'pp-tips-t', ring(isRTL ? 'نصائح' : 'Tips'), 3)}
      <ul class="ps-sheet" role="list">${tips}</ul>
    </div>
  </section>
  <section class="pp pp--faq" aria-labelledby="pp-faq-t">
    <div class="nt-wrap pp__faqwrap">
      ${head(S.faq.title[lang], '', 'pp-faq-t', ring(isRTL ? 'أسئلة' : 'Questions'), 4)}
      <ul class="pq-list" role="list" data-reveal>${faq}</ul>
    </div>
  </section>`;

  const phone = window.matchMedia('(max-width: 767px)').matches;
  wireTours(root.querySelector('.pp--tours'), { m, page: phone ? 4 : 8 });
  wireFaq(root.querySelector('.pp--faq'));
  document.fonts.ready.then(() => fitRings(root));

  const els = [...root.querySelectorAll('[data-reveal]')];
  if (reduced || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-revealed')); return; }
  els.forEach((e) => onVisible(e, () => e.classList.add('is-revealed'), { rootMargin: '0px 0px -10% 0px' }));
}
