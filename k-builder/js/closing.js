// Closing: the tagline, the closing line, the logo, and the brand stickers
// pinned around the edges like a finished trip board.
import { t, asset, tr, h, icons, onReveal } from './util.js';

export function initClosing(root, data) {
  const keys = ['thadiq', 'qassim', 'buraydah', 'hail', 'jubbah', 'salma'];
  const stickers = h(
    'div',
    { class: 'k-close__stickers', 'aria-hidden': 'true' },
    keys.map((k, i) => h('img', { class: `k-close__st k-close__st--${i}`, src: asset(data.stickers[k]), alt: '', loading: 'lazy', style: `--i:${i}` }))
  );
  root.append(
    stickers,
    h(
      'div',
      { class: 'nt-wrap k-close__in' },
      h('p', { class: 'k-close__tag', id: 'closing-title', lang: 'ar', dir: 'rtl', text: data.hero.tagline }),
      h('p', { class: 'k-close__line', text: t(data.closing.line) }),
      h('a', { class: 'nt-btn nt-btn--light', href: '#plan', html: `<span>${tr.plan}</span>${icons.arrow}` }),
      h('img', { class: 'k-close__logo', src: asset(data.logo.cream), alt: tr.brand, width: 296, height: 165, loading: 'lazy' })
    )
  );
  onReveal(root, () => root.classList.add('is-in'), '0px 0px -20% 0px');
}
