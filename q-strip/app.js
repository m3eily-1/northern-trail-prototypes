// Northern Trail, direction Q: Strip map.
// The whole route is one sideways road. A car stays at the centre of the strip while the road
// slides under it; the dock below always shows what can be booked where the car is parked.

const params = new URLSearchParams(location.search);
const lang = params.get('lang') === 'ar' ? 'ar' : 'en';
const ar = lang === 'ar';
const dir = ar ? -1 : 1;
const root = document.documentElement;
const reduced = root.classList.contains('is-reduced');
const t0 = performance.now();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang]);
const A = (p) => '../' + p;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(2, '0');
const num = (n) => Number(n).toLocaleString('en-US');

const ico = (d, cls = '') => `<svg class="q-ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  prev: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  out: '<path d="M7 17 17 7M9 7h8v8"/>',
  drag: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="M8 5l11 7-11 7z"/>',
  ticket: '<path d="M3 7h18v4a2 2 0 0 0 0 4v2H3v-2a2 2 0 0 0 0-4z"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/>',
};

const T = {
  brand: { en: 'Northern Trail', ar: 'مسار الشمال' },
  route: { en: 'The route', ar: 'المسار' },
  stopOf: (n, t) => (ar ? `المحطة ${n} من ${t}` : `Stop ${n} of ${t}`),
  onRoad: { en: 'on the road', ar: 'على الطريق' },
  start: { en: 'Start of the trail', ar: 'بداية المسار' },
  startShort: { en: 'Start', ar: 'البداية' },
  from: (d, name) => (ar ? `${d} من ${name}` : `${d} from ${name}`),
  thisStop: { en: 'This stop', ar: 'هذه المحطة' },
  whole: { en: 'Whole route', ar: 'كل المسار' },
  scope: { en: 'Show bookings for', ar: 'اعرض الحجوزات في' },
  prevStop: { en: 'Previous stop', ar: 'المحطة السابقة' },
  nextStop: { en: 'Next stop', ar: 'المحطة التالية' },
  prevCards: { en: 'Previous cards', ar: 'البطاقات السابقة' },
  nextCards: { en: 'More cards', ar: 'المزيد من البطاقات' },
  slider: { en: 'Position on the route', ar: 'الموقع على المسار' },
  regions: { en: 'Jump to a region', ar: 'انتقل إلى منطقة' },
  drag: { en: 'Drag the road', ar: 'اسحب الطريق' },
  swipe: { en: 'Swipe the road', ar: 'مرّر الطريق' },
  showOnRoad: { en: 'Show on the road', ar: 'اعرضها على الطريق' },
  free: { en: 'Free', ar: 'مجانًا' },
  price: (n) => (ar ? `تبدأ من ${num(n)} ر.س` : `From SAR ${num(n)}`),
  tours: { en: 'tours', ar: 'جولات' },
  stays: { en: 'stays', ar: 'إقامات' },
  toursTab: { en: 'Tours', ar: 'الجولات' },
  staysTab: { en: 'Stays', ar: 'الإقامة' },
  noTours: (s) => (ar ? `لا توجد جولات للحجز في ${s} حاليًا.` : `No tours to book in ${s} yet.`),
  noStays: (s) => (ar ? `لا توجد إقامات في ${s} حاليًا.` : `No stays listed in ${s} yet.`),
  nextWith: (kind, s) =>
    ar
      ? `أقرب محطة فيها ${kind === 'tours' ? 'جولات' : 'إقامات'}: ${s}`
      : `Next stop with ${kind === 'tours' ? 'tours' : 'stays'}: ${s}`,
  pause: { en: 'Pause the film', ar: 'إيقاف الفيلم' },
  play: { en: 'Play the film', ar: 'تشغيل الفيلم' },
};

// Durations. Signs get the compact form, the dock and counter the full one.
function durShort(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (ar) return [h ? `${h} س` : '', m ? `${m} د` : ''].filter(Boolean).join(' ');
  return [h ? `${h} h` : '', m ? `${m} min` : ''].filter(Boolean).join(' ');
}
function durLong(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!ar) return durShort(min);
  const hh = h === 0 ? '' : h === 1 ? 'ساعة' : h === 2 ? 'ساعتان' : h <= 10 ? `${h} ساعات` : `${h} ساعة`;
  const mm = m === 0 ? '' : m === 1 ? 'دقيقة' : m === 2 ? 'دقيقتان' : m <= 10 ? `${m} دقائق` : `${m} دقيقة`;
  return [hh, mm].filter(Boolean).join(' و');
}

// ---------- language switch ----------
$$('.lang__btn').forEach((a) => {
  const q = new URLSearchParams(params);
  q.set('lang', a.dataset.lang);
  a.href = '?' + q.toString();
  if (a.dataset.lang === lang) a.setAttribute('aria-current', 'true');
});

// ---------- data ----------
const C = await (await fetch('../assets/content.json')).json();
document.title = `${L(T.brand)} | ${L(C.hero.title)}`;

const stops = C.stops;
const N = stops.length;
const stopIndex = Object.fromEntries(stops.map((s, i) => [s.key, i]));
const cum = [];
stops.forEach((s, i) => { cum[i] = (i ? cum[i - 1] : 0) + (s.driveMinutes || 0); });

const nearestStop = (o) => {
  let best = 0;
  let bd = Infinity;
  stops.forEach((s, i) => {
    const dx = (s.lng - o.lng) * Math.cos((o.lat * Math.PI) / 180);
    const dy = s.lat - o.lat;
    const d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = i; }
  });
  return best;
};
const all = {
  tours: C.tours.map((t) => ({ ...t, i: stopIndex[t.stop] })).sort((a, b) => a.i - b.i),
  stays: C.stays.map((s) => ({ ...s, i: nearestStop(s) })).sort((a, b) => a.i - b.i),
};
const at = stops.map((_, i) => ({
  tours: all.tours.filter((t) => t.i === i),
  stays: all.stays.filter((s) => s.i === i),
}));
const regionStart = Object.fromEntries(C.regions.map((r) => [r.key, stops.findIndex((s) => s.region === r.key)]));
const regionName = Object.fromEntries(C.regions.map((r) => [r.key, L(r.name)]));

// ---------- hero ----------
function renderHero() {
  const words = L(C.hero.title).split(' ');
  $('#hero').innerHTML = `
    <video class="hero__film" muted loop playsinline preload="metadata" poster="${A(C.film.poster)}" aria-hidden="true" tabindex="-1"></video>
    <div class="hero__in nt-wrap">
      <div class="hero__top">
        <img class="hero__logo" src="${A(C.logo.cream)}" alt="${L(T.brand)}" width="136" height="76">
        <button class="hero__pause" type="button"></button>
      </div>
      <div class="hero__text">
        <h1 class="hero__title" id="hero-title">${words.map((w, i) => `<span class="w"><span style="--i:${i}">${esc(w)}</span></span>`).join(' ')}</h1>
        <p class="hero__sub">${esc(L(C.hero.sub))}</p>
        <a class="nt-btn nt-btn--light hero__cta" href="#route">${esc(L(C.hero.cta))}${ico(I.down, 'nt-down')}</a>
      </div>
      <ul class="hero__stats">
        ${C.intro.stats.map((s) => `<li class="stat"><p class="stat__v">${esc(s.value)}${s.unit ? `<span class="stat__u">${esc(L(s.unit))}</span>` : ''}</p><p class="stat__l">${esc(L(s.label))}</p></li>`).join('')}
      </ul>
    </div>`;

  const video = $('.hero__film');
  const btn = $('.hero__pause');
  video.src = A(matchMedia('(max-width: 759px)').matches ? C.film.mobile : C.film.desktop);
  const sync = () => {
    const playing = !video.paused;
    btn.innerHTML = ico(playing ? I.pause : I.play);
    btn.setAttribute('aria-label', L(playing ? T.pause : T.play));
  };
  btn.addEventListener('click', () => { if (video.paused) video.play().catch(() => {}); else video.pause(); });
  video.addEventListener('play', sync);
  video.addEventListener('pause', sync);
  sync();
  if (!reduced) video.play().catch(() => {});
}

// ---------- the board ----------
const CAR = `
  <svg class="car__svg" viewBox="0 0 104 58" aria-hidden="true">
    <g class="car__body">
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
    <g class="wheel"><circle cx="26" cy="46" r="11" fill="#2d160a"/><circle cx="26" cy="46" r="5" fill="#fff5c8"/><rect x="25" y="36" width="2" height="20" fill="#2d160a"/><rect x="16" y="45" width="20" height="2" fill="#2d160a"/></g>
    <g class="wheel"><circle cx="80" cy="46" r="11" fill="#2d160a"/><circle cx="80" cy="46" r="5" fill="#fff5c8"/><rect x="79" y="36" width="2" height="20" fill="#2d160a"/><rect x="70" y="45" width="20" height="2" fill="#2d160a"/></g>
  </svg>`;

// Brand illustrations standing by the road, in the widest gaps (after stop index → art, [w, h]).
const SCENERY = [
  [0, 'icon-4', 635 / 640],
  [4, 'icon-3', 640 / 358],
  [7, 'icon-2', 585 / 640],
  [10, 'icon-5', 640 / 517],
  [13, 'icon-1', 640 / 555],
  [14, 'icon-6', 640 / 615],
];

function renderBoard() {
  const tag = (kind, n) => (n ? `<span class="tag${kind === 'stays' ? ' tag--stay' : ''}"><svg viewBox="0 0 24 24" aria-hidden="true">${kind === 'stays' ? I.bed : I.ticket}</svg>${n}<span class="sr"> ${L(T[kind])}</span></span>` : '');
  $('#route').innerHTML = `
    <div class="board__top nt-wrap">
      <div class="board__head">
        <h2 class="q-h2 board__title" id="route-title">${L(T.route)}</h2>
        <p class="board__count"><b class="board__n"></b><span class="board__time"></span></p>
      </div>
      <div class="chips" role="group" aria-label="${L(T.regions)}">
        ${C.regions.map((r) => `<button class="chip" type="button" data-region="${r.key}" aria-pressed="false">${esc(L(r.name))}<span class="chip__n">${esc(L(r.count))}</span></button>`).join('')}
      </div>
    </div>
    <div class="strip">
      <div class="far" aria-hidden="true">
        <svg class="far__dunes" preserveAspectRatio="none"><path/></svg>
      </div>
      <div class="scroller">
        <div class="track">
          <svg class="road" preserveAspectRatio="none" aria-hidden="true"><path class="road__ground"/><polyline class="road__line"/><polyline class="road__dash"/></svg>
          ${SCENERY.map(([i, art]) => `<div class="scn" data-after="${i}" aria-hidden="true"><img src="../assets/img/${art}.png" alt="" draggable="false"></div>`).join('')}
          <ol class="stops">
            ${stops.map((s, i) => `
              <li class="stop" data-i="${i}" style="--i:${i}">
                <span class="post"></span><span class="dot"></span>
                <button class="sign" type="button" tabindex="-1">
                  <span class="sign__photo"><img src="${A(s.photo)}" alt="" draggable="false" ${i > 3 ? 'loading="lazy"' : ''}><span class="sign__tags">${tag('tours', at[i].tours.length)}${tag('stays', at[i].stays.length)}</span></span>
                  <span class="sign__body">
                    <span class="sign__row"><span class="sign__n">${pad(s.n)}</span><span class="sign__name">${esc(L(s.name))}</span></span>
                    <span class="sign__drive">${i ? durShort(s.driveMinutes) : L(T.startShort)}</span>
                  </span>
                </button>
                ${s.sticker ? `<img class="sign__sticker" src="${A(s.sticker)}" alt="" draggable="false">` : ''}
              </li>`).join('')}
          </ol>
        </div>
      </div>
      <div class="carwrap" aria-hidden="true"><div class="car"><div class="car__flip">${CAR}<i class="puff"></i><i class="puff"></i><i class="puff"></i></div></div></div>
      <p class="hint" aria-hidden="true">${L(matchMedia('(hover: none)').matches ? T.swipe : T.drag)}${ico(I.drag, 'q-flip')}</p>
    </div>
    <div class="panel">
      <div class="mini-row nt-wrap">
        <button class="step" type="button" data-step="-1" aria-label="${L(T.prevStop)}">${ico(I.prev, 'q-flip')}</button>
        <div class="mini" role="slider" tabindex="0" aria-label="${L(T.slider)}" aria-valuemin="1" aria-valuemax="${N}" aria-valuenow="1">
          <span class="mini__line"></span>
          ${C.regions.map((r) => `<span class="mini__seg" data-r="${r.key}"></span>`).join('')}
          <span class="mini__fill"></span>
          ${stops.map((s, i) => `<span class="mini__tick"${at[i].tours.length + at[i].stays.length ? ' data-has' : ''}></span>`).join('')}
          <span class="mini__thumb"></span>
        </div>
        <button class="step" type="button" data-step="1" aria-label="${L(T.nextStop)}">${ico(I.next, 'q-flip')}</button>
      </div>
      <div class="dock nt-wrap">
        <div class="here"></div>
        <div class="book">
          <div class="book__bar">
            <div class="tabs" role="tablist">
              <button class="tab" type="button" role="tab" id="tab-tours" data-tab="tours" aria-controls="rail" aria-label="${esc(L(C.sections.tours.title))}"><span class="tab__full">${esc(L(C.sections.tours.title))}</span><span class="tab__short">${L(T.toursTab)}</span><span class="tab__n"></span></button>
              <button class="tab" type="button" role="tab" id="tab-stays" data-tab="stays" aria-controls="rail" aria-label="${esc(L(C.sections.stays.title))}"><span class="tab__full">${esc(L(C.sections.stays.title))}</span><span class="tab__short">${L(T.staysTab)}</span><span class="tab__n"></span></button>
            </div>
            <div class="scope" role="group" aria-label="${L(T.scope)}">
              <button class="scope__btn" type="button" data-scope="stop" aria-pressed="true">${L(T.thisStop)}</button>
              <button class="scope__btn" type="button" data-scope="route" aria-pressed="false">${L(T.whole)}</button>
            </div>
          </div>
          <div class="railwrap">
            <div class="rail" id="rail" role="tabpanel"></div>
            <button class="rail-go" type="button" data-rail="-1" aria-label="${L(T.prevCards)}">${ico(I.prev, 'q-flip')}</button>
            <button class="rail-go" type="button" data-rail="1" aria-label="${L(T.nextCards)}">${ico(I.next, 'q-flip')}</button>
          </div>
        </div>
      </div>
      <p class="sr" aria-live="polite" id="live"></p>
    </div>`;

  const board = $('#route');
  const strip = $('.strip', board);
  const far = $('.far', board);
  const scroller = $('.scroller', board);
  const road = $('.road', board);
  const car = $('.car', board);
  const flip = $('.car__flip', board);
  const mini = $('.mini', board);
  const rail = $('.rail', board);
  const here = $('.here', board);
  const live = $('#live');
  const stopEls = $$('.stop', board);
  const signs = $$('.sign', board);
  const ticks = $$('.mini__tick', board);
  const chips = $$('.chip', board);
  const tabs = $$('.tab', board);
  const [stepPrev, stepNext] = $$('[data-step]', board);
  const [railPrev, railNext] = $$('[data-rail]', board);

  // --- geometry: s is distance along the road in px, Y(s) the road height ---
  const G = { S: [], len: 0, half: 0, H: 0, base: 0, carH: 56, wheelR: 11 };
  const K1 = (Math.PI * 2) / 1100;
  const K2 = (Math.PI * 2) / 430;
  const Y = (s) => G.base - 16 * Math.sin(s * K1 + 0.6) - 6 * Math.sin(s * K2);
  const dY = (s) => -16 * K1 * Math.cos(s * K1 + 0.6) - 6 * K2 * Math.cos(s * K2);

  let active = -1;
  let p = 0;

  function layout() {
    const w = scroller.clientWidth;
    if (!w) return;
    const phone = matchMedia('(max-width: 759px)').matches;
    const cs = getComputedStyle(board);
    const signW = parseFloat(cs.getPropertyValue('--sign-w'));
    const signBottom = parseFloat(cs.getPropertyValue('--sign-top')) + parseFloat(cs.getPropertyValue('--sign-h'));
    const gap = phone ? 204 : 352;
    const k = phone ? 0.9 : 1.6;
    G.H = strip.clientHeight;
    G.half = w / 2;
    G.base = G.H - (phone ? 68 : 80);
    let s = 0;
    G.S = stops.map((st, i) => { s += i ? Math.round(gap + st.driveMinutes * k) : 0; return s; });
    G.len = s;
    strip.style.setProperty('--half', G.half + 'px');
    strip.style.setProperty('--len', G.len + 'px');

    stopEls.forEach((el, i) => {
      el.style.setProperty('--s', G.S[i] + 'px');
      el.style.setProperty('--y', Y(G.S[i]).toFixed(1) + 'px');
    });
    ticks.forEach((t, i) => t.style.setProperty('--f', (G.S[i] / G.len).toFixed(5)));
    $$('.mini__seg', board).forEach((seg, r) => {
      const keys = C.regions.map((x) => x.key);
      const a = G.S[regionStart[keys[r]]];
      const b = r + 1 < keys.length ? G.S[regionStart[keys[r + 1]]] : G.len;
      seg.style.setProperty('--a', (a / G.len).toFixed(5));
      seg.style.setProperty('--b', (b / G.len).toFixed(5));
    });

    // the road
    const W = G.len + G.half * 2;
    const pts = [];
    for (let x = 0; x <= W + 16; x += 16) pts.push(`${x},${Y(x - G.half).toFixed(1)}`);
    road.setAttribute('viewBox', `0 0 ${W} ${G.H}`);
    road.setAttribute('width', W);
    road.setAttribute('height', G.H);
    $('.road__ground', road).setAttribute('d', `M0,${G.H} L${pts.join(' L')} L${W + 16},${G.H} Z`);
    $('.road__line', road).setAttribute('points', pts.join(' '));
    $('.road__dash', road).setAttribute('points', pts.join(' '));

    // roadside illustrations, sized to the room between two signs
    $$('.scn', board).forEach((el, n) => {
      const i = SCENERY[n][0];
      const aspect = SCENERY[n][2];
      const mid = (G.S[i] + G.S[i + 1]) / 2;
      const y = Y(mid) - 5;
      const gapW = G.S[i + 1] - G.S[i];
      // either it stands tall between two signs, or it fits under them and only clears the posts
      const tall = Math.min(phone ? 112 : 176, (gapW - signW - 64) / aspect, y - 32);
      const low = Math.min(y - signBottom - 24, (gapW - (phone ? 96 : 176)) / aspect);
      const h = Math.max(40, tall, low);
      el.style.setProperty('--s', mid + 'px');
      el.style.setProperty('--y', y.toFixed(1) + 'px');
      el.style.setProperty('--h', Math.round(h) + 'px');
    });

    // the far layer moves at 0.4 of the road
    const fw = G.half * 2 + G.len * 0.4 + 240;
    far.style.width = fw + 'px';
    const dunes = $('.far__dunes', far);
    dunes.setAttribute('viewBox', `0 0 ${fw} ${G.H}`);
    let d = `M0,${G.H}`;
    for (let x = 0; x <= fw + 24; x += 24) d += ` L${x},${(G.H * 0.5 - 28 * Math.sin(x / 260) - 12 * Math.sin(x / 97 + 1)).toFixed(1)}`;
    $('path', dunes).setAttribute('d', d + ` L${fw + 24},${G.H} Z`);

    G.carH = car.offsetHeight || 56;
    G.wheelR = (11 * (car.offsetWidth || 104)) / 104;
    scroller.scrollLeft = dir * G.S[Math.max(0, active)];
    frame(true);
  }

  // --- the frame: everything that follows the scroll position ---
  let lastP = 0;
  let face = 1;
  let turn = 0;
  let wheel = 0;
  let raf = 0;
  let moveT = 0;
  let settleT = 0;
  let arrived = -1;

  const nearest = (pos) => {
    let b = 0;
    for (let i = 1; i < N; i++) if (Math.abs(G.S[i] - pos) < Math.abs(G.S[b] - pos)) b = i;
    return b;
  };

  function frame(force) {
    raf = 0;
    p = clamp(Math.abs(scroller.scrollLeft), 0, G.len);
    const dp = p - lastP;
    lastP = p;
    if (dp) {
      if (dp * face < 0) {
        turn += Math.abs(dp);
        if (turn > 30) { face = -face; turn = 0; flip.style.setProperty('--face', dir * face); }
      } else turn = 0;
      wheel += (dp * face * 57.2958) / G.wheelR;
      if (!reduced) car.classList.add('is-moving');
      clearTimeout(moveT);
      moveT = setTimeout(() => car.classList.remove('is-moving'), 140);
      clearTimeout(settleT);
      settleT = setTimeout(settle, 180);
      if (p > 40) board.classList.add('is-used');
    }
    const y = Y(p) + 3;
    const ang = (Math.atan(dir * dY(p)) * 180) / Math.PI;
    car.style.transform = `translate3d(-50%, ${(y - G.carH).toFixed(1)}px, 0) rotate(${ang.toFixed(2)}deg)`;
    car.style.setProperty('--w', wheel.toFixed(1) + 'deg');
    far.style.transform = `translate3d(${(dir * -p * 0.4).toFixed(1)}px, 0, 0)`;
    mini.style.setProperty('--f', (p / G.len).toFixed(5));
    const i = nearest(p);
    if (i !== active || force === true) setActive(i);
  }
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(frame); };

  // The car has stopped: if it is parked at a sign, the sign rings and the sticker lands.
  function settle() {
    if (active < 0 || Math.abs(p - G.S[active]) > 10) return;
    if (face !== 1) { face = 1; turn = 0; flip.style.setProperty('--face', dir); }
    if (arrived === active) return;
    arrived = active;
    const el = stopEls[active];
    el.classList.add('is-collected');
    if (reduced) return;
    car.classList.remove('is-bump');
    el.classList.remove('is-ding');
    void car.offsetWidth;
    car.classList.add('is-bump');
    el.classList.add('is-ding');
  }

  let dockT = 0;
  let firstDock = true;
  function setActive(i) {
    const changed = i !== active;
    active = i;
    const s = stops[i];
    stopEls.forEach((el, j) => {
      el.classList.toggle('is-active', j === i);
      el.classList.toggle('is-passed', j < i);
      if (j === i) el.classList.remove('is-hint');
      signs[j].tabIndex = j === i ? 0 : -1;
      if (j === i) signs[j].setAttribute('aria-current', 'true'); else signs[j].removeAttribute('aria-current');
    });
    board.dataset.region = s.region;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.region === s.region)));
    $('.board__n', board).textContent = ar ? `المحطة ${pad(s.n)} من ${N}` : `Stop ${pad(s.n)} of ${N}`;
    $('.board__time', board).innerHTML = `<span class="sep">·</span>${i ? `${durLong(cum[i])} ${L(T.onRoad)}` : L(T.start)}`;
    stepPrev.disabled = i === 0;
    stepNext.disabled = i === N - 1;
    mini.setAttribute('aria-valuenow', s.n);
    mini.setAttribute('aria-valuetext', `${T.stopOf(s.n, N)}: ${L(s.name)}`);
    if (!changed && !firstDock) return;
    clearTimeout(dockT);
    if (firstDock) { firstDock = false; renderDock(); } else dockT = setTimeout(renderDock, 160);
  }

  function goTo(i, instant) {
    i = clamp(i, 0, N - 1);
    scroller.scrollTo({ left: dir * G.S[i], behavior: instant || reduced ? 'auto' : 'smooth' });
  }

  // --- the dock ---
  let scope = 'stop';
  let pref = 'tours';
  let shown = 'tours';

  function renderDock() {
    const i = active;
    const s = stops[i];
    here.classList.toggle('has-sticker', !!s.sticker);
    here.innerHTML = `
      <p class="here__k" style="--i:0"><span>${T.stopOf(s.n, N)}</span><span class="sep">·</span><span>${esc(regionName[s.region])}</span></p>
      <h3 class="here__name" style="--i:1">${esc(L(s.name))}</h3>
      <p class="here__drive" style="--i:2">${i ? esc(T.from(L(s.drive), L(stops[i - 1].name))) : L(T.start)}</p>
      <p class="here__desc" style="--i:3">${esc(L(s.desc))}</p>
      ${s.sticker ? `<img class="here__sticker" src="${A(s.sticker)}" alt="">` : ''}`;
    const nt = at[i].tours.length;
    const ns = at[i].stays.length;
    live.textContent = lang === 'ar'
      ? `${T.stopOf(s.n, N)}: ${L(s.name)}. ${L(T.toursTab)}: ${nt}، ${L(T.staysTab)}: ${ns}.`
      : `${T.stopOf(s.n, N)}: ${L(s.name)}. ${nt} ${nt === 1 ? 'tour' : 'tours'}, ${ns} ${ns === 1 ? 'stay' : 'stays'}.`;
    if (scope === 'stop') {
      const other = pref === 'tours' ? 'stays' : 'tours';
      shown = at[i][pref].length || !at[i][other].length ? pref : other;
      renderBook();
    }
  }

  const stayPrice = (s) => (s.priceFrom ? (ar ? `${L(C.sections.stays.from)} ${num(s.priceFrom)} ر.س ${L(C.sections.stays.night)}` : `${L(C.sections.stays.from)} SAR ${num(s.priceFrom)} ${L(C.sections.stays.night)}`) : '');
  const pinBtn = (item) => (scope === 'route' ? `<button class="card__pin" type="button" data-go="${item.i}" aria-label="${L(T.showOnRoad)}: ${esc(L(stops[item.i].name))}">${ico(I.pin)}</button>` : '');

  function tourCard(t, n) {
    const price = t.price === 0 ? L(T.free) : t.price ? T.price(t.price) : '';
    return `
      <article class="card card--tour" style="--i:${n}" data-i="${t.i}">
        ${pinBtn(t)}
        <div class="card__photo"><img src="${A(t.photo)}" alt="" loading="lazy" draggable="false"></div>
        <div class="card__body">
          <p class="card__top"><span class="card__tag">${esc(scope === 'route' ? L(stops[t.i].name) : L(t.type))}</span><span class="card__price">${price}</span></p>
          <h3 class="card__title"><a class="card__link" href="${esc(L(t.href))}" target="_blank" rel="noopener" draggable="false">${esc(L(t.title))}</a></h3>
          <p class="card__meta">${esc(L(t.until))}</p>
          <p class="card__foot">${esc(L(C.sections.tours.cta))}${ico(I.out, 'q-flip')}</p>
        </div>
      </article>`;
  }
  function stayCard(s, n) {
    const title = s.href
      ? `<a class="card__link" href="${esc(L(s.href))}" target="_blank" rel="noopener" draggable="false">${esc(L(s.name))}</a>`
      : esc(L(s.name));
    const foot = s.href
      ? `<p class="card__foot">${esc(L(C.sections.tours.cta))}${ico(I.out, 'q-flip')}</p>`
      : `<p class="card__foot card__foot--soon">${esc(L(C.sections.stays.soon))}</p>`;
    return `
      <article class="card card--stay${s.href ? ' card--tour' : ''}" style="--i:${n}" data-i="${s.i}">
        ${pinBtn(s)}
        <div class="card__photo"><img src="${A(s.photo)}" alt="" loading="lazy" draggable="false"></div>
        <div class="card__body">
          <p class="card__top"><span class="card__tag">${esc(L(s.city))}</span><span class="card__price">${stayPrice(s)}</span></p>
          <h3 class="card__title">${title}</h3>
          <p class="card__meta">${esc(L(s.tagline))}</p>
          ${foot}
        </div>
      </article>`;
  }

  function renderBook() {
    const src = scope === 'route' ? all : at[active];
    tabs.forEach((t) => {
      const n = src[t.dataset.tab].length;
      const on = t.dataset.tab === shown;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const badge = $('.tab__n', t);
      badge.textContent = n;
      badge.toggleAttribute('data-zero', !n);
      t.setAttribute('aria-label', `${L(C.sections[t.dataset.tab].title)}: ${n}`);
    });
    $$('.scope__btn', board).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.scope === scope)));
    rail.setAttribute('aria-labelledby', 'tab-' + shown);
    const items = src[shown];
    rail.classList.toggle('is-empty', !items.length);
    if (items.length) {
      rail.innerHTML = items.map(shown === 'tours' ? tourCard : stayCard).join('');
    } else {
      const name = L(stops[active].name);
      let j = -1;
      for (let k = active + 1; k < N && j < 0; k++) if (at[k][shown].length) j = k;
      for (let k = active - 1; k >= 0 && j < 0; k--) if (at[k][shown].length) j = k;
      rail.innerHTML = `
        <div class="empty">
          <p class="empty__t">${esc(shown === 'tours' ? T.noTours(name) : T.noStays(name))}</p>
          ${j >= 0 ? `<button class="nt-btn nt-btn--light" type="button" data-go="${j}">${esc(T.nextWith(shown, L(stops[j].name)))}${ico(I.next, 'nt-flip q-flip')}</button>` : ''}
        </div>`;
    }
    rail.scrollLeft = 0;
    hintStop(-1);
    updateRailArrows();
  }

  function updateRailArrows() {
    const pos = Math.abs(rail.scrollLeft);
    const max = rail.scrollWidth - rail.clientWidth;
    railPrev.disabled = pos < 4;
    railNext.disabled = pos > max - 4;
    rail.parentNode.classList.toggle('can-prev', !railPrev.disabled);
    rail.parentNode.classList.toggle('can-next', !railNext.disabled);
  }
  function hintStop(i) {
    ticks.forEach((t, j) => t.classList.toggle('is-hint', j === i));
    stopEls.forEach((el, j) => el.classList.toggle('is-hint', j === i && j !== active));
  }

  // --- mouse drag on a horizontal scroller (touch and trackpads scroll natively) ---
  function dragScroll(el, onEnd) {
    let d = null;
    let block = false;
    el.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      d = { x: e.clientX, left: el.scrollLeft, moved: false, lx: e.clientX, lt: e.timeStamp, v: 0 };
    });
    addEventListener('pointermove', (e) => {
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved) {
        if (Math.abs(dx) < 5) return;
        d.moved = true;
        el.classList.add('is-drag');
      }
      const dt = e.timeStamp - d.lt;
      if (dt > 0) { d.v = 0.6 * d.v + (0.4 * (e.clientX - d.lx)) / dt; d.lx = e.clientX; d.lt = e.timeStamp; }
      el.scrollLeft = d.left - dx;
    });
    const end = () => {
      if (!d) return;
      const was = d;
      d = null;
      if (!was.moved) return;
      block = true;
      setTimeout(() => { block = false; }, 0);
      el.classList.remove('is-drag');
      if (onEnd) onEnd(was.v);
    };
    addEventListener('pointerup', end);
    addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => { if (block) { e.preventDefault(); e.stopPropagation(); } }, true);
    el.addEventListener('dragstart', (e) => e.preventDefault());
  }

  // --- events ---
  scroller.addEventListener('scroll', onScroll, { passive: true });
  dragScroll(scroller, (v) => goTo(nearest(clamp(Math.abs(scroller.scrollLeft - v * 220), 0, G.len))));
  dragScroll(rail);
  rail.addEventListener('scroll', updateRailArrows, { passive: true });

  $('.stops', board).addEventListener('click', (e) => {
    const el = e.target.closest('.stop');
    if (el) goTo(+el.dataset.i);
  });
  strip.addEventListener('keydown', (e) => {
    let t = null;
    if (e.key === 'ArrowRight') t = active + dir;
    else if (e.key === 'ArrowLeft') t = active - dir;
    else if (e.key === 'Home') t = 0;
    else if (e.key === 'End') t = N - 1;
    if (t == null) return;
    e.preventDefault();
    t = clamp(t, 0, N - 1);
    goTo(t);
    signs[t].focus({ preventScroll: true });
  });
  stepPrev.addEventListener('click', () => goTo(active - 1));
  stepNext.addEventListener('click', () => goTo(active + 1));
  chips.forEach((c) => c.addEventListener('click', () => goTo(regionStart[c.dataset.region])));

  // minimap: scrub with the pointer, step with the keys
  let scrub = false;
  const scrubTo = (e) => {
    const r = mini.getBoundingClientRect();
    let f = (e.clientX - r.left) / r.width;
    if (ar) f = 1 - f;
    scroller.scrollLeft = dir * clamp(f, 0, 1) * G.len;
  };
  mini.addEventListener('pointerdown', (e) => {
    scrub = true;
    mini.setPointerCapture(e.pointerId);
    scroller.classList.add('is-drag');
    scrubTo(e);
  });
  mini.addEventListener('pointermove', (e) => { if (scrub) scrubTo(e); });
  const scrubEnd = () => {
    if (!scrub) return;
    scrub = false;
    scroller.classList.remove('is-drag');
    goTo(nearest(Math.abs(scroller.scrollLeft)));
  };
  mini.addEventListener('pointerup', scrubEnd);
  mini.addEventListener('pointercancel', scrubEnd);
  mini.addEventListener('keydown', (e) => {
    let t = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') t = active + (e.key === 'ArrowUp' ? 1 : dir);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') t = active - (e.key === 'ArrowDown' ? 1 : dir);
    else if (e.key === 'PageUp') t = active + 3;
    else if (e.key === 'PageDown') t = active - 3;
    else if (e.key === 'Home') t = 0;
    else if (e.key === 'End') t = N - 1;
    if (t == null) return;
    e.preventDefault();
    goTo(t);
  });

  // dock: tabs, scope, rail arrows, jump buttons
  tabs.forEach((t) => t.addEventListener('click', () => { pref = shown = t.dataset.tab; renderBook(); }));
  $('.tabs', board).addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tabs.find((t) => t.dataset.tab !== shown);
    next.click();
    next.focus();
  });
  $$('.scope__btn', board).forEach((b) => b.addEventListener('click', () => {
    if (scope === b.dataset.scope) return;
    scope = b.dataset.scope;
    if (scope === 'stop') {
      const other = pref === 'tours' ? 'stays' : 'tours';
      shown = at[active][pref].length || !at[active][other].length ? pref : other;
    } else shown = pref;
    renderBook();
  }));
  const railStep = () => (($('.card', rail) || {}).offsetWidth || 448) + (parseFloat(getComputedStyle(rail).columnGap) || 24);
  const railBy = (n) => rail.scrollBy({ left: dir * n * railStep() * (rail.clientWidth > 900 ? 2 : 1), behavior: reduced ? 'auto' : 'smooth' });
  railPrev.addEventListener('click', () => railBy(-1));
  railNext.addEventListener('click', () => railBy(1));
  rail.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (!go) return;
    goTo(+go.dataset.go);
    if (matchMedia('(max-width: 1100px)').matches) board.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
  });
  rail.addEventListener('pointerover', (e) => {
    const c = e.target.closest('.card');
    hintStop(c && scope === 'route' ? +c.dataset.i : -1);
  });
  rail.addEventListener('pointerleave', () => hintStop(-1));
  rail.addEventListener('focusin', (e) => {
    const c = e.target.closest('.card');
    hintStop(c && scope === 'route' ? +c.dataset.i : -1);
  });
  rail.addEventListener('focusout', () => hintStop(-1));

  // --- start ---
  const startAt = clamp((parseInt(params.get('stop'), 10) || 1) - 1, 0, N - 1);
  active = startAt;
  flip.style.setProperty('--face', dir);
  layout();
  arrived = active;
  if (stops[active].sticker) stopEls[active].classList.add('is-collected');
  let rt = 0;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(layout, 120); }).observe(strip);

  if (reduced) {
    board.classList.add('is-in', 'is-settled');
  } else {
    const io = new IntersectionObserver((en) => {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      board.classList.add('is-in');
      car.classList.add('is-moving');
      setTimeout(() => { board.classList.add('is-settled'); car.classList.remove('is-moving'); }, 1900);
    }, { threshold: 0.3 });
    io.observe(strip);
  }
}

// ---------- about, tips, FAQ, closing ----------
function renderRest() {
  $('#about').innerHTML = `
    <div class="about__in nt-wrap">
      <div class="rv">
        <h2 class="q-h2" id="about-title">${esc(L(C.intro.title))}</h2>
        <p class="about__body">${esc(L(C.intro.body))}</p>
      </div>
      <ul class="pillars">
        ${C.pillars.map((x, i) => `
          <li class="pillar rv" style="--c:${x.color}; --i:${i + 1}">
            <img class="pillar__art" src="${A(x.art)}" alt="" loading="lazy">
            <h3 class="pillar__name">${esc(L(x.name))}</h3>
            <p class="pillar__line">${esc(L(x.line))}</p>
          </li>`).join('')}
      </ul>
    </div>`;

  $('#tips').innerHTML = `
    <h2 class="q-h2 rv" id="tips-title">${esc(L(C.sections.tips.title))}</h2>
    <ol class="tips__list">
      ${C.tips.map((t, i) => `
        <li class="tip rv" style="--i:${i}">
          <span class="tip__n" aria-hidden="true">${pad(i + 1)}</span>
          <div><h3 class="tip__t">${esc(L(t.title))}</h3><p class="tip__x">${esc(L(t.text))}</p></div>
        </li>`).join('')}
    </ol>`;

  $('#faq').innerHTML = `
    <h2 class="q-h2 rv" id="faq-title">${esc(L(C.sections.faq.title))}</h2>
    <div class="faq__list rv">
      ${C.faq.map((f, i) => `
        <div class="qa">
          <h3><button class="qa__btn" type="button" id="qa-b${i}" aria-expanded="${i === 0}" aria-controls="qa-p${i}"><span>${esc(L(f.q))}</span><span class="qa__mark" aria-hidden="true"></span></button></h3>
          <div class="qa__panel${i === 0 ? ' is-open' : ''}" id="qa-p${i}" role="region" aria-labelledby="qa-b${i}"><div><p class="qa__a">${esc(L(f.a))}</p></div></div>
        </div>`).join('')}
    </div>`;
  const btns = $$('.qa__btn');
  btns.forEach((b) => b.addEventListener('click', () => {
    const open = b.getAttribute('aria-expanded') === 'true';
    btns.forEach((o) => {
      const on = o === b && !open;
      o.setAttribute('aria-expanded', String(on));
      $('#' + o.getAttribute('aria-controls')).classList.toggle('is-open', on);
    });
  }));

  $('#closing').innerHTML = `
    <div class="closing__in nt-wrap">
      <h2 class="closing__tag rv" id="closing-title" lang="ar" dir="rtl">${esc(C.hero.tagline)}</h2>
      <p class="closing__line rv" style="--i:1">${esc(L(C.closing.line))}</p>
      <img class="closing__logo rv" style="--i:2" src="${A(C.logo.cream)}" alt="${L(T.brand)}" width="176" height="98" loading="lazy">
    </div>`;

  if (reduced) return;
  const io = new IntersectionObserver((en) => {
    en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -5% 0px' });
  $$('.rv').forEach((x) => io.observe(x));
}

// ---------- go ----------
renderHero();
renderBoard();
renderRest();

if (root.classList.contains('has-loader')) {
  const fonts = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
  const wait = new Promise((r) => setTimeout(r, Math.max(0, 1150 - (performance.now() - t0))));
  await Promise.all([fonts, wait]);
  root.classList.add('is-ready');
  setTimeout(() => { $('#loader')?.remove(); root.classList.remove('has-loader'); }, 600);
} else {
  root.classList.add('is-ready');
  $('#loader')?.remove();
}
if (location.hash === '#route') $('#route').scrollIntoView();
