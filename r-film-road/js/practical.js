// "Before you go" (visitor tips) and FAQs, carried over from direction G: kinetic headers (words
// slide in, then skew with scroll speed), tip numbers that roll like an odometer, icon tiles that
// tilt on hover, and an accordion whose rules draw in.
//
// Delight layer: tip cards deal in with a slight spin, their icon tile springs open and the icon
// draws itself, then plays its own little act (the plane takes off, the mercury rises, the clock
// hand sweeps, the route redraws, the pump wobbles, the car drives off and back). On a mouse the
// card tilts toward the pointer under a soft light and replays the act; a tap replays it too.
// FAQ rows wipe a tint in on hover, numbers roll, and an opened answer arrives word by word.
//
// One component for every page: the landing page (initPractical, content.json) and each stop page
// (renderTips / renderFaq, Visit Saudi's tips and FAQs from stops.json). Tips may come without a
// title or icon; the icon is then picked from the tip's words. Without GSAP it renders static.
import { pad2 } from './labels.js?v=27';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const ICONS = {
  plane: '<path d="M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z"/>',
  temperature: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><path class="ic-m" d="M11.5 10v7"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path class="ic-r" d="M8.5 19h8a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path class="ic-h" d="M12 7v5l3.5 3.5"/>',
  fuel: '<path d="M3 22h12M4 9h10M14 22V3H4v19M14 13h3v4.5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
  car: '<path d="M5 17H3v-5l2-5h14l2 5v5h-2M5 12h14"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M9.5 17h5"/>',
};

// icon for a tip that has none, from its words (EN or AR); order matters: a road tip that also
// mentions the weather is about the road
const ICON_RULES = [
  ['fuel', /fuel|road conditions|الوقود|حالة الطر/i],
  ['plane', /airport|by air|مطار|جوًا/i],
  ['temperature', /weather|cold|clothing|الطقس|ملابس/i],
  ['clock', /opening hours|entry times|مواعيد/i],
  ['car', /\bcar\b|transportation|السيارة/i],
];
export const tipIcon = (text) => (ICON_RULES.find(([, re]) => re.test(text)) || ['route'])[0];
for (const k in ICONS) ICONS[k] = ICONS[k].replace(/<(path|circle) /g, '<$1 pathLength="1" ');
const tipCols = (n) => (n <= 5 ? Math.max(n, 1) : n % 4 === 0 ? 4 : 3);
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
  const { gsap, rtl } = ctx;
  const reduced = ctx.reduced || !gsap;
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

// ---------- visitor tips: [{ text, title?, icon? }] with strings already in the page language ----------
export function renderTips(root, ctx, { tips, eyebrow, title, id = 'px-tips-title' }) {
  const { gsap, ScrollTrigger } = ctx;
  const reduced = ctx.reduced || !gsap;
  root.setAttribute('aria-labelledby', id);
  root.innerHTML = `
    <div class="nt-wrap">
      ${header(id, eyebrow, title)}
      <ol class="tips" style="--tip-cols:${tipCols(tips.length)}">
        ${tips
          .map(
            (x, i) => `
          <li class="tip tip--${i % 5}">
            <span class="tip__top"><span class="tip__n" data-n="${pad2(i + 1)}"></span><span class="tip__ic" data-ic="${ICONS[x.icon || tipIcon(x.text)] ? x.icon || tipIcon(x.text) : 'route'}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[x.icon || tipIcon(x.text)] || ICONS.route}</svg></span></span>
            ${x.title ? `<h3 class="tip__title">${esc(x.title)}</h3>` : ''}
            <p class="tip__text">${esc(x.text)}</p>
          </li>`
          )
          .join('')}
      </ol>
    </div>`;
  animateHeader(root, ctx);
  const list = root.querySelector('.tips');
  const rolls = [...list.querySelectorAll('.tip__n')].map((n) => roller(n, n.dataset.n, reduced, gsap));
  if (!reduced) {
    const items = [...list.children];
    const dirx = ctx.rtl ? -1 : 1;
    // replay the icon's own act (CSS keyframes keyed on data-ic)
    const play = (li) => {
      const ic = li.querySelector('.tip__ic');
      ic.classList.remove('is-play');
      void ic.offsetWidth;
      ic.classList.add('is-play');
    };
    list.addEventListener('animationend', (e) => {
      if (e.target.closest('.tip__ic') && !e.target.closest('.tip__ic').getAnimations({ subtree: true }).length) e.target.closest('.tip__ic').classList.remove('is-play');
    });
    gsap.set(items, { opacity: 0, y: 56, scale: 0.94, rotation: (i) => (i % 2 ? 2.5 : -2.5) * dirx, transformOrigin: '50% 100%' });
    gsap.set(list.querySelectorAll('.tip__ic'), { scale: 0, rotation: -90 * dirx });
    ScrollTrigger.batch(items, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, { y: 0, opacity: 1, scale: 1, rotation: 0, duration: 1, ease: 'back.out(1.5)', stagger: 0.08, clearProps: 'transform,opacity' });
        batch.forEach((li, k) => {
          const ic = li.querySelector('.tip__ic');
          const d = 0.25 + k * 0.08;
          gsap.to(ic, { scale: 1, rotation: 0, duration: 0.9, ease: 'elastic.out(1, 0.55)', delay: d, clearProps: 'transform' });
          gsap.fromTo(ic.querySelectorAll('path, circle'), { strokeDasharray: 1, strokeDashoffset: 1 }, {
            strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', delay: d + 0.15, stagger: 0.08,
            clearProps: 'strokeDasharray,strokeDashoffset',
          });
          gsap.delayedCall(d + 1.15, () => play(li));
        });
      },
    });
    ScrollTrigger.create({ trigger: list, start: 'top 85%', once: true, onEnter: () => rolls.forEach((r, i) => r.play(1.2, 0.15 + i * 0.08)) });

    // tap replays the act; with a mouse the card leans toward the pointer under a soft light
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    items.forEach((li) => {
      li.addEventListener('click', () => play(li));
      if (!fine) return;
      li.addEventListener('pointerenter', () => play(li));
      li.addEventListener('pointermove', (e) => {
        const r = li.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        li.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        li.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        li.style.setProperty('--ry', `${((x - 0.5) * 9).toFixed(2)}deg`);
        li.style.setProperty('--rx', `${((0.5 - y) * 9).toFixed(2)}deg`);
        li.classList.add('is-tilt');
      });
      li.addEventListener('pointerleave', () => {
        li.classList.remove('is-tilt');
        li.style.removeProperty('--rx');
        li.style.removeProperty('--ry');
      });
    });
  }
}

