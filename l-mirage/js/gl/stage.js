// One shared WebGL renderer on a fixed full-viewport canvas. Every plane is aligned each frame
// to a DOM placeholder (getBoundingClientRect), so layout, RTL mirroring and responsiveness stay in CSS.
import { VERT, HERO_FRAG, STOP_FRAG, FIELD_FRAG, DUNE_FRAG } from './shaders.js';

const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const hexVec = (THREE, hex) => {
  const h = hex.replace('#', '');
  return new THREE.Vector3(parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255);
};

export function createStage({ THREE, canvas, hero, onLost }) {
  const phone = window.innerWidth < 768;
  const touch = window.matchMedia('(hover: none)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = true;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
  const geoFlat = new THREE.PlaneGeometry(1, 1, 1, 1);
  const geoBend = new THREE.PlaneGeometry(1, 1, phone ? 1 : 28, phone ? 1 : 28);
  const shared = {
    uTime: { value: 0 },
    uVel: { value: 0 },
    uCurl: { value: phone ? 0 : 1 }, // phones: no velocity curl
  };
  const items = [];
  const textures = [];
  let W = 1;
  let H = 1;
  const pointer = { x: -9999, y: -9999 };

  const resize = () => {
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2));
    renderer.setSize(W, H, false);
    camera.left = -W / 2; camera.right = W / 2; camera.top = H / 2; camera.bottom = -H / 2;
    camera.updateProjectionMatrix();
  };
  resize();

  const place = (mesh, r) => {
    mesh.position.set(r.left + r.width / 2 - W / 2, H / 2 - r.top - r.height / 2, 0);
    mesh.scale.set(r.width, r.height, 1);
  };

  // ---------- hero film ----------
  const heroEl = document.querySelector('[data-gl-hero]');
  if (heroEl && hero) {
    const video = hero.state.video;
    const tex = new THREE.VideoTexture(video);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    textures.push(tex);
    const rip = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, -10, 0));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: HERO_FRAG,
      uniforms: {
        uTex: { value: tex }, uTexRes: { value: new THREE.Vector2(16, 9) }, uRes: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 }, uVel: { value: 0 }, uCurl: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uHover: { value: 0 }, uIntro: { value: 0 },
        uRip: { value: rip }, uRipTime: { value: 0 },
      },
    });
    const mesh = new THREE.Mesh(geoFlat, mat);
    mesh.visible = false;
    scene.add(mesh);
    let heroTime = 0;
    let introT = -1;
    items.push({
      el: heroEl, mesh, kind: 'hero',
      intro() { introT = performance.now(); },
      update(r, now, dt) {
        const u = mat.uniforms;
        const ready = video.readyState >= 2 && video.videoWidth > 0;
        mesh.visible = ready;
        if (!ready) return;
        u.uTexRes.value.set(video.videoWidth, video.videoHeight);
        u.uRes.value.set(r.width, r.height);
        if (!hero.state.paused) heroTime += dt;
        u.uTime.value = heroTime;
        u.uRipTime.value = now / 1000;
        u.uIntro.value = introT < 0 ? 0 : ease(Math.min(1, (now - introT) / 2400));
        const m = hero.state.mouse;
        u.uMouse.value.x += (m[0] - u.uMouse.value.x) * 0.08;
        u.uMouse.value.y += (m[1] - u.uMouse.value.y) * 0.08;
        u.uHover.value += ((hero.state.inside ? 1 : 0) - u.uHover.value) * 0.05;
        const rs = hero.state.ripples;
        for (let i = 0; i < 4; i++) {
          const x = rs[i];
          if (x) rip[i].set(x.uv[0], x.uv[1], x.t, 1); else rip[i].w = 0;
        }
      },
    });
  }

  // ---------- stop planes ----------
  document.querySelectorAll('[data-gl-stop]').forEach((el, i) => {
    // Off-DOM copy: three sizes texture storage from image.width, which for a laid-out <img>
    // is its CSS size, not its natural size.
    const domImg = el.querySelector('img');
    const img = new Image();
    img.decoding = 'async';
    img.src = domImg.currentSrc || domImg.src;
    const tex = new THREE.Texture(img);
    tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    textures.push(tex);
    let ready = false;
    const onLoad = () => { tex.needsUpdate = true; ready = true; };
    if (img.complete && img.naturalWidth) onLoad(); else img.addEventListener('load', onLoad, { once: true });
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: STOP_FRAG, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTex: { value: tex }, uTexRes: { value: new THREE.Vector2(1, 1) }, uRes: { value: new THREE.Vector2(1, 1) },
        uTime: shared.uTime, uVel: shared.uVel, uCurl: shared.uCurl,
        uReveal: { value: 0 }, uMouse: { value: new THREE.Vector2(0.5, 0.5) }, uHover: { value: 0 },
        uRgb: { value: phone ? 0.5 : 1 }, uPar: { value: 0 }, uSeed: { value: i * 1.37 + 0.4 },
      },
    });
    const mesh = new THREE.Mesh(geoBend, mat);
    mesh.visible = false;
    scene.add(mesh);
    let rev = 0;
    let revStart = -1;
    items.push({
      el, mesh, kind: 'stop',
      update(r, now, dt) {
        const u = mat.uniforms;
        mesh.visible = ready;
        if (!ready) return;
        u.uTexRes.value.set(img.naturalWidth, img.naturalHeight);
        u.uRes.value.set(r.width, r.height);
        // Time-based so slow frames never stall the reveal.
        if (el.dataset.in === '1' && revStart < 0) revStart = now;
        if (revStart >= 0) rev = Math.min(1, (now - revStart) / 1700);
        u.uReveal.value = easeOut(rev);
        u.uPar.value = Math.max(-1, Math.min(1, (r.top + r.height / 2 - H / 2) / H));
        if (!touch) {
          const inside = pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
          if (inside) {
            const tx = (pointer.x - r.left) / r.width;
            const ty = 1 - (pointer.y - r.top) / r.height;
            u.uMouse.value.x += (tx - u.uMouse.value.x) * 0.12;
            u.uMouse.value.y += (ty - u.uMouse.value.y) * 0.12;
          }
          // Melt in fast, reform slowly.
          const target = inside && rev >= 1 ? 1 : 0;
          u.uHover.value += (target - u.uHover.value) * (target ? 0.08 : 0.035);
        }
      },
    });
  });

  // ---------- pillar colour fields ----------
  document.querySelectorAll('[data-gl-field]').forEach((el, i) => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FIELD_FRAG, transparent: true, depthTest: false, depthWrite: false,
      uniforms: {
        uTime: shared.uTime, uVel: { value: 0 }, uCurl: { value: 0 },
        uColor: { value: hexVec(THREE, el.dataset.color || '#824628') },
        uRes: { value: new THREE.Vector2(1, 1) }, uReveal: { value: 0 }, uSeed: { value: i * 3.1 },
      },
    });
    const mesh = new THREE.Mesh(geoFlat, mat);
    scene.add(mesh);
    items.push({
      el, mesh, kind: 'field',
      update(r) {
        mat.uniforms.uRes.value.set(r.width, r.height);
        mat.uniforms.uReveal.value = el._reveal ?? 1;
      },
    });
  });

  // ---------- closing dunes ----------
  const dunesEl = document.querySelector('[data-gl-dunes]');
  if (dunesEl) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: DUNE_FRAG, depthTest: false, depthWrite: false,
      uniforms: { uTime: shared.uTime, uVel: { value: 0 }, uCurl: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
    });
    const mesh = new THREE.Mesh(geoFlat, mat);
    scene.add(mesh);
    items.push({ el: dunesEl, mesh, kind: 'dunes', update(r) { mat.uniforms.uRes.value.set(r.width, r.height); } });
  }

  // ---------- loop ----------
  let raf = 0;
  let last = performance.now();
  let lastY = window.scrollY;
  let vel = 0;
  let cleared = false;
  let running = false;

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    shared.uTime.value += dt;
    const y = window.scrollY;
    const raw = dt > 0 ? (y - lastY) / (dt * 60) : 0; // px per 60 fps frame
    lastY = y;
    vel += (Math.max(-1, Math.min(1, raw / 70)) - vel) * 0.1;
    if (Math.abs(vel) < 0.0005) vel = 0;
    shared.uVel.value = vel;

    // Read all rects first, then write.
    const rects = items.map((it) => it.el.getBoundingClientRect());
    let any = false;
    items.forEach((it, k) => {
      const r = rects[k];
      const inView = r.bottom > -80 && r.top < H + 80 && r.width > 0 && r.height > 0;
      if (!inView) { it.mesh.visible = false; return; }
      place(it.mesh, r);
      it.mesh.visible = true;
      it.update(r, now, dt);
      if (it.mesh.visible) any = true;
    });
    if (any) { renderer.render(scene, camera); cleared = false; }
    else if (!cleared) { renderer.clear(); cleared = true; }
  };

  const start = () => { if (running) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const onVis = () => (document.hidden ? stop() : start());
  const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; };
  const onLeave = () => { pointer.x = pointer.y = -9999; };
  document.addEventListener('visibilitychange', onVis);
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  const dispose = () => {
    stop();
    document.removeEventListener('visibilitychange', onVis);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onMove);
    textures.forEach((t) => t.dispose());
    items.forEach((it) => it.mesh.material.dispose());
    geoFlat.dispose(); geoBend.dispose();
    renderer.dispose();
  };
  window.addEventListener('pagehide', dispose, { once: true });
  window.addEventListener('pageshow', (e) => { if (e.persisted) location.reload(); });
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); onLost && onLost(); });

  start();
  return {
    heroIntro() { items.find((i) => i.kind === 'hero')?.intro(); },
    dispose,
  };
}
