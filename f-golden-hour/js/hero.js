// Hero: brand film, word reveal, pause control, scroll fade into the landscape.

import { smooth } from './time.js';

const ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor"/></svg>';
const ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z" fill="currentColor"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" class="nt-down"><path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

export function initHero({ root, content, lang, ui, rm, phone, onCta }) {
  const h = content.hero;
  const title = root.querySelector('[data-hero-title]');
  const words = h.title[lang].split(/\s+/);
  title.innerHTML = words.map((w, i) => `<span class="w"><span style="--i:${i}">${w}</span></span>`).join(' ');
  title.setAttribute('aria-label', h.title[lang]);
  title.querySelectorAll('.w').forEach((w) => w.setAttribute('aria-hidden', 'true'));
  root.querySelector('[data-hero-sub]').textContent = h.sub[lang];
  const cta = root.querySelector('[data-hero-cta]');
  cta.innerHTML = `<span>${h.cta[lang]}</span>${ARROW}`;
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    onCta();
  });
  root.querySelector('[data-scroll-label]').textContent = ui.scroll;

  const video = root.querySelector('[data-film]');
  video.poster = '../' + content.film.poster;
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  const media = new Promise((res) => {
    const done = () => res();
    video.addEventListener('loadeddata', done, { once: true });
    video.addEventListener('error', done, { once: true });
    setTimeout(done, 5000);
  });
  video.src = '../' + (phone ? content.film.mobile : content.film.desktop);
  video.preload = rm ? 'metadata' : 'auto';

  const btn = root.querySelector('[data-pause]');
  let userPaused = rm;
  const sync = () => {
    const playing = !video.paused;
    btn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
    btn.setAttribute('aria-label', playing ? ui.pause : ui.play);
    btn.setAttribute('aria-pressed', String(!playing));
  };
  const play = () => video.play().catch(() => {}).finally(sync);
  btn.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      play();
    } else {
      userPaused = true;
      video.pause();
    }
    sync();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();

  // scroll fade (motion only): the film dissolves into the pre-dawn landscape
  let raf = 0;
  let hidden = false;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const stage = window.innerHeight - 64;
      const p = window.scrollY / (stage * 0.9);
      root.style.setProperty('--hv', (1 - smooth(0.1, 0.95, p)).toFixed(3));
      root.style.setProperty('--hc', (1 - smooth(0.02, 0.42, p)).toFixed(3));
      root.style.setProperty('--hy', (-p * 48).toFixed(1) + 'px');
      const nowHidden = p > 0.97;
      if (nowHidden !== hidden) {
        hidden = nowHidden;
        root.classList.toggle('is-gone', hidden);
        if (hidden) video.pause();
        else if (!userPaused) play();
      }
    });
  }
  if (!rm) {
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  return {
    media,
    reveal() {
      root.classList.add('is-in');
      if (!userPaused && !hidden) play();
    },
  };
}
