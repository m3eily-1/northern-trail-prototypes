// The signature: a two-page field journal. Each region opens with a page turn
// (3D leaf scrubbed by scroll); each stop is a spread entry with a sketch that
// draws itself, a margin note with the drive time, a sticker, and the photo
// hidden under a scratch-off panel.
import { t, ui, esc, asset, pad2, rtl, reduced } from './i18n.js';
import { stopSketch, regionSketch, doodle, marginArrow, makePen, renderPaths } from './sketches.js';
import { pinned, through, inview, ease, range } from './scroll.js';
import { initScratch } from './scratch.js';

const WIDE = new Set(['al-qasab', 'al-ghat']);

function stickerFor(stop, data) {
  if (stop.sticker) return stop.sticker;
  if (stop.n === 1) return data.logo.stickerPng;
  return null;
}

function tallyDone(n, seed) {
  const p = makePen(seed, 0.6);
  const list = [];
  let x = 6;
  let left = n;
  while (left > 0) {
    const k = Math.min(5, left);
    const gx = x;
    for (let i = 0; i < Math.min(4, k); i++) {
      list.push(p.line([[x, 6], [x + (p.r() - 0.5) * 3, 40]]));
      x += 10;
    }
    if (k === 5) list.push(p.line([[gx - 5, 36], [x - 5, 10]]));
    x += 8;
    left -= k;
  }
  const w = Math.ceil(x);
  return renderPaths(list, { viewBox: `0 0 ${w} 46`, cls: 'mark mark--tally' }).replace('<svg ', `<svg style="width:${w}px" `);
}

function entry(stop, total, data, idx) {
  const name = t(stop.name);
  const n = pad2(stop.n);
  const photoEnd = idx % 2 === 0;
  const textOuterStart = photoEnd; // text page sits on the inline-start page
  const flipArrow = textOuterStart ? rtl : !rtl;
  const sticker = stickerFor(stop, data);
  const wide = WIDE.has(stop.key);
  const rot = [-2.2, 1.6, -1.2, 2.4][idx % 4];
  const sRot = [7, -8, 5, -6][idx % 4];
  const note = stop.drive
    ? `<span class="mnote__time">${esc(t(stop.drive))}</span><span class="mnote__lbl">${esc(ui.fromLast)}</span>`
    : `<span class="mnote__time">${esc(ui.start)}</span>`;
  const doodles = ['star', 'loop', 'cross', 'loop'];
  const d1 = doodles[idx % 4];
  const d2 = doodles[(idx + 2) % 4];

  return `
  <article class="entry ${photoEnd ? 'entry--photo-end' : 'entry--photo-start'}" id="stop-${stop.key}" aria-labelledby="stop-${stop.key}-name">
    <div class="entry__text">
      <p class="entry__meta">${esc(ui.stopOf(n, total))}</p>
      <div class="entry__sketch">${stopSketch(stop.key)}</div>
      <div class="entry__head">
        <h3 class="entry__name" id="stop-${stop.key}-name">${esc(name)}</h3>
        <p class="mnote ${flipArrow ? 'mnote--flip' : ''}">${marginArrow(stop.n * 7)}${note}</p>
      </div>
      <p class="entry__desc">${esc(t(stop.desc))}</p>
    </div>
    <div class="entry__photo">
      <div class="print-wrap ${wide ? 'print-wrap--wide' : ''}">
        <figure class="print" style="--rot:${rot}deg">
          <span class="tape tape--a" aria-hidden="true"></span>
          <span class="tape tape--b" aria-hidden="true"></span>
          <div class="scratch">
            <img src="${asset(stop.photo)}" alt="${esc(name)}" loading="lazy" decoding="async" width="${wide ? 1000 : 600}" height="${wide ? 562 : 600}">
            <canvas aria-hidden="true"></canvas>
          </div>
          <figcaption class="print__cap">
            <button class="print__reveal" type="button" aria-label="${esc(ui.revealLabel(name))}">${esc(ui.reveal)}</button>
            <span>${esc(ui.printNo(n))}</span>
          </figcaption>
        </figure>
        ${
          sticker
            ? `<div class="sticker" style="--sr:${sRot}deg" aria-hidden="true"><img src="${asset(sticker)}" alt="" loading="lazy"><i class="sticker__flap"></i></div>`
            : ''
        }
        <span class="dood dood--a" aria-hidden="true">${doodle(d1, stop.n * 3)}</span>
        <span class="dood dood--b" aria-hidden="true">${doodle(d2, stop.n * 5)}</span>
      </div>
    </div>
  </article>`;
}

