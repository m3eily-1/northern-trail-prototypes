// Full-screen stop takeover: photo + giant name + description. Esc / close / prev / next.
import { h, L, t, lang, other, asset, pad2, splitLetters, fitText, reduced, isPhone } from './lib.js';

export function initTakeover(data) {
  const root = document.getElementById('takeover');
  const img = root.querySelector('.to__img');
  const meta = root.querySelector('.to__meta');
  const nameEl = root.querySelector('.to__name');
  const alt = root.querySelector('.to__alt');
  const facts = root.querySelector('.to__facts');
  const desc = root.querySelector('.to__desc');
  const sticker = root.querySelector('.to__sticker');
  const closeBtn = root.querySelector('.to__close');
  const prevBtn = root.querySelector('.to__prev');
  const nextBtn = root.querySelector('.to__next');
  const body = root.querySelector('.to__body');
  const regionName = Object.fromEntries(data.regions.map((r) => [r.key, L(r.name)]));
  const total = data.stops.length;
  let idx = 0;
  let opener = null;
  let open = false;

  const nameLine = h('span', { class: 'to__fit' });
  nameEl.append(nameLine);

  const fill = (i) => {
    const s = data.stops[i];
    idx = i;
    img.src = asset(s.photo);
    meta.textContent = `${t('stop')} ${pad2(s.n)} ${t('of')} ${total}`;
    nameEl.lang = lang;
    nameLine.textContent = L(s.name);
    alt.textContent = s.name[other];
    alt.lang = other;
    alt.dir = other === 'ar' ? 'rtl' : 'ltr';
    facts.textContent = '';
    facts.append(
      h('div', { class: 'to__fact' }, h('dt', {}, t('drive')), h('dd', {}, s.drive ? L(s.drive) : t('start'))),
      h('div', { class: 'to__fact' }, h('dt', {}, t('region')), h('dd', {}, regionName[s.region])),
    );
    desc.textContent = L(s.desc);
    if (s.sticker) { sticker.src = asset(s.sticker); sticker.hidden = false; } else { sticker.hidden = true; sticker.removeAttribute('src'); }
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === total - 1;
  };

  const fitName = () => {
    nameLine.style.fontSize = '';
    const w = body.clientWidth;
    fitText(nameLine, w, { max: isPhone() ? 88 : Math.min(200, window.innerHeight * 0.2), min: 32 });
    return splitLetters(nameLine, L(data.stops[idx].name), lang);
  };

  const animateIn = (letters) => {
    if (reduced) return;
    gsap.fromTo(letters, { yPercent: 110, rotation: () => (Math.random() - 0.5) * 30, opacity: 0 },
      { yPercent: 0, rotation: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.03, delay: 0.25 });
    gsap.fromTo([alt, facts, desc, root.querySelector('.to__nav')], { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.06, delay: 0.4 });
    gsap.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.4, ease: 'expo.out' });
    if (!sticker.hidden) gsap.fromTo(sticker, { scale: 0, rotation: -40 }, { scale: 1, rotation: -8, duration: 0.9, ease: 'back.out(1.8)', delay: 0.55 });
  };

  function openStop(i, fromEl) {
    opener = fromEl || document.activeElement;
    root.hidden = false;
    open = true;
    document.documentElement.classList.add('is-locked');
    fill(i);
    const letters = fitName();
    if (!reduced && fromEl) {
      const r = fromEl.getBoundingClientRect();
      const R = root.getBoundingClientRect();
      gsap.fromTo(root, { clipPath: `inset(${r.top - R.top}px ${R.right - r.right}px ${R.bottom - r.bottom}px ${r.left - R.left}px)` },
        { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.8, ease: 'expo.inOut' });
    }
    animateIn(letters);
    closeBtn.focus({ preventScroll: true });
  }

  function close() {
    if (!open) return;
    open = false;
    const done = () => {
      root.hidden = true;
      document.documentElement.classList.remove('is-locked');
      gsap?.set?.(root, { clearProps: 'clipPath,opacity' });
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    };
    if (reduced) return done();
    const r = opener?.getBoundingClientRect?.();
    const R = root.getBoundingClientRect();
    if (r && r.width && !opener.hidden) {
      gsap.to(root, { clipPath: `inset(${r.top - R.top}px ${R.right - r.right}px ${R.bottom - r.bottom}px ${r.left - R.left}px)`, duration: 0.6, ease: 'expo.inOut', onComplete: done });
    } else gsap.to(root, { opacity: 0, duration: 0.3, onComplete: done });
  }

  const go = (d) => {
    const n = idx + d;
    if (n < 0 || n >= total) return;
    if (reduced) { fill(n); fitName(); return; }
    gsap.to([nameEl, alt, facts, desc], { opacity: 0, y: -16, duration: 0.2, ease: 'power2.in', onComplete: () => {
      gsap.set([nameEl, alt, facts, desc], { opacity: 1, y: 0 });
      fill(n);
      animateIn(fitName());
    } });
  };

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowRight') go(lang === 'ar' ? -1 : 1);
    else if (e.key === 'ArrowLeft') go(lang === 'ar' ? 1 : -1);
    else if (e.key === 'Tab') {
      const f = [...root.querySelectorAll('button:not([disabled])')];
      const i = f.indexOf(document.activeElement);
      e.preventDefault();
      const n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length;
      f[n].focus();
    }
  });
  window.addEventListener('resize', () => { if (open) fitName(); });

  return { openStop };
}
