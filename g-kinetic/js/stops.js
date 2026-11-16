// STOPS: 12-column bento of photo / number / sticker / name tiles.
// A tiny dense packer places tiles explicitly (so filtered sets stay gap-free) and
// region filtering reflows with a FLIP animation.
import { h, L, t, lang, other, asset, pad2, makeRoller, kinetic, reduced, isPhone, phoneMQ } from './lib.js';

// [stopKey, type, desktop w, h, phone w, h]
const LAYOUT = [
  ['riyadh', 'photo', 6, 4, 2, 2],
  ['riyadh', 'name', 6, 2, 2, 1],
  ['thadiq', 'number', 3, 2, 1, 1],
  ['thadiq', 'sticker', 3, 2, 1, 1],
  ['thadiq', 'photo', 4, 3, 1, 1],
  ['al-qasab', 'photo', 8, 3, 2, 1],
  ['shaqra', 'photo', 3, 3, 1, 1],
  ['ushaiqer', 'photo', 3, 3, 1, 1],
  ['ushaiqer', 'number', 3, 3, 1, 1],
  ['al-majmaah', 'name', 3, 3, 2, 1],
  ['al-majmaah', 'photo', 5, 3, 1, 1],
  ['al-ghat', 'photo', 7, 3, 2, 1],
  ['al-zulfi', 'photo', 4, 3, 1, 1],
  ['al-mithnab', 'number', 4, 3, 1, 1],
  ['al-mithnab', 'photo', 4, 3, 2, 2],
  ['unaizah', 'sticker', 3, 3, 1, 1],
  ['unaizah', 'photo', 6, 3, 1, 1],
  ['ar-rass', 'name', 3, 3, 2, 1],
  ['ar-rass', 'photo', 4, 3, 1, 1],
  ['buraydah', 'photo', 4, 3, 1, 1],
  ['buraydah', 'sticker', 4, 3, 2, 1],
  ['al-bukayriyah', 'photo', 3, 3, 1, 1],
  ['uyun-al-jiwa', 'photo', 6, 3, 1, 1],
  ['uyun-al-jiwa', 'name', 3, 3, 2, 1],
  ['hail', 'number', 4, 2, 1, 1],
  ['hail', 'photo', 8, 4, 2, 2],
  ['hail', 'sticker', 4, 2, 1, 1],
  ['jubbah', 'photo', 6, 4, 2, 2],
  ['jubbah', 'sticker', 6, 2, 1, 1],
  ['jubbah', 'number', 6, 2, 1, 1],
];

const BLOCKS = { number: ['cream', 'green', 'sand-dark'], sticker: ['sand', 'green', 'lavender', 'cream', 'sand-dark'], name: ['sand-dark', 'lavender', 'green', 'cream'] };

/** Dense packer: places each item at the first free cell (row-major), then widens tiles into holes. */
export function pack(items, cols) {
  const grid = [];
  const free = (r, c, w, hh) => {
    if (c + w > cols) return false;
    for (let y = r; y < r + hh; y++) for (let x = c; x < c + w; x++) if (grid[y]?.[x]) return false;
    return true;
  };
  const mark = (it) => {
    for (let y = it.r; y < it.r + it.h; y++) {
      grid[y] = grid[y] || [];
      for (let x = it.c; x < it.c + it.w; x++) grid[y][x] = it;
    }
  };
  const out = items.map((s) => ({ ...s, w: Math.min(s.w, cols) }));
  out.forEach((it) => {
    for (let r = 0; ; r++) {
      let placed = false;
      for (let c = 0; c < cols; c++) if (free(r, c, it.w, it.h)) { it.r = r; it.c = c; placed = true; break; }
      if (placed) break;
    }
    mark(it);
  });
  // widen into holes to the inline end, then grow down into holes below
  let changed = true;
  const rows = () => grid.length;
  while (changed) {
    changed = false;
    for (const it of out) {
      const x = it.c + it.w;
      if (x < cols) {
        let ok = true;
        for (let y = it.r; y < it.r + it.h; y++) if (grid[y]?.[x]) ok = false;
        if (ok) { it.w++; mark(it); changed = true; }
      }
    }
    if (!changed) {
      for (const it of out) {
        const y = it.r + it.h;
        if (y < rows()) {
          let ok = true;
          for (let x = it.c; x < it.c + it.w; x++) if (grid[y]?.[x]) ok = false;
          if (ok) { it.h++; mark(it); changed = true; }
        }
      }
    }
  }
  return out;
}

