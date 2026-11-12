// Full stop card: a paper sheet that unfolds (text panel swings open over its crease).
import { h, tr, asset, L, RM, RTL, PHONE, pad2, driveText } from './core.js';

const X = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
const PREV = '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-flip"><path d="M16 10H5M9.5 5.5L5 10l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';
const NEXT = '<svg viewBox="0 0 20 20" aria-hidden="true" class="nt-flip"><path d="M4 10h11M10.5 5.5L15 10l-4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>';

export function createSheet(data) {
  const dlg = document.querySelector('dialog.sheet');
  const total = data.stops.length;
  const regionName = (key) => tr(data.regions.find((r) => r.key === key).name);

  const img = h('img', { class: 'sheet__img', alt: '', decoding: 'async' });
  const sticker = h('div', { class: 'sheet__sticker' }, h('img', { alt: '' }), h('span', { class: 'sheet__stand' }));
  const photo = h('div', { class: 'sheet__photo' }, img, sticker);
  const eyebrow = h('p', { class: 'nt-eyebrow sheet__eyebrow' });
  const title = h('h3', { class: 'sheet__title', id: 'sheet-title' });
  const drive = h('p', { class: 'sheet__drive' });
  const desc = h('p', { class: 'sheet__desc' });
  const prev = h('button', { class: 'sheet__nav', type: 'button', 'aria-label': L.prev, html: PREV });
  const next = h('button', { class: 'sheet__nav', type: 'button', 'aria-label': L.next, html: NEXT });
  const count = h('span', { class: 'sheet__count', 'aria-hidden': 'true' });
  const close = h('button', { class: 'sheet__close', type: 'button', 'aria-label': L.close, html: X });
  const body = h('div', { class: 'sheet__body' }, eyebrow, title, drive, desc);
  const nav = h('div', { class: 'sheet__navrow' }, prev, count, next);
  const textFront = h('div', { class: 'sheet__front' }, body, nav);
  const back = h('div', { class: 'sheet__back', 'aria-hidden': 'true' });
  const text = h('div', { class: 'sheet__text' }, textFront, back);
  const paper = h('div', { class: 'sheet__paper' }, photo, text, close);
  dlg.append(paper);

  let idx = 0;
  let opener = null;
  let busy = false;
  let cur = null;
  const g = () => window.gsap;

  function fill(n) {
    const s = data.stops.find((x) => x.n === n);
    idx = data.stops.indexOf(s);
    img.src = asset(s.photo);
    img.alt = tr(s.name);
    eyebrow.textContent = `${L.stop} ${pad2(s.n)} ${L.of} ${total} · ${regionName(s.region)}`;
    title.textContent = tr(s.name);
    drive.textContent = driveText(s);
    desc.textContent = tr(s.desc);
    count.textContent = `${pad2(s.n)} / ${total}`;
    prev.disabled = idx === 0;
    next.disabled = idx === total - 1;
    if (s.sticker) {
      sticker.hidden = false;
      sticker.firstChild.src = asset(s.sticker);
    } else sticker.hidden = true;
  }

  // fold axis: vertical crease on desktop, horizontal crease on phones
  const folded = () => (PHONE.matches ? { rotationX: 178, rotationY: 0 } : { rotationY: RTL ? 178 : -178, rotationX: 0 });

  function open(n, from) {
    if (busy) return;
    opener = from || document.activeElement;
    fill(n);
    document.documentElement.classList.add('sheet-open');
    dlg.showModal();
    if (RM) return;
    busy = true;
    const gs = g();
    gs.killTweensOf([paper, text, sticker]);
    const tl = (cur = gs.timeline({ onComplete: () => (busy = false) }));
    tl.fromTo(paper, { autoAlpha: 0, rotationX: 60, y: 40, transformOrigin: '50% 100%' }, { autoAlpha: 1, rotationX: 0, y: 0, duration: 0.55, ease: 'back.out(1.4)' }, 0)
      .fromTo(text, folded(), { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'power3.inOut' }, 0.3)
      .fromTo(sticker, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' }, { rotationX: 0, autoAlpha: 1, duration: 0.6, ease: 'back.out(2.6)' }, 0.85);
  }

  function shut() {
    if (!dlg.open) return;
    if (busy && cur) cur.progress(1);
    const done = () => {
      dlg.close();
      document.documentElement.classList.remove('sheet-open');
      if (opener && opener.isConnected) opener.focus({ preventScroll: true });
      busy = false;
    };
    if (RM) return done();
    busy = true;
    const gs = g();
    cur = gs.timeline({ onComplete: done });
    cur
      .to(sticker, { rotationX: 90, autoAlpha: 0, duration: 0.2, ease: 'power2.in' }, 0)
      .to(text, { ...folded(), duration: 0.45, ease: 'power3.in' }, 0)
      .to(paper, { autoAlpha: 0, rotationX: 50, y: 30, duration: 0.35, ease: 'power2.in' }, 0.35);
  }

  function step(d) {
    const ni = idx + d;
    if (ni < 0 || ni >= total || busy) return;
    const n = data.stops[ni].n;
    if (RM) return fill(n);
    busy = true;
    const gs = g();
    cur = gs.timeline({ onComplete: () => (busy = false) });
    cur
      .to(text, { ...folded(), duration: 0.32, ease: 'power2.in' }, 0)
      .to(img, { autoAlpha: 0, duration: 0.2 }, 0.1)
      .add(() => fill(n))
      .to(img, { autoAlpha: 1, duration: 0.3 })
      .to(text, { rotationX: 0, rotationY: 0, duration: 0.5, ease: 'power3.out' }, '<')
      .fromTo(sticker, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' }, { rotationX: 0, autoAlpha: 1, duration: 0.5, ease: 'back.out(2.6)' }, '-=0.2');
  }

  close.addEventListener('click', shut);
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  dlg.addEventListener('cancel', (e) => {
    e.preventDefault();
    shut();
  });
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) shut();
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') step(RTL ? -1 : 1);
    if (e.key === 'ArrowLeft') step(RTL ? 1 : -1);
  });

  return { open, close: shut };
}
