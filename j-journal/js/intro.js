// Intro stats as hand-drawn tallies, then the three pillars as taped cards.
import { t, ui, esc, asset } from './i18n.js';
import { makePen, renderPaths } from './sketches.js';
import { inview } from './scroll.js';

function tallySvg(n, seed) {
  const p = makePen(seed, 0.6);
  const list = [];
  const h = 34;
  const gap = 9;
  const groupGap = 16;
  let x = 4;
  let left = n;
  while (left > 0) {
    const k = Math.min(5, left);
    const gx = x;
    for (let i = 0; i < Math.min(4, k); i++) {
      list.push(p.line([[x, 4 + p.r() * 3], [x + (p.r() - 0.5) * 3, h]]));
      x += gap;
    }
    if (k === 5) list.push(p.line([[gx - 5, h - 4], [x - gap + 5, 8]]));
    x += groupGap - gap;
    left -= k;
  }
  const w = Math.ceil(x);
  return renderPaths(list, { viewBox: `0 0 ${w} 40`, cls: 'mark mark--tally' }).replace('<svg ', `<svg style="width:${w}px" `);
}

function roadSvg(seed) {
  const p = makePen(seed, 0.6);
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push([4 + i * 24, 20 + Math.sin(i * 1.3) * 9]);
  return renderPaths([p.curve(pts), p.line([[196, 6], [196, 32]]), p.line([[196, 6], [210, 11], [196, 16]])], {
    viewBox: '0 0 216 40',
    cls: 'mark mark--road'
  });
}

function ringSvg(seed) {
  const p = makePen(seed, 0.8);
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = -0.5 + (i / 12) * Math.PI * 2;
    pts.push([100 + Math.cos(a) * (92 + i * 0.6), 50 + Math.sin(a) * (40 + i * 0.3)]);
  }
  return renderPaths([p.curve(pts)], { viewBox: '0 0 200 100', cls: 'mark mark--ring' }).replace('<svg ', '<svg preserveAspectRatio="none" ');
}

function underlineSvg(seed, color) {
  const p = makePen(seed, 0.5);
  return renderPaths([p.curve([[2, 8], [40, 4], [80, 7], [120, 3]]), p.curve([[10, 13], [60, 10], [112, 11]])], {
    viewBox: '0 0 124 16',
    cls: 'uline'
  }).replace('<svg ', `<svg style="--ink:${color}" `);
}

export function initIntro(data) {
  const root = document.getElementById('intro');
  root.setAttribute('aria-label', ui.glance);
  const stats = data.intro.stats;
  const marks = [roadSvg(11), tallySvg(Number(stats[1].value) || 16, 12), tallySvg(Number(stats[2].value) || 3, 13), ''];

  const statItems = stats
    .map((s, i) => {
      const unit = s.unit ? `<span class="tally__unit">${esc(t(s.unit))}</span>` : '';
      const ring = i === 3 ? ringSvg(14) : '';
      return `<li class="tally__item" style="--i:${i}">
        <p class="tally__num"><span class="tally__val">${esc(s.value)}</span>${unit}${ring}</p>
        <div class="tally__mark">${marks[i]}</div>
        <p class="tally__label">${esc(t(s.label))}</p>
      </li>`;
    })
    .join('');

  const cards = data.pillars
    .map(
      (p, i) => `<li class="card" style="--c:${p.color};--i:${i}">
        <span class="tape tape--c" aria-hidden="true"></span>
        <div class="card__art"><img src="${asset(p.art)}" alt="" loading="lazy"></div>
        <p class="card__no">${String(i + 1).padStart(2, '0')}</p>
        <h3 class="card__name">${esc(t(p.name))}</h3>
        ${underlineSvg(20 + i, p.color)}
        <p class="card__line">${esc(t(p.line))}</p>
      </li>`
    )
    .join('');

  root.innerHTML = `
    <div class="paper field__paper" aria-hidden="true"></div>
    <div class="nt-wrap field__wrap">
      <ul class="tally">${statItems}</ul>
      <ul class="cards">${cards}</ul>
    </div>`;

  root.querySelectorAll('.tally__item, .card').forEach((el) => inview(el));
}
