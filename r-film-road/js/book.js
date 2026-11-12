// Stays as plain webook listings: square photo, "stay · region" line, name, city, price per night.
// With a webook link the whole card is the link (new tab); without one it is a plain card.
// (Tours and Experiences are option E's postcards, in postcards.js.)

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const num = (n) => Number(n).toLocaleString('en-US');
const ARROW =
  '<svg class="nt-flip" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 15 15 5M7 5h8v8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>';

function head(id, title, sub, count) {
  return `
    <header class="bk__head">
      <div class="bk__titles">
        <h2 class="bk__title" id="${id}">${esc(title)}</h2>
        <p class="bk__sub">${esc(sub)}</p>
      </div>
      <p class="bk__count">${esc(count)}</p>
    </header>`;
}

// A row of square chips (webook's filter pills). Groups are separated by a rule; each group has
// one choice pressed. Counts reflect the other group's current choice.
function chipGroup(name, label, opts) {
  return `
    <div class="bk-chips__group" role="group" aria-label="${esc(label)}" data-group="${name}">
      ${opts.map((o, i) => `<button class="bk-chip" type="button" data-k="${esc(o.k)}" aria-pressed="${i === 0}"><span>${esc(o.label)}</span><b>${o.n}</b></button>`).join('')}
    </div>`;
}

export function bkCard({ href, photo, meta, title, place, price, note, newTab, data, after }) {
  const tag = href ? 'a' : 'article';
  const link = href ? ` href="${esc(href)}" target="_blank" rel="noopener"` : '';
  return `
    <li class="bk__item" ${data || ''}>
      <${tag} class="bk-card${href ? '' : ' is-soon'}"${link}>
        <span class="bk-card__media"><img src="${esc(photo)}" alt="" loading="lazy" decoding="async"></span>
        <span class="bk-card__meta">${esc(meta)}</span>
        <span class="bk-card__title">${esc(title)}</span>
        <span class="bk-card__place">${esc(place)}</span>
        <span class="bk-card__price">${esc(price)}${href ? `<span class="ntc-sr"> (${esc(newTab)})</span>` : ''}</span>
        ${note ? `<span class="bk-card__note"><i aria-hidden="true"></i>${esc(note)}</span>` : ''}
        ${href ? `<span class="bk-card__go" aria-hidden="true">${ARROW}</span>` : ''}
      </${tag}>
      ${after || ''}
    </li>`;
}

function wireChips(root, pick, onChange) {
  root.querySelectorAll('.bk-chips__group').forEach((g) => {
    const name = g.dataset.group;
    g.addEventListener('click', (e) => {
      const c = e.target.closest('.bk-chip');
      if (!c || c.getAttribute('aria-pressed') === 'true') return;
      g.querySelectorAll('.bk-chip').forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
      pick[name] = c.dataset.k;
      onChange();
    });
  });
}

export function initBook(stayRoot, ctx) {
  const { data, t, L, asset, reduced } = ctx;

  // ---------- stays ----------
  const ssec = data.sections.stays;
  const regionName = Object.fromEntries(data.regions.map((r) => [r.key, t(r.name)]));
  stayRoot.innerHTML = `
    <div class="nt-wrap">
      ${head('bk-stays-title', t(ssec.title), t(ssec.sub), L.results(data.stays.length))}
      <div class="bk-chips" aria-label="${esc(L.filterStays)}">
        ${chipGroup('region', L.where, [{ k: 'all', label: L.all, n: data.stays.length }, ...data.regions.filter((r) => data.stays.some((x) => x.region === r.key)).map((r) => ({ k: r.key, label: t(r.name), n: data.stays.filter((x) => x.region === r.key).length }))])}
      </div>
      <ul class="bk__grid">
        ${data.stays
          .map((s) => {
            const href = s.href ? (typeof s.href === 'string' ? s.href : t(s.href)) : null;
            return bkCard({
              href,
              photo: asset(s.photo),
              meta: `${L.stay} · ${regionName[s.region]}`,
              title: t(s.name),
              place: t(s.city),
              price: s.priceFrom != null ? L.night(num(s.priceFrom)) : '',
              newTab: L.newTab,
              data: `data-region="${s.region}"`,
              after: ctx.trip && s.priceFrom != null ? ctx.trip.button(`s:${s.key}`) : '',
            });
          })
          .join('')}
      </ul>
    </div>`;

  const spick = { region: 'all' };
  const stays = [...stayRoot.querySelectorAll('.bk__item')];
  wireChips(stayRoot, spick, () => {
    let n = 0;
    stays.forEach((li) => {
      li.hidden = spick.region !== 'all' && li.dataset.region !== spick.region;
      if (!li.hidden) n++;
    });
    stayRoot.querySelector('.bk__count').textContent = L.results(n);
    rise(stayRoot);
  });

  // replay the rise on the cards a filter brings in
  function rise(r) {
    if (reduced) return;
    const g = r.querySelector('.bk__grid');
    g.classList.remove('is-in');
    void g.offsetWidth;
    g.classList.add('is-in');
    window.ScrollTrigger?.refresh();
  }

  // soft rise as each grid arrives
  if (!reduced) {
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }),
      { rootMargin: '0px 0px -10% 0px' }
    );
    [stayRoot].forEach((r) => {
      r.classList.add('can-rise');
      r.querySelectorAll('.bk__item').forEach((li, i) => li.style.setProperty('--i', i % 4));
      io.observe(r.querySelector('.bk__grid'));
    });
  }
}
