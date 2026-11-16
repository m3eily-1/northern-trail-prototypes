// The 16 stops: DOM placeholders for the WebGL photo planes, text beside each plane
// (alternating sides, mirrored in RTL by the grid), stickers with parallax, progress indicator.
import { env, t, L, asset, pad2, esc, maskWords, onEnter, tick } from './util.js';

export function renderStops(section, data, nav) {
  const regions = Object.fromEntries(data.regions.map((r) => [r.key, r]));
  const total = data.stops.length;
  // Salma is a Hail landmark sticker without its own stop: it floats beside the Hail region header.
  const regionSticker = { hail: data.stickers.salma };
  let html = '<div class="nt-wrap stops__wrap">';
  let lastRegion = null;
  let side = 0;

  data.stops.forEach((s) => {
    if (s.region !== lastRegion) {
      lastRegion = s.region;
      const r = regions[s.region];
      html += `
        <header class="region" data-region-head="${s.region}">
          <p class="region__count">${esc(t(r.count))}</p>
          <h2 class="region__name">${maskWords(t(r.name))}</h2>
          ${regionSticker[s.region] ? `<img class="sticker region__sticker" data-speed="-0.06" src="${asset(regionSticker[s.region])}" alt="" width="449" height="480" loading="lazy">` : ''}
        </header>`;
      side = 0;
    }
    const drive = s.drive
      ? `<p class="stop__drive"><span class="stop__drive-v">${esc(t(s.drive))}</span> <span class="stop__drive-l">${t(L.fromPrev)}</span></p>`
      : `<p class="stop__drive"><span class="stop__drive-v">${t(L.start)}</span></p>`;
    html += `
      <article class="stop ${side % 2 ? 'stop--b' : 'stop--a'}" data-stop="${s.n}" data-region="${s.region}" aria-labelledby="stop-${s.n}">
        <div class="stop__media">
          <div class="stop__plane" data-gl-stop>
            <img class="stop__img" src="${asset(s.photo)}" alt="${esc(t(s.name))}" crossorigin="anonymous" decoding="async">
          </div>
          ${s.sticker ? `<img class="sticker stop__sticker" data-speed="${side % 2 ? '-0.07' : '-0.09'}" src="${asset(s.sticker)}" alt="" loading="lazy">` : ''}
        </div>
        <div class="stop__text">
          <p class="stop__num"><span class="stop__n">${pad2(s.n)}</span><span class="stop__of">/ ${total}</span></p>
          <h3 class="stop__name" id="stop-${s.n}">${maskWords(t(s.name))}</h3>
          ${drive}
          <p class="stop__desc">${esc(t(s.desc))}</p>
        </div>
      </article>`;
    side++;
  });
  html += '</div>';
  section.innerHTML = html;

  const stopEls = section.querySelectorAll('.stop');
  // Reveal trigger shared by DOM text and the GL plane (plane reads data-in).
  onEnter(stopEls, (n) => { n.querySelector('[data-gl-stop]').dataset.in = '1'; }, { rootMargin: '0px 0px -20% 0px' });
  onEnter(section.querySelectorAll('.region'), null, { rootMargin: '0px 0px -15% 0px' });

  setupProgress(nav, section, data, regions, total);
  setupParallax(section);
}

function setupProgress(nav, section, data, regions, total) {
  nav.innerHTML = `
    <p class="prog__count"><span class="prog__label">${t(L.stop)}</span> <span class="prog__n" data-prog-n>01</span><span class="prog__of">/ ${total}</span></p>
    <ol class="prog__ticks">${data.stops.map((s) => `<li data-tick="${s.n}" data-r="${s.region}"></li>`).join('')}</ol>
    <p class="prog__region" data-prog-region></p>`;
  const regEl = nav.querySelector('[data-prog-region]');
  const nEl = nav.querySelector('[data-prog-n]');
  const ticks = nav.querySelectorAll('[data-tick]');
  const set = (n) => {
    const s = data.stops[n - 1];
    regEl.textContent = t(regions[s.region].name);
    nEl.textContent = pad2(n);
    ticks.forEach((tk, i) => tk.classList.toggle('on', i < n));
  };
  set(1);
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) set(+e.target.dataset.stop); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  section.querySelectorAll('.stop').forEach((n) => io.observe(n));
  new IntersectionObserver(([e]) => nav.classList.toggle('is-on', e.isIntersecting), { rootMargin: '-40% 0px -40% 0px' }).observe(section);
}

// Stickers drift against the scroll. Transform only, rAF with timer fallback, idle when not scrolling.
function setupParallax(section) {
  if (env.reduced) return;
  const items = Array.from(section.querySelectorAll('.sticker'));
  let queued = false;
  const update = () => {
    queued = false;
    const vh = window.innerHeight;
    const f = env.phone() ? 0.5 : 1;
    const rects = items.map((n) => n.parentElement.getBoundingClientRect());
    items.forEach((n, i) => {
      const r = rects[i];
      if (r.bottom < -200 || r.top > vh + 200) return;
      const c = r.top + r.height / 2 - vh / 2;
      n.style.setProperty('--py', `${(c * parseFloat(n.dataset.speed) * f).toFixed(1)}px`);
    });
  };
  const onScroll = () => { if (!queued) { queued = true; tick(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
