// Stamp art: stops with a brand sticker use the sticker; the rest get a generated rubber-stamp SVG.
// The ink texture is an SVG filter (displaced edges + a noise mask for patchy ink), one per stop
// so every stamp has its own distress pattern.
import { esc, pad2 } from './i18n.js';

const INK = ['#824628', '#5a6432', '#a06eb4'];

export function seeded(seed) {
  let s = (seed * 2654435761) % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function stampMeta(stop) {
  const r = seeded(stop.n * 31 + 5);
  const rot = Math.round((r() * 2 - 1) * 8 * 10) / 10;
  return {
    rot: stop.sticker ? rot * 0.6 : rot,
    color: stop.sticker ? '#824628' : INK[(stop.n - 1) % 3],
    variant: stop.n % 3,
    sticker: !!stop.sticker,
  };
}

let ctx2d;
// Font size that fits `text` into `width` user units (Bukra 700), capped at `max`.
function fit(text, max, width, letterSpacing = 0) {
  ctx2d ||= document.createElement('canvas').getContext('2d');
  ctx2d.font = '700 100px nt-bukra';
  const per = ctx2d.measureText(text).width / 100 || 0.6 * text.length;
  const avail = width - letterSpacing * Math.max(0, text.length - 1);
  return Math.min(max, Math.max(6, avail / per));
}

export function buildInkDefs() {
  if (document.getElementById('ink-defs')) return;
  let filters = '';
  for (let n = 0; n <= 16; n++) {
    filters += `
      <filter id="ink-${n}" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${n + 1}" result="grain"/>
        <feDisplacementMap in="SourceGraphic" in2="grain" scale="2.4" xChannelSelector="R" yChannelSelector="G" result="rough"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="3" seed="${n + 40}" result="blot"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="${n + 80}" result="speck"/>
        <feComposite in="blot" in2="speck" operator="arithmetic" k2="0.7" k3="0.3" result="mix"/>
        <feColorMatrix in="mix" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 -3.1" result="mask"/>
        <feComposite in="rough" in2="mask" operator="in" result="inked"/>
        <feComponentTransfer in="inked"><feFuncA type="linear" slope="0.9"/></feComponentTransfer>
      </filter>`;
  }
  const svg = `<svg id="ink-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"><defs>${filters}</defs></svg>`;
  document.body.insertAdjacentHTML('beforeend', svg);
}

export function inkStampSVG(stop) {
  const { color, variant } = stampMeta(stop);
  const n = pad2(stop.n);
  const en = stop.name.en.toUpperCase();
  const ar = stop.name.ar;
  const enSize = fit(en, 13, 86, 0.8);
  const arSize = fit(ar, 19, 84);
  const inner = variant === 1
    ? '<rect x="11" y="11" width="98" height="98" fill="none" stroke-width="1.4" stroke-dasharray="3.2 2.4"/>'
    : '<rect x="11" y="11" width="98" height="98" fill="none" stroke-width="1.4"/>';
  const ornament = variant === 2
    ? '<rect x="20" y="58" width="6" height="6" transform="rotate(45 23 61)" stroke="none"/><rect x="94" y="58" width="6" height="6" transform="rotate(45 97 61)" stroke="none"/>'
    : '<rect x="20" y="58" width="6" height="6" stroke="none"/><rect x="94" y="58" width="6" height="6" stroke="none"/>';
  return `<svg class="ink" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
    <g filter="url(#ink-${stop.n})" fill="${color}" stroke="${color}">
      <rect x="4" y="4" width="112" height="112" fill="none" stroke-width="4"/>
      ${inner}
      <text x="60" y="38" text-anchor="middle" direction="rtl" font-family="nt-bukra" font-weight="700" font-size="${arSize.toFixed(2)}" stroke="none">${esc(ar)}</text>
      <path d="M20 47H100" fill="none" stroke-width="1.2"/>
      <text x="60" y="80" text-anchor="middle" font-family="nt-bukra" font-weight="700" font-size="34" stroke="none" letter-spacing="1">${n}</text>
      ${ornament}
      <path d="M20 89H100" fill="none" stroke-width="1.2"/>
      <text x="60" y="104" text-anchor="middle" font-family="nt-bukra" font-weight="700" font-size="${enSize.toFixed(2)}" letter-spacing="0.8" stroke="none">${esc(en)}</text>
    </g>
  </svg>`;
}

export function completeStampSVG(label, count) {
  const latin = /[A-Za-z]/.test(label);
  const ls = latin ? 2 : 0;
  const size = fit(label, latin ? 30 : 26, 160, ls);
  return `<svg class="ink" viewBox="0 0 200 84" aria-hidden="true" focusable="false">
    <g filter="url(#ink-0)" fill="#5a6432" stroke="#5a6432">
      <rect x="3" y="3" width="194" height="78" fill="none" stroke-width="4"/>
      <rect x="10" y="10" width="180" height="64" fill="none" stroke-width="1.4"/>
      <text x="100" y="${latin ? 47 : 44}" text-anchor="middle" ${latin ? '' : 'direction="rtl"'} font-family="nt-bukra" font-weight="700" font-size="${size.toFixed(2)}" letter-spacing="${ls}" stroke="none">${esc(label)}</text>
      <text x="100" y="66" text-anchor="middle" font-family="nt-bukra" font-weight="700" font-size="12" letter-spacing="1.5" stroke="none" direction="ltr">${esc(count)}</text>
    </g>
  </svg>`;
}

export function stampArt(stop, asset) {
  if (stop.sticker) {
    return `<img class="stamp-img" src="${asset(stop.sticker)}" alt="" draggable="false" decoding="async">`;
  }
  return inkStampSVG(stop);
}
