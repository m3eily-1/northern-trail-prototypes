// Entry: load copy, build sections (each self-contained for later porting), wire motion.
import { loadContent, LANG, RM } from './core.js';
import { runLoader } from './loader.js';
import { createHero } from './hero.js';
import { createIntro } from './intro.js';
import { createDioramas } from './dioramas.js';
import { createSheet } from './sheet.js';
import { createClosing } from './closing.js';
import { createPractical } from './practical.js';

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.querySelectorAll('.lang__btn').forEach((a) => {
  if (a.dataset.lang === LANG) a.setAttribute('aria-current', 'true');
});

const app = document.getElementById('app');

const rendered = loadContent().then((data) => {
  const sheet = createSheet(data);
  const hero = createHero(data);
  const intro = createIntro(data);
  const dz = createDioramas(data, sheet);
  const practical = createPractical(data);
  const closing = createClosing(data);
  app.append(hero.el, intro.el, dz.el, ...practical.els, closing.el);
  app.removeAttribute('aria-busy');

  hero.prepare(gsap);
  // order matters: pins are created top to bottom
  hero.scroll(gsap);
  intro.scroll(gsap);
  dz.scroll(gsap, ScrollTrigger);
  practical.scroll(gsap, ScrollTrigger);
  closing.scroll(gsap);

  const refresh = () => ScrollTrigger.refresh();
  document.fonts && document.fonts.ready.then(refresh);
  window.addEventListener('load', refresh, { once: true });

  // debugging/verification handle (read-only state)
  window.__nt = { gsap, ScrollTrigger, dz, sheet };
  return { data, hero };
});

runLoader(gsap, rendered)
  .then(({ hero }) => {
    hero.intro(gsap);
  })
  .catch((err) => {
    console.error(err);
    document.documentElement.classList.remove('is-loading');
    app.textContent = 'Content failed to load.';
  });

if (RM) document.documentElement.classList.remove('is-loading');
