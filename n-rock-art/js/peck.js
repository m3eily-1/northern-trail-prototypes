// Petroglyph renderer. Anything (a drawn motif, a brand illustration, a line of
// Bukra text, a photo) becomes a field of pecked dots, the way rock art at
// Jubbah was made: the dark desert varnish is struck away to show paler stone.
// Output is a static canvas, so the runtime cost after rendering is zero.

export function rng(seed = 1) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------ motifs */
// Drawn by hand in the Jubbah manner: pecked bodies, stick legs, long horns.
// Each draws in its own unit box (w x h) with black ink on a transparent mask.

const S = (ctx, lw, d) => {
  ctx.lineWidth = lw;
  ctx.stroke(new Path2D(d));
};
const F = (ctx, d) => ctx.fill(new Path2D(d));
const C = (ctx, x, y, r) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};

function camel(ctx, ox = 0, oy = 0) {
  ctx.save();
  ctx.translate(ox, oy);
  F(ctx, 'M42,82 C40,60 58,44 78,46 C88,24 110,24 118,46 C128,50 135,58 139,70 L141,86 C112,97 70,97 42,82 Z');
  S(ctx, 11, 'M134,76 C150,72 158,60 160,36');
  S(ctx, 10, 'M156,36 L182,35');
  S(ctx, 4, 'M161,31 L163,24');
  S(ctx, 7, 'M56,88 L52,138 M70,90 L72,138 M112,92 L108,138 M128,88 L134,138');
  S(ctx, 4, 'M43,78 C34,86 32,96 34,108');
  ctx.restore();
}

export const MOTIFS = {
  camel: { w: 200, h: 150, draw: (c) => camel(c) },
  ibex: {
    w: 200,
    h: 150,
    draw(c) {
      c.beginPath();
      c.ellipse(92, 80, 44, 17, 0, 0, Math.PI * 2);
      c.fill();
      S(c, 10, 'M128,74 L144,52');
      S(c, 9, 'M142,52 L161,60');
      S(c, 6, 'M142,50 C134,14 102,6 84,26');
      S(c, 4, 'M147,50 C143,20 118,12 103,22');
      S(c, 6, 'M60,90 L56,136 M72,92 L76,136 M110,92 L106,136 M122,88 L128,136');
      S(c, 5, 'M50,74 L40,63');
      S(c, 3, 'M157,62 L155,71');
    }
  },
  figure: {
    w: 140,
    h: 180,
    draw(c) {
      C(c, 70, 26, 12);
      F(c, 'M61,42 L79,42 L93,112 L47,112 Z');
      S(c, 6, 'M64,50 L40,44 L31,12 M76,50 L100,44 L109,12');
      S(c, 7, 'M60,112 L54,168 M80,112 L86,168');
      S(c, 3, 'M31,12 L25,6 M31,12 L31,4 M109,12 L115,6 M109,12 L109,4');
    }
  },
  palm: {
    w: 180,
    h: 200,
    draw(c) {
      S(c, 11, 'M92,196 C88,150 96,110 92,78');
      S(
        c,
        6,
        'M92,76 C70,60 44,64 22,92 M92,76 C72,48 46,40 28,46 M92,76 C86,44 76,26 60,14 M92,76 C100,44 112,28 128,16 M92,76 C114,48 140,44 158,50 M92,76 C116,62 142,68 162,94'
      );
      C(c, 81, 92, 6);
      C(c, 103, 92, 6);
      C(c, 87, 102, 5);
      C(c, 98, 103, 5);
    }
  },
  rider: {
    w: 200,
    h: 176,
    draw(c) {
      camel(c, 0, 26);
      F(c, 'M90,52 L106,52 L104,26 L92,26 Z');
      C(c, 98, 16, 7.5);
      S(c, 4, 'M102,32 L126,20');
      S(c, 3, 'M120,8 L132,40');
    }
  },
  caravan: {
    w: 600,
    h: 150,
    draw(c) {
      camel(c, 0, 0);
      c.save();
      c.translate(200, 6);
      c.scale(0.94, 0.94);
      camel(c);
      c.restore();
      c.save();
      c.translate(392, 12);
      c.scale(0.86, 0.86);
      camel(c);
      c.restore();
      S(c, 3, 'M184,46 C196,58 206,70 236,76 M374,50 C390,60 400,70 428,76');
    }
  },
  // Tip markers (40 x 40 line icons)
  plane: {
    w: 40,
    h: 40,
    draw(c) {
      S(c, 3.4, 'M5,27 L35,12 M17,21 L22,34 L26,32 L23,18 M19,20 L14,8 L18,7 L26,16 M9,25 L6,18 L9,18 L13,23');
    }
  },
  temperature: {
    w: 40,
    h: 40,
    draw(c) {
      S(c, 3.4, 'M17,25 L17,7 L23,7 L23,25 M20,28 L20,14 M26,11 L30,11 M26,16 L29,16 M26,21 L30,21');
      C(c, 20, 30, 5.6);
    }
  },
  route: {
    w: 40,
    h: 40,
    draw(c) {
      S(c, 3.4, 'M8,33 C12,24 22,26 25,18 C27,14 28,13 30,12 M30,13 L30,3 M30,3.5 L37,6 L30,8.5');
      C(c, 8, 33, 3.2);
    }
  },
  clock: {
    w: 40,
    h: 40,
    draw(c) {
      c.lineWidth = 3.4;
      c.beginPath();
      c.arc(20, 20, 14, 0, Math.PI * 2);
      c.stroke();
      S(c, 3.4, 'M20,11 L20,20 L27,24');
    }
  },
  fuel: {
    w: 40,
    h: 40,
    draw(c) {
      S(c, 3.4, 'M9,35 L9,7 L24,7 L24,35 M12,11 L21,11 L21,18 L12,18 Z M24,15 C30,16 30,29 34,30 C35,24 34,14 31,9 M6,35 L27,35');
    }
  }
};

