// Scratch-off panel. A sand layer painted on a canvas covers the stop photo;
// pointer or touch scratching clears it with a round brush. Coverage is
// tracked on a coarse grid (no getImageData), and at 55% the rest falls away
// with a burst of square paper confetti. Keyboard users get a Reveal button.
import { other, lang, reduced } from './i18n.js';

const GRID = 24;
const THRESHOLD = 0.55;
const COLORS = ['#824628', '#c88c3c', '#fff5c8', '#5a6432', '#a06eb4', '#ffffff'];

let fontReady = null;
function fonts() {
  if (!fontReady) {
    const load = document.fonts
      ? Promise.all([document.fonts.load('700 20px nt-bukra'), document.fonts.load('700 20px nt-bukra', 'اكشط')])
      : Promise.resolve();
    fontReady = Promise.race([load, new Promise((r) => setTimeout(r, 1500))]).catch(() => {});
  }
  return fontReady;
}

export function initScratch(box, { button, onReveal } = {}) {
  const canvas = box.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const cells = new Uint8Array(GRID * GRID);
  let cleared = 0;
  let revealed = false;
  let painted = false;
  let started = false;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let last = null;

  const paint = () => {
    const r = box.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#c88c3c';
    ctx.fillRect(0, 0, w, h);
    // sand grain
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < (w * h) / 60; i++) {
      ctx.fillStyle = rnd() > 0.5 ? 'rgba(130,70,40,0.22)' : 'rgba(255,245,200,0.22)';
      const s = 1 + rnd() * 1.6;
      ctx.fillRect(rnd() * w, rnd() * h, s, s);
    }
    // soft hatch lines, like pencil shading
    ctx.strokeStyle = 'rgba(130,70,40,0.18)';
    ctx.lineWidth = 1;
    for (let x = -h; x < w; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + h * 0.6, 0);
      ctx.stroke();
    }
    // label in both languages, page language first
    const first = lang === 'ar' ? other.ar.scratch : other.en.scratch;
    const second = lang === 'ar' ? other.en.scratch : other.ar.scratch;
    const big = Math.max(16, Math.min(22, w / 16));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff5c8';
    ctx.font = `700 ${big}px nt-bukra, sans-serif`;
    ctx.direction = lang === 'ar' ? 'rtl' : 'ltr';
    ctx.fillText(first, w / 2, h / 2 - big * 0.4);
    ctx.font = `400 ${Math.round(big * 0.72)}px nt-bukra, sans-serif`;
    ctx.direction = lang === 'ar' ? 'ltr' : 'rtl';
    ctx.fillText(second, w / 2, h / 2 + big * 1.1);
    // coin-scratch hint: three short strokes
    ctx.strokeStyle = '#fff5c8';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 - 22 + i * 14, h / 2 - big * 2.1 + 10);
      ctx.lineTo(w / 2 - 12 + i * 14, h / 2 - big * 2.1 - 4);
      ctx.stroke();
    }
    painted = true;
    box.classList.add('is-painted');
  };

  const ready = () => {
    if (painted) return;
    fonts().then(paint);
  };

  const brush = () => Math.max(18, Math.min(30, w / 12));

  const mark = (x, y, rad) => {
    const cw = w / GRID;
    const ch = h / GRID;
    const c0 = Math.max(0, Math.floor((x - rad) / cw));
    const c1 = Math.min(GRID - 1, Math.floor((x + rad) / cw));
    const r0 = Math.max(0, Math.floor((y - rad) / ch));
    const r1 = Math.min(GRID - 1, Math.floor((y + rad) / ch));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * GRID + c;
        if (cells[i]) continue;
        const dx = (c + 0.5) * cw - x;
        const dy = (r + 0.5) * ch - y;
        if (dx * dx + dy * dy <= rad * rad) {
          cells[i] = 1;
          cleared++;
        }
      }
    }
  };

  const scratchTo = (x, y) => {
    const rad = brush();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = rad * 2;
    ctx.beginPath();
    const from = last || { x: x - 0.1, y };
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    const dist = Math.hypot(x - from.x, y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (rad / 2)));
    for (let i = 0; i <= steps; i++) mark(from.x + ((x - from.x) * i) / steps, from.y + ((y - from.y) * i) / steps, rad);
    last = { x, y };
    if (cleared / cells.length >= THRESHOLD) reveal(true);
  };

  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
  };

  let down = false;
  canvas.addEventListener('pointerdown', (e) => {
    if (revealed) return;
    if (!painted) paint();
    down = true;
    started = true;
    last = null;
    box.classList.add('is-scratching');
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    const p = pos(e);
    scratchTo(p.x, p.y);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (revealed) return;
    if (!down) {
      // a mouse drag that started just outside the panel still scratches
      if (e.pointerType !== 'mouse' || !(e.buttons & 1)) return;
      if (!painted) paint();
      down = true;
      started = true;
      last = null;
      box.classList.add('is-scratching');
    }
    const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of list.length ? list : [e]) {
      const p = pos(ev);
      scratchTo(p.x, p.y);
    }
  });
  const up = () => {
    down = false;
    last = null;
    box.classList.remove('is-scratching');
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);

  function reveal(burst) {
    if (revealed) return;
    revealed = true;
    down = false;
    box.classList.remove('is-scratching');
    box.classList.add('is-revealed');
    if (burst && !reduced) confetti(box);
    if (button) {
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('is-done');
    }
    onReveal && onReveal();
  }

  if (button) {
    button.addEventListener('click', () => {
      if (revealed) return;
      reveal(true);
    });
  }

  // Repaint on width change only while untouched.
  let lastW = 0;
  window.addEventListener('resize', () => {
    const nw = box.getBoundingClientRect().width;
    if (Math.abs(nw - lastW) < 2) return;
    lastW = nw;
    if (painted && !started && !revealed) paint();
  });

  return { ready, reveal };
}

function confetti(box) {
  const layer = document.createElement('div');
  layer.className = 'confetti';
  layer.setAttribute('aria-hidden', 'true');
  box.appendChild(layer);
  const n = 30;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('i');
    const s = 6 + Math.random() * 7;
    b.style.cssText = `width:${s}px;height:${s}px;background:${COLORS[i % COLORS.length]}`;
    layer.appendChild(b);
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
    const dist = 90 + Math.random() * 150;
    const dx = Math.cos(a) * dist;
    const dy = Math.sin(a) * dist;
    const rot = (Math.random() - 0.5) * 720;
    if (b.animate) {
      b.animate(
        [
          { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx * 0.8}px), calc(-50% + ${dy * 0.8}px)) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 120}px)) rotate(${rot}deg)`, opacity: 0 }
        ],
        { duration: 1100 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }
      );
    }
  }
  setTimeout(() => layer.remove(), 1800);
}