function turn(region, ri, regions, stops, data) {
  const list = stops.filter((s) => s.region === region.key);
  const part = ui.part(ri + 1, regions.length);
  const toc = list
    .map(
      (s) => `<li><a href="#stop-${s.key}"><span class="toc__n">${pad2(s.n)}</span><span class="toc__name">${esc(t(s.name))}</span><span class="toc__dots" aria-hidden="true"></span><span class="toc__drive">${s.drive ? esc(t(s.drive)) : ''}</span></a></li>`
    )
    .join('');

  let startPage;
  if (ri === 0) {
    startPage = `
      <p class="nt-eyebrow">${esc(ui.contents)}</p>
      <ol class="parts">${regions
        .map((r, i) => `<li><span class="parts__n">${pad2(i + 1)}</span><span class="parts__name">${esc(t(r.name))}</span><span class="parts__count">${esc(t(r.count))}</span></li>`)
        .join('')}</ol>
      <span class="dood dood--c" aria-hidden="true">${doodle('star', 91)}</span>`;
  } else {
    const prev = regions[ri - 1];
    const count = stops.filter((s) => s.region === prev.key).length;
    startPage = `
      <p class="nt-eyebrow">${esc(ui.part(ri, regions.length))}</p>
      <p class="prev__name">${esc(t(prev.name))}</p>
      <div class="prev__tally">${tallyDone(count, 40 + ri)}</div>
      <p class="prev__count">${esc(t(prev.count))}</p>`;
  }

  const sticker = region.key === 'hail' ? data.stickers.salma : null;

  return `
  <section class="turn" data-region="${region.key}" aria-labelledby="region-${region.key}">
    <div class="turn__stage">
      <div class="spread turn__spread">
        <div class="page page--start turn__under-start">${startPage}</div>
        <div class="page page--end turn__under-end">
          <div class="turn__head">
            <p class="nt-eyebrow">${esc(part)}</p>
            <h3 class="turn__title" id="region-${region.key}">${esc(t(region.name))}</h3>
            <p class="turn__count">${esc(t(region.count))}</p>
          </div>
          <p class="nt-eyebrow toc__label">${esc(ui.contents)}</p>
          <ol class="toc">${toc}</ol>
        </div>
        <div class="leaf" aria-hidden="true">
          <div class="leaf__face leaf__front paper">
            <p class="nt-eyebrow">${esc(part)}</p>
            <div class="leaf__art">${regionSketch(region.key)}</div>
            <p class="leaf__name">${esc(t(region.name))}</p>
            <p class="leaf__turn">${esc(ui.turn)} ${marginArrow(ri * 13 + 5)}</p>
            <i class="leaf__shade"></i>
          </div>
          <div class="leaf__face leaf__back paper">
            <p class="nt-eyebrow">${esc(part)}</p>
            <p class="leaf__big">${esc(t(region.name))}</p>
            <p class="leaf__count">${esc(t(region.count))}</p>
            ${sticker ? `<img class="leaf__sticker" src="${asset(sticker)}" alt="" loading="lazy">` : ''}
            <i class="leaf__shade"></i>
          </div>
        </div>
        <i class="turn__cast" aria-hidden="true"></i>
      </div>
    </div>
  </section>
  <div class="book spread" data-region="${region.key}">
    ${list.map((s) => entry(s, stops.length, data, s.n - 1)).join('')}
  </div>`;
}

