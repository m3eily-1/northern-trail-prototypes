// TossField: drag, throw and spring-settle physics for a set of absolutely positioned items.
// One rAF loop per field that only runs while something is moving. Transform-only output.
//
// Item DOM contract: <div class="toss"><div class="toss__in"><shadow class="toss__shadow"/><face/></div></div>
// The field writes the transform of .toss (position, rotation, lift scale) and of .toss__shadow.
// .toss__in is left free for entrance animations.

const FRICTION = 3.2; // velocity decay per second (exp). Throw distance = v / FRICTION.
const MAX_SPEED = 3200;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export class TossField {
  constructor(container, { protect = () => [], margin = 8, reduced = false, onGrab = null, onLoose = null, onDock = null, restShadow = 0.22 } = {}) {
    this.restShadow = restShadow;
    this.onLoose = onLoose;
    this.onDock = onDock;
    this.c = container;
    this.items = [];
    this.protect = protect;
    this.margin = margin;
    this.reduced = reduced;
    this.onGrab = onGrab;
    this.z = 10;
    this.raf = 0;
    this.last = 0;
    this.tick = this.tick.bind(this);
    this.measure();
  }

  measure() {
    this.W = this.c.clientWidth;
    this.H = this.c.clientHeight;
  }

  add(el, { x = 0, y = 0, rot = 0 } = {}) {
    const it = {
      el,
      shadow: el.querySelector('.toss__shadow'),
      x, y, rot, rest: rot,
      vx: 0, vy: 0, vr: 0,
      s: 1, vs: 0, sT: 1,
      drag: false, home: null, active: false, moved: false,
      w: el.offsetWidth, h: el.offsetHeight,
      samples: [],
    };
    el.addEventListener('pointerdown', (e) => this.down(e, it));
    el.addEventListener('pointermove', (e) => this.move(e, it));
    el.addEventListener('pointerup', (e) => this.up(e, it));
    el.addEventListener('pointercancel', (e) => this.up(e, it));
    el.addEventListener('lostpointercapture', (e) => { if (it.drag) this.up(e, it); });
    el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && !it.drag) { it.sT = 1.04; this.wake(it); } });
    el.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !it.drag) { it.sT = 1; this.wake(it); } });
    el.addEventListener('dragstart', (e) => e.preventDefault());
    this.items.push(it);
    this.apply(it);
    return it;
  }

  resizeItem(it) {
    it.w = it.el.offsetWidth;
    it.h = it.el.offsetHeight;
  }

  local(e) {
    const r = this.c.getBoundingClientRect();
    return { px: e.clientX - r.left, py: e.clientY - r.top };
  }

  down(e, it) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try { it.el.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    const { px, py } = this.local(e);
    it.drag = true;
    it.moved = true;
    it.home = null;
    it.ox = px - it.x;
    it.oy = py - it.y;
    it.vx = it.vy = 0;
    it.samples = [{ t: performance.now(), x: px, y: py }];
    it.sT = 1.12;
    it.el.style.zIndex = ++this.z;
    it.el.classList.add('is-held', 'is-loose');
    if (this.onLoose) this.onLoose(it);
    this.c.classList.add('is-dragging');
    if (this.onGrab) this.onGrab(it);
    this.wake(it);
  }

  move(e, it) {
    if (!it.drag) return;
    const { px, py } = this.local(e);
    const m = this.margin;
    it.x = clamp(px - it.ox, m - it.w * 0.35, this.W - it.w * 0.65 - m);
    it.y = clamp(py - it.oy, m - it.h * 0.35, this.H - it.h * 0.65 - m);
    const now = performance.now();
    it.samples.push({ t: now, x: px, y: py });
    while (it.samples.length > 2 && now - it.samples[0].t > 90) it.samples.shift();
    const a = it.samples[0];
    const dt = Math.max(0.008, (now - a.t) / 1000);
    it.vx = (px - a.x) / dt;
    it.vy = (py - a.y) / dt;
  }

  up(e, it) {
    if (!it.drag) return;
    it.drag = false;
    it.el.classList.remove('is-held');
    this.c.classList.remove('is-dragging');
    const now = performance.now();
    const lastT = it.samples.length ? it.samples[it.samples.length - 1].t : now;
    if (now - lastT > 80 || this.reduced) { it.vx = 0; it.vy = 0; }
    const sp = Math.hypot(it.vx, it.vy);
    if (sp > MAX_SPEED) { it.vx *= MAX_SPEED / sp; it.vy *= MAX_SPEED / sp; }
    it.sT = e && e.pointerType === 'mouse' && it.el.matches(':hover') ? 1.04 : 1;
    it.rest = clamp(it.rot * 0.6, -16, 16);
    it.vr = this.reduced ? 0 : it.vx * 0.06;
    this.wake(it);
  }

  // Throw an item so that friction brings it to rest at (tx, ty).
  fling(it, tx, ty, spin = 0) {
    it.home = null;
    it.moved = true;
    it.vx = (tx - it.x) * FRICTION;
    it.vy = (ty - it.y) * FRICTION;
    it.vr = spin;
    it.rest = clamp(it.rot + spin * 0.05, -18, 18);
    it.s = 1.1;
    it.el.style.zIndex = ++this.z;
    it.el.classList.add('is-loose');
    if (this.onLoose) this.onLoose(it);
    if (this.reduced) { it.x = tx; it.y = ty; it.vx = it.vy = 0; it.vr = 0; it.s = 1; this.apply(it); return; }
    this.wake(it);
  }

  // Spring an item to a fixed spot (used for "put back" and for clearing protected text).
  sendHome(it, x, y, rot, { docked = false } = {}) {
    it.home = { x, y, rot };
    it.docked = docked;
    if (this.reduced) {
      it.x = x; it.y = y; it.rot = it.rest = rot; it.home = null; it.vx = it.vy = it.vr = 0;
      if (docked) { it.moved = false; it.el.classList.remove('is-loose'); if (this.onDock) this.onDock(it); }
      this.apply(it);
      return;
    }
    this.wake(it);
  }

  place(it, x, y, rot = it.rot) {
    it.x = x; it.y = y; it.rot = it.rest = rot; it.vx = it.vy = it.vr = 0; it.home = null;
    this.apply(it);
  }

  wake(it) {
    it.active = true;
    if (!this.raf) {
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  wakeAll() { this.items.forEach((it) => this.wake(it)); }

  // Keep everything inside the box after a resize.
  clampAll() {
    this.measure();
    const m = this.margin;
    this.items.forEach((it) => {
      this.resizeItem(it);
      it.x = clamp(it.x, m, Math.max(m, this.W - it.w - m));
      it.y = clamp(it.y, m, Math.max(m, this.H - it.h - m));
      this.apply(it);
      this.wake(it);
    });
  }

  // Axis-aligned extents of the item at its resting rotation.
  extents(it) {
    const a = (Math.abs(it.rest) * Math.PI) / 180;
    return { aw: it.w * Math.cos(a) + it.h * Math.sin(a), ah: it.w * Math.sin(a) + it.h * Math.cos(a) };
  }

  overlaps(it, x = it.x, y = it.y) {
    const { aw, ah } = this.extents(it);
    const l = x + it.w / 2 - aw / 2;
    const t = y + it.h / 2 - ah / 2;
    for (const p of this.protect()) {
      if (l < p.r - 0.5 && l + aw > p.l + 0.5 && t < p.b - 0.5 && t + ah > p.t + 0.5) return p;
    }
    return null;
  }

  // Smallest move that takes the item outside the protected rect while staying in bounds.
  exitFor(it, p) {
    const m = this.margin;
    const maxX = this.W - it.w - m;
    const maxY = this.H - it.h - m;
    const { aw, ah } = this.extents(it);
    const cands = [
      { x: p.l - it.w / 2 - aw / 2, y: it.y },
      { x: p.r - it.w / 2 + aw / 2, y: it.y },
      { x: it.x, y: p.t - it.h / 2 - ah / 2 },
      { x: it.x, y: p.b - it.h / 2 + ah / 2 },
    ]
      .filter((c) => c.x >= m - 0.5 && c.x <= maxX + 0.5 && c.y >= m - 0.5 && c.y <= maxY + 0.5)
      .filter((c) => !this.overlaps(it, c.x, c.y))
      .map((c) => ({ ...c, d: Math.hypot(c.x - it.x, c.y - it.y) }))
      .sort((a, b) => a.d - b.d);
    if (cands.length) return cands[0];
    return { x: clamp(it.x, m, maxX), y: m };
  }

  tick(t) {
    const dt = Math.min(0.034, Math.max(0.001, (t - this.last) / 1000));
    this.last = t;
    let any = false;
    const m = this.margin;
    for (const it of this.items) {
      if (!it.active) continue;
      any = true;

      // Lift scale spring (underdamped for a little overshoot on landing).
      if (this.reduced) { it.s = it.sT; it.vs = 0; }
      else {
        const as = 520 * (it.sT - it.s) - 22 * it.vs;
        it.vs += as * dt;
        it.s += it.vs * dt;
      }

      if (it.drag) {
        const target = it.rest + clamp(it.vx * 0.012, -22, 22);
        it.rot += (target - it.rot) * (1 - Math.exp(-12 * dt));
      } else if (it.home) {
        const h = it.home;
        const ax = 110 * (h.x - it.x) - 18 * it.vx;
        const ay = 110 * (h.y - it.y) - 18 * it.vy;
        it.vx += ax * dt; it.vy += ay * dt;
        it.x += it.vx * dt; it.y += it.vy * dt;
        const ar = 120 * (h.rot - it.rot) - 16 * it.vr;
        it.vr += ar * dt; it.rot += it.vr * dt;
        if (Math.hypot(h.x - it.x, h.y - it.y) < 0.4 && Math.hypot(it.vx, it.vy) < 6 && Math.abs(h.rot - it.rot) < 0.2) {
          it.x = h.x; it.y = h.y; it.rot = it.rest = h.rot; it.vx = it.vy = it.vr = 0;
          it.home = null;
          if (it.docked) { it.moved = false; it.el.classList.remove('is-loose'); if (this.onDock) this.onDock(it); }
        }
      } else {
        const decay = Math.exp(-FRICTION * dt);
        it.x += it.vx * dt; it.y += it.vy * dt;
        it.vx *= decay; it.vy *= decay;
        const maxX = this.W - it.w - m;
        const maxY = this.H - it.h - m;
        if (it.x < m) { it.x = m; it.vx = Math.abs(it.vx) * 0.5; it.vr += it.vy * 0.03; }
        else if (it.x > maxX) { it.x = Math.max(m, maxX); it.vx = -Math.abs(it.vx) * 0.5; it.vr -= it.vy * 0.03; }
        if (it.y < m) { it.y = m; it.vy = Math.abs(it.vy) * 0.5; it.vr -= it.vx * 0.03; }
        else if (it.y > maxY) { it.y = Math.max(m, maxY); it.vy = -Math.abs(it.vy) * 0.5; it.vr += it.vx * 0.03; }
        const ar = 140 * (it.rest - it.rot) - 9 * it.vr;
        it.vr += ar * dt; it.rot += it.vr * dt;
      }

      this.apply(it);

      const still = !it.drag && !it.home
        && Math.hypot(it.vx, it.vy) < 14
        && Math.abs(it.sT - it.s) < 0.002 && Math.abs(it.vs) < 0.02
        && Math.abs(it.rest - it.rot) < 0.15 && Math.abs(it.vr) < 0.6;
      if (still) {
        const p = this.overlaps(it);
        if (p) {
          const ex = this.exitFor(it, p);
          this.sendHome(it, ex.x, ex.y, it.rot);
        } else {
          it.vx = it.vy = it.vr = 0;
          it.s = it.sT;
          it.rot = it.rest;
          this.apply(it);
          it.active = false;
        }
      }
    }
    this.raf = any ? requestAnimationFrame(this.tick) : 0;
  }

  apply(it) {
    it.el.style.transform = `translate3d(${it.x.toFixed(2)}px, ${it.y.toFixed(2)}px, 0) rotate(${it.rot.toFixed(2)}deg) scale(${it.s.toFixed(4)})`;
    if (it.shadow) {
      const lift = clamp((it.s - 1) / 0.12, 0, 1.4);
      it.shadow.style.transform = `translate3d(${(lift * 8).toFixed(2)}px, ${(3 + lift * 18).toFixed(2)}px, 0) scale(${(1 + lift * 0.04).toFixed(4)})`;
      it.shadow.style.opacity = (this.restShadow + lift * 0.2).toFixed(3);
    }
  }
}
