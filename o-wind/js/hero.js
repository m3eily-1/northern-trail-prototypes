// Hero + loading moment. The page opens on a field of rippled sand with the
// logo and a counter. When the film can play, a gust lifts the sand off and
// the film emerges underneath; the title then rises line by line.
import { t, ui, esc, asset, reduced, isPhone, finePointer, arrowSvg } from './i18n.js';
import { bury } from './cover.js';
import { gustBoost } from './wind.js';
import { puff } from './particles.js';
import { dunes } from './dunes.js';

export function initHero(data) {
  const root = document.getElementById('hero');
  const phone = isPhone();
  const words = t(data.hero.title)
    .split(/\s+/)
    .map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`)
    .join(' ');

  root.innerHTML = `
    <div class="hero__stage">
      <div class="hero__film">
        <video class="hero__video" muted playsinline loop preload="auto"
          poster="${asset(data.film.poster)}"
          src="${asset(phone ? data.film.mobile : data.film.desktop)}"></video>
        <div class="hero__scrim" aria-hidden="true"></div>
      </div>
      <div class="hero__top nt-wrap">
        <img class="hero__logo" src="${asset(data.logo.cream)}" alt="${esc(t({ en: 'Northern Trail', ar: 'مسار الشمال' }))}" width="296" height="165">
        <button class="hero__pause" type="button"></button>
      </div>
      <div class="hero__copy nt-wrap">
        <p class="hero__tag" lang="ar">${esc(data.hero.tagline)}</p>
        <h1 class="hero__title" id="hero-title">${words}</h1>
        <p class="hero__sub">${esc(t(data.hero.sub))}</p>
        <div class="hero__row">
          <a class="nt-btn nt-btn--light hero__cta" href="#stops"><span>${esc(t(data.hero.cta))}</span>
            <svg class="nt-down" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13M4 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>
          </a>
          <p class="hero__hint" aria-hidden="true">${arrowSvg()}<span>${esc(finePointer ? ui.sweep : ui.sweepTouch)}</span></p>
        </div>
      </div>
      ${dunes(
        [
          { seed: 11, fill: 'rgba(200,140,60,0.45)', depth: 1.4, lo: 0.45, hi: 0.95, n: 2 },
          { seed: 23, fill: 'rgba(222,196,146,0.92)', depth: 0.7, lo: 0.25, hi: 0.6, n: 3 },
          { seed: 37, fill: 'var(--nt-stone)', depth: 0, lo: 0.06, hi: 0.26, n: 4 }
        ],
        'dunes--hero'
      )}
      <div class="hero__loader" aria-hidden="true">
        <img class="hero__loader-logo" src="${asset(data.logo.dark)}" alt="" width="296" height="165">
        <p class="hero__count"><span class="hero__count-n">0</span><span class="hero__count-l">${esc(ui.loading)}</span></p>
      </div>
    </div>`;

  const stage = root.querySelector('.hero__stage');
  const video = root.querySelector('video');
  const btn = root.querySelector('.hero__pause');
  initPause(video, btn);

  if (reduced) {
    root.classList.add('is-on');
    return;
  }

  // the whole hero starts buried
  const cover = bury(stage, { kind: 'rect', cell: 3, manual: true, rate: 0.62, spawn: 2.4 });
  cover.build();

  const counter = root.querySelector('.hero__count-n');
  const loader = root.querySelector('.hero__loader');
  const t0 = performance.now();
  let shown = 0;
  let ready = false;
  let released = false;

  const canPlay = new Promise((res) => {
    if (video.readyState >= 3) return res();
    video.addEventListener('canplay', res, { once: true });
    video.addEventListener('error', res, { once: true });
    setTimeout(res, 2600);
  });
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.all([canPlay, fonts]).then(() => (ready = true));

  if (!document.documentElement.classList.contains('has-loader')) {
    ready = true;
    shown = 100;
  }

  const tickCount = () => {
    const el = performance.now() - t0;
    const goal = ready ? 100 : Math.min(88, el / 22);
    shown += (goal - shown) * (ready ? 0.22 : 0.08);
    if (ready && shown > 99.4) shown = 100;
    counter.textContent = String(Math.round(shown));
    if (shown >= 100 && el > 1500) return release();
    requestAnimationFrame(tickCount);
  };
  requestAnimationFrame(tickCount);

  function release() {
    if (released) return;
    released = true;
    video.play().catch(() => {});
    loader.classList.add('is-gone');
    const r = loader.getBoundingClientRect();
    puff({ left: r.left + r.width * 0.2, top: r.top, width: r.width * 0.6, height: r.height }, 260, 0, 3, 1.4);
    gustBoost(1.1);
    setTimeout(() => {
      cover.start();
      document.documentElement.classList.remove('has-loader');
    }, 260);
    setTimeout(() => root.classList.add('is-on'), 900);
    setTimeout(() => loader.remove(), 1400);
  }

  // pause the film while it is off screen (unless the visitor paused it)
  new IntersectionObserver(([e]) => {
    if (btn.dataset.paused === 'true' || !released) return;
    if (e.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }).observe(stage);
}

function initPause(video, btn) {
  const icon = (paused) =>
    paused
      ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" fill="currentColor"/></svg>';
  const sync = () => {
    const userPaused = btn.dataset.paused === 'true';
    btn.innerHTML = `${icon(userPaused)}<span>${esc(userPaused ? ui.play : ui.pause)}</span>`;
    btn.setAttribute('aria-label', userPaused ? ui.play : ui.pause);
  };
  if (reduced) btn.dataset.paused = 'true';
  sync();
  btn.addEventListener('click', () => {
    const nowPaused = btn.dataset.paused !== 'true';
    btn.dataset.paused = String(nowPaused);
    if (nowPaused) video.pause();
    else video.play().catch(() => {});
    sync();
  });
}
