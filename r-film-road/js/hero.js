// Hero: the brand film full bleed, with the title, line and call to action over a scrim.
// The film starts during the intro (it is what shows through the letters), pauses off screen,
// and has a pause control.
import { splitWords, pad2 } from './labels.js';

export function initHero(root, ctx) {
  const { data, t, L, asset, reduced, isPhone } = ctx;
  const stage = root.querySelector('.r-hero__stage');
  const video = root.querySelector('.r-hero__video');
  const pauseBtn = root.querySelector('.ntc-pause');

  splitWords(root.querySelector('.r-hero__title'), t(data.hero.title));
  root.querySelector('.r-hero__sub').textContent = t(data.hero.sub);
  root.querySelector('.r-hero__cta span').textContent = t(data.hero.cta);
  const first = data.stops[0];
  const last = data.stops[data.stops.length - 1];
  const km = data.intro.stats[0];
  root.querySelector('.r-hero__route-a').innerHTML = `<b>${pad2(first.n)}</b> ${t(first.name)}`;
  root.querySelector('.r-hero__route-b').innerHTML = `<b>${pad2(last.n)}</b> ${t(last.name)}`;
  root.querySelector('.r-hero__route-km').textContent = `${km.value} ${t(km.unit)}`;

  video.poster = asset(data.film.poster);
  video.src = asset(isPhone ? data.film.mobile : data.film.desktop);
  video.muted = true;
  const ready = new Promise((resolve) => {
    if (video.readyState >= 2) return resolve();
    video.addEventListener('loadeddata', resolve, { once: true });
    video.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, 5000);
  });

  let userPaused = reduced;
  const sync = () => {
    const paused = video.paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.setAttribute('aria-label', paused ? L.play : L.pause);
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  pauseBtn.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      video.play().catch(() => {});
    } else {
      userPaused = true;
      video.pause();
    }
  });
  sync();

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) {
      if (!userPaused) video.play().catch(() => {});
    } else video.pause();
  }).observe(stage);

  if (!reduced) video.play().catch(() => {});

  return {
    ready,
    video,
    open() {
      root.classList.add('is-open');
    },
  };
}
