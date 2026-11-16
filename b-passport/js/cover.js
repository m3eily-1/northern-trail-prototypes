// Loading moment: the passport cover opens (3D page turn, transform only), once per session.
// Resolves when the page underneath should start its own entrance.
export function runCover() {
  const root = document.documentElement;
  const cover = document.querySelector('.cover');
  if (!cover) return Promise.resolve();
  if (!root.classList.contains('has-cover') || !window.gsap) {
    cover.remove();
    root.classList.remove('has-cover');
    return Promise.resolve();
  }
  try { sessionStorage.setItem('ntp-cover', '1'); } catch (_) { /* private mode */ }

  const gsap = window.gsap;
  const rtl = root.dir === 'rtl';
  const book = cover.querySelector('.cover__book');
  const front = cover.querySelector('.cover__front');
  const sheen = cover.querySelector('.cover__sheen i');
  const page = cover.querySelector('.cover__page');
  const skip = cover.querySelector('.cover__skip');

  return new Promise((resolve) => {
    let resolved = false;
    const go = () => { if (!resolved) { resolved = true; resolve(); } };
    const finish = () => {
      go();
      cover.remove();
      root.classList.remove('has-cover');
      window.removeEventListener('keydown', onKey);
    };
    const half = () => book.offsetWidth / 2;

    const tl = gsap.timeline({ onComplete: finish });
    tl.from(book, { y: 28, scale: 0.94, opacity: 0, duration: 0.8, ease: 'power3.out' })
      .from(skip, { opacity: 0, duration: 0.4 }, 0.4)
      .fromTo(sheen, { xPercent: -100 }, { xPercent: 100, duration: 1.1, ease: 'power2.inOut' }, 0.35)
      .to(front, { rotationY: rtl ? 178 : -178, duration: 1.25, ease: 'power3.inOut' }, 1.2)
      .to(book, { x: () => (rtl ? -half() : half()), duration: 1.25, ease: 'power3.inOut' }, 1.2)
      .from(page.children, { opacity: 0, y: 6, stagger: 0.08, duration: 0.4 }, 1.6)
      .add(go, 2.25)
      .to(book, { scale: 1.5, opacity: 0, duration: 0.7, ease: 'power2.in' }, 2.3)
      .to(cover, { opacity: 0, duration: 0.6, ease: 'power1.inOut' }, 2.45);

    const jump = () => tl.progress(1);
    function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') jump(); }
    cover.addEventListener('click', jump);
    window.addEventListener('keydown', onKey);
  });
}
