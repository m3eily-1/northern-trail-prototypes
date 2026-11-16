// Closing: tagline over a slow sand-dune noise field (GL), closing line, logo.
import { env, t, asset, maskWords, onEnter } from './util.js';

export function renderClosing(section, data) {
  section.innerHTML = `
    <div class="closing__gl" data-gl-dunes></div>
    <div class="nt-wrap closing__inner">
      <p class="closing__tag" lang="ar" dir="rtl">${maskWords(data.hero.tagline)}</p>
      <p class="closing__line" data-reveal>${t(data.closing.line)}</p>
      <img class="closing__logo" data-reveal src="${asset(data.logo.cream)}" alt="${env.lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165" loading="lazy">
    </div>`;
  onEnter([section.querySelector('.closing__tag')], null, { rootMargin: '0px 0px -20% 0px' });
  onEnter(section.querySelectorAll('[data-reveal]'), (n) => n.classList.add('is-revealed'), { rootMargin: '0px 0px -10% 0px' });
}