// ---------- FAQs: [{ q, a }] ----------
export function renderFaq(root, ctx, { faq, eyebrow, title, id = 'px-faq-title' }) {
  const { gsap, ScrollTrigger } = ctx;
  const reduced = ctx.reduced || !gsap;
  root.setAttribute('aria-labelledby', id);
  root.innerHTML = `
    <div class="nt-wrap">
      ${header(id, eyebrow, title)}
      <ol class="qas">
        ${faq
          .map(
            (f, i) => `
          <li class="qa">
            <h3 class="qa__h">
              <button class="qa__btn" type="button" aria-expanded="false" aria-controls="qa-${i}" id="qa-${i}-b">
                <span class="qa__n">${pad2(i + 1)}</span><span class="qa__q">${esc(f.q)}</span><span class="qa__ic">${PLUS}</span>
              </button>
            </h3>
            <div class="qa__panel" id="qa-${i}" role="region" aria-labelledby="qa-${i}-b"><div class="qa__inner"><p class="qa__a">${esc(f.a)}</p></div></div>
          </li>`
          )
          .join('')}
      </ol>
    </div>`;
  animateHeader(root, ctx);
  const items = [...root.querySelectorAll('.qa')];
  const nums = items.map((li) => { const n = li.querySelector('.qa__n'); return roller(n, n.textContent, reduced, gsap); });
  // split an answer into words the first time it opens (spaces stay as text, so it reads the same)
  const words = (p) => {
    if (!p.dataset.split) {
      p.innerHTML = p.textContent.split(/(\s+)/).map((w) => (/^\s*$/.test(w) ? w : `<span class="qa__w">${esc(w)}</span>`)).join('');
      p.dataset.split = '1';
    }
    return p.querySelectorAll('.qa__w');
  };
  items.forEach((li, i) => {
    const btn = li.querySelector('.qa__btn');
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-expanded') === 'true';
      items.forEach((x, k) => {
        const open = !on && k === i;
        x.classList.toggle('is-open', open);
        x.querySelector('.qa__btn').setAttribute('aria-expanded', String(open));
      });
      if (!on && !reduced) {
        const w = words(li.querySelector('.qa__a'));
        gsap.fromTo(w, { y: '0.7em', opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: 'expo.out', delay: 0.12, stagger: { amount: Math.min(0.6, w.length * 0.012) }, clearProps: 'transform,opacity' });
        nums[i].play(0.8, 0);
      }
      if (ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 520);
    });
    if (!reduced) {
      ScrollTrigger.create({
        trigger: li,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          gsap.fromTo(li, { '--rule': 0 }, { '--rule': 1, duration: 1.1, ease: 'expo.out' });
          gsap.from(btn, { y: 24, opacity: 0, duration: 0.8, ease: 'expo.out', clearProps: 'transform,opacity' });
          nums[i].play(1, 0.1);
        },
      });
    }
  });
}

// ---------- landing page: the trail-wide tips and FAQs from content.json ----------
export function initPractical(tipsRoot, faqRoot, ctx) {
  const { data, t, L } = ctx;
  renderTips(tipsRoot, ctx, {
    eyebrow: L.tipsK,
    title: t(data.sections.tips.title),
    tips: data.tips.map((x) => ({ icon: x.icon, title: t(x.title), text: t(x.text) })),
  });
  renderFaq(faqRoot, ctx, {
    eyebrow: L.faqK,
    title: t(data.sections.faq.title),
    faq: data.faq.map((f) => ({ q: t(f.q), a: t(f.a) })),
  });
}
