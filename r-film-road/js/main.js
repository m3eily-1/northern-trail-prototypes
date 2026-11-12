// Direction R: Film and road. C's cinematic word becomes the loading intro, the film is the hero,
// then C's stop reel with a car on N's dotted road, webook-style tours and stays,
// G's "Before you go" and FAQs, and the closing. Each section owns its DOM and its triggers.
import { LABELS } from './labels.js?v=24';
import { createIntro } from './intro.js?v=24';
import { initHero } from './hero.js?v=24';
import { initAbout } from './about.js?v=24';
import { initStops } from './stops.js?v=24';
import { initPostcards } from './postcards.js?v=24';
import { initBook } from './book.js?v=24';
import { initPractical } from './practical.js?v=24';
import { initClosing } from './closing.js?v=24';
import { initGrain } from './fx.js?v=24';
import { initWebook } from './webook.js?v=24';
import { initTrip } from './trip.js?v=24';
import { initBundles } from './bundles.js?v=24';

const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const root = document.getElementById('ntc');
const lang = html.lang === 'ar' ? 'ar' : 'en';
const rtl = lang === 'ar';
const reduced = html.classList.contains('is-reduced-motion');
const isPhone = matchMedia('(max-width: 767px)').matches;

initWebook(lang);
const L = LABELS[lang];
root.querySelectorAll('[data-l]').forEach((el) => {
  el.textContent = L[el.dataset.l] ?? '';
});
if (reduced) root.classList.add('is-reduced');

async function boot() {
  const data = await fetch('../assets/content.json').then((r) => r.json());
  const t = (o) => (o && typeof o === 'object' ? o[lang] ?? o.en : o);
  const asset = (p) => (p ? `../${p}` : '');
  const ctx = { gsap, ScrollTrigger, data, lang, rtl, t, L, asset, reduced, isPhone };
  ctx.trip = initTrip(ctx);

  const intro = createIntro(root, ctx);
  const fontsP = Promise.all([
    document.fonts.load('700 100px nt-bukra', rtl ? 'الشمال' : 'NORTH'),
    document.fonts.load('400 16px nt-plex', rtl ? 'مسار' : 'Trail'),
    document.fonts.load('600 16px nt-plex', rtl ? 'مسار' : 'Trail'),
  ]).catch(() => {});
  intro.track(fontsP, 1);

  const hero = initHero(root.querySelector('.r-hero'), ctx);
  intro.watch?.(hero.video);
  intro.track(hero.ready, 3);
  await fontsP;
  intro.fontsReady?.();

  initAbout(root.querySelector('#about'), ctx);
  initStops(root.querySelector('.ntc-stops'), ctx);
  initPostcards(root.querySelector('#tours'), ctx);
  initBook(root.querySelector('#stays'), ctx);
  initBundles(root.querySelector('#bundles'), ctx);
  initPractical(root.querySelector('#tips'), root.querySelector('#faq'), ctx);
  initClosing(root.querySelector('.ntc-closing'), ctx);
  initGrain(root.querySelector('.ntc-grain'));

  window.scrollTo(0, 0);
  ScrollTrigger.refresh();
  if (intro.active) await intro.finish(() => hero.open());
  else hero.open();
  ScrollTrigger.refresh();

  window.__r = { ScrollTrigger };
}

boot().catch((err) => {
  console.error(err);
  html.classList.remove('is-loading');
});
