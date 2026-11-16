// Intro (stats + pillars) and closing, rendered from content.json, plus reveal observer.

export function renderIntro(root, content, lang) {
  const it = content.intro;
  root.querySelector('[data-intro-title]').textContent = it.title[lang];
  root.querySelector('[data-intro-body]').textContent = it.body[lang];
  root.querySelector('[data-stats]').innerHTML = it.stats
    .map(
      (s, i) => `<li class="stat" data-reveal style="transition-delay:${i * 80}ms">
        <p class="stat__value"><span class="stat__num" data-count="${s.value}">${s.value}</span>${s.unit ? `<span class="stat__unit">${s.unit[lang]}</span>` : ''}</p>
        <p class="stat__label">${s.label[lang]}</p>
      </li>`
    )
    .join('');
  root.querySelector('[data-pillars]').innerHTML = content.pillars
    .map(
      (p, i) => `<li class="pillar" data-reveal style="--pc:${p.color};transition-delay:${i * 100}ms">
        <span class="pillar__band"></span>
        <span class="pillar__idx">${String(i + 1).padStart(2, '0')}</span>
        <img class="pillar__art" src="../${p.art}" alt="" loading="lazy" decoding="async">
        <h3 class="pillar__name">${p.name[lang]}</h3>
        <p class="pillar__line">${p.line[lang]}</p>
      </li>`
    )
    .join('');
}

export function renderClosing(root, content, lang) {
  root.querySelector('[data-tagline]').textContent = content.hero.tagline;
  root.querySelector('[data-closing-line]').textContent = content.closing.line[lang];
  const logo = root.querySelector('[data-logo]');
  logo.src = '../' + content.logo.cream;
}

function countUp(node) {
  const raw = node.dataset.count;
  const target = parseFloat(raw.replace(/,/g, ''));
  const dec = (raw.split('.')[1] || '').length;
  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const t0 = performance.now();
  const dur = 1400;
  node.style.minWidth = node.offsetWidth + 'px';
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 4);
    node.textContent = fmt(target * e);
    if (k < 1) requestAnimationFrame(step);
    else node.textContent = raw;
  };
  requestAnimationFrame(step);
}

export function initReveals(scope, rm) {
  const items = [...scope.querySelectorAll('[data-reveal]')];
  if (rm || !('IntersectionObserver' in window)) {
    items.forEach((n) => n.classList.add('is-revealed'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-revealed');
        const c = e.target.querySelector('[data-count]');
        if (c) countUp(c);
        io.unobserve(e.target);
      });
    },
    { rootMargin: '0px 0px -12% 0px' }
  );
  items.forEach((n) => io.observe(n));
}
