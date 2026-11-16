// Closing page: tagline, closing line, the logo, signed off with a drawn line.
import { t, esc, asset, lang } from './i18n.js';
import { signature, doodle } from './sketches.js';
import { inview } from './scroll.js';

export function initClosing(data) {
  const root = document.getElementById('closing');
  root.innerHTML = `
    <div class="spread closing__spread">
      <div class="page page--start closing__start">
        <h2 class="closing__tag" id="closing-title" lang="ar" dir="rtl">${esc(data.hero.tagline)}</h2>
        <span class="dood dood--c" aria-hidden="true">${doodle('star', 61)}</span>
      </div>
      <div class="page page--end closing__end">
        <p class="closing__line">${esc(t(data.closing.line))}</p>
        <div class="closing__sign">
          <img class="closing__logo" src="${asset(data.logo.dark)}" alt="${lang === 'ar' ? 'مسار الشمال' : 'Northern Trail'}" width="296" height="165" loading="lazy">
          ${signature()}
        </div>
      </div>
    </div>`;
  inview(root.querySelector('.closing__spread'), '0px 0px -20% 0px');
}
