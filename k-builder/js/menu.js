// Square popover menu for the "Add to day" button (keyboard and touch path).
import { h, isRTL } from './util.js';

export function createMenu(host) {
  const el = h('div', { class: 'k-menu', role: 'menu', hidden: true });
  host.append(el);
  let anchor = null;
  let scrollY0 = 0;

  function items() {
    return [...el.querySelectorAll('[role="menuitem"]:not([disabled])')];
  }

  function open(btn, title, entries) {
    const ar = btn.getBoundingClientRect();
    if (ar.bottom < 64 || ar.top > innerHeight) btn.scrollIntoView({ block: 'center', behavior: 'instant' });
    anchor = btn;
    el.replaceChildren(h('p', { class: 'k-menu__title', text: title }));
    entries.forEach((it) => {
      if (it === 'sep') return el.append(h('div', { class: 'k-menu__sep', role: 'separator' }));
      const b = h(
        'button',
        {
          type: 'button',
          role: 'menuitem',
          class: 'k-menu__item' + (it.current ? ' is-current' : ''),
          disabled: it.disabled || it.current ? true : null,
          style: it.color ? `--dc:${it.color}` : null,
        },
        it.color ? h('span', { class: 'k-menu__sw', 'aria-hidden': 'true' }) : null,
        it.icon ? h('span', { class: 'k-menu__ic', html: it.icon }) : null,
        h('span', { class: 'k-menu__label', text: it.label }),
        it.meta ? h('span', { class: 'k-menu__meta', text: it.meta }) : null
      );
      b.addEventListener('click', () => {
        close(false);
        it.run();
      });
      el.append(b);
    });
    el.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    position();
    scrollY0 = scrollY;
    const first = items()[0];
    first?.focus({ preventScroll: true });
    el.animate([{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
  }

  function position() {
    const r = anchor.getBoundingClientRect();
    const mw = el.offsetWidth;
    const mh = el.offsetHeight;
    let left = isRTL ? r.left : r.right - mw;
    left = Math.max(8, Math.min(innerWidth - mw - 8, left));
    let top = r.bottom + 4;
    if (top + mh > innerHeight - 8) top = Math.max(72, r.top - mh - 4);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }

  function close(refocus = true) {
    if (el.hidden) return;
    el.hidden = true;
    anchor?.setAttribute('aria-expanded', 'false');
    if (refocus && anchor?.isConnected) anchor.focus({ preventScroll: true });
    anchor = null;
  }

  el.addEventListener('keydown', (e) => {
    const list = items();
    const i = list.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') close(false);
  });
  document.addEventListener('pointerdown', (e) => {
    if (!el.hidden && !el.contains(e.target) && e.target !== anchor && !anchor?.contains(e.target)) close(false);
  });
  addEventListener('scroll', () => { if (!el.hidden && Math.abs(scrollY - scrollY0) > 40) close(false); }, { passive: true });
  addEventListener('resize', () => close(false));

  return { open, close, get isOpen() { return !el.hidden; }, get anchor() { return anchor; } };
}
