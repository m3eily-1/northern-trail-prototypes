// Kinetic Type direction: boot. Each section module is self-contained (one section = one file).
import { applyI18n, reduced } from './lib.js';
import { runLoader } from './loader.js';
import { initHero } from './hero.js';
import { initMarquee } from './marquee.js';
import { initIntro } from './intro.js';
import { initPillars } from './pillars.js';
import { initStops } from './stops.js';
import { initTakeover } from './takeover.js';
import { initClosing } from './closing.js';
import { initPractical } from './practical.js';

if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
if (reduced) document.documentElement.classList.add('is-reduced');

const loaderDone = runLoader();

(async () => {
  const data = await fetch('../assets/content.json').then((r) => r.json());
  applyI18n();

  const hero = initHero(data);
  const marquee = initMarquee(data);
  initIntro(data);
  initPillars(data);
  const takeover = initTakeover(data);
  const stops = initStops(data, { openStop: takeover.openStop });
  const practical = initPractical(data);
  const closing = initClosing(data);

  await document.fonts.ready;
  const fitAll = () => {
    hero.fitAll();
    marquee.measure();
    stops.fitNames();
    closing.fit();
    practical.refresh();
  };
  fitAll();
  stops.refresh();
  hero.setupScroll();
  if (window.ScrollTrigger) {
    ScrollTrigger.addEventListener('refresh', () => closing.measure());
    ScrollTrigger.refresh();
  }

  let lastW = window.innerWidth;
  let to = 0;
  window.addEventListener('resize', () => {
    clearTimeout(to);
    to = setTimeout(() => {
      if (window.innerWidth === lastW && window.ScrollTrigger) return ScrollTrigger.refresh();
      lastW = window.innerWidth;
      fitAll();
      stops.refresh();
      window.ScrollTrigger?.refresh();
    }, 150);
  });

  // reveal the hero once the loader has wiped (or immediately on repeat visits)
  if (document.documentElement.classList.contains('has-intro') && !reduced && !document.documentElement.classList.contains('intro-revealed')) {
    window.addEventListener('nt:intro-reveal', () => hero.reveal(), { once: true });
  } else {
    hero.reveal();
  }
  await loaderDone;
  window.ScrollTrigger?.refresh();
  document.documentElement.classList.add('is-ready');
})();
