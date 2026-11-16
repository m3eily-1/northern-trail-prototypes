// Intro: what the trail is, the numbers as an instrument cluster, and the three
// pillars as three small windows you can look around in.
import { t, esc, asset, ui, reduced, splitWords, inview, num, gsap, rtl } from './util.js';

export function initIntro(data) {
  const root = document.getElementById('intro');
  const { intro, pillars } = data;

  const stat = (s, i) => {
    const raw = String(s.value);
    return `<li class="gauge" style="--i:${i}">
      <span class="gauge__scale" aria-hidden="true"></span>
      <span class="gauge__v"><span class="gauge__n" data-to="${esc(raw)}">${esc(raw)}</span>${s.unit ? `<span class="gauge__u">${esc(t(s.unit))}</span>` : ''}</span>
      <span class="gauge__l">${esc(t(s.label))}</span>
    </li>`;
  };

  const pillar = (p, i) => `<li class="pillar" style="--i:${i};--c:${esc(p.color)}">
      <div class="pillar__win" aria-hidden="true">
        <i class="pillar__sky"></i>
        <i class="pillar__ground"></i>
        <img class="pillar__art" src="${asset(p.art)}" alt="" loading="lazy" decoding="async">
        <i class="pillar__glass"></i>
      </div>
      <h3 class="pillar__name">${esc(t(p.name))}</h3>
      <p class="pillar__line">${esc(t(p.line))}</p>
    </li>`;

  root.innerHTML = `
    <div class="nt-wrap intro__wrap">
      <div class="intro__head">
        <p class="nt-eyebrow intro__eyebrow">${esc(ui.beforeOff)}</p>
        <h2 class="nt-h2 intro__title" id="intro-title">${esc(t(intro.title))}</h2>
        <p class="nt-lede intro__body">${esc(t(intro.body))}</p>
      </div>
      <ul class="intro__stats">${intro.stats.map(stat).join('')}</ul>
      <div class="pillars">
        <p class="nt-eyebrow pillars__eyebrow">${esc(ui.outWindow)}</p>
        <ul class="pillars__list">${pillars.map(pillar).join('')}</ul>
      </div>
    </div>`;

  splitWords(root.querySelector('.intro__title'));
  inview(root.querySelector('.intro__head'));
  inview(root.querySelector('.pillars'));
  inview(root.querySelector('.intro__stats'), '0px 0px -10% 0px', countUp);

  // Look around inside each pillar window.
  if (!reduced && matchMedia('(hover: hover)').matches) {
    root.querySelectorAll('.pillar__win').forEach((w) => {
      w.addEventListener('pointermove', (e) => {
        const r = w.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        w.style.setProperty('--lx', (x * (rtl ? -1 : 1)).toFixed(3));
        w.style.setProperty('--ly', y.toFixed(3));
      });
      w.addEventListener('pointerleave', () => {
        w.style.setProperty('--lx', '0');
        w.style.setProperty('--ly', '0');
      });
    });
  }
}

// Count each figure up from zero, keeping its format (1,200 / 13.5).
function countUp(list) {
  const g = gsap();
  if (reduced || !g) return;
  list.querySelectorAll('.gauge__n').forEach((el, i) => {
    const raw = el.dataset.to;
    const to = parseFloat(raw.replace(/,/g, ''));
    const dec = (raw.split('.')[1] || '').length;
    const o = { v: 0 };
    g.to(o, {
      v: to,
      duration: 1.4,
      delay: 0.15 + i * 0.1,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = num(o.v, dec)),
      onComplete: () => (el.textContent = raw)
    });
  });
}
