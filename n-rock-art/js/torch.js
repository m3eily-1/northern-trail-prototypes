// The torch. A warm light follows the pointer (desktop), the finger (touch), or
// drifts with scroll (phones at rest). The light itself is one fixed layer moved
// with transform only. Carvings registered with lit() get their reveal mask
// centre updated from cached page offsets, so there are no layout reads per frame.
import { reduced, touch } from './i18n.js';

const lits = new Set();
const visible = new Set();
let io;
let el;
let R = 300;
let tx = 0;
let ty = 0;
let sx = 0;
let sy = 0;
let mode = 'idle'; // idle | pointer | finger | scroll
let lastInput = 0;
let lastScroll = -1;
let dirty = true;

function measure(item) {
  const r = item.el.getBoundingClientRect();
  item.x = r.left + scrollX;
  item.y = r.top + scrollY;
}

export function remeasure() {
  lits.forEach(measure);
  dirty = true;
}

// Register an element whose CSS mask uses --lx / --ly.
export function lit(node) {
  if (reduced) return;
  const item = { el: node, x: 0, y: 0, lx: NaN, ly: NaN };
  node.__lit = item;
  lits.add(item);
  measure(item);
  io && io.observe(node);
}

function drift(now) {
  const vw = innerWidth;
  const vh = innerHeight;
  if (mode === 'scroll' || (touch && mode !== 'finger')) {
    const s = scrollY;
    tx = vw * (0.5 + 0.3 * Math.sin(s / 460));
    ty = vh * (0.46 + 0.12 * Math.cos(s / 620));
  } else if (mode === 'idle') {
    // before the first pointer move: wander slowly over the hero
    const t = now / 1000;
    tx = vw * (0.34 + 0.12 * Math.sin(t * 0.45));
    ty = vh * (0.5 + 0.1 * Math.sin(t * 0.31 + 1.2));
  }
}

function frame(now) {
  if (mode === 'finger' && now - lastInput > 1600) mode = 'scroll';
  drift(now);
  const k = mode === 'pointer' ? 0.22 : 0.08;
  const nx = sx + (tx - sx) * k;
  const ny = sy + (ty - sy) * k;
  const moved = Math.abs(nx - sx) > 0.15 || Math.abs(ny - sy) > 0.15;
  sx = nx;
  sy = ny;
  const sc = scrollY;
  if (moved || dirty) el.style.transform = `translate3d(${(sx - R).toFixed(1)}px, ${(sy - R).toFixed(1)}px, 0)`;
  if (moved || dirty || sc !== lastScroll) {
    visible.forEach((item) => {
      const lx = Math.round(sx - (item.x - scrollX));
      const ly = Math.round(sy - (item.y - sc));
      if (lx !== item.lx || ly !== item.ly) {
        item.lx = lx;
        item.ly = ly;
        item.el.style.setProperty('--lx', `${lx}px`);
        item.el.style.setProperty('--ly', `${ly}px`);
      }
    });
    lastScroll = sc;
    dirty = false;
  }
  requestAnimationFrame(frame);
}

export function initTorch() {
  el = document.getElementById('torch');
  if (reduced) {
    el.remove();
    return;
  }
  R = el.offsetWidth / 2 || 300;
  sx = tx = innerWidth * 0.34;
  sy = ty = innerHeight * 0.5;
  if (touch) mode = 'scroll';

  io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const item = e.target.__lit;
        if (!item) return;
        if (e.isIntersecting) {
          measure(item);
          visible.add(item);
          dirty = true;
        } else visible.delete(item);
      }),
    { rootMargin: '120px 0px' }
  );
  lits.forEach((item) => io.observe(item.el));

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      mode = 'pointer';
      tx = e.clientX;
      ty = e.clientY;
      document.documentElement.classList.add('has-torch');
    },
    { passive: true }
  );
  const finger = (e) => {
    const p = e.touches && e.touches[0];
    if (!p) return;
    mode = 'finger';
    lastInput = performance.now();
    tx = p.clientX;
    ty = p.clientY;
  };
  addEventListener('touchstart', finger, { passive: true });
  addEventListener('touchmove', finger, { passive: true });
  document.addEventListener('pointerleave', () => {
    if (mode === 'pointer') document.documentElement.classList.remove('has-torch');
  });

  let rt;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      R = el.offsetWidth / 2 || R;
      remeasure();
    }, 120);
  };
  addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(document.body);
  requestAnimationFrame(frame);
}
