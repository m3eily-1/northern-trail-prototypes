// Signature: the itinerary planner. Stops (route order) on the start side,
// day columns on the end side. Drag, or use the + menu, to build days; the
// summary bar, day headers and the route map update live.
import { t, asset, pad2, tr, h, icons, dur, num, announce, isReduced, phoneMQ, lang } from './util.js';
import { odometer } from './odometer.js';
import { createMap } from './map.js';
import { createDrag } from './drag.js';
import { createMenu } from './menu.js';
import { flip, settle } from './flip.js';

export const DAY_COLORS = ['#824628', '#5a6432', '#a06eb4', '#c88c3c', '#736e5f', '#4b4b4b'];
const MAX_DAYS = 6;
const DEFAULT_DAYS = 3;
const LIMIT = 240; // minutes of driving per day before the warning tint
const STORE = 'nt-k-plan';

export function initPlanner(root, data, bridge) {
  const stops = data.stops;
  const byN = Object.fromEntries(stops.map((s) => [s.n, s]));
  const TOTAL_MIN = stops.reduce((a, s) => a + s.driveMinutes, 0);
  const KM_PER_MIN = 1200 / TOTAL_MIN;
  const cum = {};
  stops.reduce((a, s) => (cum[s.n] = a + s.driveMinutes), 0);
  const host = document.getElementById('app');
  let active = 0; // active day tab on phones
  let suppressUntil = 0;

  /* ---------- header ---------- */
  const toolAuto = h('button', { class: 'nt-btn k-tool', type: 'button', html: `${icons.spark}<span>${tr.autoPlan}</span>` });
  const toolAdd = h('button', { class: 'nt-btn k-tool k-tool--line', type: 'button', html: `${icons.plus}<span>${tr.addDay}</span>` });
  const toolReset = h('button', { class: 'nt-btn k-tool k-tool--line', type: 'button', html: `${icons.reset}<span>${tr.reset}</span>` });
  const head = h(
    'div',
    { class: 'nt-wrap k-plan__head' },
    h(
      'div',
      { class: 'k-plan__intro' },
      h('p', { class: 'nt-eyebrow k-plan__eyebrow', text: tr.planner }),
      h('h2', { class: 'nt-h2', id: 'plan-title', text: tr.plan }),
      h('p', { class: 'k-plan__hint' }, h('span', { class: 'k-hint--wide', text: tr.plannerHint }), h('span', { class: 'k-hint--phone', text: tr.plannerHintPhone }))
    ),
    h('div', { class: 'k-plan__tools' }, toolAuto, toolAdd, toolReset)
  );

  /* ---------- summary bar ---------- */
  const oStops = h('span', { class: 'k-sum__num' });
  const oKm = h('span', { class: 'k-sum__num' });
  const oHr = h('span', { class: 'k-sum__num' });
  const odoStops = odometer(oStops, '0');
  const odoKm = odometer(oKm, '0');
  const odoHr = odometer(oHr, '0.0');
  const sumDays = h('ul', { class: 'k-sum__days', 'aria-label': tr.driving });
  const shareBtn = h('button', { class: 'nt-btn nt-btn--light k-sum__share', type: 'button', html: `${icons.share}<span>${tr.share}</span>` });
  const stat = (label, numEl, unit) =>
    h('div', { class: 'k-sum__stat' }, h('span', { class: 'k-sum__label', text: label }), h('span', { class: 'k-sum__val', dir: unit === '/16' ? 'ltr' : null }, numEl, unit ? h('span', { class: 'k-sum__unit', text: unit }) : null));
  const summary = h(
    'div',
    { class: 'k-sum' },
    h(
      'div',
      { class: 'nt-wrap k-sum__in' },
      h('div', { class: 'k-sum__stats' }, stat(tr.planned, oStops, '/16'), stat(tr.distance, oKm, tr.km), stat(tr.driving, oHr, tr.h)),
      sumDays,
      shareBtn
    )
  );

  /* ---------- board ---------- */
  const poolCount = h('span', { class: 'k-zhead__meta' });
  const poolList = h('ol', { class: 'k-list k-list--pool', 'data-empty': tr.allPlanned });
  const pool = h(
    'div',
    { class: 'k-pool', id: 'stops' },
    h('div', { class: 'k-zhead' }, h('h3', { class: 'k-zhead__title', text: tr.stops }), poolCount),
    poolList
  );
  const tabs = h('div', { class: 'k-tabs', role: 'tablist', 'aria-label': tr.planner });
  const dayCols = h('div', { class: 'k-daycols' });
  const mapBox = h('div', { class: 'k-mapbox' }, h('p', { class: 'k-mapbox__label nt-eyebrow', text: tr.route }));
  const board = h('div', { class: 'k-board' }, pool, h('div', { class: 'k-days' }, tabs, dayCols), mapBox);
  root.append(head, summary, h('div', { class: 'nt-wrap' }, board));
  const map = createMap(mapBox, data, DAY_COLORS);
  const menu = createMenu(host);

  /* ---------- chips ---------- */
  const chips = {};
  stops.forEach((s) => {
    const add = h('button', {
      class: 'k-chip__add',
      type: 'button',
      'aria-haspopup': 'menu',
      'aria-expanded': 'false',
      'aria-label': tr.menuFor(t(s.name)),
      html: icons.plus,
    });
    const chip = h(
      'li',
      { class: 'k-chip', 'data-n': s.n },
      h('span', { class: 'k-chip__flash', 'aria-hidden': 'true' }),
      h(
        'button',
        { class: 'k-chip__main', type: 'button', 'aria-label': tr.detailsFor(t(s.name)) },
        h('span', { class: 'k-chip__thumb' }, h('img', { src: asset(s.photo), alt: '', loading: 'lazy', draggable: 'false' }), h('span', { class: 'k-chip__n', text: pad2(s.n) })),
        h(
          'span',
          { class: 'k-chip__txt' },
          h('span', { class: 'k-chip__name', text: t(s.name) }),
          h('span', { class: 'k-chip__drive' }, h('span', { class: 'k-chip__car', html: icons.car }), h('span', { class: 'k-chip__dt', text: s.drive ? t(s.drive) : tr.start }))
        )
      ),
      s.sticker ? h('img', { class: 'k-chip__sticker', src: asset(s.sticker), alt: '', loading: 'lazy', draggable: 'false' }) : null,
      add
    );
    chip.querySelector('.k-chip__main').addEventListener('click', (e) => {
      if (performance.now() < suppressUntil) return e.preventDefault();
      bridge.openSheet?.(s.n);
    });
    add.addEventListener('click', () => {
      if (menu.isOpen && menu.anchor === add) return menu.close();
      openMenu(s.n, add);
    });
    chips[s.n] = chip;
    poolList.append(chip);
  });

  /* ---------- days ---------- */
  let days = []; // [{col, list, head, tab}]
  function makeDay() {
    const i = days.length;
    const title = h('h3', { class: 'k-day__title' });
    const meta = h('span', { class: 'k-day__meta' });
    const del = h('button', { class: 'k-day__del', type: 'button', html: icons.close });
    const list = h('ol', { class: 'k-list k-list--day', 'data-empty': tr.dropHere });
    const col = h(
      'section',
      { class: 'k-day', role: 'tabpanel' },
      h('div', { class: 'k-day__head' }, h('span', { class: 'k-day__sw', 'aria-hidden': 'true' }), h('div', { class: 'k-day__hd' }, title, meta), del),
      list
    );
    const tabCount = h('span', { class: 'k-tab__count' });
    const tab = h('button', { class: 'k-tab', type: 'button', role: 'tab' }, h('span', { class: 'k-tab__sw', 'aria-hidden': 'true' }), h('span', { class: 'k-tab__label' }), tabCount);
    const d = { col, list, title, meta, del, tab, tabCount };
    tab.addEventListener('click', () => setActive(days.indexOf(d), true));
    tab.addEventListener('keydown', (e) => {
      const dir = (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * (lang === 'ar' ? -1 : 1);
      if (!dir) return;
      const j = (days.indexOf(d) + dir + days.length) % days.length;
      setActive(j, true);
      days[j].tab.focus();
    });
    del.addEventListener('click', () => removeDay(days.indexOf(d)));
    days.push(d);
    dayCols.append(col);
    tabs.insertBefore(tab, tabAdd);
    labelDays();
    return d;
  }
  const tabAdd = h('button', { class: 'k-tab k-tab--add', type: 'button', 'aria-label': tr.addDay, html: icons.plus });
  tabs.append(tabAdd);
  tabAdd.addEventListener('click', () => addDay());

  function labelDays() {
    days.forEach((d, i) => {
      const c = DAY_COLORS[i];
      d.col.style.setProperty('--dc', c);
      d.tab.style.setProperty('--dc', c);
      d.col.dataset.day = i;
      d.list.dataset.day = i;
      d.title.textContent = `${tr.day} ${i + 1}`;
      d.tab.querySelector('.k-tab__label').textContent = `${tr.day} ${i + 1}`;
      d.col.id = `k-day-${i}`;
      d.tab.id = `k-tab-${i}`;
      d.tab.setAttribute('aria-controls', d.col.id);
      d.col.setAttribute('aria-labelledby', d.tab.id);
      d.del.setAttribute('aria-label', `${tr.removeDay} ${i + 1}`);
      d.del.hidden = days.length <= 1;
    });
    tabAdd.hidden = days.length >= MAX_DAYS;
    toolAdd.disabled = days.length >= MAX_DAYS;
    dayCols.dataset.count = days.length;
    setActive(Math.min(active, days.length - 1));
    bridge.onDays?.();
  }

  function setActive(i, user) {
    active = Math.max(0, i);
    days.forEach((d, j) => {
      const on = j === active;
      d.col.classList.toggle('is-active', on);
      d.tab.classList.toggle('is-active', on);
      d.tab.setAttribute('aria-selected', on ? 'true' : 'false');
      d.tab.tabIndex = on ? 0 : -1;
    });
    if (user && !isReduced() && phoneMQ.matches) {
      days[active].list.querySelectorAll('.k-chip').forEach((c, k) =>
        c.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: k * 30, easing: 'ease-out', fill: 'backwards' })
      );
    }
  }

  /* ---------- model ---------- */
  const read = () => days.map((d) => [...d.list.children].filter((c) => c.classList.contains('k-chip')).map((c) => +c.dataset.n));
  function compute(plan) {
    let prev = 1;
    const per = {};
    const dayMin = plan.map((d) =>
      d.reduce((a, n) => {
        const m = Math.abs(cum[n] - cum[prev]);
        per[n] = m;
        prev = n;
        return a + m;
      }, 0)
    );
    const total = dayMin.reduce((a, b) => a + b, 0);
    return { per, dayMin, total, km: Math.round(total * KM_PER_MIN), count: plan.flat().length };
  }
  function locate(n) {
    const chip = chips[n];
    const di = days.findIndex((d) => d.list === chip.parentElement);
    return { day: di, idx: di >= 0 ? [...days[di].list.children].indexOf(chip) : -1, len: di >= 0 ? days[di].list.children.length : 0 };
  }

  function update() {
    const plan = read();
    const c = compute(plan);
    odoStops.set(String(c.count));
    odoKm.set(num(c.km));
    odoHr.set((c.total / 60).toFixed(1));
    poolCount.textContent = `${16 - c.count} ${tr.stopsLeft}`;
    shareBtn.classList.toggle('is-ready', c.count > 0);

    sumDays.replaceChildren(
      ...plan.map((d, i) =>
        h(
          'li',
          { class: 'k-sum__day' + (c.dayMin[i] > LIMIT ? ' is-warn' : ''), style: `--dc:${DAY_COLORS[i]}` },
          h('span', { class: 'k-sum__sw', 'aria-hidden': 'true' }),
          h('span', { class: 'k-sum__dl', text: `${tr.day} ${i + 1}` }),
          h('span', { class: 'k-sum__dv', text: dur(c.dayMin[i]) }),
          c.dayMin[i] > LIMIT ? h('span', { class: 'k-sum__warn', html: icons.warn, title: tr.over }) : null
        )
      )
    );

    days.forEach((d, i) => {
      const warn = c.dayMin[i] > LIMIT;
      d.col.classList.toggle('is-warn', warn);
      d.tab.classList.toggle('is-warn', warn);
      d.meta.replaceChildren(
        ...[
          h('span', { text: tr.stopsCount(plan[i].length) }),
          plan[i].length ? h('span', { class: 'k-day__dot', 'aria-hidden': 'true', text: '·' }) : null,
          plan[i].length ? h('span', { text: dur(c.dayMin[i]) }) : null,
          warn ? h('span', { class: 'k-day__warn', title: tr.over, html: `${icons.warn}<span class="k-sr">${tr.over}</span>` }) : null,
        ].filter(Boolean)
      );
      d.tabCount.textContent = String(plan[i].length);
    });

    stops.forEach((s) => {
      const chip = chips[s.n];
      const di = plan.findIndex((d) => d.includes(s.n));
      chip.style.setProperty('--dc', di >= 0 ? DAY_COLORS[di] : '');
      chip.classList.toggle('is-planned', di >= 0);
      const dt = chip.querySelector('.k-chip__dt');
      dt.textContent = di >= 0 ? (c.per[s.n] ? dur(c.per[s.n]) : tr.start) : s.drive ? t(s.drive) : tr.start;
    });
    map.update(plan);
    try { localStorage.setItem(STORE, JSON.stringify(plan)); } catch (e) { /* storage blocked */ }
    bridge.onUpdate?.(c);
    return c;
  }

  /* ---------- placement helpers ---------- */
  function poolRef(n) {
    return [...poolList.children].find((c) => c.classList.contains('k-chip') && +c.dataset.n > n) || null;
  }
  function placeInPool(chip) {
    const ref = poolRef(+chip.dataset.n);
    if (chip.parentElement === poolList && chip.nextElementSibling === ref) return false;
    poolList.insertBefore(chip, ref);
    return true;
  }

  // Drag callbacks
  function zones() {
    return [{ el: pool, list: poolList, kind: 'pool' }, ...days.map((d, i) => ({ el: d.col, list: d.list, kind: 'day', day: i }))];
  }
  function place(chip, zone, y) {
    if (zone.kind === 'pool') {
      if (chip.parentElement === poolList) return;
      flip(board, () => placeInPool(chip));
      return;
    }
    const list = zone.list;
    const lr = list.getBoundingClientRect();
    const rel = y - lr.top;
    const others = [...list.children].filter((c) => c !== chip);
    const ref = others.find((c) => c.offsetTop + c.offsetHeight / 2 > rel) || null;
    if (chip.parentElement === list && chip.nextElementSibling === ref) return;
    flip(board, () => list.insertBefore(chip, ref));
  }
  function restore(chip, origin) {
    if (origin.list === poolList) {
      if (chip.parentElement !== poolList) flip(board, () => placeInPool(chip));
      return;
    }
    const ref = origin.next && origin.next.parentElement === origin.list && origin.next !== chip ? origin.next : null;
    if (chip.parentElement === origin.list && chip.nextElementSibling === ref) return;
    flip(board, () => origin.list.insertBefore(chip, ref));
  }
  createDrag({
    scope: board,
    host,
    zones,
    place,
    restore,
    commit(chip, dropped) {
      const before = chip.dataset.loc;
      update();
      const loc = locate(+chip.dataset.n);
      chip.dataset.loc = `${loc.day}:${loc.idx}`;
      if (dropped) settle(chip, true);
      if (dropped && before !== chip.dataset.loc) {
        const s = byN[chip.dataset.n];
        announce(loc.day >= 0 ? tr.addedTo(t(s.name), loc.day + 1) : tr.movedBack(t(s.name)));
      }
    },
    suppressClick() { suppressUntil = performance.now() + 350; },
  });

  /* ---------- actions ---------- */
  async function addTo(n, di) {
    if (di >= days.length) return;
    const chip = chips[n];
    const target = days[di].list;
    if (chip.parentElement === target) return;
    await flip(board, () => {
      if (phoneMQ.matches) setActive(di);
      target.append(chip);
    });
    update();
    settle(chip, true);
    pulse(days[di]);
    announce(tr.addedTo(t(byN[n].name), di + 1));
  }
  async function back(n) {
    const chip = chips[n];
    if (chip.parentElement === poolList) return;
    await flip(board, () => placeInPool(chip));
    update();
    settle(chip);
    announce(tr.movedBack(t(byN[n].name)));
  }
  async function moveBy(n, delta) {
    const chip = chips[n];
    const list = chip.parentElement;
    const sib = delta < 0 ? chip.previousElementSibling : chip.nextElementSibling?.nextElementSibling ?? null;
    if (delta < 0 && !sib) return;
    await flip(board, () => list.insertBefore(chip, sib));
    update();
    chip.querySelector('.k-chip__add').focus({ preventScroll: true });
  }
  function pulse(d) {
    if (isReduced()) return;
    d.col.querySelector('.k-day__head').animate([{ backgroundColor: 'var(--k-day-hi)' }, { backgroundColor: 'transparent' }], { duration: 700, easing: 'ease-out' });
    d.tab.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
  }

  function addDay() {
    if (days.length >= MAX_DAYS) return;
    let d;
    flip(board, () => { d = makeDay(); });
    if (phoneMQ.matches) setActive(days.length - 1, true);
    update();
    if (!isReduced()) d.col.animate([{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function removeDay(i) {
    if (days.length <= 1) return;
    const d = days[i];
    bridge.onRemoveDay?.(i);
    flip(board, () => {
      [...d.list.querySelectorAll('.k-chip')].forEach((c) => placeInPool(c));
      d.col.remove();
      d.tab.remove();
      days.splice(i, 1);
      if (active >= days.length) active = days.length - 1;
      labelDays();
    });
    update();
  }

  // Split the whole route into N contiguous days, minimising the longest drive.
  function partition(nDays) {
    const w = stops.map((s) => s.driveMinutes);
    const n = w.length;
    const pre = [0];
    w.forEach((v, i) => (pre[i + 1] = pre[i] + v));
    const best = Array.from({ length: nDays + 1 }, () => Array(n + 1).fill(Infinity));
    const cut = Array.from({ length: nDays + 1 }, () => Array(n + 1).fill(0));
    best[0][0] = 0;
    for (let k = 1; k <= nDays; k++)
      for (let i = k; i <= n; i++)
        for (let j = k - 1; j < i; j++) {
          const v = Math.max(best[k - 1][j], pre[i] - pre[j]);
          // tie-break toward even stop counts
          const tb = v + Math.abs(i - j - n / nDays) * 0.01;
          if (tb < best[k][i]) { best[k][i] = tb; cut[k][i] = j; }
        }
    const groups = [];
    let i = n;
    for (let k = nDays; k > 0; k--) {
      const j = cut[k][i];
      groups.unshift(stops.slice(j, i).map((s) => s.n));
      i = j;
    }
    return groups;
  }
  async function autoPlan() {
    menu.close(false);
    const groups = partition(days.length);
    root.classList.add('is-autoplanning');
    await flip(
      board,
      () => {
        groups.forEach((g, i) => g.forEach((n) => days[i].list.append(chips[n])));
      },
      { stagger: 45, order: (e) => +e.dataset.n, duration: 520 }
    );
    root.classList.remove('is-autoplanning');
    update();
    days.forEach((d, i) => setTimeout(() => pulse(d), i * 90));
  }
  async function reset() {
    menu.close(false);
    bridge.onReset?.();
    await flip(board, () => {
      stops.forEach((s) => placeInPool(chips[s.n]));
      while (days.length > DEFAULT_DAYS) {
        const d = days.pop();
        d.col.remove();
        d.tab.remove();
      }
      labelDays();
    }, { stagger: 20, order: (e) => -e.dataset.n });
    update();
  }

  function openMenu(n, btn) {
    const plan = read();
    const c = compute(plan);
    const loc = locate(n);
    const entries = days.map((d, i) => ({
      label: `${tr.day} ${i + 1}`,
      meta: plan[i].length ? `${tr.stopsCount(plan[i].length)} · ${dur(c.dayMin[i])}` : tr.emptyDay,
      color: DAY_COLORS[i],
      current: loc.day === i,
      run: () => addTo(n, i),
    }));
    if (loc.day >= 0) {
      entries.push('sep');
      if (loc.idx > 0) entries.push({ label: tr.moveUp, icon: icons.up, run: () => moveBy(n, -1) });
      if (loc.idx < loc.len - 1) entries.push({ label: tr.moveDown, icon: icons.down, run: () => moveBy(n, 1) });
      entries.push({ label: tr.backToStops, icon: icons.back, run: () => back(n) });
    }
    entries.push('sep', { label: tr.details, icon: icons.info, run: () => bridge.openSheet?.(n) });
    menu.open(btn, loc.day >= 0 ? `${t(byN[n].name)} · ${tr.moveTo}` : `${t(byN[n].name)} · ${tr.addTo}`, entries);
  }

  toolAuto.addEventListener('click', autoPlan);
  toolAdd.addEventListener('click', addDay);
  toolReset.addEventListener('click', reset);
  shareBtn.addEventListener('click', () => bridge.openShare?.());

  /* ---------- initial state ---------- */
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) { saved = null; }
  if (new URLSearchParams(location.search).has('fresh')) saved = null;
  const nDays = Array.isArray(saved) && saved.length >= 1 && saved.length <= MAX_DAYS ? saved.length : DEFAULT_DAYS;
  for (let i = 0; i < nDays; i++) makeDay();
  if (Array.isArray(saved)) {
    const seen = new Set();
    saved.forEach((d, i) => Array.isArray(d) && d.forEach((n) => {
      if (chips[n] && !seen.has(n)) { seen.add(n); days[i].list.append(chips[n]); }
    }));
  }
  setActive(0);
  update();
  phoneMQ.addEventListener('change', () => setActive(active));

  return {
    addTo,
    back,
    locate,
    get dayCount() { return days.length; },
    dayColors: DAY_COLORS,
    getPlan() {
      const plan = read();
      return { plan, ...compute(plan) };
    },
    autoPlan,
    mapSvg: () => mapBox.querySelector('svg'),
  };
}