export function initJournal(data) {
  const root = document.getElementById('stops');
  const stats = data.intro.stats;
  const label = t(stats[1].label);
  const title = document.documentElement.lang === 'ar' ? `${stats[1].value} ${label}` : `${stats[1].value} ${label.charAt(0).toLowerCase()}${label.slice(1)}`;

  root.innerHTML = `
    <header class="journal__head nt-wrap">
      <h2 class="nt-h2" id="journal-title">${esc(title)}</h2>
      <p class="journal__hint">${doodle('star', 3)}<span>${esc(ui.hint)}</span></p>
    </header>
    ${data.regions.map((r, i) => turn(r, i, data.regions, data.stops, data)).join('')}`;

  // Page turns
  if (!reduced) {
    root.querySelectorAll('.turn').forEach((sec) => {
      const stage = sec.querySelector('.turn__stage');
      const leaf = sec.querySelector('.leaf');
      const front = sec.querySelector('.leaf__front .leaf__shade');
      const back = sec.querySelector('.leaf__back .leaf__shade');
      const cast = sec.querySelector('.turn__cast');
      const art = sec.querySelector('.leaf__art .sketch');
      let lastA = -1;
      pinned(sec, stage, (p) => {
        art.style.setProperty('--d', range(p, 0, 0.16).toFixed(3));
        const a = ease(range(p, 0.2, 0.8));
        if (Math.abs(a - lastA) < 0.0005) return;
        lastA = a;
        const ang = a * 180;
        const lift = Math.sin(a * Math.PI);
        // curl approximation: rotate about the spine, bow slightly with skew
        // and a touch of scale while the leaf is in the air
        leaf.style.transform = `rotateY(${(rtl ? ang : -ang).toFixed(2)}deg) skewY(${((rtl ? 1 : -1) * lift * 2.2).toFixed(2)}deg) scale(${(1 + lift * 0.015).toFixed(4)})`;
        front.style.opacity = (Math.min(1, a * 2) * 0.45).toFixed(3);
        back.style.opacity = (Math.max(0, 1 - a) * 0.6).toFixed(3);
        cast.style.opacity = (lift * 0.9).toFixed(3);
        cast.style.transform = `scaleX(${(1 - a).toFixed(3)})`;
        sec.classList.toggle('is-turned', a > 0.98);
      });
    });
  } else {
    root.querySelectorAll('.leaf__art .sketch').forEach((s) => s.style.setProperty('--d', 1));
  }

  // Entries: scrubbed sketches + time-based reveals + lazy scratch panels
  root.querySelectorAll('.entry').forEach((el) => {
    const svg = el.querySelector('.entry__sketch .sketch');
    if (reduced) svg.style.setProperty('--d', 1);
    else through(svg, 0.95, 0.4, (p) => svg.style.setProperty('--d', p.toFixed(3)));
    inview(el, '0px 0px -18% 0px');
    const box = el.querySelector('.scratch');
    const button = el.querySelector('.print__reveal');
    const s = initScratch(box, {
      button,
      onReveal: () => {
        button.textContent = ui.revealed;
        el.classList.add('is-revealed');
      }
    });
    lazy(box, s.ready);
  });

  root.querySelectorAll('.turn').forEach((el) => inview(el, '0px'));
  inview(root.querySelector('.journal__head'));
}

let lio;
function lazy(el, fn) {
  if (!('IntersectionObserver' in window)) return fn();
  if (!lio) {
    lio = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) {
            lio.unobserve(e.target);
            e.target.__ready && e.target.__ready();
          }
        }
      },
      { rootMargin: '800px 0px' }
    );
  }
  el.__ready = fn;
  lio.observe(el);
}
