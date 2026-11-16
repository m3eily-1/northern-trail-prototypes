// Field Journal direction: entry point. Each section is its own module so it
// can be ported one section per greylabel file.
import { lang } from './i18n.js';
import { initLoader } from './loader.js';
import { initHero } from './hero.js';
import { initIntro } from './intro.js';
import { initJournal } from './journal.js';
import { initClosing } from './closing.js';
import { initPractical } from './practical.js';
import { refresh } from './scroll.js';

function langSwitch() {
  document.querySelectorAll('.lang__btn').forEach((a) => {
    const p = new URLSearchParams(location.search);
    p.set('lang', a.dataset.lang);
    a.href = `?${p.toString()}`;
    if (a.dataset.lang === lang) a.setAttribute('aria-current', 'true');
  });
}

async function boot() {
  langSwitch();
  const res = await fetch('../assets/content.json');
  const data = await res.json();
  initLoader(data, () => {});
  initHero(data);
  initIntro(data);
  initJournal(data);
  initPractical(data);
  initClosing(data);
  refresh();
  // Fonts and images shift layout: re-measure once they settle.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
  setTimeout(refresh, 1200);
}

boot().catch((e) => console.error(e));
