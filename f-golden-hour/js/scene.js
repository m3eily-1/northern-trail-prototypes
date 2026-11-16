// Illustrated landscape scene: sky, sun/moon, stars, parallax layers, signs, car, camp.
// createScene(root, opts) -> { update({t, D}), resize(), addSign(), destroy() }
// Pure render target: it knows nothing about scrolling.

import { TW, TH, REGIONS, regionTile, road, clouds, rng } from './landscape.js';
import { palette, shade, MATS, rgb, smooth, clamp, mix } from './time.js';

const LAYERS = [
  { id: 0, v: 0.012, fog: 0, phone: true },
  { id: 1, v: 0.035, fog: 0.62, phone: true, mats: ['rock', 'sand', 'dune', 'palm', 'trunk'], rise: 70 },
  { id: 2, v: 0.11, fog: 0.42, phone: false, mats: ['sand', 'mud', 'dark', 'palm', 'trunk', 'field', 'rock', 'red'], rise: 50 },
  { id: 3, v: 0.3, fog: 0.2, phone: true, mats: ['sand', 'mud', 'dark', 'palm', 'trunk', 'field', 'rock', 'red', 'dune', 'glyph'], rise: 36, g: 735 },
  { id: 4, v: 0.62, fog: 0.06, phone: true, mats: ['sand', 'palm', 'trunk', 'field', 'rock', 'dune'], rise: 16, g: 830 },
  { id: 5, v: 1.0, fog: 0, phone: true, mats: ['sand', 'dune', 'road', 'line', 'car'], rise: 0 },
];
export const NEAR_V = 0.62;

// region boundaries in travel units (stop index space)
const FADES = [
  [7.3, 7.85],
  [13.3, 13.85],
  [14.3, 14.85],
];

let UID = 0;

