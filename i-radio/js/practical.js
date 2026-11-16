// Practical sections on the trip radio: a tuner (region presets + a frequency band of stops)
// filters tours shown as a tracklist; stays as station cards with an indicator lamp; tips as
// traffic bulletins on display glass; FAQ as a tracklist that "plays" the open answer.
import { t, esc, asset, lang, isRTL, isReduced, pad2, icons, regionShort } from './util.js';
import { createSeg } from './seg.js';

const REGION_COLOR = { riyadh: '#c88c3c', qassim: '#8f9a5a', hail: '#a06eb4' };
const S = {
  en: {
    all: 'All', presets: 'Presets', stations: 'Stations', seek: 'Seek', prevSt: 'Previous filter', nextSt: 'Next filter',
    filter: 'Filter tours by region or stop', tuned: 'Tuned to', allSt: 'All stations', results: 'tours',
    more: 'Show all', less: 'Show fewer', free: 'Free', from: (n) => `From SAR ${n}`, by: 'By', newTab: 'opens webook in a new tab',
    bulletins: 'Road bulletin', tipsK: 'Before you go', faqK: 'Listener questions', staysK: 'Where to stay', tracks: 'questions',
  },
  ar: {
    all: 'الكل', presets: 'المحطات المحفوظة', stations: 'المحطات', seek: 'تنقّل', prevSt: 'التصفية السابقة', nextSt: 'التصفية التالية',
    filter: 'تصفية الجولات حسب المنطقة أو المحطة', tuned: 'الموجة', allSt: 'كل المحطات', results: 'جولة',
    more: 'عرض الكل', less: 'عرض أقل', free: 'مجانًا', from: (n) => `تبدأ من ${n} ر.س`, by: 'تنظيم', newTab: 'يفتح webook في نافذة جديدة',
    bulletins: 'نشرة الطريق', tipsK: 'قبل أن تنطلق', faqK: 'أسئلة المستمعين', staysK: 'أين تقيم', tracks: 'أسئلة',
  },
};
const s = (k) => S[lang()][k];
const num = (n) => Number(n).toLocaleString('en-US');
const price = (p) => (p == null ? '' : p === 0 ? s('free') : s('from')(num(p)));
const ICONS = {
  plane: '<path d="M21 15v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V8l-8 5v2l8-2.5V18l-2 1.5V21l3.5-1 3.5 1v-1.5L13 18v-5.5z"/>',
  temperature: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/><path d="M11.5 10v7"/>',
  route: '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19h8a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7h8"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 3.5"/>',
  fuel: '<path d="M3 22h12M4 9h10M14 22V3H4v19M14 13h3v4.5a1.5 1.5 0 0 0 3 0V8l-3-3"/>',
};
const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.route}</svg>`;

const head = (idx, k, title, sub, dark) => `
  <header class="px-head${dark ? ' px-head--dark' : ''}">
    <p class="px-eyebrow nt-eyebrow" data-reveal><i class="led led--on"></i><span>${pad2(idx)} / 04</span><span class="dot-sep"></span><span>${esc(k)}</span></p>
    <h2 class="nt-h2 px-title" id="px-title-${idx}" data-reveal>${esc(title)}</h2>
    ${sub ? `<p class="px-sub" data-reveal>${esc(sub)}</p>` : ''}
  </header>`;

// ---------- 1. Tours: tuner + tracklist ----------
function mountTours(root, data) {
  const sec = data.sections.tours;
  const stops = data.stops;
  const stopBy = Object.fromEntries(stops.map((x) => [x.key, x]));
  const tours = data.tours;
  const pos = (n) => 4 + ((n - 1) / (stops.length - 1)) * 92;
  const withTours = stops.filter((x) => tours.some((tt) => tt.stop === x.key));
  const regions = data.regions.filter((r) => tours.some((tt) => tt.region === r.key));
  // filter options in tuning order: all, then each region preset followed by its stations
  const opts = [{ k: 'all', label: s('allSt'), test: () => true, p: null }];
  regions.forEach((r) => {
    opts.push({ k: 'r:' + r.key, label: t(r.name), test: (x) => x.region === r.key, region: r.key });
    withTours.filter((x) => x.region === r.key).forEach((x) => opts.push({ k: 's:' + x.key, label: t(x.name), test: (y) => y.stop === x.key, p: pos(x.n), region: r.key }));
  });

  root.setAttribute('aria-labelledby', 'px-title-1');
  root.innerHTML = `
  <div class="nt-wrap">
    ${head(1, t(sec.sub), t(sec.title))}
    <div class="tuner" data-reveal role="group" aria-label="${esc(s('filter'))}">
      <div class="tuner__glass">
        <div class="tuner__read">
          <span class="seg tuner__seg" aria-hidden="true"></span>
          <div class="tuner__txt">
            <span class="tuner__k">${esc(s('tuned'))}</span>
            <span class="tuner__name" aria-live="polite"></span>
          </div>
        </div>
        <div class="tband">
          <div class="tband__regions" aria-hidden="true">${data.regions.map((r) => {
            const idx = stops.filter((x) => x.region === r.key).map((x) => x.n);
            const a = pos(Math.min(...idx)); const b = pos(Math.max(...idx));
            return `<span class="tband__region" style="--a:${a}%;--w:${b - a}%;--rc:${REGION_COLOR[r.key]}"><b>${esc(regionShort(r))}</b></span>`;
          }).join('')}</div>
          <div class="tband__scale">
            <span class="tband__ticks" aria-hidden="true"></span>
            ${stops.map((x) => `<span class="tband__mk${withTours.includes(x) ? ' is-live' : ''}" aria-hidden="true" style="--p:${pos(x.n)}%;--rc:${REGION_COLOR[x.region]}"></span>`).join('')}
            ${withTours.map((x, i) => `<button class="tband__st${i % 2 ? ' is-up' : ''}" type="button" data-k="s:${x.key}" style="--p:${pos(x.n)}%" aria-pressed="false"><span>${esc(t(x.name))}</span></button>`).join('')}
            <span class="tband__needle" aria-hidden="true"></span>
          </div>
        </div>
        <span class="tuner__static" aria-hidden="true"></span>
      </div>
      <div class="tuner__keys">
        <div class="tuner__group">
          <p class="keys__k">${esc(s('presets'))}</p>
          <div class="tuner__presets">
            <button class="key tkey" type="button" data-k="all" aria-pressed="true"><i class="led"></i><b>0</b><span>${esc(s('all'))}</span></button>
            ${regions.map((r, i) => `<button class="key tkey" type="button" data-k="r:${r.key}" aria-pressed="false"><i class="led"></i><b>${i + 1}</b><span>${esc(regionShort(r))}</span></button>`).join('')}
          </div>
        </div>
        <div class="tuner__group tuner__group--st">
          <p class="keys__k">${esc(s('stations'))}</p>
          <div class="tuner__stations">${withTours.map((x) => `<button class="key tkey tkey--st" type="button" data-k="s:${x.key}" aria-pressed="false"><i class="led"></i><b>${pad2(x.n)}</b><span>${esc(t(x.name))}</span></button>`).join('')}</div>
        </div>
        <div class="tuner__group">
          <p class="keys__k">${esc(s('seek'))}</p>
          <div class="seek">
            <button class="key seekbtn tseek" type="button" data-step="-1" aria-label="${esc(s('prevSt'))}">${icons.prev}</button>
            <button class="key seekbtn tseek" type="button" data-step="1" aria-label="${esc(s('nextSt'))}">${icons.next}</button>
          </div>
        </div>
      </div>
    </div>
    <ol class="tlist" data-reveal>${tours.map((tt, i) => {
      const st = stopBy[tt.stop];
      const href = tt.href ? t(tt.href) : '';
      return `<li class="tl" data-stop="${tt.stop}" data-region="${tt.region}">
        <a class="tl__a" href="${esc(href)}" target="_blank" rel="noopener" style="--rc:${REGION_COLOR[tt.region]}">
          <span class="tl__art"><img src="${asset(tt.photo)}" alt="" loading="lazy" width="600" height="600"><span class="tl__n">${pad2(i + 1)}</span></span>
          <span class="tl__txt">
            <span class="tl__meta"><i></i>${esc(t(tt.type))} · ${pad2(st.n)} ${esc(t(st.name))}</span>
            <span class="tl__title" title="${esc(t(tt.title))}">${esc(t(tt.title))}</span>
            <span class="tl__line"><span class="tl__until">${esc(t(tt.until))}</span>${tt.organizer ? `<span class="tl__org">· ${esc(s('by'))} <bdi>${esc(tt.organizer)}</bdi></span>` : ''}</span>
          </span>
          <span class="tl__foot">
            <span class="tl__price">${esc(price(tt.price)) || '&nbsp;'}</span>
            <span class="tl__cta"><span class="eqm tl__eq" aria-hidden="true"><i></i><i></i><i></i></span>${esc(t(sec.cta))}<span class="sr-only"> (${esc(s('newTab'))})</span>${icons.arrow}</span>
          </span>
        </a>
      </li>`;
    }).join('')}</ol>
    <div class="px-more-row"><button class="key px-more" type="button"></button></div>
  </div>`;

  const $ = (q) => root.querySelector(q);
  const $$ = (q) => [...root.querySelectorAll(q)];
  const seg = createSeg($('.tuner__seg'), 2);
  const items = $$('.tl');
  const keys = $$('[data-k]');
  const needle = $('.tband__needle');
  const glass = $('.tuner__glass');
  const list = $('.tlist');
  const more = $('.px-more');
  const scale = $('.tband__scale');
  let cur = 'all';
  let open = false;
  const limit = () => (window.matchMedia('(max-width: 767px)').matches ? 4 : 8);

  function render(animate) {
    const o = opts.find((x) => x.k === cur);
    const m = items.filter((li) => o.test({ stop: li.dataset.stop, region: li.dataset.region }));
    const lim = open ? Infinity : limit();
    items.forEach((li) => (li.hidden = true));
    m.forEach((li, i) => {
      li.hidden = i >= lim;
      li.style.setProperty('--d', `${Math.min(i, 10) * 45}ms`);
    });
    more.hidden = m.length <= limit();
    more.textContent = open ? s('less') : `${s('more')} (${m.length})`;
    more.setAttribute('aria-expanded', String(open));
    seg.set(String(m.length));
    $('.tuner__name').textContent = `${o.label} · ${m.length} ${m.length === 1 && lang() === 'en' ? 'tour' : s('results')}`;
    keys.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === cur)));
    keys.forEach((b) => b.classList.toggle('is-on', b.dataset.k === cur));
    // needle: a station, the middle of a region, or parked at the start for "all"
    let p = o.p;
    if (p == null && o.region) {
      const idx = stops.filter((x) => x.region === o.region).map((x) => x.n);
      p = (pos(Math.min(...idx)) + pos(Math.max(...idx))) / 2;
    }
    if (p == null) p = 1.5;
    const w = scale.clientWidth;
    needle.style.transform = `translateX(${((p / 100) * w * (isRTL() ? -1 : 1)).toFixed(1)}px)`;
    root.style.setProperty('--tc', o.region ? REGION_COLOR[o.region] : 'var(--nt-cream)');
    if (animate && !isReduced()) {
      glass.classList.remove('is-tuning');
      list.classList.remove('is-swap');
      void glass.offsetWidth;
      glass.classList.add('is-tuning');
      list.classList.add('is-swap');
    }
  }
  const tune = (k) => {
    if (k === cur) return;
    cur = k;
    open = false;
    render(true);
  };
  keys.forEach((b) => b.addEventListener('click', () => tune(b.dataset.k)));
  $$('.tseek').forEach((b) => b.addEventListener('click', () => {
    const i = opts.findIndex((x) => x.k === cur);
    tune(opts[(i + +b.dataset.step + opts.length) % opts.length].k);
  }));
  more.addEventListener('click', () => {
    open = !open;
    render(true);
    if (!open) list.scrollIntoView({ block: 'start', behavior: isReduced() ? 'auto' : 'smooth' });
  });
  glass.addEventListener('animationend', () => glass.classList.remove('is-tuning'));
  render(false);
  window.addEventListener('resize', () => render(false));
  if (document.fonts) document.fonts.ready.then(() => render(false));
}

// ---------- 2. Stays: station cards with an indicator lamp ----------
function mountStays(root, data) {
  const sec = data.sections.stays;
  const reg = Object.fromEntries(data.regions.map((r) => [r.key, r]));
  root.setAttribute('aria-labelledby', 'px-title-2');
  root.innerHTML = `
  <div class="nt-wrap">
    ${head(2, s('staysK'), t(sec.title), t(sec.sub), true)}
    <ul class="sgrid">${data.stays.map((x, i) => {
      const href = x.href ? (typeof x.href === 'string' ? x.href : t(x.href)) : '';
      const p = x.priceFrom != null ? esc(`${t(sec.from)} ${lang() === 'ar' ? `${num(x.priceFrom)} ر.س` : `SAR ${num(x.priceFrom)}`} ${t(sec.night)}`) : '&nbsp;';
      const tag = href ? 'a' : 'article';
      return `<li class="sc-li" data-reveal style="transition-delay:${(i % 4) * 70}ms">
        <${tag} class="sc${href ? '' : ' is-soon'}"${href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : ''} style="--rc:${REGION_COLOR[x.region]}">
          <span class="sc__art"><img src="${asset(x.photo)}" alt="" loading="lazy"></span>
          <span class="sc__body">
            <span class="sc__meta"><i></i>${esc(t(x.city))} · ${esc(t(reg[x.region].name))}</span>
            <span class="sc__name">${esc(t(x.name))}</span>
            <span class="sc__tag">${esc(t(x.tagline))}</span>
            <span class="sc__desc">${esc(t(x.desc))}</span>
            <span class="sc__price">${p}</span>
          </span>
          <span class="sc__foot">${href
            ? `<i class="led led--on"></i><span>${esc(t(data.sections.tours.cta))}</span>${icons.arrow}`
            : `<i class="led sc__lamp"></i><span>${esc(t(sec.soon))}</span>`}</span>
        </${tag}>
      </li>`;
    }).join('')}</ul>
  </div>`;
}

// ---------- 3. Tips: road bulletins on display glass ----------
function mountTips(root, data) {
  root.setAttribute('aria-labelledby', 'px-title-3');
  root.innerHTML = `
  <div class="nt-wrap">
    ${head(3, s('tipsK'), t(data.sections.tips.title))}
    <div class="bul" data-reveal>
      <div class="bul__top"><span class="plate"><span class="plate__nt">NT</span><span class="plate__num">1200</span></span><span class="unit__onair"><i class="led led--on"></i>${esc(s('bulletins'))}</span></div>
      <ol class="bul__list">${data.tips.map((x, i) => `
        <li class="bul__item" style="--i:${i}">
          <span class="bul__ic">${icon(x.icon)}</span>
          <span class="bul__n">${pad2(i + 1)}</span>
          <h3 class="bul__title">${esc(t(x.title))}</h3>
          <p class="bul__text">${esc(t(x.text))}</p>
        </li>`).join('')}</ol>
    </div>
  </div>`;
}

// ---------- 4. FAQ: a tracklist; the open answer is "playing" ----------
function mountFaq(root, data) {
  root.setAttribute('aria-labelledby', 'px-title-4');
  root.innerHTML = `
  <div class="nt-wrap">
    ${head(4, s('faqK'), t(data.sections.faq.title))}
    <div class="fq" data-reveal>
      <div class="fq__head"><span class="fq__title">${esc(t(data.sections.faq.title))}</span><span class="fq__total">${data.faq.length} ${esc(s('tracks'))}</span></div>
      <ol class="fq__list">${data.faq.map((f, i) => `
        <li class="fq__item">
          <h3 class="fq__h"><button class="fq__btn" type="button" id="fq-${i}-b" aria-expanded="false" aria-controls="fq-${i}">
            <span class="fq__n">${pad2(i + 1)}</span>
            <span class="fq__q">${esc(t(f.q))}</span>
            <span class="eqm fq__eq" aria-hidden="true"><i></i><i></i><i></i></span>
            <span class="fq__ic" aria-hidden="true">${icons.play}</span>
          </button></h3>
          <div class="fq__panel" id="fq-${i}" role="region" aria-labelledby="fq-${i}-b"><div class="fq__inner"><p class="fq__a">${esc(t(f.a))}</p></div></div>
        </li>`).join('')}</ol>
    </div>
  </div>`;
  const btns = [...root.querySelectorAll('.fq__btn')];
  btns.forEach((b, i) => b.addEventListener('click', () => {
    const was = b.getAttribute('aria-expanded') === 'true';
    btns.forEach((x, k) => {
      const on = !was && k === i;
      x.setAttribute('aria-expanded', String(on));
      x.closest('.fq__item').classList.toggle('is-open', on);
    });
  }));
}

export function mountPractical(data) {
  mountTours(document.getElementById('tours'), data);
  mountStays(document.getElementById('stays'), data);
  mountTips(document.getElementById('tips'), data);
  mountFaq(document.getElementById('faq'), data);
}
