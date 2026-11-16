// The day on the road: maps scroll to (clock time, travel distance), drives the scene,
// the stop panel and the sun/moon clock. Modes: 'desk' (pinned), 'phone' (stacked), 'rm' (static).

import { cumulativeTimes, fmtClock, smooth, easeInOut, clamp, sky, sun, rgb, PRE0, DAY0, NIGHT } from './time.js';
import { NEAR_V, campHTML } from './scene.js';

export const HOLD = 0.42;
export const TAIL_D = 0.9; // travel during the final roll into camp // share of each stop's scroll unit where the car is parked
const UNITS = 17; // lead-in + 16 stops (+ tail into the night)
const pad = (n) => String(n).padStart(2, '0');

// s: -1..0 before the journey, 0..17 along it. Returns clock minutes, travel D and the stop index.
export function stateAt(s, T) {
  const N = T.length;
  if (s < 0) {
    const k = clamp(s + 1);
    return { t: PRE0 + 50 * k, D: -1.4 + 1.25 * k, i: 0, tail: 0 };
  }
  if (s < 0.5) {
    const k = s / 0.5;
    return { t: 350 + (DAY0 - 350) * k, D: -0.15 + 0.15 * k, i: 0, tail: 0 };
  }
  if (s < N - 0.5) {
    const i = Math.min(N - 2, Math.floor(s - 0.5));
    const u = s - 0.5 - i;
    if (u < HOLD) return { t: T[i], D: i + 0.12 * (u / HOLD), i, tail: 0 };
    const e = easeInOut((u - HOLD) / (1 - HOLD));
    return { t: T[i] + (T[i + 1] - T[i]) * e, D: i + 0.12 + 0.88 * e, i: e < 0.5 ? i : i + 1, tail: 0 };
  }
  if (s < N) return { t: T[N - 1], D: N - 1 + 0.12 * ((s - (N - 0.5)) / 0.5), i: N - 1, tail: 0 };
  const k = clamp(s - N);
  const e = easeInOut(k);
  return { t: T[N - 1] + (NIGHT - T[N - 1]) * e, D: N - 1 + 0.12 + TAIL_D * e, i: N - 1, tail: k };
}

export const holdS = (i) => 0.5 + i + HOLD / 2;
export const endD = (N) => N - 1 + 0.12 + TAIL_D;
export const campW = (N, anchor) => endD(N) + anchor / NEAR_V;

