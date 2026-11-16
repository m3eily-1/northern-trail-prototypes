// Rest stop, part 4: FAQs on an info-kiosk screen. Accessible accordion built
// from buttons with aria-expanded, one answer open at a time.
import { t, esc, asset, ui, icons, splitWords, inview, pad2 } from './util.js';

export function initFaq(data) {
  const root = document.getElementById('faq');
  const S = data.sections.faq;

  root.innerHTML = `
    <div class="nt-wrap faq">
      <div class="faq__start">
        <header class="pr__head">
          <p class="nt-eyebrow pr__eyebrow">${esc(ui.info)}</p>
          <h2 class="nt-h2 pr__title" id="faq-title">${esc(t(S.title))}</h2>
        </header>
        <img class="faq__logo" src="${asset(data.logo.stickerPng)}" alt="" loading="lazy" decoding="async">
      </div>
      <div class="kiosk">
        <div class="kiosk__head" aria-hidden="true">
          <span class="kiosk__i">i</span>
          <span class="kiosk__t">${esc(ui.info)}</span>
          <span class="kiosk__hint">${esc(ui.kiosk)}</span>
        </div>
        <div class="kiosk__screen">
          ${data.faq
            .map(
              (f, i) => `<div class="qa">
                <h3 class="qa__h">
                  <button class="qa__btn" type="button" id="qa-b-${i}" aria-expanded="false" aria-controls="qa-a-${i}">
                    <span class="qa__n" aria-hidden="true">${pad2(i + 1)}</span>
                    <span class="qa__q">${esc(t(f.q))}</span>
                    <span class="qa__ico" aria-hidden="true">${icons.plus}</span>
                  </button>
                </h3>
                <div class="qa__a" id="qa-a-${i}" role="region" aria-labelledby="qa-b-${i}">
                  <div class="qa__ai"><p>${esc(t(f.a))}</p></div>
                </div>
              </div>`
            )
            .join('')}
        </div>
      </div>
    </div>`;

  splitWords(root.querySelector('.pr__title'));
  inview(root.querySelector('.pr__head'));
  inview(root.querySelector('.kiosk'), '0px 0px -10% 0px');

  const btns = [...root.querySelectorAll('.qa__btn')];
  const set = (open) =>
    btns.forEach((b) => {
      const on = b === open;
      b.setAttribute('aria-expanded', String(on));
      b.closest('.qa').classList.toggle('is-open', on);
      document.getElementById(b.getAttribute('aria-controls')).inert = !on;
    });
  btns.forEach((b) => b.addEventListener('click', () => set(b.getAttribute('aria-expanded') === 'true' ? null : b)));
  set(btns[0]);
}
