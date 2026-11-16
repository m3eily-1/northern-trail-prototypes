// Star navigation direction: entry point. Each section is its own module so it
// can be ported one section per greylabel file.
import { initLoader } from './loader.js';
import { initHero } from './hero.js';
import { initIntro } from './intro.js';
import { initPillars } from './pillars.js';
import { initChart } from './chart.js';
import { initTours } from './tours.js';
import { initStays } from './stays.js';
import { initTips } from './tips.js';
import { initFaq } from './faq.js';
import { initClosing } from './closing.js';
import { starTile } from './sky.js';

function langSwitch() {
  const cur = document.documentElement.lang;
  document.querySelectorAll('.lang__btn').forEach((a) => {
    const p = new URLSearchParams(location.search);
    p.set('lang', a.dataset.lang);
    a.href = `?${p.toString()}`;
    if (a.dataset.lang === cur) a.setAttribute('aria-current', 'true');
  });
}

async function boot() {
  langSwitch();
  document.getElementById('app').style.setProperty('--m-tile', `url(${starTile()})`);
  const res = await fetch('../assets/content.json');
  const data = await res.json();
  initHero(data);
  initIntro(data);
  initPillars(data);
  initChart(data);
  initTours(data);
  initStays(data);
  initTips(data);
  initFaq(data);
  initClosing(data);
  await initLoader(data);
}

boot().catch((e) => console.error(e));
