// Intro: title, body and four giant stats that count up once in view.
import { env, t, maskWords, onEnter, tick } from './util.js';

export function renderIntro(section, data) {
  const i = data.intro;
  section.innerHTML = `
    <div class="nt-wrap intro__grid">
      <h2 class="intro__title">${maskWords(t(i.title))}</h2>
      <p class="intro__body" data-reveal>${t(i.body)}</p>
      <ul class="stats">
        ${i.stats.map((s, k) => `
          <li class="stat" style="--k:${k}">
            <p class="stat__num"><span class="stat__v" data-count="${s.value}">${s.value}</span>${s.unit ? `<span class="stat__u">${t(s.unit)}</span>` : ''}</p>
            <p class="stat__label">${t(s.label)}</p>
          </li>`).join('')}
      </ul>
    </div>`;

  onEnter([section.querySelector('.intro__title'), section.querySelector('.intro__body')], (n) => n.classList.add('is-revealed'));
  onEnter(section.querySelectorAll('.stat'), (li) => countUp(li.querySelector('[data-count]')), { rootMargin: '0px 0px -10% 0px' });
}

function countUp(node) {
  if (env.reduced) return;
  const raw = node.dataset.count;
  const decimals = (raw.split('.')[1] || '').length;
  const target = parseFloat(raw.replace(/,/g, ''));
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const t0 = performance.now();
  const dur = 1400;
  node.textContent = fmt(0);
  const step = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 4);
    node.textContent = fmt(target * e);
    if (p < 1) tick(step); else node.textContent = raw;
  };
  tick(step);
}
