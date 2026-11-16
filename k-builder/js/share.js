// "Share my trip": a summary card overlay built from the current plan. No network;
// the copy button puts a plain-text itinerary on the clipboard.
import { t, asset, tr, h, icons, dur, num, isReduced } from './util.js';
import { trap } from './sheet.js';

export function initShare(data, planner) {
  const stops = data.stops;
  const host = document.getElementById('app');
  const panel = h('div', { class: 'k-share__panel' });
  const overlay = h('div', { class: 'k-share', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'k-share-title', hidden: true }, panel);
  host.append(overlay);
  let lastFocus = null;

  function render() {
    const p = planner.getPlan();
    const closeBtn = h('button', { class: 'nt-btn k-tool--line k-share__closebtn', type: 'button', html: `${icons.close}<span>${tr.close}</span>` });
    closeBtn.addEventListener('click', close);

    if (!p.count) {
      const auto = h('button', { class: 'nt-btn', type: 'button', html: `${icons.spark}<span>${tr.autoPlan}</span>` });
      auto.addEventListener('click', async () => {
        await planner.autoPlan();
        render();
      });
      panel.replaceChildren(
        h(
          'div',
          { class: 'k-share__card k-share__card--empty' },
          h('h2', { class: 'k-share__title', id: 'k-share-title', text: tr.myTrip }),
          h('p', { class: 'k-share__empty', text: tr.emptyShare })
        ),
        h('div', { class: 'k-share__actions' }, auto, closeBtn)
      );
      closeBtn.focus({ preventScroll: true });
      return;
    }

    const usedDays = p.plan.map((d, i) => ({ d, i })).filter((x) => x.d.length);
    const days = h(
      'ol',
      { class: 'k-share__days' },
      usedDays.map(({ d, i }) =>
        h(
          'li',
          { class: 'k-share__day' + (p.dayMin[i] > 240 ? ' is-warn' : ''), style: `--dc:${planner.dayColors[i]}` },
          h('div', { class: 'k-share__dhead' }, h('span', { class: 'k-share__sw', 'aria-hidden': 'true' }), h('span', { class: 'k-share__dname', text: `${tr.day} ${i + 1}` }), h('span', { class: 'k-share__dtime', text: dur(p.dayMin[i]) })),
          h('p', { class: 'k-share__dstops', text: d.map((n) => t(stops[n - 1].name)).join('  ·  ') }),
          (planner.extrasForDay?.(i) || []).length ? h('p', { class: 'k-share__dx', text: planner.extrasForDay(i).map((x) => x.name).join('  ·  ') }) : null
        )
      )
    );
    const stickers = p.plan.flat().map((n) => stops[n - 1]).filter((s) => s.sticker);
    const stamps = h(
      'div',
      { class: 'k-share__stamps', 'aria-hidden': 'true' },
      stickers.map((s, i) => h('img', { class: 'k-share__stamp', src: asset(s.sticker), alt: '', style: `--r:${(i % 2 ? 1 : -1) * (4 + ((i * 5) % 7))}deg` }))
    );
    const mapClone = planner.mapSvg()?.cloneNode(true);
    mapClone?.removeAttribute('role');
    mapClone?.setAttribute('aria-hidden', 'true');

    const copyBtn = h('button', { class: 'nt-btn', type: 'button', html: `${icons.check}<span>${tr.copy}</span>` });
    copyBtn.addEventListener('click', async () => {
      const lines = [
        tr.myTrip,
        `${p.count}/16 ${tr.stops} · ${num(p.km)} ${tr.km} · ${(p.total / 60).toFixed(1)} ${tr.h}`,
        ...usedDays.map(({ d, i }) => `${tr.day} ${i + 1} (${dur(p.dayMin[i])}): ${[...d.map((n) => t(stops[n - 1].name)), ...(planner.extrasForDay?.(i) || []).map((x) => x.name)].join(', ')}`),
        data.hero.tagline,
      ];
      const text = lines.join('\n');
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        const ta = h('textarea', { class: 'k-sr' });
        ta.value = text;
        document.body.append(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      if (ok) {
        copyBtn.querySelector('span').textContent = tr.copied;
        setTimeout(() => { copyBtn.querySelector('span').textContent = tr.copy; }, 1800);
      }
    });

    panel.replaceChildren(
      h(
        'article',
        { class: 'k-share__card' },
        h(
          'header',
          { class: 'k-share__top' },
          h('img', { class: 'k-share__logo', src: asset(data.logo.cream), alt: tr.brand, width: 296, height: 165 }),
          h('div', { class: 'k-share__heading' }, h('p', { class: 'nt-eyebrow', text: tr.tripDays(usedDays.length) }), h('h2', { class: 'k-share__title', id: 'k-share-title', text: tr.myTrip }))
        ),
        h(
          'dl',
          { class: 'k-share__totals' },
          tot(tr.stops, `${p.count}`, '/16'),
          tot(tr.distance, num(p.km), tr.km),
          tot(tr.driving, (p.total / 60).toFixed(1), tr.h)
        ),
        h('div', { class: 'k-share__grid' }, days, h('div', { class: 'k-share__side' }, h('div', { class: 'k-share__map' }, mapClone), stickers.length ? stamps : null)),
        h('p', { class: 'k-share__tag', lang: 'ar', text: data.hero.tagline })
      ),
      h('div', { class: 'k-share__actions' }, copyBtn, closeBtn)
    );

    if (!isReduced()) {
      panel.querySelector('.k-share__card').animate([{ transform: 'translateY(24px) rotate(-1.5deg)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
      panel.querySelectorAll('.k-share__stamp').forEach((s, i) =>
        s.animate([{ transform: 'scale(1.8) rotate(0deg)', opacity: 0 }, { transform: 'scale(.94) rotate(var(--r))', opacity: 1, offset: 0.7 }, { transform: 'scale(1) rotate(var(--r))', opacity: 1 }], {
          duration: 420,
          delay: 380 + i * 120,
          easing: 'cubic-bezier(.3,.6,.4,1)',
          fill: 'backwards',
        })
      );
    }
    copyBtn.focus({ preventScroll: true });
  }

  function tot(label, value, unit) {
    return h('div', { class: 'k-share__tot' }, h('dt', { text: label }), h('dd', { dir: unit === '/16' ? 'ltr' : null }, h('span', { class: 'k-share__totv', dir: 'ltr', text: value }), h('span', { class: 'k-share__totu', text: unit })));
  }

  function open() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.documentElement.classList.add('is-sheet');
    render();
  }
  function close() {
    overlay.hidden = true;
    document.documentElement.classList.remove('is-sheet');
    lastFocus?.focus?.({ preventScroll: true });
  }
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') trap(e, overlay);
  });

  return { open, close };
}
