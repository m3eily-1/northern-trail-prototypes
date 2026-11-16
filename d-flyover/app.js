// Orchestrator: content, sections, loader, hero film, then the 3D flight (or the static map).
import { UI, heroHTML, introHTML, pillarsHTML, hudHTML, trackHTML, closingHTML, ICONS, ICON_SVG } from './sections.js';
import { renderStatic } from './fallback.js';
import { mountPractical } from './practical.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const html = document.documentElement;
const L = html.lang === 'ar' ? 'ar' : 'en';
const ui = UI[L];
const rtl = L === 'ar';
const phone = Math.min(innerWidth, innerHeight) < 600 || innerWidth < 768;
const root = document.getElementById('nt');
const $ = (s) => document.querySelector(s);

let flightApi = null;

main().catch((err) => {
  console.error(err);
  toStatic();
});

async function main() {
  const c = await fetch('../assets/content.json').then((r) => r.json());
  window.__nt = { c };
  renderSections(c);
  setupHero();
  setupReveals();
  if (html.classList.contains('mode-static')) { toStatic(c); return; }
  await start3D(c);
}

function renderSections(c) {
  $('#hero').innerHTML = heroHTML(c, L, ui, phone);
  $('#intro').innerHTML = introHTML(c, L, ui);
  $('#pillars').innerHTML = pillarsHTML(c, L);
  $('#hud').innerHTML = hudHTML(c, L, ui);
  $('#track').innerHTML = trackHTML(c, L, ui);
  mountPractical($('#prac'), c, L);
  $('#closing').innerHTML = closingHTML(c, L, ui);
  $('#loader-label').textContent = ui.loading;
  window.__nt.content = c;
}

// ---------- hero film ----------
function setupHero() {
  const v = $('#hero-video'), btn = $('#hero-pause');
  if (!v || !btn) return;
  const reduced = html.classList.contains('is-reduced');
  let userPaused = reduced;
  const sync = () => {
    const paused = v.paused;
    btn.setAttribute('aria-label', paused ? ui.play : ui.pause);
    btn.setAttribute('aria-pressed', String(paused));
    btn.innerHTML = paused ? ICON_SVG.play : ICON_SVG.pause;
  };
  v.addEventListener('play', sync);
  v.addEventListener('pause', sync);
  btn.addEventListener('click', () => {
    if (v.paused) { userPaused = false; v.play().catch(() => {}); } else { userPaused = true; v.pause(); }
  });
  // pause when off-screen to save battery
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) v.pause();
    else if (!userPaused && !html.classList.contains('is-loading')) v.play().catch(() => {});
  }, { threshold: 0.05 }).observe($('#hero'));
  window.__nt.playFilm = () => { if (!userPaused) v.play().catch(() => {}); };
  sync();
  if (!html.classList.contains('is-loading')) {
    requestAnimationFrame(() => html.classList.add('is-hero-in'));
    window.__nt.playFilm();
  }
}

function setupReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-revealed')); return; }
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  els.forEach((e) => io.observe(e));
}

// ---------- static fallback ----------
function toStatic(c = window.__nt?.content) {
  html.classList.remove('mode-3d', 'is-loading');
  html.classList.add('mode-static');
  if (flightApi) { try { flightApi.dispose(); } catch (e) { /* noop */ } flightApi = null; }
  if (!c) return;
  const sm = $('#smap');
  sm.hidden = false;
  renderStatic(sm, c, L, ui);
  setupReveals();
  html.classList.add('is-hero-in');
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); sm.scrollIntoView({ behavior: html.classList.contains('is-reduced') ? 'auto' : 'smooth' }); }
  });
  window.__nt.playFilm && window.__nt.playFilm();
}

// ---------- 3D ----------
async function start3D(c) {
  const loading = html.classList.contains('is-loading');
  const numEl = $('#loader-num'), barEl = $('#loader-bar');
  let loadP = 0;
  const showPct = (v) => {
    const n = Math.round(v * 100);
    numEl.textContent = String(n);
    barEl.style.transform = `scaleX(${v.toFixed(3)})`;
  };

  const THREE = await import(THREE_URL);
  loadP = 0.25; if (loading) showPct(loadP * 0.45);

  // textures: stickers for sticker stops (+ Salma), illustrations for the rest
  const want = {};
  c.stops.forEach((s) => {
    if (s.sticker) want['st:' + s.sticker] = '../' + s.sticker;
    else s.icon = `assets/img/icon-${ICONS[s.key] || 1}.png`, want['ic:' + s.icon] = '../' + s.icon;
  });
  want['st:salma'] = '../' + c.stickers.salma;
  const loader = new THREE.TextureLoader();
  const keys = Object.keys(want);
  const textures = {};
  let done = 0;
  await Promise.all(keys.map((k) => loader.loadAsync(want[k]).then((t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures[k] = t;
  }).catch(() => {}).finally(() => {
    done++; loadP = 0.25 + 0.45 * (done / keys.length); if (loading) showPct(loadP * 0.45);
  })));

  const { createScene } = await import('./scene.js');
  const { createFlight } = await import('./flight.js');
  const scene = createScene(THREE, { host: $('#stage'), stops: c.stops, phone, textures });
  loadP = 1;
  const flight = createFlight({ scene, c, L, ui, phone, rtl, root: html });
  flightApi = flight;
  window.__nt.flight = flight;
  window.__nt.scene = scene;

  const st = flight.state;
  if (!loading) {
    scene.setRise(1); scene.setPop(1);
    flight.start();
    return;
  }

  // Loading moment: terrain rises from a flat sheet in a wave from Riyadh to Jubbah, counter follows.
  scene.setRise(0); scene.setPop(0);
  st.rise = 0;
  const over = flight.overviewCam();
  const t0 = performance.now();
  const RISE = 2600, POP = 900;
  st.loader = (now) => {
    const t = Math.min(1, (now - t0) / (RISE + POP));
    return { ...over, dist: over.dist * (1.25 - 0.25 * t), elev: 1.25 - (1.25 - over.elev) * t, az: over.az - 0.7 * (1 - t), shiftX: 0, shiftY: 0 };
  };
  flight.start();
  const tick = (now) => {
    const e = now - t0;
    const r = Math.min(1, e / RISE);
    scene.setRise(r);
    st.rise = r;
    showPct(0.45 + 0.55 * r);
    if (e > RISE * 0.82) scene.setPop(Math.min(1, (e - RISE * 0.82) / POP));
    if (e < RISE + POP * 0.6) { requestAnimationFrame(tick); return; }
    scene.setPop(1);
    finishLoader();
  };
  requestAnimationFrame(tick);

  function finishLoader() {
    try { sessionStorage.setItem('nt-d-loaded', '1'); } catch (e) { /* private mode */ }
    html.classList.add('is-loaded');
    setTimeout(() => {
      html.classList.remove('is-loading');
      html.classList.add('is-hero-in');
      window.__nt.playFilm && window.__nt.playFilm();
      setTimeout(() => { st.loader = null; }, 1300);
    }, 450);
  }
}

addEventListener('pagehide', () => { if (flightApi) flightApi.dispose(); flightApi = null; });
addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
