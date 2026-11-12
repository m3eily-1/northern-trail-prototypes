// Signature: three region dioramas as a pop-up book. Pinned scroll pops paper layers
// up from flat, folds them back down and turns the page to the next region.
// Pointer tilts the scene in 3D; hotspots, a rail (desktop) or swipeable tags (phone)
// open each stop.
import { h, tr, asset, L, LANG, RM, RTL, FINE, PHONE, pad2, driveText, buildLayers, popup } from './core.js';
import { SCENES } from './scenes.js';

const ARROW = '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-flip"><path d="M4 10h11M10.5 5.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';

export function createDioramas(data, sheet) {
  const regions = data.regions.map((r, ri) => {
    const stops = data.stops.filter((s) => s.region === r.key);
    return { ...r, ri, stops, scene: SCENES[r.key] };
  });
  const pinned = !RM;

  const el = h('section', { class: `dz ${pinned ? 'dz--pinned' : 'dz--static'}`, id: 'stops', 'aria-label': regions.map((r) => tr(r.name)).join(', ') });
  const tag = buildTagCard();
  const refs = regions.map((r) => buildRegion(r));

  // ---------- builders ----------
  // foot of the side column: drive time on this leg (sum of the content's drive minutes) + stop range
  function legSummary(r) {
    const mins = r.stops.reduce((a, s) => a + (s.driveMinutes || 0), 0);
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    const U = LANG === 'ar' ? { h: 'ساعة', m: 'دقيقة', leg: 'مدة القيادة في هذا الجزء', st: 'المحطات' } : { h: 'h', m: 'min', leg: 'Drive time on this leg', st: 'Stops' };
    const first = r.stops[0].n;
    const last = r.stops[r.stops.length - 1].n;
    return h('div', { class: 'dz-sum' },
      h('p', { class: 'dz-sum__cell' }, h('span', { class: 'dz-sum__k' }, U.leg), h('span', { class: 'dz-sum__v' }, h('b', {}, String(hh)), h('small', {}, U.h), ' ', h('b', {}, String(mm)), h('small', {}, U.m))),
      h('p', { class: 'dz-sum__cell' }, h('span', { class: 'dz-sum__k' }, U.st), h('span', { class: 'dz-sum__v' }, h('b', {}, pad2(first)), h('small', {}, LANG === 'ar' ? 'إلى' : 'to'), h('b', {}, pad2(last)))),
    );
  }

  function buildTagCard() {
    const img = h('img', { alt: '', decoding: 'async' });
    const num = h('span', { class: 'ttag__num' });
    const name = h('span', { class: 'ttag__name' });
    const drive = h('span', { class: 'ttag__drive' });
    const node = h('div', { class: 'ttag', 'aria-hidden': 'true' }, h('div', { class: 'ttag__ph' }, img), h('div', { class: 'ttag__txt' }, num, name, drive), h('span', { class: 'ttag__hole' }));
    return { node, img, num, name, drive };
  }

  function buildRegion(r) {
    // diorama
    const box = h('div', { class: 'dio__box' });
    const dio = h('div', { class: 'dio', 'data-r': r.ri }, box);
    const layers = buildLayers(box, r.scene.layers, 'lyr');
    const pops = r.scene.popups.map((p) => {
      const n = popup(p, 'pop');
      box.append(n);
      return n;
    });

    const ui = h('div', { class: 'dio__ui' });
    const pts = r.stops.map((_, i) => `${r.scene.spots.x[i]},${r.scene.spots.y[i]}`).join(' ');
    const route = h('div', { class: 'dio__route', 'aria-hidden': 'true', html: `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points="${pts}" /></svg>` });
    ui.append(route);
    const spots = r.stops.map((s, i) => {
      const b = h(
        'button',
        {
          class: 'spot',
          type: 'button',
          style: `--x:${r.scene.spots.x[i]}%;--y:${r.scene.spots.y[i]}%`,
          'aria-label': `${L.stop} ${pad2(s.n)}: ${tr(s.name)}. ${driveText(s)}`,
          'data-n': s.n,
        },
        h('span', { class: 'spot__name', 'aria-hidden': 'true' }, tr(s.name)),
        h('span', { class: 'spot__mark' }, pad2(s.n)),
        h('span', { class: 'spot__stem', 'aria-hidden': 'true' }),
      );
      ui.append(b);
      return b;
    });
    box.append(ui);

    // info + rail
    const rail = h(
      'ol',
      { class: 'rail', 'aria-label': `${L.stopsIn} ${tr(r.name)}` },
      r.stops.map((s) =>
        h(
          'li',
          {},
          h(
            'button',
            { class: 'rail__item', type: 'button', 'data-n': s.n },
            h('span', { class: 'rail__num' }, pad2(s.n)),
            h('span', { class: 'rail__name' }, tr(s.name)),
            h('span', { class: 'rail__drive' }, s.drive ? tr(s.drive) : L.start),
          ),
        ),
      ),
    );
    const info = h(
      'div',
      { class: 'dz-info', 'data-r': r.ri },
      h('p', { class: 'nt-eyebrow dz-info__eyebrow' }, `${L.region} ${pad2(r.ri + 1)} ${L.of} ${pad2(regions.length)}`),
      h('h2', { class: 'dz-info__name' }, tr(r.name)),
      h('p', { class: 'dz-info__count' }, tr(r.count)),
      rail,
      legSummary(r),
    );

    // phone tags
    const tags = h(
      'div',
      { class: 'dz-tags', 'data-r': r.ri },
      h(
        'ul',
        { class: 'tags', 'aria-label': `${L.stopsIn} ${tr(r.name)}` },
        r.stops.map((s) =>
          h(
            'li',
            {},
            h(
              'button',
              { class: 'tag', type: 'button', 'data-n': s.n },
              h('span', { class: 'tag__ph' }, h('img', { src: asset(s.photo), alt: '', loading: 'lazy', decoding: 'async' })),
              h('span', { class: 'tag__txt' }, h('span', { class: 'tag__num' }, `${L.stop} ${pad2(s.n)}`), h('span', { class: 'tag__name' }, tr(s.name)), h('span', { class: 'tag__drive' }, driveText(s))),
            ),
          ),
        ),
      ),
      h('p', { class: 'dz-tags__hint', 'aria-hidden': 'true' }, h('span', {}, L.swipe), h('span', { html: ARROW })),
    );

    return { r, dio, box, layers, pops, ui, route, spots, info, rail, tags };
  }

  // ---------- layout ----------
  const frames = [];
  if (pinned) {
    const tabs = h(
      'nav',
      { class: 'dz-tabs', 'aria-label': L.regions },
      regions.map((r) =>
        h('button', { class: 'dz-tab', type: 'button', 'data-r': r.ri }, h('span', { class: 'dz-tab__n' }, pad2(r.ri + 1)), h('span', { class: 'dz-tab__name' }, tr(r.name))),
      ),
    );
    const infos = h('div', { class: 'dz-infos' }, refs.map((x) => x.info));
    const page = h('div', { class: 'dz-page', 'aria-hidden': 'true' }, h('span', { class: 'dz-page__shade' }));
    const frame = h('div', { class: 'dz-frame' }, h('div', { class: 'dz-stage' }, refs.map((x) => x.dio), page));
    frames.push(frame);
    const tagsets = h('div', { class: 'dz-tagsets' }, refs.map((x) => x.tags));
    const grid = h('div', { class: 'dz-grid' }, h('div', { class: 'dz-side' }, tabs, infos), h('div', { class: 'dz-main' }, frame, tagsets));
    const pin = h('div', { class: 'dz-pin' }, grid, tag.node);
    el.append(pin);
    el._tabs = tabs;
    el._page = page;
    el._pin = pin;
  } else {
    refs.forEach((x) => {
      const frame = h('div', { class: 'dz-frame' }, h('div', { class: 'dz-stage' }, x.dio));
      frames.push(frame);
      el.append(h('div', { class: 'dz-grid dz-grid--static' }, h('div', { class: 'dz-side' }, x.info), h('div', { class: 'dz-main' }, frame, x.tags)));
    });
    el.append(tag.node);
  }

  // ---------- interactions ----------
  const stopByN = (n) => data.stops.find((s) => s.n === +n);
  let tagFor = null;

  function showTag(n, anchor) {
    if (!FINE.matches || PHONE.matches) return;
    const s = stopByN(n);
    tagFor = anchor;
    tag.img.src = asset(s.photo);
    tag.num.textContent = `${L.stop} ${pad2(s.n)}`;
    tag.name.textContent = tr(s.name);
    tag.drive.textContent = driveText(s);
    placeTag();
    const g = window.gsap;
    g.killTweensOf(tag.node);
    if (RM) g.set(tag.node, { autoAlpha: 1, rotationX: 0 });
    else g.fromTo(tag.node, { autoAlpha: 0, rotationX: -95, transformOrigin: '50% 100%' }, { autoAlpha: 1, rotationX: 0, duration: 0.5, ease: 'back.out(2.2)' });
    highlight(n, true);
  }
  function hideTag(n) {
    tagFor = null;
    const g = window.gsap;
    g.killTweensOf(tag.node);
    if (RM) g.set(tag.node, { autoAlpha: 0 });
    else g.to(tag.node, { autoAlpha: 0, rotationX: -60, duration: 0.2, ease: 'power2.in' });
    if (n != null) highlight(n, false);
  }
  function placeTag() {
    if (!tagFor) return;
    const spot = refs.flatMap((x) => x.spots).find((b) => b.dataset.n === tagFor.dataset.n);
    const anchor = spot && spot.offsetParent ? spot.querySelector('.spot__mark') : tagFor;
    const host = tag.node.offsetParent || el;
    const hr = host.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    const tw = tag.node.offsetWidth;
    const th = tag.node.offsetHeight;
    let x = ar.left + ar.width / 2 - hr.left - tw / 2;
    let y = ar.top - hr.top - th - 12;
    x = Math.max(8, Math.min(hr.width - tw - 8, x));
    if (y < 8) y = ar.bottom - hr.top + 12;
    tag.node.style.left = `${Math.round(x)}px`;
    tag.node.style.top = `${Math.round(y)}px`;
  }
  function highlight(n, on) {
    el.querySelectorAll(`[data-n="${n}"]`).forEach((b) => b.classList.toggle('is-hot', on));
  }

  el.addEventListener('pointerover', (e) => {
    const b = e.target.closest('.spot, .rail__item');
    if (b && !b.contains(e.relatedTarget)) showTag(b.dataset.n, b);
  });
  el.addEventListener('pointerout', (e) => {
    const b = e.target.closest('.spot, .rail__item');
    if (b && !b.contains(e.relatedTarget)) hideTag(b.dataset.n);
  });
  el.addEventListener('focusin', (e) => {
    const b = e.target.closest('.spot, .rail__item');
    if (b && b.matches(':focus-visible')) showTag(b.dataset.n, b);
  });
  el.addEventListener('focusout', (e) => {
    const b = e.target.closest('.spot, .rail__item');
    if (b) hideTag(b.dataset.n);
  });
  el.addEventListener('click', (e) => {
    const b = e.target.closest('.spot, .rail__item, .tag');
    if (!b) return;
    hideTag(b.dataset.n);
    sheet.open(+b.dataset.n, b);
  });

  // ---------- depth layout ----------
  function layout(gsap) {
    const phone = PHONE.matches;
    const P = phone ? 900 : 1400;
    const gap = phone ? 44 : 70;
    refs.forEach((x) => {
      x.dio.style.perspective = `${P}px`;
      const H = x.dio.offsetHeight || 1;
      const visible = x.layers.filter((l) => l.offsetParent !== null);
      const n = visible.length;
      const place = (node, z) => {
        const s = (P - z) / P;
        const bottom = node.offsetTop + node.offsetHeight - H / 2;
        gsap.set(node, { z, scale: s, y: bottom * (s - 1), transformOrigin: '50% 100%' });
      };
      visible.forEach((l, i) => place(l, -(n - 1 - i) * gap));
      x.pops.forEach((p) => place(p, -gap * 0.5));
      gsap.set(x.ui, { z: 12 });
      gsap.set(x.box, { transformOrigin: `50% 50% ${-gap * 2}px` });
    });
  }

  // ---------- pointer tilt / idle sway ----------
  function tilt(gsap) {
    const boxes = refs.map((x) => x.box);
    const rx = boxes.map((b) => gsap.quickTo(b, 'rotationX', { duration: 0.9, ease: 'power3.out' }));
    const ry = boxes.map((b) => gsap.quickTo(b, 'rotationY', { duration: 0.9, ease: 'power3.out' }));
    const apply = () => el.classList.toggle('dz--sway', !(FINE.matches && !PHONE.matches));

    apply();
    FINE.addEventListener('change', apply);
    PHONE.addEventListener('change', apply);
    frames.forEach((frame) => {
      frame.addEventListener('pointermove', (e) => {
        if (!FINE.matches || PHONE.matches) return;
        const r = frame.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
        rx.forEach((f) => f(-ny * 6));
        ry.forEach((f) => f(nx * 9));
        if (tagFor) requestAnimationFrame(placeTag);
      });
      frame.addEventListener('pointerleave', () => {
        rx.forEach((f) => f(0));
        ry.forEach((f) => f(0));
      });
    });
  }

  // ---------- scroll choreography ----------
  function scroll(gsap, ScrollTrigger) {
    layout(gsap);
    const spotA11y = () => refs.forEach((x) => {
      x.ui.setAttribute('aria-hidden', PHONE.matches ? 'true' : 'false');
      x.spots.forEach((b) => (PHONE.matches ? b.setAttribute('tabindex', '-1') : b.removeAttribute('tabindex')));
    });
    spotA11y();
    PHONE.addEventListener('change', spotA11y);
    let rz;
    window.addEventListener('resize', () => {
      clearTimeout(rz);
      rz = setTimeout(() => layout(gsap), 150);
    });
    gsap.set(tag.node, { autoAlpha: 0 });

    if (RM) return; // static: everything stands, nothing scrubs

    tilt(gsap);

    const all = refs;
    all.forEach((x) => {
      gsap.set(x.layers, { rotationX: 90, autoAlpha: 0 });
      gsap.set(x.pops, { rotationX: 90, autoAlpha: 0 });
      gsap.set(x.spots, { autoAlpha: 0, scale: 0.4, rotationX: 70 });
      gsap.set(x.route, { clipPath: 'inset(0% 100% 0% 0%)' });
      gsap.set([x.info, x.tags], { autoAlpha: 0, y: 16 });
    });
    gsap.set([all[0].info, all[0].tags], { autoAlpha: 1, y: 0 });
    const page = el._page;
    gsap.set(page, { autoAlpha: 0, rotationY: 0, transformOrigin: RTL ? '100% 50%' : '0% 50%' });

    const IR = { immediateRender: false };
    const popIn = (tl, x, at) => {
      tl.fromTo(x.layers, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, stagger: 0.1, ...IR }, at)
        .fromTo(x.layers, { rotationX: 90 }, { rotationX: 0, duration: 0.6, ease: 'back.out(1.5)', stagger: 0.1, ...IR }, at)
        .fromTo(x.pops, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05, stagger: 0.1, ...IR }, at + 0.6)
        .fromTo(x.pops, { rotationX: 90 }, { rotationX: 0, duration: 0.5, ease: 'back.out(2.4)', stagger: 0.1, ...IR }, at + 0.6)
        .fromTo(x.route, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power1.inOut', ...IR }, at + 0.75)
        .fromTo(x.spots, { autoAlpha: 0, scale: 0.4, rotationX: 70 }, { autoAlpha: 1, scale: 1, rotationX: 0, duration: 0.35, ease: 'back.out(2.5)', stagger: 0.05, ...IR }, at + 0.8);
      return at + 1.3;
    };
    const foldOut = (tl, x, at) => {
      const front = [...x.layers].reverse();
      const popsRev = [...x.pops].reverse();
      const end = at + 0.15 + 0.42 + 0.05 * front.length;
      tl.fromTo(x.spots, { autoAlpha: 1, scale: 1 }, { autoAlpha: 0, scale: 0.4, duration: 0.2, ease: 'power2.in', stagger: 0.02, ...IR }, at)
        .fromTo(x.route, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.25, ...IR }, at)
        .fromTo(popsRev, { rotationX: 0 }, { rotationX: 90, duration: 0.3, ease: 'power2.in', stagger: 0.04, ...IR }, at + 0.05)
        .fromTo(front, { rotationX: 0 }, { rotationX: 90, duration: 0.42, ease: 'power2.in', stagger: 0.05, ...IR }, at + 0.15)
        .fromTo([...popsRev, ...front], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.01, ...IR }, end);
      return end + 0.05;
    };

    // region 1 pops while the section scrolls in
    const enter = gsap.timeline({
      scrollTrigger: { trigger: el, start: 'top 75%', end: 'top 64px', scrub: 0.6 },
    });
    popIn(enter, all[0], 0);

    const HOLD = 1.6;
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    const labels = [0.25];
    const bounds = [];
    let t = HOLD;
    for (let i = 1; i < all.length; i++) {
      t = foldOut(tl, all[i - 1], t);
      // page turn
      tl.set(page, { autoAlpha: 1, rotationY: 0 }, t)
        .to(page, { rotationY: RTL ? -180 : 180, duration: 0.7, ease: 'power2.inOut' }, t)
        .fromTo(page.firstChild, { opacity: 0 }, { opacity: 0.55, duration: 0.35, ease: 'power1.in', yoyo: true, repeat: 1 }, t)
        .set(page, { autoAlpha: 0 }, t + 0.7);
      bounds.push(t + 0.35);
      tl.fromTo([all[i - 1].info, all[i - 1].tags], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -12, duration: 0.2, ease: 'power2.in', ...IR }, t + 0.15)
        .fromTo([all[i].info, all[i].tags], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out', ...IR }, t + 0.35);
      t += 0.55;
      t = popIn(tl, all[i], t);
      labels.push(t + 0.2);
      t += i === all.length - 1 ? 1.1 : HOLD;
    }
    tl.to({}, { duration: 0.01 }, t);

    const st = ScrollTrigger.create({
      animation: tl,
      trigger: el,
      start: 'top 64px',
      end: () => `+=${Math.round(window.innerHeight * 4.6)}`,
      pin: el._pin,
      scrub: 0.8,
      invalidateOnRefresh: true,
      onUpdate: () => setActive(),
    });

    // active region, tabs, inert
    const tabs = [...el._tabs.querySelectorAll('.dz-tab')];
    let active = -1;
    function setActive() {
      const time = tl.time();
      let a = 0;
      bounds.forEach((b, i) => { if (time >= b) a = i + 1; });
      if (a === active) return;
      active = a;
      tabs.forEach((b, i) => {
        b.setAttribute('aria-current', i === a ? 'step' : 'false');
        b.classList.toggle('is-active', i === a);
      });
      all.forEach((x, i) => {
        x.dio.inert = i !== a;
        x.info.inert = i !== a;
        x.tags.inert = i !== a;
      });
      if (tagFor) hideTag(tagFor.dataset.n);
    }
    setActive();
    tl.eventCallback('onUpdate', setActive);

    tabs.forEach((b, i) => {
      b.addEventListener('click', () => {
        const y = st.start + (st.end - st.start) * (labels[i] / tl.duration());
        window.scrollTo({ top: Math.ceil(y), behavior: 'smooth' });
      });
    });

    return { tl, st, labels };
  }

  return { el, scroll };
}
