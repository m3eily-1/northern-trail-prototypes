// Hero: the brand film inside a planisphere. The outer ring carries the 16 stop
// names like a planisphere's date ring and turns slowly; the night sky behind it
// wheels around a pole off-screen, with the odd shooting star.
import { t, esc, asset, lang, reduced, ui, coord } from './i18n.js';
import { compactMQ, splitWords, visibleLoop, clamp } from './util.js';
import { makeField, drawField, CREAM } from './sky.js';

function ringSVG(names) {
  let ticks = '';
  for (let d = 0; d < 360; d += 2) {
    const a = ((d - 90) * Math.PI) / 180;
    const long = d % 30 === 0;
    const mid = d % 10 === 0;
    const r1 = 492;
    const r2 = long ? 462 : mid ? 474 : 482;
    const c = Math.cos(a);
    const s = Math.sin(a);
    ticks += `<line x1="${(500 + c * r1).toFixed(1)}" y1="${(500 + s * r1).toFixed(1)}" x2="${(500 + c * r2).toFixed(1)}" y2="${(500 + s * r2).toFixed(1)}"${long ? ' class="is-long"' : ''}/>`;
  }
  const n = names.length;
  const R = 432;
  const path = `M500 ${500 - R} A${R} ${R} 0 0 1 500 ${500 + R} A${R} ${R} 0 0 1 500 ${500 - R}`;
  const texts = names
    .map(
      (nm, i) =>
        `<text class="ring__name${i === 0 || i === n - 1 ? ' is-end' : ''}"><textPath href="#m-ring-p" startOffset="${(((i + 0.5) / n) * 100).toFixed(3)}%" text-anchor="middle">${esc(nm)}</textPath></text>`
    )
    .join('');
  let dots = '';
  for (let i = 0; i < n; i++) {
    const a = ((i / n) * 360 - 90) * (Math.PI / 180);
    dots += `<circle cx="${(500 + Math.cos(a) * R).toFixed(1)}" cy="${(500 + Math.sin(a) * R).toFixed(1)}" r="2.6"/>`;
  }
  return `<svg class="ring" viewBox="0 0 1000 1000" aria-hidden="true" focusable="false">
    <defs><path id="m-ring-p" d="${path}"/></defs>
    <circle class="ring__edge" cx="500" cy="500" r="496"/>
    <g class="ring__ticks">${ticks}</g>
    <circle class="ring__inner" cx="500" cy="500" r="406"/>
    <g class="ring__names">${texts}</g>
    <g class="ring__dots">${dots}</g>
  </svg>`;
}

const reticle = `<svg class="sphere__reticle" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
  <circle cx="50" cy="50" r="24"/>
  <line x1="50" y1="0" x2="50" y2="40"/><line x1="50" y1="60" x2="50" y2="100"/>
  <line x1="0" y1="50" x2="40" y2="50"/><line x1="60" y1="50" x2="100" y2="50"/>
</svg>`;

const icons = {
  pause: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="5" y="4" width="3" height="12"/><rect x="12" y="4" width="3" height="12"/></svg>',
  play: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M6 4l10 6-10 6z"/></svg>',
  down: '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 3v13M5 11l5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>'
};