export function createJourney({ content, lang, ui, scene, mode, els }) {
  const stops = content.stops;
  const T = cumulativeTimes(stops);
  const N = stops.length;
  const rtl = lang === 'ar';
  const regionName = Object.fromEntries(content.regions.map((r) => [r.key, r.name[lang]]));
  const desk = mode === 'desk';
  const phone = mode === 'phone';
  const motion = mode !== 'rm';

  renderList();

  // signs planted along the road
  const anchor = desk ? 0.72 : 0.5;
  const signAt = (i) => i + 0.06 + anchor / NEAR_V;
  if (scene && motion) {
    scene.addSign({ w: signAt(0), src: '../' + content.logo.stickerPng, cls: 'sign--logo' });
    stops.forEach((s, i) => s.sticker && scene.addSign({ w: signAt(i), src: '../' + s.sticker }));
    // Salma passes by on the drive from Hail to Jubbah (desktop only: too tight on a phone)
    if (desk) scene.addSign({ w: 14.55 + 0.6 / NEAR_V, src: '../' + content.stickers.salma, cls: 'sign--pass' });
    scene.addSign({ w: campW(N, desk ? 0.66 : 0.5), cls: 'camp', html: campHTML() });
  }

  // HUD (desktop panel + clock; phone gets the compact clock)
  let hud = null;
  if (scene && motion) hud = buildHud();

  let anchors = [];
  let sTarget = -1;
  let sNow = -1;
  let raf = 0;
  let last = 0;
  let shownIdx = -1;

  function measure() {
    const vh = window.innerHeight;
    const stage = vh - 64;
    const top = (n) => n.getBoundingClientRect().top + window.scrollY;
    if (desk) {
      const unit = Math.round(vh * 0.8);
      els.journey.style.height = UNITS * unit + stage + 'px';
      const j0 = top(els.journey) - 64;
      anchors = [[0, -1], [j0, 0], [j0 + UNITS * unit, UNITS]];
    } else if (phone) {
      els.journey.style.height = '';
      const cards = [...els.list.querySelectorAll('.card')];
      const centre = (n) => top(n) + n.offsetHeight / 2 - 64 - stage / 2;
      anchors = [[0, -1], [top(els.journey) - 64 - stage * 0.5, 0]];
      cards.forEach((c, i) => anchors.push([centre(c), holdS(i)]));
      // the roll into camp ends where the night sections begin
      anchors.push([top(els.after || els.closing) - 64, UNITS]);
    }
  }

  function sFromY(y) {
    if (!anchors.length) return -1;
    if (y <= anchors[0][0]) return anchors[0][1];
    for (let i = 0; i < anchors.length - 1; i++) {
      const [y0, s0] = anchors[i];
      const [y1, s1] = anchors[i + 1];
      if (y < y1) return s0 + ((s1 - s0) * (y - y0)) / Math.max(1, y1 - y0);
    }
    return anchors[anchors.length - 1][1];
  }

  function render(s) {
    const st = stateAt(s, T);
    scene.update(st);
    if (hud) hud.update(st, s);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(64, last ? now - last : 16);
    last = now;
    const k = 1 - Math.exp(-dt / 120);
    sNow += (sTarget - sNow) * k;
    if (Math.abs(sTarget - sNow) < 0.0008) sNow = sTarget;
    render(sNow);
    if (sNow !== sTarget) raf = requestAnimationFrame(frame);
    else last = 0;
  }

  function onScroll() {
    sTarget = sFromY(window.scrollY);
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!motion || !scene) return;
    measure();
    sTarget = sNow = sFromY(window.scrollY);
    render(sNow);
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function relayout() {
    if (!motion || !scene) return;
    scene.resize();
    measure();
    sTarget = sNow = sFromY(window.scrollY);
    render(sNow);
  }

  // scroll target for "Explore the stops"
  function firstStopY() {
    if (desk) return anchors[1][0] + holdS(0) * (anchors[2][0] - anchors[1][0]) / UNITS;
    if (phone && anchors[2]) return anchors[2][0];
    return els.journey.getBoundingClientRect().top + window.scrollY - 64;
  }

  /* ---------- list (phone stacked panels, reduced-motion grid, screen readers on desktop) ---------- */
  function renderList() {
    const stat = content.intro.stats[1];
    els.journeyTitle.innerHTML = `<span class="journey__n">${stat.value}</span> <span>${stat.label[lang]}</span>`;
    let html = '';
    content.regions.forEach((r) => {
      const idx = stops.map((s, i) => (s.region === r.key ? i : -1)).filter((i) => i >= 0);
      html += `<section class="region" data-region="${r.key}">
        <header class="region__head"><h3 class="region__name">${r.name[lang]}</h3><span class="region__count">${r.count[lang]}</span></header>
        <ol class="region__list" start="${idx[0] + 1}">${idx.map(card).join('')}</ol>
      </section>`;
    });
    els.list.innerHTML = html;
  }

  function card(i) {
    const s = stops[i];
    const t = T[i];
    const night = t >= 1098;
    const sk = sky(t);
    const sn = sun(t);
    const k = clamp((t - DAY0) / (NIGHT - DAY0));
    const cx = 50 - 40 * Math.cos(Math.PI * k);
    const cy = 92 - 70 * Math.sin(Math.PI * k);
    const glyph = night ? 'moon' : 'sun';
    return `<li class="card" data-theme="${night ? 'night' : 'day'}" data-i="${i}">
      <div class="card__media">
        <img class="card__photo" src="../${s.photo}" alt="" loading="lazy" decoding="async">
        ${s.sticker ? `<img class="card__sticker" src="../${s.sticker}" alt="" loading="lazy">` : ''}
      </div>
      <div class="card__body">
        <p class="card__head"><span class="card__num">${pad(i + 1)}</span><span class="card__of">/ ${N}</span><span class="card__region">${regionName[s.region]}</span></p>
        <h4 class="card__name">${s.name[lang]}</h4>
        <dl class="card__meta">
          <div><dt>${ui.arrive}</dt><dd><span class="chip chip--${glyph}" style="--a:${rgb(sk.top)};--b:${rgb(sk.mid)};--c:${rgb(sk.hor)};--x:${cx.toFixed(1)}%;--y:${cy.toFixed(1)}%;--o:${night ? 1 : clamp(sn.up + 0.3)}"><i></i></span>${fmtClock(t)}</dd></div>
          <div><dt>${ui.drive}</dt><dd>${s.drive ? s.drive[lang] : ui.start}</dd></div>
        </dl>
        <p class="card__desc">${s.desc[lang]}</p>
      </div>
    </li>`;
  }

  /* ---------- HUD ---------- */
  function buildHud() {
    const root = document.createElement('div');
    root.className = 'hud';
    root.setAttribute('aria-hidden', 'true');
    const ticks = T.map((t, i) => {
      const k = clamp((t - DAY0) / (NIGHT - DAY0));
      const a = Math.PI * k;
      return `<circle class="tick" data-i="${i}" cx="${(88 - 80 * Math.cos(a)).toFixed(1)}" cy="${(88 - 80 * Math.sin(a)).toFixed(1)}" r="2.6"/>`;
    }).join('');
    root.innerHTML = `
      <div class="clock">
        <svg class="clock__arc" viewBox="0 0 176 96">
          <line class="clock__hz" x1="0" y1="88" x2="176" y2="88"/>
          <path class="clock__track" d="M8 88A80 80 0 0 1 168 88" pathLength="1"/>
          <path class="clock__done" d="M8 88A80 80 0 0 1 168 88" pathLength="1"/>
          <g class="clock__ticks">${ticks}</g>
          <g class="clock__body">
            <g class="clock__sun"><circle r="7"/><path d="M0 -13V-10M0 10V13M-13 0H-10M10 0H13M-9.2 -9.2L-7 -7M7 7L9.2 9.2M-9.2 9.2L-7 7M7 -7L9.2 -9.2"/></g>
            <g class="clock__moon"><path d="M3 -8A8 8 0 1 0 3 8A6.4 6.4 0 1 1 3 -8Z"/></g>
          </g>
        </svg>
        <div class="clock__row"><span class="clock__time">06:00</span><span class="clock__stop"></span></div>
        <div class="clock__bar">${T.map(() => '<i></i>').join('')}</div>
      </div>
      <div class="panel" data-dir="1">
        <div class="panel__inner">
          <p class="panel__head"><span class="panel__num"></span><span class="panel__of">/ ${N}</span><span class="panel__region"></span></p>
          <div class="panel__main">
            <div class="panel__text">
              <h3 class="panel__name"></h3>
              <dl class="panel__meta">
                <div><dt>${ui.arrive}</dt><dd class="panel__arrive"></dd></div>
                <div><dt>${ui.drive}</dt><dd class="panel__drive"></dd></div>
              </dl>
            </div>
            <div class="panel__photo"><img alt="" decoding="async"></div>
          </div>
          <p class="panel__desc"></p>
        </div>
      </div>`;
    scene.root.appendChild(root);
    const q = (s) => root.querySelector(s);
    const P = {
      num: q('.panel__num'),
      region: q('.panel__region'),
      name: q('.panel__name'),
      arrive: q('.panel__arrive'),
      drive: q('.panel__drive'),
      desc: q('.panel__desc'),
      img: q('.panel__photo img'),
      panel: q('.panel'),
      time: q('.clock__time'),
      stop: q('.clock__stop'),
      body: q('.clock__body'),
      done: q('.clock__done'),
      ticks: [...root.querySelectorAll('.tick')],
      bars: [...root.querySelectorAll('.clock__bar i')],
    };
    // warm the photo cache so swaps are instant
    stops.forEach((s) => {
      const im = new Image();
      im.decoding = 'async';
      im.src = '../' + s.photo;
    });
    let swapTimer = 0;
    let theme = '';
    let lastMin = -1;
    let passed = -1;

    function fill(i) {
      const s = stops[i];
      P.num.textContent = pad(i + 1);
      P.region.textContent = regionName[s.region];
      P.name.textContent = s.name[lang];
      P.arrive.textContent = fmtClock(T[i]);
      P.drive.textContent = s.drive ? s.drive[lang] : ui.start;
      P.desc.textContent = s.desc[lang];
      P.img.src = '../' + s.photo;
      P.stop.textContent = `${ui.stop} ${pad(i + 1)} / ${N}`;
    }

    function update(st, s) {
      const op = smooth(-0.15, 0.3, s) * (1 - smooth(16.2, 16.55, s));
      root.style.setProperty('--hud', op.toFixed(3));
      root.style.visibility = op < 0.01 ? 'hidden' : 'visible';
      const th = st.t >= 1098 || st.t < 352 ? 'night' : 'day';
      if (th !== theme) {
        theme = th;
        root.dataset.theme = th;
      }
      if (st.i !== shownIdx) {
        const first = shownIdx < 0;
        const dir = st.i > shownIdx ? 1 : -1;
        shownIdx = st.i;
        clearTimeout(swapTimer);
        if (first) fill(st.i);
        else {
          P.panel.dataset.dir = String(dir);
          P.panel.classList.add('is-swap');
          swapTimer = setTimeout(() => {
            fill(shownIdx);
            P.panel.classList.remove('is-swap');
          }, 200);
        }
      }
      const m = Math.floor(st.t);
      if (m !== lastMin) {
        lastMin = m;
        P.time.textContent = fmtClock(st.t);
      }
      const k = clamp((st.t - DAY0) / (NIGHT - DAY0));
      const a = Math.PI * k;
      P.body.setAttribute('transform', `translate(${(88 - 80 * Math.cos(a)).toFixed(2)} ${(88 - 80 * Math.sin(a)).toFixed(2)})`);
      P.done.style.strokeDasharray = `${k.toFixed(4)} 1`;
      root.classList.toggle('is-moon', st.t >= 1092);
      let n = 0;
      while (n < N && st.t >= T[n] - 0.5 && s > 0.3) n++;
      if (n !== passed) {
        passed = n;
        P.ticks.forEach((c, i) => c.classList.toggle('is-on', i < n));
        P.bars.forEach((b, i) => b.classList.toggle('is-on', i < n));
      }
    }
    return { update };
  }

  return { start, relayout, firstStopY, times: T };
}
