// Practical sections after nightfall: the day ends at camp (21:15) and the clock keeps running,
// 21:30, 22:15, 23:00, 23:45, while the sky deepens. Cards are lit by a lantern under the pointer.
import { model, wireTours, wireFaq, esc, pad, tipIcon, ARROW, PLUS } from './practical-core.js';
import { fmtClock, NIGHT } from './time.js';

const TIMES = [NIGHT + 15, NIGHT + 60, NIGHT + 105, NIGHT + 150];
const REGION_COL = { riyadh: '#c88c3c', qassim: '#9aa65a', hail: '#c39ad4' };

function head(i, title, sub, id) {
  const from = i === 0 ? NIGHT : TIMES[i - 1];
  // moon climbs the sky arc as the night goes on
  const k = (i + 1) / 5;
  const a = Math.PI * (0.15 + 0.55 * k);
  const mx = (50 - 42 * Math.cos(a)).toFixed(1);
  const my = (52 - 42 * Math.sin(a)).toFixed(1);
  return `<header class="nh" data-reveal>
    <p class="nh__clock" aria-hidden="true">
      <svg class="nh__arc" viewBox="0 0 100 56"><line x1="0" y1="52" x2="100" y2="52"/><path d="M8 52A42 42 0 0 1 92 52"/><circle class="nh__moon" cx="${mx}" cy="${my}" r="7"/></svg>
      <span class="nh__time" data-from="${from}" data-to="${TIMES[i]}">${fmtClock(TIMES[i])}</span>
    </p>
    <h2 class="nt-h2 nh__title" id="${id}">${esc(title)}</h2>
    ${sub ? `<p class="nh__sub">${esc(sub)}</p>` : ''}
  </header>`;
}

function tourCard(t, m, c, L) {
  const s = m.stopBy[t.stop];
  const price = m.tourPrice(t.price);
  const meta = [t.type[L], t.organizer].filter(Boolean).map(esc).join(' · ');
  return `<li class="nc" data-tour data-stop="${t.stop}" data-region="${t.region}">
    <a class="nc__a" href="${esc(t.href[L])}" target="_blank" rel="noopener" data-lantern>
      <span class="nc__media">
        <img src="../${t.photo}" alt="" loading="lazy" decoding="async">
        <span class="nc__stop"><b>${pad(s.i + 1)}</b>${esc(s.name[L])}</span>
      </span>
      <span class="nc__body">
        <span class="nc__meta">${meta}</span>
        <span class="nc__title">${esc(t.title[L])}</span>
        <span class="nc__until">${esc(t.until[L])}</span>
        <span class="nc__foot">
          <span class="nc__price">${esc(price)}</span>
          <span class="nc__cta">${esc(c.sections.tours.cta[L])}${ARROW}</span>
        </span>
      </span>
      <span class="sr"> (${esc(m.u.newTab)})</span>
    </a>
  </li>`;
}

function stayCard(s, i, m, c, L) {
  const href = s.href && (s.href[L] || s.href);
  const inner = `
      <span class="nc__media nc__media--stay"><img src="../${s.photo}" alt="" loading="lazy" decoding="async"></span>
      <span class="nc__body">
        <span class="nc__meta"><i class="nc__sw" style="--rc:${REGION_COL[s.region]}" aria-hidden="true"></i>${esc(s.city[L])} · ${esc(m.regionBy[s.region].name[L])}</span>
        <span class="nc__title nc__title--stay">${esc(s.name[L])}</span>
        <span class="nc__tag">${esc(s.tagline[L])}</span>
        <span class="nc__desc">${esc(s.desc[L])}</span>
        <span class="nc__foot nc__foot--stay">
          <span class="nc__price">${esc(m.stayPrice(s.priceFrom))}</span>
          ${href ? `<span class="nc__cta">${esc(c.sections.tours.cta[L])}${ARROW}</span>` : `<span class="nc__soon"><i aria-hidden="true"></i>${esc(c.sections.stays.soon[L])}</span>`}
        </span>
      </span>`;
  return `<li class="nc nc--stay" data-reveal style="transition-delay:${(i % 4) * 80}ms">${href ? `<a class="nc__a" href="${esc(href)}" target="_blank" rel="noopener" data-lantern>${inner}</a>` : `<div class="nc__a" data-lantern>${inner}</div>`}</li>`;
}

