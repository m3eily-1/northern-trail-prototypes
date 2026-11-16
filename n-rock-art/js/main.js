// Rock Art direction: entry point. Each section is its own module so it can be
// ported one section per greylabel file; shared systems are rock (texture),
// peck/carve (petroglyphs), torch (light) and reveal (chisel reveals).
import { lang } from './i18n.js';
import { initRock } from './rock.js';
import { initTorch, remeasure } from './torch.js';
import { initCarvings } from './carve.js';
import { reveal } from './reveal.js';
import { initLoader } from './loader.js';
import { initHero } from './hero.js';
import { initIntro, initPillars } from './intro.js';
import { initRoute } from './route.js';
import { initTours } from './tours.js';
import { initStays } from './stays.js';
import { initTips } from './tips.js';
import { initFaq } from './faq.js';
import { initClosing } from './closing.js';

function langSwitch() {
  document.querySelectorAll('.lang__btn').forEach((a) => {
    const p = new URLSearchParams(location.search);
    p.set('lang', a.dataset.lang);
    a.href = `?${p.toString()}`;
    if (a.dataset.lang === lang) a.setAttribute('aria-current', 'true');
  });
}

async function boot() {
  initRock();
  langSwitch();
  const content = fetch('../assets/content.json').then((r) => r.json());
  const fonts = document.fonts ? document.fonts.load('700 40px nt-bukra').catch(() => {}) : Promise.resolve();
  const loader = initLoader(Promise.all([content, fonts]));
  const data = await content;

  const hero = initHero(data);
  initIntro(data);
  initPillars(data);
  const route = initRoute(data);
  initTours(data);
  initStays(data);
  initTips(data);
  initFaq(data);
  initClosing(data);

  initTorch();

  await loader;
  initCarvings();
  hero.start();
  reveal();

  const settle = () => {
    route.equalize();
    route.groove.build();
    remeasure();
  };
  if (document.fonts) document.fonts.ready.then(settle);
  addEventListener('load', settle);
}

boot().catch((e) => console.error(e));
