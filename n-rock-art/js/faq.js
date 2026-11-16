// FAQs: an accordion of buttons (aria-expanded), one open at a time. Opening
// an item chisels its answer in: a stepped, jagged wipe with a puff of dust.
import { t, esc, ui, pad2, reduced, chiselWords } from './i18n.js';
import { carveHTML } from './carve.js';
import { dust } from './reveal.js';

export function initFaq(data) {
  const root = document.getElementById('faq');
  const S = data.sections.faq;
  root.innerHTML = `
    <div class="nt-wrap faq__grid">
      <div class="faq__start">
        <header class="pr__head">
          <h2 class="h2" id="faq-title" data-chisel>${esc(t(S.title))}</h2>
          <p class="pr__sub" data-words>${chiselWords(ui.faqSub)}</p>
        </header>
        ${carveHTML('motif:figure', { cls: 'faq__art', ar: 140 / 180, seed: 77 })}
      </div>
      <div class="faq__list" data-rise>
        ${data.faq
          .map(
            (f, i) => `<div class="faq__item">
              <h3 class="faq__q">
                <button class="faq__btn" type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
                  <span class="faq__n">${pad2(i + 1)}</span>
                  <span class="faq__qt">${esc(t(f.q))}</span>
                  <span class="faq__plus" aria-hidden="true"><i></i><i></i></span>
                </button>
              </h3>
              <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
                <div class="faq__ai"><p class="faq__p">${esc(t(f.a))}</p></div>
              </div>
            </div>`
          )
          .join('')}
      </div>
    </div>`;

  const btns = [...root.querySelectorAll('.faq__btn')];
  const set = (open, animate) =>
    btns.forEach((b) => {
      const on = b === open;
      const was = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', String(on));
      const item = b.closest('.faq__item');
      item.classList.toggle('is-open', on);
      const panel = document.getElementById(b.getAttribute('aria-controls'));
      panel.inert = !on;
      if (on && !was && animate && !reduced) {
        const p = panel.querySelector('.faq__p');
        p.classList.remove('is-cut');
        void p.offsetWidth;
        p.classList.add('is-cut');
        setTimeout(() => dust(p, 12, 0.9), 120);
      }
    });
  btns.forEach((b) => b.addEventListener('click', () => set(b.getAttribute('aria-expanded') === 'true' ? null : b, true)));
  set(btns[0], false);
}
