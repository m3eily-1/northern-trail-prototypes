// Intro: a typographic interlude. Four huge numbers count up with fixed-width digit cells so
// nothing jitters while counting (Bukra has no tabular figures).
import { pad2 } from './labels.js';

export function initIntro(root, ctx) {
  const { data, t, reduced } = ctx;
  root.querySelector('.ntc-intro__title').textContent = t(data.intro.title);
  root.querySelector('.ntc-intro__body').textContent = t(data.intro.body);

  const list = root.querySelector('.ntc-stats');
  const rows = data.intro.stats.map((s, i) => {
    const li = document.createElement('li');
    li.className = 'ntc-stat';
    li.innerHTML = `
      <span class="ntc-stat__idx">${pad2(i + 1)}</span>
      <span class="ntc-stat__value">
        <span class="ntc-stat__num" aria-hidden="true"></span>
        ${s.unit ? `<span class="ntc-stat__unit">${t(s.unit)}</span>` : ''}
        <span class="ntc-sr">${s.value} ${s.unit ? t(s.unit) : ''}</span>
      </span>
      <span class="ntc-stat__label">${t(s.label)}</span>`;
    list.appendChild(li);
    return { li, num: li.querySelector('.ntc-stat__num'), value: s.value };
  });

  // widest digit in Bukra, as a fraction of the font size
  const c = document.createElement('canvas').getContext('2d');
  c.font = '700 100px nt-bukra';
  let maxW = 0;
  for (let d = 0; d <= 9; d++) maxW = Math.max(maxW, c.measureText(String(d)).width);
  root.style.setProperty('--dw', `${(maxW / 100 + 0.02).toFixed(3)}em`);

  const render = (el, str) => {
    el.innerHTML = [...str].map((ch) => (/\d/.test(ch) ? `<span class="d">${ch}</span>` : `<span>${ch}</span>`)).join('');
  };
  const format = (target, v) => {
    const decimals = (target.split('.')[1] || '').length;
    const n = v.toFixed(decimals);
    const [int, dec] = n.split('.');
    const grouped = target.includes(',') ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : int;
    return dec ? `${grouped}.${dec}` : grouped;
  };

  rows.forEach((r) => render(r.num, r.value));
  if (reduced) return;
  // lock each number box to its final width so the unit never moves while counting
  rows.forEach((r) => {
    r.num.style.minWidth = `${r.num.getBoundingClientRect().width / parseFloat(getComputedStyle(r.num).fontSize)}em`;
  });

  rows.forEach((r) => render(r.num, format(r.value, 0)));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const r = rows.find((x) => x.li === e.target);
        const target = parseFloat(r.value.replace(/,/g, ''));
        const dur = 1600;
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 4);
          render(r.num, k >= 1 ? r.value : format(r.value, target * eased));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    },
    { threshold: 0.6 }
  );
  rows.forEach((r) => io.observe(r.li));
}
