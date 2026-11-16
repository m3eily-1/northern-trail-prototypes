/* Direction A: The Drive.
   Sections are independent modules (loader, hero, intro, journey, hud) that share
   only the content object and a tiny context; no globals beyond this module. */

import { mountServices } from './services.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);

const params = new URLSearchParams(location.search);
const LANG = params.get('lang') === 'ar' ? 'ar' : 'en';
const RTL = LANG === 'ar';
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const phoneMQ = window.matchMedia('(max-width: 767px)');
const TOTAL_KM = 1200;

const UI = {
  en: {
    km: 'km', start: 'Start', pause: 'Pause film', play: 'Play film', stop: 'Stop', of: '/',
    startHere: 'Start', startHint: 'Scroll to drive. 16 stops ahead.',
    stopsHeading: 'The 16 stops', arrived: 'You have arrived', again: 'Drive it again',
    route: 'The route', experiences: 'Experiences', firstStop: 'Starting point', lang: 'Language',
  },
  ar: {
    km: 'كم', start: 'تشغيل', pause: 'إيقاف الفيلم', play: 'تشغيل الفيلم', stop: 'محطة', of: 'من',
    startHere: 'البداية', startHint: 'مرّر لتبدأ القيادة. أمامك 16 محطة.',
    stopsHeading: 'المحطات الست عشرة', arrived: 'وصلت', again: 'ابدأ الرحلة من جديد',
    route: 'المسار', experiences: 'التجارب', firstStop: 'نقطة الانطلاق', lang: 'اللغة',
  },
}[LANG];

const ICON = {
  down: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M10 3v13M4 10l6 6 6-6"/></svg>',
  up: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M10 17V4M4 10l6-6 6 6"/></svg>',
  pause: '<svg viewBox="0 0 18 18" fill="currentColor"><rect x="3" y="2" width="4" height="14"/><rect x="11" y="2" width="4" height="14"/></svg>',
  play: '<svg viewBox="0 0 18 18" fill="currentColor"><path d="M4 2l12 7-12 7z"/></svg>',
  clock: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="1.5" y="1.5" width="13" height="13"/><path d="M8 4v4.5h3"/></svg>',
  arrow: '<svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M14 25V5M6 13l8-8 8 8"/></svg>',
};

const asset = (p) => (p ? `../${p}` : '');
const tx = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[LANG] ?? o.en));
const pad2 = (n) => String(n).padStart(2, '0');
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function splitWords(node, text) {
  node.textContent = '';
  const words = text.split(' ');
  words.forEach((w, i) => {
    const m = el('span', 'w');
    const s = el('span', 'w__i');
    s.textContent = w;
    m.append(s);
    node.append(m);
    if (i < words.length - 1) node.append(' ');
  });
  return node.querySelectorAll('.w__i');
}

/* ------------------------------------------------------------------ */
/* Odometer component                                                   */
/* ------------------------------------------------------------------ */

