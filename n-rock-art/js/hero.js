// Hero: the brand film seen from inside a cave mouth. The visitor stands in the
// dark with a torch; carvings on the cave wall glint as the light passes.
import { t, esc, asset, ui, reduced, touch, chiselWords } from './i18n.js';
import { carveHTML } from './carve.js';
import { revealNow } from './reveal.js';

const icon = {
  pause: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor"/></svg>',
  play: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>',
  down: '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-down"><path d="M10 3v13M4.5 10.5 10 16l5.5-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>',
  flame:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5 1-1 1-3 0-9z" fill="currentColor"/></svg>'
};

export function initHero(data) {
  const root = document.getElementById('hero');
  const { hero, film } = data;
  const small = matchMedia('(max-width: 767px)').matches;

  root.innerHTML = `
    <div class="hero__wall">
      ${carveHTML('motif:ibex', { cls: 'hero__art hero__art--ibex', ar: 200 / 150, seed: 11 })}
      ${carveHTML('motif:figure', { cls: 'hero__art hero__art--fig', ar: 140 / 180, seed: 12 })}
      ${carveHTML('motif:figure', { cls: 'hero__art hero__art--fig2', ar: 140 / 180, seed: 13, flip: true })}
      ${carveHTML('motif:caravan', { cls: 'hero__art hero__art--caravan', ar: 600 / 150, seed: 14, spacing: 3.6 })}
      <div class="hero__copy nt-wrap">
        <div class="hero__text">
          <img class="hero__logo" src="${asset(data.logo.cream)}" alt="${document.documentElement.lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165">
          <h1 class="hero__title" id="hero-title" data-chisel data-nodust>${esc(t(hero.title))}</h1>
          <p class="hero__sub" data-words>${chiselWords(t(hero.sub))}</p>
          <div class="hero__actions" data-rise>
            <a class="nt-btn nt-btn--light hero__cta" href="#stops"><span>${esc(t(hero.cta))}</span>${icon.down}</a>
          </div>
        </div>
      </div>
      <div class="hero__mouth">
        <div class="hero__rim" aria-hidden="true"></div>
        <div class="hero__opening">
          <video class="hero__film" muted playsinline loop preload="metadata" poster="${asset(film.poster)}" aria-hidden="true"></video>
          <i class="hero__shade" aria-hidden="true"></i>
        </div>
        <button class="hero__pause" type="button"></button>
      </div>
      <p class="hero__hint" data-rise><span class="hero__flame">${icon.flame}</span><span>${esc(touch ? ui.torchTouch : ui.torch)}</span></p>
    </div>`;

  const video = root.querySelector('video');
  video.muted = true;
  video.src = asset(small ? film.mobile : film.desktop);
  const btn = root.querySelector('.hero__pause');
  const set = (playing) => {
    btn.innerHTML = playing ? icon.pause : icon.play;
    btn.setAttribute('aria-label', playing ? ui.pause : ui.play);
  };
  set(false);
  btn.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', () => set(true));
  video.addEventListener('pause', () => set(false));

  // Walking out of the cave: the mouth opens a little as you scroll away.
  const mouth = root.querySelector('.hero__mouth');
  const copy = root.querySelector('.hero__text');
  if (!reduced) {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const h = root.offsetHeight || 1;
        const p = Math.min(1, Math.max(0, scrollY / h));
        mouth.style.transform = `scale(${1 + p * 0.08}) translate3d(0, ${p * 40}px, 0)`;
        copy.style.transform = `translate3d(0, ${p * -60}px, 0)`;
        copy.style.opacity = String(1 - p * 0.6);
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
  }

  return {
    // called once the loader has gone
    start() {
      if (!reduced) video.play().catch(() => set(false));
      revealNow(root.querySelector('.hero__title'));
      setTimeout(() => {
        root.querySelectorAll('[data-words], [data-rise]').forEach((el) => el.classList.add('is-in'));
      }, 260);
    }
  };
}
