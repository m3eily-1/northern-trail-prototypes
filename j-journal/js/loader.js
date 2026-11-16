// Loading moment: one continuous pen stroke draws the real route (projected
// from the 16 stop coordinates) and then the logo's frame. The logo inks in,
// and the sheet swings open like a journal cover. Time-based (CSS animations
// + setTimeout guard), once per session, skippable.
import { ui, asset, rtl } from './i18n.js';
import { makePen } from './sketches.js';

const KEY = 'nt-j-journal-pen';
const DRAW = 1.9; // seconds for the stroke
const OPEN_AT = 2.75; // seconds when the cover starts opening
const DONE_AT = 3.6; // hard guard

export function initLoader(data, onDone) {
  const root = document.getElementById('loader');
  const html = document.documentElement;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    html.classList.remove('has-loader');
    html.classList.add('is-ready');
    root.remove();
    try {
      sessionStorage.setItem(KEY, '1');
    } catch (e) {}
    onDone && onDone();
  };

  if (!html.classList.contains('has-loader')) {
    root.remove();
    onDone && onDone();
    return;
  }

  // Logo frame (centre line of the stroke in the 296 x 165 logo), placed at (52, 24).
  const ox = 52;
  const oy = 24;
  const L = ox + 9.95;
  const T = oy + 24.9;
  const R = ox + 286.2;
  const B = oy + 150.2;
  const r = 21.6;

  // Route: project stop lat/lng into the lower part of the sheet.
  const stops = data.stops;
  const lngs = stops.map((s) => s.lng);
  const lats = stops.map((s) => s.lat);
  const [x0, x1] = [Math.min(...lngs), Math.max(...lngs)];
  const [y0, y1] = [Math.min(...lats), Math.max(...lats)];
  const pts = stops.map((s) => [70 + ((s.lng - x0) / (x1 - x0)) * 290, 392 - ((s.lat - y0) / (y1 - y0)) * 150]);

  const pen = makePen(16, 0.4);
  const route = pen.curve([...pts, [44, 226], [L, B - r - 6]]);
  const frame = [
    `L${L} ${T + r}`,
    `Q${L} ${T} ${L + r} ${T}`,
    `L${R - r} ${T}`,
    `Q${R} ${T} ${R} ${T + r}`,
    `L${R} ${B - r}`,
    `Q${R} ${B} ${R - r} ${B}`,
    `L${L + r} ${B}`,
    `Q${L} ${B} ${L} ${B - r}`,
    `L${L} ${B - r - 30}`
  ].join(' ');
  const d = `${route} ${frame}`;

  // Timing for the stop dots: share of the path length reached at each stop.
  const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  probe.setAttribute('d', d);
  const total = probe.getTotalLength ? probe.getTotalLength() : 1000;
  let acc = 0;
  const dots = pts
    .map((p, i) => {
      if (i > 0) acc += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) * 1.06;
      const delay = 0.25 + (acc / total) * DRAW;
      return `<circle class="loader__dot" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === 0 || i === pts.length - 1 ? 5 : 3}" style="animation-delay:${delay.toFixed(2)}s"/>`;
    })
    .join('');

  const first = stops[0].name;
  const last = stops[stops.length - 1].name;
  const lbl = (s) => s[document.documentElement.lang] || s.en;

  root.innerHTML = `
    <div class="loader__sheet">
      <svg class="loader__art" viewBox="0 0 400 420" focusable="false">
        <path class="loader__ink" d="${d}" pathLength="1"/>
        ${dots}
        <text class="loader__city loader__city--start" x="${pts[0][0] - 8}" y="${pts[0][1] + 24}" text-anchor="end">${lbl(first)}</text>
        <text class="loader__city loader__city--end" x="${pts[pts.length - 1][0] + 10}" y="${pts[pts.length - 1][1] - 10}" text-anchor="start">${lbl(last)}</text>
        <image class="loader__logo" href="${asset(data.logo.dark)}" x="${ox}" y="${oy}" width="296" height="165"/>
      </svg>
      <p class="loader__skip">${ui.skip}</p>
    </div>`;

  // RTL: the cover is bound on the right.
  root.classList.toggle('is-rtl', rtl);

  const open = () => root.classList.add('is-open');
  const t1 = setTimeout(open, OPEN_AT * 1000);
  const t2 = setTimeout(finish, DONE_AT * 1000);

  const skip = () => {
    clearTimeout(t1);
    clearTimeout(t2);
    root.classList.add('is-skip');
    setTimeout(finish, 380);
  };
  root.addEventListener('pointerdown', skip, { once: true });
  window.addEventListener('keydown', skip, { once: true });
}
