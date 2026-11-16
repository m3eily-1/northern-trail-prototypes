// Stop details: a side sheet from the end edge with the full photo, sticker,
// description, drive time and the day buttons (a second way to plan).
import { t, asset, tr, h, icons, isReduced } from './util.js';

export function initSheet(data, planner) {
  const stops = data.stops;
  const regionName = Object.fromEntries(data.regions.map((r) => [r.key, t(r.name)]));
  const host = document.getElementById('app');
  const backdrop = h('div', { class: 'k-backdrop', hidden: true });
  const body = h('div', { class: 'k-sheet__body' });
  const closeBtn = h('button', { class: 'k-iconbtn k-sheet__close', type: 'button', 'aria-label': tr.close, html: icons.close });
  const sheet = h('aside', { class: 'k-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'k-sheet-title', hidden: true }, closeBtn, body);
  host.append(backdrop, sheet);
  let current = 0;
  let lastFocus = null;

  function render(n) {
    current = n;
    const s = stops[n - 1];
    const loc = planner.locate(n);
    const dayBtns = h('div', { class: 'k-sheet__days' });
    for (let i = 0; i < planner.dayCount; i++) {
      const on = loc.day === i;
      const b = h(
        'button',
        { class: 'k-daybtn' + (on ? ' is-on' : ''), type: 'button', style: `--dc:${planner.dayColors[i]}`, 'aria-pressed': on ? 'true' : 'false' },
        h('span', { class: 'k-daybtn__sw', 'aria-hidden': 'true', html: on ? icons.check : '' }),
        h('span', { text: `${tr.day} ${i + 1}` })
      );
      b.addEventListener('click', async () => {
        if (on) await planner.back(n);
        else await planner.addTo(n, i);
        render(n);
        body.querySelectorAll('.k-daybtn')[i]?.focus({ preventScroll: true });
      });
      dayBtns.append(b);
    }
    const prev = h('button', { class: 'k-iconbtn k-iconbtn--line', type: 'button', 'aria-label': tr.prev, disabled: n <= 1 ? true : null, html: icons.back });
    const next = h('button', { class: 'k-iconbtn k-iconbtn--line', type: 'button', 'aria-label': tr.next, disabled: n >= stops.length ? true : null, html: icons.arrow });
    prev.addEventListener('click', () => go(n - 1));
    next.addEventListener('click', () => go(n + 1));

    body.replaceChildren(
      h(
        'figure',
        { class: 'k-sheet__photo' },
        h('img', { src: asset(s.photo), alt: t(s.name) }),
        s.sticker ? h('img', { class: 'k-sheet__sticker', src: asset(s.sticker), alt: '' }) : null
      ),
      h(
        'div',
        { class: 'k-sheet__txt' },
        h('p', { class: 'nt-eyebrow k-sheet__eyebrow', text: `${tr.stopOf(s.n)} · ${regionName[s.region]}` }),
        h('h2', { class: 'k-sheet__title', id: 'k-sheet-title', text: t(s.name) }),
        h('p', { class: 'k-sheet__drive' }, h('span', { class: 'k-sheet__car', html: icons.car }), h('span', { text: s.drive ? `${t(s.drive)} ${tr.fromPrev}` : tr.start })),
        h('p', { class: 'k-sheet__desc', text: t(s.desc) }),
        h('div', { class: 'k-sheet__plan' }, h('p', { class: 'k-sheet__label', text: loc.day >= 0 ? tr.inDay(loc.day + 1) : tr.addTo }), dayBtns),
        h('div', { class: 'k-sheet__nav' }, prev, h('span', { class: 'k-sheet__pos', dir: 'ltr', text: `${String(n).padStart(2, '0')} / 16` }), next)
      )
    );
  }

  function go(n) {
    if (n < 1 || n > stops.length) return;
    render(n);
    if (!isReduced()) body.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }

  function open(n) {
    lastFocus = document.activeElement;
    render(n);
    sheet.hidden = false;
    backdrop.hidden = false;
    document.documentElement.classList.add('is-sheet');
    requestAnimationFrame(() => {
      sheet.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
    // rAF fallback for hidden tabs
    setTimeout(() => { sheet.classList.add('is-open'); backdrop.classList.add('is-open'); }, 50);
    closeBtn.focus({ preventScroll: true });
  }
  function close() {
    if (sheet.hidden) return;
    sheet.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    document.documentElement.classList.remove('is-sheet');
    setTimeout(() => {
      sheet.hidden = true;
      backdrop.hidden = true;
    }, isReduced() ? 0 : 360);
    lastFocus?.focus?.({ preventScroll: true });
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') trap(e, sheet);
  });

  return { open, close, get current() { return current; } };
}

export function trap(e, root) {
  const f = [...root.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]')].filter((x) => x.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
