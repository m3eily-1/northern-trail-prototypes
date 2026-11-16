// Hero: full-bleed brand film with scrim, word-by-word headline reveal,
// two CTAs into the planner, a pause control and the EN/AR switch.
import { t, asset, tr, h, icons, isReduced, lang } from './util.js';

export function initHero(root, data) {
  const { hero, film } = data;
  const small = matchMedia('(max-width: 767px)').matches;
  const reduced = isReduced();

  const video = h('video', {
    class: 'k-hero__film',
    muted: true,
    playsinline: true,
    loop: true,
    preload: 'metadata',
    poster: asset(film.poster),
    'aria-hidden': 'true',
  });
  video.muted = true;
  video.src = asset(small ? film.mobile : film.desktop);

  const words = t(hero.title).split(/\s+/);
  const title = h('h1', { class: 'k-hero__title', id: 'hero-title' });
  words.forEach((w, i) => {
    title.append(h('span', { class: 'k-w' }, h('span', { class: 'k-w__in', style: `--i:${i}`, text: w })));
    if (i < words.length - 1) title.append(' ');
  });

  const params = new URLSearchParams(location.search);
  params.set('lang', lang === 'ar' ? 'en' : 'ar');
  const langLink = h('a', {
    class: 'k-lang',
    href: `?${params.toString()}`,
    hreflang: lang === 'ar' ? 'en' : 'ar',
    lang: lang === 'ar' ? 'en' : 'ar',
    'aria-label': tr.lang,
    text: tr.langCode,
  });

  const pauseBtn = h('button', { class: 'k-iconbtn k-hero__pause', type: 'button' });
  const setBtn = (playing) => {
    pauseBtn.innerHTML = playing ? icons.pause : icons.play;
    pauseBtn.setAttribute('aria-label', playing ? tr.pause : tr.play);
    pauseBtn.setAttribute('aria-pressed', playing ? 'false' : 'true');
  };
  pauseBtn.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', () => setBtn(true));
  video.addEventListener('pause', () => setBtn(false));
  setBtn(false);

  const plan = h('a', { class: 'nt-btn nt-btn--light k-hero__cta', href: '#plan', html: `<span>${tr.plan}</span>${icons.arrow}` });
  const explore = h('a', { class: 'nt-btn k-btn-ghost', href: '#stops', html: `<span>${t(hero.cta)}</span>${icons.down}` });

  root.append(
    video,
    h('div', { class: 'k-hero__scrim', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'nt-wrap k-hero__inner' },
      h('div', { class: 'k-hero__top' }, h('img', { class: 'k-hero__logo', src: asset(data.logo.cream), alt: tr.brand, width: 296, height: 165 }), langLink),
      h(
        'div',
        { class: 'k-hero__copy' },
        title,
        h('p', { class: 'k-hero__sub', text: t(hero.sub) }),
        h('div', { class: 'k-hero__ctas' }, plan, explore)
      ),
      h('div', { class: 'k-hero__foot' }, h('span', { class: 'k-hero__scroll nt-eyebrow', text: tr.scroll }), pauseBtn)
    )
  );

  return {
    start() {
      root.classList.add('is-in');
      if (!reduced) {
        const p = video.play();
        if (p) p.catch(() => setBtn(false));
      }
      // Pause offscreen to save the battery; resume only if the visitor did not pause.
      let userPaused = false;
      pauseBtn.addEventListener('click', () => { userPaused = video.paused; });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([e]) => {
          if (reduced || userPaused) return;
          if (e.isIntersecting) video.play().catch(() => {});
          else video.pause();
        }).observe(root);
      }
    },
  };
}
