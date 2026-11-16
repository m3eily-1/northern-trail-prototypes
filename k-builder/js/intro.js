// Intro: what the trail is, four rolling stats, and the three pillars.
import { t, asset, pad2, h, onReveal } from './util.js';
import { odometer } from './odometer.js';

export function initIntro(root, data) {
  const { intro, pillars } = data;

  const stats = h('dl', { class: 'k-stats' });
  const odos = [];
  intro.stats.forEach((s) => {
    const val = h('span', { class: 'k-stat__num' });
    const zero = s.value.replace(/\d/g, '0');
    odos.push([odometer(val, zero), s.value]);
    stats.append(
      h(
        'div',
        { class: 'k-stat' },
        h('dt', { class: 'k-stat__label', text: t(s.label) }),
        h('dd', { class: 'k-stat__val' }, val, s.unit ? h('span', { class: 'k-stat__unit', text: t(s.unit) }) : null)
      )
    );
  });

  const list = h('ul', { class: 'k-pillars' });
  pillars.forEach((p, i) => {
    list.append(
      h(
        'li',
        { class: 'k-pillar', style: `--pc:${p.color}`, 'data-reveal': '', 'data-i': i },
        h('div', { class: 'k-pillar__art' }, h('span', { class: 'k-pillar__n', text: pad2(i + 1) }), h('img', { src: asset(p.art), alt: '', loading: 'lazy' })),
        h('div', { class: 'k-pillar__txt' }, h('h3', { class: 'k-pillar__name', text: t(p.name) }), h('p', { class: 'k-pillar__line', text: t(p.line) }))
      )
    );
  });

  root.append(
    h(
      'div',
      { class: 'nt-wrap' },
      h(
        'div',
        { class: 'k-intro__top' },
        h('div', { class: 'k-intro__copy', 'data-reveal': '' }, h('h2', { class: 'nt-h2', id: 'intro-title', text: t(intro.title) }), h('p', { class: 'nt-lede', text: t(intro.body) })),
        stats
      ),
      list
    )
  );

  onReveal(stats, () => odos.forEach(([o, v]) => o.set(v)));
  root.querySelectorAll('[data-reveal]').forEach((el) => onReveal(el, () => el.classList.add('is-revealed')));
}
