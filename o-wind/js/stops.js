// The 16 stops along a dune ridge. Seen from above, a seif dune is a long
// sinuous crest; here it is the route. As you scroll, the wind traces the
// crest (spindrift blowing off its tip) and every stop it reaches is
// uncovered in turn: the photo, then the name, then the story.
import { t, ui, esc, asset, pad2, reduced, isPhone, phoneMQ, inview } from './i18n.js';
import { bury } from './cover.js';
import { wind, onFrame } from './wind.js';
import { spawn, budget } from './particles.js';

const NS = 'http://www.w3.org/2000/svg';

export function initStops(data) {
  const root = document.getElementById('stops');
  const stops = data.stops;
  const total = stops.length;
  const stat = data.intro.stats[1];
  const regionBy = Object.fromEntries(data.regions.map((r) => [r.key, r]));

  let html = '';
  let k = 0;
  let prevRegion = null;
  stops.forEach((s, i) => {
    if (s.region !== prevRegion) {
      const r = regionBy[s.region];
      html += `<div class="rg" id="region-${r.key}">
        <h3 class="rg__name sand-text">${esc(t(r.name))}</h3>
        <p class="rg__count reveal">${esc(t(r.count))}</p>
      </div>`;
      prevRegion = s.region;
      k = 0;
    }
    const side = k % 2 ? 'end' : 'start';
    const first = k === 0;
    k++;
    const drive = s.drive ? `<span class="stop__dt">${esc(t(s.drive))}</span><span class="stop__dl">${esc(ui.fromLast)}</span>` : `<span class="stop__dt">${esc(ui.start)}</span>`;
    html += `<article class="stop stop--${side}${first ? ' stop--first' : ''}" id="stop-${s.key}" aria-labelledby="stop-${s.key}-name" data-i="${i}">
      <figure class="stop__photo">
        <span class="stop__img"><img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="600" height="600"></span>
        ${s.sticker ? `<img class="stop__sticker" src="${asset(s.sticker)}" alt="" loading="lazy" decoding="async">` : ''}
      </figure>
      <div class="stop__text">
        <p class="stop__n"><span class="stop__num" aria-hidden="true">${pad2(s.n)}</span><span class="stop__of">${esc(ui.stopOf(pad2(s.n), total))}</span></p>
        <h4 class="stop__name sand-text" id="stop-${s.key}-name">${esc(t(s.name))}</h4>
        <p class="stop__drive">${driveIcon()}${drive}</p>
        <p class="stop__desc">${esc(t(s.desc))}</p>
      </div>
      <span class="stop__mark" aria-hidden="true"></span>
    </article>`;
  });

  root.innerHTML = `
    <div class="nt-wrap stops__head">
      <h2 class="o-h2 stops__title sand-text" id="stops-title"><span class="stops__big">${esc(stat.value)}</span> <span>${esc(t(stat.label))}</span></h2>
      <ul class="stops__regions reveal">
        ${data.regions
          .map((r) => `<li><a class="chip chip--link" href="#region-${r.key}"><span>${esc(t(r.name))}</span><span class="chip__n">${esc(t(r.count))}</span></a></li>`)
          .join('')}
      </ul>
    </div>
    <div class="nt-wrap">
      <div class="track">
        <svg class="ridge" aria-hidden="true" focusable="false">
          <path class="ridge__lee"/>
          <path class="ridge__ghost"/>
          <path class="ridge__line"/>
          <circle class="ridge__tip" r="5"/>
        </svg>
        ${html}
      </div>
    </div>`;

  const track = root.querySelector('.track');
  const arts = [...root.querySelectorAll('.stop')];
  root.querySelectorAll('.stops__head .sand-text, .rg__name').forEach((el) => bury(el, { kind: 'text', rate: 0.55 }));
  root.querySelectorAll('.reveal').forEach((el) => inview(el));

  // Each stop: the photo and the name are buried; the wind reaching the
  // stop's marker on the ridge starts them.
  const items = arts.map((a) => {
    const fig = a.querySelector('.stop__photo');
    const name = a.querySelector('.stop__name');
    const photo = bury(fig, {
      kind: 'rect',
      manual: true,
      rate: 0.55,
      cell: isPhone() ? 3 : 2,
      onClear: () => a.classList.add('is-photo')
    });
    const nameCv = bury(name, { kind: 'text', manual: true, rate: 0.7 });
    return { a, fig, photo, nameCv, len: 0, reached: false };
  });

  if (reduced) {
    arts.forEach((a) => a.classList.add('is-reached', 'is-photo'));
    requestAnimationFrame(() => layoutRidge(track, items, true));
    window.addEventListener('resize', () => layoutRidge(track, items, true));
    return;
  }

  const reach = (it) => {
    if (it.reached) return;
    it.reached = true;
    it.a.classList.add('is-reached');
    if (it.photo) it.photo.start();
    setTimeout(() => it.nameCv && it.nameCv.start(), 260);
  };

  let geo = null;
  const relayout = () => (geo = layoutRidge(track, items, false));
  relayout();
  let tm;
  window.addEventListener('resize', () => {
    clearTimeout(tm);
    tm = setTimeout(relayout, 150);
  });
  phoneMQ.addEventListener('change', relayout);
  if (document.fonts) document.fonts.ready.then(relayout);
  window.addEventListener('load', relayout);

  const line = track.querySelector('.ridge__line');
  const lee = track.querySelector('.ridge__lee');
  const tip = track.querySelector('.ridge__tip');
  let near = false;
  new IntersectionObserver(([e]) => (near = e.isIntersecting), { rootMargin: '10% 0px' }).observe(track);
  let drawn = -1;

  onFrame(() => {
    if (!near || !geo) return;
    const r = track.getBoundingClientRect();
    const vh = window.innerHeight;
    const y = vh * (isPhone() ? 0.7 : 0.62) - r.top;
    const L = geo.lengthAtY(y);
    if (Math.abs(L - drawn) > 0.5) {
      drawn = L;
      const off = Math.max(0, geo.total - L);
      line.style.strokeDashoffset = off;
      lee.style.strokeDashoffset = off;
      for (const it of items) if (!it.reached && it.len <= L + 2) reach(it);
    }
    // spindrift blowing off the tip of the crest
    if (L > 4 && L < geo.total - 2) {
      const pt = geo.pointAt(L);
      tip.setAttribute('cx', pt.x);
      tip.setAttribute('cy', pt.y);
      tip.style.opacity = 1;
      const n = Math.round((1 + wind.gust * 5) * budget * 2);
      const ox = r.left + window.scrollX + pt.x;
      const oy = r.top + window.scrollY + pt.y;
      for (let i = 0; i < n; i++) {
        spawn(ox + (Math.random() - 0.5) * 6, oy + (Math.random() - 0.5) * 6, wind.dir * (60 + Math.random() * 200), -20 - Math.random() * 60, 1 + ((Math.random() * 3) | 0), 1 + Math.random() * 1.6, 0.8 + Math.random() * 0.7);
      }
    } else tip.style.opacity = 0;
  });
}

