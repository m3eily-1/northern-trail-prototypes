// INTRO: title + body, then the four stats as giant rolling numbers.
import { h, L, makeRoller, kinetic, reduced } from './lib.js';

export function initIntro(data) {
  const root = document.getElementById('intro');
  root.querySelector('.intro__title').textContent = L(data.intro.title);
  root.querySelector('.intro__body').textContent = L(data.intro.body);
  const list = root.querySelector('.stats');
  const rollers = [];
  const nums = [];
  data.intro.stats.forEach((s, i) => {
    const num = h('span', { class: 'stat__num' });
    const roll = makeRoller(num, s.value);
    rollers.push(roll);
    const big = h('span', { class: 'stat__big' }, num, s.unit ? h('span', { class: 'stat__unit' }, L(s.unit)) : null);
    nums.push(big);
    list.append(h('li', { class: 'stat' }, h('span', { class: 'stat__i' }, String(i + 1).padStart(2, '0')), big, h('span', { class: 'stat__label' }, L(s.label))));
  });
  kinetic(nums, { skew: 6, stretch: 0.05 });

  if (!reduced) {
    [...list.children].forEach((li, i) => {
      ScrollTrigger.create({
        trigger: li, start: 'top 85%', once: true,
        onEnter: () => {
          rollers[i].play(1.6);
          gsap.from(li.querySelector('.stat__label'), { y: 20, opacity: 0, duration: 0.8, ease: 'expo.out', delay: 0.2 });
          gsap.fromTo(li, { '--rule': 0 }, { '--rule': 1, duration: 1.2, ease: 'expo.out' });
        },
      });
    });
    gsap.from(root.querySelectorAll('.intro__head > *'), {
      y: 32, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: root, start: 'top 75%', once: true },
    });
  }
}