/* ------------------------------------------------------------ mask */

function makeMask(src, W, H, pad) {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const iw = W - pad * 2;
  const ih = H - pad * 2;
  if (src.kind === 'motif') {
    const m = MOTIFS[src.name];
    const k = Math.min(iw / m.w, ih / m.h);
    ctx.translate(pad + (iw - m.w * k) / 2, pad + (ih - m.h * k) / 2);
    if (src.flip) {
      ctx.translate(m.w * k, 0);
      ctx.scale(-1, 1);
    }
    ctx.scale(k, k);
    ctx.fillStyle = '#000';
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    m.draw(ctx);
  } else if (src.kind === 'text') {
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.direction = src.dir || 'ltr';
    let size = ih * (src.scale || 0.8);
    ctx.font = `${src.weight || 700} ${size}px ${src.family}`;
    const mw = ctx.measureText(src.text).width;
    if (mw > iw) {
      size *= iw / mw;
      ctx.font = `${src.weight || 700} ${size}px ${src.family}`;
    }
    ctx.fillText(src.text, W / 2, H / 2 + size * (src.dy || 0));
  } else {
    // img / stipple: fit (contain or cover)
    const img = src.img;
    const k = (src.cover ? Math.max : Math.min)(iw / img.naturalWidth, ih / img.naturalHeight);
    const dw = img.naturalWidth * k;
    const dh = img.naturalHeight * k;
    const fy = src.fy ?? 0.5;
    ctx.save();
    if (src.flip) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, pad + (iw - dw) / 2, pad + (ih - dh) * fy, dw, dh);
    ctx.restore();
  }
  return ctx.getImageData(0, 0, W, H);
}

/* ------------------------------------------------------------ peck */

const PALETTE = ['#f6dfb8', '#ecc999', '#ddb07a', '#f9ead0'];

