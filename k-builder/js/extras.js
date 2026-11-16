// Tours and stays the visitor adds to a planned day. Lives beside the planner
// state (stops per day) in its own store, and renders a short "also booked"
// list under each day column. Day removal shifts indices, Reset clears it.
import { t, tr, h, icons, lang, announce, isReduced } from './util.js';
import { createMenu } from './menu.js';

const STORE = 'nt-k-extras';

export const XL = {
  en: {
    remove: 'Remove from plan',
    removed: (n) => `${n} removed from your plan`,
    tour: 'Tour',
    stay: 'Stay',
    removeItem: (n) => `Remove ${n}`,
    alsoPlanned: 'Also planned',
  },
  ar: {
    remove: 'أزل من الخطة',
    removed: (n) => `أُزيلت ${n} من خطتك`,
    tour: 'جولة',
    stay: 'إقامة',
    removeItem: (n) => `أزل ${n}`,
    alsoPlanned: 'أضفتها أيضًا',
  },
}[lang];

const ticketIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 6h14v2.5a1.5 1.5 0 0 0 0 3V14H3v-2.5a1.5 1.5 0 0 0 0-3z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 6.5v7" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1.5 1.5"/></svg>';
const bedIcon = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 5v11M3 12h14v4M17 12V9.5A1.5 1.5 0 0 0 15.5 8H9v4M5.5 10.2a1.3 1.3 0 1 0 0-.1" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';
export const kindIcon = { tour: ticketIcon, stay: bedIcon };

export function createExtras(data, planner, bridge) {
  const host = document.getElementById('app');
  const menu = createMenu(host);
  const items = {
    tour: Object.fromEntries(data.tours.map((x) => [x.slug, x])),
    stay: Object.fromEntries(data.stays.map((x) => [x.key, x])),
  };
  const nameOf = (kind, id) => t(kind === 'tour' ? items.tour[id].title : items.stay[id].name);
  let state = { tour: {}, stay: {} };
  const fresh = new URLSearchParams(location.search).has('fresh');
  try {
    const s = fresh ? null : JSON.parse(localStorage.getItem(STORE) || 'null');
    if (s && typeof s === 'object') ['tour', 'stay'].forEach((k) => Object.entries(s[k] || {}).forEach(([id, d]) => {
      if (items[k][id] && Number.isInteger(d)) state[k][id] = d;
    }));
  } catch (e) { /* storage blocked */ }
  const listeners = new Set();

  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* storage blocked */ } };
  const dayOf = (kind, id) => (state[kind][id] ?? -1);
  const forDay = (i) => ['tour', 'stay'].flatMap((k) => Object.entries(state[k]).filter(([, d]) => d === i).map(([id]) => ({ kind: k, id, name: nameOf(k, id) })));

  function emit() {
    // drop anything pointing at a day that no longer exists
    const n = planner.dayCount;
    ['tour', 'stay'].forEach((k) => Object.keys(state[k]).forEach((id) => { if (state[k][id] >= n) delete state[k][id]; }));
    save();
    render();
    listeners.forEach((fn) => fn());
  }

  function render() {
    document.querySelectorAll('#plan .k-daycols > .k-day').forEach((col, i) => {
      let box = col.querySelector('.kx-dbox');
      if (!box) {
        box = h('div', { class: 'kx-dbox' }, h('p', { class: 'kx-dbox__l', text: XL.alsoPlanned }), h('ul', { class: 'kx-dlist' }));
        col.append(box);
      }
      const list = box.querySelector('.kx-dlist');
      const rows = forDay(i);
      box.hidden = !rows.length;
      list.replaceChildren(
        ...rows.map((r) => {
          const del = h('button', { class: 'kx-drow__del', type: 'button', 'aria-label': XL.removeItem(r.name), html: icons.close });
          del.addEventListener('click', () => set(r.kind, r.id, -1));
          return h(
            'li',
            { class: `kx-drow kx-drow--${r.kind}` },
            h('span', { class: 'kx-drow__ic', html: kindIcon[r.kind] }),
            h('span', { class: 'kx-drow__t' }, h('span', { class: 'k-sr', text: `${r.kind === 'tour' ? XL.tour : XL.stay}: ` }), r.name),
            del
          );
        })
      );
    });
  }

  function set(kind, id, day) {
    const before = dayOf(kind, id);
    if (day < 0) delete state[kind][id];
    else state[kind][id] = day;
    emit();
    const name = nameOf(kind, id);
    if (day >= 0) announce(tr.addedTo(name, day + 1));
    else if (before >= 0) announce(XL.removed(name));
    if (day >= 0 && !isReduced()) {
      const col = document.querySelectorAll('#plan .k-daycols > .k-day')[day];
      const row = col?.querySelectorAll('.kx-drow');
      row?.[row.length - 1]?.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }

  function openMenu(kind, id, btn) {
    if (menu.isOpen && menu.anchor === btn) return menu.close();
    const cur = dayOf(kind, id);
    const plan = planner.getPlan();
    const entries = Array.from({ length: planner.dayCount }, (_, i) => {
      const extra = forDay(i).length;
      const stops = plan.plan[i]?.length || 0;
      return {
        label: `${tr.day} ${i + 1}`,
        meta: stops || extra ? [stops ? tr.stopsCount(stops) : '', extra ? `+${extra}` : ''].filter(Boolean).join(' · ') : tr.emptyDay,
        color: planner.dayColors[i],
        current: cur === i,
        run: () => set(kind, id, i),
      };
    });
    if (cur >= 0) entries.push('sep', { label: XL.remove, icon: icons.close, run: () => set(kind, id, -1) });
    menu.open(btn, `${nameOf(kind, id)} · ${cur >= 0 ? tr.moveTo : tr.addTo}`, entries);
  }

  // planner hooks
  bridge.onDays = () => render();
  bridge.onRemoveDay = (i) => {
    ['tour', 'stay'].forEach((k) => Object.keys(state[k]).forEach((id) => {
      const d = state[k][id];
      if (d === i) delete state[k][id];
      else if (d > i) state[k][id] = d - 1;
    }));
    queueMicrotask(emit);
  };
  bridge.onReset = () => { state = { tour: {}, stay: {} }; queueMicrotask(emit); };
  bridge.extrasForDay = forDay;
  bridge.onUpdate = () => listeners.forEach((fn) => fn());

  emit();
  return { dayOf, set, openMenu, forDay, onChange: (fn) => listeners.add(fn), dayColors: planner.dayColors };
}
