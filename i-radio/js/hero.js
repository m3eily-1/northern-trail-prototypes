// Hero: brand film, scrim, word-by-word headline, radio push button for pause.
import { t, asset, esc, l, lang, icons, isReduced } from './util.js';

export function mountHero(root, data, ready) {
  const { hero, film, logo } = data;
  const words = t(hero.title).split(/\s+/);
  const ar = lang() === 'ar';
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const reduced = isReduced();

  root.innerHTML = `
    <div class="hero__film">
      <video class="hero__video" muted loop playsinline preload="auto" ${reduced ? '' : 'autoplay'}
        poster="${asset(film.poster)}" src="${asset(mobile ? film.mobile : film.desktop)}"></video>
      <div class="hero__scrim"></div>
    </div>
    <div class="hero__top nt-wrap">
      <img class="hero__logo" src="${asset(logo.cream)}" alt="Northern Trail" width="296" height="165">
      <nav class="lang" aria-label="Language">
        <a href="?lang=en" ${ar ? '' : 'aria-current="true"'} lang="en">EN</a>
        <a href="?lang=ar" ${ar ? 'aria-current="true"' : ''} lang="ar">عربي</a>
      </nav>
    </div>
    <div class="hero__body nt-wrap">
      <p class="hero__plate"><i class="led led--on"></i><span>NT 1200</span><span class="hero__plate-sep"></span><span>${esc(l('onAir'))}</span></p>
      <h1 class="hero__title">${words
        .map((w, i) => `<span class="w"><span class="w__in" style="--i:${i}">${esc(w)}</span></span>`)
        .join(' ')}</h1>
      <p class="hero__sub">${esc(t(hero.sub))}</p>
      <div class="hero__actions">
        <a class="nt-btn nt-btn--light hero__cta" href="#radio">${esc(t(hero.cta))}${icons.down}</a>
        <button class="pbtn" type="button" aria-pressed="${reduced ? 'true' : 'false'}">
          <i class="led ${reduced ? '' : 'led--on'}"></i>
          <span class="pbtn__ico">${reduced ? icons.play : icons.pause}</span>
          <span class="pbtn__txt">${esc(reduced ? l('play') : l('pause'))}</span>
        </button>
      </div>
    </div>
    <div class="hero__scroll nt-wrap" aria-hidden="true"><span>${esc(l('scroll'))}</span><i></i></div>
  `;

  const video = root.querySelector('video');
  const btn = root.querySelector('.pbtn');
  const setUI = (paused) => {
    btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    btn.querySelector('.led').classList.toggle('led--on', !paused);
    btn.querySelector('.pbtn__ico').innerHTML = paused ? icons.play : icons.pause;
    btn.querySelector('.pbtn__txt').textContent = paused ? l('play') : l('pause');
  };
  // Pause the film when the hero is off screen; resume only if the user had not paused it.
  let userPaused = reduced;
  let autoPausing = false;
  btn.addEventListener('click', () => {
    if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  });
  video.addEventListener('play', () => setUI(false));
  video.addEventListener('pause', () => { if (!autoPausing) setUI(true); autoPausing = false; });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([en]) => {
      if (en.isIntersecting) { if (!userPaused && video.paused) video.play().catch(() => {}); }
      else if (!video.paused) { autoPausing = true; video.pause(); }
    }).observe(root);
  }

  root.querySelector('.hero__cta').addEventListener('click', (e) => {
    const target = document.getElementById('radio');
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: y, behavior: isReduced() ? 'auto' : 'smooth' });
  });

  ready.then(() => root.classList.add('is-in'));
}
