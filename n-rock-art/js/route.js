// The route: 16 carved panels, each with its photo set into the rock, joined
// by an engraved groove that carves itself as you scroll. A chisel spark rides
// the tip of the groove and knocks chips off the stone.
import { t, esc, asset, ui, pad2, reduced, rtl, chiselWords } from './i18n.js';
import { carveHTML } from './carve.js';

const NS = 'http://www.w3.org/2000/svg';
const ART = ['motif:camel', 'motif:ibex', 'motif:rider', 'motif:palm', 'motif:figure', 'img:../assets/img/icon-3.png'];
const ART_AR = { camel: 200 / 150, ibex: 200 / 150, rider: 200 / 176, palm: 180 / 200, figure: 140 / 180, 'icon-3.png': 640 / 358 };

const carIcon =
  '<svg viewBox="0 0 24 24" aria-hidden="true" class="stop__ico"><path d="M3 15h18M5 15l2-6h10l2 6v4h-3v-2H8v2H5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="miter"/></svg>';

function artFor(i, seed, cls) {
  const src = ART[i % ART.length];
  const key = src.split(/[:/]/).pop();
  return carveHTML(src, { cls, ar: ART_AR[key], seed, spacing: key.endsWith('.png') ? 4 : 4.4, edge: 80, flip: i % 2 === 1 });
}

export function initRoute(data) {
  const root = document.getElementById('stops');
  const total = data.stops.length;

  const stop = (s, i, j) => `
    <li class="stop" style="--j:${j};--row:${j + 1}" data-side="${j % 2 ? 'end' : 'start'}">
      <article class="stop__card" aria-labelledby="stop-${s.key}" data-rise>
        <div class="stop__photo">
          <img src="${asset(s.photo)}" alt="" loading="lazy" decoding="async" width="600" height="600">
          <i class="stop__bevel" aria-hidden="true"></i>
        </div>
        ${s.sticker ? `<img class="stop__sticker" src="${asset(s.sticker)}" alt="" loading="lazy" decoding="async">` : ''}
        <div class="stop__body">
          <div class="stop__top">
            ${carveHTML(`text:${pad2(s.n)}`, { cls: 'stop__num', ar: 1.5, seed: 100 + i, spacing: 2.8, density: 0.92, floor: 0.5, pad: 2, scale: 0.92 })}
            <div class="stop__titles">
              <p class="stop__of">${esc(ui.stopOf(pad2(s.n), total))}</p>
              <h3 class="stop__name" id="stop-${s.key}">${esc(t(s.name))}</h3>
            </div>
          </div>
          <p class="stop__drive">${carIcon}<span>${s.drive ? `${esc(t(s.drive))} <span class="stop__from">${esc(ui.drive)}</span>` : esc(ui.start)}</span></p>
          <p class="stop__desc">${esc(t(s.desc))}</p>
        </div>
      </article>
    </li>`;

  let n = 0;
  const regions = data.regions
    .map((r, ri) => {
      const list = data.stops.filter((s) => s.region === r.key);
      const html = `
      <div class="region" id="region-${r.key}" style="--rows:${list.length + 1}">
        <header class="region__head">
          <p class="region__count" data-rise>${esc(t(r.count))}</p>
          <h3 class="region__name" data-chisel>${esc(t(r.name))}</h3>
        </header>
        <ol class="region__stops" start="${n + 1}">
          ${list.map((s, j) => stop(s, n++, j)).join('')}
          <li class="route-art route-art--a" aria-hidden="true">${artFor(ri * 2, 60 + ri * 2, 'route-art__c')}</li>
          <li class="route-art route-art--b" aria-hidden="true" style="--last:${list.length + 1}">${artFor(ri * 2 + 1, 61 + ri * 2, 'route-art__c')}</li>
        </ol>
      </div>`;
      return html;
    })
    .join('');

  root.innerHTML = `
    <div class="nt-wrap">
      <header class="route__head">
        <p class="eyebrow" data-rise>${esc(ui.route)}</p>
        <h2 class="h2" id="route-title" data-chisel>${esc(t(data.hero.cta))}</h2>
        <p class="lede" data-words>${chiselWords(ui.routeSub)}</p>
        <nav class="route__regions" aria-label="${esc(ui.region)}">
          ${data.regions.map((r) => `<a class="chip" href="#region-${r.key}"><span>${esc(t(r.name))}</span><span class="chip__n">${esc(t(r.count))}</span></a>`).join('')}
        </nav>
      </header>
      <div class="route__body">
        <svg class="groove" aria-hidden="true" focusable="false"></svg>
        <i class="groove__tip" aria-hidden="true"></i>
        ${regions}
        <p class="route__end" data-rise>${esc(ui.end)}</p>
      </div>
    </div>`;

  equalize(root);
  const groove = buildGroove(root);
  return { equalize: () => equalize(root), groove };
}

