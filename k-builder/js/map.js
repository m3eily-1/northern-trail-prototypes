// Mini route map: equirectangular projection of the 16 stops (north up, real
// geography, never mirrored). The full trail is a faint dashed line; chosen stops
// light up and each day's route is drawn in its own brand colour.
import { t, isReduced } from './util.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
};

export function createMap(box, data, colors) {
  const stops = data.stops;
  const W = 760;
  const H = 300;
  const pad = 28;
  const lngs = stops.map((p) => p.lng);
  const lats = stops.map((p) => p.lat);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const kx = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const geoW = (maxLng - minLng) * kx;
  const geoH = maxLat - minLat;
  const scale = Math.min((W - pad * 2) / geoW, (H - pad * 2) / geoH);
  const ox = (W - geoW * scale) / 2;
  const oy = (H - geoH * scale) / 2;
  const P = {};
  stops.forEach((p) => {
    P[p.n] = [ox + (p.lng - minLng) * kx * scale, oy + (maxLat - p.lat) * scale];
  });

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'k-map', role: 'img', preserveAspectRatio: 'xMidYMid meet' });
  const title = s('title');
  svg.append(title);

  // graticule: every half degree, fills the whole panel so it never looks empty
  const grid = s('g', { class: 'k-map__grid' });
  for (let lng = Math.floor(minLng - 6); lng <= maxLng + 6; lng += 0.5) {
    const x = ox + (lng - minLng) * kx * scale;
    if (x < 0 || x > W) continue;
    grid.append(s('line', { x1: x, y1: 0, x2: x, y2: H }));
  }
  for (let lat = Math.floor(minLat - 3); lat <= maxLat + 3; lat += 0.5) {
    const y = oy + (maxLat - lat) * scale;
    if (y < 0 || y > H) continue;
    grid.append(s('line', { x1: 0, y1: y, x2: W, y2: y }));
  }
  svg.append(grid);

  // region labels at the centroid of their stops
  const regions = s('g', { class: 'k-map__regions' });
  data.regions.forEach((r) => {
    const rs = stops.filter((p) => p.region === r.key);
    const cx = rs.reduce((a, p) => a + P[p.n][0], 0) / rs.length;
    const cy = rs.reduce((a, p) => a + P[p.n][1], 0) / rs.length;
    const off = { riyadh: [36, -8, 'start'], qassim: [-64, -12, 'end'], hail: [-40, 34, 'end'] }[r.key] || [0, 0, 'middle'];
    const label = s('text', { x: cx + off[0], y: cy + off[1], 'text-anchor': off[2] });
    label.textContent = t(r.name);
    regions.append(label);
  });
  svg.append(regions);

  const base = s('polyline', { class: 'k-map__base', points: stops.map((p) => P[p.n].join(',')).join(' ') });
  svg.append(base);
  const routes = s('g', { class: 'k-map__routes' });
  svg.append(routes);
  const dots = s('g', { class: 'k-map__dots' });
  const dotEls = {};
  stops.forEach((p) => {
    const g = s('g', { class: 'k-map__stop', transform: `translate(${P[p.n][0].toFixed(1)} ${P[p.n][1].toFixed(1)})` });
    const tt = s('title');
    tt.textContent = t(p.name);
    g.append(tt, s('circle', { class: 'k-map__halo', r: 9 }), s('circle', { class: 'k-map__dot', r: 3.5 }));
    dots.append(g);
    dotEls[p.n] = g;
  });
  svg.append(dots);

  // start / finish labels
  const ends = s('g', { class: 'k-map__ends' });
  const first = stops[0], last = stops[stops.length - 1];
  [[first, 14, 22, 'start'], [last, 14, -14, 'end']].forEach(([p, dx, dy, anchor]) => {
    const tx = s('text', { x: P[p.n][0] + (anchor === 'start' ? -dx : dx), y: P[p.n][1] + dy, 'text-anchor': anchor === 'start' ? 'end' : 'start' });
    tx.textContent = t(p.name);
    ends.append(tx);
  });
  svg.append(ends);
  box.append(svg);

  let prevKeys = [];
  function update(days) {
    const chosen = new Set(days.flat());
    stops.forEach((p) => {
      const di = days.findIndex((d) => d.includes(p.n));
      const g = dotEls[p.n];
      g.classList.toggle('is-on', di >= 0);
      g.style.setProperty('--dc', di >= 0 ? colors[di] : '');
    });
    title.textContent = `${chosen.size} / 16`;

    // one path per day, starting from the previous day's last stop (or Riyadh)
    let prev = 1;
    const keys = [];
    const paths = days.map((d, i) => {
      const seq = d.length ? [prev, ...d] : [];
      if (d.length) prev = d[d.length - 1];
      keys.push(`${i}:${seq.join('-')}`);
      return seq;
    });
    const rebuild = keys.some((k, i) => k !== prevKeys[i]) || keys.length !== prevKeys.length;
    if (!rebuild) return;
    const reduced = isReduced();
    const old = [...routes.children];
    routes.replaceChildren();
    paths.forEach((seq, i) => {
      if (seq.length < 2) return;
      const pts = seq.map((n) => P[n].map((v) => v.toFixed(1)).join(','));
      const path = s('polyline', { points: pts.join(' '), class: 'k-map__route', stroke: colors[i], pathLength: 1 });
      routes.append(path);
      const changed = keys[i] !== prevKeys[i];
      const was = old.find((o) => o.dataset.key === keys[i]);
      path.dataset.key = keys[i];
      if (changed && !was && !reduced) {
        path.style.strokeDasharray = '1';
        path.style.strokeDashoffset = '1';
        path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 700, easing: 'cubic-bezier(.3,.7,.2,1)', fill: 'forwards', delay: 60 * i });
        setTimeout(() => { path.style.strokeDashoffset = '0'; }, 900 + 60 * i);
      }
    });
    prevKeys = keys;
  }

  return { update };
}
