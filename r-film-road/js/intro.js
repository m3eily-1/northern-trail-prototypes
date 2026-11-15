// Intro (direction C's cinematic hero, used as the loading moment).
//
// A fixed canvas covers the hero box. It is painted dark sandstone with the word punched out
// (destination-out), so the hero film, already playing underneath, shows only through the
// letters. There is no loading wait: as soon as the font and the film's first frame are in, the route line
// draws, the word holds for a beat, and the camera dives. (Formerly a route line filled as the progress
// bar. When everything is ready the camera dives into the thickest stroke of the word (found with
// a distance transform) until the film fills the screen, the panel fades, and the hero copy
// takes over. The page cannot scroll until then.
import { pad2 } from './labels.js?v=27';

const HOLD_MS = 700; // the word is on screen this long before the dive, so it reads
const MAX_MS = 6000; // never trap the page behind a slow asset
const DIVE_S = 2.1;

export function createIntro(root, ctx) {
  const { gsap, rtl, isPhone, data, t } = ctx;
  const html = document.documentElement;
  const el = root.querySelector('.r-intro');
  const active = html.classList.contains('is-loading');
  if (!active) {
    el.remove();
    return { track() {}, finish: async () => {}, active: false };
  }

  const canvas = el.querySelector('.r-intro__mask');
  const c2d = canvas.getContext('2d');
  const tc = el.querySelector('.r-intro__tc');
  const chrome = el.querySelector('.r-intro__chrome');
  const skipBtn = el.querySelector('.r-intro__skip');
  // Skip: stop waiting for the loading line and fast-forward the dive (Esc does the same).
  let skipped = false;
  let tl = null;
  function skip() {
    if (skipped) return;
    skipped = true;
    skipBtn.disabled = true;
    if (tl) tl.timeScale(8);
  }
  skipBtn.addEventListener('click', skip);
  const onKey = (e) => {
    if (e.key === 'Escape') skip();
  };
  window.addEventListener('keydown', onKey);

  const word = rtl ? 'الشمال' : 'NORTH';

  const first = data.stops[0];
  const last = data.stops[data.stops.length - 1];
  el.querySelector('.r-intro__route-a').innerHTML = `<b>${pad2(first.n)}</b>&nbsp;&nbsp;${t(first.name)}`;
  el.querySelector('.r-intro__route-b').innerHTML = `<b>${pad2(last.n)}</b>&nbsp;&nbsp;${t(last.name)}`;

  // ---------- loading progress ----------
  const t0 = performance.now();
  let total = 0;
  let done = 0;
  let shown = 0;
  let wordAt = 0;
  let raf = 0;
  let video = null;

  function tick(now) {
    const elapsed = now - t0;
    const real = total ? done / total : 0;
    const held = wordAt && now - wordAt >= HOLD_MS;
    shown = (real >= 1 && held) || elapsed > MAX_MS ? 1 : 0;
    if (video) {
      const s = video.currentTime || 0;
      tc.textContent = `00:00:${pad2(Math.floor(s))}:${pad2(Math.floor((s % 1) * 24))}`;
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

  // ---------- mask geometry ----------
  let W = 0;
  let H = 0;
  let dpr = 1;
  let fs = 100;
  let tx = 0;
  let ty = 0;
  let ax = 0;
  let ay = 0;
  let sMax = 40;
  let progress = 0;
  let fontReady = false;
  const font = (size) => `700 ${size}px nt-bukra`;

  function layout() {
    W = el.clientWidth;
    H = el.clientHeight;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    if (!fontReady) return;
    c2d.setTransform(1, 0, 0, 1, 0, 0);
    c2d.font = font(100);
    c2d.direction = rtl ? 'rtl' : 'ltr';
    c2d.textAlign = 'center';
    c2d.textBaseline = 'alphabetic';
    const m = c2d.measureText(word);
    const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const k = Math.min((W * (isPhone ? 0.9 : 0.86)) / inkW, (H * (isPhone ? 0.34 : 0.56)) / inkH);
    fs = 100 * k;
    const cy = H * (isPhone ? 0.47 : 0.5);
    tx = W / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2) * k;
    ty = cy + ((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2) * k;
    el.style.setProperty('--word-top', `${(ty - m.actualBoundingBoxAscent * k).toFixed(1)}px`);
    el.style.setProperty('--word-bottom', `${(ty + m.actualBoundingBoxDescent * k).toFixed(1)}px`);
    findAnchor(k * inkW);
  }

  // The pixel deepest inside a stroke becomes the zoom anchor, so the dive lands in solid
  // letterform and the film floods the whole screen.
  function findAnchor(inkWidth) {
    const f = Math.min(1, 360 / inkWidth);
    const w = Math.ceil(W * f);
    const h = Math.ceil(H * f);
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    const o = off.getContext('2d', { willReadFrequently: true });
    o.font = font(fs * f);
    o.direction = rtl ? 'rtl' : 'ltr';
    o.textAlign = 'center';
    o.textBaseline = 'alphabetic';
    o.fillText(word, tx * f, ty * f);
    const px = o.getImageData(0, 0, w, h).data;
    const d = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) d[i] = px[i * 4 + 3] > 127 ? 1e9 : 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!d[i]) continue;
        let v = d[i];
        if (x > 0) v = Math.min(v, d[i - 1] + 3);
        if (y > 0) {
          v = Math.min(v, d[i - w] + 3);
          if (x > 0) v = Math.min(v, d[i - w - 1] + 4);
          if (x < w - 1) v = Math.min(v, d[i - w + 1] + 4);
        }
        d[i] = v;
      }
    }
    let best = 0;
    for (let y = h - 1; y >= 0; y--) {
      for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x;
        if (!d[i]) continue;
        let v = d[i];
        if (x < w - 1) v = Math.min(v, d[i + 1] + 3);
        if (y < h - 1) {
          v = Math.min(v, d[i + w] + 3);
          if (x < w - 1) v = Math.min(v, d[i + w + 1] + 4);
          if (x > 0) v = Math.min(v, d[i + w - 1] + 4);
        }
        d[i] = v;
        if (v > best) best = v;
      }
    }
    let bx = w / 2;
    let by = h / 2;
    let bestScore = Infinity;
    for (let i = 0; i < w * h; i++) {
      if (d[i] >= best * 0.85) {
        const x = i % w;
        const y = (i / w) | 0;
        const score = Math.hypot(x - w / 2, y - h / 2);
        if (score < bestScore) {
          bestScore = score;
          bx = x;
          by = y;
        }
      }
    }
    ax = bx / f;
    ay = by / f;
    const depth = Math.max(2, best / 3 / f);
    sMax = Math.min(140, (Math.hypot(W, H) / 2 / depth) * 1.25);
  }

  const smooth = (x) => x * x * (3 - 2 * x);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function draw() {
    if (!W) return;
    const z = clamp01(progress / 0.86);
    const fade = clamp01((progress - 0.8) / 0.2);
    canvas.style.opacity = String(1 - fade);

    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2d.globalCompositeOperation = 'source-over';
    c2d.clearRect(0, 0, W, H);
    const g = c2d.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, '#3e2414');
    g.addColorStop(1, '#1f1109');
    c2d.fillStyle = g;
    c2d.fillRect(0, 0, W, H);
    if (!fontReady) return;

    const ez = z * z * z * 0.35 + smooth(z) * 0.65;
    const s = Math.pow(sMax, ez);
    const pe = smooth(clamp01(z * 1.15));
    const px = ax + (W / 2 - ax) * pe;
    const py = ay + (H / 2 - ay) * pe;

    c2d.globalCompositeOperation = 'destination-out';
    c2d.setTransform(dpr * s, 0, 0, dpr * s, dpr * (px - s * ax), dpr * (py - s * ay));
    c2d.font = font(fs);
    c2d.direction = rtl ? 'rtl' : 'ltr';
    c2d.textAlign = 'center';
    c2d.textBaseline = 'alphabetic';
    c2d.fillText(word, tx, ty);
    if (s < 1.6 && !rtl) {
      c2d.globalCompositeOperation = 'source-over';
      c2d.strokeStyle = `rgba(255, 245, 200, ${0.35 * (1 - (s - 1) / 0.6)})`;
      c2d.lineWidth = 1 / s;
      c2d.strokeText(word, tx, ty);
    }
    c2d.globalCompositeOperation = 'source-over';
  }

  layout();
  draw();
  const onResize = () => {
    layout();
    draw();
  };
  window.addEventListener('resize', onResize);

  return {
    active: true,
    track,
    // The word can only be cut once Bukra is in.
    fontsReady() {
      fontReady = true;
      layout();
      draw();
      el.classList.add('has-word');
      wordAt = performance.now();
    },
    watch(v) {
      video = v;
    },
    async finish(onOpen) {
      await new Promise((resolve) => {
        const check = () => (shown >= 1 || skipped ? resolve() : setTimeout(check, 40));
        check();
      });
      await new Promise((resolve) => {
        const o = { p: 0 };
        tl = gsap.timeline({ onComplete: resolve });
        if (skipped) tl.timeScale(8);
        tl.to(chrome, { opacity: 0, duration: 0.4, ease: 'power2.in' })
          .to(o, {
            p: 1,
            duration: DIVE_S,
            ease: 'power1.inOut',
            onUpdate: () => {
              progress = o.p;
              draw();
              // the hero copy starts rising while the last of the panel fades
              if (o.p > 0.82 && onOpen) {
                onOpen();
                onOpen = null;
              }
            },
          }, '<0.1');
        setTimeout(resolve, DIVE_S * 1000 + 2500);
      });
      if (onOpen) onOpen();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      html.classList.remove('is-loading');
      el.remove();
    },
  };
}