// Returns { canvas, count, draw(from, to) }. Dots are ordered as a chisel would
// strike them: a sweep in the reading direction with some noise.
export function peck(canvas, src, o = {}) {
  const W = canvas.width;
  const H = canvas.height;
  const dpr = o.dpr || 1;
  const s = (o.spacing || 4.2) * dpr;
  const r = rng(o.seed || 7);
  const pad = Math.round((o.pad ?? 6) * dpr);
  const data = makeMask(src, W, H, pad).data;
  const mode = src.kind === 'img' ? 'icon' : src.kind === 'stipple' ? 'stipple' : 'shape';
  const k = Math.max(1, Math.round(s * 0.55));

  const A = (x, y) => {
    x = x < 0 ? 0 : x >= W ? W - 1 : x | 0;
    y = y < 0 ? 0 : y >= H ? H - 1 : y | 0;
    return data[(y * W + x) * 4 + 3] / 255;
  };
  const RGB = (x, y) => {
    x = x < 0 ? 0 : x >= W ? W - 1 : x | 0;
    y = y < 0 ? 0 : y >= H ? H - 1 : y | 0;
    const i = (y * W + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const lum = (p) => (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255;
  const diff = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] - b[3]) * 2;

  const xs = [];
  const ys = [];
  const rs = [];
  const cs = [];
  const push = (x, y, rad) => {
    xs.push(x);
    ys.push(y);
    rs.push(rad);
    cs.push((r() * PALETTE.length) | 0);
  };

  const interior = o.density ?? (mode === 'shape' ? 0.74 : 0.5);

  // pass 1: interior field
  for (let y = s / 2; y < H; y += s) {
    const row = Math.round(y / s) % 2 ? s / 2 : 0;
    for (let x = s / 2 + row * 0.5; x < W; x += s) {
      const px = x + (r() - 0.5) * s * 0.7;
      const py = y + (r() - 0.5) * s * 0.7;
      const p = RGB(px, py);
      if (p[3] < 128) continue;
      let prob;
      if (mode === 'shape') prob = interior;
      else if (mode === 'icon') prob = 0.08 + interior * Math.pow(lum(p), 1.4);
      else {
        // photos: peck the warm stone, leave the sky as varnish
        const warm = Math.min(1, Math.max(0, ((p[0] - p[2]) / 255) * 2.4));
        prob = Math.pow(warm, 1.1) * (0.3 + 0.7 * lum(p)) * (o.density ?? 1);
      }
      if (r() < prob) push(px, py, s * (0.34 + r() * 0.18));
    }
  }

  // pass 2: dense outlines (shape edges and colour edges inside illustrations)
  if (mode !== 'stipple') {
    const e = s * 0.62;
    for (let y = e / 2; y < H; y += e) {
      for (let x = e / 2; x < W; x += e) {
        const px = x + (r() - 0.5) * e * 0.5;
        const py = y + (r() - 0.5) * e * 0.5;
        let edge;
        if (mode === 'shape') {
          const a = A(px, py);
          if (a < 0.5) continue;
          edge = A(px + k, py) < 0.5 || A(px - k, py) < 0.5 || A(px, py + k) < 0.5 || A(px, py - k) < 0.5;
        } else {
          const c = RGB(px, py);
          if (c[3] < 128) continue;
          const t = o.edge ?? 70;
          edge =
            diff(c, RGB(px + k, py)) > t ||
            diff(c, RGB(px - k, py)) > t ||
            diff(c, RGB(px, py + k)) > t ||
            diff(c, RGB(px, py - k)) > t;
        }
        if (edge && r() < 0.92) push(px, py, s * (0.3 + r() * 0.14));
      }
    }
  }

  // chisel order
  const n = xs.length;
  const key = new Float32Array(n);
  const idx = new Uint32Array(n);
  for (let i = 0; i < n; i++) {
    const u = xs[i] / W;
    key[i] = (o.rtl ? 1 - u : u) * 0.7 + (ys[i] / H) * 0.08 + r() * 0.22;
    idx[i] = i;
  }
  idx.sort((a, b) => key[a] - key[b]);

  const ctx = canvas.getContext('2d');
  const shade = o.shade || 'rgba(14, 7, 3, 0.62)';
  function draw(from, to) {
    to = Math.min(n, to);
    if (to <= from) return;
    ctx.fillStyle = shade;
    ctx.beginPath();
    for (let j = from; j < to; j++) {
      const i = idx[j];
      const rad = rs[i];
      ctx.moveTo(xs[i] + rad * 0.45 + rad * 1.1, ys[i] + rad * 0.55);
      ctx.arc(xs[i] + rad * 0.45, ys[i] + rad * 0.55, rad * 1.1, 0, 6.2832);
    }
    ctx.fill();
    for (let c = 0; c < PALETTE.length; c++) {
      ctx.fillStyle = PALETTE[c];
      ctx.beginPath();
      for (let j = from; j < to; j++) {
        const i = idx[j];
        if (cs[i] !== c) continue;
        ctx.moveTo(xs[i] + rs[i], ys[i]);
        ctx.arc(xs[i], ys[i], rs[i], 0, 6.2832);
      }
      ctx.fill();
    }
  }
  return { canvas, count: n, draw };
}

// Draw progressively, as hammer blows: uneven bursts with tiny pauses.
export function animatePeck(job, ms = 1100, onStrike) {
  return new Promise((resolve) => {
    let done = 0;
    const t0 = performance.now();
    let lastBeat = -1;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      const beat = Math.floor(p * 22);
      // hammer rhythm: progress only advances on beats, with uneven chunk sizes
      const eased = 1 - Math.pow(1 - p, 1.6);
      const target = Math.floor(job.count * Math.min(1, Math.ceil(eased * 22) / 22));
      if (beat !== lastBeat || p === 1) {
        job.draw(done, target);
        done = target;
        if (beat !== lastBeat && onStrike) onStrike(beat);
        lastBeat = beat;
      }
      if (p < 1) requestAnimationFrame(tick);
      else {
        job.draw(done, job.count);
        resolve();
      }
    };
    requestAnimationFrame(tick);
  });
}