// Build the crest through each stop's marker; returns lookups for scroll.
function layoutRidge(track, items, full) {
  const svg = track.querySelector('.ridge');
  const tr = track.getBoundingClientRect();
  const W = track.clientWidth;
  const H = track.scrollHeight;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  const phone = isPhone();
  const rtlDoc = document.documentElement.dir === 'rtl';
  const cs = getComputedStyle(track);
  const ridgeX = parseFloat(cs.getPropertyValue('--ridge-x')) || 0;
  const baseX = phone ? (rtlDoc ? W - ridgeX : ridgeX) : W / 2;

  const pts = [];
  pts.push([baseX, 0]);
  items.forEach((it) => {
    const fr = it.fig.getBoundingClientRect();
    const y = fr.top - tr.top + fr.height / 2;
    const toStart = it.a.classList.contains('stop--start');
    const startIsLeft = !rtlDoc;
    const sway = phone ? 0 : (toStart === startIsLeft ? -1 : 1) * Math.min(56, W * 0.04);
    const x = baseX + sway;
    pts.push([x, y]);
    it.pt = [x, y];
    const mark = it.a.querySelector('.stop__mark');
    const ar = it.a.getBoundingClientRect();
    mark.style.left = `${x - (ar.left - tr.left)}px`;
    mark.style.top = `${y - (ar.top - tr.top)}px`;
    // connector from the ridge to the photo edge
    const edge = toStart === startIsLeft ? fr.right - ar.left : fr.left - ar.left;
    const mx = x - (ar.left - tr.left);
    mark.style.setProperty('--reach', `${Math.abs(edge - mx)}px`);
    mark.dataset.side = edge < mx ? 'l' : 'r';
  });
  pts.push([baseX, H]);

  // Catmull-Rom through the points; between stops the crest swings the other
  // way so it reads as a meandering dune, not a zigzag.
  const all = [];
  for (let i = 0; i < pts.length; i++) {
    all.push(pts[i]);
    if (i < pts.length - 1 && !phone) {
      const a = pts[i];
      const b = pts[i + 1];
      const mx = baseX - (a[0] - baseX) * 0.8 - (b[0] - baseX) * 0.2;
      all.push([mx, (a[1] + b[1]) / 2]);
    }
  }
  let d = `M${all[0][0]} ${all[0][1]}`;
  for (let i = 0; i < all.length - 1; i++) {
    const p0 = all[Math.max(0, i - 1)];
    const p1 = all[i];
    const p2 = all[i + 1];
    const p3 = all[Math.min(all.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  const line = svg.querySelector('.ridge__line');
  const lee = svg.querySelector('.ridge__lee');
  const ghost = svg.querySelector('.ridge__ghost');
  for (const p of [line, lee, ghost]) p.setAttribute('d', d);
  // the lee (shaded) side sits downwind of the crest
  lee.setAttribute('transform', `translate(${(rtlDoc ? -1 : 1) * (phone ? 5 : 9)} 0)`);
  const total = line.getTotalLength();
  for (const p of [line, lee]) {
    p.style.strokeDasharray = `${total} ${total}`;
    p.style.strokeDashoffset = full ? 0 : total;
  }

  // sample length <-> y
  const S = Math.max(200, Math.round(total / 6));
  const ys = new Float32Array(S + 1);
  const xs = new Float32Array(S + 1);
  for (let i = 0; i <= S; i++) {
    const p = line.getPointAtLength((i / S) * total);
    xs[i] = p.x;
    ys[i] = p.y;
  }
  const lengthAtY = (y) => {
    if (y <= ys[0]) return 0;
    if (y >= ys[S]) return total;
    let lo = 0;
    let hi = S;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (ys[m] < y) lo = m;
      else hi = m;
    }
    const f = (y - ys[lo]) / Math.max(0.001, ys[hi] - ys[lo]);
    return ((lo + f) / S) * total;
  };
  const pointAt = (L) => {
    const f = (L / total) * S;
    const i = Math.min(S - 1, Math.floor(f));
    const k = f - i;
    return { x: xs[i] + (xs[i + 1] - xs[i]) * k, y: ys[i] + (ys[i + 1] - ys[i]) * k };
  };
  items.forEach((it) => (it.len = lengthAtY(it.pt[1])));
  return { total, lengthAtY, pointAt };
}

function driveIcon() {
  // a wind streak: three lines of different length, pointing downwind
  return '<svg class="stop__ico" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M2 6h11M2 10h15M2 14h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
}
