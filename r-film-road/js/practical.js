// "Before you go" (visitor tips) and FAQs, carried over from direction G: kinetic headers (words
// slide in, then skew with scroll speed), tip numbers that roll like an odometer, icon tiles that
// tilt on hover, and an accordion whose rules draw in.
import { pad2 } from './labels.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const ICONS = {
  plane: '<path d="M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z"/>',
  temperature: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><path d="M11.5 10v7"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19h8a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 3.5"/>',
  fuel: '<path d="M3 22h12M4 9h10M14 22V3H4v19M14 13h3v4.5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
};
const PLUS = '<svg viewBox="0 0 20 20" aria-hidden="true"><path class="px-v" d="M10 3v14"/><path d="M3 10h14"/></svg>';

// ---------- odometer digits ----------
const DIGITS = '01234567890123456789';
function roller(el, value, reduced, gsap) {
  el.textContent = '';
  el.setAttribute('aria-label', value);
  const cols = [];
  for (const ch of value) {
    const slot = document.createElement('span');
    slot.className = 'roll';
    slot.setAttribute('aria-hidden', 'true');
    slot.innerHTML = `<span class="roll__sizer">${ch}</span><span class="roll__strip">${[...DIGITS].map((d) => `<span class="roll__d">${d}</span>`).join('')}</span>`;
    el.appendChild(slot);
    cols.push({ strip: slot.querySelector('.roll__strip'), d: +ch });
  }
  const set = (p) =>
    cols.forEach((c, i) => {
      const local = clamp(p * (1 + cols.length * 0.12) - i * 0.12, 0, 1);
      c.strip.style.transform = `translateY(${(-(10 + c.d) * local * 100) / DIGITS.length}%)`;
    });
  set(reduced ? 1 : 0);
  return {
    play(dur, delay) {
      if (reduced) return;
      const o = { p: 0 };
      gsap.to(o, { p: 1, duration: dur, delay, ease: 'expo.out', onUpdate: () => set(o.p) });
    },
  };
}

