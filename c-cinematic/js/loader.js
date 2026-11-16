// Film-leader loader: logo, thin progress line, frame counter, 3-2-1 count, then a horizontal
// shutter wipe (six blades sliding out toward the inline end). Shown once per session.
const MIN_MS = 1900;
const MAX_MS = 6000;
const FRAMES = 96;

export function createLoader(root, { lang, gsap }) {
  const html = document.documentElement;
  const el = root.querySelector('.ntc-loader');
  const active = html.classList.contains('is-loading');

  if (!active) {
    el.remove();
    return { track() {}, finish: async () => {} };
  }

  const line = el.querySelector('.ntc-loader__line span');
  const frames = el.querySelector('.ntc-loader__frames b');
  const count = el.querySelector('.ntc-loader__count b');
  const t0 = performance.now();
  let total = 0;
  let done = 0;
  let shown = 0;
  let raf = 0;
  let lastCount = '3';

  function tick(now) {
    const elapsed = now - t0;
    const real = total ? done / total : 0;
    const timeCap = Math.min(1, elapsed / MIN_MS);
    const forced = elapsed > MAX_MS ? 1 : 0;
    const target = Math.min(timeCap, Math.max(real, forced));
    shown += (target - shown) * 0.12;
    if (target - shown < 0.002) shown = target;
    line.style.transform = `scaleX(${shown.toFixed(4)})`;
    frames.textContent = String(Math.round(shown * FRAMES)).padStart(3, '0');
    const c = shown < 0.34 ? '3' : shown < 0.67 ? '2' : '1';
    if (c !== lastCount) {
      count.textContent = c;
      lastCount = c;
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  function track(promise, weight = 1) {
    total += weight;
    Promise.resolve(promise)
      .catch(() => {})
      .then(() => {
        done += weight;
      });
  }

  function waitFull() {
    return new Promise((resolve) => {
      const check = () => (shown >= 1 ? resolve() : setTimeout(check, 40));
      check();
    });
  }

  async function finish() {
    await waitFull();
    cancelAnimationFrame(raf);
    const dir = lang === 'ar' ? -1 : 1;
    const blades = el.querySelectorAll('.ntc-loader__shutter i');
    await new Promise((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(el.querySelector('.ntc-loader__content'), { opacity: 0, duration: 0.35, ease: 'power2.in' })
        .add(() => {
          html.classList.remove('is-loading');
          root.querySelector('.ntc-hero')?.classList.add('is-ready');
        })
        .to(blades, { xPercent: 101 * dir, duration: 1.0, ease: 'expo.inOut', stagger: { each: 0.06, from: 'center' } }, '<0.05');
      // Safety: never trap the page behind the loader if the ticker is throttled.
      setTimeout(resolve, 2600);
    });
    html.classList.remove('is-loading');
    el.remove();
    try {
      sessionStorage.setItem('ntc-intro', '1');
    } catch (e) {
      /* storage unavailable: the loader simply shows again next visit */
    }
  }

  return { track, finish };
}
