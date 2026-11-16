// HERO: giant EN + AR names split around a tall film window that widens to fill the screen.
import { h, L, t, lang, asset, fitText, isPhone, reduced } from './lib.js';

const NAMES = {
  en: ['NORTHERN', 'TRAIL'],
  ar: ['مسار', 'الشمال'],
};

export function initHero(data) {
  const root = document.getElementById('hero');
  const primary = root.querySelector('[data-name="primary"]');
  const secondary = root.querySelector('[data-name="secondary"]');
  const other = lang === 'ar' ? 'en' : 'ar';

  const build = (el, l) => {
    el.lang = l;
    el.dir = l === 'ar' ? 'rtl' : 'ltr';
    el.classList.add(`hero__name--${l}`);
    el.setAttribute('aria-label', l === 'ar' ? 'مسار الشمال' : 'Northern Trail');
    NAMES[l].forEach((w) => el.append(h('span', { class: 'hero__line', 'aria-hidden': 'true' }, h('span', { class: 'hero__fit' }, w))));
  };
  build(primary, lang);
  build(secondary, other);

  root.querySelector('.hero__title').textContent = L(data.hero.title);
  root.querySelector('.hero__sub').textContent = L(data.hero.sub);
  root.querySelector('.hero__cta').textContent = L(data.hero.cta);
  root.querySelector('.hero__cap-title').textContent = L(data.hero.title);
  root.querySelector('.hero__cap-sub').textContent = L(data.hero.sub);
  root.querySelectorAll('.lang__opt').forEach((a) => {
    const on = a.getAttribute('hreflang') === lang;
    a.classList.toggle('is-on', on);
    if (on) a.setAttribute('aria-current', 'true');
    a.setAttribute('aria-label', a.lang === 'ar' ? 'العربية' : 'English');
  });

  // ---- film + pause control ----
  const video = root.querySelector('.hero__video');
  const btn = root.querySelector('.hero__pause');
  const btnLabel = btn.querySelector('.sr-only');
  video.poster = asset(data.film.poster);
  video.src = asset(isPhone() ? data.film.mobile : data.film.desktop);
  let userPaused = reduced; // reduced motion: film waits for the visitor
  const sync = () => {
    const playing = !video.paused;
    btn.setAttribute('aria-pressed', String(!playing));
    btn.classList.toggle('is-paused', !playing);
    btnLabel.textContent = playing ? t('pause') : t('play');
  };
  const tryPlay = () => { const p = video.play(); if (p && p.catch) p.catch(() => sync()); };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  btn.addEventListener('click', () => {
    if (video.paused) { userPaused = false; tryPlay(); } else { userPaused = true; video.pause(); }
  });
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) video.pause();
    else if (!userPaused) tryPlay();
  }, { threshold: 0.05 }).observe(root.querySelector('.hero__window'));
  sync();

  // ---- fit giant names ----
  const fitName = (el) => {
    const col = el.parentElement;
    const lines = [...el.querySelectorAll('.hero__fit')];
    const W = el.clientWidth;
    const lhs = lines.map((ln) => parseFloat(getComputedStyle(ln.parentElement).lineHeight) / parseFloat(getComputedStyle(ln.parentElement).fontSize) || 1);
    const sizes = lines.map((ln) => fitText(ln, W, { max: 520 }));
    const capH = isPhone() ? window.innerHeight * 0.3 : col.clientHeight * 0.5;
    const total = sizes.reduce((a, s, i) => a + s * lhs[i], 0);
    const f = total > capH ? capH / total : 1;
    lines.forEach((ln, i) => {
      const s = sizes[i] * f;
      ln.style.fontSize = s.toFixed(2) + 'px';
      ln.parentElement.style.fontSize = s.toFixed(2) + 'px';
    });
  };
  const fitAll = () => { fitName(primary); fitName(secondary); };

  // ---- reveal after loader ----
  const reveal = () => {
    if (reduced) return;
    gsap.from(root.querySelectorAll('.hero__fit'), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.08 });
    gsap.from(root.querySelectorAll('.hero__copy > *, .hero__cue, .hero__bar'), { y: 24, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
    gsap.from(video, { scale: 1.35, opacity: 0, duration: 1.6, ease: 'expo.out' });
  };

  // ---- scroll: film widens, names slide apart ----
  const setupScroll = () => {
    if (reduced) return;
    const mm = gsap.matchMedia();
    const film = root.querySelector('.hero__film');
    const win = root.querySelector('.hero__window');
    mm.add('(min-width: 768px)', () => {
      root.classList.add('hero--pin');
      const insets = () => {
        const r = root.getBoundingClientRect();
        const w = win.getBoundingClientRect();
        return `inset(${w.top - r.top}px ${r.right - w.right}px ${r.bottom - w.bottom}px ${w.left - r.left}px)`;
      };
      const away = (el) => {
        const r = el.getBoundingClientRect();
        const left = r.left + r.width / 2 < window.innerWidth / 2;
        return left ? -(r.right + 40) : window.innerWidth - r.left + 40;
      };
      gsap.set(film, { clipPath: insets() });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root, start: 'top 64px', end: '+=150%', pin: true, scrub: 0.6, invalidateOnRefresh: true,
        },
      });
      tl.fromTo(film, { clipPath: insets }, { clipPath: 'inset(0px 0px 0px 0px)', duration: 1, ease: 'power2.inOut' }, 0)
        .to(primary, { x: () => away(primary), duration: 0.8, ease: 'power2.in' }, 0)
        .to(secondary, { x: () => away(secondary), duration: 0.8, ease: 'power2.in' }, 0)
        .to(root.querySelectorAll('.hero__copy, .hero__cue, .hero__bar'), { opacity: 0, y: -24, duration: 0.3 }, 0)
        .to(root.querySelector('.hero__scrim'), { opacity: 1, duration: 0.35 }, 0.62)
        .fromTo(root.querySelector('.hero__caption'), { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }, 0.7)
        .to({}, { duration: 0.15 });
      return () => { root.classList.remove('hero--pin'); gsap.set(film, { clearProps: 'clipPath' }); };
    });
    const gutter = () => parseFloat(getComputedStyle(document.getElementById('page')).getPropertyValue('--nt-gutter')) || 16;
    mm.add('(max-width: 767px)', () => {
      gsap.fromTo(film, { clipPath: () => `inset(0px ${gutter()}px 0px ${gutter()}px)` }, {
        clipPath: 'inset(0px 0px 0px 0px)', ease: 'none',
        scrollTrigger: { trigger: win, start: 'top 85%', end: 'center 45%', scrub: 0.5 },
      });
      [primary, secondary].forEach((el, i) => gsap.to(el, {
        xPercent: (i === 0) === (lang === 'en') ? -14 : 14, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top 64px', end: 'bottom top', scrub: 0.5 },
      }));
    });
  };

  return { fitAll, reveal, setupScroll, video };
}
