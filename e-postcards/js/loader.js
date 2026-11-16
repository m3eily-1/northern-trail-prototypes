// Loading moment: a postmark thuds onto the screen, ink spreads, the page slides in.
import { postmarkSVG, dateLine, asset, lang, store, fitRings } from './util.js';

const KEY = 'nt-e-postmark';

export function runLoader(data) {
  const root = document.documentElement;
  const pm = document.querySelector('.pm');
  const page = document.querySelector('.page');
  // Skip when the tab is hidden: requestAnimationFrame is paused there and the timeline would never finish.
  if (!root.classList.contains('has-pm') || !pm || !window.gsap || document.visibilityState === 'hidden') {
    pm?.remove();
    root.classList.remove('has-pm');
    return Promise.resolve();
  }
  const gsap = window.gsap;
  const mount = pm.querySelector('.pm__mount');
  const ring = lang === 'ar' ? 'مسار الشمال • شمالٍ يشمل' : 'NORTHERN TRAIL • 1,200 KM';
  mount.innerHTML = postmarkSVG({ ring, sub: dateLine(), waves: true, logo: asset(data.logo.dark), cls: 'postmark--hero' });
  document.fonts.ready.then(() => fitRings(mount));

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      store.set(KEY, '1');
      gsap.set(page, { clearProps: 'transform' });
      pm.remove();
      root.classList.remove('has-pm');
      window.removeEventListener('keydown', skip);
      clearTimeout(guard);
      tl.kill();
      gsap.set([pm, page], { clearProps: 'all' });
      resolve();
    };
    const tl = gsap.timeline({ onComplete: finish });
    // Safety net: never let the loading moment hold the page (throttled or paused frames).
    const guard = setTimeout(finish, 4500);
    const skip = () => tl.progress(1);
    pm.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('keydown', skip);

    const svg = mount.querySelector('svg');
    const ink = pm.querySelector('.pm__ink');
    const shake = pm.querySelector('.pm__shake');
    gsap.set(svg, { scale: 2.4, rotation: -18, autoAlpha: 0, transformOrigin: '24% 50%' });
    gsap.set(ink, { scale: 0.3, autoAlpha: 0 });
    gsap.set(page, { y: 80 });

    tl.to(svg, { autoAlpha: 1, duration: 0.18, ease: 'none' }, 0.25)
      .to(svg, { scale: 1, rotation: -7, duration: 0.42, ease: 'power4.in' }, 0.25)
      // impact: the table shudders, ink bleeds out from under the stamp
      .to(shake, { keyframes: [{ x: -5, y: 3 }, { x: 4, y: -2 }, { x: -2, y: 1 }, { x: 0, y: 0 }], duration: 0.24, ease: 'none' }, 0.67)
      .to(svg, { scale: 0.985, duration: 0.08, yoyo: true, repeat: 1, ease: 'power1.out' }, 0.67)
      .to(ink, { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, 0.67)
      .fromTo(svg.querySelector('.pm-ink'), { opacity: 0.72 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 0.67)
      // page slides in over the stamp
      .to(pm, { yPercent: -100, duration: 0.9, ease: 'power3.inOut' }, 1.75)
      .to(page, { y: 0, duration: 0.9, ease: 'power3.inOut' }, 1.75);
  });
}
