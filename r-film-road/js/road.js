// The road under the stops reel: a gently winding dotted line (direction N's path), one node per
// stop, and the car illustration driving it. The part already driven is bright; what is ahead is
// faint. Nodes are buttons: they take you to that stop.
import { pad2 } from './labels.js';

const NS = 'http://www.w3.org/2000/svg';
const H = 56; // svg height
const MID = 34; // road centre line
const AMP = 9; // wave amplitude

const CAR = `
  <svg class="r-car__svg" viewBox="0 0 104 58" aria-hidden="true">
    <g class="r-car__body">
      <rect x="40" y="0" width="20" height="7" fill="#c88c3c"/>
      <rect x="62" y="2" width="8" height="5" fill="#fff5c8"/>
      <rect x="30" y="7" width="44" height="3" fill="#824628"/>
      <path d="M20 30 27 10h41l13 20z" fill="#5a6432"/>
      <path d="M31 14h14v12H27z" fill="#fff5c8"/>
      <path d="M49 14h17l8 12H49z" fill="#fff5c8"/>
      <rect x="4" y="28" width="96" height="18" fill="#5a6432"/>
      <rect x="4" y="38" width="96" height="2" fill="#fff5c8" opacity=".55"/>
      <rect x="0" y="26" width="5" height="15" fill="#2d160a"/>
      <rect x="95" y="31" width="5" height="5" fill="#fff5c8"/>
      <rect x="98" y="39" width="6" height="6" fill="#824628"/>
      <rect x="52" y="31" width="7" height="2" fill="#2d160a"/>
    </g>
    <g class="r-wheel"><circle cx="26" cy="46" r="11" fill="#2d160a"/><circle cx="26" cy="46" r="5" fill="#fff5c8"/><rect x="25" y="36" width="2" height="20" fill="#2d160a"/><rect x="16" y="45" width="20" height="2" fill="#2d160a"/></g>
    <g class="r-wheel"><circle cx="80" cy="46" r="11" fill="#2d160a"/><circle cx="80" cy="46" r="5" fill="#fff5c8"/><rect x="79" y="36" width="2" height="20" fill="#2d160a"/><rect x="70" y="45" width="20" height="2" fill="#2d160a"/></g>
  </svg>`;

export function initRoad(root, ctx) {
  const { L, rtl, reduced } = ctx;
  const inner = root.querySelector('.r-road__in');
  const svg = root.querySelector('.r-road__svg');
  const nodesEl = root.querySelector('.r-road__nodes');
  const car = root.querySelector('.r-car');
  car.querySelector('.r-car__flip').innerHTML = CAR;
  if (rtl) car.classList.add('is-rtl');

  let W = 0;
  let ys = []; // y of the road at every x (1 px steps)
  let p = 0;
  let cur = -1;
  let fr = [];
  let nodeEls = [];
  let jump = () => {};
  let lastX = null;
  let wheel = 0;
  let moveT = 0;
  let clip;

  const yAt = (x) => ys[Math.max(0, Math.min(ys.length - 1, Math.round(x)))] ?? MID;

  function build() {
    W = inner.clientWidth;
    if (!W) return;
    // two and a half gentle waves across the width, flattening into both ends
    ys = [];
    for (let x = 0; x <= W; x++) {
      const u = x / W;
      const ease = Math.min(1, u * 8, (1 - u) * 8);
      ys.push(MID + Math.sin(u * Math.PI * 5 + 0.6) * AMP * ease);
    }
    let d = `M0,${ys[0].toFixed(1)}`;
    for (let x = 6; x <= W; x += 6) d += ` L${x},${ys[x].toFixed(1)}`;
    d += ` L${W},${ys[W].toFixed(1)}`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.innerHTML = `
      <defs><clipPath id="r-road-clip"><rect class="r-road__done" x="0" y="0" width="0" height="${H}"/></clipPath></defs>
      <path class="r-road__guide" d="${d}"/>
      <path class="r-road__lit" d="${d}" clip-path="url(#r-road-clip)"/>`;
    clip = svg.querySelector('.r-road__done');
    placeNodes();
    set(p, cur, true);
  }

  function placeNodes() {
    nodeEls.forEach((n) => n.remove());
    nodeEls = fr.map((f, i) => {
      const x = rtl ? W - f * W : f * W;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'r-node';
      b.style.transform = `translate(${x.toFixed(1)}px, ${yAt(x).toFixed(1)}px)`;
      b.setAttribute('aria-label', `${L.stopOf(pad2(nums[i]), total)}: ${names[i] || ''}`);
      b.innerHTML = `<i></i><span>${pad2(nums[i])}</span>`;
      b.addEventListener('click', () => jump(i));
      nodesEl.appendChild(b);
      return b;
    });
    // hide numbers where nodes are too close to read them
    const gap = fr.length > 1 ? (W * (fr[fr.length - 1] - fr[0])) / (fr.length - 1) : W;
    root.classList.toggle('is-tight', gap < 40);
    nodeEls.forEach((b, i) => b.classList.toggle('is-reached', fr[i] <= p + 0.0005));
    if (cur >= 0 && nodeEls[cur]) nodeEls[cur].classList.add('is-current');
  }

  let names = [];
  let nums = [];
  const total = ctx.data.stops.length;

  function set(np, current, force) {
    p = np;
    if (!W) return;
    const x = rtl ? W - p * W : p * W;
    const dx = 3;
    const y = yAt(x);
    const ang = (Math.atan2(yAt(x + dx) - yAt(x - dx), dx * 2) * 180) / Math.PI;
    if (clip) {
      clip.setAttribute('x', rtl ? x.toFixed(1) : '0');
      clip.setAttribute('width', (rtl ? W - x : x).toFixed(1));
    }
    if (lastX !== null && !force) {
      wheel += ((x - lastX) / 11) * (180 / Math.PI) * (rtl ? -1 : 1);
      if (Math.abs(x - lastX) > 0.5 && !reduced) {
        car.classList.add('is-moving');
        clearTimeout(moveT);
        moveT = setTimeout(() => car.classList.remove('is-moving'), 160);
      }
    }
    lastX = x;
    car.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${ang.toFixed(2)}deg)`;
    car.style.setProperty('--w', `${wheel.toFixed(1)}deg`);
    nodeEls.forEach((b, i) => b.classList.toggle('is-reached', fr[i] <= p + 0.0005));
    if (current !== cur || force) {
      nodeEls[cur]?.classList.remove('is-current');
      cur = current;
      nodeEls[cur]?.classList.add('is-current');
    }
  }

  new ResizeObserver(() => build()).observe(inner);
  build();

  return {
    box: () => inner.getBoundingClientRect(),
    set: (np, current) => set(np, current),
    nodes(fractions, cards) {
      fr = fractions;
      names = cards.map((c) => c.name);
      nums = cards.map((c) => c.n);
      placeNodes();
      set(p, cur, true);
    },
    onJump(fn) {
      jump = fn;
    },
  };
}
