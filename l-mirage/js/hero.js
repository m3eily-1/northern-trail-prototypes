// Hero: brand film (WebGL heat-haze plane when available, plain video otherwise),
// word-masked headline, subline, CTA, pause control, EN/AR switch.
import { env, t, L, asset, maskWords } from './util.js';

const ICON_PAUSE = '<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="5" y="4" width="3" height="12" fill="currentColor"/><rect x="12" y="4" width="3" height="12" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4 L16 10 L6 16 Z" fill="currentColor"/></svg>';
const ICON_DOWN = '<svg class="nt-down" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 V16 M4.5 10.5 L10 16 L15.5 10.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

export function renderHero(section, data) {
  const film = data.film;
  const src = env.phone() ? film.mobile : film.desktop;
  const autoplay = !env.reduced;

  section.innerHTML = `
    <video class="hero__video" data-hero-video muted loop playsinline preload="auto"
      ${autoplay ? 'autoplay' : ''} poster="${asset(film.poster)}" crossorigin="anonymous">
      <source src="${asset(src)}" type="video/mp4">
    </video>
    <div class="hero__gl" data-gl-hero></div>
    <div class="hero__scrim"></div>
    <div class="hero__top nt-wrap">
      <img class="hero__logo" src="${asset(data.logo.cream)}" alt="${env.lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165">
      <div class="lang" role="group" aria-label="${t(L.langSwitch)}">
        <a href="?" lang="en" ${env.lang === 'en' ? 'aria-current="true"' : ''}>EN</a>
        <a href="?lang=ar" lang="ar" ${env.lang === 'ar' ? 'aria-current="true"' : ''}>ع</a>
      </div>
    </div>
    <div class="hero__body nt-wrap">
      <div class="hero__copy">
      <h1 class="hero__title">${maskWords(t(data.hero.title))}</h1>
      <p class="hero__sub">${t(data.hero.sub)}</p>
      <div class="hero__actions">
        <a class="nt-btn nt-btn--light hero__cta" href="#stops">${t(data.hero.cta)}${ICON_DOWN}</a>
        <button class="hero__pause" type="button" data-pause aria-pressed="${autoplay ? 'false' : 'true'}" aria-label="${t(autoplay ? L.pause : L.play)}">${autoplay ? ICON_PAUSE : ICON_PLAY}</button>
      </div>
      </div>
      <p class="hero__hint" aria-hidden="true"><span class="hero__hint-dot"></span>${t(L.hint)}</p>
    </div>
  `;

  const video = section.querySelector('[data-hero-video]');
  const btn = section.querySelector('[data-pause]');

  // Shared state read by the GL hero plane.
  const state = { mouse: [0.5, 0.5], inside: false, ripples: [], paused: !autoplay, video };

  const setBtn = () => {
    btn.innerHTML = state.paused ? ICON_PLAY : ICON_PAUSE;
    btn.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
    btn.setAttribute('aria-label', t(state.paused ? L.play : L.pause));
  };
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    state.paused = !state.paused;
    if (state.paused) video.pause(); else video.play().catch(() => {});
    setBtn();
  });

  if (autoplay) {
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
    // Pause the film while the hero is off-screen.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        if (state.paused) return;
        if (e.isIntersecting) video.play().catch(() => {}); else video.pause();
      }).observe(section);
    }
  }

  const toUv = (e) => {
    const r = section.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height];
  };
  section.addEventListener('pointermove', (e) => { state.mouse = toUv(e); state.inside = e.pointerType === 'mouse'; });
  section.addEventListener('pointerleave', () => { state.inside = false; });
  section.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a,button')) return;
    state.ripples.push({ uv: toUv(e), t: performance.now() / 1000 });
    if (state.ripples.length > 4) state.ripples.shift();
  });

  return {
    state,
    intro() { section.classList.add('is-in'); },
  };
}