// Identical panels: every panel gets the height of the tallest (the longest
// description); spare room collects under the text.
function equalize(root) {
  const cards = [...root.querySelectorAll('.stop__card')];
  cards.forEach((c) => (c.style.minHeight = ''));
  const h = Math.ceil(Math.max(...cards.map((c) => c.getBoundingClientRect().height)));
  cards.forEach((c) => (c.style.minHeight = `${h}px`));
}

function buildGroove(root) {
  const body = root.querySelector('.route__body');
  const svg = body.querySelector('.groove');
  const tip = body.querySelector('.groove__tip');
  let total = 0;
  let samples = [];
  let nodes = [];
  let spurs = [];
  let nodeEls = [];
  let lastLen = -1;
  let maskPath;
  let lastChip = 0;
  let lastY = 0;

  function build() {
    const br = body.getBoundingClientRect();
    const W = body.clientWidth;
    const H = body.scrollHeight;
    const desk = innerWidth >= 1024;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    const laneX = desk ? W / 2 : rtl ? W - 20 : 20;
    const cards = [...body.querySelectorAll('.stop__card')];
    const pts = [[laneX, 0]];
    nodes = [];
    spurs = [];
    cards.forEach((c, i) => {
      const ph = c.querySelector('.stop__photo').getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      const y = ph.top - br.top + ph.height * 0.5;
      const swing = desk ? (c.closest('.stop').dataset.side === 'start' ? -1 : 1) * (rtl ? -1 : 1) * 26 : 0;
      pts.push([laneX + swing, y]);
      nodes.push([laneX + swing, y]);
      // spur from the groove to the panel edge
      const edge = cr.left - br.left < laneX ? cr.right - br.left : cr.left - br.left;
      spurs.push([laneX + swing, y, edge]);
    });
    const endEl = body.querySelector('.route__end');
    pts.push([laneX, endEl.offsetTop - 12]);
    // smooth path (Catmull-Rom to cubic) with a gentle meander between nodes
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    const spurD = spurs.map(([x, y, e]) => `M${x},${y} L${e},${y}`).join(' ');
    svg.innerHTML = `
      <defs>
        <mask id="groove-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">
          <path class="groove__reveal" d="${d}" fill="none" stroke="#fff" stroke-width="40"/>
        </mask>
      </defs>
      <path class="groove__guide" d="${d}"/>
      <path class="groove__spur-guide" d="${spurD}"/>
      <g mask="url(#groove-mask)">
        <path class="groove__shade" d="${d}"/>
        <path class="groove__cut" d="${d}"/>
      </g>
      ${spurs.map(([x, y, e], i) => `<path class="groove__spur" data-i="${i}" d="M${x},${y} L${e},${y}"/>`).join('')}`;
    const path = svg.querySelector('.groove__guide');
    maskPath = svg.querySelector('.groove__reveal');
    total = path.getTotalLength();
    samples = [];
    const step = 24;
    for (let l = 0; l <= total; l += step) samples.push([l, path.getPointAtLength(l)]);
    samples.push([total, path.getPointAtLength(total)]);
    maskPath.style.strokeDasharray = `${total} ${total + 10}`;
    // nodes
    body.querySelectorAll('.groove__node').forEach((x) => x.remove());
    nodeEls = nodes.map(([x, y], i) => {
      const n = document.createElement('i');
      n.className = 'groove__node';
      n.setAttribute('aria-hidden', 'true');
      n.style.transform = `translate(${x}px, ${y}px)`;
      body.appendChild(n);
      return n;
    });
    spurs = [...svg.querySelectorAll('.groove__spur')];
    lastLen = -1;
    update(true);
  }

  // binary search for the length at which the path reaches page-y
  function lenAtY(y) {
    let lo = 0;
    let hi = samples.length - 1;
    if (y <= samples[0][1].y) return 0;
    if (y >= samples[hi][1].y) return total;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid][1].y < y) lo = mid;
      else hi = mid;
    }
    const a = samples[lo];
    const b = samples[hi];
    const f = (y - a[1].y) / Math.max(0.001, b[1].y - a[1].y);
    return a[0] + (b[0] - a[0]) * f;
  }

  function chip(x, y) {
    const c = document.createElement('i');
    c.className = 'chip-fx';
    c.setAttribute('aria-hidden', 'true');
    c.style.left = `${x}px`;
    c.style.top = `${y}px`;
    body.appendChild(c);
    const dx = (Math.random() - 0.5) * 70;
    const dy = -10 - Math.random() * 30;
    c.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.6}px, ${dy}px) scale(.9)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${dy + 60}px) scale(.6)`, opacity: 0 }
      ],
      { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)' }
    ).onfinish = () => c.remove();
  }

  function update(force) {
    if (!samples.length) return;
    const br = body.getBoundingClientRect();
    const y = (reduced ? Infinity : innerHeight * 0.62) - br.top;
    const len = reduced ? total : lenAtY(y);
    if (!force && Math.abs(len - lastLen) < 0.5) return;
    const forward = len > lastLen;
    lastLen = len;
    maskPath.style.strokeDashoffset = String(total - len);
    const p = samples.length ? pointAt(len) : { x: 0, y: 0 };
    tip.style.transform = `translate(${p.x}px, ${p.y}px)`;
    tip.classList.toggle('is-on', len > 2 && len < total - 2);
    nodes.forEach((nd, i) => {
      const on = y >= nd[1] - 2;
      if (nodeEls[i].classList.contains('is-reached') !== on) {
        nodeEls[i].classList.toggle('is-reached', on);
        spurs[i] && spurs[i].classList.toggle('is-reached', on);
      }
    });
    const now = performance.now();
    if (!reduced && forward && !force && now - lastChip > 70 && len < total - 2) {
      lastChip = now;
      chip(p.x, p.y);
      if (Math.abs(p.y - lastY) > 40) chip(p.x, p.y);
      lastY = p.y;
    }
  }

  function pointAt(len) {
    // interpolate from samples (no getPointAtLength per frame)
    const i = Math.min(samples.length - 2, Math.floor(len / 24));
    const a = samples[i];
    const b = samples[i + 1];
    const f = (len - a[0]) / Math.max(0.001, b[0] - a[0]);
    return { x: a[1].x + (b[1].x - a[1].x) * f, y: a[1].y + (b[1].y - a[1].y) * f };
  }

  let raf = 0;
  addEventListener(
    'scroll',
    () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    },
    { passive: true }
  );
  let rt;
  let lastW = innerWidth;
  const ro = new ResizeObserver(() => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (innerWidth !== lastW) {
        lastW = innerWidth;
        equalize(root);
      }
      build();
    }, 150);
  });
  ro.observe(body);
  build();
  return { build };
}
