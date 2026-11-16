// Intro: the question and answer, then the four stats as instrument readouts on
// the chart. Each readout draws its own small trace from the real data.
import { t, esc, ui, pad2 } from './i18n.js';
import { reveal, splitWords, countUp, starGlyph } from './util.js';
import { makeProjection } from './sky.js';

function visKm() {
  let ticks = '';
  for (let i = 0; i <= 12; i++) {
    const x = 4 + i * 19.33;
    const tall = i % 6 === 0;
    ticks += `<line x1="${x.toFixed(1)}" y1="${tall ? 26 : 32}" x2="${x.toFixed(1)}" y2="40"/>`;
  }
  return `<svg class="ro-vis ro-vis--km" viewBox="0 0 240 56" aria-hidden="true" focusable="false">
    <g class="ro-faint">${ticks}<line x1="4" y1="40" x2="236" y2="40"/></g>
    <line class="ro-fill" x1="4" y1="40" x2="236" y2="40"/>
    <g class="ro-mark"><path d="M4 22 l-4 -7 h8 z"/></g>
  </svg>`;
}

function visStops(n) {
  let dots = '';
  for (let i = 0; i < n; i++) {
    const x = 6 + (i * 228) / (n - 1);
    dots += `<circle cx="${x.toFixed(1)}" cy="34" r="${i === 0 || i === n - 1 ? 4 : 2.8}" style="--i:${i}"/>`;
  }
  return `<svg class="ro-vis ro-vis--dots" viewBox="0 0 240 56" aria-hidden="true" focusable="false">
    <line class="ro-faint" x1="6" y1="34" x2="234" y2="34"/>
    <line class="ro-fill" x1="6" y1="34" x2="234" y2="34"/>${dots}</svg>`;
}

// The route laid along its own axis (Riyadh to Jubbah reads start to end),
// stars coloured by region and lighting up region by region.
function visRegions(data) {
  const P = makeProjection(data.stops);
  const raw = data.stops.map((s) => P.project(s.lat, s.lng));
  const a = raw[0];
  const b = raw[raw.length - 1];
  const ang = -Math.atan2(b.y - a.y, b.x - a.x);
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const rot = raw.map((p) => [(p.x - a.x) * c - (p.y - a.y) * s, (p.x - a.x) * s + (p.y - a.y) * c]);
  const xs = rot.map((p) => p[0]);
  const ys = rot.map((p) => p[1]);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const sc = Math.min(228 / (Math.max(...xs) - Math.min(...xs)), 40 / (maxY - minY));
  const pts = rot.map((p) => [6 + (p[0] - Math.min(...xs)) * sc, 30 + (p[1] - (minY + maxY) / 2) * sc]);
  const order = data.regions.map((r) => r.key);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const dots = data.stops
    .map((st, i) => `<circle class="rg--${st.region}" cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="2.8" style="--i:${order.indexOf(st.region)}"/>`)
    .join('');
  return `<svg class="ro-vis ro-vis--reg" viewBox="0 0 240 56" aria-hidden="true" focusable="false">
    <path class="ro-faint" d="${d}" fill="none"/>${dots}</svg>`;
}

function visLegs(data) {
  const legs = data.stops.slice(1).map((s) => s.driveMinutes);
  const total = legs.reduce((a, b) => a + b, 0);
  const gap = 3;
  const avail = 232 - gap * (legs.length - 1);
  let x = 4;
  const rects = legs
    .map((m, i) => {
      const w = (m / total) * avail;
      const r = `<rect x="${x.toFixed(2)}" y="30" width="${w.toFixed(2)}" height="8" style="--i:${i}"${i % 2 ? ' class="is-alt"' : ''}/>`;
      x += w + gap;
      return r;
    })
    .join('');
  return `<svg class="ro-vis ro-vis--legs" viewBox="0 0 240 56" aria-hidden="true" focusable="false">
    <line class="ro-faint" x1="4" y1="46" x2="236" y2="46"/>${rects}</svg>`;
}

export function initIntro(data) {
  const root = document.getElementById('intro');
  const I = data.intro;
  const vis = [visKm(), visStops(data.stops.length), visRegions(data), visLegs(data)];

  root.innerHTML = `
    <div class="nt-wrap">
      <div class="intro__head">
        <h2 class="m-h2 m-split" id="intro-title">${esc(t(I.title))}</h2>
        <p class="intro__body" data-r>${esc(t(I.body))}</p>
      </div>
      <div class="intro__ro">
        <p class="m-eyebrow" data-r>${starGlyph()}<span>${ui.readouts}</span></p>
        <ol class="ro-list">
          ${I.stats
            .map(
              (s, i) => `<li class="ro" style="--k:${i}">
                <span class="ro__corners" aria-hidden="true"></span>
                <span class="ro__idx" aria-hidden="true">${pad2(i + 1)}</span>
                ${vis[i] || ''}
                <p class="ro__val"><span class="ro__num" data-final="${esc(s.value)}">${esc(s.value)}</span>${s.unit ? `<span class="ro__unit">${esc(t(s.unit))}</span>` : ''}</p>
                <p class="ro__label">${esc(t(s.label))}</p>
              </li>`
            )
            .join('')}
        </ol>
      </div>
    </div>`;

  const h2 = root.querySelector('h2');
  splitWords(h2);
  reveal(h2);
  root.querySelectorAll('[data-r]').forEach((el) => reveal(el));
  const list = root.querySelector('.ro-list');
  reveal(list, () => {
    list.querySelectorAll('.ro__num').forEach((el, i) => setTimeout(() => countUp(el, el.dataset.final, 1700), i * 120));
  });
}
