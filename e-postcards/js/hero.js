// Hero: brand film, word reveal, CTA, pause control, fanned postcards peeking from the corner.
import { t, asset, esc, L, lang, reduced } from './util.js';

const FAN = ['ushaiqer', 'jubbah', 'hail'];

export function mountHero(root, data) {
  const { hero, film, stops, logo } = data;
  const words = t(hero.title)
    .split(/\s+/)
    .map((w) => `<span class="w"><span>${esc(w)}</span></span>`)
    .join(' ');
  const fan = FAN.map((k) => stops.find((s) => s.key === k))
    .filter(Boolean)
    .map(
      (s, i) => `<span class="fan__card fan__card--${i + 1}">
        <img src="${asset(s.photo)}" alt="" decoding="async">
      </span>`
    )
    .join('');
  const other = lang === 'ar' ? '?' : '?lang=ar';
  root.innerHTML = `
    <div class="hero__media">
      <img class="hero__poster" src="${asset(film.poster)}" alt="" decoding="async">
      <video class="hero__video" muted loop playsinline autoplay preload="auto" poster="${asset(film.poster)}"></video>
      <div class="hero__scrim"></div>
    </div>
    <div class="hero__top nt-wrap">
      <img class="hero__logo" src="${asset(logo.cream)}" alt="${esc(L.trail)}" width="296" height="165">
      <div class="hero__controls">
      <nav class="lang" aria-label="${L.lang}">
        <a href="${lang === 'en' ? '#' : other}" ${lang === 'en' ? 'aria-current="true"' : ''} lang="en">EN</a>
        <a href="${lang === 'ar' ? '#' : other}" ${lang === 'ar' ? 'aria-current="true"' : ''} lang="ar">ع</a>
      </nav>
      <button class="hero__pause" type="button" aria-pressed="false" aria-label="${L.pause}">
        <svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/></svg>
        <svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>
      </button>
      </div>
    </div>
    <div class="hero__body nt-wrap">
      <div class="hero__copy">
        <h1 class="hero__title" id="hero-title">${words}</h1>
        <p class="hero__sub">${esc(t(hero.sub))}</p>
        <a class="nt-btn nt-btn--light hero__cta" href="#stops">
          <span>${esc(t(hero.cta))}</span>
          <svg class="nt-down" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v14m0 0-6-6m6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="square"/></svg>
        </a>
      </div>
    </div>
    <a class="fan" href="#stops" aria-label="${L.fan}">${fan}</a>`;

  // film: muted inline autoplay, retried on every chance; the poster image sits underneath until frames play
  const video = root.querySelector('.hero__video');
  const btn = root.querySelector('.hero__pause');
  const mobile = matchMedia('(max-width: 767px)').matches;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  if (reduced) {
    video.autoplay = false;
    video.preload = 'none';
  }
  video.src = asset(mobile ? film.mobile : film.desktop);
  let userPaused = reduced;
  const setState = () => {
    const playing = !video.paused;
    btn.setAttribute('aria-pressed', String(!playing));
    btn.setAttribute('aria-label', playing ? L.pause : L.play);
    btn.classList.toggle('is-paused', !playing);
  };
  const tryPlay = () => {
    if (userPaused || !video.paused) return;
    video.muted = true;
    const p = video.play();
    if (p && p.catch) p.catch(() => setState());
  };
  video.addEventListener('playing', () => { root.classList.add('is-live'); setState(); });
  video.addEventListener('pause', setState);
  ['loadedmetadata', 'loadeddata', 'canplay'].forEach((ev) => video.addEventListener(ev, tryPlay));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tryPlay(); });
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach((ev) => window.addEventListener(ev, tryPlay, { once: true, passive: true }));
  setState();
  tryPlay();
  btn.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      tryPlay();
    } else {
      userPaused = true;
      video.pause();
    }
  });
  root.querySelectorAll('.lang a[href="#"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));

  // smooth jump to the deck (host page owns scrolling; this is a plain scrollIntoView)
  root.querySelectorAll('a[href="#stops"]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('stops').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    })
  );

  const els = () => ({
    words: root.querySelectorAll('.w > span'),
    fade: [root.querySelector('.hero__sub'), root.querySelector('.hero__cta')],
    fan: root.querySelectorAll('.fan__card'),
    top: root.querySelector('.hero__top')
  });
  let primed = false;
  const prime = () => {
    if (reduced || primed) return;
    primed = true;
    const gsap = window.gsap;
    const e = els();
    gsap.set(e.words, { yPercent: 110, rotation: 4 });
    gsap.set(e.fade, { y: 24, autoAlpha: 0 });
    gsap.set(e.fan, { yPercent: 70, autoAlpha: 0 });
    gsap.set(e.top, { autoAlpha: 0 });
  };
  return {
    prime,
    play: tryPlay,
    intro() {
      tryPlay();
      if (reduced) return;
      prime();
      const e = els();
      const tl = window.gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.to(e.words, { yPercent: 0, rotation: 0, duration: 1, stagger: 0.07 })
        .to(e.fade, { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1 }, 0.35)
        .to(e.fan, { yPercent: 0, autoAlpha: 1, duration: 1.1, stagger: 0.09, ease: 'back.out(1.4)', clearProps: 'transform' }, 0.4)
        .to(e.top, { autoAlpha: 1, duration: 0.6 }, 0.6);
    }
  };
}
