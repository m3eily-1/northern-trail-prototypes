// CLOSING: the tagline set to fill the width; letters drift away from the pointer.
import { L, splitLetters, fitText, reduced, isPhone } from './lib.js';

export function initClosing(data) {
  const root = document.getElementById('closing');
  const tag = root.querySelector('.closing__tag');
  root.querySelector('.closing__line').textContent = L(data.closing.line);
  const line = document.createElement('span');
  line.className = 'closing__fit';
  tag.append(line);
  let letters = [];
  let centers = [];

  const fit = () => {
    line.textContent = data.hero.tagline;
    fitText(line, tag.clientWidth, { max: 600 });
    letters = splitLetters(line, data.hero.tagline, 'ar').filter((s) => !s.classList.contains('ch--sp'));
    measure();
  };
  const measure = () => {
    centers = letters.map((s) => {
      const r = s.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + window.scrollY + r.height / 2 };
    });
  };

  if (!reduced) {
    gsap.from(line, {
      yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: root, start: 'top 70%', once: true },
    });
    gsap.from(root.querySelectorAll('.closing__foot > *'), {
      y: 32, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: root.querySelector('.closing__foot'), start: 'top 90%', once: true },
    });

    // pointer proximity (subtle, eased per letter)
    const state = new Map();
    let px = -1e4;
    let py = -1e4;
    let raf = 0;
    const R = () => (isPhone() ? 120 : 260);
    const MAX = () => (isPhone() ? 10 : 22);
    const step = () => {
      raf = 0;
      let moving = false;
      const rad = R();
      const max = MAX();
      letters.forEach((s, i) => {
        const c = centers[i];
        if (!c) return;
        const dx = c.x - px;
        const dy = c.y - window.scrollY - py;
        const d = Math.hypot(dx, dy);
        const f = d < rad ? (1 - d / rad) ** 2 : 0;
        const tx = d ? (dx / d) * f * max : 0;
        const ty = d ? (dy / d) * f * max : 0;
        const st = state.get(s) || { x: 0, y: 0, r: 0 };
        st.x += (tx - st.x) * 0.16;
        st.y += (ty - st.y) * 0.16;
        st.r += (tx * 0.25 - st.r) * 0.16;
        state.set(s, st);
        if (Math.abs(st.x - tx) > 0.05 || Math.abs(st.y - ty) > 0.05) moving = true;
        s.style.transform = `translate(${st.x.toFixed(2)}px, ${st.y.toFixed(2)}px) rotate(${st.r.toFixed(2)}deg)`;
      });
      if (moving) raf = requestAnimationFrame(step);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    root.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; kick(); });
    root.addEventListener('pointerleave', () => { px = -1e4; py = -1e4; kick(); });
    window.addEventListener('scroll', () => { if (px > -1e3) kick(); }, { passive: true });
  }

  return { fit, measure };
}
