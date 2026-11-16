// Rest stop, part 3: visitor tips as a road-trip checklist you can tick off.
import { t, esc, asset, ui, splitWords, inview, pad2 } from './util.js';

const ICON = {
  plane: '<path d="M3 14l18-7-6 15-3-6-9-2z"/><path d="M12 16l3-6"/>',
  temperature: '<path d="M10 4h4v10.5a4 4 0 1 1-4 0z"/><path d="M12 9v7"/><path d="M17 6h3M17 10h2"/>',
  route: '<path d="M5 19c4 0 3-6 7-6s3-6 7-6"/><path d="M5 17v4M19 3v6"/><path d="M19 3h-3l1.5 2L16 7h3"/>',
  clock: '<path d="M4 4h16v16H4z"/><path d="M12 8v4l3 2"/>',
  fuel: '<path d="M5 21V4h9v17M3 21h13"/><path d="M8 8h3v3H8z"/><path d="M14 9h3l2 2v7a1.5 1.5 0 0 1-3 0v-3h-2"/>'
};

export function initTips(data) {
  const root = document.getElementById('tips');
  const S = data.sections.tips;
  const tips = data.tips;
  const sticker = data.stickers.hail;

  root.innerHTML = `
    <div class="nt-wrap tips">
      <div class="tips__start">
        <header class="pr__head">
          <p class="nt-eyebrow pr__eyebrow">${esc(ui.checklist)}</p>
          <h2 class="nt-h2 pr__title" id="tips-title">${esc(t(S.title))}</h2>
        </header>
        <div class="gaugebar" aria-live="polite">
          <span class="gaugebar__segs" aria-hidden="true">${tips.map(() => '<i></i>').join('')}</span>
          <span class="gaugebar__t"></span>
        </div>
        <img class="tips__sticker" src="${asset(sticker)}" alt="" loading="lazy" decoding="async">
      </div>
      <div class="clip">
        <i class="clip__bar" aria-hidden="true"></i>
        <ol class="ck-list">${tips
          .map(
            (x, i) => `<li class="ck" style="--i:${i}">
              <button class="ck__box" type="button" role="checkbox" aria-checked="false" aria-labelledby="tip-${i}">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>
              </button>
              <div class="ck__txt">
                <p class="ck__n" aria-hidden="true">${pad2(i + 1)}<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[x.icon] || ICON.route}</svg></p>
                <h3 class="ck__title" id="tip-${i}">${esc(t(x.title))}</h3>
                <p class="ck__text">${esc(t(x.text))}</p>
              </div>
            </li>`
          )
          .join('')}</ol>
      </div>
    </div>`;

  splitWords(root.querySelector('.pr__title'));
  inview(root.querySelector('.pr__head'));
  inview(root.querySelector('.clip'), '0px 0px -10% 0px');

  const boxes = [...root.querySelectorAll('.ck__box')];
  const segs = [...root.querySelectorAll('.gaugebar__segs i')];
  const label = root.querySelector('.gaugebar__t');
  const sync = () => {
    const n = boxes.filter((b) => b.getAttribute('aria-checked') === 'true').length;
    segs.forEach((s, i) => s.classList.toggle('is-on', i < n));
    label.textContent = n === boxes.length ? ui.allReady : ui.ready(n, boxes.length);
    root.querySelector('.tips').classList.toggle('is-done', n === boxes.length);
  };
  const toggle = (b) => {
    const on = b.getAttribute('aria-checked') !== 'true';
    b.setAttribute('aria-checked', String(on));
    b.closest('.ck').classList.toggle('is-checked', on);
    sync();
  };
  boxes.forEach((b) => b.addEventListener('click', () => toggle(b)));
  // The whole row is a big target too (text stays selectable on drag).
  root.querySelectorAll('.ck__txt').forEach((el) =>
    el.addEventListener('click', () => {
      if (String(window.getSelection && window.getSelection()).length) return;
      toggle(el.parentElement.querySelector('.ck__box'));
    })
  );
  sync();
}
