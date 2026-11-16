// Entry: fetch content, mount each section module, then run the postmark loading moment.
import { reduced } from './util.js';
import { runLoader } from './loader.js';
import { mountHero } from './hero.js';
import { mountIntro } from './intro.js';
import { mountDeck } from './deck.js';
import { mountClosing } from './closing.js';
import { mountPost } from './post.js';

async function boot() {
  if (window.gsap && window.ScrollTrigger) window.gsap.registerPlugin(window.ScrollTrigger);
  const data = await fetch('../assets/content.json').then((r) => r.json());

  const hero = mountHero(document.getElementById('hero'), data);
  hero.prime();
  mountIntro(document.getElementById('intro'), data);
  const deck = mountDeck(document.getElementById('stops'), data);
  mountPost(document.getElementById('post'), data);
  mountClosing(document.getElementById('closing'), data);

  await runLoader(data);
  hero.intro();
  if (!reduced && window.ScrollTrigger) {
    window.ScrollTrigger.refresh();
    document.fonts.ready.then(() => window.ScrollTrigger.refresh());
  }
  window.__deck = deck; // verification hook only
}

boot().catch((err) => {
  console.error(err);
  document.documentElement.classList.remove('has-pm');
  document.querySelector('.pm')?.remove();
});