export function mountNight(root, c, L, rm) {
  const m = model(c, L);
  const S = c.sections;
  const chip = (f, label, n, col) => `<button class="nchip" type="button" data-f="${f}" aria-pressed="false">${col ? `<i class="nc__sw" style="--rc:${col}" aria-hidden="true"></i>` : ''}<span>${esc(label)}</span><b>${n}</b></button>`;
  const tips = c.tips.map((t, i) => `<li class="ntip" data-reveal data-lantern style="transition-delay:${i * 80}ms">
      <span class="ntip__ic">${tipIcon(t.icon)}</span>
      <h3 class="ntip__t">${esc(t.title[L])}</h3>
      <p class="ntip__p">${esc(t.text[L])}</p>
    </li>`).join('');
  const faq = c.faq.map((f, i) => `<li class="nq" data-faq-item>
      <h3 class="nq__h"><button class="nq__btn" type="button" id="nq-b${i}" aria-controls="nq-p${i}" aria-expanded="false" data-faq-btn>
        <span class="nq__n">${pad(i + 1)}</span><span class="nq__q">${esc(f.q[L])}</span><span class="nq__ic">${PLUS}</span>
      </button></h3>
      <div class="nq__p" id="nq-p${i}" role="region" aria-labelledby="nq-b${i}"><div class="nq__clip"><p class="nq__a">${esc(f.a[L])}</p></div></div>
    </li>`).join('');

  root.innerHTML = `
  <div class="night__sky" aria-hidden="true"></div>
  <section class="ns ns--tours" aria-labelledby="ns-tours-t" data-tours-top style="--n:0">
    <div class="nt-wrap">
      ${head(0, S.tours.title[L], S.tours.sub[L], 'ns-tours-t')}
      <div class="nchips" role="group" aria-label="${esc(m.u.filter)}" data-reveal>
        <div class="nchips__row">${chip('all', m.u.all, m.total)}${m.regions.map((r) => chip('r:' + r.key, r.name, r.n, REGION_COL[r.key])).join('')}</div>
        <div class="nchips__row">${m.stops.map((s) => chip('s:' + s.key, `${pad(s.i + 1)} ${s.name}`, s.n)).join('')}</div>
      </div>
      <p class="ns__count" data-count aria-live="polite"></p>
      <ul class="nc-grid" role="list" data-reveal>${c.tours.map((t) => tourCard(t, m, c, L)).join('')}</ul>
      <div class="ns__more-row"><button class="nmore" type="button" data-more aria-expanded="false"><span data-more-label></span>${PLUS}</button></div>
    </div>
  </section>
  <section class="ns ns--stays" aria-labelledby="ns-stays-t" style="--n:1">
    <div class="nt-wrap">
      ${head(1, S.stays.title[L], S.stays.sub[L], 'ns-stays-t')}
      <ul class="nc-grid" role="list">${c.stays.map((s, i) => stayCard(s, i, m, c, L)).join('')}</ul>
    </div>
  </section>
  <section class="ns ns--tips" aria-labelledby="ns-tips-t" style="--n:2">
    <div class="nt-wrap">
      ${head(2, S.tips.title[L], '', 'ns-tips-t')}
      <ul class="ntip-grid" role="list">${tips}</ul>
    </div>
  </section>
  <section class="ns ns--faq" aria-labelledby="ns-faq-t" style="--n:3">
    <div class="nt-wrap ns__faqwrap">
      ${head(3, S.faq.title[L], '', 'ns-faq-t')}
      <ul class="nq-list" role="list" data-reveal>${faq}</ul>
    </div>
  </section>`;

  const phone = window.matchMedia('(max-width: 767px)').matches;
  wireTours(root.querySelector('.ns--tours'), { m, page: phone ? 4 : 8 });
  wireFaq(root.querySelector('.ns--faq'));

  // lantern: warm light follows the pointer over a card
  if (!rm && window.matchMedia('(hover: hover)').matches) {
    root.addEventListener('pointermove', (e) => {
      const el = e.target.closest('[data-lantern]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--lx', `${(e.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty('--ly', `${(e.clientY - r.top).toFixed(0)}px`);
    }, { passive: true });
  }

  // the clock in each header ticks forward from the previous section's time
  const clocks = [...root.querySelectorAll('.nh__time')];
  if (rm || !('IntersectionObserver' in window)) return;
  clocks.forEach((n) => { n.textContent = fmtClock(+n.dataset.from); });
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const n = en.target, a = +n.dataset.from, b = +n.dataset.to, t0 = performance.now(), dur = 1200;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      n.textContent = fmtClock(a + (b - a) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { rootMargin: '0px 0px -15% 0px' });
  clocks.forEach((n) => io.observe(n));
}
