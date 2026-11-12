// Scene definitions: each diorama is a stack of paper layers (back to front),
// pop-up illustrations on stands, and hotspot positions for the region's stops.
// Colours are the brand palette plus tints/shades of it.
import { ridge, jag, circle, cloud, palm, acacia, najdi, tower, fort, shrubs, blob, stars } from './paper.js';

const C = {
  cream: '#fff5c8',
  stone: '#ebe6d2',
  sand100: '#f6dfa8',
  sand200: '#ecc47e',
  sand300: '#dca55c',
  sand: '#c88c3c',
  sand600: '#a86a32',
  sandDark: '#824628',
  sand900: '#5e321c',
  green200: '#a9b27a',
  green300: '#8e9858',
  green: '#5a6432',
  green800: '#3f4723',
  lav100: '#efe3f2',
  lav200: '#d8c3e0',
  lav300: '#c4a3d1',
  lav: '#a06eb4',
  lav700: '#74508a',
};

const range = (a, b, n) => Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));

function palms(xs, base, h, s, seed) {
  return xs.map((x, i) => palm(x, base + (i % 2) * 8, h + ((i * 37) % 60), ((i % 3) - 1) * 14, s, seed + i)).join('');
}

function town(x0, x1, base, seed) {
  let d = '';
  let x = x0;
  let i = 0;
  while (x < x1) {
    const w = 70 + ((i * 53 + seed) % 70);
    const h = 70 + ((i * 89 + seed * 3) % 110);
    d += najdi(x, base, w, h, seed + i);
    x += w - 6;
    i++;
  }
  return d;
}

export const SCENES = {
  riyadh: {
    layers: [
      { sky: true, parts: [
        { fill: C.cream, d: 'M-200,-200H1800V1100H-200Z' },
        { fill: C.sand100, d: circle(1180, 250, 92) },
        { fill: '#fffbe6', d: cloud(330, 200, 250) + cloud(860, 130, 170) },
      ] },
      { extra: true, parts: [{ fill: '#f1d394', d: jag([[-60, 560], [160, 548], [210, 520], [560, 524], [610, 500], [960, 506], [1010, 540], [1300, 532], [1360, 506], [1660, 514]]) }] },
      { parts: [{ fill: '#e4ad5e', d: ridge([[-60, 650], [200, 606], [440, 652], [720, 596], [990, 642], [1250, 600], [1660, 648]]) }] },
      { parts: [{ fill: C.sand, d: ridge([[-60, 738], [320, 722], [760, 734], [1150, 720], [1660, 738]]) + town(250, 1380, 744, 3) + tower(560, 744, 66, 270) + tower(1010, 744, 58, 236) }] },
      { extra: true, parts: [
        { fill: C.green, d: palms([130, 230, 330, 1240, 1350, 1470], 850, 200, 1.2, 20) },
        { fill: C.sand600, d: ridge([[-60, 820], [300, 806], [700, 822], [1100, 806], [1660, 818]]) },
      ] },
      { parts: [{ fill: '#8f5229', d: ridge([[-60, 872], [260, 830], [580, 880], [910, 834], [1220, 884], [1660, 840]]) }] },
      { parts: [{ fill: '#6b3a21', d: ridge([[-60, 948], [320, 918], [720, 952], [1040, 926], [1420, 956], [1660, 930]]) + shrubs(120, 1500, 930, 9, 40, 1) }] },
    ],
    popups: [
      { src: 'assets/img/icon-4.png', x: 3, b: 5, w: 15, z: 1 },
      { src: 'assets/img/sticker-thadiq.webp', x: 45, b: 9, w: 9.5, z: 1, sticker: true, tilt: -5 },
      { src: 'assets/img/icon-2.png', x: 82, b: 6, w: 11, z: 1 },
    ],
    spots: { x: [9, 20, 31, 42, 53, 64, 75, 86], y: [62, 48, 60, 46, 58, 44, 56, 42] },
  },

  qassim: {
    layers: [
      { sky: true, parts: [
        { fill: C.stone, d: 'M-200,-200H1800V1100H-200Z' },
        { fill: C.sand100, d: circle(400, 300, 104) },
        { fill: '#f7f3e4', d: cloud(980, 190, 230) + cloud(1300, 290, 150) },
      ] },
      { extra: true, parts: [{ fill: C.lav200, d: ridge([[-60, 606], [280, 560], [640, 612], [1000, 566], [1340, 604], [1660, 560]]) }] },
      { parts: [
        { fill: C.green200, d: ridge([[-60, 664], [400, 640], [800, 668], [1200, 636], [1660, 662]]) },
        { fill: C.green300, d: range(-40, 1600, 16).map((x) => `M${x},1060L${x + 40},660L${x + 58},660L${x + 18},1060Z`).join('') },
      ] },
      { parts: [{ fill: C.sand, d: ridge([[-60, 768], [360, 752], [800, 764], [1200, 750], [1660, 766]]) + town(240, 960, 772, 7) + tower(1150, 772, 74, 300) + town(1210, 1420, 772, 11) }] },
      { extra: true, parts: [{ fill: C.green, d: palms([80, 180, 280, 380, 1120, 1220, 1320, 1420, 1520], 868, 190, 1.1, 60) }] },
      { parts: [{ fill: C.sand600, d: ridge([[-60, 880], [300, 852], [640, 886], [980, 856], [1300, 888], [1660, 860]]) }] },
      { parts: [{ fill: C.green800, d: ridge([[-60, 950], [360, 930], [760, 956], [1120, 934], [1660, 952]]) + shrubs(100, 1520, 934, 11, 70, 1.1) }] },
    ],
    popups: [
      { src: 'assets/img/icon-5.png', x: 2, b: 5, w: 17, z: 1 },
      { src: 'assets/img/sticker-qassim.webp', x: 30, b: 9, w: 9, z: 1, sticker: true, tilt: 4 },
      { src: 'assets/img/sticker-buraydah.webp', x: 58, b: 8, w: 9, z: 1, sticker: true, tilt: -4 },
      { src: 'assets/img/icon-2.png', x: 84, b: 6, w: 10, z: 1 },
    ],
    spots: { x: [12, 27, 42, 57, 72, 87], y: [60, 46, 58, 44, 56, 42] },
  },

  hail: {
    layers: [
      { sky: true, parts: [
        { fill: C.lav100, d: 'M-200,-200H1800V1100H-200Z' },
        { fill: '#f4cf92', d: circle(1090, 420, 140) },
      ] },
      { parts: [{ fill: C.lav300, d: jag([[-60, 520], [120, 430], [230, 482], [370, 352], [490, 452], [630, 398], [770, 472], [910, 372], [1050, 462], [1210, 344], [1350, 440], [1490, 388], [1660, 470]]) }] },
      { parts: [{ fill: C.lav, d: jag([[-60, 606], [150, 520], [300, 584], [450, 506], [610, 590], [780, 540], [960, 600], [1130, 512], [1300, 590], [1460, 530], [1660, 600]]) }] },
      { parts: [{ fill: C.sand600, d: ridge([[-60, 760], [240, 700], [520, 744], [780, 690], [1040, 742], [1340, 700], [1660, 752]]) + fort(700, 700, 200, 120) }] },
      { extra: true, parts: [
        { fill: C.sandDark, d: blob(180, 830, 120, 70, 3) + blob(300, 860, 80, 50, 8) + blob(1360, 840, 130, 76, 12) + blob(1490, 870, 90, 54, 17) },
        { fill: C.green800, d: acacia(1180, 880, 120, 190, 4) + acacia(420, 900, 96, 150, 9) },
      ] },
      { parts: [{ fill: C.sand900, d: ridge([[-60, 904], [300, 874], [660, 910], [1000, 880], [1340, 914], [1660, 886]]) + shrubs(140, 1480, 900, 7, 90, 0.9) }] },
    ],
    popups: [
      { src: 'assets/img/icon-1.png', x: 3, b: 5, w: 17, z: 1 },
      { src: 'assets/img/sticker-hail.webp', x: 34, b: 8, w: 10, z: 1, sticker: true, tilt: -4 },
      { src: 'assets/img/sticker-jubbah.webp', x: 55, b: 9, w: 10, z: 1, sticker: true, tilt: 5 },
      { src: 'assets/img/icon-6.png', x: 79, b: 5, w: 13, z: 1 },
    ],
    spots: { x: [30, 68], y: [52, 42] },
  },
};

