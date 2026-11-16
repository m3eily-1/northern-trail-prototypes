// FAQs as a star log: an accessible accordion of buttons with aria-expanded,
// one entry open at a time. The toggle is a four-point star that flares open.
import { t, esc, ui } from './i18n.js';
import { reveal, splitWords, starGlyph } from './util.js';

export function initFaq(data) {
  const root = document.getElementById('faq');
  const S = data.sections.faq;
  root.innerHTML = `
    <div class="nt-wrap faq">
      <header class="px__head faq__head">
        <p class="m-eyebrow" data-r>${starGlyph()}<span>${esc(ui.log)}</span></p>
        <h2 class="m-h2 m-split" id="faq-title">${esc(t(S.title))}</h2>
      </header>
      <div class="faq__list" data-r>
        ${data.faq
          .map(
            (f, i) => `<div class="faq__item">
              <h3 class="faq__q">
                <button class="faq__btn" type="button" id="faq-q-${i}" aria-expanded="false" aria-controls="faq-a-${i}">
                  <span class="faq__n">${esc(ui.logN(i + 1))}</span>
                  <span class="faq__qt">${esc(t(f.q))}</span>
                  <span class="faq__ico" aria-hidden="true">${starGlyph('faq__star')}<i class="faq__bar"></i></span>
                </button>
              </h3>
              <div class="faq__a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}">
                <div class="faq__ai"><p>${esc(t(f.a))}</p></div>
              </div>
            </div>`
          )
          .join('')}
      </div>
    </div>`;
  const h2 = root.querySelector('h2');
  splitWords(h2);
  reveal(h2);
  root.querySelectorAll('[data-r]').forEach((el) => reveal(el));

  const btns = [...root.querySelectorAll('.faq__btn')];
  const set = (open) =>
    btns.forEach((b) => {
      const on = b === open;
      b.setAttribute('aria-expanded', String(on));
      b.closest('.faq__item').classList.toggle('is-open', on);
      document.getElementById(b.getAttribute('aria-controls')).inert = !on;
    });
  btns.forEach((b) => b.addEventListener('click', () => set(b.getAttribute('aria-expanded') === 'true' ? null : b)));
  set(btns[0]);
}
