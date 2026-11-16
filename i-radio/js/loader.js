// Loading moment: the radio display powers on, scans and locks onto NT 1200.
// Fully timer driven (no rAF dependency), skippable, once per session, hard guard.
import { createSeg } from './seg.js';
import { l } from './util.js';

export function runLoader() {
  const html = document.documentElement;
  const root = document.getElementById('loader');
  const done = new Promise((resolve) => {
    if (!html.classList.contains('is-loading') || !root) {
      root?.remove();
      resolve();
      return;
    }
    try { sessionStorage.setItem('nt-radio-intro', '1'); } catch (e) {}

    const seg = createSeg(document.getElementById('loaderDigits'), 4);
    const skip = document.getElementById('loaderSkip');
    skip.textContent = l('skip');
    seg.set('    ');

    const timers = [];
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    let finished = false;

    const finish = (fast) => {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      root.classList.add('is-out');
      if (fast) root.classList.add('is-fast');
      setTimeout(() => {
        html.classList.remove('is-loading');
        root.remove();
        resolve();
      }, fast ? 320 : 700);
      window.removeEventListener('keydown', onKey);
    };
    const onKey = () => finish(true);

    // Power on
    at(80, () => root.classList.add('is-on'));
    // Scan: frequencies climb toward 1200 with some overshoot and jitter
    const scan = [874, 912, 958, 1031, 1066, 1104, 1151, 1243, 1176, 1219, 1194, 1203];
    scan.forEach((f, i) => {
      at(360 + i * 105, () => {
        seg.set(String(f).padStart(4, '0'));
        root.style.setProperty('--ln', ((f - 860) / 400).toFixed(3));
      });
    });
    // Lock
    at(360 + scan.length * 105 + 60, () => {
      seg.set('1200');
      root.style.setProperty('--ln', '0.85');
      root.classList.add('is-locked');
    });
    at(2250, () => root.classList.add('is-logo'));
    at(3050, () => finish(false));
    // Hard guard in case timers were throttled
    setTimeout(() => finish(true), 4600);

    root.addEventListener('pointerdown', () => finish(true));
    skip.addEventListener('click', () => finish(true));
    window.addEventListener('keydown', onKey);
  });
  return done;
}
