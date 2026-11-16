// Pointer drag for stop chips (mouse and pen; touch uses the + menu).
// The real chip stays in the layout as a dashed slot that moves between zones
// (siblings reflow with FLIP). A lifted, tilted ghost follows the pointer and is
// pulled magnetically toward the slot; on drop it settles into the slot.
import { clamp, isReduced } from './util.js';

const THRESHOLD = 6;
const MAGNET = 140;

export function createDrag({ scope, host, zones, place, restore, commit, onStart, onEnd, suppressClick }) {
  let s = null; // active drag session

  scope.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.pointerType === 'touch') return;
    const chip = e.target.closest('.k-chip');
    if (!chip || e.target.closest('.k-chip__add')) return;
    s = {
      chip,
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      started: false,
    };
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onCancel);
  });

  function begin(e) {
    const { chip } = s;
    const r = chip.getBoundingClientRect();
    s.started = true;
    s.w = r.width;
    s.h = r.height;
    s.ox = e.clientX - r.left;
    s.oy = e.clientY - r.top;
    s.origin = { list: chip.parentElement, next: chip.nextElementSibling };
    s.x = r.left;
    s.y = r.top;
    s.vx = 0;
    s.rot = 0;
    s.lastX = e.clientX;
    s.lastT = performance.now();
    s.zone = null;

    const ghost = chip.cloneNode(true);
    ghost.classList.add('k-ghost');
    ghost.removeAttribute('id');
    ghost.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.width = `${r.width}px`;
    ghost.style.height = `${r.height}px`;
    host.append(ghost);
    s.ghost = ghost;
    chip.classList.add('is-slot');
    document.documentElement.classList.add('is-dragging');
    paint(true);
    if (!isReduced()) {
      ghost.animate(
        [{ boxShadow: '0 0 0 rgba(75,50,30,0)', scale: '1' }, { boxShadow: '0 24px 48px -12px rgba(75,50,30,.45)', scale: '1.05' }],
        { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' }
      );
    }
    s.scroller = setInterval(autoScroll, 16);
    onStart?.(chip);
  }

  function onMove(e) {
    if (!s || e.pointerId !== s.id) return;
    if (!s.started) {
      if (Math.hypot(e.clientX - s.x0, e.clientY - s.y0) < THRESHOLD) return;
      begin(e);
    }
    e.preventDefault();
    s.px = e.clientX;
    s.py = e.clientY;
    const now = performance.now();
    const dt = Math.max(8, now - s.lastT);
    s.vx = s.vx * 0.6 + ((e.clientX - s.lastX) / dt) * 16 * 0.4;
    s.lastX = e.clientX;
    s.lastT = now;
    track();
    clearTimeout(s.idle);
    s.idle = setTimeout(() => { if (s?.started) { s.vx = 0; paint(); } }, 120);
  }

  // Hit test zones, move the slot, then position the ghost (with magnet pull).
  function track() {
    const z = hit(s.px, s.py);
    if (z !== s.zone) {
      s.zone?.el.classList.remove('is-over');
      z?.el.classList.add('is-over');
      s.zone = z;
    }
    if (z) place(s.chip, z, s.py);
    else restore(s.chip, s.origin);
    paint();
  }

  function paint(instant) {
    let x = s.px != null ? s.px - s.ox : s.x;
    let y = s.py != null ? s.py - s.oy : s.y;
    if (s.zone) {
      const slot = s.chip.getBoundingClientRect();
      const d = Math.hypot(slot.left - x, slot.top - y);
      if (d < MAGNET) {
        const k = (1 - d / MAGNET) * 0.55;
        x += (slot.left - x) * k;
        y += (slot.top - y) * k;
      }
    }
    s.x = x;
    s.y = y;
    const target = clamp(s.vx * 1.4, -10, 10) + 2.5;
    s.rot = instant ? 2.5 : s.rot * 0.55 + target * 0.45;
    s.ghost.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${s.rot.toFixed(2)}deg)`;
  }

  function hit(x, y) {
    for (const z of zones()) {
      const r = z.el.getBoundingClientRect();
      if (!r.width) continue;
      if (x >= r.left - 16 && x <= r.right + 16 && y >= r.top - 16 && y <= r.bottom + 16) return z;
    }
    return null;
  }

  function autoScroll() {
    if (!s || s.py == null) return;
    const top = 64 + 96;
    const bottom = innerHeight - 72;
    let v = 0;
    if (s.py < top) v = -Math.ceil((top - s.py) / 6);
    else if (s.py > bottom) v = Math.ceil((s.py - bottom) / 6);
    if (v) {
      scrollBy(0, clamp(v, -22, 22));
      track();
    }
  }

  function finish(cancelled) {
    const { chip, ghost } = s;
    const sess = s;
    s = null;
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerup', onUp);
    removeEventListener('pointercancel', onCancel);
    clearInterval(sess.scroller);
    clearTimeout(sess.idle);
    sess.zone?.el.classList.remove('is-over');
    if (cancelled || !sess.zone) restore(chip, sess.origin);
    document.documentElement.classList.remove('is-dragging');
    suppressClick();

    const slot = chip.getBoundingClientRect();
    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      ghost.remove();
      chip.classList.remove('is-slot');
      commit(chip, !cancelled && !!sess.zone);
      onEnd?.(chip);
    };
    if (isReduced()) return end();
    const a = ghost.animate(
      [
        { transform: ghost.style.transform },
        { transform: `translate3d(${slot.left}px, ${slot.top}px, 0) rotate(-0.6deg)`, offset: 0.7 },
        { transform: `translate3d(${slot.left}px, ${slot.top}px, 0) rotate(0deg)` },
      ],
      { duration: 340, easing: 'cubic-bezier(.3,1.25,.5,1)', fill: 'forwards' }
    );
    ghost.animate([{ boxShadow: '0 24px 48px -12px rgba(75,50,30,.45)', scale: '1.05' }, { boxShadow: '0 0 0 rgba(75,50,30,0)', scale: '1' }], {
      duration: 340,
      easing: 'ease-out',
      fill: 'forwards',
    });
    a.onfinish = end;
    setTimeout(end, 480);
  }

  function onUp(e) {
    if (!s || e.pointerId !== s.id) return;
    if (!s.started) {
      cleanupIdle();
      return;
    }
    finish(false);
  }

  function onCancel(e) {
    if (!s || e.pointerId !== s.id) return;
    if (!s.started) return cleanupIdle();
    finish(true);
  }

  function cleanupIdle() {
    s = null;
    removeEventListener('pointermove', onMove);
    removeEventListener('pointerup', onUp);
    removeEventListener('pointercancel', onCancel);
  }

  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && s?.started) finish(true);
  });

  return { get active() { return !!s?.started; } };
}
