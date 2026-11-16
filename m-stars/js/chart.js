// The signature: the 16 stops are stars placed by real latitude/longitude. As
// you scroll, the route draws itself as a constellation from Riyadh to Jubbah and
// the sky slowly turns. The active star flares and a leader line ties it to its
// annotation. Drag to turn the sky; hover or focus a star for its label; click a
// star to jump to that stop. Phones get a static sky with the line drawing;
// reduced motion gets the fully drawn chart.
import { t, esc, asset, rtl, reduced, ui, pad2, coord } from './i18n.js';
import { compactMQ, fineMQ, clamp, easeOutBack, splitWords, reveal, visibleLoop, starGlyph } from './util.js';
import { makeProjection, makeField, drawField, milkyWay, sprite, CREAM, LAVENDER, LAV_LIGHT } from './sky.js';

const DEG = Math.PI / 180;
const HOST = 64;

const ICON = {
  drag: '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4.5 12a7.5 7.5 0 0 1 13.3-4.8M19.5 12a7.5 7.5 0 0 1-13.3 4.8" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M18.6 3.6v4.2h-4.2M5.4 20.4v-4.2h4.2" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg>',
  clock: '<svg class="note__ico" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7.5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M10 5.5V10l3 2" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square"/></svg>',
  compass:
    '<svg class="hud__rose" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" stroke-opacity=".35"/><path class="hud__needle-n" d="M20 5 L23 20 L17 20 Z"/><path class="hud__needle-s" d="M20 35 L23 20 L17 20 Z"/><circle cx="20" cy="20" r="1.6"/></svg>'
};

