// MARQUEE: all 16 stop names, EN row and AR row running in opposite directions.
// Speed follows scroll velocity (and flips with scroll direction); a row eases to a stop on hover.
import { h, pad2, reduced, onVelocity, isPhone, clamp } from './lib.js';

export function initMarquee(data) {
  const root = document.getElementById('marquee');
  const rows = [
    { el: root.querySelector('.mq__row--a'), l: 'en', dir: -1 },
    { el: root.querySelector('.mq__row--b'), l: 'ar', dir: 1 },
  ];

  const makeSet = (l) => {
    const set = h('div', { class: 'mq__set' });
    data.stops.forEach((s) => set.append(
      h('span', { class: 'mq__item' },
        h('span', { class: 'mq__n' }, pad2(s.n)),
        h('span', { class: 'mq__word', lang: l, dir: l === 'ar' ? 'rtl' : 'ltr' }, s.name[l]),
        h('span', { class: 'mq__sep' })),
    ));
    return set;
  };

  rows.forEach((r) => {
    r.track = r.el.querySelector('.mq__track');
    r.track.append(makeSet(r.l));
    r.x = 0;
    r.hover = 1;
    r.hoverTarget = 1;
    r.el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') r.hoverTarget = 0; });
    r.el.addEventListener('pointerleave', () => (r.hoverTarget = 1));
  });

  const measure = () => {
    rows.forEach((r) => {
      const first = r.track.firstElementChild;
      // enough copies to cover 2x the viewport
      while (r.track.children.length > 1) r.track.lastElementChild.remove();
      r.w = first.getBoundingClientRect().width;
      const need = Math.max(2, Math.ceil((window.innerWidth * 2) / Math.max(1, r.w)) + 1);
      for (let i = 1; i < need; i++) r.track.append(first.cloneNode(true));
    });
  };

  if (reduced) return { measure() {} };

  let dirSign = 1; // flips when scrolling up
  let last = performance.now();
  onVelocity((v, now) => {
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    if (v < -0.02) dirSign += (-1 - dirSign) * 0.08;
    else if (v > 0.02) dirSign += (1 - dirSign) * 0.08;
    const base = isPhone() ? 42 : 70; // px per second
    const boost = 1 + clamp(Math.abs(v) * 4, 0, 9);
    const skew = clamp(-v * 2.4, -6, 6);
    rows.forEach((r) => {
      r.hover += (r.hoverTarget - r.hover) * 0.1;
      r.x += r.dir * dirSign * base * boost * r.hover * dt;
      if (r.w) {
        r.x %= r.w;
        if (r.x > 0) r.x -= r.w;
      }
      r.track.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0) skewX(${(skew * r.dir * -1).toFixed(2)}deg)`;
    });
  });

  return { measure };
}