// Night scene for the closing
export const NIGHT = {
  stars: stars(70, 13, 560),
  layers: [
    { sky: true, parts: [
      { fill: '#2a2236', d: 'M-200,-200H1800V1100H-200Z' },
      { fill: C.cream, d: circle(1260, 200, 46) },
    ] },
    { parts: [{ fill: '#4d3b62', d: jag([[-60, 640], [160, 570], [300, 612], [470, 540], [640, 610], [820, 566], [1000, 626], [1180, 552], [1360, 612], [1660, 574]]) }] },
    { extra: true, parts: [{ fill: '#3d2f50', d: ridge([[-60, 740], [300, 700], [660, 744], [1000, 706], [1340, 742], [1660, 712]]) }] },
    { parts: [{ fill: '#2f2440', d: ridge([[-60, 830], [340, 800], [760, 836], [1160, 806], [1660, 832]]) + palms([110, 210, 1320, 1430, 1530], 840, 230, 1.1, 120) }] },
    { parts: [{ fill: '#1c1524', d: ridge([[-60, 940], [380, 912], [800, 946], [1200, 918], [1660, 944]]) + shrubs(80, 1520, 924, 8, 140, 1) }] },
  ],
};

// Hero foreground (pops up in front of the shrinking film)
export const HERO_POP = {
  layers: [
    { parts: [{ fill: C.sand200, d: ridge([[-60, 760], [260, 700], [600, 752], [940, 694], [1280, 748], [1660, 702]]) }] },
    { parts: [
      { fill: C.green, d: palms([90, 200, 310, 1290, 1400, 1510], 880, 190, 1.35, 200) },
      { fill: C.sand, d: ridge([[-60, 860], [340, 830], [760, 866], [1160, 834], [1660, 862]]) },
    ] },
    { parts: [{ fill: C.sandDark, d: ridge([[-60, 950], [360, 918], [760, 954], [1140, 924], [1660, 950]]) + shrubs(100, 1500, 930, 8, 210, 1) }] },
  ],
};

// Loader scene (logo scene)
export const LOADER = {
  layers: [
    { parts: [{ fill: C.sand200, d: circle(800, 520, 210) }] },
    { parts: [{ fill: C.sand100, d: ridge([[-60, 700], [260, 640], [560, 690], [860, 630], [1160, 684], [1660, 640]]) }] },
    { parts: [{ fill: C.sand, d: ridge([[-60, 800], [320, 760], [700, 806], [1100, 764], [1660, 800]]) + palms([240, 330, 1270, 1360], 812, 200, 1, 300) }] },
    { parts: [{ fill: C.sandDark, d: ridge([[-60, 920], [340, 890], [760, 926], [1160, 896], [1660, 924]]) }] },
  ],
};
