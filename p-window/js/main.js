// Window seat direction: entry point. Each section is its own module so it can
// be ported as one greylabel section file each.
import { lang } from './util.js';
import { initLoader } from './loader.js';
import { initHero } from './hero.js';
import { initIntro } from './intro.js';
import { initDrive } from './drive.js';
import { initStack } from './stack.js';
import { initTours } from './tours.js';
import { initStays } from './stays.js';
import { initTips } from './tips.js';
import { initFaq } from './faq.js';
import { initClosing } from './closing.js';

function langSwitch() {
  document.querySelectorAll('.lang__btn').forEach((a) => {
    const p = new URLSearchParams(location.search);
    p.set('lang', a.dataset.lang);
    p.delete('intro');
    a.href = `?${p.toString()}`;
    if (a.dataset.lang === lang) a.setAttribute('aria-current', 'true');
  });
}

async function boot() {
  langSwitch();
  const res = await fetch('../assets/content.json');
  const data = await res.json();
  document.title = lang === 'ar' ? 'مسار الشمال، مقعد النافذة' : 'Northern Trail Window Seat';

  const hero = initHero(data);
  initIntro(data);
  const stack = initStack(data);
  initDrive(data, stack);
  initTours(data);
  initStays(data);
  initTips(data);
  initFaq(data);
  initClosing(data);

  initLoader(data, () => hero.start());

  const refresh = () => window.dispatchEvent(new Event('p:refresh'));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh);
  setTimeout(refresh, 1200);

  // Deep links (#tours etc.) land after the page has been built.
  if (location.hash) {
    const el = document.querySelector(location.hash);
    if (el) requestAnimationFrame(() => el.scrollIntoView());
  }
}

boot().catch((e) => console.error(e));
