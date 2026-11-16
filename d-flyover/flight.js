// Scroll engine: maps page scroll to camera keyframes, route growth and the HUD.
import { pad, esc } from './sections.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const angLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; return a + d * t; };
const angDiff = (a, b) => ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

export function createFlight({ scene, c, L, ui, phone, rtl, root }) {
  const N = c.stops.length;
  const $ = (s) => root.querySelector(s);
  const stage = $('#stage'), hero = $('#hero'), intro = $('#intro'), trackEl = $('#track'), outro = $('#outro'), flight = $('#flight');
  const pillarEls = [...root.querySelectorAll('[data-pillar]')];
  const labelsEl = $('#labels');
  const card = $('#card'), leg = $('#leg'), hint = $('#hint');
  const railBtns = [...root.querySelectorAll('.rail__btn')];
  const segs = [...root.querySelectorAll('.pbar__seg')];
  const railFill = $('#rail-fill');
  const heroMedia = hero.querySelector('.hero__media'), heroContent = hero.querySelector('.hero__content');
  const regionName = Object.fromEntries(c.regions.map((r) => [r.key, r.name[L]]));

  const HOST = 64;
  const SLOT = phone ? 0.85 : 0.8; // viewport heights of scroll per stop
  let vw = innerWidth, vh = innerHeight, stageH = vh - HOST;
  const lay = {};

  // ---- labels (one per pin) ----
  labelsEl.innerHTML = c.stops.map((s, i) => `<div class="plabel" data-i="${i}"><span class="plabel__n">${pad(i + 1)}</span><span class="plabel__t">${esc(s.name[L])}</span></div>`).join('');
  const labels = [...labelsEl.children];

  // ---- camera keyframes ----
  const sx = (v) => (phone ? 0 : (rtl ? -v : v)); // subject shift toward the side free of panels
  const sy = (v) => (phone ? v : 0);
  const centre = { x: 0, y: 0.5, z: -2 };
  const lm = scene.landmarks;
  const nafud = scene.ll(41.3, 28.3);
  const surfAt = (p, lift = 0.4) => ({ x: p.x, y: scene.surf(p.x, p.z) + lift, z: p.z });
  const KF = {
    over: { ...centre, dist: phone ? 200 : 122, elev: phone ? 1.1 : 1.02, az: phone ? 0.95 : 0.22, shiftX: 0, shiftY: 0 },
    intro: { ...centre, x: -6, dist: phone ? 185 : 104, elev: 0.9, az: phone ? 0.8 : -0.05, shiftX: sx(0.17), shiftY: sy(0.18) },
    p0: { ...surfAt(lm.diriyah, 0.8), dist: phone ? 30 : 21, elev: 0.5, az: -1.15, shiftX: sx(0.16), shiftY: sy(0.2) },
    p1: { ...surfAt(lm.qassim, 0.3), dist: phone ? 32 : 24, elev: 0.78, az: 0.32, shiftX: sx(0.16), shiftY: sy(0.2) },
    p2: { ...surfAt(nafud, 0.6), dist: phone ? 40 : 30, elev: 0.5, az: -0.25, shiftX: sx(0.16), shiftY: sy(0.2) },
    end: { ...centre, x: 2, z: 2, dist: phone ? 210 : 150, elev: phone ? 1.1 : 1.0, az: phone ? 0.95 : 0.15, shiftX: 0, shiftY: 0 },
  };
  const NEAR = phone ? 12.5 : 9.5, ELEV = phone ? 0.68 : 0.6, AZ0 = 0.5;
  const hop = [];
  for (let i = 0; i < N - 1; i++) {
    const a = scene.stopTarget(i), b = scene.stopTarget(i + 1);
    hop.push(Math.hypot(a.x - b.x, a.z - b.z));
  }

  function trackCam(p) {
    const sRaw = clamp(p * N - 0.5, 0, N - 1);
    let k = Math.min(N - 2, Math.floor(sRaw));
    const f = sRaw - k;
    const HOLD = 0.2;
    const g = easeIO(clamp((f - HOLD) / (1 - 2 * HOLD), 0, 1));
    const u = k + g;
    const travel = Math.sin(Math.PI * g);
    const r = scene.sampleRoute(u);
    const at = f < HOLD ? k : f > 1 - HOLD ? k + 1 : -1;
    const h = scene.heading(u);
    const az = AZ0 + clamp(angDiff(AZ0, h), -0.9, 0.9) * 0.45;
    const far = Math.min(phone ? 75 : 58, hop[k] * 0.62 + 6);
    const hold = Math.pow(1 - travel, 2);
    return {
      cam: { x: r.x, y: r.y + 0.5, z: r.z, dist: NEAR + travel * far, elev: ELEV + travel * 0.28, az, shiftX: sx(vw >= 1240 ? 0.06 : 0.12) * hold, shiftY: sy(0.22) * hold },
      u, at, k, g, travel,
    };
  }

  function mix(A, B, t) {
    const sep = Math.hypot(A.x - B.x, A.z - B.z);
    const bump = Math.sin(Math.PI * t) * Math.min(55, sep * 0.45);
    return {
      x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), z: lerp(A.z, B.z, t),
      dist: lerp(A.dist, B.dist, t) + bump, elev: lerp(A.elev, B.elev, t) + Math.sin(Math.PI * t) * 0.12,
      az: angLerp(A.az, B.az, t), shiftX: lerp(A.shiftX, B.shiftX, t), shiftY: lerp(A.shiftY, B.shiftY, t),
    };
  }

  function docTop(el) { let y = 0; for (let e = el; e; e = e.offsetParent) y += e.offsetTop; return y; }

  function layout() {
    vw = innerWidth; vh = innerHeight; stageH = stage.clientHeight || vh - HOST;
    trackEl.style.height = `${Math.round(N * SLOT * stageH + stageH)}px`;
    scene.resize(stage.clientWidth, stageH);
    lay.heroTop = docTop(hero); lay.heroH = hero.offsetHeight;
    lay.trackTop = docTop(trackEl); lay.trackH = trackEl.offsetHeight;
    lay.flightEnd = docTop(flight) + flight.offsetHeight;
    const ctr = (el) => docTop(el) + el.offsetHeight / 2;
    lay.anchors = [
      { y: lay.heroTop + stageH / 2, k: KF.over },
      { y: ctr(intro), k: KF.intro },
      ...pillarEls.map((el, i) => ({ y: ctr(el), k: KF['p' + i] })),
    ];
    lay.trackStart = lay.trackTop + stageH / 2;
    lay.trackEnd = lay.trackTop + lay.trackH - stageH / 2;
    lay.outroEnd = lay.flightEnd - stageH / 2;
  }

  function desired(scrollY) {
    const focus = scrollY + HOST + stageH / 2;
    const span = lay.trackEnd - lay.trackStart;
    const p = (focus - lay.trackStart) / span;
    if (p >= 0 && p <= 1) return { ...trackCam(p), p, phase: 'track' };
    if (p > 1) {
      const t = easeSine(clamp((focus - lay.trackEnd) / Math.max(1, lay.outroEnd - lay.trackEnd), 0, 1));
      const tc = trackCam(1);
      return { cam: mix(tc.cam, KF.end, t), u: N - 1, at: t < 0.15 ? N - 1 : -1, p, phase: 'outro', k: N - 2, g: 1, travel: 0 };
    }
    const A = lay.anchors;
    const s0 = trackCam(0);
    const list = [...A, { y: lay.trackStart, k: s0.cam }];
    let cam = list[0].k;
    for (let i = 0; i < list.length - 1; i++) {
      if (focus <= list[i + 1].y) {
        const t = clamp((focus - list[i].y) / (list[i + 1].y - list[i].y), 0, 1);
        cam = mix(list[i].k, list[i + 1].k, easeSine(t));
        break;
      }
    }
    return { cam, u: 0, at: -1, p, phase: 'pre', k: 0, g: 0, travel: 0 };
  }

  // ---- HUD ----
  let shownStop = -2;
  const imgCache = c.stops.map((s) => { const im = new Image(); im.decoding = 'async'; im.dataset.src = '../' + s.photo; return im; });
  let preloaded = false;
  function preload() { if (preloaded) return; preloaded = true; imgCache.forEach((im) => { im.src = im.dataset.src; }); }

  function showCard(i) {
    if (i === shownStop) return;
    shownStop = i;
    card.inert = i < 0;
    if (i < 0) { card.classList.remove('is-on'); return; }
    const s = c.stops[i];
    card.classList.remove('is-swap');
    void card.offsetWidth;
    $('#card-img').src = '../' + s.photo;
    $('#card-num').textContent = pad(i + 1);
    $('#card-region').textContent = regionName[s.region];
    $('#card-name').textContent = s.name[L];
    $('#card-drive').textContent = s.drive ? `${s.drive[L]} ${ui.from} ${c.stops[i - 1].name[L]}` : ui.start;
    $('#card-desc').textContent = s.desc[L];
    $('#card-prev').disabled = i === 0;
    $('#card-next').disabled = i === N - 1;
    card.classList.add('is-on', 'is-swap');
    railBtns.forEach((b, j) => { b.classList.toggle('is-active', j === i); b.toggleAttribute('aria-current', j === i); });
  }

  let legShown = -1, wasTrack = null;
  const hudEl = $('#hud');
  function updateHUD(d) {
    const inTrack = d.p > -0.02 && d.p < 1.03;
    if (inTrack !== wasTrack) { wasTrack = inTrack; root.classList.toggle('is-track', inTrack); hudEl.inert = !inTrack; }
    if (d.p > -0.3) preload();
    const at = d.phase === 'pre' ? -1 : d.at;
    showCard(inTrack ? at : -1);
    scene.setActive(at);
    const traveling = inTrack && at < 0 && d.phase === 'track';
    leg.classList.toggle('is-on', traveling);
    if (traveling) {
      const n = d.k + 1;
      if (legShown !== n) {
        legShown = n;
        $('#leg-name').textContent = c.stops[n].name[L];
        $('#leg-drive').textContent = `${c.stops[n].drive[L]} ${ui.drive}`;
      }
      $('#leg-fill').style.transform = `scaleX(${d.g.toFixed(3)})`;
    }
    hint.classList.toggle('is-on', d.phase === 'track' && d.p < 0.5 / N + 0.004);
    const prog = clamp(d.u / (N - 1), 0, 1);
    railFill.style.transform = `scaleY(${prog.toFixed(4)})`;
    const reached = Math.floor(d.u + 1e-3);
    railBtns.forEach((b, j) => b.classList.toggle('is-done', j <= reached && d.p > 0));
    segs.forEach((s, j) => s.classList.toggle('is-done', j <= reached && d.p >= 0));
  }

  function goto(i) {
    const p = (i + 0.5) / N;
    const span = lay.trackEnd - lay.trackStart;
    const y = lay.trackStart + p * span - HOST - stageH / 2;
    window.scrollTo({ top: Math.round(y), behavior: 'smooth' });
  }

  // ---- labels ----
  let hover = -1;
  function updateLabels(active) {
    const dist = scene.camDist;
    for (let i = 0; i < N; i++) {
      const pr = scene.project(i);
      const el = labels[i];
      const on = pr.front && pr.x > -40 && pr.x < vw + 40 && pr.y > 0 && pr.y < stageH;
      const near = clamp(1 - (pr.dist - 14) / 30, 0, 1);
      const op = on ? (i === hover || i === active ? 1 : near * 0.95) : 0;
      el.style.opacity = op.toFixed(2);
      el.style.transform = `translate3d(${pr.x.toFixed(1)}px, ${pr.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      el.classList.toggle('is-open', i === hover || (i === active && dist > 0));
    }
  }

  // ---- pointer (desktop): hover pins + parallax ----
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let mx = 0, my = 0, pmx = 0, pmy = 0;
  function onMove(e) {
    const r = stage.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    my = ((e.clientY - r.top) / r.height) * 2 - 1;
    if (!root.classList.contains('is-track') && !root.classList.contains('is-pre')) { setHover(-1); return; }
    const top = document.elementFromPoint(e.clientX, e.clientY);
    if (top !== scene.renderer.domElement && !(top && top.closest('.labels'))) { setHover(-1); return; }
    setHover(scene.pick(e.clientX - r.left, e.clientY - r.top));
  }
  function setHover(i) {
    if (i === hover) return;
    hover = i;
    scene.setHover(i);
    document.documentElement.classList.toggle('is-pin-hover', i >= 0);
  }
  function onClick(e) {
    if (hover >= 0 && root.classList.contains('is-track')) { e.preventDefault(); goto(hover); }
  }

  // ---- loop ----
  let cur = null, uCur = 0, raf = 0, running = false, visible = true, last = performance.now();
  const st = { rise: 1, pop: 1, loader: null };

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const y = window.scrollY;
    const d = desired(y);

    // hero curtain: film lags and dims as it lifts off the map
    if (y < lay.heroH + 50) {
      const t = clamp(y / lay.heroH, 0, 1);
      heroMedia.style.transform = `translate3d(0, ${(t * lay.heroH * 0.45).toFixed(1)}px, 0) scale(${(1 + t * 0.06).toFixed(3)})`;
      heroContent.style.transform = `translate3d(0, ${(-t * lay.heroH * 0.12).toFixed(1)}px, 0)`;
      heroContent.style.opacity = Math.max(0, 1 - t * 2.4).toFixed(3);
    }
    root.classList.toggle('is-pre', d.phase === 'pre' && y > lay.heroH * 0.5);

    let want = d.cam;
    if (st.loader) want = st.loader(now);
    if (!cur) { cur = { ...want }; uCur = d.u; }
    const k = 1 - Math.exp(-dt * (st.loader ? 3 : 4.2));
    for (const key of ['x', 'y', 'z', 'dist', 'elev', 'shiftX', 'shiftY']) cur[key] = lerp(cur[key], want[key], k);
    cur.az = angLerp(cur.az, want.az, k);
    uCur = lerp(uCur, d.u, 1 - Math.exp(-dt * 6));

    updateHUD(d);
    if (hover >= 0 && d.phase !== 'track') setHover(-1);

    // skip GPU work while the film fully covers the map or the stage is off-screen
    const covered = !st.loader && y < 2 && st.rise >= 1;
    if (!visible || covered || document.hidden) return;

    pmx = lerp(pmx, fine ? mx : 0, 1 - Math.exp(-dt * 3));
    pmy = lerp(pmy, fine ? my : 0, 1 - Math.exp(-dt * 3));
    const tt = now / 1000;
    const cam = {
      ...cur,
      dist: cur.dist * (1 + Math.sin(tt * 0.5) * 0.012),
      elev: cur.elev + Math.sin(tt * 0.37) * 0.01 - pmy * 0.035,
      az: cur.az + Math.sin(tt * 0.23) * 0.015 - pmx * 0.06,
    };
    scene.applyCamera(cam);
    scene.setRoute(Math.max(0, uCur), d.phase !== 'pre' && d.p >= 0, d.phase === 'pre' && y > lay.heroH * 0.3);
    updateLabels(d.phase === 'pre' ? -1 : d.at);
    scene.render(now);
  }

  const io = new IntersectionObserver((ents) => { visible = ents[0].isIntersecting; }, { threshold: 0 });
  io.observe(stage);

  function onResize() { layout(); }
  function onDocClick(e) {
    const g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); goto(+g.dataset.goto); return; }
    if (e.target.closest('#card-prev')) goto(Math.max(0, shownStop - 1));
    if (e.target.closest('#card-next')) goto(Math.min(N - 1, shownStop + 1));
  }

  function start() {
    layout();
    running = true;
    raf = requestAnimationFrame(frame);
    addEventListener('resize', onResize);
    document.addEventListener('click', onDocClick);
    if (fine) { addEventListener('pointermove', onMove, { passive: true }); stage.addEventListener('click', onClick); }
    if (document.fonts) document.fonts.ready.then(layout);
    setTimeout(layout, 600);
  }

  function dispose() {
    cancelAnimationFrame(raf);
    running = false;
    io.disconnect();
    removeEventListener('resize', onResize);
    removeEventListener('pointermove', onMove);
    document.removeEventListener('click', onDocClick);
    scene.dispose();
  }

  return {
    start, dispose, layout, goto, state: st,
    debug: () => ({ lay: { ...lay }, d: desired(scrollY), cur: cur && { ...cur }, shownStop, hover }),
    overviewCam: () => KF.over,
  };
}
