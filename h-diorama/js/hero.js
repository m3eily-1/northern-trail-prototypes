// Hero: full-bleed brand film, word reveal, pause control. Scrolling out, the film
// shrinks into a paper frame and a first paper scene pops up in front of it.
import { h, tr, asset, L, RM, PHONE, buildLayers, popup, splitWords } from './core.js';
import { HERO_POP } from './scenes.js';

const ICON_PAUSE = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3h3.5v14H5zM11.5 3H15v14h-3.5z" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 3l12 7-12 7z" fill="currentColor"/></svg>';
const ICON_DOWN = '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-down"><path d="M10 3v12M4.5 9.5L10 15l5.5-5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';

export function createHero(data) {
  const film = data.film;
  const video = h('video', {
    class: 'hero__video',
    muted: true,
    loop: true,
    playsinline: true,
    preload: 'auto',
    poster: asset(film.poster),
    'aria-hidden': 'true',
  });
  video.muted = true;
  video.src = asset(PHONE.matches ? film.mobile : film.desktop);
  if (!RM) video.autoplay = true;

  const title = h('h1', { class: 'hero__title' });
  const words = splitWords(title, tr(data.hero.title));
  const sub = h('p', { class: 'hero__sub' }, tr(data.hero.sub));
  const cta = h('a', { class: 'nt-btn nt-btn--light hero__cta', href: '#stops', html: `<span>${tr(data.hero.cta)}</span>${ICON_DOWN}` });
  const copy = h('div', { class: 'hero__copy' }, title, sub, cta);

  const pause = h('button', { class: 'hero__pause', type: 'button', 'aria-label': RM ? L.play : L.pause, 'aria-pressed': 'false', html: RM ? ICON_PLAY : ICON_PAUSE });
  const setState = () => {
    const playing = !video.paused;
    pause.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    pause.setAttribute('aria-label', playing ? L.pause : L.play);
    pause.setAttribute('aria-pressed', playing ? 'false' : 'true');
  };
  pause.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', setState);
  video.addEventListener('pause', setState);

  const cue = h('div', { class: 'hero__cue', 'aria-hidden': 'true' }, h('span', {}, L.scroll), h('i'));

  const scrim = h('div', { class: 'hero__scrim' });
  const media = h('div', { class: 'hero__media' }, video, scrim);
  const popBox = h('div', { class: 'hero__popbox' });
  const pop = h('div', { class: 'hero__pop', 'aria-hidden': 'true' }, popBox);
  const layers = buildLayers(popBox, HERO_POP.layers, 'hlyr');
  const pops = [
    popup({ src: 'assets/img/icon-1.png', x: 6, b: 8, w: 16 }, 'pop'),
    popup({ src: 'assets/img/sticker-salma.webp', x: 70, b: 12, w: 9, sticker: true, tilt: 5 }, 'pop'),
    popup({ src: 'assets/img/icon-2.png', x: 84, b: 6, w: 11 }, 'pop'),
  ];
  pops.forEach((p) => popBox.append(p));

  const pin = h('div', { class: 'hero__pin' }, media, pop, copy, cue, pause);
  const el = h('section', { class: 'hero', 'aria-label': tr(data.hero.title) }, pin);

  cta.addEventListener('click', (e) => {
    const target = document.getElementById('stops');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
  });

  function prepare(gsap) {
    if (RM) return;
    gsap.set(words, { yPercent: 110 });
    gsap.set([sub, cta, pause, cue], { autoAlpha: 0, y: 16 });
  }

  function intro(gsap) {
    if (RM) return;
    const tl = gsap.timeline();
    tl.to(words, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.07 })
      .to([sub, cta], { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1 }, 0.35)
      .to([pause, cue], { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.6);
    return tl;
  }

  function scroll(gsap) {
    if (RM) return;
    gsap.set(layers, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
    gsap.set(pops, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 64px', end: '+=110%', pin: true, scrub: 0.6, invalidateOnRefresh: true },
      defaults: { ease: 'none' },
    });
    tl.to(copy, { y: -56, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0)
      .to(cue, { autoAlpha: 0, duration: 0.1 }, 0)
      .fromTo(
        media,
        { scale: 1, boxShadow: '0 0 0 0px rgba(255,245,200,1), 0 40px 60px -30px rgba(60,30,10,0)' },
        {
          scale: () => (PHONE.matches ? 0.8 : 0.6),
          boxShadow: () => `0 0 0 ${PHONE.matches ? 14 : 28}px rgba(255,245,200,1), 0 40px 60px -30px rgba(60,30,10,0.55)`,
          duration: 0.6,
          ease: 'power2.inOut',
        },
        0.05,
      )
      .to(scrim, { opacity: 0.25, duration: 0.4 }, 0.1)
      .to(layers, { autoAlpha: 1, duration: 0.04, stagger: 0.1 }, 0.4)
      .to(layers, { rotationX: 0, duration: 0.3, ease: 'back.out(1.4)', stagger: 0.1 }, 0.4)
      .to(pops, { autoAlpha: 1, duration: 0.04, stagger: 0.08 }, 0.66)
      .to(pops, { rotationX: 0, duration: 0.3, ease: 'back.out(2)', stagger: 0.08 }, 0.66)
      .to({}, { duration: 0.15 });
    return tl;
  }

  return { el, prepare, intro, scroll, video };
}
