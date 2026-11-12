// Shared helpers: language, labels, content loading, DOM + paper layer rendering.
import { VB_W, VB_H } from './paper.js';

export const LANG = document.documentElement.lang === 'ar' ? 'ar' : 'en';
export const RTL = LANG === 'ar';
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const FINE = matchMedia('(hover: hover) and (pointer: fine)');
export const PHONE = matchMedia('(max-width: 767px)');

export const tr = (o) => (o == null ? '' : typeof o === 'string' ? o : o[LANG] ?? o.en);
export const asset = (p) => (p ? '../' + p : '');
export const pad2 = (n) => String(n).padStart(2, '0');

const LABELS = {
  en: {
    scroll: 'Scroll',
    pause: 'Pause film',
    play: 'Play film',
    region: 'Region',
    of: 'of',
    stop: 'Stop',
    drive: 'Drive',
    start: 'Starting point',
    close: 'Close',
    prev: 'Previous stop',
    next: 'Next stop',
    swipe: 'Swipe for stops',
    open: 'Open',
    regions: 'Regions',
    stopsIn: 'Stops in',
  },
  ar: {
    scroll: 'مرّر',
    pause: 'إيقاف الفيلم',
    play: 'تشغيل الفيلم',
    region: 'المنطقة',
    of: 'من',
    stop: 'المحطة',
    drive: 'القيادة',
    start: 'نقطة البداية',
    close: 'إغلاق',
    prev: 'المحطة السابقة',
    next: 'المحطة التالية',
    swipe: 'اسحب لرؤية المحطات',
    open: 'افتح',
    regions: 'المناطق',
    stopsIn: 'محطات',
  },
};
export const L = LABELS[LANG];

export async function loadContent() {
  const res = await fetch('../assets/content.json');
  if (!res.ok) throw new Error('content.json ' + res.status);
  return res.json();
}

// tiny hyperscript
export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const driveText = (stop) => (stop.drive ? `${L.drive} ${tr(stop.drive)}` : L.start);

// One paper layer as a standalone SVG image (blob URL). The filters live inside the
// file, so the browser rasterises each layer once and only its transform animates.
// The sky gets grain only; cut layers get the deckled-edge paper filter; the drop
// shadow is CSS on the image.
const DEFS = `<defs>
<filter id="p" x="-2%" y="-4%" width="104%" height="108%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="warp"/><feDisplacementMap in="SourceGraphic" in2="warp" scale="7" xChannelSelector="R" yChannelSelector="G" result="deckle"/><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.04  0 0 0 0.3 -0.1" result="grain"/><feComposite in="grain" in2="deckle" operator="in" result="g"/><feMerge><feMergeNode in="deckle"/><feMergeNode in="g"/></feMerge></filter>
<filter id="s" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed="7" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.18  0 0 0 0 0.1  0 0 0 0 0.04  0 0 0 0.2 -0.07" result="grain"/><feComposite in="grain" in2="SourceGraphic" operator="in" result="g"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="g"/></feMerge></filter>
</defs>`;
const urlCache = new Map();
export function layerURL(layer) {
  if (urlCache.has(layer)) return urlCache.get(layer);
  const parts = layer.parts.map((p) => `<path fill="${p.fill}" d="${p.d}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${VB_W}" height="${VB_H}" viewBox="0 0 ${VB_W} ${VB_H}">${DEFS}<g filter="url(#${layer.sky ? 's' : 'p'})">${parts}</g></svg>`;
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  urlCache.set(layer, url);
  return url;
}

// Builds layer elements (back to front) into a box. Returns the layer nodes.
export function buildLayers(box, layers, cls = 'lyr') {
  return layers.map((layer, i) => {
    const el = h('div', { class: `${cls}${layer.sky ? ` ${cls}--sky` : ''}${layer.extra ? ` ${cls}--extra` : ''}`, 'data-depth': i });
    el.append(h('img', { class: 'lyr__art', src: layerURL(layer), alt: '', decoding: 'async', draggable: 'false' }));
    box.append(el);
    return el;
  });
}

// pop-up illustration on a little paper stand
export function popup(p, cls = 'pop') {
  const el = h('div', {
    class: `${cls}${p.sticker ? ` ${cls}--sticker` : ''}`,
    style: `--x:${p.x}%;--b:${p.b}%;--w:${p.w}%;--tilt:${p.tilt || 0}deg`,
  });
  el.append(h('img', { src: asset(p.src), alt: '', loading: 'lazy', decoding: 'async', draggable: 'false' }), h('span', { class: `${cls}__stand`, 'aria-hidden': 'true' }));
  return el;
}

// split text into word spans for the reveal
export function splitWords(el, text) {
  el.textContent = '';
  text.split(/\s+/).forEach((w, i, arr) => {
    const word = h('span', { class: 'w' }, h('span', { class: 'w__i' }, w));
    el.append(word);
    if (i < arr.length - 1) el.append(' ');
  });
  return el.querySelectorAll('.w__i');
}
