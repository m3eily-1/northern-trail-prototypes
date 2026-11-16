// FLIP reflow: measure, mutate the DOM, then animate every moved element from
// where it was. Interrupt-safe: running flips are measured mid-flight and restarted.
import { isReduced } from './util.js';

export function flip(scope, mutate, opts = {}) {
  const { stagger = 0, order, arc = true, duration = 440, skip } = opts;
  const els = [...scope.querySelectorAll('.k-chip')];
  const first = new Map(els.map((e) => [e, e.getBoundingClientRect()]));
  els.forEach((e) => {
    if (e._flip) { e._flip.cancel(); e._flip = null; }
  });
  mutate();
  if (isReduced()) return Promise.resolve();
  const moved = [];
  els.forEach((e) => {
    if (e === skip || !e.isConnected) return;
    const a = first.get(e);
    const b = e.getBoundingClientRect();
    if (!a.width || !b.width) return; // hidden before or after (phone tabs)
    const dx = a.left - b.left;
    const dy = a.top - b.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    moved.push({ e, dx, dy });
  });
  if (order) moved.sort((p, q) => order(p.e) - order(q.e));
  const done = moved.map(({ e, dx, dy }, i) => {
    const far = Math.hypot(dx, dy) > 160;
    const lift = far && arc ? Math.min(64, Math.hypot(dx, dy) * 0.12) : 0;
    const frames = far
      ? [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - lift}px) scale(1.05) rotate(${dx > 0 ? -2 : 2}deg)`, offset: 0.5 },
          { transform: 'none' },
        ]
      : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }];
    e.classList.toggle('is-flying', far);
    const anim = e.animate(frames, {
      duration: far ? duration + 160 : duration,
      delay: i * stagger,
      easing: 'cubic-bezier(.2,.8,.2,1)',
      fill: 'backwards',
    });
    e._flip = anim;
    return new Promise((res) => {
      const fin = () => {
        e.classList.remove('is-flying');
        if (e._flip === anim) e._flip = null;
        res(e);
      };
      anim.onfinish = fin;
      anim.oncancel = fin;
      // time based guard for hidden tabs
      setTimeout(fin, (far ? duration + 160 : duration) + i * stagger + 120);
    });
  });
  return Promise.all(done);
}

// Little "settled" bounce used after a drop or a menu add.
export function settle(el, color) {
  if (isReduced() || !el) return;
  el.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(0.96)', offset: 0.35 },
      { transform: 'scale(1.02)', offset: 0.7 },
      { transform: 'scale(1)' },
    ],
    { duration: 380, easing: 'ease-out' }
  );
  if (color) {
    const flash = el.querySelector('.k-chip__flash');
    flash?.animate([{ opacity: 0.55 }, { opacity: 0 }], { duration: 600, easing: 'ease-out' });
  }
}
