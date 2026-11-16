// Shared effects: film grain (canvas-generated noise, moved with transform), square custom cursor
// with contextual labels, and magnetic buttons. Desktop fine pointers only for cursor + magnetic.

export function initGrain(el) {
  const size = 192;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = (Math.random() * 255) | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  el.style.backgroundImage = `url(${c.toDataURL('image/png')})`;
}

export function initCursor(root, ctx) {
  const { L } = ctx;
  const cursor = root.querySelector('.ntc-cursor');
  const label = cursor.querySelector('.ntc-cursor__label');
  root.classList.add('has-cursor');

  let x = -100;
  let y = -100;
  let cx = x;
  let cy = y;
  let raf = 0;
  let state = '';

  const labelFor = (target) => {
    const zone = target.closest('[data-cursor]');
    const interactive = target.closest('a, button');
    if (zone) {
      const kind = zone.dataset.cursor;
      if (kind === 'view') return ['view', L.view];
      if (kind === 'drag') return ['drag', L.drag];
      if (kind === 'film') {
        if (interactive) return ['link', ''];
        return ['film', zone.dataset.cursorLabel || L.cursorPause];
      }
    }
    if (interactive) return ['link', ''];
    return ['', ''];
  };

  function apply(target) {
    const [s, text] = labelFor(target);
    const key = `${s}|${text}`;
    if (key === state) return;
    state = key;
    cursor.dataset.state = s;
    cursor.classList.toggle('has-label', Boolean(text));
    if (text) label.textContent = text;
  }

  function loop() {
    cx += (x - cx) * 0.22;
    cy += (y - cy) * 0.22;
    cursor.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(loop) : 0;
  }

  let lastTarget = null;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      x = e.clientX;
      y = e.clientY;
      cursor.classList.remove('is-hidden');
      lastTarget = e.target;
      apply(e.target);
      if (!raf) raf = requestAnimationFrame(loop);
    },
    { passive: true }
  );
  // labels can change under a still pointer (film paused, reel scrolled)
  window.addEventListener(
    'scroll',
    () => {
      const t = document.elementFromPoint(x, y);
      if (t) apply(t);
    },
    { passive: true }
  );
  const refresh = () => {
    state = '';
    if (lastTarget) apply(lastTarget);
  };
  root.addEventListener('click', () => requestAnimationFrame(refresh));
  window.addEventListener('ntc:cursor-refresh', refresh);
  window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
}

export function initMagnetic(root) {
  root.querySelectorAll('[data-magnetic]').forEach((el) => {
    let raf = 0;
    let tx = 0;
    let ty = 0;
    let px = 0;
    let py = 0;
    const strength = el.classList.contains('nt-btn') ? 0.3 : 0.22;
    const loop = () => {
      px += (tx - px) * 0.18;
      py += (ty - py) * 0.18;
      el.style.translate = `${px.toFixed(2)}px ${py.toFixed(2)}px`;
      raf = Math.abs(tx - px) + Math.abs(ty - py) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      tx = (e.clientX - (r.left + r.width / 2)) * strength;
      ty = (e.clientY - (r.top + r.height / 2)) * strength;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    el.addEventListener('pointerleave', () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    });
  });
}
