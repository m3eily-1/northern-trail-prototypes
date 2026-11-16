// Closing: back in the window seat after dark at Jubbah. The tagline, the
// closing line and the logo against the night outside the glass.
import { t, esc, asset, ui, icons, splitWords, inview, rng } from './util.js';

export function initClosing(data) {
  const root = document.getElementById('closing');
  const r = rng(97);
  const stars = Array.from({ length: 70 }, () => {
    const s = 1 + Math.round(r() * 2);
    return `<i style="inset-inline-start:${(r() * 100).toFixed(2)}%;top:${(r() * 62).toFixed(2)}%;width:${s}px;height:${s}px;--d:${(r() * 4).toFixed(2)}s"></i>`;
  }).join('');

  root.innerHTML = `
    <div class="closing__cabin">
      <div class="closing__win">
        <div class="closing__view" aria-hidden="true">
          <i class="closing__sky"></i>
          <span class="closing__stars">${stars}</span>
          <img class="closing__rock closing__rock--a" src="${asset('assets/img/icon-6.png')}" alt="" loading="lazy">
          <img class="closing__rock closing__rock--b" src="${asset('assets/img/icon-1.png')}" alt="" loading="lazy">
          <i class="closing__ground"></i>
          <i class="glass"></i>
        </div>
        <div class="closing__copy">
          <h2 class="closing__tag" id="closing-title" lang="ar">${esc(data.hero.tagline)}</h2>
          <p class="closing__line">${esc(t(data.closing.line))}</p>
          <div class="closing__row">
            <img class="closing__logo" src="${asset(data.logo.cream)}" alt="${esc(ui.brand)}" width="296" height="165" loading="lazy">
            <a class="nt-btn nt-btn--light closing__cta" href="#stops"><span>${esc(ui.again)}</span>${icons.up}</a>
          </div>
        </div>
      </div>
    </div>`;
  splitWords(root.querySelector('.closing__tag'));
  inview(root.querySelector('.closing__win'), '0px 0px -15% 0px');
}
