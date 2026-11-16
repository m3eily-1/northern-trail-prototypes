// Square equaliser bars. Audio-reactive when sound is on, CSS idle loop when off.
export function createEQ(audio) {
  const sets = [];
  let raf = 0;
  let data = null;

  function register(el, n) {
    el.innerHTML = Array.from({ length: n }, (_, i) => `<i style="--d:${(0.9 + ((i * 37) % 11) / 10).toFixed(2)}s;--o:${((i * 53) % 17) / -10}s"></i>`).join('');
    sets.push({ el, bars: [...el.children] });
    el.classList.add('eq', 'is-idle');
  }

  function frame() {
    const an = audio.analyser;
    if (!an) return stop();
    if (!data) data = new Uint8Array(an.frequencyBinCount);
    an.getByteFrequencyData(data);
    const hz = an.context.sampleRate / an.fftSize;
    sets.forEach((set) => {
      const { bars } = set;
      const n = bars.length;
      if (!set.avg) set.avg = new Float32Array(n);
      // log-spaced bands from 60 Hz to 4 kHz: a calm base level plus the transient above each band's running average
      for (let i = 0; i < n; i++) {
        const f0 = 60 * Math.pow(4000 / 60, i / n);
        const f1 = 60 * Math.pow(4000 / 60, (i + 1) / n);
        const a = Math.floor(f0 / hz);
        const b = Math.max(a + 1, Math.ceil(f1 / hz));
        let m = 0;
        for (let j = a; j < b && j < data.length; j++) m = Math.max(m, data[j]);
        const avg = (set.avg[i] = set.avg[i] * 0.94 + m * 0.06);
        const v = 0.38 * Math.max(0, (m - 30) / 225) + Math.max(0, m - avg) / 32;
        bars[i].style.transform = `scaleY(${Math.max(0.06, Math.min(1, v)).toFixed(3)})`;
      }
    });
    raf = requestAnimationFrame(frame);
  }

  function start() {
    sets.forEach(({ el }) => el.classList.remove('is-idle'));
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    sets.forEach(({ el, bars }) => {
      el.classList.add('is-idle');
      bars.forEach((b) => (b.style.transform = ''));
    });
  }

  audio.onChange((on) => (on ? start() : stop()));
  return { register };
}
