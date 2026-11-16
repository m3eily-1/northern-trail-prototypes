// Signature: the trip radio. One state (v = continuous dial position 0..15, progress 0..1)
// drives three views: the desktop unit (pinned, scroll scrubbed), the phone now-playing card
// with a swipe strip, and the tracklist. Scroll is the source of truth in pinned and list modes;
// the dial, keys, presets and tracklist all tune by moving the page.
import { t, esc, asset, l, lang, isRTL, isReduced, reducedMQ, pad2, hm, regionShort, icons, tween } from './util.js';
import { createAudio } from './audio.js';
import { createEQ } from './eq.js';

const HOST = 64; // webook sticky header stand-in
const SEG_VH = 0.62; // scroll length per station, in viewport heights
const DWELL = 0.7; // share of each segment where the station is locked (track plays)
const DEG = 36; // dial degrees per station
const SP = 64; // phone strip px per station
const ease = (s) => 0.5 - 0.5 * Math.cos(Math.PI * s);
const invEase = (e) => Math.acos(1 - 2 * e) / Math.PI;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

const REGION_COLOR = { riyadh: '#c88c3c', qassim: '#8f9a5a', hail: '#a06eb4' };

export function mountRadio(root, data) {
  const stops = data.stops;
  const N = stops.length;
  const other = lang() === 'ar' ? 'en' : 'ar';
  let acc = 0;
  const cum = stops.map((s) => (acc += s.driveMinutes || 0));
  const total = cum[N - 1];
  const pos = cum.map((m) => 2.5 + (m / total) * 95); // % along the band, true to drive time
  const groups = data.regions.map((r) => {
    const idx = stops.map((s, i) => (s.region === r.key ? i : -1)).filter((i) => i >= 0);
    return { r, a: idx[0], b: idx[idx.length - 1] };
  });
  const regionOf = (i) => groups.find((g) => i >= g.a && i <= g.b);

  const audio = createAudio();
  const eq = createEQ(audio);

  const statN = data.intro.stats[1];
  const heading = `${statN.value} ${lang() === 'en' ? t(statN.label).toLowerCase() : t(statN.label)}`;
  const trackOf = (i) => `${l('track')} ${pad2(i + 1)} ${l('of')} ${N}`;
  const stickerHTML = (s, cls) =>
    s.sticker
      ? `<img class="${cls} sticker" src="${asset(s.sticker)}" alt="" width="240" height="240">`
      : `<span class="${cls} lsticker"><b>${pad2(s.n)}</b><span>${esc(regionShort(regionOf(s.n - 1).r))}</span></span>`;
  const hours = [];
  for (let h = 0; h * 60 <= total; h += 2) hours.push(h);

  root.innerHTML = `
  <div class="radio__head nt-wrap">
    <p class="radio__eyebrow nt-eyebrow" data-reveal><i class="led led--on"></i><span>NT 1200</span><span class="dot-sep"></span><span>${esc(l('nowPlaying'))}</span></p>
    <h2 class="nt-h2" data-reveal>${esc(heading)}</h2>
    <p class="radio__hint" data-reveal><span class="hint-pin">${esc(l('dialHint'))}</span><span class="hint-list">${esc(l('swipe'))}</span></p>
  </div>

  <div class="radio__pin">
    <div class="radio__stage">
      <div class="nt-wrap radio__grid">
        <div class="unit">
          <div class="unit__top">
            <span class="plate"><span class="plate__nt">NT</span><span class="plate__num">1200</span></span>
            <img class="unit__logo" src="${asset(data.logo.cream)}" alt="" width="296" height="165">
            <span class="unit__onair"><i class="led led--on"></i>${esc(l('onAir'))}</span>
            <button class="sound" type="button" aria-pressed="false" aria-label="${esc(l('sound'))}">
              <i class="led"></i>${icons.speaker}<span class="sound__txt">${esc(l('soundOn'))}</span>
            </button>
          </div>

          <div class="disp">
            <div class="disp__art">
              <div class="vinyl" aria-hidden="true"><span class="vinyl__disc"><span class="vinyl__label"></span></span></div>
              <div class="sleeve"><img class="sleeve__img" alt=""><img class="sleeve__img" alt=""></div>
              <div class="disp__sticker" aria-hidden="true"></div>
            </div>
            <div class="disp__meta">
              <div class="disp__status">
                <span class="disp__trk"></span>
                <span class="disp__region"><i></i><span></span></span>
                <span class="disp__trip"><small>${esc(l('tripTime'))}</small><b></b></span>
              </div>
              <p class="disp__name"></p>
              <p class="disp__alt" lang="${other}"></p>
              <div class="prog">
                <div class="prog__bar"><i class="prog__fill"></i></div>
                <div class="prog__times"><b class="prog__el">${hm(0)}</b><span class="prog__drive"></span><b class="prog__len">${hm(0)}</b></div>
              </div>
              <div class="notes"><p class="notes__k">${esc(l('liner'))}</p><p class="notes__p"></p></div>
            </div>
            <span class="disp__static" aria-hidden="true"></span>
            <span class="disp__tuning" aria-hidden="true">${esc(l('tuning'))}</span>
          </div>

          <div class="band">
            <div class="band__regions" aria-hidden="true">${groups
              .map(
                ({ r, a, b }) =>
                  `<span class="band__region" style="--a:${pos[a]}%;--w:${pos[b] - pos[a]}%;--rc:${REGION_COLOR[r.key]}"><b>${esc(regionShort(r))}</b></span>`
              )
              .join('')}</div>
            <div class="band__scale" aria-hidden="true">
              <span class="band__ticks"></span>
              ${stops.map((s, i) => `<span class="band__st" style="--p:${pos[i]}%;--rc:${REGION_COLOR[s.region]}"></span>`).join('')}
              <span class="band__needle"></span>
            </div>
            <div class="band__hours" aria-hidden="true">${hours
              .map((h, k) => `<span style="--p:${2.5 + ((h * 60) / total) * 95}%">${h}${k === hours.length - 1 ? ` ${esc(l('h'))}` : ''}</span>`)
              .join('')}</div>
          </div>

          <div class="ctrl">
            <div class="keys">
              <div class="keys__group">
                <p class="keys__k">${esc(l('presets'))}</p>
                <div class="presets">${groups
                  .map(
                    ({ r, a }, k) => `<button class="key preset" type="button" data-i="${a}" data-region="${r.key}">
                      <i class="led"></i><b>${k + 1}</b><span>${esc(regionShort(r))}</span></button>`
                  )
                  .join('')}</div>
              </div>
              <div class="keys__group">
                <p class="keys__k">${esc(l('seek'))}</p>
                <div class="seek">
                  <button class="key seekbtn" type="button" data-step="-1" aria-label="${esc(l('prev'))}">${icons.prev}</button>
                  <button class="key seekbtn" type="button" data-step="1" aria-label="${esc(l('next'))}">${icons.next}</button>
                </div>
              </div>
            </div>
            <div class="grille"><span class="grille__eq"></span></div>
            <div class="dialwrap">
              <div class="dial" role="slider" tabindex="0" aria-label="${esc(l('dial'))}" aria-valuemin="1" aria-valuemax="${N}" aria-valuenow="1">
                <svg class="dial__scale" viewBox="0 0 200 200" aria-hidden="true">${Array.from({ length: 40 }, (_, k) => {
                  const major = k % 4 === 0;
                  return `<rect x="99" y="${major ? 2 : 5}" width="2" height="${major ? 10 : 5}" transform="rotate(${k * 9} 100 100)" class="${major ? 'mj' : ''}"/>`;
                }).join('')}</svg>
                <div class="dial__knob"><span class="dial__grip"></span><span class="dial__cap"></span><i class="dial__mark"></i></div>
              </div>
            </div>
          </div>
        </div>

        <div class="radio__side">
          <aside class="jcard" aria-label="${esc(l('tracklist'))}">
            <div class="jcard__head">
              <h3 class="jcard__title">${esc(l('tracklist'))}</h3>
              <span class="jcard__total">${N} ${esc(l('tracks'))}<span class="dot-sep"></span>${esc(l('total'))} ${hm(total)}</span>
            </div>
            <div class="jcard__body">${groups
              .map(
                ({ r, a, b }) => `
              <div class="jgroup" style="--rc:${REGION_COLOR[r.key]}">
                <p class="jgroup__name">${esc(regionShort(r))}</p>
                <ol class="jgroup__list">${stops
                  .slice(a, b + 1)
                  .map(
                    (s, k) => `<li><button class="jrow" type="button" data-i="${a + k}">
                      <span class="jrow__n">${pad2(s.n)}</span><span class="jrow__name">${esc(t(s.name))}</span>
                      <span class="jrow__eq eqm" aria-hidden="true"><i></i><i></i><i></i></span>
                      <span class="jrow__len">${s.driveMinutes ? hm(s.driveMinutes) : esc(l('start'))}</span></button></li>`
                  )
                  .join('')}</ol>
              </div>`
              )
              .join('')}</div>
          </aside>
        </div>
      </div>
    </div>
  </div>

  <div class="booklet nt-wrap">${groups
    .map(
      ({ r, a, b }) => `
    <section class="bgroup" style="--rc:${REGION_COLOR[r.key]}">
      <header class="bgroup__head"><h3 class="bgroup__name">${esc(t(r.name))}</h3><span class="bgroup__count">${esc(t(r.count))}</span></header>
      <ol class="bgroup__list">${stops
        .slice(a, b + 1)
        .map(
          (s, k) => `
        <li class="trk" data-i="${a + k}" id="stop-${s.key}">
          <div class="trk__head"><span class="trk__no">${pad2(s.n)}</span><span class="trk__k">/ ${N}</span><span class="trk__len">${esc(s.drive ? `${l('drive')} ${t(s.drive)}` : l('start'))}</span></div>
          <figure class="trk__art"><img src="${asset(s.photo)}" alt="${esc(t(s.name))}" loading="lazy" width="600" height="600">${stickerHTML(s, 'trk__sticker')}</figure>
          <h4 class="trk__name">${esc(t(s.name))}</h4>
          <p class="trk__alt" lang="${other}">${esc(s.name[other])}</p>
          <p class="trk__notes">${esc(t(s.desc))}</p>
        </li>`
        )
        .join('')}</ol>
    </section>`
    )
    .join('')}</div>

  <div class="np" aria-label="${esc(l('nowPlaying'))}" role="region">
    <span class="np__prog"><i></i></span>
    <div class="np__strip" role="slider" tabindex="0" aria-label="${esc(l('swipe'))}" aria-valuemin="1" aria-valuemax="${N}" aria-valuenow="1">
      <div class="np__track">${stops
        .map((s, i) => {
          const g = regionOf(i);
          return `<button class="np__st" type="button" tabindex="-1" data-i="${i}" style="--rc:${REGION_COLOR[s.region]}">${
            g.a === i ? `<em>${esc(regionShort(g.r))}</em>` : ''
          }<i></i><span>${pad2(s.n)}</span></button>`;
        })
        .join('')}</div>
    </div>
    <span class="np__needle" aria-hidden="true"></span>
    <div class="np__row">
      <div class="np__art"><img alt=""><span class="np__eq"></span></div>
      <div class="np__txt"><span class="np__k"></span><span class="np__name"></span></div>
      <button class="sbtn np__sound sound" type="button" aria-pressed="false" aria-label="${esc(l('sound'))}">${icons.speaker}</button>
      <button class="sbtn np__list" type="button" aria-label="${esc(l('openList'))}">${icons.list}</button>
    </div>
  </div>

  <div class="sheet" hidden>
    <div class="sheet__scrim" data-close></div>
    <div class="sheet__panel" role="dialog" aria-modal="true" aria-label="${esc(l('tracklist'))}">
      <button class="sbtn sheet__close" type="button" data-close aria-label="${esc(l('close'))}">${icons.close}</button>
      <div class="sheet__slot"></div>
    </div>
  </div>
  <p class="sr-only" aria-live="polite"></p>`;

  // ---------- refs
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const pin = $('.radio__pin');
  const side = $('.radio__side');
  const jcard = $('.jcard');
  const disp = $('.disp');
  const sleeveImgs = $$('.sleeve__img');
  const stickerSlot = $('.disp__sticker');
  const scale = $('.band__scale');
  const needle = $('.band__needle');
  const marks = $$('.band__st');
  const knob = $('.dial__knob');
  const dial = $('.dial');
  const fill = $('.prog__fill');
  const elEl = $('.prog__el');
  const rows = $$('.jrow');
  const presets = $$('.preset');
  const cards = $$('.trk');
  const booklet = $('.booklet');
  const np = $('.np');
  const strip = $('.np__strip');
  const stripSt = $$('.np__st');
  const sheet = $('.sheet');
  const live = $('[aria-live]');
  const soundBtns = $$('.sound');
  const npProg = $('.np__prog i');

  eq.register($('.grille__eq'), 20);
  eq.register($('.np__eq'), 4);

  // ---------- state
  let mode = '';
  let active = -1;
  let curV = 0;
  let lastProg = -1;
  let seg = 1;
  let pinTop = 0;
  let scaleW = 1;
  let liveTimer = 0;
  let artFront = 0;

  // ---------- render
  function showStation(a) {
    const prev = active;
    active = a;
    const s = stops[a];
    const g = regionOf(a);
    root.style.setProperty('--rc', REGION_COLOR[s.region]);
    $('.disp__trk').innerHTML = `${esc(l('track'))} <b>${pad2(s.n)}</b> <span>${esc(l('of'))} ${N}</span>`;
    $('.disp__region span').textContent = t(g.r.name);
    $('.disp__trip b').textContent = hm(cum[a]);
    $('.disp__name').textContent = t(s.name);
    $('.disp__alt').textContent = s.name[other];
    $('.prog__drive').textContent = s.drive ? `${l('drive')} ${t(s.drive)}` : l('start');
    $('.prog__len').textContent = hm(s.driveMinutes);
    $('.notes__p').textContent = t(s.desc);
    marks.forEach((m, i) => m.classList.toggle('is-on', i === a));
    rows.forEach((r, i) => {
      r.classList.toggle('is-on', i === a);
      if (i === a) r.setAttribute('aria-current', 'true');
      else r.removeAttribute('aria-current');
    });
    presets.forEach((p) => p.classList.toggle('is-on', p.dataset.region === s.region));
    stripSt.forEach((b, i) => b.classList.toggle('is-on', i === a));
    dial.setAttribute('aria-valuenow', String(a + 1));
    dial.setAttribute('aria-valuetext', `${trackOf(a)}: ${t(s.name)}`);
    strip.setAttribute('aria-valuenow', String(a + 1));
    strip.setAttribute('aria-valuetext', `${trackOf(a)}: ${t(s.name)}`);

    // album art: wipe the new sleeve in over the old one
    const next = sleeveImgs[1 - artFront];
    const cur = sleeveImgs[artFront];
    next.src = asset(s.photo);
    next.alt = t(s.name);
    next.classList.remove('is-front', 'is-in');
    void next.offsetWidth;
    next.classList.add('is-front');
    if (prev === -1 || isReduced()) next.classList.add('is-in', 'is-instant');
    else requestAnimationFrame(() => next.classList.add('is-in'));
    setTimeout(() => next.classList.add('is-in'), 60); // rAF fallback
    cur.classList.remove('is-front', 'is-instant');
    artFront = 1 - artFront;

    stickerSlot.innerHTML = stickerHTML(s, 'disp__stk');
    $('.disp__art').classList.remove('is-swap');
    void stickerSlot.offsetWidth;
    $('.disp__art').classList.add('is-swap');

    // phone card
    const npImg = $('.np__art img');
    npImg.src = asset(s.photo);
    $('.np__k').textContent = `${l('track')} ${pad2(s.n)}  ·  ${regionShort(g.r)}`;
    $('.np__name').textContent = t(s.name);

    if (prev !== -1) audio.sweep();
    audio.setRegion(s.region);

    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = `${trackOf(a)}: ${t(s.name)}`; }, 600);
  }

  function setState(v, prog) {
    v = clamp(v, 0, N - 1);
    curV = v;
    const a = Math.round(v);
    const frac = Math.abs(v - a);
    const detune = clamp(frac * 2.4, 0, 1);
    if (a !== active) showStation(a);

    // needle along the band (true drive-time spacing)
    const i0 = Math.floor(v);
    const i1 = Math.min(N - 1, i0 + 1);
    const p = pos[i0] + (pos[i1] - pos[i0]) * (v - i0);
    needle.style.transform = `translateX(${((p / 100) * scaleW * (isRTL() ? -1 : 1)).toFixed(1)}px)`;
    knob.style.transform = `rotate(${(v * DEG).toFixed(2)}deg)`;
    disp.style.setProperty('--noise', detune.toFixed(3));
    disp.classList.toggle('is-tuning', detune > 0.18);

    prog = a === Math.floor(v) || frac < 0.02 ? prog : 0;
    if (Math.abs(prog - lastProg) > 0.002) {
      lastProg = prog;
      fill.style.setProperty('--p', prog.toFixed(4));
      npProg.style.setProperty('--p', prog.toFixed(4));
      elEl.textContent = hm(prog * stops[a].driveMinutes);
    }
    audio.setDetune(detune);
    if (mode === 'list' && !stripUser) setStrip(v);
  }

  // ---------- modes
  const mqPhone = window.matchMedia('(max-width: 899px)');
  const computeMode = () => (mqPhone.matches ? 'list' : isReduced() ? 'static' : 'pin');

  function measure() {
    scaleW = scale.clientWidth || 1;
    if (mode === 'pin') {
      const vh = window.innerHeight;
      seg = Math.max(260, vh * SEG_VH);
      pin.style.height = `${vh - HOST + (N - 1) * seg + seg * DWELL}px`;
      pinTop = pin.getBoundingClientRect().top + window.scrollY;
    } else {
      pin.style.height = '';
    }
  }

  function applyMode() {
    const m = computeMode();
    if (m === mode) { measure(); onScroll(); return; }
    mode = m;
    root.dataset.mode = mode;
    if (mode === 'list') $('.sheet__slot').appendChild(jcard);
    else side.appendChild(jcard);
    closeSheet();
    measure();
    if (mode === 'static') setState(Math.max(0, active), 0);
    onScroll();
  }

  // ---------- scroll mapping
  const LINE = () => window.innerHeight * 0.42;

  function onScroll() {
    if (mode === 'pin') {
      const x = (window.scrollY - (pinTop - HOST)) / seg;
      let v = 0;
      let prog = 0;
      if (x > 0) {
        const i = Math.floor(x);
        const f = x - i;
        if (i >= N - 1) { v = N - 1; prog = Math.min(1, (x - (N - 1)) / DWELL); }
        else if (f < DWELL) { v = i; prog = f / DWELL; }
        else { v = i + ease((f - DWELL) / (1 - DWELL)); prog = 1; }
      }
      setState(v, prog);
    } else if (mode === 'list') {
      const line = LINE();
      // the card is pinned only while the stops are being read
      const br = booklet.getBoundingClientRect();
      np.classList.toggle('is-show', br.top < window.innerHeight * 0.55 && br.bottom > window.innerHeight * 0.78);
      const rects = cards.map((c) => c.getBoundingClientRect());
      let i = 0;
      for (let k = 0; k < N; k++) if (rects[k].top <= line) i = k;
      const span = i < N - 1 ? rects[i + 1].top - rects[i].top : rects[i].height;
      const f = clamp((line - rects[i].top) / span, 0, 1);
      const v = i + ease(clamp((f - 0.82) / 0.18, 0, 1));
      setState(v, clamp(f / 0.82, 0, 1));
    }
  }

  const scrollForV = (v) => {
    const i = Math.floor(v);
    const s = v - i;
    const x = s < 1e-4 ? i : i + DWELL + invEase(s) * (1 - DWELL);
    return pinTop - HOST + x * seg;
  };
  const cardY = (i) => window.scrollY + cards[i].getBoundingClientRect().top - LINE() + 2;

  function tuneTo(i, opts = {}) {
    i = clamp(Math.round(i), 0, N - 1);
    const behavior = isReduced() || opts.instant ? 'auto' : 'smooth';
    if (mode === 'pin') window.scrollTo({ top: scrollForV(i) + 2, behavior });
    else if (mode === 'list') window.scrollTo({ top: cardY(i), behavior });
    else setState(i, 0);
  }

  // drive the page while the dial turns (no smoothing: follows the hand)
  function driveTo(v) {
    if (mode === 'pin') window.scrollTo({ top: scrollForV(clamp(v, 0, N - 1)), behavior: 'instant' });
    else setState(v, 0);
  }

  // ---------- dial: drag / keys
  let drag = null;
  dial.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const r = dial.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    drag = { cx, cy, ang: Math.atan2(e.clientY - cy, e.clientX - cx), v: curV, last: Math.round(curV) };
    dial.setPointerCapture(e.pointerId);
    dial.classList.add('is-drag');
    dial.focus({ preventScroll: true });
    e.preventDefault();
  });
  dial.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const ang = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
    let d = ang - drag.ang;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    drag.ang = ang;
    drag.v = clamp(drag.v + (d * 180) / Math.PI / DEG, 0, N - 1);
    const r = Math.round(drag.v);
    if (r !== drag.last) { drag.last = r; audio.tick(); }
    driveTo(drag.v);
  });
  const endDrag = () => {
    if (!drag) return;
    const target = Math.round(drag.v);
    drag = null;
    dial.classList.remove('is-drag');
    if (mode === 'static') {
      const from = curV;
      tween(260, (p) => setState(from + (target - from) * p, 0));
    } else tuneTo(target);
  };
  dial.addEventListener('pointerup', endDrag);
  dial.addEventListener('pointercancel', endDrag);

  const keyStep = (e) => {
    const fwd = isRTL() ? 'ArrowLeft' : 'ArrowRight';
    const back = isRTL() ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === 'ArrowUp' || e.key === fwd) return 1;
    if (e.key === 'ArrowDown' || e.key === back) return -1;
    if (e.key === 'PageUp') return 3;
    if (e.key === 'PageDown') return -3;
    if (e.key === 'Home') return -N;
    if (e.key === 'End') return N;
    return 0;
  };
  [dial, strip].forEach((el) =>
    el.addEventListener('keydown', (e) => {
      const st = keyStep(e);
      if (!st) return;
      e.preventDefault();
      audio.tick();
      tuneTo(active + st);
    })
  );

  // ---------- band click
  scale.addEventListener('pointerdown', (e) => {
    const r = scale.getBoundingClientRect();
    let pct = ((e.clientX - r.left) / r.width) * 100;
    if (isRTL()) pct = 100 - pct;
    let best = 0;
    pos.forEach((p, i) => { if (Math.abs(p - pct) < Math.abs(pos[best] - pct)) best = i; });
    tuneTo(best);
  });

  // ---------- keys, tracklist
  presets.forEach((b) => b.addEventListener('click', () => tuneTo(+b.dataset.i)));
  $$('.seekbtn').forEach((b) => b.addEventListener('click', () => tuneTo(active + +b.dataset.step)));
  rows.forEach((r) =>
    r.addEventListener('click', () => {
      const i = +r.dataset.i;
      if (mode === 'list') { closeSheet(); setTimeout(() => tuneTo(i), 30); }
      else tuneTo(i);
    })
  );

  // ---------- sound
  const syncSound = (on) => {
    (root.closest('.rp') || root).classList.toggle('is-sound', on);
    soundBtns.forEach((b) => {
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      const tx = b.querySelector('.sound__txt');
      if (tx) tx.textContent = on ? l('soundOff') : l('soundOn');
      b.querySelector('.led')?.classList.toggle('led--on', on);
    });
  };
  audio.onChange(syncSound);
  soundBtns.forEach((b) => b.addEventListener('click', () => { audio.toggle(); }));

  // ---------- phone: strip
  let stripUser = false;
  let stripTimer = 0;
  let stripDown = false;
  const stripSign = () => (isRTL() ? -1 : 1);
  function setStrip(v) {
    strip.scrollLeft = v * SP * stripSign();
  }
  const stripV = () => clamp(Math.abs(strip.scrollLeft) / SP, 0, N - 1);
  const beginStrip = () => {
    stripUser = true;
    strip.classList.add('is-user');
  };
  const commitStrip = () => {
    clearTimeout(stripTimer);
    stripTimer = setTimeout(() => {
      if (stripDown) return;
      const i = Math.round(stripV());
      tuneTo(i);
      setTimeout(() => { stripUser = false; strip.classList.remove('is-user'); onScroll(); }, isReduced() ? 50 : 900);
    }, 140);
  };
  strip.addEventListener('pointerdown', () => { stripDown = true; beginStrip(); });
  strip.addEventListener('touchstart', () => { stripDown = true; beginStrip(); }, { passive: true });
  const up = () => { if (!stripDown) return; stripDown = false; commitStrip(); };
  strip.addEventListener('pointerup', up);
  strip.addEventListener('pointercancel', up);
  strip.addEventListener('touchend', up);
  strip.addEventListener('wheel', () => { beginStrip(); commitStrip(); }, { passive: true });
  strip.addEventListener('scroll', () => {
    if (!stripUser) return;
    const v = stripV();
    const a = Math.round(v);
    if (a !== active) { audio.tick(); showStation(a); }
    if (!stripDown) commitStrip();
  }, { passive: true });
  stripSt.forEach((b) => b.addEventListener('click', () => { beginStrip(); setStrip(+b.dataset.i); commitStrip(); }));


  // ---------- sheet (phone tracklist)
  let lastFocus = null;
  function openSheet() {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('is-open'));
    setTimeout(() => sheet.classList.add('is-open'), 40);
    rows[Math.max(0, active)]?.scrollIntoView({ block: 'center' });
    sheet.querySelector('.sheet__close').focus({ preventScroll: true });
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.classList.remove('is-open');
    setTimeout(() => { sheet.hidden = true; }, isReduced() ? 0 : 260);
    lastFocus?.focus?.({ preventScroll: true });
  }
  $('.np__list').addEventListener('click', openSheet);
  sheet.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  // ---------- wire up
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); onScroll(); });
  mqPhone.addEventListener('change', applyMode);
  reducedMQ.addEventListener('change', applyMode);
  if ('ResizeObserver' in window) {
    let last = 0;
    new ResizeObserver(() => {
      const h = document.body.scrollHeight;
      if (Math.abs(h - last) > 1) { last = h; measure(); onScroll(); }
    }).observe(document.body);
  }
  applyMode();
  if (active === -1) setState(0, 0);

  // warm the album art so wipes never show an empty sleeve
  const warm = () => stops.forEach((s) => { const im = new Image(); im.src = asset(s.photo); });
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 2500 });
  else setTimeout(warm, 1200);

  return { tuneTo: (i) => tuneTo(i) };
}