function createOdometer(digits = 4) {
  const root = el('span', 'odo');
  root.setAttribute('dir', 'ltr');
  const strips = [];
  const cells = Array.from({ length: 21 }, (_, k) => `<span>${k % 10}</span>`).join('');
  for (let i = 0; i < digits; i++) {
    const d = el('span', 'odo__d');
    const s = el('span', 'odo__s', cells);
    d.append(s);
    root.append(d);
    strips.push(s);
  }
  const place = (i, n) => {
    strips[i].style.transform = `translate3d(0, ${(-n * 100) / 21}%, 0)`;
  };
  let last = -1;
  return {
    root,
    place,
    set(v) {
      v = Math.max(0, Math.min(9999, v));
      if (Math.abs(v - last) < 0.005) return;
      last = v;
      for (let k = 0; k < digits; k++) {
        const p = 10 ** k;
        let dv;
        if (k === 0) {
          // units roll over in the last quarter of each km, so digits rest aligned
          const f = v % 1;
          dv = (Math.floor(v) % 10) + Math.max(0, (f - 0.75) / 0.25);
        } else {
          dv = Math.floor(v / p) % 10;
          const lower = v % p;
          if (lower > p - 1) dv += lower - (p - 1);
        }
        place(digits - 1 - k, dv);
      }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Static chrome labels                                                 */
/* ------------------------------------------------------------------ */

function renderChrome() {
  document.querySelectorAll('[data-t]').forEach((n) => {
    n.textContent = UI[n.dataset.t] ?? '';
  });
  const nav = document.querySelector('[data-lang]');
  nav.setAttribute('aria-label', UI.lang);
  const mk = (code, label) => {
    const u = new URL(location.href);
    u.searchParams.set('lang', code);
    const a = el('a');
    a.href = u.pathname + u.search;
    a.textContent = label;
    a.lang = code;
    a.setAttribute('aria-current', String(code === LANG));
    return a;
  };
  nav.append(mk('en', 'EN'), mk('ar', 'ع'));
}

/* ------------------------------------------------------------------ */
/* Loader: dashboard ignition, once per session                         */
/* ------------------------------------------------------------------ */

function runLoader() {
  const html = document.documentElement;
  const root = document.querySelector('[data-loader]');
  if (!html.classList.contains('is-loading')) {
    root.remove();
    return Promise.resolve();
  }
  const odo = createOdometer(4);
  root.querySelector('[data-loader-odo]').append(odo.root);
  const start = root.querySelector('[data-loader-start]');
  const logo = root.querySelector('.loader__logo');
  const dash = root.querySelector('.loader__dash');
  const startVals = [17, 15, 19, 18];
  startVals.forEach((v, i) => odo.place(i, v));

  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('nt-a-ignition', '1'); } catch (e) { /* storage blocked */ }
      html.classList.remove('is-loading');
      root.remove();
      resolve();
    };
    const tl = gsap.timeline({ onComplete: finish });
    tl.from(logo, { autoAlpha: 0, y: 12, duration: 0.4, ease: 'power2.out' })
      .from([dash, start], { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, 0.1);
    startVals.forEach((v, i) => {
      const o = { n: v };
      tl.to(o, { n: 0, duration: 0.85, ease: 'power3.out', onUpdate: () => odo.place(i, o.n) }, 0.22 + i * 0.07);
    });
    tl.add(() => start.classList.add('is-on'), 1.18)
      .to(root.querySelector('.loader__inner'), { x: 1.5, duration: 0.04, repeat: 5, yoyo: true, ease: 'none' }, 1.18)
      .to(root, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.5, ease: 'power3.inOut' }, 1.42)
      .add(() => resolve(), 1.55);
    root.addEventListener('click', () => tl.progress(1));
    setTimeout(finish, 3500);
  });
}

/* ------------------------------------------------------------------ */
/* Hero                                                                 */
/* ------------------------------------------------------------------ */

