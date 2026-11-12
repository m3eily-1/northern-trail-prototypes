// "What is the Northern Trail?": direction F's layout (title beside the body, four stats in a
// ruled row) with direction H's pillars (pop-up paper cards in the pillar colours; the
// illustration stands up out of the top edge). Cards flip up from their base as they arrive.
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// darken a hex colour (keeps cream text at AA on the lavender pillar)
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k).toString(16).padStart(2, '0')).join('');
}

export function initAbout(root, ctx) {
  const { gsap, data, t, asset, reduced } = ctx;
  const it = data.intro;
  root.innerHTML = `
    <div class="nt-wrap">
      <header class="ab__top">
        <h2 class="ab__title" id="ab-title">${esc(t(it.title))}</h2>
        <p class="ab__body">${esc(t(it.body))}</p>
      </header>
      <ul class="ab__stats">
        ${it.stats
          .map(
            (s) => `
          <li class="ab-stat">
            <p class="ab-stat__value"><span class="ab-stat__num">${esc(s.value)}</span>${s.unit ? `<span class="ab-stat__unit">${esc(t(s.unit))}</span>` : ''}</p>
            <p class="ab-stat__label">${esc(t(s.label))}</p>
          </li>`
          )
          .join('')}
      </ul>
      <ul class="ab__pillars">
        ${data.pillars
          .map(
            (p) => `
          <li class="ab-pop">
            <div class="ab-pillar" style="--pc:${p.key === 'desert' ? shade(p.color, 0.72) : p.color}">
              <div class="ab-pillar__art"><img src="${asset(p.art)}" alt="" loading="lazy" decoding="async"><span class="ab-pillar__stand"></span></div>
              <h3 class="ab-pillar__name">${esc(t(p.name))}</h3>
              <p class="ab-pillar__line">${esc(t(p.line))}</p>
            </div>
          </li>`
          )
          .join('')}
      </ul>
    </div>`;

  if (reduced) return;
  const head = root.querySelector('.ab__top');
  gsap.from(head.children, {
    autoAlpha: 0,
    y: 24,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.12,
    scrollTrigger: { trigger: head, start: 'top 80%', once: true },
  });
  const stats = root.querySelectorAll('.ab-stat');
  gsap.from(stats, {
    autoAlpha: 0,
    y: 24,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: { trigger: root.querySelector('.ab__stats'), start: 'top 85%', once: true },
  });

  const list = root.querySelector('.ab__pillars');
  const faces = list.querySelectorAll('.ab-pillar');
  const arts = list.querySelectorAll('.ab-pillar__art');
  gsap.set(faces, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
  gsap.set(arts, { rotationX: 90, autoAlpha: 0, transformOrigin: '50% 100%' });
  gsap
    .timeline({ scrollTrigger: { trigger: list, start: 'top 82%', once: true } })
    .to(faces, { autoAlpha: 1, duration: 0.1, stagger: 0.12 }, 0)
    .to(faces, { rotationX: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: 0.12 }, 0)
    .to(arts, { autoAlpha: 1, duration: 0.1, stagger: 0.12 }, 0.45)
    .to(arts, { rotationX: 0, duration: 0.8, ease: 'back.out(2.4)', stagger: 0.12 }, 0.45);
}
