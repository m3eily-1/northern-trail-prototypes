// Desert Wind direction: entry point. Each section is its own module so it can
// be ported one section per greylabel file; the sand engine (wind, particles,
// covers) is shared.
import { lang, reduced, ui, isPhone, finePointer } from './i18n.js';
import { initParticles } from './particles.js';
import { initHero } from './hero.js';
import { initIntro, initPillars } from './intro.js';
import { initStops } from './stops.js';
import { initPractical } from './practical.js';
import { initClosing } from './closing.js';
import { initDunes } from './dunes.js';
import { initGauge, initGrain } from './chrome.js';

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
  initGrain();
  initParticles();
  const data = await (await fetch('../assets/content.json')).json();
  initHero(data);
  // headlines are sampled from real glyphs: wait for the brand fonts
  if (document.fonts) {
    await Promise.race([
      Promise.all([document.fonts.load('700 48px nt-bukra'), document.fonts.load('400 16px nt-plex'), document.fonts.ready]),
      new Promise((r) => setTimeout(r, 2500))
    ]);
  }
  initIntro(data);
  initPillars(data);
  initStops(data);
  initPractical(data);
  initClosing(data);
  initDunes();
  if (!reduced && finePointer && !isPhone()) initGauge(ui);
}

boot().catch((e) => console.error(e));
