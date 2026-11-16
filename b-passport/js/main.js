// Northern Trail, direction B: Sticker Passport.
// Each section is its own module (mount function) so it can be ported to one greylabel section each.
import { T } from './i18n.js';
import { runCover } from './cover.js';
import { buildInkDefs } from './stamp.js';
import { mountHero } from './hero.js';
import { mountIntro } from './intro.js';
import { mountPassport } from './passport.js';
import { mountClosing } from './closing.js';
import { mountPractical } from './practical.js';

const lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coverDone = runCover();

const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(r, ms))]);

async function boot() {
  const C = await fetch('../assets/content.json').then((r) => r.json());
  await withTimeout(Promise.all([
    document.fonts.load('700 16px nt-bukra'),
    document.fonts.load('700 16px nt-bukra', 'جواز'),
    document.fonts.load('400 16px nt-plex'),
  ]), 2500);

  buildInkDefs();
  const ctx = { C, lang, t: T[lang], reduced, rtl: lang === 'ar', asset: (p) => `../${p}` };
  const q = (s) => document.querySelector(`[data-section="${s}"]`);

  const hero = mountHero(q('hero'), ctx);
  mountIntro(q('intro'), ctx);
  const passport = mountPassport(q('stops'), ctx);
  mountPractical(q('practical'), ctx);
  const closing = mountClosing(q('closing'), ctx);

  // Generic reveal for [data-reveal] blocks
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

  coverDone.then(() => hero.intro());

  window.__ntp = { passport, closing, ctx };
  document.documentElement.classList.add('is-ready');
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.remove('has-cover');
});
