// three.js flyover scene: terrain, route ribbon, pins, sprites, palms, farms, car.
import { ll, makeField, rand, FARM_CENTERS, LANDMARKS, fbm } from './terrain.js';

const PAL = {
  plain: '#dcae68', plain2: '#cf9b56', plateau: '#c68749', stone: '#dcbf90',
  cliff: '#9b5632', cliffDark: '#824628',
  mount: '#8a4529', mountHi: '#a65d38', mountDark: '#6a3420',
  dune: '#e2a865', duneCrest: '#f2c886', duneRed: '#cd7d44',
  green: '#5a6432', green2: '#78833f',
  cream: '#fff5c8', sand: '#c88c3c', sandDark: '#824628', lav: '#a06eb4',
};

export function createScene(THREE, opts) {
  const { host, stops, phone, textures, onStep } = opts;
  const N = stops.length;
  const disposables = [];
  const track = (o) => (disposables.push(o), o);
  const col = (hex) => new THREE.Color(hex);

  // ---------- renderer ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.75 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = !phone;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = 'stage__canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const FOG = col('#f2e0bb');
  scene.fog = new THREE.Fog(FOG, 60, 240);
  const camera = new THREE.PerspectiveCamera(phone ? 50 : 38, 1, 0.1, 800);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(col('#fff3d6'), col('#94603e'), 1.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(col('#ffd9a3'), 3.0);
  const SUN_DIR = new THREE.Vector3(-0.78, 0.72, 0.42).normalize();
  sun.castShadow = !phone;
  if (!phone) {
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.04;
  }
  scene.add(sun, sun.target);

  // ---------- route curve ----------
  const stopXZ = stops.map((s) => ll(s.lng, s.lat));
  const curve = new THREE.CatmullRomCurve3(stopXZ.map((p) => new THREE.Vector3(p.x, 0, p.z)), false, 'centripetal');
  const PER = 100; // samples per hop
  const M = (N - 1) * PER + 1;
  const flat = [];
  for (let j = 0; j < M; j++) { const p = curve.getPoint(j / (M - 1)); flat.push({ x: p.x, z: p.z }); }
  const coarse = flat.filter((_, j) => j % 3 === 0 || j === M - 1);
  const field = makeField(coarse, stopXZ);
  onStep && onStep(0.25);

  // ---------- terrain grid ----------
  const TW = 200, TD = 156;
  const SX = phone ? 130 : 244, SZ = phone ? 100 : 190;
  const GX = SX + 1, GZ = SZ + 1;
  const dx = TW / SX, dz = TD / SZ;
  const x0 = -TW / 2, z0 = -TD / 2;
  const H = new Float32Array(GX * GZ);
  const EF = new Float32Array(GX * GZ);
  const A = { mount: new Float32Array(GX * GZ), dune: new Float32Array(GX * GZ), esc: new Float32Array(GX * GZ), green: new Float32Array(GX * GZ), crest: new Float32Array(GX * GZ) };
  for (let iz = 0; iz < GZ; iz++) {
    for (let ix = 0; ix < GX; ix++) {
      const k = iz * GX + ix;
      const px = x0 + ix * dx, pz = z0 + iz * dz;
      const s = field.sample(px, pz);
      const edge = Math.min(px - x0, x0 + TW - px, pz - z0, z0 + TD - pz);
      const ef = Math.min(1, Math.max(0, (edge - 1) / 30));
      EF[k] = ef * ef * (3 - 2 * ef);
      H[k] = s.h * EF[k]; A.mount[k] = s.mount; A.dune[k] = s.dune; A.esc[k] = s.esc; A.green[k] = s.green; A.crest[k] = s.crest;
    }
  }
  onStep && onStep(0.6);

  function surf(x, z) {
    const fx = (x - x0) / dx, fz = (z - z0) / dz;
    const ix = Math.max(0, Math.min(SX - 1, Math.floor(fx)));
    const iz = Math.max(0, Math.min(SZ - 1, Math.floor(fz)));
    const u = Math.min(1, Math.max(0, fx - ix)), v = Math.min(1, Math.max(0, fz - iz));
    const ha = H[iz * GX + ix], hb = H[(iz + 1) * GX + ix], hc = H[(iz + 1) * GX + ix + 1], hd = H[iz * GX + ix + 1];
    if (u + v <= 1) return ha + (hd - ha) * u + (hb - ha) * v;
    return hc + (hb - hc) * (1 - u) + (hd - hc) * (1 - v);
  }

  const riy = stopXZ[0], jub = stopXZ[N - 1];
  const dirx = jub.x - riy.x, dirz = jub.z - riy.z, dlen = Math.hypot(dirx, dirz);
  const tris = SX * SZ * 2;
  const pos = new Float32Array(tris * 9), clr = new Float32Array(tris * 9), dly = new Float32Array(tris * 3), edg = new Float32Array(tris * 3);
  const c = new THREE.Color(), tmp = new THREE.Color();
  const FOGC = col('#f2e0bb');
  const P = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, col(v)]));
  let vi = 0;
  function faceColor(ids, ny, cx, cz) {
    let m = 0, du = 0, es = 0, gr = 0, cr = 0, hh = 0;
    for (const k of ids) { m += A.mount[k]; du += A.dune[k]; es += A.esc[k]; gr += A.green[k]; cr += A.crest[k]; hh += H[k]; }
    m /= 3; du /= 3; es /= 3; gr /= 3; cr /= 3; hh /= 3;
    const n = fbm(cx * 0.09, cz * 0.09, 2);
    c.copy(P.plain).lerp(P.plain2, 0.5 + n * 0.5);
    if (es > 0.3) c.lerp(tmp.copy(P.plateau).lerp(P.stone, 0.5 + 0.5 * fbm(cx * 0.2, cz * 0.2, 2)), Math.min(1, (es - 0.3) * 1.6));
    if (du > 0.05) {
      const north = Math.min(1, Math.max(0, (-cz - 28) / 10));
      tmp.copy(P.dune).lerp(P.duneRed, north * 0.8);
      tmp.lerp(P.duneCrest, cr * 0.55);
      c.lerp(tmp, Math.min(1, du * 1.2));
    }
    if (gr > 0.18) {
      const patch = 0.5 + 0.5 * fbm(cx * 0.45, cz * 0.45, 2);
      if (patch > 0.42) c.lerp(tmp.copy(P.green).lerp(P.green2, patch), Math.min(1, (gr - 0.18) * 2.2));
    }
    if (ny < 0.86) c.lerp(ny < 0.7 ? P.cliffDark : P.cliff, Math.min(1, (0.86 - ny) * 4));
    if (m > 0.05) {
      tmp.copy(P.mount).lerp(P.mountHi, 0.5 + 0.5 * n).lerp(P.mountDark, ny < 0.75 ? 0.5 : 0);
      c.lerp(tmp, Math.min(1, m * 1.6));
    }
    const j = 1 + (rand() - 0.5) * 0.1;
    c.multiplyScalar(j);
    const ef = (EF[ids[0]] + EF[ids[1]] + EF[ids[2]]) / 3;
    if (ef < 1) c.lerp(FOGC, 1 - ef);
  }
  function pushTri(ka, kb, kc, xa, za, xb, zb, xc, zc) {
    const ha = H[ka], hb = H[kb], hc = H[kc];
    // normal y
    const ux = xb - xa, uy = hb - ha, uz = zb - za, wx = xc - xa, wy = hc - ha, wz = zc - za;
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    faceColor([ka, kb, kc], Math.abs(ny / nl), (xa + xb + xc) / 3, (za + zb + zc) / 3);
    const verts = [[xa, ha, za, ka], [xb, hb, zb, kb], [xc, hc, zc, kc]];
    for (const [x, y, z, kk] of verts) {
      edg[vi] = EF[kk];
      pos[vi * 3] = x; pos[vi * 3 + 1] = y; pos[vi * 3 + 2] = z;
      clr[vi * 3] = c.r; clr[vi * 3 + 1] = c.g; clr[vi * 3 + 2] = c.b;
      const proj = ((x - riy.x) * dirx + (z - riy.z) * dirz) / (dlen * dlen);
      dly[vi] = Math.min(1, Math.max(0, proj * 0.85 + 0.08 + fbm(x * 0.06, z * 0.06, 2) * 0.1));
      vi++;
    }
  }
  for (let iz = 0; iz < SZ; iz++) {
    for (let ix = 0; ix < SX; ix++) {
      const a = iz * GX + ix, b = (iz + 1) * GX + ix, cc = (iz + 1) * GX + ix + 1, d = iz * GX + ix + 1;
      const xa = x0 + ix * dx, xb = xa + dx, za = z0 + iz * dz, zb = za + dz;
      pushTri(a, b, d, xa, za, xa, zb, xb, za);
      pushTri(b, cc, d, xa, zb, xb, zb, xb, za);
    }
  }
  const tGeo = track(new THREE.BufferGeometry());
  tGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  tGeo.setAttribute('color', new THREE.BufferAttribute(clr, 3));
  tGeo.setAttribute('aDelay', new THREE.BufferAttribute(dly, 1));
  tGeo.setAttribute('aEdge', new THREE.BufferAttribute(edg, 1));
  tGeo.computeBoundingSphere();
  const SKY = [0xf2, 0xe0, 0xbb].map((v) => v / 255); // matches the stage background (sRGB)
  const uniforms = { uRise: { value: 0 }, uFlat: { value: col('#efe2c2') }, uSky: { value: new THREE.Vector3(...SKY) } };
  const tMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }));
  tMat.onBeforeCompile = (sh) => {
    sh.uniforms.uRise = uniforms.uRise;
    sh.uniforms.uFlat = uniforms.uFlat;
    sh.uniforms.uSky = uniforms.uSky;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSky;\nvarying float vEdge;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor.rgb = mix(uSky, gl_FragColor.rgb, vEdge);');
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uRise;\nuniform vec3 uFlat;\nattribute float aDelay;\nattribute float aEdge;\nvarying float vEdge;')
      .replace('#include <color_vertex>', `#include <color_vertex>
        vEdge = aEdge;
        float ntL = clamp((uRise - aDelay * 0.6) / 0.4, 0.0, 1.0);
        float ntE = 1.0 + 2.70158 * pow(ntL - 1.0, 3.0) + 1.70158 * pow(ntL - 1.0, 2.0);
        #ifdef USE_COLOR
          vColor = mix(uFlat, vColor, smoothstep(0.0, 0.7, ntL));
        #endif`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.y = transformed.y * ntE - (1.0 - ntL) * 0.02;');
  };
  const terrain = new THREE.Mesh(tGeo, tMat);
  terrain.receiveShadow = !phone;
  scene.add(terrain);
  onStep && onStep(0.75);

  // ---------- route ribbon (cream top, sand edges) ----------
  const RW = phone ? 0.34 : 0.26, EDGE = RW * 0.18;
  const lifted = [];
  for (let j = 0; j < M; j++) {
    const a = flat[Math.max(0, j - 2)], b = flat[Math.min(M - 1, j + 2)];
    let tx = b.x - a.x, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
    const p = flat[j];
    const px = -tz, pz = tx;
    const y = Math.max(surf(p.x, p.z), surf(p.x + px * RW, p.z + pz * RW), surf(p.x - px * RW, p.z - pz * RW)) + 0.07;
    lifted.push({ x: p.x, y, z: p.z, tx, tz, px, pz });
  }
  // light smoothing of heights so the ribbon reads as a road
  for (let pass = 0; pass < 2; pass++) for (let j = 1; j < M - 1; j++) {
    const m = (lifted[j - 1].y + lifted[j].y * 2 + lifted[j + 1].y) / 4;
    lifted[j].y = Math.max(m, surf(lifted[j].x, lifted[j].z) + 0.06);
  }
  const rv = 10, rPos = new Float32Array(M * rv * 3), rCol = new Float32Array(M * rv * 3), rPerp = new Float32Array(M * rv * 3);
  const creamC = col(PAL.cream), sandC = col(PAL.sand), sideC = col(PAL.sandDark);
  for (let j = 0; j < M; j++) {
    const L = lifted[j], hw = RW / 2;
    const off = [-hw, -hw + EDGE, -hw + EDGE, hw - EDGE, hw - EDGE, hw];
    const cols = [sandC, sandC, creamC, creamC, sandC, sandC];
    for (let k = 0; k < 6; k++) {
      const o = (j * rv + k) * 3;
      rPos[o] = L.x + L.px * off[k]; rPos[o + 1] = L.y; rPos[o + 2] = L.z + L.pz * off[k];
      rPerp[o] = L.px * off[k] / hw; rPerp[o + 1] = 1; rPerp[o + 2] = L.pz * off[k] / hw;
      rCol[o] = cols[k].r; rCol[o + 1] = cols[k].g; rCol[o + 2] = cols[k].b;
    }
    const sides = [[-hw, 0], [-hw, -0.24], [hw, 0], [hw, -0.24]];
    for (let k = 0; k < 4; k++) {
      const o = (j * rv + 6 + k) * 3;
      rPos[o] = L.x + L.px * sides[k][0]; rPos[o + 1] = L.y + sides[k][1]; rPos[o + 2] = L.z + L.pz * sides[k][0];
      rPerp[o] = L.px * Math.sign(sides[k][0]); rPerp[o + 1] = 1; rPerp[o + 2] = L.pz * Math.sign(sides[k][0]);
      rCol[o] = sideC.r; rCol[o + 1] = sideC.g; rCol[o + 2] = sideC.b;
    }
  }
  const rIdx = [];
  for (let j = 0; j < M - 1; j++) {
    const a = j * rv, b = (j + 1) * rv;
    const quad = (p, q, r, s) => rIdx.push(p, r, q, q, r, s); // p,q at j ; r,s at j+1
    quad(a + 0, a + 1, b + 0, b + 1);
    quad(a + 2, a + 3, b + 2, b + 3);
    quad(a + 4, a + 5, b + 4, b + 5);
    quad(a + 7, a + 6, b + 7, b + 6);
    quad(a + 8, a + 9, b + 8, b + 9);
  }
  const rGeo = track(new THREE.BufferGeometry());
  rGeo.setAttribute('position', new THREE.BufferAttribute(rPos, 3));
  rGeo.setAttribute('color', new THREE.BufferAttribute(rCol, 3));
  rGeo.setAttribute('aPerp', new THREE.BufferAttribute(rPerp, 3));
  rGeo.setIndex(rIdx);
  rGeo.computeVertexNormals();
  rGeo.setDrawRange(0, 0);
  const rMat = track(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide, emissive: col('#5a4a20'), emissiveIntensity: 0.35, polygonOffset: true, polygonOffsetFactor: -2 }));
  const uWiden = { value: 0 };
  rMat.onBeforeCompile = (sh) => {
    sh.uniforms.uWiden = uWiden;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uWiden;\nattribute vec3 aPerp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.xz += aPerp.xz * uWiden;\ntransformed.y += aPerp.y * uWiden * 0.6;');
  };
  const ribbon = new THREE.Mesh(rGeo, rMat);
  ribbon.castShadow = !phone;
  ribbon.receiveShadow = !phone;
  ribbon.frustumCulled = false;
  scene.add(ribbon);

  // ghost route: faint dashes showing the way ahead
  const gPts = lifted.filter((_, j) => j % 2 === 0).map((p) => new THREE.Vector3(p.x, p.y - 0.03, p.z));
  const gGeo = track(new THREE.BufferGeometry().setFromPoints(gPts));
  const gMat = track(new THREE.LineDashedMaterial({ color: col(PAL.sandDark), dashSize: 0.5, gapSize: 0.4, transparent: true, opacity: 0.55 }));
  const ghost = new THREE.Line(gGeo, gMat);
  ghost.computeLineDistances();
  ghost.visible = false;
  scene.add(ghost);

  // ---------- farms (center-pivot discs) ----------
  {
    const discs = [];
    const want = phone ? 70 : 150;
    let tries = 0;
    while (discs.length < want && tries < want * 40) {
      tries++;
      const f = FARM_CENTERS[Math.floor(rand() * FARM_CENTERS.length)];
      const ang = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * f.r * 0.85;
      const x = f.x + Math.cos(ang) * rr, z = f.z + Math.sin(ang) * rr;
      const r = 0.45 + rand() * 0.6;
      if (field.routeDist(x, z) < r + 0.35) continue;
      if (stopXZ.some((s) => Math.hypot(s.x - x, s.z - z) < r + 0.9)) continue;
      if (discs.some((d) => Math.hypot(d.x - x, d.z - z) < d.r + r + 0.12)) continue;
      let lo = 1e9, hi = -1e9;
      for (let k = 0; k < 7; k++) {
        const a2 = (k / 6) * Math.PI * 2; const sx = k === 6 ? x : x + Math.cos(a2) * r, sz = k === 6 ? z : z + Math.sin(a2) * r;
        const h = surf(sx, sz); lo = Math.min(lo, h); hi = Math.max(hi, h);
      }
      if (hi - lo > 0.12) continue;
      discs.push({ x, z, r, y: hi + 0.025 });
    }
    const dGeo = track(new THREE.CircleGeometry(1, 14).rotateX(-Math.PI / 2));
    const dMat = track(new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }));
    const farms = new THREE.InstancedMesh(dGeo, dMat, discs.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const fcols = ['#5a6432', '#66733a', '#7a8644', '#4f5a2c', '#c9a466'].map(col);
    discs.forEach((d, i) => {
      ps.set(d.x, d.y, d.z); sc.set(d.r, 1, d.r); q.identity();
      m4.compose(ps, q, sc); farms.setMatrixAt(i, m4);
      farms.setColorAt(i, fcols[rand() < 0.12 ? 4 : Math.floor(rand() * 4)]);
    });
    farms.receiveShadow = !phone;
    farms.userData.pop = true;
    scene.add(farms);
  }

  // ---------- palms ----------
  const palmGroup = new THREE.Group();
  {
    const greenKeys = new Set(['riyadh', 'shaqra', 'ushaiqer', 'al-majmaah', 'al-ghat', 'al-zulfi', 'al-mithnab', 'unaizah', 'ar-rass', 'buraydah', 'al-bukayriyah', 'uyun-al-jiwa', 'hail', 'jubbah']);
    const centers = [];
    stops.forEach((s, i) => { if (greenKeys.has(s.key)) centers.push({ ...stopXZ[i], r: 4.2, n: phone ? 18 : 44 }); });
    FARM_CENTERS.forEach((f) => centers.push({ x: f.x, z: f.z, r: f.r * 1.05, n: phone ? 8 : 22 }));
    const spots = [];
    for (const cc of centers) {
      let made = 0, tries = 0;
      while (made < cc.n && tries < cc.n * 12) {
        tries++;
        const ang = rand() * Math.PI * 2, rr = 1.1 + Math.pow(rand(), 0.7) * cc.r;
        const x = cc.x + Math.cos(ang) * rr, z = cc.z + Math.sin(ang) * rr;
        if (field.routeDist(x, z) < 0.45) continue;
        if (stopXZ.some((s) => Math.hypot(s.x - x, s.z - z) < 1.0)) continue;
        const s0 = field.sample(x, z);
        if (s0.mount > 0.2) continue;
        // clump: favour noise highs
        if (fbm(x * 0.6, z * 0.6, 2) < -0.15) continue;
        spots.push({ x, z, y: surf(x, z), s: 0.45 + rand() * 0.35, r: rand() * Math.PI });
        made++;
      }
    }
    const trunkG = track(new THREE.CylinderGeometry(0.018, 0.03, 0.5, 5).translate(0, 0.25, 0));
    const crownG = track(new THREE.ConeGeometry(0.2, 0.1, 7).translate(0, 0.53, 0));
    const trunkM = track(new THREE.MeshStandardMaterial({ color: col('#7a4a2a'), roughness: 1, flatShading: true }));
    const crownM = track(new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }));
    const trunks = new THREE.InstancedMesh(trunkG, trunkM, spots.length);
    const crowns = new THREE.InstancedMesh(crownG, crownM, spots.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), ps = new THREE.Vector3();
    const pc = ['#5a6432', '#6d7a38', '#4c5729', '#7f8c45'].map(col);
    spots.forEach((p, i) => {
      e.set((rand() - 0.5) * 0.18, p.r, (rand() - 0.5) * 0.18); q.setFromEuler(e);
      ps.set(p.x, p.y - 0.02, p.z); sc.setScalar(p.s);
      m4.compose(ps, q, sc); trunks.setMatrixAt(i, m4); crowns.setMatrixAt(i, m4);
      crowns.setColorAt(i, pc[Math.floor(rand() * pc.length)]);
    });
    trunks.castShadow = crowns.castShadow = !phone;
    palmGroup.add(trunks, crowns);
    scene.add(palmGroup);
  }

  // ---------- pins, sprites ----------
  const colM = track(new THREE.MeshStandardMaterial({ color: col(PAL.sandDark), roughness: 0.7 }));
  const capM = track(new THREE.MeshStandardMaterial({ color: col(PAL.cream), roughness: 0.6, emissive: col('#6b5a2a'), emissiveIntensity: 0.25 }));
  const capOn = track(new THREE.MeshStandardMaterial({ color: col(PAL.sand), roughness: 0.5, emissive: col(PAL.sand), emissiveIntensity: 0.55 }));
  const postM = track(new THREE.MeshStandardMaterial({ color: col(PAL.cream), roughness: 0.8 }));
  const hitM = track(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, transparent: true, opacity: 0 }));
  const colG = track(new THREE.BoxGeometry(0.14, 1.1, 0.14).translate(0, 0.55, 0));
  const capG = track(new THREE.BoxGeometry(0.34, 0.34, 0.34).translate(0, 1.27, 0));
  const plateG = track(new THREE.BoxGeometry(0.5, 0.05, 0.5));
  const hitG = track(new THREE.BoxGeometry(0.9, 2.2, 0.9).translate(0, 1.0, 0));
  const postG = track(new THREE.BoxGeometry(0.06, 1, 0.06).translate(0, 0.5, 0));

  const pins = [];
  const sprites = [];
  const hits = [];
  stops.forEach((s, i) => {
    const p = stopXZ[i];
    const y = surf(p.x, p.z);
    const g = new THREE.Group();
    g.position.set(p.x, y, p.z);
    const column = new THREE.Mesh(colG, colM);
    const cap = new THREE.Mesh(capG, capM);
    const plate = new THREE.Mesh(plateG, colM);
    const hit = new THREE.Mesh(hitG, hitM);
    hit.userData.index = i;
    column.castShadow = cap.castShadow = !phone;
    const lift = new THREE.Group();
    lift.add(column, cap);
    g.add(plate, lift, hit);
    scene.add(g);
    pins.push({ g, lift, cap, y, x: p.x, z: p.z, liftV: 0, liftT: 0 });
    hits.push(hit);

    // sprite beside the pin, on the side away from the road
    const tex = textures[s.sticker ? 'st:' + s.sticker : 'ic:' + s.icon];
    if (!tex) return;
    const L = lifted[Math.min(M - 1, i * PER)];
    const isSticker = !!s.sticker;
    const off = isSticker ? 1.55 : 1.2;
    const d1 = field.routeDist(p.x + L.px * off, p.z + L.pz * off);
    const d2 = field.routeDist(p.x - L.px * off, p.z - L.pz * off);
    // prefer the side behind the pin as seen by the camera (camera sits south-east), unless it lands on the road
    const behind = (L.px * 0.48 + L.pz * 0.88) < 0 ? 1 : -1;
    const sgn = (behind > 0 ? d1 : d2) > 0.75 ? behind : (d1 >= d2 ? 1 : -1);
    const sx = p.x + L.px * off * sgn, sz = p.z + L.pz * off * sgn;
    const sy = surf(sx, sz);
    const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: true }));
    const spr = new THREE.Sprite(mat);
    const img = tex.image;
    const asp = img.width / img.height;
    const hgt = isSticker ? (phone ? 1.9 : 1.7) : (phone ? 1.4 : 1.25);
    spr.center.set(0.5, isSticker ? 0 : 0.06);
    const holder = new THREE.Group();
    holder.position.set(sx, sy, sz);
    const postH = isSticker ? 0.55 : 0;
    spr.position.y = postH;
    holder.add(spr);
    if (isSticker) {
      const post = new THREE.Mesh(postG, postM);
      post.scale.y = postH + 0.3;
      post.castShadow = !phone;
      holder.add(post);
    }
    scene.add(holder);
    sprites.push({ holder, spr, w: hgt * asp, h: hgt, i, delay: i / N });
  });

  // Salma sticker standing on its mountains
  if (textures['st:salma']) {
    const tex = textures['st:salma'];
    const p = LANDMARKS.salma;
    const sx = p.x - 1.5, sz = p.z + 2.2;
    const mat = track(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    const spr = new THREE.Sprite(mat);
    spr.center.set(0.5, 0);
    const holder = new THREE.Group();
    holder.position.set(sx, surf(sx, sz) + 0.1, sz);
    holder.add(spr);
    scene.add(holder);
    const hh = 3.0;
    sprites.push({ holder, spr, w: hh * (tex.image.width / tex.image.height), h: hh, i: 13.5, delay: 0.9 });
  }

  // active-stop marker: square ring on the ground
  const ringG = track(new THREE.RingGeometry(0.62, 0.74, 4, 1).rotateZ(Math.PI / 4).rotateX(-Math.PI / 2));
  const ringM = track(new THREE.MeshBasicMaterial({ color: col(PAL.cream), transparent: true, opacity: 0, depthWrite: false }));
  const ring = new THREE.Mesh(ringG, ringM);
  scene.add(ring);

  // ---------- car ----------
  const car = new THREE.Group();
  {
    const bodyG = track(new THREE.BoxGeometry(0.2, 0.09, 0.4).translate(0, 0.08, 0));
    const cabG = track(new THREE.BoxGeometry(0.17, 0.08, 0.22).translate(0, 0.165, -0.03));
    const wheelG = track(new THREE.BoxGeometry(0.22, 0.06, 0.08).translate(0, 0.035, 0));
    const bodyM = track(new THREE.MeshStandardMaterial({ color: col(PAL.cream), roughness: 0.5 }));
    const cabM = track(new THREE.MeshStandardMaterial({ color: col(PAL.sandDark), roughness: 0.5 }));
    const wheelM = track(new THREE.MeshStandardMaterial({ color: col('#3a332b'), roughness: 0.9 }));
    const body = new THREE.Mesh(bodyG, bodyM), cab = new THREE.Mesh(cabG, cabM);
    const w1 = new THREE.Mesh(wheelG, wheelM), w2 = new THREE.Mesh(wheelG, wheelM);
    w1.position.z = 0.12; w2.position.z = -0.12;
    body.castShadow = cab.castShadow = !phone;
    car.add(body, cab, w1, w2);
    car.scale.setScalar(phone ? 1.5 : 1.25);
    car.visible = false;
    scene.add(car);
  }

  // ---------- state ----------
  let W = 1, Hh = 1;
  let rise = 0, pop = 0, active = -1, hover = -1;
  const target = new THREE.Vector3();
  let camDist = 100;

  function resize(w, h) {
    W = Math.max(1, w); Hh = Math.max(1, h);
    renderer.setSize(W, Hh, false);
    camera.aspect = W / Hh;
    camera.updateProjectionMatrix();
  }

  function sampleRoute(u) {
    const f = Math.max(0, Math.min(N - 1, u)) * PER;
    const j = Math.min(M - 2, Math.floor(f)), t = f - j;
    const a = lifted[j], b = lifted[j + 1];
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t, tx: a.tx + (b.tx - a.tx) * t, tz: a.tz + (b.tz - a.tz) * t, j: f };
  }

  // smoothed heading (looks ahead and behind) for camera azimuth
  function heading(u, win = 0.45) {
    const a = sampleRoute(u - win), b = sampleRoute(u + win);
    return Math.atan2(-(b.x - a.x), -(b.z - a.z));
  }

  function setRoute(u, showCar, showGhost) {
    const r = sampleRoute(u);
    const segs = Math.max(0, Math.min(M - 1, Math.floor(r.j)));
    rGeo.setDrawRange(0, segs * 30);
    car.visible = !!showCar && u > 0.02 && u < N - 1.02;
    if (car.visible) {
      car.position.set(r.x, r.y, r.z);
      car.rotation.y = Math.atan2(r.tx, r.tz);
    }
    ghost.visible = !!showGhost;
  }

  function setActive(i) {
    if (i === active) return;
    if (active >= 0) pins[active].cap.material = capM;
    active = i;
    if (active >= 0) pins[active].cap.material = capOn;
  }

  function setHover(i) { hover = i; }

  function applyCamera(cam) {
    target.set(cam.x, cam.y, cam.z);
    camDist = cam.dist;
    const ce = Math.cos(cam.elev);
    camera.position.set(cam.x + cam.dist * ce * Math.sin(cam.az), cam.y + cam.dist * Math.sin(cam.elev), cam.z + cam.dist * ce * Math.cos(cam.az));
    // never let the camera dip below the ground
    const g = surf(camera.position.x, camera.position.z) + 1.2;
    if (camera.position.y < g) camera.position.y = g;
    camera.lookAt(target);
    camera.near = Math.max(0.1, cam.dist * 0.02);
    camera.far = cam.dist * 4 + 220;
    camera.setViewOffset(W, Hh, -cam.shiftX * W, cam.shiftY * Hh, W, Hh);
    camera.updateProjectionMatrix();
    uWiden.value = Math.min(1.1, Math.max(0, (cam.dist - 14) / 70));
    scene.fog.near = cam.dist * 0.95;
    scene.fog.far = cam.dist * 3.2 + 50;
    // sun + shadow frustum follow the focus
    sun.position.copy(target).addScaledVector(SUN_DIR, 80);
    sun.target.position.copy(target);
    if (!phone) {
      const ext = Math.min(70, Math.max(10, cam.dist * 0.95));
      const sc = sun.shadow.camera;
      if (Math.abs(sc.right - ext) > 0.5) {
        sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext; sc.near = 1; sc.far = 200;
        sc.updateProjectionMatrix();
      }
    }
  }

  const easeBack = (t) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

  function setRise(v) {
    rise = v;
    uniforms.uRise.value = v;
    terrain.castShadow = !phone && v >= 1;
  }

  function setPop(v) {
    pop = v;
    sprites.forEach((s) => {
      const t = Math.min(1, Math.max(0, (v - s.delay * 0.5) / 0.5));
      const e = t <= 0 ? 0 : easeBack(t);
      s.spr.scale.set(s.w * e, s.h * e, 1);
      s.holder.visible = t > 0;
    });
    pins.forEach((p, i) => {
      const t = Math.min(1, Math.max(0, (v - (i / N) * 0.5) / 0.5));
      p.g.scale.set(1, Math.max(0.001, t <= 0 ? 0.001 : easeBack(t)), 1);
      p.g.visible = t > 0;
    });
    palmGroup.scale.y = Math.max(0.001, v);
    palmGroup.visible = v > 0;
  }

  let last = performance.now();
  function render(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // pin lift springs
    pins.forEach((p, i) => {
      p.liftT = i === hover ? 0.45 : i === active ? 0.18 : 0;
      const k = 1 - Math.exp(-dt * 12);
      p.liftV += (p.liftT - p.liftV) * k;
      p.lift.position.y = p.liftV;
      p.cap.rotation.y = i === active ? now * 0.0012 : p.cap.rotation.y * 0.9;
    });
    if (active >= 0) {
      const p = pins[active];
      const pulse = (now * 0.0007) % 1;
      ring.position.set(p.x, p.y + 0.04, p.z);
      ring.scale.setScalar(1 + pulse * 1.6);
      ringM.opacity = (1 - pulse) * 0.9;
    } else ringM.opacity = 0;
    renderer.render(scene, camera);
  }

  const v3 = new THREE.Vector3();
  function project(i) {
    const p = pins[i];
    const d = camera.position.distanceTo(v3.set(p.x, p.y, p.z));
    v3.set(p.x, p.y + 1.75 + p.liftV, p.z).project(camera);
    return { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * Hh, front: v3.z < 1, dist: d };
  }

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(x, y) {
    ndc.set((x / W) * 2 - 1, -(y / Hh) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    return hit ? hit.object.userData.index : -1;
  }

  function stopTarget(i) {
    const p = pins[i];
    return { x: p.x, y: p.y + 0.6, z: p.z };
  }

  function dispose() {
    disposables.forEach((d) => d.dispose && d.dispose());
    Object.values(textures).forEach((t) => t.dispose && t.dispose());
    scene.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
    renderer.dispose();
    renderer.forceContextLoss && renderer.forceContextLoss();
    renderer.domElement.remove();
  }

  onStep && onStep(1);

  return {
    N, renderer, camera, surf, sampleRoute, heading, stopTarget,
    landmarks: LANDMARKS, ll,
    resize, setRise, setPop, setRoute, setActive, setHover, applyCamera, render, project, pick, dispose,
    get camDist() { return camDist; },
  };
}
