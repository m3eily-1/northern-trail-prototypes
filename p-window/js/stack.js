// Phones and reduced motion: the drive becomes a vertical stack of car
// windows, one per stop, with light parallax (none when reduced). On desktop
// with motion it stays in the DOM, visually hidden, as the accessible list of
// stops behind the pinned scene.
import { t, esc, asset, ui, reduced, num, kmTable, clamp, rtl } from './util.js';
import { stopPlate, regionPlate } from './signs.js';

export function initStack(data) {
  const root = document.getElementById('stops');
  const stops = data.stops;
  const km = kmTable(stops);
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));
  const statStops = data.intro.stats[1];

  let lastRegion = null;
  const items = [];
  stops.forEach((s, i) => {
    if (s.region !== lastRegion) {
      lastRegion = s.region;
      const rg = regionBy[s.region];
      items.push(`<li class="pane-region" aria-hidden="true"><div class="sign sign--region sign--flat"><div class="sign__plate">${regionPlate(rg)}</div></div></li>`);
    }
    const sticker = s.sticker ? `<img class="pane__decal" src="${asset(s.sticker)}" alt="" loading="lazy" decoding="async" style="--r:${i % 2 ? 6 : -5}deg">` : '';
    items.push(`<li class="pane" data-k="${i}" style="--i:${i}">
      <div class="pane__win" aria-hidden="true">
        <div class="pane__view">
          <img class="pane__photo" src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="600" height="600">
          <i class="pane__near"></i>
          ${sticker}
          <i class="pane__glass"></i>
        </div>
      </div>
      <h3 class="pane__sign sign__plate">${stopPlate(s)}</h3>
      <div class="pane__txt">
        <p class="pane__meta"><span>${esc(ui.stopOf(s.n))}</span><i></i><span>${num(km[i])} ${esc(ui.km)}</span></p>
        <p class="pane__drive">${s.drive ? `<b>${esc(t(s.drive))}</b> ${esc(ui.fromLast)}` : `<b>${esc(ui.start)}</b>`}</p>
        <p class="pane__desc">${esc(t(s.desc))}</p>
      </div>
    </li>`);
  });

  const wrap = document.createElement('div');
  wrap.className = 'stack';
  wrap.innerHTML = `
    <div class="nt-wrap">
      <header class="stack__head">
        <p class="nt-eyebrow stack__eyebrow">${esc(ui.windowSeat)}</p>
        <h2 class="nt-h2 stack__title" id="drive-title"><span class="stack__big">${esc(statStops.value)}</span> ${esc(t(statStops.label))}</h2>
      </header>
      <div class="stack__bar" aria-hidden="true">
        <span class="mini-crank"><i></i></span>
        <span class="stack__km"><b>0</b> ${esc(ui.km)}</span>
        <span class="stack__at"></span>
      </div>
      <ol class="stack__list">${items.join('')}</ol>
    </div>`;
  root.append(wrap);

  const panes = [...wrap.querySelectorAll('.pane')];
  const kmEl = wrap.querySelector('.stack__km b');
  const atEl = wrap.querySelector('.stack__at');
  const mini = wrap.querySelector('.mini-crank i');
  let hidden = false;

  // Reveal each window as it scrolls in.
  if (!reduced && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }),
      { rootMargin: '0px 0px -8% 0px' }
    );
    panes.forEach((p) => io.observe(p));
    wrap.querySelectorAll('.pane-region').forEach((p) => io.observe(p));
  } else {
    wrap.querySelectorAll('.pane, .pane-region').forEach((p) => p.classList.add('is-in'));
  }

  // Light parallax + the sticky km bar.
  let ticking = false;
  let shown = -1;
  const update = () => {
    ticking = false;
    if (hidden) return;
    const vh = window.innerHeight;
    let at = -1;
    for (const p of panes) {
      const r = p.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) continue;
      const c = clamp((r.top + r.height / 2) / vh, -0.2, 1.2) - 0.5;
      if (!reduced) {
        p.style.setProperty('--py', (c * -18).toFixed(1) + 'px');
        p.style.setProperty('--px', (c * 120 * (rtl ? -1 : 1)).toFixed(1) + 'px');
      }
      if (r.top < vh * 0.55) at = +p.dataset.k;
    }
    if (at !== shown) {
      shown = at;
      const i = Math.max(0, at);
      kmEl.textContent = num(at < 0 ? 0 : km[i]);
      atEl.textContent = at < 0 ? '' : `${ui.stopOf(stops[i].n)}`;
      mini.style.transform = `rotate(${(at + 1) * 90 * (rtl ? -1 : 1)}deg)`;
    }
  };
  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();

  return {
    setHidden(v) {
      hidden = v;
      wrap.classList.toggle('is-sr', v);
      if (!v) onScroll();
    }
  };
}