export function createScene(root, opts = {}) {
  const phone = !!opts.phone;
  const shadows = !phone && !opts.static;
  const uid = 'gh' + ++UID;
  const layers = LAYERS.filter((l) => !phone || l.phone);
  const cache = new Map();
  let W = 1;
  let H = 1;
  const signs = [];

  root.classList.add('scene');
  root.innerHTML = '';
  const land = el('div', 'scene__land');
  root.appendChild(land);

  land.appendChild(el('div', 'sky'));
  land.appendChild(starfield(phone ? 90 : 230));
  const milky = el('div', 'milky');
  milky.innerHTML = `<div class="milky__band"></div>${dust(phone ? 120 : 320)}`;
  land.appendChild(milky);
  land.appendChild(el('div', 'glow'));
  const sunEl = el('div', 'sun');
  const moonEl = el('div', 'moon');
  land.appendChild(sunEl);
  land.appendChild(moonEl);

  // haze filter (noon shimmer), applied to far layers on desktop
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('class', 'scene__defs');
  defs.setAttribute('aria-hidden', 'true');
  defs.innerHTML = `<filter id="${uid}-haze" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.07" numOctaves="1" seed="4">
        <animate attributeName="baseFrequency" dur="7s" values="0.004 0.07;0.005 0.095;0.004 0.07" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" scale="0" xChannelSelector="R" yChannelSelector="G"/>
    </filter>`;
  land.appendChild(defs);
  const dispMap = defs.querySelector('feDisplacementMap');
  const farWrap = el('div', 'scene__far');
  land.appendChild(farWrap);

  // Each layer holds real duplicated tiles (no <use> copies): mutating a group that a
  // <use> references makes Chrome rebuild the whole clone every frame.
  const L = {};
  layers.forEach((cfg) => {
    const div = el('div', `layer layer--${cfg.id}`);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'layer__track');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('preserveAspectRatio', 'xMinYMax meet');
    const tiles = {};
    if (cfg.id === 0) tiles.clouds = { ground: clouds(), cast: '' };
    else REGIONS.forEach((r) => (tiles[r] = cfg.id === 5 ? { ground: road(r), cast: '' } : regionTile(r, cfg.id)));
    div.appendChild(svg);
    (cfg.id === 1 || cfg.id === 2 ? farWrap : land).appendChild(div);
    L[cfg.id] = { cfg, div, svg, tiles, groups: {}, shades: [], copies: 0, tilePx: 0 };
    if (cfg.id === 4) {
      const s = el('div', 'signs');
      land.appendChild(s);
      L.signs = s;
    }
  });

  function buildTrack(o, copies) {
    const cfg = o.cfg;
    let inner = '';
    for (let k = 0; k < copies; k++) {
      inner += `<g transform="translate(${TW * k} 0)">`;
      if (cfg.id === 0) inner += `<g class="clouds">${o.tiles.clouds.ground}</g>`;
      else
        REGIONS.forEach((r) => {
          const t = o.tiles[r];
          const castId = `${uid}-L${cfg.id}-${r}-c${k}`;
          const sh = shadows && t.cast && cfg.g ? `<use class="shade" href="#${castId}"/>` : '';
          inner += `<g data-r="${r}">${t.ground}${sh}${t.cast ? `<g id="${castId}">${t.cast}</g>` : ''}</g>`;
        });
      inner += '</g>';
    }
    o.svg.innerHTML = inner;
    o.groups = {};
    REGIONS.forEach((r) => (o.groups[r] = [...o.svg.querySelectorAll(`g[data-r="${r}"]`)]));
    o.shades = [...o.svg.querySelectorAll('use.shade')];
    o.copies = copies;
    o.svg.setAttribute('viewBox', `0 0 ${TW * copies} ${TH}`);
  }

  const car = el('div', 'car');
  car.innerHTML = carSVG();
  land.appendChild(car);
  const wheels = [...car.querySelectorAll('.wheel')];
  land.appendChild(el('div', 'wash'));

  function resize() {
    W = root.clientWidth || window.innerWidth;
    H = root.clientHeight || window.innerHeight;
    layers.forEach((cfg) => {
      const o = L[cfg.id];
      const tilePx = (TW * H) / TH;
      const copies = Math.max(2, Math.ceil(W / tilePx) + 1);
      if (copies !== o.copies) buildTrack(o, copies);
      o.tilePx = tilePx;
      o.svg.style.width = tilePx * copies + 'px';
    });
    cache.clear();
  }

  function setVar(name, val) {
    if (cache.get(name) === val) return;
    cache.set(name, val);
    root.style.setProperty(name, val);
  }
  function setAttr(node, key, name, val) {
    const k = key + name;
    if (cache.get(k) === val) return;
    cache.set(k, val);
    node.setAttribute(name, val);
  }

  function regionOps(D) {
    const w = FADES.map(([a, b]) => smooth(a, b, D));
    const out = {};
    REGIONS.forEach((r, i) => {
      const inn = i === 0 ? 1 : smooth(0, 0.6, w[i - 1]);
      const outn = i === REGIONS.length - 1 ? 1 : 1 - smooth(0.5, 1, w[i]);
      out[r] = { op: inn * outn, inn, outn };
    });
    return out;
  }

  function update(st) {
    const t = st.t;
    const D = st.D;
    const p = palette(t);

    setVar('--sky-top', rgb(p.sky.top));
    setVar('--sky-mid', rgb(p.sky.mid));
    setVar('--sky-hor', rgb(p.sky.hor));

    // sun on its arc (LTR coordinates; the land is mirrored for RTL)
    const Hh = H * 0.64;
    const th = p.sun.theta;
    const sx = W * (0.5 - 0.44 * Math.cos(th));
    const sy = Hh - Math.sin(th) * Hh * 0.84;
    setVar('--sun-x', sx.toFixed(1) + 'px');
    setVar('--sun-y', sy.toFixed(1) + 'px');
    setVar('--sun-col', rgb(p.sunCol));
    setVar('--sun-s', (1 + 0.28 * (1 - smooth(0, 24, p.sun.el))).toFixed(3));
    setVar('--sun-op', clamp(smooth(-6, 1, p.sun.el)).toFixed(3));
    setVar('--glow-col', rgb(mix(p.sunCol, p.light, 0.4)));
    setVar('--glow-op', clamp(p.golden * 0.85 + p.noon * 0.45 + p.sun.up * 0.2 + (1 - p.night) * 0.1).toFixed(3));
    setVar('--wash-col', rgb(p.light));
    setVar('--wash-op', clamp(p.golden * 0.6 + 0.12 * p.sun.up).toFixed(3));

    const mth = (Math.PI * (t - 1110)) / 760;
    setVar('--moon-x', (W * (0.5 - 0.44 * Math.cos(mth))).toFixed(1) + 'px');
    setVar('--moon-y', (Hh - Math.sin(mth) * Hh * (phone ? 1.45 : 0.8)).toFixed(1) + 'px');
    setVar('--moon-op', smooth(0.02, 0.2, mth).toFixed(3));

    setVar('--stars', p.stars.toFixed(3));
    setVar('--milky', p.milky.toFixed(3));
    setVar('--cloud-col', rgb(p.cloudCol));
    setVar('--cloud-op', p.cloudOp.toFixed(3));
    setVar('--beams', p.beams.toFixed(3));
    setVar('--fire', p.fire.toFixed(3));
    setVar('--stk-b', (0.32 + 0.68 * clamp(p.I / 0.95)).toFixed(3));
    setVar('--win', rgb(mix(p.sky.mid, [20, 22, 34], 0.55)));
    setVar('--shadow-col', rgb(mix([40, 24, 30], p.sky.top, 0.25)));

    // relight materials per layer
    layers.forEach((cfg) => {
      if (!cfg.mats) return;
      cfg.mats.forEach((m) => {
        const c = shade(p, MATS[m], cfg.fog);
        setVar(`--c${cfg.id}${m}A`, rgb(c.A));
        setVar(`--c${cfg.id}${m}B`, rgb(c.B));
        setVar(`--c${cfg.id}${m}C`, rgb(c.C));
      });
    });

    // parallax travel + region crossfades
    const ops = regionOps(D);
    layers.forEach((cfg) => {
      const o = L[cfg.id];
      const drift = cfg.id === 0 ? t * 0.9 : 0;
      const px = D * cfg.v * W + drift;
      const x = -(((px % o.tilePx) + o.tilePx) % o.tilePx);
      o.svg.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
      if (cfg.id === 0) return;
      REGIONS.forEach((r) => {
        const q = ops[r];
        const vis = q.op > 0.002;
        const dy = (1 - q.inn) * cfg.rise + (1 - q.outn) * cfg.rise * 0.5;
        o.groups[r].forEach((g, k) => {
          const key = `${cfg.id}${r}${k}`;
          setAttr(g, key, 'display', vis ? 'inline' : 'none');
          if (!vis) return;
          setAttr(g, key, 'opacity', q.op.toFixed(3));
          setAttr(g, key, 'transform', `translate(0 ${dy.toFixed(1)})`);
        });
      });
      // long shadows: flipped, squashed, sheared copies of the casters
      if (o.shades.length) {
        const gY = cfg.g;
        const k = p.shadow.k;
        const q = 0.11;
        const m = `matrix(1 0 ${(-k).toFixed(3)} ${(-q).toFixed(3)} ${(k * gY).toFixed(1)} ${((1 + q) * gY).toFixed(1)})`;
        o.shades.forEach((u, i) => {
          setAttr(u, `sh${cfg.id}${i}`, 'transform', m);
          setAttr(u, `sh${cfg.id}${i}`, 'opacity', p.shadow.op.toFixed(3));
        });
      }
    });

    // heat haze at noon
    const haze = !phone && !opts.static ? p.noon : 0;
    if (haze > 0.04) {
      setAttr(dispMap, 'hz', 'scale', (haze * 7).toFixed(2));
      if (!farWrap.style.filter) farWrap.style.filter = `url(#${uid}-haze)`;
    } else if (farWrap.style.filter) {
      farWrap.style.filter = '';
    }

    // signs planted along the road (near layer speed)
    const nearV = NEAR_V;
    signs.forEach((s) => {
      const x = (s.w - D) * nearV * W;
      const on = x > -W * 0.25 && x < W * 1.25;
      if (on !== s.on) {
        s.on = on;
        s.el.style.visibility = on ? 'visible' : 'hidden';
      }
      if (on) {
        s.el.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
        const near = x > -W * 0.05 && x < W * 0.98;
        if (near && !s.planted) {
          s.planted = true;
          s.el.classList.add('is-planted');
        }
      }
    });

    const rot = ((D * 1440) % 360).toFixed(1);
    wheels.forEach((w, i) => setAttr(w, 'wh' + i, 'transform', `rotate(${rot} ${w.dataset.cx} ${w.dataset.cy})`));
  }

  // world position w in travel units
  function addSign({ w, src, cls = '', html = '' }) {
    const s = el('div', `sign ${cls}`);
    s.innerHTML = html || `<div class="sign__plant"><div class="sign__sway"><img src="${src}" alt="" draggable="false" decoding="async"><span class="sign__post"></span></div></div>`;
    s.style.visibility = 'hidden';
    L.signs.appendChild(s);
    const rec = { w, el: s, on: false, planted: !!opts.static };
    if (opts.static) s.classList.add('is-planted');
    signs.push(rec);
    return rec;
  }

  resize();
  return { root, update, resize, addSign, get size() { return { W, H }; } };
}

