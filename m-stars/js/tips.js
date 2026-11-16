// Visitor tips as the navigator's notes: a ruled logbook, one line per note,
// with fine line instruments for icons.
import { t, esc, ui } from './i18n.js';
import { reveal, splitWords, starGlyph } from './util.js';

const ICONS = {
  plane: '<path d="M4 21l24-10M14 16l4 11 3-1-2-12M15 15l-4-10 3-1 7 8M8 19l-3-5 3-.5 3 4"/>',
  temperature: '<path d="M13 20V6a3 3 0 0 1 6 0v14"/><circle cx="16" cy="24" r="4.5"/><path d="M16 22V11M22 9h4M22 13h3M22 17h4"/>',
  route: '<circle cx="7" cy="25" r="2.5"/><path d="M9 23c4-3 3-8 8-9s6-4 7-8"/><path d="M24 3v8M24 3l5 2-5 2"/>',
  clock: '<circle cx="16" cy="16" r="11"/><path d="M16 9v7l5 3M16 3v2M29 16h-2"/>',
  fuel: '<path d="M7 28V6h12v22M10 9h6v6h-6zM5 28h16M19 12h3l3 3v10a2 2 0 0 0 4 0V12l-3-4"/>'
};

export function initTips(data) {
  const root = document.getElementById('tips');
  const S = data.sections.tips;
  root.innerHTML = `
    <div class="nt-wrap">
      <header class="px__head">
        <p class="m-eyebrow" data-r>${starGlyph()}<span>${esc(ui.notes)}</span></p>
        <h2 class="m-h2 m-split" id="tips-title">${esc(t(S.title))}</h2>
      </header>
      <ol class="log">
        ${data.tips
          .map(
            (x, i) => `<li class="log__row" style="--k:${i}">
              <span class="log__n">${esc(ui.noteN(i + 1))}</span>
              <span class="log__ico" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false">${ICONS[x.icon] || ICONS.route}</svg></span>
              <h3 class="log__title">${esc(t(x.title))}</h3>
              <p class="log__text">${esc(t(x.text))}</p>
            </li>`
          )
          .join('')}
      </ol>
    </div>`;
  const h2 = root.querySelector('h2');
  splitWords(h2);
  reveal(h2);
  root.querySelectorAll('[data-r], .log__row').forEach((el) => reveal(el));
}
