// Loading moment: a tinted car window fills the screen while the odometer runs
// to 1,200 km, then the glass rolls down and the film is the view.
import { asset, ui, num, gsap } from './util.js';

export function initLoader(data, done) {
  const el = document.getElementById('loader');
  const html = document.documentElement;
  if (!html.classList.contains('has-loader')) {
    el.remove();
    done();
    return;
  }

  el.innerHTML = `
    <div class="loader__glass">
      <i class="loader__sheen"></i>
      <div class="loader__in">
        <img class="loader__logo" src="${asset(data.logo.cream)}" alt="" width="296" height="165">
        <p class="loader__odo"><span class="loader__n">0</span><span class="loader__u">${ui.km}</span></p>
        <p class="loader__label">${ui.windowSeat}</p>
      </div>
      <i class="loader__seal"></i>
    </div>`;

  const n = el.querySelector('.loader__n');
  const glass = el.querySelector('.loader__glass');
  const g = gsap();
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    try {
      sessionStorage.setItem('nt-p-window-loader', '1');
    } catch (e) {}
    html.classList.remove('has-loader');
    html.classList.add('is-ready');
    done();
    if (g) {
      g.to(glass, {
        yPercent: 100,
        duration: 1.05,
        ease: 'power3.inOut',
        onComplete: () => el.remove()
      });
    } else {
      el.remove();
    }
  };

  // Wait for fonts and the poster frame, but never longer than 2.6 s.
  const poster = new Image();
  poster.src = asset(data.film.poster);
  const ready = Promise.race([
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      poster.decode ? poster.decode().catch(() => {}) : Promise.resolve()
    ]),
    new Promise((r) => setTimeout(r, 2600))
  ]);

  // Tap to skip.
  el.addEventListener('click', finish, { once: true });

  if (!g) {
    n.textContent = num(1200);
    ready.then(() => setTimeout(finish, 300));
    return;
  }
  const o = { v: 0 };
  const count = new Promise((r) =>
    g.to(o, {
      v: 1200,
      duration: 1.5,
      ease: 'power2.inOut',
      onUpdate: () => (n.textContent = num(Math.round(o.v / 10) * 10)),
      onComplete: r
    })
  );
  g.from(el.querySelectorAll('.loader__logo, .loader__odo, .loader__label'), {
    opacity: 0,
    y: 12,
    duration: 0.7,
    stagger: 0.08,
    ease: 'power3.out'
  });
  Promise.all([ready, count]).then(() => setTimeout(finish, 160));
}
