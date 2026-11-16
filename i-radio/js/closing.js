// Closing: signing off. Tagline glows on the display glass, closing line, logo.
import { t, esc, asset, l } from './util.js';

export function mountClosing(root, data, radio) {
  root.innerHTML = `
    <div class="nt-wrap closing__inner">
      <p class="closing__k nt-eyebrow" data-reveal><i class="led"></i><span>NT 1200</span><span class="dot-sep"></span><span>${esc(l('signoff'))}</span></p>
      <p class="closing__tag" lang="ar" dir="rtl" data-reveal>${esc(data.hero.tagline)}</p>
      <p class="closing__line" data-reveal>${esc(t(data.closing.line))}</p>
      <div class="closing__foot" data-reveal>
        <img class="closing__logo" src="${asset(data.logo.cream)}" alt="Northern Trail" width="296" height="165">
        <button class="key closing__back" type="button">${esc(l('back'))}</button>
      </div>
    </div>`;
  root.querySelector('.closing__back').addEventListener('click', () => radio?.tuneTo(0));
}