function el(tag, cls) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  return n;
}

function starfield(n) {
  const rnd = rng(99);
  let s = '<svg class="stars" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">';
  for (let i = 0; i < n; i++) {
    const x = rnd() * 1600;
    const y = Math.pow(rnd(), 1.4) * 640;
    const r = 0.5 + Math.pow(rnd(), 3) * 1.6;
    const tw = rnd() < 0.22 ? ` class="tw" style="animation-delay:${(-rnd() * 6).toFixed(2)}s;animation-duration:${(2.6 + rnd() * 3).toFixed(2)}s"` : '';
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(2)}"${tw}/>`;
  }
  return Object.assign(document.createElement('div'), { className: 'starwrap', innerHTML: s + '</svg>' });
}

function dust(n) {
  const rnd = rng(5);
  let s = '<svg class="milky__dust" viewBox="0 0 1000 200" preserveAspectRatio="none" aria-hidden="true">';
  for (let i = 0; i < n; i++) {
    const x = rnd() * 1000;
    const g = (rnd() + rnd() + rnd()) / 3; // concentrate around the band centre
    const y = 100 + (g - 0.5) * 170;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(0.35 + rnd() * 0.7).toFixed(2)}"/>`;
  }
  return s + '</svg>';
}

function carSVG() {
  return `<svg viewBox="0 0 200 90" aria-hidden="true" overflow="visible">
    <defs><linearGradient id="beamg" x1="0" x2="1"><stop offset="0" stop-color="#fff2c4" stop-opacity=".75"/><stop offset="1" stop-color="#fff2c4" stop-opacity="0"/></linearGradient></defs>
    <path class="car__beam" d="M190 46L520 20L520 92L190 54Z" fill="url(#beamg)"/>
    <ellipse cx="104" cy="83" rx="96" ry="6" fill="#000" opacity=".28"/>
    <path d="M12 66L12 46Q14 37 26 35L54 33L74 14Q78 10 86 10L146 10Q154 10 158 16L174 33Q190 35 192 45L192 66Z" style="fill:var(--c5carA)"/>
    <path d="M12 56L192 56L192 68L12 68Z" style="fill:var(--c5carB)"/>
    <path d="M80 16L71 32L112 32L112 16Z M118 16L118 32L166 32L153 16Z" style="fill:var(--win)"/>
    <path d="M86 5L150 5L150 9L86 9Z" style="fill:var(--c5roadC)"/>
    <path d="M184 40L192 40L192 47L184 47Z" class="car__lamp"/>
    <path d="M12 40L17 40L17 49L12 49Z" class="car__tail"/>
    <g class="wheel" data-cx="52" data-cy="68"><circle cx="52" cy="68" r="16" fill="#1d1816"/><circle cx="52" cy="68" r="7" style="fill:var(--c5lineB)"/><path d="M52 58L52 78M42 68L62 68" stroke="#1d1816" stroke-width="2.4"/></g>
    <g class="wheel" data-cx="156" data-cy="68"><circle cx="156" cy="68" r="16" fill="#1d1816"/><circle cx="156" cy="68" r="7" style="fill:var(--c5lineB)"/><path d="M156 58L156 78M146 68L166 68" stroke="#1d1816" stroke-width="2.4"/></g>
  </svg>`;
}