export function initHero(data) {
  const root = document.getElementById('hero');
  const H = data.hero;
  const F = data.film;
  const compact = compactMQ.matches;
  const first = data.stops[0];

  root.innerHTML = `
    <canvas class="hero__sky" aria-hidden="true"></canvas>
    <div class="hero__grid nt-wrap">
      <div class="hero__copy">
        <img class="hero__logo" src="${asset(data.logo.cream)}" alt="${lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165">
        <h1 class="hero__title m-split" id="hero-title">${esc(t(H.title))}</h1>
        <p class="hero__sub">${esc(t(H.sub))}</p>
        <div class="hero__actions">
          <a class="nt-btn nt-btn--light m-cta" href="#stops"><span>${esc(t(H.cta))}</span>${icons.down}</a>
        </div>
      </div>
      <div class="hero__sphere">
        <div class="sphere">
          <div class="sphere__turn"><div class="sphere__spin">${ringSVG(data.stops.map((s) => t(s.name)))}</div></div>
          <div class="sphere__window">
            <video class="sphere__video" muted loop playsinline ${reduced ? 'preload="none"' : 'autoplay preload="auto"'} poster="${asset(F.poster)}" aria-hidden="true" tabindex="-1">
              <source src="${asset(compact ? F.mobile : F.desktop)}" type="video/mp4">
            </video>
            <span class="sphere__scrim" aria-hidden="true"></span>
            ${reticle}
          </div>
          <button class="sphere__pause" type="button" aria-pressed="false">${icons.pause}${icons.play}<span class="m-sr"></span></button>
        </div>
      </div>
    </div>
    <div class="hero__foot nt-wrap" aria-hidden="true">
      <span class="hero__scroll"><span class="hero__scroll-line"><i></i></span><span>${ui.scroll}</span></span>
      <span class="hero__coord">${coord(first.lat, first.lng)}</span>
    </div>`;

  splitWords(root.querySelector('.hero__title'));

  // Film + pause control. Reduced motion: never autoplays, the control offers Play.
  const video = root.querySelector('video');
  const btn = root.querySelector('.sphere__pause');
  const label = btn.querySelector('.m-sr');
  let userPaused = reduced;
  const sync = () => {
    const paused = video.paused;
    btn.classList.toggle('is-paused', paused);
    btn.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? ui.play : ui.pause;
  };
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  btn.addEventListener('click', () => {
    if (video.paused) {
      userPaused = false;
      video.play().catch(() => {});
    } else {
      userPaused = true;
      video.pause();
    }
  });
  if (reduced) video.pause();
  sync();
  // Save the decoder while the film is off screen.
  new IntersectionObserver(([e]) => {
    if (userPaused) return;
    if (e.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }).observe(root.querySelector('.sphere'));

  // Scroll-linked turn of the ring and a gentle drift of the copy.
  if (!reduced) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const h = root.offsetHeight || 1;
        root.style.setProperty('--hs', clamp(window.scrollY / h, 0, 1).toFixed(4));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  initHeroSky(root, compact);
}

function initHeroSky(root, compact) {
  const canvas = root.querySelector('.hero__sky');
  const ctx = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  let field = [];
  let pole = { x: 0, y: 0 };
  const shooting = [];
  let nextShot = 2.2;

  const size = () => {
    const r = root.getBoundingClientRect();
    W = r.width;
    H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const rtl = document.documentElement.dir === 'rtl';
    pole = { x: rtl ? W * 0.12 : W * 0.88, y: -H * 0.28 };
    const R = Math.hypot(Math.max(pole.x, W - pole.x), H - pole.y) * 1.05;
    field = makeField(Math.round(clamp((W * H) / (compact ? 1400 : 1700), 180, 900)), R, 17);
  };

  const draw = (now) => {
    const time = now / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const hs = parseFloat(root.style.getPropertyValue('--hs')) || 0;
    ctx.save();
    ctx.translate(pole.x, pole.y);
    ctx.rotate(reduced ? 0 : time * 0.006 + hs * 0.35);
    drawField(ctx, field, time, !reduced);
    ctx.restore();
    if (reduced) return;
    // Shooting stars: a thin streak with a fading tail.
    if (time > nextShot) {
      nextShot = time + 3.5 + Math.random() * 4.5;
      const fromLeft = Math.random() > 0.5;
      shooting.push({
        x: W * (0.15 + Math.random() * 0.7),
        y: H * (0.05 + Math.random() * 0.3),
        vx: (fromLeft ? 1 : -1) * (520 + Math.random() * 260),
        vy: 220 + Math.random() * 140,
        t0: time,
        life: 0.9 + Math.random() * 0.4
      });
    }
    for (let i = shooting.length - 1; i >= 0; i--) {
      const s = shooting[i];
      const k = (time - s.t0) / s.life;
      if (k >= 1) {
        shooting.splice(i, 1);
        continue;
      }
      const x = s.x + s.vx * (time - s.t0);
      const y = s.y + s.vy * (time - s.t0);
      const len = 0.16;
      const tx = x - s.vx * len;
      const ty = y - s.vy * len;
      const g = ctx.createLinearGradient(x, y, tx, ty);
      const a = Math.sin(Math.PI * k);
      g.addColorStop(0, `rgba(${CREAM},${0.9 * a})`);
      g.addColorStop(1, `rgba(${CREAM},0)`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
    }
  };

  size();
  new ResizeObserver(() => {
    size();
    if (reduced) draw(0);
  }).observe(root);
  if (reduced) draw(0);
  else visibleLoop(root, draw);
}