function setupHero(C) {
  const hero = document.querySelector('[data-hero]');
  const film = hero.querySelector('[data-film]');
  const title = hero.querySelector('[data-hero-title]');
  const sub = hero.querySelector('[data-hero-sub]');
  const cta = hero.querySelector('[data-hero-cta]');
  const pauseBtn = hero.querySelector('[data-pause]');

  const words = splitWords(title, tx(C.hero.title));
  sub.textContent = tx(C.hero.sub);
  cta.innerHTML = `<span>${esc(tx(C.hero.cta))}</span>${ICON.down}`;
  cta.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('drive');
    const y = target.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
  });

  film.src = asset(phoneMQ.matches ? C.film.mobile : C.film.desktop);
  film.poster = asset(C.film.poster);
  const setBtn = () => {
    const paused = film.paused;
    pauseBtn.innerHTML = paused ? ICON.play : ICON.pause;
    pauseBtn.setAttribute('aria-label', paused ? UI.play : UI.pause);
  };
  pauseBtn.addEventListener('click', () => {
    if (film.paused) film.play().catch(() => {});
    else film.pause();
  });
  film.addEventListener('play', setBtn);
  film.addEventListener('pause', setBtn);
  if (!REDUCE) {
    film.autoplay = true;
    film.play().catch(() => setBtn());
  }
  setBtn();

  if (REDUCE) return { intro: () => {} };

  gsap.set(words, { yPercent: 110 });
  gsap.set([sub, cta], { autoAlpha: 0, y: 16 });

  // Gentle exit as the drive begins
  gsap.to(film, { scale: 1.08, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to(hero.querySelector('.hero__content'), {
    y: -80, autoAlpha: 0.2, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'center top+=64', end: 'bottom top+=64', scrub: true },
  });

  return {
    intro() {
      gsap.to(words, { yPercent: 0, duration: 1.0, stagger: 0.08, ease: 'power4.out' });
      gsap.to([sub, cta], { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out', delay: 0.45 });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Intro: stats + pillars                                               */
/* ------------------------------------------------------------------ */

function setupIntro(C) {
  const root = document.querySelector('[data-intro]');
  const stats = C.intro.stats.map((s) => `
    <li class="stat">
      <span class="stat__value"><span class="stat__num" data-count="${esc(s.value)}">${esc(s.value)}</span>${s.unit ? `<span class="stat__unit">${esc(tx(s.unit))}</span>` : ''}</span>
      <span class="stat__label">${esc(tx(s.label))}</span>
    </li>`).join('');
  const pillars = C.pillars.map((p) => `
    <li class="pillar" style="--c:${p.color}">
      <div class="pillar__art"><img src="${asset(p.art)}" alt="" loading="lazy"></div>
      <div class="pillar__text">
        <h3 class="pillar__name">${esc(tx(p.name))}</h3>
        <p class="pillar__line">${esc(tx(p.line))}</p>
      </div>
    </li>`).join('');
  root.innerHTML = `
    <div class="nt-wrap">
      <div class="intro__head">
        <p class="nt-eyebrow eyebrow">${esc(UI.route)}</p>
        <h2 class="nt-h2" data-intro-title>${esc(tx(C.intro.title))}</h2>
        <p class="intro__body">${esc(tx(C.intro.body))}</p>
      </div>
      <ul class="stats">${stats}</ul>
      <p class="nt-eyebrow eyebrow intro__eyebrow2">${esc(UI.experiences)}</p>
      <ul class="pillars">${pillars}</ul>
    </div>`;

  if (REDUCE) return;

  const head = root.querySelector('.intro__head');
  gsap.from(head.children, {
    autoAlpha: 0, y: 24, duration: 0.8, stagger: 0.08, ease: 'power3.out',
    scrollTrigger: { trigger: head, start: 'top 80%' },
  });

  root.querySelectorAll('.stat').forEach((s, i) => {
    const num = s.querySelector('[data-count]');
    const raw = num.dataset.count;
    const target = parseFloat(raw.replace(/,/g, ''));
    const dec = (raw.split('.')[1] || '').length;
    const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const o = { v: 0 };
    num.textContent = fmt(0);
    gsap.timeline({ scrollTrigger: { trigger: s, start: 'top 85%' } })
      .from(s, { autoAlpha: 0, y: 24, duration: 0.6, ease: 'power3.out', delay: i * 0.08 })
      .to(o, { v: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { num.textContent = fmt(o.v); } }, '<');
  });

  gsap.from(root.querySelectorAll('.pillar'), {
    autoAlpha: 0, y: 48, duration: 0.9, stagger: 0.12, ease: 'power3.out',
    scrollTrigger: { trigger: root.querySelector('.pillars'), start: 'top 80%' },
  });
}

/* ------------------------------------------------------------------ */
/* HUD                                                                  */
/* ------------------------------------------------------------------ */

function setupHud() {
  const root = document.querySelector('[data-hud]');
  const odo = createOdometer(4);
  root.innerHTML = `
    <div class="hud__bar"><i></i></div>
    <div class="hud__odo"><span class="hud__unit">${esc(UI.km)}</span></div>
    <div class="hud__more">
      <div class="hud__stop">
        <span class="hud__count" data-hud-count></span>
        <span class="hud__name" data-hud-name><span></span></span>
      </div>
      <span class="hud__region" data-hud-region></span>
    </div>`;
  root.querySelector('.hud__odo').prepend(odo.root);
  root.dataset.state = 'compact';
  odo.set(0);
  const count = root.querySelector('[data-hud-count]');
  const name = root.querySelector('[data-hud-name]');
  const region = root.querySelector('[data-hud-region]');
  const bar = root.querySelector('.hud__bar i');
  let current = -1;
  let swapTl = null;

  return {
    show() { root.classList.add('is-on'); },
    setKm(v) {
      odo.set(v);
      bar.style.transform = `scaleX(${(v / TOTAL_KM).toFixed(4)})`;
    },
    setExpanded(on) { root.dataset.state = on ? 'full' : 'compact'; },
    setStop(stop, regionName, dir) {
      if (stop.n === current) return;
      current = stop.n;
      count.textContent = `${UI.stop} ${pad2(stop.n)} ${UI.of} 16`;
      region.textContent = regionName;
      const label = name.firstElementChild;
      const text = tx(stop.name);
      if (REDUCE || !label.textContent) {
        label.textContent = text;
        return;
      }
      const d = dir >= 0 ? 1 : -1;
      if (swapTl) swapTl.kill();
      swapTl = gsap.timeline()
        .to(label, { yPercent: -100 * d, duration: 0.16, ease: 'power2.in' })
        .add(() => { label.textContent = text; })
        .fromTo(label, { yPercent: 100 * d }, { yPercent: 0, duration: 0.34, ease: 'power3.out' });
    },
  };
}

/* ------------------------------------------------------------------ */
/* Journey: road, stops, car                                            */
/* ------------------------------------------------------------------ */

const CAR_SVG = `
<svg viewBox="0 0 34 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff5c8" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#fff5c8" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <polygon points="6,54 28,54 46,118 -12,118" fill="url(#beam)"/>
  <rect x="4" y="5" width="30" height="52" fill="#000" opacity="0.28"/>
  <rect x="0" y="9" width="4" height="11" fill="#141210"/>
  <rect x="30" y="9" width="4" height="11" fill="#141210"/>
  <rect x="0" y="37" width="4" height="11" fill="#141210"/>
  <rect x="30" y="37" width="4" height="11" fill="#141210"/>
  <rect x="3" y="1" width="28" height="53" fill="#fff5c8"/>
  <rect x="6" y="8" width="22" height="6" fill="#2a2520"/>
  <rect x="6" y="15" width="22" height="15" fill="#824628"/>
  <rect x="9" y="18" width="16" height="2" fill="#c88c3c"/>
  <rect x="9" y="25" width="16" height="2" fill="#c88c3c"/>
  <rect x="6" y="31" width="22" height="8" fill="#2a2520"/>
  <rect x="6" y="41" width="22" height="9" fill="#ebe6d2"/>
  <rect class="car__tail" x="5" y="1" width="7" height="3"/>
  <rect class="car__tail" x="22" y="1" width="7" height="3"/>
  <rect x="5" y="51" width="7" height="3" fill="#ffe9a8"/>
  <rect x="22" y="51" width="7" height="3" fill="#ffe9a8"/>
</svg>`;

const SCENERY = ['icon-1', 'icon-2', 'icon-6', 'icon-5', 'icon-3', 'icon-4'];

function renderDrive(C) {
  const drive = document.querySelector('[data-drive]');
  const regions = Object.fromEntries(C.regions.map((r) => [r.key, r]));
  let html = `
    <h2 class="sr-only">${esc(UI.stopsHeading)}</h2>
    <div class="nt-wrap">
      <div class="start" data-node="start">
        <div class="lane" data-lane></div>
        <div class="start__label">
          <p class="nt-eyebrow">${esc(UI.startHere)} · 0 ${esc(UI.km)}</p>
          <p class="start__hint">${esc(UI.startHint)}</p>
        </div>
      </div>`;
  let prevRegion = null;
  let chIndex = 0;
  C.stops.forEach((s) => {
    if (s.region !== prevRegion) {
      const r = regions[s.region];
      const iconName = SCENERY[(C.regions.indexOf(r) * 2 + 1) % SCENERY.length];
      html += `
      <div class="sign-node" data-node="sign" data-region="${s.region}">
        <div class="lane" data-lane></div>
        <img class="sign-node__icon" src="../assets/img/${iconName}.png" alt="" loading="lazy">
        <figure class="sign" data-sign>
          <div class="sign__panel">
            <span class="sign__arrow">${ICON.arrow}</span>
            <span class="sign__ar" lang="ar" dir="rtl">${esc(r.name.ar)}</span>
            <span class="sign__en" lang="en" dir="ltr">${esc(r.name.en)}</span>
            <span class="sign__count">${esc(tx(r.count))}</span>
          </div>
          <div class="sign__posts"><i></i><i></i></div>
        </figure>
      </div>`;
      prevRegion = s.region;
    }
    const side = chIndex % 2 === 0 ? 'start' : 'end';
    const drv = s.drive ? `+${tx(s.drive)}` : UI.firstStop;
    const rot = [7, -6, 5, -8, 6, -5][chIndex % 6];
    html += `
      <article class="ch" data-node="chapter" data-side="${side}" data-stop="${chIndex}" aria-labelledby="stop-${s.key}">
        <div class="lane" data-lane>
          <img class="ch__scenery" src="../assets/img/${SCENERY[chIndex % SCENERY.length]}.png" alt="" loading="lazy">
        </div>
        <div class="ch__body">
          <div class="ch__meta">
            <span class="ch__no">${esc(UI.stop)} <b>${pad2(s.n)}</b> ${esc(UI.of)} 16</span>
            <span class="ch__drive">${ICON.clock}<span>${esc(drv)}</span></span>
          </div>
          <h3 class="ch__name" id="stop-${s.key}">${esc(tx(s.name))}</h3>
          <div class="ch__text">
            <p class="ch__desc">${esc(tx(s.desc))}</p>
          </div>
          <div class="ch__media">
            <figure class="ch__photo"><img src="${asset(s.photo)}" alt="${esc(tx(s.name))}" loading="lazy" width="600" height="600"></figure>
            ${s.sticker ? `<img class="ch__sticker" src="${asset(s.sticker)}" alt="" style="--rot:${rot}deg" loading="lazy">` : ''}
          </div>
        </div>
      </article>`;
    chIndex++;
  });
  html += '</div>';
  drive.innerHTML = html;
}

function renderClosing(C) {
  const root = document.querySelector('[data-closing]');
  const last = C.stops[C.stops.length - 1];
  // The road ends here, inside the journey; the service area and the closing follow it.
  document.querySelector('[data-arrival]').innerHTML = `
    <div class="closing__end" data-node="end"><div class="lane" data-lane></div></div>
    <p class="nt-eyebrow closing__arrived nt-wrap">${esc(UI.arrived)} · ${esc(tx(last.name))} · ${TOTAL_KM.toLocaleString('en-US')} ${esc(UI.km)}</p>`;
  root.innerHTML = `
    <div class="closing__inner nt-wrap">
      <p class="closing__tag" lang="ar" dir="rtl">${esc(C.hero.tagline)}</p>
      <p class="closing__line">${esc(tx(C.closing.line))}</p>
      <img class="closing__logo" src="${asset(C.logo.cream)}" alt="Northern Trail" width="296" height="165">
      <a class="nt-btn nt-btn--light closing__again" href="#drive" data-again>${ICON.up}<span>${esc(UI.again)}</span></a>
    </div>`;
  root.querySelector('[data-again]').addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById('drive');
    const y = target.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top: y, behavior: REDUCE ? 'auto' : 'smooth' });
  });
}

function setupJourney(C, hud) {
  const journey = document.querySelector('[data-journey]');
  const svg = document.querySelector('[data-road]');
  const car = document.querySelector('[data-car]');
  car.innerHTML = CAR_SVG;
  const NS = 'http://www.w3.org/2000/svg';
  const chapters = [...journey.querySelectorAll('.ch')];
  const signs = [...journey.querySelectorAll('[data-sign]')];
  const regions = Object.fromEntries(C.regions.map((r) => [r.key, r]));

  // Cumulative km per stop: drive minutes mapped onto 0..1,200 km
  const totalMin = C.stops.reduce((a, s) => a + s.driveMinutes, 0);
  let acc = 0;
  const kmAt = C.stops.map((s) => {
    acc += s.driveMinutes;
    return (acc / totalMin) * TOTAL_KM;
  });

  const geo = { len: 0, lut: [], arrY: [], signY: [], startY: 0, endY: 0, path: null, trail: null, plates: [] };
  const state = { targetY: 0, y: -1, lastY: NaN, angle: 0, current: -2, maxReached: -1, signSide: [], slapped: new Set(), arrivedEnd: false };

  function build() {
    const phone = phoneMQ.matches;
    const jr = journey.getBoundingClientRect();
    const W = Math.round(jr.width);
    const H = Math.round(journey.scrollHeight);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';

    const pts = [];
    const laneX = (node) => {
      const l = node.querySelector('[data-lane]').getBoundingClientRect();
      return l.left + l.width / 2 - jr.left;
    };
    const rel = (node) => {
      const r = node.getBoundingClientRect();
      return { top: r.top - jr.top, bottom: r.bottom - jr.top, h: r.height };
    };
    journey.querySelectorAll('[data-node]').forEach((node) => {
      const kind = node.dataset.node;
      const r = rel(node);
      let x = laneX(node);
      if (kind === 'start') {
        pts.push({ x, y: 0 }, { x, y: r.bottom });
        geo.startY = Math.min(r.top + 120, r.bottom);
      } else if (kind === 'sign') {
        pts.push({ x, y: r.top + r.h * 0.3 }, { x, y: r.top + r.h * 0.7 });
        geo.signY.push(r.top + r.h * 0.5);
      } else if (kind === 'chapter') {
        const cs = getComputedStyle(node);
        const pt = parseFloat(cs.paddingTop);
        const pb = parseFloat(cs.paddingBottom);
        const D = phone ? 0 : 200;
        const a = r.top + pt + D;
        const b = Math.max(a + 1, r.bottom - pb - D);
        pts.push({ x, y: a, arrive: true }, { x, y: b });
      } else if (kind === 'end') {
        const yEnd = r.top + r.h * 0.62;
        pts.push({ x, y: yEnd });
        geo.endY = yEnd;
      }
    });

    // Path: straight runs where x holds, vertical-tangent S curves where it changes
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      if (Math.abs(p1.x - p0.x) < 0.5) d += ` L${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      else {
        const k = (p1.y - p0.y) * 0.5;
        d += ` C${p0.x.toFixed(1)} ${(p0.y + k).toFixed(1)} ${p1.x.toFixed(1)} ${(p1.y - k).toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
    }

    const roadW = phone ? 16 : 72;
    const mk = (cls, w, extra = {}) => {
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      p.setAttribute('class', cls);
      p.setAttribute('stroke-width', w);
      Object.entries(extra).forEach(([k, v]) => p.setAttribute(k, v));
      svg.append(p);
      return p;
    };
    mk('road__shoulder', roadW + (phone ? 8 : 20));
    geo.path = mk('road__asphalt', roadW);
    mk('road__dash', phone ? 1.5 : 3, { 'stroke-dasharray': phone ? '6 8' : '22 18' });
    geo.trail = mk('road__trail', phone ? 2 : 4);
    geo.len = geo.path.getTotalLength();
    geo.trail.style.strokeDasharray = `${geo.len} ${geo.len + 10}`;

    // Start line, stop lines and number plates
    const line = (x, y, w, h) => {
      const r = document.createElementNS(NS, 'rect');
      r.setAttribute('class', 'road__line');
      r.setAttribute('x', (x - w / 2).toFixed(1));
      r.setAttribute('y', (y - h / 2).toFixed(1));
      r.setAttribute('width', w);
      r.setAttribute('height', h);
      svg.append(r);
    };
    const start = pts[1];
    line(start.x, geo.startY, roadW, phone ? 3 : 8);
    geo.arrY = [];
    geo.plates = [];
    pts.filter((p) => p.arrive).forEach((p, i) => {
      geo.arrY.push(p.y);
      line(p.x, p.y, roadW, phone ? 2 : 4);
      if (!phone) {
        const side = chapters[i].dataset.side;
        // plate sits on the content side of the road
        const toContentLeft = (side === 'start') !== RTL;
        const px = p.x + (toContentLeft ? -1 : 1) * (roadW / 2 + 26);
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'road__plate');
        g.setAttribute('transform', `translate(${px.toFixed(1)} ${p.y.toFixed(1)})`);
        g.innerHTML = `<rect x="-17" y="-14" width="34" height="28"/><text text-anchor="middle" dominant-baseline="central" y="1">${pad2(i + 1)}</text>`;
        svg.append(g);
        geo.plates.push(g);
      }
    });
    // End cap
    const end = pts[pts.length - 1];
    line(end.x, geo.endY, roadW + (phone ? 8 : 20), phone ? 4 : 10);

    // Length lookup table for y -> length (y is monotonic along this path)
    const step = 4;
    const n = Math.ceil(geo.len / step);
    const lut = new Float32Array((n + 1) * 2);
    for (let i = 0; i <= n; i++) {
      const L = Math.min(geo.len, i * step);
      const q = geo.path.getPointAtLength(L);
      lut[i * 2] = L;
      lut[i * 2 + 1] = q.y;
    }
    geo.lut = lut;
    state.y = -1;
    state.lastY = NaN;
  }

  function lenAtY(y) {
    const lut = geo.lut;
    const n = lut.length / 2;
    if (y <= lut[1]) return 0;
    if (y >= lut[(n - 1) * 2 + 1]) return lut[(n - 1) * 2];
    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (lut[mid * 2 + 1] < y) lo = mid;
      else hi = mid;
    }
    const y0 = lut[lo * 2 + 1];
    const y1 = lut[hi * 2 + 1];
    const t = y1 > y0 ? (y - y0) / (y1 - y0) : 0;
    return lut[lo * 2] + t * (lut[hi * 2] - lut[lo * 2]);
  }

  function kmForY(y) {
    const a = geo.arrY;
    if (!a.length || y < a[0]) return 0;
    for (let i = 0; i < a.length - 1; i++) {
      if (y < a[i + 1]) {
        const f = (y - a[i]) / (a[i + 1] - a[i]);
        return kmAt[i] + f * (kmAt[i + 1] - kmAt[i]);
      }
    }
    return kmAt[kmAt.length - 1];
  }

  function stopIndexForY(y) {
    let idx = -1;
    for (let i = 0; i < geo.arrY.length; i++) if (y >= geo.arrY[i] - 2) idx = i;
    return idx;
  }

  function slap(i) {
    if (state.slapped.has(i)) return;
    state.slapped.add(i);
    const st = chapters[i].querySelector('.ch__sticker');
    if (!st || REDUCE) return;
    const rot = parseFloat(st.style.getPropertyValue('--rot')) || 6;
    gsap.fromTo(st,
      { autoAlpha: 0, scale: 1.9, rotation: rot - 28, y: -30 },
      { autoAlpha: 1, scale: 1, rotation: rot, y: 0, duration: 0.7, ease: 'back.out(2.4)', overwrite: true });
  }

  function onStopChange(idx, prev) {
    const s = C.stops[Math.max(0, idx)];
    hud.setStop(s, tx(regions[s.region].name), idx - prev);
    geo.plates.forEach((g, i) => g.classList.toggle('is-passed', i <= idx));
    if (idx > prev && idx >= 0) {
      for (let i = 0; i <= idx; i++) if (C.stops[i].sticker) slap(i);
      if (prev === -2) return;
      car.classList.add('is-braking');
      clearTimeout(state.brakeT);
      state.brakeT = setTimeout(() => car.classList.remove('is-braking'), 650);
    }
  }

  function render(y) {
    const len = lenAtY(y);
    const p = geo.path.getPointAtLength(len);
    const a = geo.path.getPointAtLength(Math.max(0, len - 6));
    const b = geo.path.getPointAtLength(Math.min(geo.len, len + 6));
    const target = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI - 90;
    state.angle += (target - state.angle) * 0.35;
    car.style.transform = `translate3d(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px, 0) rotate(${state.angle.toFixed(2)}deg)`;
    geo.trail.style.strokeDashoffset = (geo.len - len).toFixed(1);

    hud.setKm(kmForY(y));
    const idx = stopIndexForY(y);
    if (idx !== state.current) {
      const prev = state.current;
      state.current = idx;
      onStopChange(idx, prev);
    }
    // Region signs wobble as the car passes them
    geo.signY.forEach((sy, i) => {
      const side = y > sy ? 1 : -1;
      if (state.signSide[i] !== undefined && state.signSide[i] !== side && !REDUCE) {
        gsap.fromTo(signs[i], { rotation: 0 }, { keyframes: { rotation: [0, 3.5 * side, -2.5 * side, 1.2 * side, 0] }, duration: 1.1, ease: 'power1.out' });
      }
      state.signSide[i] = side;
    });
  }

  // Rebuilding recreates plates, so force the stop state to be re-applied
  function refresh() {
    build();
    state.current = -2;
    if (REDUCE) render(geo.endY);
  }

  build();

  if (REDUCE) {
    // Designed static version: the journey is complete, everything is visible
    state.angle = 0;
    render(geo.endY);
    hud.setExpanded(true);
    chapters.forEach((_, i) => state.slapped.add(i));
    return { refresh };
  }

  // Map scroll to the car: the car sits at the viewport centre line on the road
  const st = ScrollTrigger.create({
    trigger: journey,
    start: 'top center',
    end: 'bottom center',
    onUpdate: (self) => {
      state.targetY = self.start + (self.end - self.start) * self.progress - self.start;
    },
    onRefresh: (self) => {
      state.targetY = Math.max(0, Math.min(self.end - self.start, window.scrollY - self.start));
    },
  });
  ScrollTrigger.create({
    trigger: journey.querySelector('.ch'),
    start: 'top bottom',
    endTrigger: journey,
    end: 'bottom bottom',
    onToggle: (self) => hud.setExpanded(self.isActive || self.progress >= 1),
  });

  gsap.ticker.add(() => {
    const tgt = Math.max(geo.startY, Math.min(geo.endY, state.targetY));
    if (state.y < 0) state.y = tgt;
    else state.y += (tgt - state.y) * 0.16;
    if (Math.abs(tgt - state.y) < 0.05) state.y = tgt;
    if (state.y === state.lastY) return;
    state.lastY = state.y;
    render(state.y);
  });

  // Chapter reveals
  chapters.forEach((ch) => {
    const side = ch.dataset.side;
    const photo = ch.querySelector('.ch__photo');
    const img = photo.querySelector('img');
    const name = ch.querySelector('.ch__name');
    const meta = ch.querySelector('.ch__meta');
    const text = ch.querySelector('.ch__text');
    const fromRight = phoneMQ.matches ? !RTL : (side === 'start') !== RTL;
    gsap.fromTo(photo,
      { clipPath: fromRight ? 'inset(0% 0% 0% 100%)' : 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: photo, start: 'top bottom', end: phoneMQ.matches ? 'top 72%' : 'top 50%', scrub: 0.4 } });
    gsap.fromTo(img, { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom 40%', scrub: 0.4 } });
    const words = splitWords(name, name.textContent);
    gsap.set(words, { yPercent: 110 });
    gsap.set([meta, text], { autoAlpha: 0, y: 20 });
    ScrollTrigger.create({
      trigger: ch.querySelector('.ch__body'),
      start: 'top 82%',
      once: true,
      onEnter: () => {
        gsap.to(meta, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' });
        gsap.to(words, { yPercent: 0, duration: 0.9, stagger: 0.07, ease: 'power4.out', delay: 0.05 });
        gsap.to(text, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.25 });
      },
    });
    const sticker = ch.querySelector('.ch__sticker');
    if (sticker) gsap.set(sticker, { autoAlpha: 0 });
    const scenery = ch.querySelector('.ch__scenery');
    if (scenery) gsap.fromTo(scenery, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // Closing scene
  const closing = document.querySelector('[data-closing]');
  const inner = closing.querySelector('.closing__inner');
  const tag = closing.querySelector('.closing__tag');
  gsap.set(inner.children, { autoAlpha: 0, y: 24 });
  gsap.set(tag, { clipPath: 'inset(0% 0% 0% 100%)', autoAlpha: 1, y: 0 });
  ScrollTrigger.create({
    trigger: inner,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      const tl = gsap.timeline();
      tl.to(tag, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'power3.inOut' }, 0.05)
        .to([...inner.children].slice(1), { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: 'power3.out' }, 0.7);
    },
  });

  return { refresh, trigger: st };
}

/* ------------------------------------------------------------------ */
/* Boot                                                                 */
/* ------------------------------------------------------------------ */

async function boot() {
  renderChrome();
  const loaderDone = runLoader();
  const C = await fetch('../assets/content.json').then((r) => r.json());

  const hero = setupHero(C);
  setupIntro(C);
  renderDrive(C);
  renderClosing(C);
  mountServices(document.querySelector('[data-services]'), { C, LANG, RTL, REDUCE, gsap, phoneMQ, TOTAL_KM });
  const hud = setupHud();

  try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* fonts optional */ }
  const journey = setupJourney(C, hud);
  ScrollTrigger.refresh();

  // Rebuild the road when layout changes (fonts, images, resize, breakpoint)
  let t;
  let lastW = window.innerWidth;
  const rebuild = () => {
    clearTimeout(t);
    t = setTimeout(() => {
      journey.refresh();
      ScrollTrigger.refresh();
    }, 150);
  };
  new ResizeObserver(rebuild).observe(document.querySelector('[data-journey]'));
  window.addEventListener('resize', () => {
    if (window.innerWidth !== lastW) {
      lastW = window.innerWidth;
      rebuild();
    }
  });
  phoneMQ.addEventListener('change', () => location.reload());

  await loaderDone;
  hero.intro();
  if (!REDUCE) setTimeout(() => hud.show(), 600);

  // expose read-only state for verification
  window.__drive = { lang: LANG, reduce: REDUCE };
}

boot();
