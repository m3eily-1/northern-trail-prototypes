// Hero signature: the brand film plays inside a giant Bukra word.
//
// How it works: the <video> plays natively, full-bleed. Above it sits a <canvas> "panel" painted
// dark sandstone, with the word punched out of it (globalCompositeOperation = 'destination-out').
// So the film is only visible through the letters. The panel is redrawn only when the scroll
// progress changes (not per video frame), which keeps it cheap and behaves the same in Chrome and
// Safari. While pinned, the word scales up around the thickest point of its strokes (found with a
// distance transform on a low-res render), drifting that point to the centre, until a single
// stroke covers the viewport; the panel then fades and the headline reveals over the film.
import { splitWords, pad2 } from './labels.js';

const OPEN_AT = 0.74;

export function initHero(root, ctx) {
  const { gsap, ScrollTrigger, data, t, L, lang, rtl, asset, reduced, isPhone, fine } = ctx;
  const stage = root.querySelector('.ntc-hero__stage');
  const film = root.querySelector('.ntc-hero__film');
  const video = root.querySelector('.ntc-hero__video');
  const canvas = root.querySelector('.ntc-hero__mask');
  const c2d = canvas.getContext('2d');
  const pauseBtn = root.querySelector('.ntc-pause');
  const tc = root.querySelector('.ntc-hero__tc');
  const fadeEls = root.querySelectorAll('.ntc-hero__slate, .ntc-hero__cue');
  const word = rtl ? 'الشمال' : 'NORTH';

  // ---- copy
  splitWords(root.querySelector('.ntc-hero__title'), t(data.hero.title));
  root.querySelector('.ntc-hero__sub').textContent = t(data.hero.sub);
  root.querySelector('.ntc-hero__cta span').textContent = t(data.hero.cta);
  const first = data.stops[0];
  const last = data.stops[data.stops.length - 1];
  root.querySelector('.ntc-hero__route-a').innerHTML = `<b>${pad2(first.n)}</b>&nbsp;&nbsp;${t(first.name)}`;
  root.querySelector('.ntc-hero__route-b').innerHTML = `<b>${pad2(last.n)}</b>&nbsp;&nbsp;${t(last.name)}`;
  const km = data.intro.stats[0];
  root.querySelector('.ntc-hero__route-km').textContent = `${km.value} ${t(km.unit)}`;

  // ---- film
  video.poster = asset(data.film.poster);
  video.src = asset(isPhone ? data.film.mobile : data.film.desktop);
  video.muted = true;
  const ready = new Promise((resolve) => {
    if (video.readyState >= 2) return resolve();
    video.addEventListener('loadeddata', resolve, { once: true });
    video.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, 5000);
  });

  let userPaused = reduced;
  function syncPause() {
    const paused = video.paused;
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.querySelector('.ntc-sr').textContent = paused ? L.play : L.pause;
    pauseBtn.setAttribute('aria-label', paused ? L.play : L.pause);
    film.dataset.cursorLabel = paused ? L.cursorPlay : L.cursorPause;
    window.dispatchEvent(new CustomEvent('ntc:cursor-refresh'));
  }
  function toggle() {
    if (video.paused) {
      userPaused = false;
      video.play().catch(() => {});
    } else {
      userPaused = true;
      video.pause();
    }
  }
  video.addEventListener('play', syncPause);
  video.addEventListener('pause', syncPause);
  pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });
  if (fine) {
    film.addEventListener('click', (e) => {
      if (e.target.closest('a, button')) return;
      toggle();
    });
  }
  syncPause();

  // Pause when off-screen (saves battery), resume if the user had not paused.
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!userPaused) video.play().catch(() => {});
      startTC();
    } else {
      video.pause();
      stopTC();
    }
  });

  // ---- timecode HH:MM:SS:FF (24 fps)
  let tcRaf = 0;
  function drawTC() {
    const s = video.currentTime || 0;
    const ff = Math.floor((s % 1) * 24);
    tc.textContent = `00:00:${pad2(Math.floor(s))}:${pad2(ff)}`;
    tcRaf = requestAnimationFrame(drawTC);
  }
  const startTC = () => {
    if (!tcRaf) tcRaf = requestAnimationFrame(drawTC);
  };
  const stopTC = () => {
    cancelAnimationFrame(tcRaf);
    tcRaf = 0;
  };

  // ---- mask geometry
  let W = 0;
  let H = 0;
  let dpr = 1;
  let fs = 100; // font size at scale 1
  let tx = 0; // text draw position (center aligned)
  let ty = 0; // baseline
  let ax = 0; // zoom anchor (screen coords at scale 1)
  let ay = 0;
  let sMax = 40;
  let progress = 0;
  let drawQueued = false;

  const font = (size) => `700 ${size}px nt-bukra`;

  function layout() {
    const r = film.getBoundingClientRect();
    W = r.width;
    H = r.height;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);

    c2d.setTransform(1, 0, 0, 1, 0, 0);
    c2d.font = font(100);
    c2d.direction = rtl ? 'rtl' : 'ltr';
    c2d.textAlign = 'center';
    c2d.textBaseline = 'alphabetic';
    const m = c2d.measureText(word);
    const inkW = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    const inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const maxW = W * (isPhone ? 0.9 : 0.86);
    const maxH = H * (isPhone ? 0.34 : 0.56);
    const k = Math.min(maxW / inkW, maxH / inkH);
    fs = 100 * k;
    const cy = H * (isPhone ? 0.47 : 0.5);
    tx = W / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2) * k;
    ty = cy + ((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2) * k;
    const top = ty - m.actualBoundingBoxAscent * k;
    const bottom = ty + m.actualBoundingBoxDescent * k;
    root.style.setProperty('--word-top', `${top.toFixed(1)}px`);
    root.style.setProperty('--word-bottom', `${bottom.toFixed(1)}px`);

    findAnchor(k * inkW);
  }

  // Distance transform on a small render of the word: the pixel deepest inside a stroke becomes
  // the zoom anchor, so the zoom dives into solid letterform and the film floods the screen.
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
    o.fillStyle = '#000';
    o.fillText(word, tx * f, ty * f);
    const px = o.getImageData(0, 0, w, h).data;
    const INF = 1e9;
    const d = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) d[i] = px[i * 4 + 3] > 127 ? INF : 0;
    // two-pass chamfer (3-4)
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
    // among the deepest pixels, prefer the one closest to the centre
    let bx = w / 2;
    let by = h / 2;
    let bestScore = Infinity;
    const cx = w / 2;
    const cy = h / 2;
    for (let i = 0; i < w * h; i++) {
      if (d[i] >= best * 0.85) {
        const x = i % w;
        const y = (i / w) | 0;
        const score = Math.hypot(x - cx, y - cy);
        if (score < bestScore) {
          bestScore = score;
          bx = x;
          by = y;
        }
      }
    }
    ax = bx / f;
    ay = by / f;
    const depth = Math.max(2, best / 3 / f); // px from anchor to the nearest edge at scale 1
    sMax = Math.min(140, (Math.hypot(W, H) / 2 / depth) * 1.25);
  }

  const smooth = (x) => x * x * (3 - 2 * x);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));

  function draw() {
    drawQueued = false;
    if (!W) return;
    const zoomEnd = 0.6;
    const z = clamp01(progress / zoomEnd);
    const fade = clamp01((progress - 0.56) / 0.08);
    canvas.style.opacity = String(1 - fade);
    canvas.style.visibility = fade >= 1 ? 'hidden' : 'visible';
    fadeEls.forEach((el) => {
      el.style.opacity = String(1 - clamp01(progress / 0.18));
    });
    if (fade >= 1) return;

    const ez = z * z * z * 0.35 + smooth(z) * 0.65;
    const s = Math.pow(sMax, ez);
    const pe = smooth(clamp01(z * 1.15));
    const px = ax + (W / 2 - ax) * pe;
    const py = ay + (H / 2 - ay) * pe;

    c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    c2d.globalCompositeOperation = 'source-over';
    c2d.clearRect(0, 0, W, H);
    const g = c2d.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, '#3e2414');
    g.addColorStop(1, '#1f1109');
    c2d.fillStyle = g;
    c2d.fillRect(0, 0, W, H);

    c2d.globalCompositeOperation = 'destination-out';
    c2d.setTransform(dpr * s, 0, 0, dpr * s, dpr * (px - s * ax), dpr * (py - s * ay));
    c2d.font = font(fs);
    c2d.direction = rtl ? 'rtl' : 'ltr';
    c2d.textAlign = 'center';
    c2d.textBaseline = 'alphabetic';
    c2d.fillStyle = '#000';
    c2d.fillText(word, tx, ty);

    // hairline on the letter edges, only while the word is still readable
    if (s < 1.6 && !rtl) {
      c2d.globalCompositeOperation = 'source-over';
      c2d.strokeStyle = `rgba(255, 245, 200, ${0.35 * (1 - (s - 1) / 0.6)})`;
      c2d.lineWidth = 1 / s;
      c2d.strokeText(word, tx, ty);
    }
    c2d.globalCompositeOperation = 'source-over';
  }

  function queueDraw() {
    if (!drawQueued) {
      drawQueued = true;
      requestAnimationFrame(draw);
    }
  }

  function setProgress(p) {
    progress = p;
    root.classList.toggle('is-open', p >= OPEN_AT);
    queueDraw();
  }

  layout();
  draw();

  if (reduced) {
    // Static design: the word holds a still of the film, copy sits below it.
    video.removeAttribute('autoplay');
    video.preload = 'metadata';
    root.classList.add('is-open');
    window.addEventListener('resize', () => {
      layout();
      draw();
    });
  } else {
    let st;
    const pinLen = () => film.offsetHeight * (isPhone ? 1.15 : 2.1);
    st = ScrollTrigger.create({
      trigger: stage,
      start: 'top 64px',
      end: () => `+=${pinLen()}`,
      pin: stage,
      onUpdate: (self) => setProgress(self.progress),
      onRefresh: (self) => {
        layout();
        setProgress(self.progress);
      },
    });
    root._st = st;
  }
  io.observe(stage);

  return {
    ready,
    intro() {
      root.classList.add('is-ready');
      if (!userPaused) video.play().catch(() => {});
    },
    state: () => ({ progress, sMax, ax, ay, fs, W, H, open: root.classList.contains('is-open'), paused: video.paused }),
  };
}