export function initChart(data) {
  const root = document.getElementById('stops');
  const stops = data.stops;
  const N = stops.length;
  const P = makeProjection(stops);
  const world = stops.map((s) => P.project(s.lat, s.lng));
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));
  const stat = data.intro.stats[1];
  const first = t(stops[0].name);
  const last = t(stops[N - 1].name);

  // Number labels sit on the outside of the bend at each star.
  const labDir = world.map((p, i) => {
    const a = world[i - 1];
    const b = world[i + 1];
    let vx = 0;
    let vy = 0;
    for (const q of [a, b]) {
      if (!q) continue;
      const dx = p.x - q.x;
      const dy = p.y - q.y;
      const l = Math.hypot(dx, dy) || 1;
      vx += dx / l;
      vy += dy / l;
    }
    let l = Math.hypot(vx, vy);
    if (l < 0.35) {
      const q0 = a || p;
      const q1 = b || p;
      vx = -(q1.y - q0.y);
      vy = q1.x - q0.x;
      l = Math.hypot(vx, vy) || 1;
    }
    return { x: vx / l, y: vy / l };
  });

  // Region "constellation" names sit in clear sky beside each region's stars.
  const ANCHOR = { riyadh: [25.8, 46.62], qassim: [25.45, 43.85], hail: [27.12, 41.3] };
  const regionPos = data.regions.map((r) => {
    const own = stops.map((s, i) => [s, world[i]]).filter(([s]) => s.region === r.key).map(([, w]) => w);
    if (ANCHOR[r.key]) return P.project(ANCHOR[r.key][0], ANCHOR[r.key][1]);
    const x = own.reduce((a, w) => a + w.x, 0) / own.length;
    return { x, y: Math.max(...own.map((w) => w.y)) + 0.42 };
  });

  const note = (s, i) => {
    const c = coord(s.lat, s.lng);
    return `<li class="step" data-i="${i}" id="stop-${s.key}">
      <article class="note" tabindex="-1" aria-labelledby="note-${i}">
        <span class="m-corners" aria-hidden="true"></span>
        <header class="note__top">
          <span class="note__of">${esc(ui.stopOf(i + 1, N))}</span>
          <span class="note__region">${esc(t(regionBy[s.region]?.name))}</span>
        </header>
        <h3 class="note__name" id="note-${i}">${esc(t(s.name))}</h3>
        <p class="note__coord" data-coord="${esc(c)}">${esc(c)}</p>
        <figure class="note__photo">
          <span class="note__frame"><img src="${asset(s.photo)}" alt="${esc(t(s.name))}" loading="lazy" decoding="async" width="600" height="600"></span>
          ${s.sticker ? `<img class="note__sticker" src="${asset(s.sticker)}" alt="" loading="lazy" decoding="async">` : ''}
        </figure>
        <p class="note__drive">${ICON.clock}${
          s.drive ? `<span><strong>${esc(t(s.drive))}</strong> ${esc(ui.fromLast)}</span>` : `<span><strong>${esc(ui.start)}</strong></span>`
        }</p>
        <p class="note__desc">${esc(t(s.desc))}</p>
      </article>
    </li>`;
  };

  root.innerHTML = `
    <header class="chart__head nt-wrap">
      <p class="m-eyebrow" data-r>${starGlyph()}<span>${esc(ui.route(first, last))}</span></p>
      <h2 class="m-h2 chart__title" id="stops-title"><span class="chart__big" data-r>${esc(stat.value)}</span><span class="m-split">${esc(t(stat.label))}</span></h2>
      <ul class="chart__regions" data-r>
        ${data.regions
          .map((r) => `<li class="rg rg--${r.key}"><span class="rg__dot" aria-hidden="true"></span><span class="rg__name">${esc(t(r.name))}</span><span class="rg__n">${esc(t(r.count))}</span></li>`)
          .join('')}
      </ul>
    </header>
    <div class="chart__body">
      <div class="chart__stage">
        <canvas class="chart__canvas" aria-hidden="true"></canvas>
        <div class="chart__rl" aria-hidden="true">
          ${data.regions.map((r) => `<span class="rl rl--${r.key}"><span class="rl__name">${esc(t(r.name))}</span></span>`).join('')}
        </div>
        <ol class="chart__stars" aria-label="${esc(ui.starsLabel)}">
          ${stops.map((s, i) => `<li><button class="star-btn" type="button" data-i="${i}" aria-label="${esc(ui.goTo(t(s.name), i + 1, N))}"></button></li>`).join('')}
        </ol>
        <div class="chart__tip" aria-hidden="true"><span class="chart__tip-n"></span><span class="chart__tip-name"></span></div>
        <div class="chart__reticle" aria-hidden="true"><i></i></div>
        <p class="hud__drag" aria-hidden="true">${ICON.drag}<span>${esc(ui.drag)}</span></p>
        <div class="hud">
          <button class="hud__compass" type="button" aria-label="${esc(ui.reset)}">${ICON.compass}</button>
          <div class="hud__count" aria-hidden="true">
            <span class="hud__label">${esc(ui.stop)}</span>
            <span class="hud__num"><span class="hud__d">01</span></span>
            <span class="hud__total">/ ${N}</span>
          </div>
          <ol class="hud__scale" aria-hidden="true">${stops.map((s) => `<li class="rg--${s.region}"></li>`).join('')}</ol>
        </div>
      </div>
      <ol class="chart__steps">${stops.map(note).join('')}</ol>
    </div>`;

  splitWords(root.querySelector('.chart__title .m-split'));
  root.querySelectorAll('[data-r], .chart__title .m-split').forEach((el) => reveal(el));

  const body = root.querySelector('.chart__body');
  const stage = root.querySelector('.chart__stage');
  const canvas = root.querySelector('.chart__canvas');
  const ctx = canvas.getContext('2d');
  const steps = [...root.querySelectorAll('.step')];
  const notes = steps.map((s) => s.querySelector('.note'));
  const btns = [...root.querySelectorAll('.star-btn')];
  const rls = [...root.querySelectorAll('.rl')];
  const tip = root.querySelector('.chart__tip');
  const tipN = root.querySelector('.chart__tip-n');
  const tipName = root.querySelector('.chart__tip-name');
  const ret = root.querySelector('.chart__reticle');
  const compass = root.querySelector('.hud__compass');
  const numBox = root.querySelector('.hud__num');
  const ticks = [...root.querySelectorAll('.hud__scale li')];
  const dragHint = root.querySelector('.hud__drag');

  const spr = { cream: sprite(CREAM, 128), lav: sprite(LAVENDER, 128), lavL: sprite(LAV_LIGHT, 128) };
  const mw = milkyWay(512, 11);

  let W = 0;
  let H = 0;
  let dpr = 1;
  let compact = compactMQ.matches;
  let scale = 1;
  let baseX = 0;
  let baseY = 0;
  let R = 0;
  let field = [];
  let ringR = 0;
  let fT = 0;
  let fS = 0;
  let active = -1;
  let hovered = -1;
  let rotUser = 0;
  let rotVel = 0;
  let drag = null;
  let reset = null;
  let pingT = -10;
  let camX = 0;
  let camY = 0;
  let rot = 0;
  let live = false;
  const S = world.map(() => [0, 0]);
  const pointer = { x: 0, y: 0, in: false, rx: 0, ry: 0 };
  const cache = new Map();
  const setT = (el, v) => {
    if (cache.get(el) !== v) {
      cache.set(el, v);
      el.style.transform = v;
    }
  };

  function layout() {
    compact = compactMQ.matches;
    live = !compact && !reduced;
    root.classList.toggle('is-live', live);
    const r = stage.getBoundingClientRect();
    W = r.width;
    H = r.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    let x0;
    let x1;
    let y0;
    let y1;
    if (compact) {
      x0 = 20;
      x1 = W - 20;
      y0 = 20;
      y1 = H - 52;
    } else {
      const g = parseFloat(getComputedStyle(root).getPropertyValue('--nt-gutter')) || 32;
      const used = notes[0].offsetWidth + g * 2;
      if (rtl) {
        x0 = used + g;
        x1 = W - g;
      } else {
        x0 = g;
        x1 = W - used - g;
      }
      y0 = 88;
      y1 = H - 132;
    }
    scale = Math.min((x1 - x0) / P.w, (y1 - y0) / P.h) * (compact ? 0.92 : 0.84);
    baseX = (x0 + x1) / 2;
    baseY = (y0 + y1) / 2;
    ringR = (Math.hypot(P.w, P.h) / 2) * scale + 36;
    R = Math.hypot(W, H) * 0.85;
    field = makeField(Math.round(clamp((W * H) / 1500, 220, 1000)), R, 5);
    readScroll();
    if (!live) kick();
  }

  function readScroll() {
    if (!compact) {
      const top = body.getBoundingClientRect().top;
      const h = stage.offsetHeight || 1;
      fT = clamp((HOST - top) / h, 0, N - 1);
    } else {
      const yRef = HOST + stage.offsetHeight + 24;
      let f = 0;
      for (let i = 0; i < N; i++) {
        const tp = steps[i].getBoundingClientRect().top;
        if (tp > yRef) break;
        const nx = i < N - 1 ? steps[i + 1].getBoundingClientRect().top : tp + 1;
        f = i + clamp((yRef - tp) / Math.max(1, nx - tp), 0, 1);
      }
      fT = clamp(f, 0, N - 1);
    }
    const a = compact ? Math.floor(fT + 0.001) : Math.round(fT);
    if (a !== active) setActive(a);
  }

  function setActive(i) {
    const prev = active;
    active = i;
    pingT = performance.now() / 1000;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    ticks.forEach((tk, k) => {
      tk.classList.toggle('is-on', k <= i);
      tk.classList.toggle('is-cur', k === i);
    });
    rollDigits(i + 1, prev < 0 ? 1 : i > prev ? 1 : -1);
    if (!reduced && prev >= 0) scramble(notes[i].querySelector('.note__coord'));
  }

  function rollDigits(n, dir) {
    const old = numBox.querySelector('.hud__d:not(.is-out)');
    if (old && old.textContent === pad2(n)) return;
    const nu = document.createElement('span');
    nu.className = 'hud__d is-in';
    nu.style.setProperty('--dir', dir);
    nu.textContent = pad2(n);
    numBox.append(nu);
    if (old) {
      old.style.setProperty('--dir', dir);
      old.classList.add('is-out');
      setTimeout(() => old.remove(), 600);
    }
    requestAnimationFrame(() => requestAnimationFrame(() => nu.classList.remove('is-in')));
  }

  function scramble(el) {
    if (!el) return;
    const final = el.dataset.coord;
    const t0 = performance.now();
    const step = (now) => {
      const k = (now - t0) / 650;
      if (k >= 1) {
        el.textContent = final;
        return;
      }
      el.textContent = final.replace(/\d/g, (d, idx) => (idx / final.length < k ? d : String(Math.floor(Math.random() * 10))));
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function setHover(i) {
    if (i === hovered) return;
    hovered = i;
    stage.classList.toggle('is-over-star', i >= 0);
    if (i >= 0) {
      tipN.textContent = pad2(i + 1);
      tipName.textContent = t(stops[i].name);
      tip.classList.add('is-on');
    } else tip.classList.remove('is-on');
    if (!live) kick();
  }

  function pick(mx, my) {
    let best = -1;
    let bd = 30 * 30;
    for (let i = 0; i < N; i++) {
      const dx = S[i][0] - mx;
      const dy = S[i][1] - my;
      const d = dx * dx + dy * dy;
      if (d < bd) {
        bd = d;
        best = i;
      }
    }
    return best;
  }

  function goTo(i, focusNote) {
    let y;
    if (!compact) y = window.scrollY + body.getBoundingClientRect().top - HOST + i * stage.offsetHeight + 2;
    else y = window.scrollY + steps[i].getBoundingClientRect().top - (HOST + stage.offsetHeight + 16);
    window.scrollTo({ top: Math.max(0, y), behavior: reduced ? 'auto' : 'smooth' });
    if (focusNote) notes[i].focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- update + draw

  function update(now) {
    let moving = false;
    if (reduced) fS = fT;
    else {
      const d = fT - fS;
      if (Math.abs(d) < 0.0008) fS = fT;
      else {
        fS += d * (compact ? 0.2 : 0.12);
        moving = true;
      }
    }
    if (live && !drag) {
      if (reset) {
        const k = Math.min(1, (now - reset.t0) / 1100);
        rotUser = reset.from * (1 - easeOutBack(k));
        if (k >= 1) {
          rotUser = 0;
          reset = null;
        }
      } else if (rotVel) {
        rotUser += rotVel;
        rotVel *= 0.95;
        if (Math.abs(rotVel) < 0.00005) rotVel = 0;
      }
    }
    const rotScroll = live ? (-8 + (fS / (N - 1)) * 20) * DEG : 0;
    rot = rotScroll + rotUser;
    // The camera leans a little toward the active star.
    if (live) {
      const fl = Math.min(N - 1, Math.max(0, fS));
      const k = Math.floor(fl);
      const fr = fl - k;
      const a = world[k];
      const b = world[Math.min(N - 1, k + 1)];
      const wx = (a.x + (b.x - a.x) * fr) * scale;
      const wy = (a.y + (b.y - a.y) * fr) * scale;
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      const tx = -(wx * c - wy * s) * 0.14;
      const ty = -(wx * s + wy * c) * 0.14;
      camX += (tx - camX) * 0.06;
      camY += (ty - camY) * 0.06;
    }
    return moving;
  }

  function draw(now) {
    const time = now / 1000;
    const cx = baseX + camX;
    const cy = baseY + camY;
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Sky layer: milky way, field, graticule and the outer degree ring turn together.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.globalAlpha = compact ? 0.75 : 0.9;
    ctx.drawImage(mw, -R, -R, R * 2, R * 2);
    ctx.globalAlpha = 1;
    drawField(ctx, field, time, live);
    drawGraticule();
    if (!compact) drawRing();
    ctx.restore();

    for (let i = 0; i < N; i++) {
      const x = world[i].x * scale;
      const y = world[i].y * scale;
      S[i][0] = cx + x * c - y * s;
      S[i][1] = cy + x * s + y * c;
    }

    const fl = reduced ? N - 1 : fS;
    const k = Math.floor(fl);
    const fr = fl - k;
    const head = k < N - 1 ? [S[k][0] + (S[k + 1][0] - S[k][0]) * fr, S[k][1] + (S[k + 1][1] - S[k][1]) * fr] : S[N - 1];

    // Planned course: dotted, faint.
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([1.5, 6]);
    ctx.strokeStyle = `rgba(${LAV_LIGHT},0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(head[0], head[1]);
    for (let i = k + 1; i < N; i++) ctx.lineTo(S[i][0], S[i][1]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Drawn course: lavender glow under a fine cream line.
    const trace = () => {
      ctx.beginPath();
      ctx.moveTo(S[0][0], S[0][1]);
      for (let i = 1; i <= k; i++) ctx.lineTo(S[i][0], S[i][1]);
      ctx.lineTo(head[0], head[1]);
    };
    trace();
    ctx.strokeStyle = `rgba(${LAVENDER},0.38)`;
    ctx.lineWidth = 7;
    ctx.stroke();
    trace();
    ctx.strokeStyle = `rgba(${CREAM},0.95)`;
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Stars.
    ctx.font = '600 10px nt-plex, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < N; i++) {
      if (i === active) continue;
      const [x, y] = S[i];
      const reached = i <= fl + 0.001;
      const g = reached ? 30 : 20;
      ctx.globalAlpha = reached ? 0.75 : 0.45;
      ctx.drawImage(reached ? spr.cream : spr.lavL, x - g / 2, y - g / 2, g, g);
      ctx.globalAlpha = 1;
      ctx.fillStyle = reached ? `rgb(${CREAM})` : `rgba(${LAV_LIGHT},0.85)`;
      ctx.beginPath();
      ctx.arc(x, y, reached ? 2.4 : 1.8, 0, Math.PI * 2);
      ctx.fill();
      if (reached && !compact) label(i, x, y, c, s, 0.6);
    }

    // Comet head while the line travels.
    if (!reduced && fr > 0.01 && fr < 0.99) {
      ctx.globalAlpha = 0.95;
      ctx.drawImage(spr.cream, head[0] - 17, head[1] - 17, 34, 34);
      ctx.globalAlpha = 1;
    }

    // The active star flares.
    if (active >= 0) {
      const [x, y] = S[active];
      const pulse = live ? 1 + 0.07 * Math.sin(time * 2.6) : 1;
      ctx.globalAlpha = 0.45;
      ctx.drawImage(spr.lav, x - 90 * pulse, y - 90 * pulse, 180 * pulse, 180 * pulse);
      ctx.globalAlpha = 1;
      ctx.drawImage(spr.cream, x - 42 * pulse, y - 42 * pulse, 84 * pulse, 84 * pulse);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(live ? time * 0.18 : 0);
      for (let q = 0; q < 8; q++) {
        const len = (q % 2 ? 16 : compact ? 26 : 38) * pulse;
        const gr = ctx.createLinearGradient(0, 0, len, 0);
        gr.addColorStop(0, `rgba(${CREAM},0.95)`);
        gr.addColorStop(1, `rgba(${CREAM},0)`);
        ctx.strokeStyle = gr;
        ctx.lineWidth = q % 2 ? 0.8 : 1.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(len, 0);
        ctx.stroke();
        ctx.rotate(Math.PI / 4);
      }
      ctx.restore();
      ctx.fillStyle = '#fffdf2';
      ctx.beginPath();
      ctx.arc(x, y, 3.6, 0, Math.PI * 2);
      ctx.fill();
      if (!reduced) {
        const e = time - pingT;
        if (e >= 0 && e < 1.5) {
          const p = e / 1.5;
          ctx.strokeStyle = `rgba(${CREAM},${0.7 * (1 - p)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 8 + (1 - Math.pow(1 - p, 3)) * 54, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      if (!compact) label(active, x, y, c, s, 1);
    }

    // Hover ring.
    if (hovered >= 0) {
      const [x, y] = S[hovered];
      ctx.strokeStyle = `rgba(${CREAM},0.9)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Leader line from the active star to its annotation.
    if (!compact && active >= 0) {
      const w = clamp(1 - Math.abs(fS - active) * 3, 0, 1);
      if (w > 0.01) {
        const sr = stage.getBoundingClientRect();
        const nr = notes[active].getBoundingClientRect();
        const ax = (rtl ? nr.right : nr.left) - sr.left;
        const ay = nr.top - sr.top + 34;
        const dir = rtl ? -1 : 1;
        const [sx, sy] = S[active];
        const ex = ax - dir * 1;
        const elbowX = ax - dir * 56;
        const ang = Math.atan2(ay - sy, elbowX - sx);
        ctx.globalAlpha = w * 0.75;
        ctx.strokeStyle = `rgb(${CREAM})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(ang) * 16, sy + Math.sin(ang) * 16);
        ctx.lineTo(elbowX, ay);
        ctx.lineTo(ex, ay);
        ctx.stroke();
        ctx.fillStyle = `rgb(${CREAM})`;
        ctx.fillRect(elbowX - 2, ay - 2, 4, 4);
        ctx.globalAlpha = 1;
      }
    }

    syncDom(c, s, cx, cy);
  }

  function label(i, x, y, c, s, a) {
    const d = labDir[i];
    const lx = x + (d.x * c - d.y * s) * 15;
    const ly = y + (d.x * s + d.y * c) * 15;
    ctx.globalAlpha = a;
    ctx.fillStyle = `rgb(${CREAM})`;
    ctx.fillText(pad2(i + 1), lx, ly);
    ctx.globalAlpha = 1;
  }

  function drawGraticule() {
    ctx.strokeStyle = `rgba(${LAV_LIGHT},0.16)`;
    ctx.fillStyle = `rgba(${CREAM},0.4)`;
    ctx.lineWidth = 1;
    ctx.setLineDash([1, 5]);
    ctx.font = '400 10px nt-plex, system-ui, sans-serif';
    ctx.textBaseline = 'bottom';
    ctx.textAlign = 'left';
    const xa = P.xAtLng(39.6) * scale;
    const xb = P.xAtLng(47.8) * scale;
    const ya = P.yAtLat(29.4) * scale;
    const yb = P.yAtLat(23.9) * scale;
    for (let lat = 24; lat <= 29; lat++) {
      const y = P.yAtLat(lat) * scale;
      ctx.beginPath();
      ctx.moveTo(xa, y);
      ctx.lineTo(xb, y);
      ctx.stroke();
      if (!compact) ctx.fillText(`${lat}°${ui.N}`, xa + 4, y - 4);
    }
    for (let lng = 40; lng <= 47; lng++) {
      const x = P.xAtLng(lng) * scale;
      ctx.beginPath();
      ctx.moveTo(x, ya);
      ctx.lineTo(x, yb);
      ctx.stroke();
      if (!compact) ctx.fillText(`${lng}°${ui.E}`, x + 4, yb - 4);
    }
    ctx.setLineDash([]);
  }

  function drawRing() {
    ctx.strokeStyle = `rgba(${CREAM},0.14)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, ringR, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let d = 0; d < 360; d += 3) {
      const a = d * DEG;
      const len = d % 30 === 0 ? 14 : d % 15 === 0 ? 9 : 5;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      ctx.moveTo(ca * ringR, sa * ringR);
      ctx.lineTo(ca * (ringR + len), sa * (ringR + len));
    }
    ctx.strokeStyle = `rgba(${CREAM},0.22)`;
    ctx.stroke();
    // North marker on the ring: shows how far the sky has turned.
    ctx.fillStyle = `rgba(${LAV_LIGHT},0.9)`;
    ctx.beginPath();
    ctx.moveTo(0, -ringR - 18);
    ctx.lineTo(5, -ringR - 28);
    ctx.lineTo(-5, -ringR - 28);
    ctx.closePath();
    ctx.fill();
  }

  function syncDom(c, s, cx, cy) {
    for (let i = 0; i < N; i++) setT(btns[i], `translate(${(S[i][0] - 22).toFixed(1)}px, ${(S[i][1] - 22).toFixed(1)}px)`);
    rls.forEach((el, i) => {
      const p = regionPos[i];
      const x = cx + p.x * scale * c - p.y * scale * s;
      const y = cy + p.x * scale * s + p.y * scale * c;
      setT(el, `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`);
    });
    if (hovered >= 0) {
      const [x, y] = S[hovered];
      setT(tip, `translate(${(x + (rtl ? -20 : 20)).toFixed(1)}px, ${(y - 20).toFixed(1)}px)${rtl ? ' translateX(-100%)' : ''}`);
    }
    // Reticle follows the pointer and snaps onto a star.
    if (pointer.in) {
      const tx = hovered >= 0 ? S[hovered][0] : pointer.x;
      const ty = hovered >= 0 ? S[hovered][1] : pointer.y;
      pointer.rx += (tx - pointer.rx) * 0.3;
      pointer.ry += (ty - pointer.ry) * 0.3;
      setT(ret, `translate(${pointer.rx.toFixed(1)}px, ${pointer.ry.toFixed(1)}px)`);
    }
    root.style.setProperty('--sky-rot', `${(rot / DEG).toFixed(2)}deg`);
    compass.classList.toggle('is-off', Math.abs(rotUser) < 0.01);
  }

  // ---------------------------------------------------------------- loops

  let raf = 0;
  function kick() {
    if (live || raf) return;
    raf = requestAnimationFrame(stepOnce);
  }
  function stepOnce(now) {
    raf = 0;
    readScroll();
    const moving = update(now);
    draw(now);
    if (moving) kick();
  }
  function liveFrame(now) {
    if (!live) return;
    readScroll();
    update(now);
    draw(now);
  }

  layout();
  fS = reduced ? fT : 0;
  if (active < 0) setActive(0);
  visibleLoop(stage, liveFrame);
  window.addEventListener('scroll', () => !live && kick(), { passive: true });
  new ResizeObserver(() => layout()).observe(stage);
  compactMQ.addEventListener('change', layout);
  if (document.fonts) document.fonts.ready.then(() => !live && kick());

  // ---------------------------------------------------------------- interaction

  const local = (e) => {
    const r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  stage.addEventListener('pointermove', (e) => {
    const [mx, my] = local(e);
    if (!pointer.in) {
      pointer.rx = mx;
      pointer.ry = my;
    }
    pointer.x = mx;
    pointer.y = my;
    pointer.in = true;
    stage.classList.add('is-pointer');
    if (drag && drag.canTurn) {
      const a = Math.atan2(my - (baseY + camY), mx - (baseX + camX));
      let da = a - drag.last;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      rotUser += da;
      drag.v = da;
      drag.last = a;
      drag.moved += Math.hypot(mx - drag.px, my - drag.py);
      drag.px = mx;
      drag.py = my;
      if (drag.moved > 6) {
        stage.classList.add('is-grabbing');
        if (!dragHint.classList.contains('is-done')) dragHint.classList.add('is-done');
      }
    } else {
      if (drag) {
        drag.moved += Math.hypot(mx - drag.px, my - drag.py);
        drag.px = mx;
        drag.py = my;
      }
      setHover(pick(mx, my));
    }
    if (!live) kick();
  });
  stage.addEventListener('pointerleave', () => {
    pointer.in = false;
    stage.classList.remove('is-pointer');
    if (!drag) setHover(-1);
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    const [mx, my] = local(e);
    const canTurn = live && e.pointerType !== 'touch';
    drag = { last: Math.atan2(my - (baseY + camY), mx - (baseX + camX)), v: 0, moved: 0, px: mx, py: my, canTurn };
    if (!canTurn) return;
    reset = null;
    rotVel = 0;
    stage.setPointerCapture(e.pointerId);
  });
  const end = () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    stage.classList.remove('is-grabbing');
    if (d.moved < 6) {
      if (hovered >= 0) goTo(hovered, false);
    } else if (d.canTurn) rotVel = clamp(d.v, -0.06, 0.06);
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', () => {
    drag = null;
    stage.classList.remove('is-grabbing');
  });

  btns.forEach((b, i) => {
    b.addEventListener('focus', () => setHover(i));
    b.addEventListener('blur', () => setHover(-1));
    b.addEventListener('click', () => goTo(i, true));
  });

  compass.addEventListener('click', () => {
    let from = rotUser % (Math.PI * 2);
    if (from > Math.PI) from -= Math.PI * 2;
    if (from < -Math.PI) from += Math.PI * 2;
    rotUser = from;
    rotVel = 0;
    reset = { from, t0: performance.now() };
  });

  // Phones: notes reveal as they scroll in (no pinning).
  steps.forEach((s) => reveal(s));
  fineMQ.addEventListener('change', () => stage.classList.toggle('is-fine', fineMQ.matches));
  stage.classList.toggle('is-fine', fineMQ.matches);
}
