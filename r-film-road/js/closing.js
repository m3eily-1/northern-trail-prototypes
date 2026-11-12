// Closing: the tagline wipes in (right to left, the reading direction of the Arabic line) scrubbed
// to scroll; the closing line and logo rise in; the brand stamps peek in from the edges.

// position: inline side, top %, width px, rotation, phone visibility
const STICKERS = [
  { key: 'thadiq', side: 'start', top: 6, w: 200, r: -12, phone: true, pTop: 2 },
  { key: 'buraydah', side: 'end', top: 4, w: 180, r: 10, phone: true, pTop: 1 },
  { key: 'qassim', side: 'start', top: 46, w: 220, r: 8, phone: false },
  { key: 'salma', side: 'end', top: 42, w: 190, r: -8, phone: false },
  { key: 'jubbah', side: 'start', top: 78, w: 180, r: 14, phone: true, pTop: 86 },
  { key: 'hail', side: 'end', top: 76, w: 200, r: -14, phone: true, pTop: 85 },
];

export function initClosing(root, ctx) {
  const { gsap, data, t, rtl, asset, reduced, isPhone } = ctx;
  const tag = root.querySelector('.ntc-closing__tag span');
  tag.textContent = data.hero.tagline;
  root.querySelector('.ntc-closing__line').textContent = t(data.closing.line);

  // stickers
  const wrap = root.querySelector('.ntc-closing__stickers');
  const items = STICKERS.filter((s) => !isPhone || s.phone).map((s) => {
    const el = document.createElement('div');
    el.className = 'ntc-sticker';
    const w = isPhone ? Math.round(s.w * 0.5) : s.w;
    el.style.setProperty('--w', `${w}px`);
    el.style.setProperty('--r', `${s.r}deg`);
    el.style.top = `${isPhone ? s.pTop : s.top}%`;
    // peek: about 35% of the sticker hangs outside the section edge
    el.style.setProperty(s.side === 'start' ? 'inset-inline-start' : 'inset-inline-end', `${-Math.round(w * 0.35)}px`);
    el.innerHTML = `<img src="${asset(data.stickers[s.key])}" alt="" loading="lazy" draggable="false">`;
    wrap.appendChild(el);
    // physical direction that points out of the section for this sticker
    const startIsLeft = !rtl;
    const outward = (s.side === 'start') === startIsLeft ? -1 : 1;
    return { el, outward, w };
  });

  const reveals = root.querySelectorAll('[data-reveal]');
  if (reduced) {
    reveals.forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.4 }
  );
  reveals.forEach((el) => io.observe(el));

  gsap.fromTo(
    tag,
    { clipPath: 'inset(0% 0% 0% 100%)', y: 24 },
    {
      clipPath: 'inset(0% 0% 0% 0%)',
      y: 0,
      ease: 'power2.out',
      scrollTrigger: { trigger: root, start: 'top 80%', end: 'top 20%', scrub: 0.6 },
    }
  );
  items.forEach(({ el, outward, w }, i) => {
    gsap.fromTo(
      el,
      { x: outward * w * 0.7, rotation: outward * 12 },
      {
        x: 0,
        rotation: 0,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: `top ${85 - i * 4}%`, end: 'top 15%', scrub: 0.8 },
      }
    );
  });
}