// ---------- scroll-speed skew on big titles ----------
function kinetic(els, reduced) {
  if (reduced) return;
  const live = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? live.add(e.target) : live.delete(e.target))));
  els.forEach((e) => io.observe(e));
  let vel = 0;
  let lastY = scrollY;
  let lastT = performance.now();
  const tick = (now) => {
    const dt = Math.max(8, now - lastT);
    vel += ((scrollY - lastY) / dt - vel) * 0.12;
    if (Math.abs(vel) < 0.0005) vel = 0;
    lastY = scrollY;
    lastT = now;
    const s = clamp(-vel * 3.2, -5, 5);
    const sx = 1 + clamp(Math.abs(vel) * 0.056, 0, 0.04);
    const tr = Math.abs(s) < 0.02 ? '' : `skewX(${s.toFixed(2)}deg) scaleX(${sx.toFixed(3)})`;
    live.forEach((e) => {
      if (e._kt !== tr) {
        e.style.transform = tr;
        e._kt = tr;
      }
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function header(id, eyebrow, title) {
  const words = title.split(' ');
  return `
    <header class="px-head">
      <p class="px-eyebrow">${esc(eyebrow)}</p>
      <h2 class="px-title" id="${id}">${words.map((w) => `<span class="px-w"><span class="px-wi">${esc(w)}</span></span>`).join(' ')}</h2>
    </header>`;
}

function animateHeader(root, ctx) {
  const { gsap, rtl, reduced } = ctx;
  const head = root.querySelector('.px-head');
  const title = head.querySelector('.px-title');
  kinetic([title], reduced);
  if (reduced) return;
  gsap.fromTo(title.querySelectorAll('.px-wi'), { xPercent: 70 * (rtl ? 1 : -1), opacity: 0 }, {
    xPercent: 0,
    opacity: 1,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.08,
    scrollTrigger: { trigger: head, start: 'top 85%', once: true },
  });
  gsap.from(head.querySelector('.px-eyebrow'), {
    y: 20,
    opacity: 0,
    duration: 0.9,
    ease: 'expo.out',
    delay: 0.15,
    scrollTrigger: { trigger: head, start: 'top 85%', once: true },
  });
}

export function initPractical(tipsRoot, faqRoot, ctx) {
  const { gsap, ScrollTrigger, data, t, L, reduced } = ctx;

  // ---------- before you go ----------
  tipsRoot.setAttribute('aria-labelledby', 'px-tips-title');
  tipsRoot.innerHTML = `
    <div class="nt-wrap">
      ${header('px-tips-title', L.tipsK, t(data.sections.tips.title))}
      <ol class="tips">
        ${data.tips
          .map(
            (x, i) => `
          <li class="tip tip--${i % 5}">
            <span class="tip__top"><span class="tip__n" data-n="${pad2(i + 1)}"></span><span class="tip__ic"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[x.icon] || ICONS.route}</svg></span></span>
            <h3 class="tip__title">${esc(t(x.title))}</h3>
            <p class="tip__text">${esc(t(x.text))}</p>
          </li>`
          )
          .join('')}
      </ol>
    </div>`;
  animateHeader(tipsRoot, ctx);
  const list = tipsRoot.querySelector('.tips');
  const rolls = [...list.querySelectorAll('.tip__n')].map((n) => roller(n, n.dataset.n, reduced, gsap));
  if (!reduced) {
    const tips = [...list.children];
    gsap.set(tips, { opacity: 0, y: 48 });
    ScrollTrigger.batch(tips, {
      start: 'top 92%',
      once: true,
      onEnter: (b) => gsap.to(b, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.07, clearProps: 'transform,opacity' }),
    });
    ScrollTrigger.create({ trigger: list, start: 'top 85%', once: true, onEnter: () => rolls.forEach((r, i) => r.play(1.2, 0.15 + i * 0.08)) });
  }

  // ---------- FAQs ----------
  faqRoot.setAttribute('aria-labelledby', 'px-faq-title');
  faqRoot.innerHTML = `
    <div class="nt-wrap">
      ${header('px-faq-title', L.faqK, t(data.sections.faq.title))}
      <ol class="qas">
        ${data.faq
          .map(
            (f, i) => `
          <li class="qa">
            <h3 class="qa__h">
              <button class="qa__btn" type="button" aria-expanded="false" aria-controls="qa-${i}" id="qa-${i}-b">
                <span class="qa__n">${pad2(i + 1)}</span><span class="qa__q">${esc(t(f.q))}</span><span class="qa__ic">${PLUS}</span>
              </button>
            </h3>
            <div class="qa__panel" id="qa-${i}" role="region" aria-labelledby="qa-${i}-b"><div class="qa__inner"><p class="qa__a">${esc(t(f.a))}</p></div></div>
          </li>`
          )
          .join('')}
      </ol>
    </div>`;
  animateHeader(faqRoot, ctx);
  const items = [...faqRoot.querySelectorAll('.qa')];
  items.forEach((li, i) => {
    const btn = li.querySelector('.qa__btn');
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-expanded') === 'true';
      items.forEach((x, k) => {
        const open = !on && k === i;
        x.classList.toggle('is-open', open);
        x.querySelector('.qa__btn').setAttribute('aria-expanded', String(open));
      });
      if (!on && !reduced) gsap.fromTo(li.querySelector('.qa__a'), { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.1 });
      setTimeout(() => ScrollTrigger.refresh(), 520);
    });
    if (!reduced) {
      ScrollTrigger.create({
        trigger: li,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          gsap.fromTo(li, { '--rule': 0 }, { '--rule': 1, duration: 1.1, ease: 'expo.out' });
          gsap.from(btn, { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform,opacity' });
        },
      });
    }
  });
}
