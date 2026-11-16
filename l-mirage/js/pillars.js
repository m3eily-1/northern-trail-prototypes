// Three pillars as a pinned triptych (CSS sticky). Scroll progress opens each panel in turn;
// the GL layer paints a displaced colour field into each [data-gl-field].
import { env, t, asset, clamp, tick } from './util.js';

export function renderPillars(section, data) {
  section.innerHTML = `
    <div class="pillars__stage">
      <div class="nt-wrap pillars__grid">
        ${data.pillars.map((p, i) => `
          <article class="pillar" style="--c:${p.color}" data-pillar="${i}">
            <div class="pillar__field" data-gl-field data-color="${p.color}"></div>
            <img class="pillar__art" src="${asset(p.art)}" alt="" loading="lazy">
            <div class="pillar__text">
              <p class="pillar__n">0${i + 1} / 0${data.pillars.length}</p>
              <h2 class="pillar__name">${t(p.name)}</h2>
              <p class="pillar__line">${t(p.line)}</p>
            </div>
          </article>`).join('')}
      </div>
    </div>`;

  const panels = Array.from(section.querySelectorAll('.pillar'));
  const fields = panels.map((p) => p.querySelector('[data-gl-field]'));
  const setAll = (fn) => panels.forEach((p, i) => {
    const r = fn(i);
    p.style.setProperty('--r', r.toFixed(3));
    p.classList.toggle('is-open', r > 0.6);
    fields[i]._reveal = r;
  });

  if (env.reduced) { setAll(() => 1); return; }

  let queued = false;
  const update = () => {
    queued = false;
    const rect = section.getBoundingClientRect();
    const stage = section.firstElementChild.getBoundingClientRect();
    const travel = Math.max(1, rect.height - stage.height);
    const p = clamp((64 - rect.top) / travel);
    // Panel i opens over its own slice of the pinned scroll.
    setAll((i) => {
      const r = clamp((p - i * 0.24) / 0.3);
      return 1 - Math.pow(1 - r, 3);
    });
  };
  const onScroll = () => { if (!queued) { queued = true; tick(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
