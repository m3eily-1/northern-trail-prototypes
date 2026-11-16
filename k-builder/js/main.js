// Entry: fetch content, mount each section module, then play the deck loader.
import { initDeck } from './loader.js';
import { initHero } from './hero.js';
import { initIntro } from './intro.js';
import { initPlanner } from './planner.js';
import { initSheet } from './sheet.js';
import { initShare } from './share.js';
import { initClosing } from './closing.js';
import { createExtras } from './extras.js';
import { initPractical } from './practical.js';

async function boot() {
  let data;
  try {
    data = await (await fetch('../assets/content.json')).json();
  } catch (err) {
    document.documentElement.classList.remove('has-deck');
    console.error('Northern Trail: content failed to load', err);
    return;
  }

  const hero = initHero(document.getElementById('hero'), data);
  initIntro(document.getElementById('intro'), data);

  // Planner, sheet and share overlay talk through a tiny bridge rather than globals.
  const bridge = {};
  const planner = initPlanner(document.getElementById('plan'), data, bridge);
  const sheet = initSheet(data, planner);
  const share = initShare(data, planner);
  bridge.openSheet = sheet.open;
  bridge.openShare = share.open;
  const extras = createExtras(data, planner, bridge);
  planner.extrasForDay = bridge.extrasForDay;
  initPractical(data, planner, extras);

  initClosing(document.getElementById('closing'), data);

  await initDeck(document.querySelector('.k-deck'), data);
  hero.start();
}

boot();
