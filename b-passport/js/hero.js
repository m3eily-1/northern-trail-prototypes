// Hero: brand film + word-by-word headline + a pile of the six brand stickers you can drag and toss.
import { esc, mqPhone } from './i18n.js';
import { TossField } from './toss.js';

const ROTS = [-14, 6, 15, -7, -11, 9];

export function mountHero(root, ctx) {
  const { C, lang, t, reduced, rtl, asset } = ctx;
  const gsap = window.gsap;
  const words = C.hero.title[lang].split(' ');
  const stickers = Object.entries(C.stickers);
  const phoneMQ = mqPhone();
  const smallMQ = matchMedia('(max-width: 767px)');
  const q = (s) => root.querySelector(s);

  root.innerHTML = `
    <div class="hero__media">
      <video class="hero__video" muted playsinline loop preload="auto" poster="${asset(C.film.poster)}" aria-hidden="true"></video>
      <div class="hero__scrim"></div>
    </div>
    <div class="hero__bar nt-wrap">
      <img class="hero__logo" src="${asset(C.logo.cream)}" alt="${lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165">
      <nav class="lang" aria-label="${t.langLabel}">
        <a href="?lang=en" lang="en" ${lang === 'en' ? 'aria-current="true"' : ''}>EN</a>
        <a href="?lang=ar" lang="ar" ${lang === 'ar' ? 'aria-current="true"' : ''}>عربي</a>
      </nav>
    </div>
    <div class="hero__copy-wrap nt-wrap">
      <div class="hero__copy">
        <h1 class="hero__title">${words.map((w) => `<span class="w"><span>${esc(w)}</span></span>`).join(' ')}</h1>
        <p class="hero__sub">${esc(C.hero.sub[lang])}</p>
        <div class="hero__actions">
          <a class="nt-btn nt-btn--light hero__cta" href="#stops">
            <span>${esc(C.hero.cta[lang])}</span>
            <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13M4.5 10.5 10 16l5.5-5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg>
          </a>
          <button class="ctrl hero__pause" type="button" aria-pressed="false" aria-label="${t.pause}">
            <svg class="i-pause" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4h3v12H6zM11 4h3v12h-3z" fill="currentColor"/></svg>
            <svg class="i-play" viewBox="0 0 20 20" aria-hidden="true"><path d="M6 3.5v13l10.5-6.5z" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="hero__field" aria-hidden="true">
      ${stickers.map(([k, src]) => `
        <div class="toss toss--sticker" data-key="${k}">
          <div class="toss__in">
            <img class="toss__shadow" src="${asset(src)}" alt="" draggable="false">
            <img class="toss__face" src="${asset(src)}" alt="" draggable="false">
          </div>
        </div>`).join('')}
    </div>
    <p class="hero__hint" aria-hidden="true">
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 9V4.5a1.5 1.5 0 0 1 3 0V9m0-1.5a1.5 1.5 0 0 1 3 0V9m0-.5a1.5 1.5 0 0 1 3 0v3.5c0 3-2 5.5-5 5.5H10c-2 0-3-1-4-2.5L3.5 11a1.4 1.4 0 0 1 2.3-1.6L7 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
      <span>${t.dragStickers}</span>
    </p>`;

  // Film
  const video = q('.hero__video');
  const pauseBtn = q('.hero__pause');
  if (reduced) video.preload = 'none';
  video.src = asset(smallMQ.matches ? C.film.mobile : C.film.desktop);
  let userPaused = reduced;
  const setBtn = () => {
    const paused = video.paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.setAttribute('aria-label', paused ? t.play : t.pause);
    pauseBtn.classList.toggle('is-paused', paused);
  };
  video.addEventListener('play', setBtn);
  video.addEventListener('pause', setBtn);
  pauseBtn.addEventListener('click', () => {
    if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    else { userPaused = true; video.pause(); }
  });
  if (!reduced) video.play().catch(() => setBtn());
  setBtn();
  new IntersectionObserver(([e]) => {
    if (userPaused) return;
    if (e.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }).observe(root);

  q('.hero__cta').addEventListener('click', (e) => {
    const target = document.getElementById('stops');
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  });

  // Stickers
  const field = q('.hero__field');
  const copy = q('.hero__copy');
  const bar = q('.hero__bar');
  const hint = q('.hero__hint');
  const els = [...field.querySelectorAll('.toss')];

  const rel = (el, pad) => {
    const fr = field.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { l: r.left - fr.left - pad, t: r.top - fr.top - pad, r: r.right - fr.left + pad, b: r.bottom - fr.top + pad };
  };
  const protect = () => [rel(copy, 20), rel(bar.querySelector('.lang'), 8), rel(bar.querySelector('.hero__logo'), 8)];
  const tossField = new TossField(field, { protect, reduced, margin: 8, onGrab: () => hint.classList.add('is-used') });

  function sizeStickers() {
    const W = field.clientWidth;
    const base = phoneMQ.matches ? Math.min(112, W * 0.29) : Math.min(188, Math.max(150, W * 0.13));
    els.forEach((el) => { el.style.width = `${Math.round(base)}px`; });
  }

  function pileLayout() {
    const W = field.clientWidth;
    const H = field.clientHeight;
    const c0 = rel(copy, 0);
    const c = rtl ? { ...c0, l: W - c0.r, r: W - c0.l } : c0;
    const barB = rel(bar, 0).b;
    const phone = phoneMQ.matches;
    const sizes = els.map((el) => ({ w: el.offsetWidth, h: el.offsetHeight }));
    const w = sizes[0].w;
    const hMax = Math.max(...sizes.map((s) => s.h));
    let zone;
    if (phone) zone = { l: 16, r: W - 16, t: barB + 4, b: c.t - 28 };
    else {
      const gutter = parseFloat(getComputedStyle(bar).paddingInlineStart) || 64;
      zone = { l: Math.max(c.r + 48, W * 0.52), r: W - gutter, t: barB + 8, b: H - 96 };
    }
    const zw = zone.r - zone.l;
    const zh = zone.b - zone.t;
    // Organic pile: offsets of each sticker centre from the pile centre, in sticker units.
    const PILE = [[-0.92, -0.52], [0.04, -0.7], [0.9, -0.36], [-0.62, 0.42], [0.3, 0.24], [1.0, 0.62]];
    const ux = Math.min(w * 0.78, (zw - w) / 2.1);
    const uy = Math.min(hMax * 0.66, Math.max(0, (zh - hMax) / 1.4));
    const cx = zone.l + zw / 2 - ux * 0.04;
    const cy = zone.t + zh / 2;
    const spots = els.map((el, i) => {
      const s = sizes[i];
      let x = cx + PILE[i][0] * ux - s.w / 2;
      const y = cy + PILE[i][1] * uy - s.h / 2;
      if (rtl) x = W - x - s.w;
      return { x, y };
    });
    const ox = cx - ux - w / 2;
    const clusterW = ux * 2 + w;
    const oy = cy - uy * 0.7 - hMax / 2;
    const clusterH = uy * 1.32 + hMax;
    // hint sits centered under the pile
    const hx = rtl ? W - (ox + clusterW / 2) : ox + clusterW / 2;
    const hy = Math.min(oy + clusterH + 16, phone ? c.t - 44 : H - 72);
    hint.style.transform = `translate3d(calc(${hx}px - 50%), ${hy}px, 0)`;
    return spots;
  }

  let ready = false;
  const imgs = els.map((el) => el.querySelector('.toss__face'));
  const loaded = Promise.all(imgs.map((im) => (im.complete ? Promise.resolve() : im.decode().catch(() => {}))));

  const init = loaded.then(() => {
    sizeStickers();
    tossField.measure();
    els.forEach((el) => {
      const it = tossField.add(el);
      tossField.resizeItem(it);
    });
    const spots = pileLayout();
    tossField.items.forEach((it, i) => tossField.place(it, spots[i].x, spots[i].y, ROTS[i]));
    ready = true;
  });

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (!ready) return;
      sizeStickers();
      tossField.items.forEach((it) => tossField.resizeItem(it));
      tossField.measure();
      const spots = pileLayout();
      tossField.items.forEach((it, i) => {
        if (!it.moved) tossField.place(it, spots[i].x, spots[i].y, ROTS[i]);
      });
      tossField.clampAll();
    }, 120);
  });

  // Entrance (after the cover opens)
  const titleWords = [...root.querySelectorAll('.hero__title .w > span')];
  const fades = [q('.hero__sub'), q('.hero__actions'), bar];
  const ins = els.map((el) => el.querySelector('.toss__in'));
  if (!reduced) {
    gsap.set(titleWords, { yPercent: 115, rotate: rtl ? -4 : 4 });
    gsap.set(fades, { opacity: 0, y: 16 });
    gsap.set(ins, { opacity: 0 });
    gsap.set(hint, { opacity: 0 });
  }

  function intro() {
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.to(titleWords, { yPercent: 0, rotate: 0, duration: 1.0, stagger: 0.08 }, 0.05)
      .to(fades, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.45);
    init.then(() => {
      gsap.fromTo(ins,
        { opacity: 0, y: -70, scale: 1.35, rotate: (i) => (i % 2 ? 18 : -18) },
        { opacity: 1, y: 0, scale: 1, rotate: 0, duration: 0.75, ease: 'back.out(1.7)', stagger: 0.09, delay: 0.35 });
      gsap.to(hint, { opacity: 1, duration: 0.6, delay: 1.2 });
    });
  }

  return { intro };
}
