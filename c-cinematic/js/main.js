// Direction C: Cinematic. Entry point: builds a shared context, then initialises each section
// module. Every section owns its DOM root and its ScrollTriggers (no cross-section globals).
import { LABELS } from './labels.js';
import { createLoader } from './loader.js';
import { initHero } from './hero.js';
import { initIntro } from './intro.js';
import { initChapters } from './chapters.js';
import { initStops } from './stops.js';
import { initClosing } from './closing.js';
import { initPractical } from './practical.js';
import { initGrain, initCursor, initMagnetic } from './fx.js';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const root = document.getElementById('ntc');
const lang = html.lang === 'ar' ? 'ar' : 'en';
const rtl = lang === 'ar';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPhone = matchMedia('(max-width: 767px)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

const L = LABELS[lang];
root.querySelectorAll('[data-l]').forEach((el) => {
  el.textContent = L[el.dataset.l] ?? '';
});
root.querySelectorAll('.ntc-lang a').forEach((a) => {
  if (a.lang === lang) a.setAttribute('aria-current', 'true');
});
if (reduced) root.classList.add('is-reduced');

const loader = createLoader(root, { lang, reduced, gsap });

async function boot() {
  const dataP = fetch('../assets/content.json').then((r) => r.json());
  loader.track(dataP, 1);
  const fontsP = Promise.all([
    document.fonts.load('700 100px nt-bukra', rtl ? 'الشمال' : 'NORTH'),
    document.fonts.load('400 16px nt-plex', rtl ? 'مسار' : 'Trail'),
    document.fonts.load('600 16px nt-plex', rtl ? 'مسار' : 'Trail'),
  ]).catch(() => {});
  loader.track(fontsP, 1);

  const data = await dataP;
  await fontsP;

  const t = (o) => (o && typeof o === 'object' ? o[lang] ?? o.en : o);
  const asset = (p) => (p ? `../${p}` : '');
  const ctx = { gsap, ScrollTrigger, data, lang, rtl, t, L, asset, reduced, isPhone, fine };

  const hero = initHero(root.querySelector('.ntc-hero'), ctx);
  loader.track(hero.ready, 3);
  initIntro(root.querySelector('.ntc-intro'), ctx);
  const chapters = initChapters(root.querySelector('.ntc-chapters'), ctx);
  loader.track(chapters.ready, 1);
  initStops(root.querySelector('.ntc-stops'), ctx);
  initPractical(root.querySelector('.ntc-info'), ctx);
  initClosing(root.querySelector('.ntc-closing'), ctx);

  initGrain(root.querySelector('.ntc-grain'), ctx);
  if (fine && !reduced && !isPhone) {
    initCursor(root, ctx);
    initMagnetic(root, ctx);
  }

  await loader.finish();
  window.scrollTo(0, 0);
  ScrollTrigger.refresh();
  hero.intro();

  // Expose read-only state for verification tooling.
  window.__ntc = { hero, ScrollTrigger };
}

boot().catch((err) => {
  console.error(err);
  html.classList.remove('is-loading');
});
