// The signature: a pinned car side window. Vertical scroll drives a layered
// panorama of the north past the glass; each stop is a roadside sign, and as
// it passes its photo and story appear on the glass like a reflection. The
// window handle shows km travelled and can be wound (dragged) to drive; the
// view itself can be dragged too. Desktop only; phones and reduced motion get
// the stacked windows from stack.js.
import { t, esc, asset, ui, rtl, reduced, num, clamp, lerp, smooth, kmTable, pad2 } from './util.js';
import { buildScenery, LAYERS, LEAD, regionAt } from './scenery.js';

const HOST = 64;

// Ease each leg so the car slows down at every sign (dwell) and speeds up
// between stops. Mostly eased, a little linear so it never fully stops.
function dwell(u) {
  const i = Math.floor(u);
  const f = u - i;
  const e = f < 0.5 ? 4 * f * f * f : 1 - Math.pow(-2 * f + 2, 3) / 2;
  return i + f * 0.18 + e * 0.82;
}

export function initDrive(data, stack) {
  const root = document.getElementById('stops');
  const stops = data.stops;
  const N = stops.length;
  const SPAN = N - 1 + LEAD * 2; // stop units travelled across the scene
  const km = kmTable(stops);
  const dir = rtl ? -1 : 1;
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));
  const withSticker = stops.map((s, i) => (s.sticker ? i : -1)).filter((i) => i >= 0);
  const mq = matchMedia('(min-width: 1024px) and (min-height: 600px)');

  const railGroups = data.regions
    .map((rg) => {
      const items = stops.map((s, i) => [s, i]).filter(([s]) => s.region === rg.key);
      if (!items.length) return '';
      return `<div class="rail__grp">
        <span class="rail__lbl" aria-hidden="true">${esc(t(rg.name))}</span>
        <div class="rail__ticks">${items
          .map(
            ([s, i]) =>
              `<button class="rail__b" type="button" data-k="${i}" aria-label="${esc(ui.goTo(t(s.name)))}"><i class="rail__tick"></i><span class="rail__tip" aria-hidden="true"><b>${pad2(s.n)}</b> ${esc(t(s.name))}</span></button>`
          )
          .join('')}</div>
      </div>`;
    })
    .join('');

  const scene = document.createElement('div');
  scene.className = 'scene';
  scene.innerHTML = `
    <div class="stage">
      <div class="win">
        <div class="view" aria-hidden="true">
          <div class="sky">
            <i class="sky__l sky__l--dawn"></i><i class="sky__l sky__l--noon"></i><i class="sky__l sky__l--gold"></i><i class="sky__l sky__l--dusk"></i>
            <i class="stars"></i>
            <i class="sun"><i class="sun__warm"></i></i>
          </div>
          <div class="lay lay--far" data-l="far"></div>
          <div class="lay lay--hills" data-l="hills"></div>
          <div class="lay lay--dune" data-l="dune"></div>
          <div class="lay lay--vil" data-l="vil"></div>
          <div class="lay lay--palm" data-l="palm"></div>
          <div class="lay lay--near" data-l="near"></div>
          <i class="wash wash--warm"></i><i class="wash wash--dusk"></i>
          <i class="glass"></i>
        </div>
        <div class="refl" aria-hidden="true">
          <div class="refl__card"></div>
          <i class="refl__sheen"></i>
        </div>
        <div class="decals" aria-hidden="true">
          <p class="decals__l"><span>${esc(ui.stickers)}</span><span class="decals__n">0/${withSticker.length}</span></p>
          <ul class="decals__row">${withSticker
            .map((i, j) => `<li class="decal" data-k="${i}" style="--r:${[-6, 4, -3, 7, -5][j % 5]}deg"><img src="${asset(stops[i].sticker)}" alt="" loading="lazy" decoding="async" draggable="false"></li>`)
            .join('')}</ul>
        </div>
        <p class="hint" aria-hidden="true"><span class="hint__k">${esc(ui.driveHint)}</span><span class="hint__d">${esc(ui.dragHint)}</span><i class="hint__line"></i></p>
      </div>
      <div class="door">
        <div class="door__l">
          <div class="crank" role="slider" tabindex="0" aria-label="${esc(ui.journey)}" aria-valuemin="0" aria-valuemax="1200" aria-valuenow="0">
            <i class="crank__rose"></i>
            <i class="crank__arm"><i class="crank__knob"></i></i>
            <i class="crank__hub"></i>
          </div>
          <p class="odo" aria-hidden="true"><span class="odo__n">0</span><span class="odo__u">${esc(ui.km)}</span><span class="odo__l">${esc(ui.travelled)}</span></p>
        </div>
        <nav class="rail" aria-label="${esc(ui.stopsNav)}">${railGroups}</nav>
        <p class="door__next" aria-hidden="true"><span class="door__nl">${esc(ui.next)}</span><span class="door__nn"></span><span class="door__nt"></span></p>
      </div>
    </div>`;
  root.prepend(scene);

  const stage = scene.querySelector('.stage');
  const win = scene.querySelector('.win');
  const view = scene.querySelector('.view');
  const lay = Object.fromEntries([...scene.querySelectorAll('.lay')].map((el) => [el.dataset.l, el]));
  const skyL = [...scene.querySelectorAll('.sky__l')];
  const sun = scene.querySelector('.sun');
  const sunWarm = scene.querySelector('.sun__warm');
  const stars = scene.querySelector('.stars');
  const washWarm = scene.querySelector('.wash--warm');
  const washDusk = scene.querySelector('.wash--dusk');
  const refl = scene.querySelector('.refl');
  const card = scene.querySelector('.refl__card');
  const sheen = scene.querySelector('.refl__sheen');
  const decals = [...scene.querySelectorAll('.decal')];
  const decalN = scene.querySelector('.decals__n');
  const hint = scene.querySelector('.hint');
  const crank = scene.querySelector('.crank');
  const arm = scene.querySelector('.crank__arm');
  const odoN = scene.querySelector('.odo__n');
  const railBtns = [...scene.querySelectorAll('.rail__b')];
  const nextName = scene.querySelector('.door__nn');
  const nextTime = scene.querySelector('.door__nt');
  const nextLbl = scene.querySelector('.door__nl');

  let W = 0;
  let H = 0;
  let G = 0;
  let perStop = 0;
  let span = 1;
  let active = false;
  let target = 0;
  let cur = 0;
  let prevJ = null;
  let vel = 0;
  let raf = 0;
  let visible = false;
  let last = 0;
  let shownK = -1;
  let railKey = '';
  let lastKm = -1;
  let lastDecals = '';
  let nextK = -2;
  let far = null;

  /* ---------- panel ---------- */
  function setPanel(k) {
    shownK = k;
    const s = stops[k];
    const rg = regionBy[s.region];
    card.innerHTML = `
      <div class="refl__photo"><img src="${asset(s.photo)}" alt="" width="600" height="600" decoding="async"></div>
      <div class="refl__txt">
        <p class="refl__meta"><span>${esc(ui.stopOf(s.n))}</span><i class="refl__rg"></i><span class="refl__rg">${esc(t(rg?.name))}</span></p>
        <h3 class="refl__name">${esc(t(s.name))}</h3>
        <p class="refl__drive">${s.drive ? `<b>${esc(t(s.drive))}</b> ${esc(ui.fromLast)}` : `<b>${esc(ui.start)}</b>`}</p>
        <p class="refl__desc">${esc(t(s.desc))}</p>
      </div>`;
  }

  /* ---------- geometry ---------- */
  function layout() {
    if (!active) return;
    const vh = window.innerHeight;
    perStop = Math.round(Math.max(420, vh * 0.62));
    scene.style.height = `${vh - HOST + Math.round(SPAN * perStop)}px`;
    W = view.clientWidth;
    H = view.clientHeight;
    G = Math.round(W * 0.86);
    view.style.setProperty('--H', `${H}px`);
    const built = buildScenery(W, H, G, data);
    for (const k of Object.keys(lay)) {
      lay[k].style.width = `${built[k].len}px`;
      lay[k].innerHTML = built[k].html;
    }
    far = {
      mesa: lay.far.querySelector('.ridge--mesa'),
      aja: lay.far.querySelector('.ridge--aja'),
      low: lay.far.querySelector('.ridge--low')
    };
    measure();
    prevJ = null;
    render(performance.now(), true);
  }

  function measure() {
    if (!active) return;
    const r = scene.getBoundingClientRect();
    span = Math.max(1, scene.offsetHeight - stage.offsetHeight);
    target = clamp((HOST - r.top) / span);
  }

  const scrollFor = (k) => {
    const top = scene.getBoundingClientRect().top + window.scrollY;
    return top - HOST + ((k + LEAD) / SPAN) * span;
  };
  const goTo = (k) => window.scrollTo({ top: scrollFor(clamp(k, 0, N - 1)), behavior: 'smooth' });

  /* ---------- render ---------- */
  function kmAt(J) {
    if (J <= 0) return 0;
    if (J >= N - 1) return 1200;
    const i = Math.floor(J);
    return lerp(km[i], km[i + 1], J - i);
  }

  function render(now, force = false) {
    const u = cur * SPAN - LEAD;
    const J = dwell(u);
    const dt = Math.max(0.001, (now - last) / 1000);
    if (prevJ != null) vel = lerp(vel, (J - prevJ) / dt, 0.25);
    else vel = 0;
    const moving = Math.abs(vel) > 0.002;
    if (!force && prevJ != null && Math.abs(J - prevJ) < 1e-6 && !moving) return;
    prevJ = J;

    // Parallax bands.
    for (const k in lay) {
      const off = (J + LEAD) * G * LAYERS[k];
      lay[k].style.transform = `translate3d(${(-dir * off).toFixed(2)}px,0,0)`;
    }
    const w = regionAt(J);
    if (far) {
      const fl = rtl ? ' scaleX(-1)' : '';
      far.mesa.style.transform = `translate3d(0,${((1 - w.riyadh) * H * 0.3).toFixed(1)}px,0)${fl}`;
      far.aja.style.transform = `translate3d(0,${((1 - w.hail) * H * 0.34).toFixed(1)}px,0)${fl}`;
      far.low.style.transform = `translate3d(0,${(w.riyadh * H * 0.04).toFixed(1)}px,0)${fl}`;
    }

    // Light across the day: dawn in Riyadh, noon, golden over Qassim, dusk at Jubbah.
    skyL[1].style.opacity = smooth(-0.5, 4.5, J).toFixed(3);
    skyL[2].style.opacity = smooth(6, 10.5, J).toFixed(3);
    skyL[3].style.opacity = smooth(11.5, 15.4, J).toFixed(3);
    stars.style.opacity = smooth(13.8, 15.6, J).toFixed(3);
    const day = clamp((J + LEAD) / SPAN);
    const sx = lerp(0.47, 0.64, day) * W;
    const sy = H * (0.5 - Math.sin(Math.PI * clamp(day * 1.04 - 0.02)) * 0.34);
    sun.style.transform = `translate3d(${(dir * sx).toFixed(1)}px,${sy.toFixed(1)}px,0)`;
    sunWarm.style.opacity = (smooth(0, -0.8, J) + smooth(9, 15, J)).toFixed(3);
    washWarm.style.opacity = (smooth(6, 10, J) * (1 - smooth(12, 15, J))).toFixed(3);
    washDusk.style.opacity = smooth(11.5, 15.6, J).toFixed(3);

    // Road vibration and a little motion skew on the posts while moving.
    const shake = Math.min(1, Math.abs(vel) * 0.9);
    view.style.transform = shake > 0.02 ? `translate3d(0,${(Math.sin(now / 23) * shake * 0.9).toFixed(2)}px,0)` : '';
    view.style.setProperty('--skew', `${clamp(-vel * 3.2 * dir, -9, 9).toFixed(2)}deg`);

    // Reflection panel.
    const k = clamp(Math.round(J), 0, N - 1);
    const d = J - k;
    const vis = 1 - smooth(0.2, 0.42, Math.abs(d));
    if (k !== shownK && vis < 0.5) setPanel(k);
    else if (shownK < 0) setPanel(k);
    refl.style.opacity = vis.toFixed(3);
    refl.style.transform = `translate3d(${(-dir * d * 70).toFixed(1)}px,${((1 - vis) * 14).toFixed(1)}px,0)`;
    sheen.style.transform = `translate3d(${(dir * (d * 220 + 40)).toFixed(1)}%,0,0) skewX(-18deg)`;
    refl.classList.toggle('is-on', vis > 0.6);

    // Stickers stick to the glass as you pass their stop.
    const dk = decals.map((el) => (J >= +el.dataset.k - 0.12 ? 1 : 0)).join('');
    if (dk !== lastDecals) {
      lastDecals = dk;
      let n = 0;
      decals.forEach((el, i) => {
        const on = dk[i] === '1';
        el.classList.toggle('is-on', on);
        n += on ? 1 : 0;
      });
      decalN.textContent = `${n}/${decals.length}`;
    }

    // Window handle and odometer.
    arm.style.transform = `rotate(${(u * 360 * dir).toFixed(1)}deg)`;
    const kmNow = Math.round(kmAt(J));
    if (kmNow !== lastKm) {
      lastKm = kmNow;
      odoN.textContent = num(kmNow);
      crank.setAttribute('aria-valuenow', String(kmNow));
      crank.setAttribute('aria-valuetext', `${num(kmNow)} ${ui.km}, ${t(stops[k].name)}`);
    }

    // Stop rail.
    const act = vis > 0.5 ? k : -1;
    const passed = Math.floor(J + 0.02);
    const rk = `${act}|${passed}`;
    if (rk !== railKey) {
      railKey = rk;
      railBtns.forEach((b, i) => {
        b.classList.toggle('is-active', i === act);
        b.classList.toggle('is-past', i <= passed);
        if (i === act) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
    }

    // Next stop on the door.
    const nk = vis > 0.5 ? k + 1 : Math.max(0, Math.ceil(J));
    if (nk !== nextK) {
      nextK = nk;
      if (nk >= N) {
        nextLbl.textContent = ui.arrived;
        nextName.textContent = t(stops[N - 1].name);
        nextTime.textContent = `${num(1200)} ${ui.km}`;
      } else {
        nextLbl.textContent = ui.next;
        nextName.textContent = t(stops[nk].name);
        nextTime.textContent = stops[nk].drive ? t(stops[nk].drive) : ui.start;
      }
    }

    hint.style.opacity = (1 - smooth(0.003, 0.018, cur)).toFixed(3);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.06, (now - last) / 1000 || 0.016);
    const k = 1 - Math.exp(-dt * 7.5);
    cur += (target - cur) * k;
    if (Math.abs(target - cur) < 0.00001) cur = target;
    render(now);
    last = now;
    if (active && visible) raf = requestAnimationFrame(frame);
  }
  const kick = () => {
    if (!raf && active && visible) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  /* ---------- input: drag the view ---------- */
  let drag = null;
  view.parentElement.addEventListener('pointerdown', (e) => {
    if (!active || e.button !== 0 || e.target.closest('.crank')) return;
    drag = { x: e.clientX, id: e.pointerId, v: 0, t: performance.now() };
    win.setPointerCapture(e.pointerId);
    win.classList.add('is-dragging');
  });
  win.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    const now = performance.now();
    drag.v = lerp(drag.v, dx / Math.max(1, now - drag.t), 0.5);
    drag.x = e.clientX;
    drag.t = now;
    window.scrollBy(0, -dx * dir * (perStop / G) * 1.4);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const v = drag.v;
    drag = null;
    win.classList.remove('is-dragging');
    if (Math.abs(v) > 0.3) window.scrollBy({ top: -v * dir * (perStop / G) * 1.4 * 260, behavior: 'smooth' });
  };
  win.addEventListener('pointerup', endDrag);
  win.addEventListener('pointercancel', endDrag);

  /* ---------- input: wind the handle ---------- */
  let wind = null;
  const angle = (e) => {
    const r = crank.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  crank.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    wind = { a: angle(e), id: e.pointerId };
    crank.setPointerCapture(e.pointerId);
    crank.classList.add('is-winding');
    crank.focus({ preventScroll: true });
  });
  crank.addEventListener('pointermove', (e) => {
    if (!wind || e.pointerId !== wind.id) return;
    const a = angle(e);
    let da = a - wind.a;
    if (da > 180) da -= 360;
    if (da < -180) da += 360;
    wind.a = a;
    window.scrollBy(0, (da * dir * perStop) / 360);
  });
  const endWind = (e) => {
    if (!wind || e.pointerId !== wind.id) return;
    wind = null;
    crank.classList.remove('is-winding');
  };
  crank.addEventListener('pointerup', endWind);
  crank.addEventListener('pointercancel', endWind);
  crank.addEventListener('keydown', (e) => {
    const J = dwell(cur * SPAN - LEAD);
    const at = clamp(Math.round(J), 0, N - 1);
    const fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
    const back = rtl ? 'ArrowRight' : 'ArrowLeft';
    let to = null;
    if (e.key === fwd || e.key === 'ArrowUp' || e.key === 'PageDown') to = J < at - 0.05 ? at : at + 1;
    else if (e.key === back || e.key === 'ArrowDown' || e.key === 'PageUp') to = J > at + 0.05 ? at : at - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = N - 1;
    if (to == null) return;
    e.preventDefault();
    goTo(to);
  });

  railBtns.forEach((b) => b.addEventListener('click', () => goTo(+b.dataset.k)));

  /* ---------- mode ---------- */
  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        measure();
        kick();
      }
    },
    { rootMargin: '200px 0px' }
  );

  function setMode() {
    const on = mq.matches && !reduced;
    if (on === active) return;
    active = on;
    root.classList.toggle('is-scene', on);
    stack && stack.setHidden(on);
    if (on) {
      stops.forEach((s) => {
        const im = new Image();
        im.src = asset(s.photo);
      });
      layout();
      io.observe(scene);
    } else {
      io.unobserve(scene);
      scene.style.height = '';
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!active) return;
      measure();
      kick();
    },
    { passive: true }
  );
  let rt = 0;
  const relayout = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      setMode();
      if (active) layout();
    }, 120);
  };
  window.addEventListener('resize', relayout);
  window.addEventListener('p:refresh', () => active && (measure(), kick()));
  mq.addEventListener('change', relayout);
  setMode();
}