export function initStops(data, { openStop }) {
  const root = document.getElementById('stops');
  const grid = root.querySelector('.bento');
  const seg = root.querySelector('.seg');
  const ind = seg.querySelector('.seg__ind');
  const countEl = root.querySelector('.stops__count');
  root.querySelector('.stops__title').textContent = L(data.hero.cta);
  const byKey = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  const total = data.stops.length;

  // ---- tiles ----
  const counters = { number: 0, sticker: 0, name: 0 };
  const tiles = LAYOUT.map(([key, type, dw, dh, pw, ph]) => {
    const s = byKey[key];
    const block = BLOCKS[type] ? BLOCKS[type][counters[type]++ % BLOCKS[type].length] : null;
    const name = L(s.name);
    const el = h('button', {
      class: `tile tile--${type}${block ? ' blk--' + block : ''}`, type: 'button',
      'aria-label': `${t('open')} ${pad2(s.n)}: ${name}`, 'data-region': s.region,
    });
    let roller = null;
    let fitEl = null;
    if (type === 'photo') {
      el.append(
        h('img', { class: 'tile__img', src: asset(s.photo), alt: '', loading: 'lazy', decoding: 'async' }),
        h('span', { class: 'tile__scrim' }),
        h('span', { class: 'tile__label' },
          h('span', { class: 'tile__n' }, pad2(s.n)),
          h('span', { class: 'tile__name' }, name),
          h('span', { class: 'tile__alt', lang: other, dir: other === 'ar' ? 'rtl' : 'ltr' }, s.name[other])),
      );
    } else if (type === 'number') {
      const num = h('span', { class: 'tile__big' });
      roller = makeRoller(num, String(s.driveMinutes));
      el.append(
        h('span', { class: 'tile__n' }, pad2(s.n)),
        h('span', { class: 'tile__numrow' }, num, h('span', { class: 'tile__unit' }, t('min'))),
        h('span', { class: 'tile__cap' }, `${t('to')} ${name}`),
      );
    } else if (type === 'sticker') {
      el.append(h('img', { class: 'tile__sticker', src: asset(s.sticker), alt: '', loading: 'lazy' }));
    } else if (type === 'name') {
      fitEl = h('span', { class: 'tile__giant' }, h('span', { class: 'tile__giant-in' }, name.split(' ').map((w) => h('span', { class: 'tile__gl' }, h('span', {}, w)))));
      el.append(
        h('span', { class: 'tile__n' }, pad2(s.n)),
        fitEl,
        h('span', { class: 'tile__alt', lang: other, dir: other === 'ar' ? 'rtl' : 'ltr' }, s.name[other]),
      );
    }
    // hover description (clip-path wipe)
    if (type !== 'name') el.append(h('span', { class: 'tile__desc' },
      h('span', { class: 'tile__desc-n' }, `${pad2(s.n)} · ${name}`),
      h('span', { class: 'tile__desc-t' }, L(s.desc))));
    el.addEventListener('click', () => openStop(data.stops.indexOf(s), el));
    grid.append(el);
    return { el, stop: s, type, d: { w: dw, h: dh }, p: { w: pw, h: ph }, roller, fitEl, visible: true };
  });

  kinetic(tiles.filter((x) => x.fitEl).map((x) => x.fitEl.firstChild), { skew: 6, stretch: 0.05 });

  // ---- layout ----
  let region = 'all';
  const visibleTiles = () => tiles.filter((x) => region === 'all' || x.stop.region === region);
  const layout = () => {
    const phone = isPhone();
    const cols = phone ? 2 : 12;
    const vis = visibleTiles();
    const placed = pack(vis.map((x) => ({ ...(phone ? x.p : x.d), ref: x })), cols);
    tiles.forEach((x) => { x.visible = false; x.el.hidden = true; });
    placed.forEach((p) => {
      const x = p.ref;
      x.visible = true;
      x.el.hidden = false;
      x.el.style.gridColumn = `${p.c + 1} / span ${p.w}`;
      x.el.style.gridRow = `${p.r + 1} / span ${p.h}`;
      x.el.dataset.w = p.w;
      x.el.dataset.h = p.h;
    });
  };
  // stack words, one size for all lines: the longest word fills the width, capped by the tile height
  const fitNames = () => tiles.forEach((x) => {
    if (!x.fitEl || !x.visible) return;
    const inner = x.fitEl.firstChild;
    const cs = getComputedStyle(x.el);
    const pad = parseFloat(cs.paddingInlineStart);
    const box = x.el.clientWidth - 2 * pad;
    const availH = x.el.clientHeight - 2 * pad - 64;
    inner.style.fontSize = '100px';
    const words = [...inner.querySelectorAll('.tile__gl > span')];
    const widest = Math.max(...words.map((w) => w.getBoundingClientRect().width));
    const lh = parseFloat(getComputedStyle(inner).lineHeight) / 100 || 1;
    const size = Math.max(20, Math.min((100 * box) / widest, availH / (words.length * lh)));
    inner.style.fontSize = size.toFixed(2) + 'px';
  });

  // ---- rollers when tiles appear ----
  const io = new IntersectionObserver((ents) => ents.forEach((e) => {
    const x = tiles.find((tt) => tt.el === e.target);
    if (e.isIntersecting && x?.roller && !x.roller.played) x.roller.play(1.3, 0.1);
  }), { threshold: 0.4 });
  tiles.forEach((x) => x.roller && io.observe(x.el));

  // ---- segmented control ----
  const opts = [['all', t('all')], ...data.regions.map((r) => [r.key, t(r.key)])];
  seg.setAttribute('aria-label', t('filter'));
  const btns = opts.map(([k, label]) => {
    const b = h('button', { class: 'seg__btn', type: 'button', 'aria-pressed': String(k === 'all'), 'data-k': k }, label);
    b.addEventListener('click', () => setRegion(k));
    seg.append(b);
    return b;
  });
  const moveInd = (instant) => {
    const b = btns.find((x) => x.dataset.k === region);
    const tr = { x: b.offsetLeft, width: b.offsetWidth };
    if (!window.gsap) { Object.assign(ind.style, { transform: `translateX(${tr.x}px)`, width: tr.width + 'px' }); return; }
    if (instant || reduced) gsap.set(ind, tr);
    else gsap.to(ind, { ...tr, duration: 0.55, ease: 'expo.out' });
  };
  const setCount = () => {
    const r = data.regions.find((x) => x.key === region);
    countEl.textContent = r ? `${L(r.name)} · ${L(r.count)}` : `${total} ${t('stops')}`;
  };

  let busy = false;
  function setRegion(k) {
    if (k === region || busy) return;
    const before = new Map(tiles.filter((x) => x.visible).map((x) => [x, x.el.getBoundingClientRect()]));
    region = k;
    btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)));
    moveInd();
    setCount();
    const next = new Set(visibleTiles());
    const leaving = [...before.keys()].filter((x) => !next.has(x));
    if (reduced) { layout(); fitNames(); ScrollTrigger?.refresh?.(); return; }
    busy = true;
    const doFlip = () => {
      leaving.forEach((x) => gsap.set(x.el, { clearProps: 'opacity,scale,transform' }));
      layout();
      fitNames();
      const gridTop = grid.getBoundingClientRect().top;
      tiles.filter((x) => x.visible).forEach((x, i) => {
        const a = before.get(x);
        if (!a) {
          gsap.fromTo(x.el, { opacity: 0, scale: 0.88 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.18 + i * 0.025, ease: 'expo.out', clearProps: 'opacity,transform' });
          if (x.roller) x.roller.play(1.2, 0.3);
          return;
        }
        const b = x.el.getBoundingClientRect();
        gsap.fromTo(x.el,
          { x: a.left - b.left, y: a.top - b.top, scaleX: a.width / b.width, scaleY: a.height / b.height, transformOrigin: '0 0' },
          { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.75, ease: 'expo.inOut', clearProps: 'transform,transformOrigin' });
      });
      gsap.delayedCall(0.8, () => { busy = false; ScrollTrigger.refresh(); });
      const barH = root.querySelector('.stops__bar').offsetHeight;
      if (gridTop < 64 + barH) window.scrollTo({ top: window.scrollY + gridTop - 64 - barH - 16, behavior: 'smooth' });
    };
    if (leaving.length) gsap.to(leaving.map((x) => x.el), { opacity: 0, scale: 0.92, duration: 0.25, ease: 'power2.in', stagger: 0.01, onComplete: doFlip });
    else doFlip();
  }

  layout();
  setCount();
  const refresh = () => { layout(); fitNames(); moveInd(true); };
  phoneMQ.addEventListener('change', refresh);

  if (!reduced) {
    gsap.set(tiles.map((x) => x.el), { opacity: 0, y: 48 });
    ScrollTrigger.batch(tiles.map((x) => x.el), {
      start: 'top 92%', once: true,
      onEnter: (els) => gsap.fromTo(els, { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, clearProps: 'transform,opacity' }),
    });
  }

  return { refresh, fitNames };
}
