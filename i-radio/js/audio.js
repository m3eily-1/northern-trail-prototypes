// Synthesized ambient layer (WebAudio, no samples). Off by default.
// Warm drone + oud-like plucks in a different maqam per region,
// hiss while between stations and a short static sweep on each station change.

const KEYS = {
  // root (Hz) for plucks; drone sits an octave below. Scales in semitones (quarter tones allowed).
  riyadh: { root: 146.83, scale: [0, 1, 4, 5, 7, 8, 10, 12, 13, 16] }, // Hijaz on D
  qassim: { root: 174.61, scale: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15] }, // Nahawand on F
  hail: { root: 220.0, scale: [0, 1.5, 3, 5, 7, 8, 10, 12, 13.5, 15] }, // Bayati on A
};

export function createAudio() {
  let ctx = null;
  let master, music, delay, fb, dlp, analyser, hiss, hissGain, noiseBuf;
  let drone = [];
  let droneFilter, lfo;
  let on = false;
  let region = 'riyadh';
  let timer = 0;
  let nextAt = 0;
  let deg = 2;
  let lastSweep = 0;
  let offTimer = 0;
  const listeners = new Set();

  const semi = (root, s) => root * Math.pow(2, s / 12);

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.78;
    analyser.minDecibels = -95;
    analyser.maxDecibels = -25;
    master.connect(comp);
    comp.connect(analyser);
    analyser.connect(ctx.destination);

    music = ctx.createGain();
    music.gain.value = 1;
    music.connect(master);

    // Soft echo for space
    delay = ctx.createDelay(1.5);
    delay.delayTime.value = 0.36;
    fb = ctx.createGain();
    fb.gain.value = 0.32;
    dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 1800;
    delay.connect(dlp);
    dlp.connect(fb);
    fb.connect(delay);
    dlp.connect(music);

    // Drone: root, fifth, octave saw through a slowly breathing lowpass
    droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.value = 520;
    droneFilter.Q.value = 0.7;
    const dg = ctx.createGain();
    dg.gain.value = 0.09;
    droneFilter.connect(dg);
    dg.connect(music);
    lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 220;
    lfo.connect(lfoAmt);
    lfoAmt.connect(droneFilter.frequency);
    lfo.start();
    const k = KEYS[region];
    const parts = [
      { type: 'sine', mul: 0.5, g: 0.9, det: 0 },
      { type: 'triangle', mul: 0.75, g: 0.35, det: 3 },
      { type: 'sawtooth', mul: 1, g: 0.12, det: -4 },
      { type: 'sine', mul: 0.25, g: 0.5, det: 0 },
    ];
    drone = parts.map((p) => {
      const o = ctx.createOscillator();
      o.type = p.type;
      o.frequency.value = k.root * p.mul;
      o.detune.value = p.det;
      const g = ctx.createGain();
      g.gain.value = p.g;
      o.connect(g);
      g.connect(droneFilter);
      o.start();
      return { o, mul: p.mul };
    });

    // Noise buffer shared by hiss + sweeps
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuf;
    hiss.loop = true;
    const hbp = ctx.createBiquadFilter();
    hbp.type = 'bandpass';
    hbp.frequency.value = 2400;
    hbp.Q.value = 0.6;
    hissGain = ctx.createGain();
    hissGain.gain.value = 0;
    hiss.connect(hbp);
    hbp.connect(hissGain);
    hissGain.connect(master);
    hiss.start();

    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend();
      else if (on) ctx.resume();
    });
    return true;
  }

  function pluck(freq, t, vel, dur = 1.7) {
    const o1 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(freq * 1.018, t);
    o1.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
    const o2 = ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = freq * 2.003;
    const o2g = ctx.createGain();
    o2g.gain.value = 0.35;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 4;
    f.frequency.setValueAtTime(Math.min(9000, freq * 10), t);
    f.frequency.exponentialRampToValueAtTime(freq * 1.6, t + 0.38);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.connect(f);
    o2.connect(o2g);
    o2g.connect(f);
    f.connect(g);
    g.connect(music);
    g.connect(delay);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
    o1.onended = () => { [o1, o2, o2g, f, g].forEach((n) => n.disconnect()); };
  }

  // Lookahead scheduler on setInterval (keeps time when rAF is paused).
  function schedule() {
    if (!ctx || !on) return;
    const k = KEYS[region];
    const beat = 0.42;
    while (nextAt < ctx.currentTime + 0.35) {
      const r = Math.random();
      if (r < 0.16) {
        nextAt += beat * 2; // breathe
        continue;
      }
      deg = Math.max(0, Math.min(k.scale.length - 1, deg + Math.round((Math.random() - 0.5) * 3.2)));
      const f = semi(k.root, k.scale[deg]);
      const vel = 0.09 + Math.random() * 0.07;
      pluck(f, nextAt, vel);
      if (r > 0.86) pluck(f, nextAt + beat / 4, vel * 0.7, 0.9); // risha flick
      if (r > 0.95) pluck(semi(k.root, k.scale[Math.max(0, deg - 2)]), nextAt + beat / 2, vel * 0.6);
      nextAt += beat * [1, 1, 0.5, 1.5, 2][Math.floor(Math.random() * 5)];
    }
  }

  function setRegion(r) {
    if (!KEYS[r] || r === region) return;
    region = r;
    if (!ctx) return;
    const now = ctx.currentTime;
    drone.forEach(({ o, mul }) => o.frequency.setTargetAtTime(KEYS[r].root * mul, now, 0.35));
  }

  function sweep() {
    if (!ctx || !on) return;
    const now = ctx.currentTime;
    if (now - lastSweep < 0.22) return;
    lastSweep = now;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(500, now);
    bp.frequency.exponentialRampToValueAtTime(3200, now + 0.18);
    bp.frequency.exponentialRampToValueAtTime(800, now + 0.45);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    src.start(now, Math.random());
    src.stop(now + 0.55);
    // heterodyne whistle
    const w = ctx.createOscillator();
    w.type = 'sine';
    w.frequency.setValueAtTime(2200, now);
    w.frequency.exponentialRampToValueAtTime(480, now + 0.4);
    const wg = ctx.createGain();
    wg.gain.setValueAtTime(0.0001, now);
    wg.gain.exponentialRampToValueAtTime(0.025, now + 0.06);
    wg.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
    w.connect(wg);
    wg.connect(master);
    w.start(now);
    w.stop(now + 0.45);
    // duck the music under the sweep
    music.gain.cancelScheduledValues(now);
    music.gain.setValueAtTime(music.gain.value, now);
    music.gain.linearRampToValueAtTime(0.25, now + 0.06);
    music.gain.setTargetAtTime(1, now + 0.4, 0.25);
    src.onended = () => { [src, bp, g].forEach((n) => n.disconnect()); };
    w.onended = () => { w.disconnect(); wg.disconnect(); };
  }

  function tick() {
    if (!ctx || !on) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
    src.connect(hp);
    hp.connect(g);
    g.connect(master);
    src.start(now, Math.random());
    src.stop(now + 0.03);
    src.onended = () => { src.disconnect(); hp.disconnect(); g.disconnect(); };
  }

  // 0..1: how far the needle is from a station
  function setDetune(x) {
    if (!ctx || !on) return;
    hissGain.gain.setTargetAtTime(Math.min(1, x) * 0.07, ctx.currentTime, 0.04);
    music.gain.setTargetAtTime(1 - Math.min(1, x) * 0.6, ctx.currentTime, 0.06);
  }

  async function setOn(v) {
    if (v === on) return on;
    if (v) {
      if (!ctx && !build()) return false;
      clearTimeout(offTimer);
      on = true;
      await ctx.resume().catch(() => {});
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0.9, now + 1.6);
      nextAt = now + 0.3;
      clearInterval(timer);
      timer = setInterval(schedule, 90);
      schedule();
    } else {
      on = false;
      clearInterval(timer);
      if (ctx) {
        const now = ctx.currentTime;
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0, now + 0.35);
        offTimer = setTimeout(() => { if (!on) ctx.suspend(); }, 450);
      }
    }
    listeners.forEach((fn) => fn(on));
    return on;
  }

  return {
    get on() { return on; },
    get analyser() { return on ? analyser : null; },
    setOn,
    toggle: () => setOn(!on),
    setRegion,
    sweep,
    tick,
    setDetune,
    onChange: (fn) => listeners.add(fn),
  };
}
