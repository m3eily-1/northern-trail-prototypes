// Chisel reveals. `[data-chisel]` headings are struck in with a stepped, jagged
// wipe (CSS) and throw a little stone dust; `[data-words]` paragraphs land word
// by word; `[data-rise]` blocks lift into place. One observer for all.
import { reduced, rtl } from './i18n.js';

let io;

export function dust(target, n = 10, spread) {
  if (reduced || !target.isConnected) return;
  const r = target.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return;
  const layer = document.createElement('div');
  layer.className = 'dust';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = `left:${r.left + scrollX}px;top:${r.top + scrollY}px;width:${r.width}px;height:${r.height}px`;
  document.body.appendChild(layer);
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    const along = Math.random();
    const x = rtl ? (1 - along) * r.width : along * r.width;
    const y = (spread ?? 0.8) * Math.random() * r.height + r.height * 0.1;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    const s = 2 + Math.random() * 3;
    p.style.width = p.style.height = `${s}px`;
    layer.appendChild(p);
    const dx = (Math.random() - 0.5) * 60;
    const dy = 20 + Math.random() * 50;
    p.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${Math.random() * 180}deg)`, opacity: 0 }
      ],
      { duration: 700 + Math.random() * 500, delay: (rtl ? 1 - along : along) * 520, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'both' }
    );
  }
  setTimeout(() => layer.remove(), 2000);
}

function show(el) {
  el.classList.add('is-in');
  if (el.hasAttribute('data-chisel') && !el.hasAttribute('data-nodust')) dust(el, Math.min(18, 6 + Math.round(el.offsetWidth / 60)));
}

export function reveal(scope = document) {
  const els = scope.querySelectorAll('[data-chisel]:not(.is-in), [data-words]:not(.is-in), [data-rise]:not(.is-in), [data-stagger]:not(.is-in)');
  if (reduced) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  if (!io)
    io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          show(e.target);
        }),
      { rootMargin: '0px 0px -12% 0px' }
    );
  els.forEach((el) => io.observe(el));
}

export { show as revealNow };
