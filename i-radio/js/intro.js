// Intro stats (tape-counter windows) and the three pillars as cassettes.
import { t, esc, asset, l, isReduced, tween } from './util.js';

export function mountIntro(root, data) {
  const { intro } = data;
  root.innerHTML = `
    <div class="nt-wrap intro__grid">
      <div class="intro__copy">
        <h2 class="nt-h2" data-reveal>${esc(t(intro.title))}</h2>
        <p class="nt-lede intro__body" data-reveal>${esc(t(intro.body))}</p>
      </div>
      <ul class="stats">
        ${intro.stats
          .map(
            (s, i) => `
          <li class="stat" data-reveal style="transition-delay:${i * 70}ms">
            <div class="stat__win">
              <span class="stat__val" data-count="${esc(s.value)}">${esc(s.value)}</span>${
                s.unit ? `<span class="stat__unit">${esc(t(s.unit))}</span>` : ''
              }
            </div>
            <p class="stat__label">${esc(t(s.label))}</p>
          </li>`
          )
          .join('')}
      </ul>
    </div>`;

  // Count up like a tape counter once visible.
  if (isReduced() || !('IntersectionObserver' in window)) return;
  const vals = root.querySelectorAll('.stat__val');
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        const el = en.target;
        const raw = el.dataset.count;
        const num = parseFloat(raw.replace(/,/g, ''));
        const dec = (raw.split('.')[1] || '').length;
        const comma = raw.includes(',');
        const fmt = (v) => {
          const s = v.toFixed(dec);
          return comma ? Number(s).toLocaleString('en-US') : s;
        };
        tween(1100, (p) => { el.textContent = p >= 1 ? raw : fmt(num * p); });
      });
    },
    { threshold: 0.6 }
  );
  vals.forEach((v) => io.observe(v));
}

export function mountTapes(root, data) {
  const sides = l('sides');
  root.innerHTML = `
    <div class="nt-wrap">
      <h2 class="tapes__eyebrow nt-eyebrow" data-reveal>${esc(l('mixtape'))}</h2>
      <ul class="tapes__list">
        ${data.pillars
          .map(
            (p, i) => `
          <li class="tape" data-reveal style="--pc:${esc(p.color)};transition-delay:${i * 90}ms">
            <div class="tape__shell">
              <div class="tape__label">
                <div class="tape__row">
                  <span class="tape__side">${esc(l('side'))} ${esc(sides[i])}</span>
                  <img class="tape__art" src="${asset(p.art)}" alt="" loading="lazy">
                </div>
                <h3 class="tape__name">${esc(t(p.name))}</h3>
                <p class="tape__line">${esc(t(p.line))}</p>
              </div>
              <div class="tape__window" aria-hidden="true">
                <span class="reel"></span><span class="tape__ribbon"></span><span class="reel reel--b"></span>
              </div>
              <div class="tape__foot" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
            </div>
          </li>`
          )
          .join('')}
      </ul>
    </div>`;
}
