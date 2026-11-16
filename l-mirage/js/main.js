// Boot: loader, content, sections, then the shared WebGL layer (skipped for reduced motion / no WebGL).
import { env, asset } from './util.js';
import { createLoader } from './loader.js';
import { renderHero } from './hero.js';
import { renderIntro } from './intro.js';
import { renderStops } from './stops.js';
import { renderPillars } from './pillars.js';
import { renderClosing } from './closing.js';
import { renderPractical } from './practical.js';
import { createStage } from './gl/stage.js';

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const root = document.documentElement;

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

function imgReady(src) {
  return new Promise((res) => {
    const i = new Image();
    i.onload = i.onerror = () => res();
    i.src = src;
  });
}

async function boot() {
  const loader = createLoader();
  const parts = { content: 0, fonts: 0, gl: 0, media: 0 };
  const weights = { content: 0.2, fonts: 0.15, gl: 0.35, media: 0.3 };
  const report = () => loader.progress(Object.keys(parts).reduce((a, k) => a + parts[k] * weights[k], 0));

  const data = await fetch('../assets/content.json').then((r) => r.json());
  parts.content = 1; report();

  const $ = (s) => document.querySelector(s);
  const hero = renderHero($('[data-section="hero"]'), data);
  renderIntro($('[data-section="intro"]'), data);
  renderStops($('[data-section="stops"]'), data, $('[data-prog]'));
  renderPillars($('[data-section="pillars"]'), data);
  renderPractical(data);
  renderClosing($('[data-section="closing"]'), data);

  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { parts.fonts = 1; report(); });

  const media = [imgReady(asset(data.film.poster)), ...data.stops.slice(0, 3).map((s) => imgReady(asset(s.photo)))];
  let mediaDone = 0;
  media.forEach((p) => p.then(() => { mediaDone++; parts.media = mediaDone / media.length; report(); }));

  let stage = null;
  let introDone = false;
  loader.done.then(() => { introDone = true; hero.intro(); stage && stage.heroIntro(); });

  if (!env.reduced) {
    try {
      const THREE = await withTimeout(import(THREE_URL), 8000);
      const canvas = $('[data-gl]');
      stage = createStage({
        THREE, canvas, hero,
        onLost: () => { root.classList.remove('has-gl'); root.classList.add('no-gl'); },
      });
    } catch (e) {
      console.warn('[mirage] WebGL layer unavailable, using plain media.', e.message);
    }
  }
  parts.gl = 1; report();
  root.classList.add(stage ? 'has-gl' : 'no-gl');
  if (stage && introDone) stage.heroIntro();
}

boot().then(() => {}, (e) => {
  console.error(e);
  root.classList.remove('is-loading');
  root.classList.add('no-gl');
});
