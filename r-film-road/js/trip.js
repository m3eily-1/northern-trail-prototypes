// Build your trip: people add bookable tours and stays to one list, then check out once.
// The list lives in localStorage (per browser) and can be shared as a link (?trip=...). It is
// ordered along the road, by stop number, so the list reads like the trip itself.
//
// Item ids: "t:<tour slug>" and "s:<stay key>". Quantity is guests for a tour, nights for a stay.
// Only items with a price can be added (checkout needs one).
import { money } from './money.js?v=27';

const KEY = 'nt-r-trip';
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const num = (n) => Number(n).toLocaleString('en-US');

export const TL = {
  en: {
    add: 'Add to trip',
    added: 'In your trip',
    addAria: (n) => `Add ${n} to your trip`,
    removeAria: (n) => `Remove ${n} from your trip`,
    my: 'My trip',
    open: 'Open my trip',
    close: 'Close',
    items: (n) => (n === 1 ? '1 item' : `${n} items`),
    empty: 'Your trip is empty.',
    emptyHint: 'Use Add to trip on any tour, stay or bundle. Everything you add lands here, in road order, ready to book at once.',
    guests: 'Guests',
    nights: 'Nights',
    less: 'Fewer',
    more: 'More',
    remove: 'Remove',
    total: 'Total',
    checkout: 'Check out all',
    share: 'Share trip',
    copied: 'Trip link copied',
    shareTitle: 'My Northern Trail trip',
    shareText: 'Here is my trip on the Northern Trail',
    addedToast: 'Added to your trip',
    view: 'View trip',
    sharedTitle: 'A shared trip',
    sharedText: (n) => `Someone shared ${n === 1 ? '1 item' : `${n} items`} with you.`,
    replace: 'Use this trip',
    merge: 'Add to my trip',
    dismiss: 'Not now',
    loaded: 'Shared trip opened',
    tour: 'Experience',
    stay: 'Stay',
    stop: (n, name) => `Stop ${n} · ${name}`,
    perPerson: 'per guest',
    perNight: 'per night',
    free: 'Free',
    sar: (n) => `¤${n}`,
    bar: 'My trip',
  },
  ar: {
    add: 'أضف إلى رحلتك',
    added: 'في رحلتك',
    addAria: (n) => `أضف ${n} إلى رحلتك`,
    removeAria: (n) => `احذف ${n} من رحلتك`,
    my: 'رحلتي',
    open: 'افتح رحلتي',
    close: 'إغلاق',
    items: (n) => (n === 1 ? 'عنصر واحد' : n === 2 ? 'عنصران' : n <= 10 ? `${n} عناصر` : `${n} عنصرًا`),
    empty: 'رحلتك فارغة.',
    emptyHint: 'استخدم «أضف إلى رحلتك» على أي جولة أو إقامة أو باقة. كل ما تضيفه يظهر هنا بترتيب الطريق، جاهزًا للحجز مرة واحدة.',
    guests: 'الضيوف',
    nights: 'الليالي',
    less: 'أقل',
    more: 'أكثر',
    remove: 'حذف',
    total: 'المجموع',
    checkout: 'احجز الكل',
    share: 'شارك رحلتك',
    copied: 'تم نسخ رابط الرحلة',
    shareTitle: 'رحلتي على مسار الشمال',
    shareText: 'هذه رحلتي على مسار الشمال',
    addedToast: 'أُضيف إلى رحلتك',
    view: 'عرض الرحلة',
    sharedTitle: 'رحلة مشاركة',
    sharedText: (n) => `شارك أحدهم معك ${n === 1 ? 'عنصرًا واحدًا' : n === 2 ? 'عنصرين' : `${n} عناصر`}.`,
    replace: 'استخدم هذه الرحلة',
    merge: 'أضفها إلى رحلتي',
    dismiss: 'ليس الآن',
    loaded: 'تم فتح الرحلة المشاركة',
    tour: 'تجربة',
    stay: 'إقامة',
    stop: (n, name) => `المحطة ${n} · ${name}`,
    perPerson: 'للضيف',
    perNight: 'لليلة',
    free: 'مجانًا',
    sar: (n) => `¤${n}`,
    bar: 'رحلتي',
  },
};

const pad2 = (n) => String(n).padStart(2, '0');

// The stop nearest to a stay (stays carry coordinates, not a stop).
export function nearestStop(data, s) {
  if (s.lat == null) return data.stops.find((x) => x.region === s.region)?.key;
  let best = null;
  let bd = Infinity;
  data.stops.forEach((x) => {
    const d = (x.lat - s.lat) ** 2 + ((x.lng - s.lng) * Math.cos((s.lat * Math.PI) / 180)) ** 2;
    if (d < bd) {
      bd = d;
      best = x.key;
    }
  });
  return best;
}

