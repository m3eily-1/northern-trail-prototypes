// Tiny scroll-scene engine. No rAF dependency: scenes update straight from
// scroll/resize events (Chrome fires at most one scroll event per frame), so
// nothing stalls when the tab is hidden. Each scene measures, then writes.

const scenes = [];
let bound = false;

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOut = (x) => 1 - Math.pow(1 - x, 3);
export const range = (p, a, b) => clamp((p - a) / (b - a));

function update() {
  const vh = window.innerHeight;
  const reads = scenes.map((s) => s.measure(vh));
  for (let i = 0; i < scenes.length; i++) scenes[i].apply(reads[i]);
}

function resize() {
  for (const s of scenes) s.resize && s.resize();
  update();
}

// Pinned scene: the element is tall, its first child is sticky. progress 0..1
// runs across the extra height (element height minus sticky stage height).
export function pinned(el, stage, onProgress, onResize) {
  addScene({
    measure() {
      const r = el.getBoundingClientRect();
      const span = Math.max(1, r.height - stage.offsetHeight);
      return clamp((64 - r.top) / span);
    },
    apply: onProgress,
    resize: onResize
  });
}

// Pass-through scene: progress 0 when the element top sits at `from` (fraction
// of viewport height), 1 when it reaches `to`.
export function through(el, from, to, onProgress) {
  let last = -1;
  addScene({
    measure(vh) {
      const r = el.getBoundingClientRect();
      return clamp((vh * from - r.top) / (vh * (from - to)));
    },
    apply(p) {
      if (Math.abs(p - last) < 0.002) return;
      last = p;
      onProgress(p);
    }
  });
}

function addScene(s) {
  scenes.push(s);
  if (!bound) {
    bound = true;
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', resize);
  }
}

export function refresh() {
  resize();
}

// Add .is-in once an element enters the viewport (time-based CSS takes over).
let io;
export function inview(el, margin = '0px 0px -12% 0px') {
  if (!('IntersectionObserver' in window)) {
    el.classList.add('is-in');
    return;
  }
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: margin, threshold: 0.01 }
    );
  }
  io.observe(el);
}
