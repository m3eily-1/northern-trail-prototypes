// Hero: full-bleed brand film. As you scroll, the film shrinks into a taped-in
// polaroid print on the first journal page while the intro text inks in.
import { t, ui, esc, asset, rtl, reduced } from './i18n.js';
import { pinned, ease, range } from './scroll.js';

export function initHero(data) {
  const root = document.getElementById('hero');
  const mobile = matchMedia('(max-width: 767px)').matches;
  const words = t(data.hero.title)
    .split(/\s+/)
    .map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`)
    .join(' ');
  const first = t(data.stops[0].name);
  const last = t(data.stops[data.stops.length - 1].name);

  root.innerHTML = `
    <div class="hero__stage">
      <div class="hero__paper paper" aria-hidden="true"></div>
      <div class="hero__end nt-wrap">
        <div class="hero__intro">
          <h2 class="nt-h2 hero__intro-title" id="intro-title">${esc(t(data.intro.title))}</h2>
          <p class="nt-lede hero__intro-body">${esc(t(data.intro.body))}</p>
        </div>
        <div class="hero__slot">
          <figure class="hero__still print" aria-hidden="true">
            <span class="tape tape--a"></span><span class="tape tape--b"></span>
            <img src="${asset(data.film.poster)}" alt="" width="1280" height="720">
            <figcaption class="print__cap"><span>${esc(ui.route(first, last))}</span></figcaption>
          </figure>
        </div>
      </div>
      <div class="hero__print">
        <div class="hero__frame" aria-hidden="true">
          <span class="tape tape--a"></span><span class="tape tape--b"></span>
          <span class="hero__caption">${esc(ui.route(first, last))}</span>
        </div>
        <div class="hero__film">
          <video class="hero__video" muted playsinline loop preload="metadata"
            poster="${asset(data.film.poster)}" ${reduced ? '' : 'autoplay'}
            src="${asset(mobile ? data.film.mobile : data.film.desktop)}"></video>
          <div class="hero__scrim" aria-hidden="true"></div>
        </div>
        <button class="hero__pause" type="button"></button>
      </div>
      <div class="hero__copy nt-wrap">
        <h1 class="hero__title" id="hero-title">${words}</h1>
        <p class="hero__sub">${esc(t(data.hero.sub))}</p>
        <a class="nt-btn nt-btn--light hero__cta" href="#stops">${esc(t(data.hero.cta))}
          <svg class="nt-down" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v13M4 10l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2"/></svg>
        </a>
      </div>
      <p class="hero__cue" aria-hidden="true"><span>${esc(ui.scroll)}</span><i></i></p>
    </div>`;

  const stage = root.querySelector('.hero__stage');
  const video = root.querySelector('video');
  const btn = root.querySelector('.hero__pause');
  initPause(video, btn);

  if (reduced) return;

  const film = root.querySelector('.hero__film');
  const print = root.querySelector('.hero__print');
  const frame = root.querySelector('.hero__frame');
  const slot = root.querySelector('.hero__slot');
  const copy = root.querySelector('.hero__copy');
  const intro = root.querySelector('.hero__intro');
  const scrim = root.querySelector('.hero__scrim');
  const cue = root.querySelector('.hero__cue');

  let m = null;
  const measure = () => {
    const sr = stage.getBoundingClientRect();
    const r = slot.getBoundingClientRect();
    const W = sr.width;
    const H = sr.height;
    const sx = r.left - sr.left;
    const sy = r.top - sr.top;
    const sw = r.width;
    const sh = r.height;
    const phone = W < 768;
    const b = phone ? 10 : 14;
    const bb = phone ? 52 : 60;
    frame.style.cssText = `left:${sx - b}px;top:${sy - b}px;width:${sw + 2 * b}px;height:${sh + b + bb}px`;
    print.style.transformOrigin = `${sx + sw / 2}px ${sy + sh / 2}px`;
    // pause button: from the stage corner to the polaroid's caption strip
    const size = 44;
    const inset = phone ? 16 : 24;
    const startX = rtl ? inset : W - inset - size;
    const startY = H - inset - size;
    const endX = rtl ? sx : sx + sw - size;
    const endY = sy + sh + (bb - size) / 2;
    btn.style.left = `${startX}px`;
    btn.style.top = `${startY}px`;
    m = {
      W, H, sx, sy, sw, sh,
      s: Math.max(sw / W, sh / H),
      dx: sx + sw / 2 - W / 2,
      dy: sy + sh / 2 - H / 2,
      bx: endX - startX,
      by: endY - startY,
      rot: phone ? -2 : -3
    };
  };

  let taped = false;
  const apply = (p) => {
    if (!m) measure();
    const e = ease(range(p, 0.04, 0.8));
    const { W, H, sx, sy, sw, sh } = m;
    film.style.clipPath = `inset(${(e * sy).toFixed(1)}px ${(e * (W - sx - sw)).toFixed(1)}px ${(e * (H - sy - sh)).toFixed(1)}px ${(e * sx).toFixed(1)}px)`;
    video.style.transform = `translate(${(e * m.dx).toFixed(1)}px, ${(e * m.dy).toFixed(1)}px) scale(${(1 + (m.s - 1) * e).toFixed(4)})`;
    print.style.transform = `rotate(${(m.rot * e).toFixed(2)}deg)`;
    frame.style.opacity = range(e, 0.5, 0.92).toFixed(3);
    scrim.style.opacity = (1 - range(e, 0, 0.7)).toFixed(3);
    btn.style.transform = `translate(${(m.bx * e).toFixed(1)}px, ${(m.by * e).toFixed(1)}px)`;
    const c = range(p, 0, 0.22);
    copy.style.opacity = (1 - c).toFixed(3);
    copy.style.transform = `translateY(${(-56 * range(p, 0, 0.3)).toFixed(1)}px)`;
    copy.style.visibility = c >= 1 ? 'hidden' : '';
    cue.style.opacity = (1 - range(p, 0, 0.06)).toFixed(3);
    const k = range(p, 0.5, 0.86);
    intro.style.opacity = k.toFixed(3);
    intro.style.transform = `translateY(${(24 * (1 - k)).toFixed(1)}px)`;
    const tp = e > 0.97;
    if (tp !== taped) {
      taped = tp;
      root.classList.toggle('is-taped', tp);
    }
    root.classList.toggle('is-paper', e > 0.5);
  };

  pinned(root, stage, apply, () => {
    m = null;
  });
}

function initPause(video, btn) {
  const icon = (paused) =>
    paused
      ? '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M6 4l10 6-10 6z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" fill="currentColor"/></svg>';
  const sync = () => {
    const paused = video.paused;
    btn.innerHTML = icon(paused);
    btn.setAttribute('aria-label', paused ? ui.play : ui.pause);
  };
  btn.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  if (!reduced) video.play().catch(sync);
  sync();
}
