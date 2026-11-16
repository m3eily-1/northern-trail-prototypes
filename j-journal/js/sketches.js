// Hand-drawn line art, generated as SVG paths with a seeded wobble so every
// stroke looks inked by hand. All paths use pathLength="1" so they can be
// drawn with stroke-dashoffset (scrubbed by scroll or time-based CSS).

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

export function makePen(seed = 1, wobble = 0.7) {
  const r = rng(seed);
  const jit = () => (r() - 0.5) * 2 * wobble;
  const J = (pts) => pts.map(([x, y]) => [x + jit(), y + jit()]);

  // Straight strokes with a slight bow per segment and a small overshoot.
  function line(pts, close = false) {
    const P = J(pts);
    if (close) P.push([P[0][0] + jit() * 0.6, P[0][1] + jit() * 0.6]);
    if (!close && P.length > 1) {
      const [a, b] = P;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const o = Math.min(1.4, len * 0.08);
      P[0] = [a[0] - ((b[0] - a[0]) / len) * o, a[1] - ((b[1] - a[1]) / len) * o];
    }
    let d = `M${f(P[0][0])} ${f(P[0][1])}`;
    for (let i = 1; i < P.length; i++) {
      const [x0, y0] = P[i - 1];
      const [x1, y1] = P[i];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const nx = -(y1 - y0) / len;
      const ny = (x1 - x0) / len;
      const b = (r() - 0.5) * Math.min(len * 0.05, 1.8);
      d += ` Q${f((x0 + x1) / 2 + nx * b)} ${f((y0 + y1) / 2 + ny * b)} ${f(x1)} ${f(y1)}`;
    }
    return d;
  }

  // Smooth Catmull-Rom curve through points.
  function curve(pts, close = false) {
    let P = J(pts);
    if (close) P = [...P, P[0], P[1]];
    let d = `M${f(P[0][0])} ${f(P[0][1])}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i];
      const p1 = P[i];
      const p2 = P[i + 1];
      const p3 = P[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }

  // Loose hand-drawn circle that overshoots its start.
  function circle(cx, cy, rad, turns = 1.08) {
    const n = 12;
    const pts = [];
    const a0 = r() * Math.PI * 2;
    for (let i = 0; i <= n * turns; i++) {
      const a = a0 + (i / n) * Math.PI * 2;
      const k = 1 + (r() - 0.5) * 0.08;
      pts.push([cx + Math.cos(a) * rad * k, cy + Math.sin(a) * rad * k]);
    }
    return curve(pts);
  }

  return { line, curve, circle, r };
}

/* ---------------- motifs ----------------
   Each motif: (pen, x, y, s) with (x, y) = ground point, s = scale.
   Local coordinates: y goes up as negative. Returns an array of path d. */

const tf = (x, y, s) => (pts) => pts.map(([px, py]) => [x + px * s, y + py * s]);

function tri(T, pen, cx, cy, w = 5) {
  return pen.line(T([[cx - w / 2, cy + w * 0.4], [cx, cy - w * 0.55], [cx + w / 2, cy + w * 0.4]]), true);
}

function crenels(T, pen, x0, x1, y, teeth, hgt = 6) {
  const pts = [];
  const step = (x1 - x0) / teeth;
  for (let k = 0; k < teeth; k++) {
    pts.push([x0 + k * step, y], [x0 + k * step + step / 2, y - hgt]);
  }
  pts.push([x1, y]);
  return pen.line(T(pts));
}

export const motifs = {
  tower(pen, x, y, s = 1, h = 100) {
    const T = tf(x, y, s);
    const bw = 17;
    const tw = 11;
    const out = [];
    out.push(pen.line(T([[-bw, 0], [-tw, -h], [tw, -h], [bw, 0]])));
    out.push(crenels(T, pen, -tw, tw, -h, 4, 7));
    const yb = -h * 0.6;
    const wb = bw - (bw - tw) * 0.6;
    out.push(pen.line(T([[-wb, yb], [wb, yb]])));
    for (let k = 0; k < 4; k++) out.push(tri(T, pen, -wb + 3 + k * ((2 * wb - 6) / 3), yb + 5, 3.4));
    out.push(tri(T, pen, 0, -h * 0.82, 5));
    out.push(tri(T, pen, -5, -h * 0.4, 4.5));
    out.push(tri(T, pen, 5, -h * 0.4, 4.5));
    out.push(pen.line(T([[-4, 0], [-4, -13], [4, -13], [4, 0]])));
    out.push(pen.line(T([[-bw + 3, -h * 0.18], [-bw + 9, -h * 0.18]])));
    out.push(pen.line(T([[bw - 10, -h * 0.28], [bw - 4, -h * 0.28]])));
    return out;
  },

  houses(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    const boxes = [
      { x0: -60, x1: -22, h: 42 },
      { x0: -22, x1: 18, h: 60 },
      { x0: 18, x1: 58, h: 36 }
    ];
    const prof = [[boxes[0].x0, 0]];
    for (const b of boxes) prof.push([b.x0, -b.h], [b.x1, -b.h]);
    prof.push([boxes[boxes.length - 1].x1, 0]);
    const out = [pen.line(T(prof))];
    for (const b of boxes) {
      out.push(crenels(T, pen, b.x0, b.x0 + 8, -b.h, 2, 5));
      out.push(crenels(T, pen, b.x1 - 8, b.x1, -b.h, 2, 5));
      const cy = -b.h + 13;
      const n = b.x1 - b.x0 > 38 ? 3 : 2;
      for (let k = 0; k < n; k++) out.push(tri(T, pen, b.x0 + ((k + 1) * (b.x1 - b.x0)) / (n + 1), cy, 4.2));
    }
    out.push(pen.line(T([[-7, 0], [-7, -18], [5, -18], [5, 0]])));
    out.push(pen.line(T([[-52, -16], [-44, -16]])));
    out.push(pen.line(T([[30, -12], [40, -12]])));
    return out;
  },

  palm(pen, x, y, s = 1, h = 80, lean = 8) {
    const T = tf(x, y, s);
    const top = [lean, -h];
    const out = [];
    out.push(pen.curve(T([[0, 0], [lean * 0.15, -h * 0.35], [lean * 0.55, -h * 0.7], top])));
    out.push(pen.curve(T([[5, 0], [lean * 0.15 + 4, -h * 0.35], [lean * 0.55 + 3, -h * 0.7], [lean + 2.5, -h + 1]])));
    for (let k = 1; k <= 5; k++) {
      const t = k / 6;
      const cx = lean * t * t * 0.9 + lean * 0.1 * t;
      out.push(pen.line(T([[cx - 0.5, -h * t + 1.5], [cx + 4.5, -h * t - 1]])));
    }
    const fronds = [
      [-40, 12, -12], [-30, -6, -14], [-12, -24, -8], [14, -24, -8],
      [32, -6, -14], [42, 12, -12], [-22, 20, -2], [26, 20, -2]
    ];
    for (const [dx, dy, lift] of fronds) {
      const mid = [top[0] + dx * 0.5, top[1] + Math.min(dy, 0) * 0.5 + lift];
      out.push(pen.curve(T([top, mid, [top[0] + dx, top[1] + dy]])));
    }
    return out;
  },

  dunes(pen, x, y, s = 1, w = 200) {
    const T = tf(x, y, s);
    return [
      pen.curve(T([[-w / 2, -8], [-w * 0.27, -34], [-w * 0.05, -20], [w * 0.2, -42], [w / 2, -16]])),
      pen.curve(T([[-w / 2, 0], [-w * 0.3, -14], [0, -6], [w * 0.3, -20], [w / 2, -4]])),
      pen.line(T([[-w * 0.24, -30], [-w * 0.2, -22]])),
      pen.line(T([[-w * 0.2, -31], [-w * 0.15, -24]])),
      pen.line(T([[w * 0.22, -38], [w * 0.27, -30]])),
      pen.line(T([[w * 0.27, -37], [w * 0.32, -30]]))
    ];
  },

  mountains(pen, x, y, s = 1, w = 200) {
    const T = tf(x, y, s);
    return [
      pen.line(T([[-w / 2, 0], [-w * 0.32, -46], [-w * 0.22, -34], [-w * 0.05, -78], [w * 0.08, -52], [w * 0.2, -66], [w * 0.36, -28], [w / 2, 0]])),
      pen.line(T([[-w * 0.05, -78], [-w * 0.02, -56], [-w * 0.08, -40], [-w * 0.03, -22]])),
      pen.line(T([[w * 0.2, -66], [w * 0.17, -48], [w * 0.23, -34]])),
      pen.line(T([[-w * 0.32, -46], [-w * 0.3, -30]])),
      pen.line(T([[w * 0.02, -46], [w * 0.06, -38]])),
      pen.line(T([[w * 0.05, -40], [w * 0.09, -32]]))
    ];
  },

  mesa(pen, x, y, s = 1, w = 210) {
    const T = tf(x, y, s);
    return [
      pen.line(T([[-w / 2, 0], [-w * 0.42, -26], [-w * 0.32, -52], [w * 0.1, -56], [w * 0.18, -48], [w * 0.3, -50], [w * 0.4, -22], [w / 2, 0]])),
      pen.curve(T([[-w * 0.3, -44], [-w * 0.18, -45], [-w * 0.06, -44]])),
      pen.curve(T([[w * 0.04, -43], [w * 0.16, -42], [w * 0.28, -41]])),
      pen.curve(T([[-w * 0.36, -30], [-w * 0.22, -31], [-w * 0.1, -30]])),
      pen.curve(T([[w * 0.12, -28], [w * 0.24, -29], [w * 0.36, -27]])),
      pen.curve(T([[-w * 0.2, -14], [-w * 0.04, -15], [w * 0.1, -13]])),
      pen.curve(T([[-w * 0.48, 0], [-w * 0.44, -6], [-w * 0.38, -7], [-w * 0.34, 0]])),
      pen.curve(T([[w * 0.36, 0], [w * 0.4, -8], [w * 0.46, -6], [w * 0.49, 0]]))
    ];
  },

  rock(pen, x, y, s = 1, w = 150, h = 92) {
    const T = tf(x, y, s);
    return [
      pen.curve(T([[-w / 2, 0], [-w * 0.48, -h * 0.5], [-w * 0.3, -h * 0.9], [0, -h], [w * 0.3, -h * 0.86], [w * 0.48, -h * 0.45], [w / 2, 0]])),
      pen.line(T([[w * 0.3, -h * 0.86], [w * 0.22, -h * 0.6], [w * 0.28, -h * 0.4]])),
      pen.line(T([[-w * 0.38, -h * 0.3], [-w * 0.3, -h * 0.18]]))
    ];
  },

  carvings(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    const out = [];
    // camel
    out.push(pen.curve(T([[-30, -30], [-26, -38], [-21, -35], [-17, -40], [-11, -33], [-9, -31]])));
    out.push(pen.line(T([[-28, -31], [-29, -20]])));
    out.push(pen.line(T([[-24, -31], [-23, -20]])));
    out.push(pen.line(T([[-14, -32], [-15, -20]])));
    out.push(pen.line(T([[-10, -31], [-9, -20]])));
    out.push(pen.line(T([[-9, -31], [-4, -42], [0, -43]])));
    // ibex
    out.push(pen.line(T([[8, -48], [24, -48]])));
    out.push(pen.line(T([[10, -48], [9, -40]])));
    out.push(pen.line(T([[14, -48], [14, -40]])));
    out.push(pen.line(T([[19, -48], [19, -40]])));
    out.push(pen.line(T([[23, -48], [24, -40]])));
    out.push(pen.line(T([[24, -48], [28, -53]])));
    out.push(pen.curve(T([[27, -53], [28, -61], [23, -66], [17, -64]])));
    // figure with raised arms
    out.push(pen.circle(...T([[16, -32]])[0], 2.6 * s, 1));
    out.push(pen.line(T([[16, -29], [16, -18]])));
    out.push(pen.line(T([[9, -32], [12, -25], [16, -26], [20, -25], [23, -32]])));
    out.push(pen.line(T([[12, -12], [16, -18], [20, -12]])));
    return out;
  },

  fortHill(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    const out = [];
    out.push(pen.curve(T([[-92, 0], [-62, -24], [-30, -42], [0, -48], [32, -44], [62, -24], [92, 0]])));
    out.push(pen.line(T([[-34, -46], [-34, -70], [34, -70], [34, -45]])));
    out.push(crenels(T, pen, -26, 26, -70, 6, 5));
    out.push(pen.line(T([[-42, -45], [-42, -84], [-26, -84], [-26, -70]])));
    out.push(crenels(T, pen, -42, -26, -84, 2, 5));
    out.push(pen.line(T([[26, -70], [26, -84], [42, -84], [42, -44]])));
    out.push(crenels(T, pen, 26, 42, -84, 2, 5));
    out.push(pen.curve(T([[-6, -46], [-6, -56], [0, -60], [6, -56], [6, -46]])));
    out.push(tri(T, pen, -34, -76, 4));
    out.push(tri(T, pen, 34, -76, 4));
    out.push(pen.line(T([[-70, -10], [-60, -14]])));
    out.push(pen.line(T([[54, -16], [64, -12]])));
    return out;
  },

  saltpans(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    const out = [];
    for (let i = 0; i < 3; i++) {
      const x0 = -96 + i * 64;
      out.push(pen.line(T([[x0, -4], [x0 + 54, -4], [x0 + 60, -18], [x0 + 6, -18]]), true));
    }
    out.push(pen.line(T([[-90, -18], [-78, -40], [-66, -18]])));
    out.push(pen.line(T([[-26, -18], [-12, -48], [2, -18]])));
    out.push(pen.line(T([[38, -18], [50, -36], [62, -18]])));
    out.push(pen.line(T([[-20, -30], [-10, -30]])));
    out.push(pen.line(T([[44, -26], [52, -26]])));
    for (const [cx, cy] of [[-40, -56], [24, -52], [82, -36]]) {
      out.push(pen.line(T([[cx - 4, cy], [cx + 4, cy]])));
      out.push(pen.line(T([[cx, cy - 4], [cx, cy + 4]])));
    }
    return out;
  },

  sun(pen, x, y, s = 1, rad = 12) {
    const T = tf(x, y, s);
    const out = [pen.circle(x, y, rad * s)];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2 + 0.2;
      out.push(pen.line(T([[Math.cos(a) * (rad + 4), Math.sin(a) * (rad + 4)], [Math.cos(a) * (rad + 10), Math.sin(a) * (rad + 10)]])));
    }
    return out;
  },

  dallah(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    const out = [];
    out.push(pen.line(T([[-17, 0], [17, 0]])));
    out.push(pen.curve(T([[-14, 0], [-19, -14], [-13, -30], [-7, -38]])));
    out.push(pen.curve(T([[14, 0], [19, -14], [13, -30], [7, -38]])));
    out.push(pen.line(T([[-7, -38], [-6, -48]])));
    out.push(pen.line(T([[7, -38], [6, -48]])));
    out.push(pen.curve(T([[-9, -48], [-5, -56], [0, -61], [5, -56], [9, -48]])));
    out.push(pen.line(T([[-9, -48], [9, -48]])));
    out.push(pen.line(T([[0, -61], [0, -66]])));
    out.push(pen.circle(...T([[0, -68]])[0], 2.2 * s, 1));
    out.push(pen.curve(T([[-13, -30], [-24, -42], [-34, -57], [-41, -62]])));
    out.push(pen.curve(T([[-16, -20], [-27, -35], [-36, -53], [-41, -62]])));
    out.push(pen.curve(T([[12, -33], [26, -32], [28, -18], [17, -8]])));
    out.push(pen.line(T([[-17, -14], [17, -14]])));
    // finjan cup
    out.push(pen.curve(T([[38, -14], [40, -3], [52, -3], [54, -14]])));
    out.push(pen.line(T([[37, -14], [55, -14]])));
    // steam
    out.push(pen.curve(T([[44, -20], [41, -26], [46, -32], [43, -38]])));
    out.push(pen.curve(T([[49, -20], [46, -27], [51, -33], [48, -40]])));
    return out;
  },

  arches(pen, x, y, s = 1, n = 4, w = 36) {
    const T = tf(x, y, s);
    const out = [];
    const x0 = (-n * w) / 2;
    out.push(pen.line(T([[x0, 0], [x0, -60], [-x0, -60], [-x0, 0]])));
    out.push(crenels(T, pen, x0, -x0, -60, n * 2, 6));
    for (let i = 0; i < n; i++) {
      const a = x0 + i * w + 5;
      const b = a + w - 10;
      const c = (a + b) / 2;
      out.push(pen.curve(T([[a, 0], [a, -28], [a + 4, -38], [c, -44], [b - 4, -38], [b, -28], [b, 0]])));
    }
    out.push(pen.line(T([[x0 + 6, -8], [x0 + 26, -8], [x0 + 26, 0]])));
    out.push(pen.line(T([[-x0 - 30, -10], [-x0 - 8, -10], [-x0 - 8, 0]])));
    return out;
  },

  moon(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    const out = [];
    const arc = (cx, cy, rad, a0, a1, n = 8) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
      }
      return pts;
    };
    out.push(pen.curve(T(arc(0, 0, 14, 0.9, 5.4))));
    out.push(pen.curve(T(arc(6, -3, 11, 1.55, 4.75))));
    return out;
  },

  star(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    const pts = [];
    for (let i = 0; i <= 5; i++) {
      const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
      pts.push([Math.cos(a) * 6, Math.sin(a) * 6]);
    }
    return [pen.line(T(pts))];
  },

  birds(pen, x, y, s = 1) {
    const T = tf(x, y, s);
    return [
      pen.curve(T([[-7, 0], [-4, -3], [0, 0]])),
      pen.curve(T([[0, 0], [4, -3], [7, 0]])),
      pen.curve(T([[10, -8], [13, -10], [15, -8]])),
      pen.curve(T([[15, -8], [17, -10], [20, -8]]))
    ];
  },

  furrows(pen, x, y, s = 1, w = 200) {
    const T = tf(x, y, s);
    const out = [];
    for (let i = 0; i < 6; i++) {
      const xb = -w / 2 + (i * w) / 5;
      out.push(pen.line(T([[xb, 0], [xb * 0.3, -18]])));
    }
    out.push(pen.line(T([[-w * 0.3, -18], [w * 0.3, -18]])));
    return out;
  },

  ground(pen, x0, x1, y) {
    const pts = [];
    const n = 6;
    for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, y + (pen.r() - 0.5) * 2]);
    const out = [pen.curve(pts)];
    for (let k = 0; k < 3; k++) {
      const gx = x0 + 14 + pen.r() * (x1 - x0 - 28);
      out.push(pen.line([[gx, y + 1], [gx - 2, y - 5]]));
      out.push(pen.line([[gx + 3, y + 1], [gx + 4, y - 6]]));
    }
    return out;
  }
};

/* ---------------- compositions ---------------- */

const G = 146; // ground line in the 240 x 160 sketch box

const compositions = {
  riyadh: (p) => [...motifs.ground(p, 8, 232, G), ...motifs.houses(p, 82, G, 0.9), ...motifs.tower(p, 160, G, 1, 104), ...motifs.palm(p, 204, G, 0.85, 80, 4), ...motifs.birds(p, 40, 42)],
  thadiq: (p) => [...motifs.ground(p, 8, 232, G), ...motifs.mesa(p, 150, G, 0.8), ...motifs.tower(p, 34, G, 0.72, 96), ...motifs.birds(p, 120, 46)],
  'al-qasab': (p) => [...motifs.ground(p, 8, 232, G), ...motifs.saltpans(p, 120, G, 1), ...motifs.sun(p, 200, 34, 1, 11)],
  shaqra: (p) => [...motifs.ground(p, 8, 232, G), ...motifs.houses(p, 110, G, 1.1), ...motifs.palm(p, 214, G, 0.8, 80, -8), ...motifs.birds(p, 60, 36)],
  ushaiqer: (p) => [...motifs.ground(p, 8, 232, G), ...motifs.palm(p, 30, G, 0.8, 80, 8), ...motifs.houses(p, 104, G, 0.95), ...motifs.tower(p, 186, G, 0.9, 112)],
  'al-majmaah': (p) => [...motifs.ground(p, 8, 232, G), ...motifs.houses(p, 64, G, 0.75), ...motifs.tower(p, 132, G, 1.05, 110), ...motifs.houses(p, 196, G, 0.6)],
  'al-ghat': (p) => [...motifs.mountains(p, 132, G - 4, 1.05), ...motifs.ground(p, 8, 232, G), ...motifs.houses(p, 112, G, 0.7), ...motifs.palm(p, 36, G, 0.8, 78, 6)],
  'al-zulfi': (p) => [...motifs.dunes(p, 132, G, 1.05), ...motifs.palm(p, 40, G, 0.85, 82, 8), ...motifs.palm(p, 70, G, 0.6, 76, -6), ...motifs.sun(p, 196, 40, 1, 10)],
  'al-mithnab': (p) => [...motifs.furrows(p, 120, G + 6, 1.1), ...motifs.ground(p, 8, 232, G - 12), ...motifs.palm(p, 60, G - 12, 0.75, 84, 6), ...motifs.palm(p, 120, G - 12, 0.9, 84, -4), ...motifs.palm(p, 182, G - 12, 0.7, 84, 8)],
  unaizah: (p) => [...motifs.ground(p, 30, 210, G), ...motifs.dallah(p, 100, G, 1.3)],
  'ar-rass': (p) => [...motifs.ground(p, 8, 232, G), ...motifs.tower(p, 120, G, 1.15, 112), ...motifs.houses(p, 46, G, 0.5), ...motifs.birds(p, 186, 40)],
  buraydah: (p) => [...motifs.ground(p, 8, 232, G), ...motifs.arches(p, 112, G, 1, 4, 38), ...motifs.palm(p, 218, G, 0.7, 80, -6)],
  'al-bukayriyah': (p) => [...motifs.ground(p, 8, 232, G), ...motifs.houses(p, 92, G, 1), ...motifs.palm(p, 192, G, 0.8, 80, -4), ...motifs.star(p, 200, 34), ...motifs.star(p, 222, 52, 0.7)],
  'uyun-al-jiwa': (p) => [...motifs.ground(p, 8, 232, G), ...motifs.rock(p, 110, G, 1.05), ...motifs.moon(p, 196, 40, 1.2), ...motifs.star(p, 160, 24, 0.8), ...motifs.star(p, 222, 76, 0.6), ...motifs.star(p, 30, 40, 0.7)],
  hail: (p) => [...motifs.mountains(p, 66, G - 2, 0.6), ...motifs.mountains(p, 188, G - 2, 0.55), ...motifs.ground(p, 8, 232, G), ...motifs.fortHill(p, 124, G, 1.05)],
  jubbah: (p) => [...motifs.ground(p, 8, 232, G), ...motifs.rock(p, 120, G, 1.25, 150, 96), ...motifs.carvings(p, 116, G, 1.35)]
};

const regionArt = {
  riyadh: (p) => [...motifs.ground(p, 8, 232, G), ...motifs.houses(p, 76, G, 0.9), ...motifs.tower(p, 156, G, 1.05, 110), ...motifs.palm(p, 210, G, 0.85, 82, -6), ...motifs.sun(p, 44, 40, 1, 10)],
  qassim: (p) => [...motifs.furrows(p, 120, G + 6, 1.1), ...motifs.ground(p, 8, 232, G - 12), ...motifs.palm(p, 52, G - 12, 0.8, 84, 6), ...motifs.palm(p, 116, G - 12, 0.95, 88, -4), ...motifs.palm(p, 184, G - 12, 0.75, 84, 8), ...motifs.sun(p, 206, 32, 1, 9)],
  hail: (p) => [...motifs.mountains(p, 120, G - 2, 1.1), ...motifs.ground(p, 8, 232, G), ...motifs.rock(p, 186, G, 0.55, 150, 92), ...motifs.birds(p, 50, 40)]
};

function hashKey(k) {
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619);
  return h >>> 0;
}

// Render a list of path data into an SVG string; each path carries a draw
// start (--s) so strokes ink one after another as --d runs 0 to 1.
export function renderPaths(list, { viewBox = '0 0 240 160', cls = 'sketch', label = '' } = {}) {
  const n = list.length;
  const paths = list
    .map((d, i) => `<path d="${d}" pathLength="1" style="--s:${((i / Math.max(1, n - 1)) * 0.62).toFixed(3)}"/>`)
    .join('');
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="${cls}" viewBox="${viewBox}" ${aria} focusable="false">${paths}</svg>`;
}

export function stopSketch(key) {
  const build = compositions[key] || compositions.riyadh;
  return renderPaths(build(makePen(hashKey(key))));
}

export function regionSketch(key) {
  const build = regionArt[key] || regionArt.riyadh;
  return renderPaths(build(makePen(hashKey('region-' + key))), { cls: 'sketch sketch--region' });
}

// Small margin doodles (stars, loops, arrows) drawn on enter.
export function doodle(kind, seed = 1) {
  const p = makePen(seed, 0.5);
  let list;
  if (kind === 'star') list = motifs.star(p, 12, 12, 1.4);
  else if (kind === 'loop') list = [p.curve([[2, 18], [10, 6], [18, 14], [12, 20], [8, 12], [16, 4], [26, 8]])];
  else if (kind === 'arrow') list = [p.curve([[4, 4], [8, 12], [9, 20]]), p.line([[4, 16], [9, 21], [14, 15]])];
  else list = [p.line([[4, 12], [20, 12]]), p.line([[12, 4], [12, 20]])];
  return renderPaths(list, { viewBox: '0 0 28 24', cls: `doodle doodle--${kind}` });
}

// Curved margin arrow pointing at the heading.
export function marginArrow(seed = 1) {
  const p = makePen(seed, 0.5);
  return renderPaths([p.curve([[4, 34], [14, 18], [30, 10], [52, 12]]), p.line([[44, 4], [53, 12], [45, 20]])], {
    viewBox: '0 0 60 40',
    cls: 'marrow'
  });
}

// Signature scribble for the closing page.
export function signature() {
  const p = makePen(77, 0.4);
  return renderPaths(
    [
      p.curve([[6, 40], [22, 14], [30, 30], [40, 18], [52, 36], [64, 16], [80, 28], [96, 22], [130, 26], [176, 20], [234, 24]]),
      p.curve([[150, 38], [190, 34], [230, 36]])
    ],
    { viewBox: '0 0 240 50', cls: 'signature' }
  );
}
