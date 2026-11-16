// Rolling number: each digit is a vertical strip 0-9 that slides into place.
// Pure CSS transitions on transform, so it needs no animation loop.
import { isReduced } from './util.js';

export function odometer(el, initial = '0') {
  el.classList.add('k-odo');
  el.setAttribute('dir', 'ltr');
  const sr = document.createElement('span');
  sr.className = 'k-sr';
  const vis = document.createElement('span');
  vis.className = 'k-odo__vis';
  vis.setAttribute('aria-hidden', 'true');
  el.replaceChildren(sr, vis);
  let current = '';

  function build(str, from) {
    vis.replaceChildren();
    const chars = [...str];
    const prev = [...from].reverse();
    chars.forEach((ch, i) => {
      if (/\d/.test(ch)) {
        const col = document.createElement('span');
        col.className = 'k-odo__d';
        const strip = document.createElement('span');
        strip.className = 'k-odo__s';
        strip.innerHTML = '<span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span>';
        // start from the previous digit in the same place value (right aligned)
        const p = prev[chars.length - 1 - i];
        const start = p && /\d/.test(p) ? +p : 0;
        strip.style.transform = `translateY(${-start * 10}%)`;
        strip.dataset.v = ch;
        strip.style.transitionDelay = `${(chars.length - 1 - i) * 45}ms`;
        col.append(strip);
        vis.append(col);
      } else {
        const s = document.createElement('span');
        s.className = 'k-odo__c';
        s.textContent = ch;
        vis.append(s);
      }
    });
  }

  function set(str) {
    str = String(str);
    sr.textContent = str;
    if (str === current) return;
    const reduced = isReduced();
    const sameShape = current.length === str.length && [...current].every((c, i) => /\d/.test(c) === /\d/.test(str[i]));
    if (!sameShape) {
      build(str, current);
      if (!reduced) void vis.offsetWidth; // commit start positions before rolling
    }
    vis.querySelectorAll('.k-odo__s').forEach((strip, i) => {
      const digits = str.replace(/\D/g, '');
      strip.style.transform = `translateY(${-digits[i] * 10}%)`;
    });
    current = str;
  }

  set(initial);
  return { set, get value() { return current; } };
}
