// Seven-segment digits drawn as SVG (square-ended bevels, no font needed).

const W = 6; // segment thickness
const hSeg = (x1, x2, y) =>
  `${x1},${y} ${x1 + W / 2},${y - W / 2} ${x2 - W / 2},${y - W / 2} ${x2},${y} ${x2 - W / 2},${y + W / 2} ${x1 + W / 2},${y + W / 2}`;
const vSeg = (x, y1, y2) =>
  `${x},${y1} ${x + W / 2},${y1 + W / 2} ${x + W / 2},${y2 - W / 2} ${x},${y2} ${x - W / 2},${y2 - W / 2} ${x - W / 2},${y1 + W / 2}`;

const SEGS = {
  a: hSeg(7, 33, 4),
  b: vSeg(36, 7, 34),
  c: vSeg(36, 38, 65),
  d: hSeg(7, 33, 68),
  e: vSeg(4, 38, 65),
  f: vSeg(4, 7, 34),
  g: hSeg(7, 33, 36),
};

const MAP = {
  0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd',
  6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', ' ': '',
};

const digitSVG = () =>
  `<svg class="seg__d" viewBox="0 0 40 72" aria-hidden="true">${Object.entries(SEGS)
    .map(([k, p]) => `<polygon data-s="${k}" points="${p}"/>`)
    .join('')}</svg>`;

export function createSeg(el, count) {
  el.innerHTML = Array.from({ length: count }, digitSVG).join('');
  const digits = [...el.querySelectorAll('.seg__d')];
  return {
    set(str) {
      const s = String(str).padStart(count, ' ').slice(-count);
      digits.forEach((d, i) => {
        const on = MAP[s[i]] ?? '';
        d.querySelectorAll('polygon').forEach((p) => p.classList.toggle('on', on.includes(p.dataset.s)));
      });
    },
  };
}
