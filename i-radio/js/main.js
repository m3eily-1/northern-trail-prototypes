// Entry: loader first (static chrome, no data needed), then content-driven sections.
import { observeReveals } from './util.js';
import { runLoader } from './loader.js';
import { mountHero } from './hero.js';
import { mountIntro, mountTapes } from './intro.js';
import { mountRadio } from './radio.js';
import { mountClosing } from './closing.js';
import { mountPractical } from './practical.js';

const ready = runLoader();

fetch('../assets/content.json')
  .then((r) => r.json())
  .then((data) => {
    const app = document.getElementById('app');
    mountHero(document.getElementById('hero'), data, ready);
    mountIntro(document.getElementById('intro'), data);
    mountTapes(document.getElementById('tapes'), data);
    const radio = mountRadio(document.getElementById('radio'), data);
    mountPractical(data);
    mountClosing(document.getElementById('closing'), data, radio);
    observeReveals(app);
    app.classList.add('is-mounted');
  })
  .catch((err) => {
    console.error('Northern Trail content failed to load', err);
  });
