// Intro: "What is the Northern Trail?" + four stats as ticket stubs, then the three pillars as postcards.
import { esc, pad2 } from './i18n.js';

export function mountIntro(root, ctx) {
  const { C, lang, t, reduced, asset } = ctx;
  const gsap = window.gsap;
  const stats = C.intro.stats;

  root.innerHTML = `
    <div class="nt-wrap">
      <div class="intro__grid">
        <div class="intro__text" data-reveal>
          <h2 class="nt-h2">${esc(C.intro.title[lang])}</h2>
          <p class="nt-lede">${esc(C.intro.body[lang])}</p>
        </div>
        <ul class="tix-list">
          ${stats.map((s, i) => `
            <li class="tix" data-reveal style="--d:${i * 80}ms">
              <span class="tix__no" aria-hidden="true">${pad2(i + 1)}</span>
              <p class="tix__val"><span class="tix__num" data-value="${esc(s.value)}">${esc(s.value)}</span>${s.unit ? `<span class="tix__unit">${esc(s.unit[lang])}</span>` : ''}</p>
              <p class="tix__label">${esc(s.label[lang])}</p>
            </li>`).join('')}
        </ul>
      </div>

      <div class="pillars">
        <p class="nt-eyebrow pillars__eyebrow" data-reveal>${t.postcards}</p>
        <ul class="cards">
          ${C.pillars.map((p, i) => `
            <li class="pc-slot" data-reveal style="--d:${i * 90}ms">
              <article class="pc" style="--pc:${p.color}; --tilt:${[-1.6, 1.1, -0.7][i]}deg">
                <div class="pc__front">
                  <img src="${asset(p.art)}" alt="" loading="lazy" decoding="async">
                </div>
                <div class="pc__back">
                  <div class="pc__top">
                    <span class="pc__no" aria-hidden="true">${pad2(i + 1)} / 03</span>
                    <span class="pc__stamp" aria-hidden="true"><img src="${asset(p.art)}" alt="" loading="lazy"></span>
                  </div>
                  <h3 class="pc__name">${esc(p.name[lang])}</h3>
                  <p class="pc__line">${esc(p.line[lang])}</p>
                  <span class="pc__rule" aria-hidden="true"></span>
                  <span class="pc__rule" aria-hidden="true"></span>
                </div>
              </article>
            </li>`).join('')}
        </ul>
      </div>
    </div>`;

  // Count the stats up when their ticket reveals.
  if (!reduced && gsap) {
    const nums = [...root.querySelectorAll('.tix__num')];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const raw = el.dataset.value;
        const target = parseFloat(raw.replace(/,/g, ''));
        const decimals = (raw.split('.')[1] || '').length;
        const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
        const o = { v: 0 };
        el.style.minWidth = `${el.offsetWidth}px`;
        el.textContent = fmt(0);
        gsap.to(o, { v: target, duration: 1.4, ease: 'power3.out', delay: 0.15, onUpdate: () => { el.textContent = fmt(o.v); } });
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => io.observe(n));
  }
}