// Everything that can go into a trip, by id.
export function catalog(data) {
  const m = new Map();
  data.tours.forEach((x) => {
    if (x.price == null) return;
    m.set(`t:${x.slug}`, { id: `t:${x.slug}`, kind: 'tour', title: x.title, photo: x.photo, price: x.price, stop: x.stop, duration: x.duration });
  });
  data.stays.forEach((s) => {
    if (s.priceFrom == null) return;
    m.set(`s:${s.key}`, { id: `s:${s.key}`, kind: 'stay', title: s.name, photo: s.photo, price: s.priceFrom, stop: nearestStop(data, s), city: s.city });
  });
  return m;
}

const ICON = {
  plus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10.5 4 4 8-9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  minus: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  x: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  // a route: two pins joined by a dotted road
  trip: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="2.4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M18 3.5a3.5 3.5 0 0 1 3.5 3.5c0 2.6-3.5 6-3.5 6s-3.5-3.4-3.5-6A3.5 3.5 0 0 1 18 3.5Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 18H14a3 3 0 0 0 0-6H10a3 3 0 0 1 0-6h2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-dasharray="2 2.6"/></svg>',
  share: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 13V3M6 7l4-4 4 4M4 11v6h12v-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  arrow: '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
};
export { ICON as TRIP_ICON };

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => x && typeof x.id === 'string') : [];
  } catch (e) {
    return [];
  }
}
function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch (e) {
    /* private mode: the trip lives for this page only */
  }
}

// "t:slug*2,s:key*1" <-> [{id, qty}]
const encode = (list) => list.map((x) => `${x.id}*${x.qty}`).join(',');
const decode = (s) =>
  String(s || '')
    .split(',')
    .map((p) => {
      const [id, q] = p.split('*');
      return { id, qty: Math.max(1, Math.min(20, parseInt(q, 10) || 1)) };
    })
    .filter((x) => /^[ts]:[\w-]+$/.test(x.id));

