// Loading moment: the 16 stops are dealt into a stack, riffle-shuffled twice,
// fanned out like a hand of cards, then flung outward to reveal the page.
// One WAAPI animation per card (time based). A setTimeout guard always ends it,
// so a hidden tab (paused frames) can never leave the overlay stuck.
import { t, asset, pad2, tr, h, isReduced } from './util.js';

const KEY = 'nt-k-deck';
const T = 3200; // total ms

export function initDeck(root, data) {
  const doc = document.documentElement;
  return new Promise((resolve) => {
    if (!doc.classList.contains('has-deck') || isReduced()) {
      doc.classList.remove('has-deck');
      resolve();
      return;
    }

    const table = root.querySelector('.k-deck__table');
    const phone = innerWidth < 600;
    const W = phone ? 104 : 140;
    const R = phone ? 150 : 250;
    const rnd = mulberry(7);
    const cards = data.stops.map((s, i) => {
      const card = h(
        'div',
        { class: 'k-dcard' + (s.sticker ? ' has-sticker' : '') },
        h('img', { src: asset(s.photo), alt: '', decoding: 'async' }),
        s.sticker ? h('img', { class: 'k-dcard__sticker', src: asset(s.sticker), alt: '' }) : null,
        h('span', { class: 'k-dcard__n', text: pad2(s.n) }),
        h('span', { class: 'k-dcard__name', text: t(s.name) })
      );
      table.append(card);
      return card;
    });
    const caption = h('p', { class: 'k-deck__cap nt-eyebrow', text: `${tr.brand} · 16` });
    const skip = h('button', { class: 'k-deck__skip', type: 'button', text: tr.skip });
    root.append(caption, skip);

    const n = cards.length;
    const anims = [];
    const tf = (x, y, a, p, s = 1) => `translate(${x}px, ${y}px) rotate(${a}deg) translate(0px, ${p}px) scale(${s})`;
    cards.forEach((card, i) => {
      const jx = (rnd() - 0.5) * 10;
      const jy = (rnd() - 0.5) * 8 - i * 0.8;
      const jr = (rnd() - 0.5) * 9;
      const jr2 = (rnd() - 0.5) * 9;
      const side1 = i % 2 ? 1 : -1;
      const side2 = i % 4 < 2 ? -1 : 1;
      const fanA = -66 + (132 * i) / (n - 1);
      const dealAt = 0.02 + i * 0.012;
      const off = tf((rnd() - 0.5) * 80, innerHeight * 0.7, (rnd() - 0.5) * 40, 0);
      const stack = tf(jx, jy, jr, 0);
      const k = [
        { offset: 0, transform: off, opacity: 0 },
        { offset: dealAt, transform: off, opacity: 0 },
        { offset: dealAt + 0.07, transform: stack, opacity: 1, easing: 'cubic-bezier(.2,.8,.2,1)' },
        { offset: 0.3, transform: stack, opacity: 1 },
        { offset: 0.37, transform: tf(side1 * W * 0.62, jy - 6, side1 * 7, 0), opacity: 1 },
        { offset: 0.44, transform: tf(jx * 0.5, jy, jr2, 0), opacity: 1 },
        { offset: 0.51, transform: tf(side2 * W * 0.62, jy - 6, side2 * 7, 0), opacity: 1 },
        { offset: 0.58, transform: tf(jx, jy, jr * 0.4, 0), opacity: 1, easing: 'cubic-bezier(.3,1.4,.5,1)' },
        { offset: 0.74, transform: tf(0, R * 0.42, fanA, -R), opacity: 1 },
        { offset: 0.8, transform: tf(0, R * 0.42, fanA * 1.04, -R * 1.06, 1.02), opacity: 1, easing: 'cubic-bezier(.55,0,.8,.3)' },
        { offset: 1, transform: tf(0, R * 0.42, fanA * 1.5, -R * 4.2, 1.1), opacity: 0 },
      ];
      card.style.zIndex = String(i + 1);
      anims.push(card.animate(k, { duration: T, fill: 'forwards', easing: 'linear' }));
    });
    const capA = caption.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none', offset: 0.15 }, { opacity: 1, offset: 0.78 }, { opacity: 0 }],
      { duration: T, fill: 'forwards' }
    );
    anims.push(capA);

    let ended = false;
    let fadeTimer;
    const end = () => {
      if (ended) return;
      ended = true;
      clearTimeout(fadeTimer);
      clearTimeout(guard);
      try { sessionStorage.setItem(KEY, '1'); } catch (e) { /* storage blocked */ }
      root.classList.add('is-out');
      resolve();
      setTimeout(() => {
        doc.classList.remove('has-deck');
        anims.forEach((a) => a.cancel());
        table.replaceChildren();
        caption.remove();
        skip.remove();
      }, 520);
    };
    // Start fading the table while the fan is flung outward.
    fadeTimer = setTimeout(end, T * 0.9);
    const guard = setTimeout(end, T + 900);
    const onSkip = () => {
      anims.forEach((a) => { try { a.finish(); } catch (e) { /* ignore */ } });
      end();
    };
    const onKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        removeEventListener('keydown', onKey);
        onSkip();
      }
    };
    root.addEventListener('click', onSkip, { once: true });
    addEventListener('keydown', onKey);
    setTimeout(() => removeEventListener('keydown', onKey), T + 1000);
  });
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
