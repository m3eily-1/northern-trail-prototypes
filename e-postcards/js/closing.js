// Closing: tagline, closing line, logo, and a playful "Send a postcard" (nothing is actually sent).
import { t, asset, esc, L, dirSign, reduced, postmarkSVG, dateLine, fitRings, isRTL, onVisible } from './util.js';

export function mountClosing(root, data) {
  const { hero, closing, logo, stickers, stops } = data;
  const last = stops[stops.length - 1];
  const ring = isRTL ? `${t(last.name)} • ${L.trail}` : `${t(last.name).toUpperCase()} • ${L.trail.toUpperCase()}`;
  root.innerHTML = `
    <div class="nt-wrap closing__grid">
      <div class="closing__text">
        <h2 class="closing__tag" id="closing-title" lang="ar" dir="rtl">${esc(hero.tagline)}</h2>
        <p class="closing__line">${esc(t(closing.line))}</p>
        <img class="closing__logo" src="${asset(logo.cream)}" alt="${esc(L.trail)}" width="296" height="165">
      </div>
      <div class="closing__mail">
        <div class="env" aria-hidden="true">
          <div class="env__body">
            <span class="env__back"></span>
            <span class="env__card">
              <img src="${asset(last.photo)}" alt="" decoding="async" draggable="false">
              <span class="env__cardname">${esc(t(last.name))}</span>
            </span>
            <span class="env__pocket"></span>
            <span class="env__flap"></span>
            <span class="env__addr"><span>${L.to}</span> ${L.you}</span>
            <img class="env__stamp" src="${asset(stickers.salma)}" alt="" decoding="async" draggable="false">
            <span class="env__pm">${postmarkSVG({ ring, mid: '16', sub: dateLine(), waves: true })}</span>
          </div>
        </div>
        <div class="closing__actions">
          <button class="nt-btn nt-btn--light env__btn" type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 6l9 7 9-7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="miter"/></svg>
            <span class="env__btnlabel">${L.send}</span>
          </button>
          <p class="env__status" aria-live="polite"></p>
        </div>
      </div>
    </div>`;

  document.fonts.ready.then(() => fitRings(root));

  const btn = root.querySelector('.env__btn');
  const label = root.querySelector('.env__btnlabel');
  const status = root.querySelector('.env__status');
  const env = root.querySelector('.env__body');
  const card = root.querySelector('.env__card');
  const flap = root.querySelector('.env__flap');
  const stamp = root.querySelector('.env__stamp');
  const pm = root.querySelector('.env__pm');
  let sent = false;
  let busy = false;

  if (reduced || !window.gsap) {
    btn.addEventListener('click', () => {
      sent = !sent;
      root.classList.toggle('is-sent', sent);
      label.textContent = sent ? L.again : L.send;
      status.textContent = sent ? L.sent : '';
    });
    return;
  }

  const gsap = window.gsap;
  gsap.set(flap, { rotationX: 180, transformOrigin: '50% 0%' });
  gsap.set([stamp, pm], { autoAlpha: 0 });

  // the waiting card bobs a little, inviting the click
  const bob = gsap.to(card, { y: -6, duration: 1.4, yoyo: true, repeat: -1, ease: 'sine.inOut', paused: true });
  onVisible(root, () => bob.play());

  const send = () => {
    busy = true;
    bob.pause();
    const slide = env.offsetHeight * 0.96 - (card.offsetTop + card.offsetHeight);
    const tl = gsap.timeline({
      onComplete: () => {
        busy = false;
        sent = true;
        label.textContent = L.again;
        status.textContent = L.sent;
      }
    });
    tl.to(card, { y: -22, rotation: -2 * dirSign, duration: 0.3, ease: 'power2.out' })
      .to(card, { y: slide, rotation: 0, duration: 0.55, ease: 'power2.in' })
      .set(flap, { zIndex: 5 })
      .to(flap, { rotationX: 0, duration: 0.5, ease: 'power3.inOut' })
      .fromTo(stamp, { autoAlpha: 0, scale: 1.8, rotation: -20 * dirSign }, { autoAlpha: 1, scale: 1, rotation: 6 * dirSign, duration: 0.35, ease: 'power4.in' }, '-=0.1')
      .fromTo(pm, { autoAlpha: 0, scale: 1.5 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'power4.in' }, '+=0.08')
      .to(env, { keyframes: [{ rotation: -2 }, { rotation: 2 }, { rotation: 0 }], duration: 0.3, ease: 'none' })
      .to(env, { x: () => dirSign * window.innerWidth, y: -120, rotation: 14 * dirSign, autoAlpha: 0, duration: 0.85, ease: 'power3.in' }, '+=0.7');
  };

  const reset = () => {
    busy = true;
    status.textContent = '';
    gsap.set(flap, { rotationX: 180, zIndex: '' });
    gsap.set(card, { y: 0, rotation: 0 });
    gsap.set([stamp, pm], { autoAlpha: 0 });
    gsap.fromTo(env, { x: () => -dirSign * window.innerWidth * 0.6, y: 40, rotation: -10 * dirSign, autoAlpha: 0 }, {
      x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.8, ease: 'back.out(1.2)',
      onComplete: () => { busy = false; sent = false; label.textContent = L.send; bob.play(); }
    });
  };

  btn.addEventListener('click', () => {
    if (busy) return;
    if (sent) reset();
    else send();
  });
}
