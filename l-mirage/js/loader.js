// Loading moment: heat haze (SVG displacement) resolves into the logo while a percentage counts.
// Time-based: min 1.8 s, hard stop 4.5 s. Once per session. Click or key skips.
import { t, L, tick } from './util.js';

const MIN = 1800;
const MAX = 4500;

export function createLoader() {
  const root = document.documentElement;
  const node = document.querySelector('[data-loader]');
  const active = root.classList.contains('is-loading') && node;
  let real = 0;
  let finished = false;
  let resolveDone;
  const done = new Promise((r) => (resolveDone = r));

  if (!active) {
    node && node.remove();
    resolveDone();
    return { progress() {}, done, active: false };
  }

  const pctEl = node.querySelector('[data-pct]');
  const bar = node.querySelector('[data-loader-bar]');
  const logo = node.querySelector('[data-loader-logo]');
  const disp = node.querySelector('[data-disp]');
  const turb = node.querySelector('[data-turb]');
  node.querySelector('[data-loader-label]').textContent = `${t(L.loading)} · ${t(L.skip)}`;
  logo.style.filter = 'url(#mi-haze)';

  const t0 = performance.now();
  let shown = 0;

  const finish = () => {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem('nt-l-loaded', '1'); } catch (e) {}
    pctEl.textContent = '100';
    bar.style.transform = 'scaleX(1)';
    disp.setAttribute('scale', '0');
    logo.style.filter = 'none';
    node.classList.add('is-out');
    root.classList.remove('is-loading');
    resolveDone();
    setTimeout(() => node.remove(), 1100);
  };

  const step = (now) => {
    if (finished) return;
    const el = now - t0;
    const timeP = Math.min(1, el / MIN);
    const target = el >= MAX ? 1 : Math.min(real, timeP);
    shown += (target - shown) * 0.18;
    if (target - shown < 0.004) shown = target;
    const p = shown;
    pctEl.textContent = String(Math.round(p * 100));
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
    // Strong haze at 0 %, none at 100 %. Noise drifts upward like rising heat.
    const amt = Math.pow(1 - p, 1.6);
    disp.setAttribute('scale', (amt * 90).toFixed(2));
    turb.setAttribute('baseFrequency', `${(0.006 + amt * 0.004).toFixed(4)} ${(0.05 + Math.sin(el / 380) * 0.008).toFixed(4)}`);
    turb.setAttribute('seed', String(4 + Math.floor(el / 90) % 40));
    logo.style.opacity = String(0.25 + 0.75 * Math.min(1, p * 1.4));
    if (p >= 1) { setTimeout(finish, 260); return; }
    tick(step);
  };
  tick(step);

  const skip = () => finish();
  node.addEventListener('click', skip);
  window.addEventListener('keydown', skip, { once: true });
  setTimeout(finish, MAX + 800); // hard guard

  return {
    active: true,
    done,
    progress(v) { real = Math.max(real, Math.min(1, v)); },
  };
}