export function campHTML() {
  return `<div class="camp__glow"></div>
  <svg class="camp__art" viewBox="0 0 300 130" aria-hidden="true">
    <path d="M6 118L40 66L98 52L156 66L188 118Z" fill="#1a1320"/>
    <path d="M40 66L98 52L156 66L150 72L98 60L46 72Z" fill="#2a1f2c"/>
    <path d="M84 118L98 78L112 118Z" fill="#0c0910"/>
    <path d="M6 118L-10 124M188 118L204 124" stroke="#2a1f2c" stroke-width="2"/>
    <g class="camp__fire">
      <path d="M222 122L262 112M226 112L262 124" stroke="#3a2416" stroke-width="7" stroke-linecap="square"/>
      <path class="fl fl1" d="M242 116C228 104 236 88 242 72C246 88 258 98 252 116Z" fill="#ff7a2a"/>
      <path class="fl fl2" d="M244 116C236 106 240 96 245 84C249 96 254 104 250 116Z" fill="#ffb347"/>
      <path class="fl fl3" d="M245 116C242 110 243 104 246 98C249 104 250 110 248 116Z" fill="#ffe7a0"/>
    </g>
  </svg>
  <span class="spark" style="--d:0s;--x:-6px"></span><span class="spark" style="--d:.7s;--x:8px"></span><span class="spark" style="--d:1.3s;--x:-2px"></span><span class="spark" style="--d:1.9s;--x:5px"></span>`;
}
