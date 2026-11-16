// Global wind: one rAF loop shared by the sand systems. Scroll speed and pointer
// speed feed a smoothed "gust" value (0 calm .. ~1.5 storm). The loop only runs
// while the tab is visible; subscribers decide for themselves what is on screen.
import { WIND_DIR, reduced, clamp } from './i18n.js';

export const wind = {
  dir: WIND_DIR,
  gust: 0, // smoothed 0..1.5
  boost: 0, // external gusts (loader), decays
  scrollV: 0, // px/s, smoothed, signed
  px: -9999, // pointer, client coords
  py: -9999,
  pvx: 0, // pointer velocity px/s, smoothed
  pvy: 0,
  pspeed: 0,
  pointerIn: false,
  time: 0
};

const subs = new Set();
let running = false;
let lastT = 0;
let lastScroll = window.scrollY;
let rawPX = -9999;
let rawPY = -9999;
let prevPX = null;
let prevPY = null;

export function onFrame(fn) {
  subs.add(fn);
  start();
  return () => subs.delete(fn);
}

export function gustBoost(v) {
  wind.boost = Math.max(wind.boost, v);
}

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000 || 0.016));
  lastT = now;
  wind.time += dt;

  // scroll velocity from per-frame position delta
  const y = window.scrollY;
  // a jump of more than a screen in one frame is a teleport (anchor, restore), not a gust
  const v = Math.abs(y - lastScroll) > window.innerHeight ? 0 : (y - lastScroll) / dt;
  lastScroll = y;
  wind.scrollV += (v - wind.scrollV) * Math.min(1, dt * 10);

  // pointer velocity
  // ignore teleports (touch taps, focus jumps): they are not wind
  const jump = prevPX !== null ? Math.hypot(rawPX - prevPX, rawPY - prevPY) : 0;
  if (prevPX !== null && rawPX > -9000 && jump < 260) {
    const vx = (rawPX - prevPX) / dt;
    const vy = (rawPY - prevPY) / dt;
    const k = Math.min(1, dt * 14);
    wind.pvx += (vx - wind.pvx) * k;
    wind.pvy += (vy - wind.pvy) * k;
  } else {
    wind.pvx *= 0.8;
    wind.pvy *= 0.8;
  }
  prevPX = rawPX;
  prevPY = rawPY;
  wind.px = rawPX;
  wind.py = rawPY;
  wind.pspeed = Math.hypot(wind.pvx, wind.pvy);

  wind.boost = Math.max(0, wind.boost - dt * 0.5);
  const target = clamp(Math.abs(wind.scrollV) / 1600 + wind.pspeed / 2600 + wind.boost, 0, 1.5);
  // fast attack, slow release, like a real gust
  wind.gust += (target - wind.gust) * Math.min(1, dt * (target > wind.gust ? 6 : 1.4));

  for (const fn of subs) fn(dt, now);
  requestAnimationFrame(frame);
}

function start() {
  if (running || reduced || document.hidden) return;
  running = true;
  lastT = performance.now();
  lastScroll = window.scrollY;
  requestAnimationFrame(frame);
}

if (!reduced) {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else if (subs.size) start();
  });
  window.addEventListener(
    'pointermove',
    (e) => {
      rawPX = e.clientX;
      rawPY = e.clientY;
      wind.pointerIn = true;
    },
    { passive: true }
  );
  const out = () => {
    wind.pointerIn = false;
    rawPX = rawPY = -9999;
    prevPX = prevPY = null;
  };
  document.addEventListener('pointerleave', out);
  window.addEventListener('blur', out);
  window.addEventListener('pointercancel', out, { passive: true });
}