// The trip control: nav button, floating bar, drawer, toast. One per page.
export function initTrip({ data, lang, t, asset, page = 'index.html' }) {
  const L = TL[lang];
  const cat = catalog(data);
  const stopBy = Object.fromEntries(data.stops.map((s) => [s.key, s]));
  let list = read().filter((x) => cat.has(x.id));
  const listeners = new Set();

  const sorted = () =>
    list
      .map((x) => ({ ...x, item: cat.get(x.id) }))
      .sort((a, b) => (stopBy[a.item.stop]?.n ?? 99) - (stopBy[b.item.stop]?.n ?? 99) || (a.item.kind === 'tour' ? -1 : 1));
  const total = () => list.reduce((s, x) => s + cat.get(x.id).price * x.qty, 0);
  const has = (id) => list.some((x) => x.id === id);
  const price = (n) => (n === 0 ? L.free : L.sar(num(n)));

  function commit() {
    write(list);
    render();
    listeners.forEach((fn) => fn());
    syncButtons();
  }
  function add(ids, { toast = true } = {}) {
    let n = 0;
    [].concat(ids).forEach((id) => {
      if (!cat.has(id) || has(id)) return;
      list.push({ id, qty: 1 });
      n++;
    });
    if (n) {
      commit();
      if (toast) say(L.addedToast, true);
      bump();
    }
  }
  function remove(id) {
    list = list.filter((x) => x.id !== id);
    commit();
  }
  function setQty(id, q) {
    const x = list.find((y) => y.id === id);
    if (!x) return;
    x.qty = Math.max(1, Math.min(20, q));
    commit();
  }

  // ---------- add buttons anywhere on the page: [data-trip-add="id[,id]"] ----------
  function syncButtons(scope = document) {
    scope.querySelectorAll('[data-trip-add]').forEach((b) => {
      const ids = b.dataset.tripAdd.split(',');
      const ok = ids.every((id) => cat.has(id));
      b.hidden = !ok;
      const on = ok && ids.every(has);
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-on', on);
      const label = b.querySelector('.trip-add__t');
      if (label) label.textContent = on ? L.added : b.dataset.label || L.add;
    });
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-trip-add]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const ids = b.dataset.tripAdd.split(',');
    if (ids.every(has)) {
      list = list.filter((x) => !ids.includes(x.id));
      commit();
    } else add(ids);
  });

  // ---------- chrome ----------
  const navEnd = document.querySelector('.wb-nav__end');
  const navBtn = document.createElement('button');
  navBtn.type = 'button';
  navBtn.className = 'wb-nav__icon wb-trip';
  navBtn.innerHTML = `${ICON.trip}<b class="wb-trip__n" aria-hidden="true"></b>`;
  navEnd?.insertBefore(navBtn, navEnd.querySelector('.wb-nav__sar'));

  const bar = document.createElement('button');
  bar.type = 'button';
  bar.className = 'nt trip-bar';
  bar.hidden = true;
  document.body.appendChild(bar);

  const dlg = document.createElement('dialog');
  dlg.className = 'nt trip';
  dlg.setAttribute('aria-labelledby', 'trip-title');
  document.body.appendChild(dlg);

  const toastEl = document.createElement('div');
  toastEl.className = 'nt trip-toast';
  toastEl.setAttribute('role', 'status');
  document.body.appendChild(toastEl);

  let shared = null; // a trip that arrived by link, waiting for a choice

  function row({ id, qty, item }) {
    const s = stopBy[item.stop];
    const kind = item.kind === 'tour' ? L.tour : L.stay;
    const unit = item.kind === 'tour' ? L.guests : L.nights;
    const per = item.price === 0 ? L.free : `${L.sar(num(item.price))} ${item.kind === 'tour' ? L.perPerson : L.perNight}`;
    const name = t(item.title);
    return `
      <li class="trip__row" data-id="${id}">
        <img class="trip__img" src="${asset(item.photo)}" alt="" loading="lazy">
        <div class="trip__info">
          <span class="trip__k">${esc(kind)}${s ? ` · ${esc(L.stop(pad2(s.n), t(s.name)))}` : ''}</span>
          <span class="trip__t">${esc(name)}</span>
          <span class="trip__per">${money(esc(per))}</span>
          ${shared ? '' : `
          <div class="trip__qty" role="group" aria-label="${esc(unit)}">
            <span class="trip__qk">${esc(unit)}</span>
            <button type="button" class="trip__step" data-step="-1" aria-label="${esc(L.less)}: ${esc(unit)}"${qty <= 1 ? ' disabled' : ''}>${ICON.minus}</button>
            <output class="trip__q">${qty}</output>
            <button type="button" class="trip__step" data-step="1" aria-label="${esc(L.more)}: ${esc(unit)}"${qty >= 20 ? ' disabled' : ''}>${ICON.plus}</button>
          </div>`}
        </div>
        <div class="trip__end">
          <span class="trip__line">${money(esc(price(item.price * qty)))}</span>
          ${shared ? '' : `<button type="button" class="trip__rm" aria-label="${esc(L.removeAria(name))}">${ICON.x}<span>${esc(L.remove)}</span></button>`}
        </div>
      </li>`;
  }

  function render() {
    const n = list.length;
    navBtn.setAttribute('aria-label', `${L.open} (${L.items(n)})`);
    navBtn.querySelector('.wb-trip__n').textContent = n || '';
    navBtn.classList.toggle('has-items', n > 0);
    bar.hidden = n === 0;
    bar.setAttribute('aria-label', `${L.open} (${L.items(n)})`);
    bar.innerHTML = `${ICON.trip}<span class="trip-bar__t">${esc(L.bar)}</span><b class="trip-bar__n">${n}</b><span class="trip-bar__sum">${money(esc(price(total())))}</span>${ICON.arrow}`;

    const view = shared
      ? shared.map((x) => ({ ...x, item: cat.get(x.id) })).sort((a, b) => (stopBy[a.item.stop]?.n ?? 99) - (stopBy[b.item.stop]?.n ?? 99))
      : sorted();
    const sum = shared ? shared.reduce((s, x) => s + cat.get(x.id).price * x.qty, 0) : total();
    dlg.innerHTML = `
      <div class="trip__in">
        <header class="trip__head">
          <div>
            <h2 class="trip__title" id="trip-title">${esc(shared ? L.sharedTitle : L.my)}</h2>
            <p class="trip__count">${esc(L.items(view.length))}</p>
          </div>
          <button type="button" class="trip__close" aria-label="${esc(L.close)}">${ICON.x}</button>
        </header>
        ${shared ? `<p class="trip__shared">${esc(L.sharedText(shared.length))}</p>` : ''}
        ${view.length
          ? `<ol class="trip__list">${view.map(row).join('')}</ol>`
          : `<div class="trip__empty"><span class="trip__empty-i">${ICON.trip}</span><p class="trip__empty-t">${esc(L.empty)}</p><p class="trip__empty-h">${esc(L.emptyHint)}</p></div>`}
        ${view.length
          ? `<footer class="trip__foot">
              <p class="trip__total"><span>${esc(L.total)}</span><b>${money(esc(price(sum)))}</b></p>
              ${shared
                ? `<div class="trip__acts">
                    <button type="button" class="nt-btn trip__go" data-shared="replace">${esc(L.replace)}</button>
                    ${list.length ? `<button type="button" class="trip__ghost" data-shared="merge">${esc(L.merge)}</button>` : ''}
                    <button type="button" class="trip__ghost" data-shared="dismiss">${esc(L.dismiss)}</button>
                  </div>`
                : `<div class="trip__acts">
                    <a class="nt-btn trip__go" href="checkout.html?lang=${lang}">${esc(L.checkout)}${ICON.arrow}</a>
                    <button type="button" class="trip__ghost trip__share">${ICON.share}<span>${esc(L.share)}</span></button>
                  </div>`}
            </footer>`
          : ''}
      </div>`;
  }

  dlg.addEventListener('click', async (e) => {
    if (e.target === dlg || e.target.closest('.trip__close')) return close();
    const rowEl = e.target.closest('.trip__row');
    const step = e.target.closest('.trip__step');
    if (step && rowEl) {
      const x = list.find((y) => y.id === rowEl.dataset.id);
      setQty(x.id, x.qty + Number(step.dataset.step));
      dlg.querySelector(`.trip__row[data-id="${CSS.escape(x.id)}"] [data-step="${step.dataset.step}"]:not(:disabled)`)?.focus();
      return;
    }
    if (e.target.closest('.trip__rm') && rowEl) {
      remove(rowEl.dataset.id);
      dlg.querySelector('.trip__rm, .trip__close')?.focus();
      return;
    }
    const sh = e.target.closest('[data-shared]');
    if (sh) {
      const how = sh.dataset.shared;
      if (how === 'replace') list = shared.slice();
      if (how === 'merge') shared.forEach((x) => !has(x.id) && list.push({ ...x }));
      shared = null;
      commit();
      if (how !== 'dismiss') say(L.loaded);
      return;
    }
    if (e.target.closest('.trip__share')) share();
  });
  dlg.addEventListener('close', () => document.documentElement.classList.remove('trip-open'));

  function open() {
    render();
    if (!dlg.open) dlg.showModal();
    document.documentElement.classList.add('trip-open');
  }
  function close() {
    if (shared) {
      shared = null;
      render();
    }
    dlg.close();
  }
  navBtn.addEventListener('click', open);
  bar.addEventListener('click', open);

  let toastT = 0;
  function say(msg, withView) {
    // the open drawer sits in the top layer, so the toast goes inside it
    (dlg.open ? dlg : document.body).appendChild(toastEl);
    toastEl.innerHTML = `<span>${esc(msg)}</span>${withView ? `<button type="button">${esc(L.view)}</button>` : ''}`;
    toastEl.querySelector('button')?.addEventListener('click', open);
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
  }
  function bump() {
    [navBtn, bar].forEach((el) => {
      el.classList.remove('is-bump');
      void el.offsetWidth;
      el.classList.add('is-bump');
    });
  }

  function link() {
    const u = new URL(page, location.href);
    u.search = '';
    u.searchParams.set('trip', encode(sorted()));
    u.searchParams.set('lang', lang);
    return u.toString();
  }
  async function share() {
    const url = link();
    if (navigator.share && matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({ title: L.shareTitle, text: L.shareText, url });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = url;
      dlg.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    say(L.copied);
  }

  // a shared trip in the URL: show it and let the person choose what to do with it
  const q = new URLSearchParams(location.search).get('trip');
  if (q) {
    const incoming = decode(q).filter((x) => cat.has(x.id));
    const u = new URL(location.href);
    u.searchParams.delete('trip');
    history.replaceState(null, '', u);
    if (incoming.length) {
      if (!list.length) {
        list = incoming;
        commit();
        setTimeout(() => {
          open();
          say(L.loaded);
        }, 400);
      } else {
        shared = incoming;
        setTimeout(open, 400);
      }
    }
  }

  render();
  syncButtons();

  return {
    L,
    has,
    add,
    remove,
    open,
    items: sorted,
    total,
    clear() {
      list = [];
      commit();
    },
    setQty,
    sync: syncButtons,
    onChange: (fn) => listeners.add(fn),
    // markup for an add button; ids is one id or several (a bundle)
    button(ids, { label, cls = '' } = {}) {
      const v = [].concat(ids).join(',');
      return `<button type="button" class="trip-add ${cls}" data-trip-add="${v}"${label ? ` data-label="${esc(label)}"` : ''} aria-pressed="false"><span class="trip-add__i trip-add__i--plus">${ICON.plus}</span><span class="trip-add__i trip-add__i--check">${ICON.check}</span><span class="trip-add__t">${esc(label || L.add)}</span></button>`;
    },
  };
}
