// Hero: the brand film as the view through the windscreen, before you take the
// window seat. Rear-view mirror, dashboard with odometer and a pause control.
import { t, asset, esc, ui, icons, reduced, splitWords, num, rtl } from './util.js';

export function initHero(data) {
  const root = document.getElementById('hero');
  const { hero, film, stops } = data;
  const small = matchMedia('(max-width: 767px)').matches;
  const first = stops[0];
  const last = stops[stops.length - 1];

  root.innerHTML = `
    <div class="hero__cabin">
      <div class="hero__screen">
        <div class="hero__film-wrap">
          <video class="hero__film" muted playsinline loop preload="metadata" poster="${asset(film.poster)}" aria-hidden="true"></video>
        </div>
        <i class="hero__scrim" aria-hidden="true"></i>
        <i class="hero__glare" aria-hidden="true"></i>
        <div class="hero__mirror" aria-hidden="true"><img src="${asset(film.frames[1] || film.poster)}" alt="" width="320" height="180"></div>
        <div class="hero__copy">
          <img class="hero__logo" src="${asset(data.logo.cream)}" alt="${esc(ui.brand)}" width="296" height="165">
          <h1 class="hero__title" id="hero-title">${esc(t(hero.title))}</h1>
          <p class="hero__sub">${esc(t(hero.sub))}</p>
          <a class="nt-btn nt-btn--light hero__cta" href="#stops"><span>${esc(t(hero.cta))}</span>${icons.down}</a>
        </div>
      </div>
      <div class="hero__dash">
        <div class="dash__odo" aria-hidden="true">
          <span class="dash__n">0</span><span class="dash__u">${ui.km}</span>
        </div>
        <p class="dash__route"><span>${esc(t(first.name))}</span>${icons.arrow}<span>${esc(t(last.name))}</span><span class="dash__total">${num(1200)} ${ui.km}</span></p>
        <p class="dash__tag" lang="ar">${esc(hero.tagline)}</p>
        <button class="dash__btn" type="button"></button>
      </div>
    </div>`;

  const title = root.querySelector('.hero__title');
  splitWords(title);

  const video = root.querySelector('.hero__film');
  video.muted = true;
  video.src = asset(small ? film.mobile : film.desktop);
  const btn = root.querySelector('.dash__btn');
  const setBtn = (playing) => {
    btn.innerHTML = playing ? icons.pause : icons.play;
    btn.setAttribute('aria-label', playing ? ui.pause : ui.play);
    btn.title = playing ? ui.pause : ui.play;
  };
  let userPaused = false;
  btn.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      video.play().catch(() => {});
    } else {
      userPaused = true;
      video.pause();
    }
  });
  video.addEventListener('play', () => setBtn(true));
  video.addEventListener('pause', () => setBtn(false));
  setBtn(false);

  // Scroll: the windscreen eases back and dims as you move to the side window.
  const screen = root.querySelector('.hero__screen');
  const copy = root.querySelector('.hero__copy');
  if (!reduced) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const h = root.offsetHeight || 1;
        const p = Math.min(1, Math.max(0, window.scrollY / h));
        screen.style.setProperty('--p', p.toFixed(4));
        copy.style.transform = `translate3d(0, ${(p * -48).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Pointer: the glare on the windscreen drifts with the cursor.
  if (!reduced && matchMedia('(hover: hover)').matches) {
    root.addEventListener('pointermove', (e) => {
      const r = root.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      root.style.setProperty('--gx', (x * (rtl ? -1 : 1)).toFixed(3));
    });
  }

  return {
    start() {
      root.classList.add('is-in');
      if (!reduced) {
        const p = video.play();
        if (p) p.catch(() => setBtn(false));
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => {
          if (reduced || userPaused) return;
          if (e.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }).observe(root);
      }
    }
  };
}
