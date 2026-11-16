// Golden hour: bootstrap. One day on the road, from dawn in Riyadh to a starry night in Jubbah.

import { createScene, campHTML } from './scene.js';
import { createJourney, endD, campW } from './journey.js';
import { runLoader } from './loader.js';
import { initHero } from './hero.js';
import { renderIntro, renderClosing, initReveals } from './sections.js';
import { NIGHT } from './time.js';
import { mountNight } from './night.js';

const UI = {
  en: {
    stop: 'Stop',
    arrive: 'Arrive',
    drive: 'Drive',
    start: 'Start',
    pause: 'Pause film',
    play: 'Play film',
    scroll: 'Scroll',
    loader: 'Riyadh, before dawn',
    langLabel: 'Language',
  },
  ar: {
    stop: 'المحطة',
    arrive: 'الوصول',
    drive: 'القيادة',
    start: 'نقطة الانطلاق',
    pause: 'إيقاف الفيلم',
    play: 'تشغيل الفيلم',
    scroll: 'مرّر',
    loader: 'الرياض، قبيل الفجر',
    langLabel: 'اللغة',
  },
};

const html = document.documentElement;
const lang = html.lang === 'ar' ? 'ar' : 'en';
const ui = UI[lang];
const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const phoneMQ = window.matchMedia('(max-width: 767px)');
const mode = () => (rm ? 'rm' : phoneMQ.matches ? 'phone' : 'desk');
let currentMode = mode();
html.dataset.mode = currentMode;

const $ = (s) => document.querySelector(s);
const loaderEl = $('[data-loader]');
if (loaderEl) loaderEl.querySelector('[data-loader-label]').textContent = ui.loader;

// language switch
document.querySelectorAll('[data-lang]').forEach((nav) => {
  nav.setAttribute('aria-label', ui.langLabel);
  nav.innerHTML = [
    ['en', 'EN', '?lang=en'],
    ['ar', 'عربي', '?lang=ar'],
  ]
    .map(([k, label, href]) => `<a href="${href}" lang="${k}"${k === lang ? ' aria-current="true"' : ''}>${label}</a>`)
    .join('');
});

const contentP = fetch('../assets/content.json').then((r) => r.json());
let mediaResolve;
const mediaP = new Promise((r) => (mediaResolve = r));
const loading = html.classList.contains('is-loading') && loaderEl;
const loaderDone = loading
  ? runLoader(loaderEl, [contentP, document.fonts ? document.fonts.ready : null, mediaP].filter(Boolean))
  : Promise.resolve();
if (!loading && loaderEl) loaderEl.remove();

const content = await contentP;

renderIntro($('[data-intro]'), content, lang);
renderClosing($('[data-closing]'), content, lang);
mountNight($('[data-night]'), content, lang, rm);

let journey;
const hero = initHero({
  root: $('[data-hero]'),
  content,
  lang,
  ui,
  rm,
  phone: phoneMQ.matches,
  onCta: () => window.scrollTo({ top: journey.firstStopY(), behavior: rm ? 'auto' : 'smooth' }),
});
hero.media.then(mediaResolve);

const els = {
  journey: $('[data-journey]'),
  list: $('[data-stops]'),
  journeyTitle: $('[data-journey-title]'),
  closing: $('[data-closing]'),
  after: $('[data-night]'),
};

let scene = null;
function boot() {
  const m = currentMode;
  html.dataset.mode = m;
  const sceneEl = $('[data-scene]');
  if (m === 'rm') {
    // designed static version: pre-dawn behind the intro, camp night behind the closing
    scene = createScene(sceneEl, { static: true });
    scene.update({ t: 345, D: -0.4 });
    const night = createScene($('[data-scene-night]'), { static: true });
    const D_END = endD(content.stops.length);
    const camp = night.addSign({ w: campW(content.stops.length, phoneMQ.matches ? 0.5 : 0.66), cls: 'camp', html: campHTML() });
    night.update({ t: NIGHT, D: D_END });
    camp.el.style.visibility = 'visible';
    window.addEventListener('resize', () => {
      scene.resize();
      scene.update({ t: 345, D: -0.4 });
      night.resize();
      night.update({ t: NIGHT, D: D_END });
    });
  } else {
    scene = createScene(sceneEl, { phone: m === 'phone' });
  }
  journey = createJourney({ content, lang, ui, scene, mode: m, els });
  journey.start();
}
boot();
initReveals(document, rm);

let rt = 0;
window.addEventListener('resize', () => {
  clearTimeout(rt);
  rt = setTimeout(() => {
    const m = mode();
    if (m !== currentMode) {
      // phone and desktop build different layer stacks; rebuild cleanly
      window.location.reload();
      return;
    }
    if (journey) journey.relayout();
  }, 150);
});
// late font / image loads shift the stacked layout on phones
window.addEventListener('load', () => journey && journey.relayout());

await loaderDone;
hero.reveal();
