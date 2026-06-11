/* Anubis Wrath — BET 777 : synthesized audio engine (no asset files) */
const SND = (() => {
  let ac = null, master = null, muted = false, spinSrc = null;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ac.destination);
    ambience();
  }

  function tone(freq, dur, { type = 'sine', vol = 0.3, delay = 0, slide = 0, attack = 0.01 } = {}) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, { vol = 0.3, delay = 0, fc = 1200, q = 1 } = {}) {
    if (!ac || muted) return;
    const t0 = ac.currentTime + delay;
    const len = Math.max(1, (dur * ac.sampleRate) | 0);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = fc; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t0);
    return src;
  }

  function ambience() {
    // deep temple drone + slow shimmering wind
    const drone = ac.createOscillator(), dg = ac.createGain();
    drone.type = 'sine'; drone.frequency.value = 52;
    dg.gain.value = 0.05;
    drone.connect(dg).connect(master); drone.start();

    const len = ac.sampleRate * 4;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const wind = ac.createBufferSource(); wind.buffer = buf; wind.loop = true;
    const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 320; wf.Q.value = 0.6;
    const wg = ac.createGain(); wg.gain.value = 0.018;
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 0.09; lg.gain.value = 0.012;
    lfo.connect(lg).connect(wg.gain); lfo.start();
    wind.connect(wf).connect(wg).connect(master); wind.start();
  }

  return {
    init,
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.55; },
    isMuted() { return muted; },

    click() { tone(640, 0.07, { type: 'triangle', vol: 0.22 }); tone(1280, 0.05, { type: 'sine', vol: 0.1, delay: 0.015 }); },

    spinStart() {
      noiseBurst(0.35, { vol: 0.18, fc: 900, q: 0.8 });
      tone(180, 0.3, { type: 'sawtooth', vol: 0.08, slide: 220 });
      if (spinSrc) { try { spinSrc.stop(); } catch (e) {} }
      spinSrc = noiseBurst(1.6, { vol: 0.05, fc: 2400, q: 0.4 });
    },

    reelStop(i) {
      tone(110 - i * 6, 0.16, { type: 'sine', vol: 0.5, attack: 0.004 });
      noiseBurst(0.07, { vol: 0.22, fc: 2600, q: 1.5 });
    },

    scatter(n) {
      const f = 740 * Math.pow(1.19, n);
      tone(f, 0.5, { type: 'sine', vol: 0.35 });
      tone(f * 2, 0.4, { type: 'sine', vol: 0.16, delay: 0.03 });
      tone(f * 3, 0.3, { type: 'sine', vol: 0.07, delay: 0.05 });
    },

    anticipation() {
      for (let i = 0; i < 9; i++)
        tone(420 + i * 55, 0.1, { type: 'triangle', vol: 0.14, delay: i * 0.13 });
    },

    coin() {
      const f = 1400 + Math.random() * 1400;
      tone(f, 0.1, { type: 'sine', vol: 0.12 });
      tone(f * 1.5, 0.07, { type: 'sine', vol: 0.07, delay: 0.02 });
    },

    win(level) {
      // level 0..2 — small/medium/large line win chord
      const base = [523, 659, 784];
      const root = base[Math.min(level, 2)];
      [1, 1.25, 1.5, 2].forEach((m, i) =>
        tone(root * m, 0.45, { type: 'triangle', vol: 0.16, delay: i * 0.06 }));
    },

    bigwin() {
      const seq = [392, 523, 659, 784, 1046, 1318, 1568];
      seq.forEach((f, i) => {
        tone(f, 0.5, { type: 'triangle', vol: 0.2, delay: i * 0.12 });
        tone(f / 2, 0.5, { type: 'sine', vol: 0.12, delay: i * 0.12 });
      });
      noiseBurst(0.7, { vol: 0.1, fc: 5000, q: 0.5, delay: 0.85 });
    },

    fsTrigger() {
      [330, 392, 494, 587, 740, 880].forEach((f, i) => {
        tone(f, 0.55, { type: 'sawtooth', vol: 0.07, delay: i * 0.14 });
        tone(f * 2, 0.4, { type: 'sine', vol: 0.12, delay: i * 0.14 });
      });
      tone(55, 1.6, { type: 'sine', vol: 0.3 });
    },

    buy() { tone(880, 0.2, { type: 'sine', vol: 0.25 }); tone(1174, 0.3, { type: 'sine', vol: 0.22, delay: 0.12 }); },

    error() { tone(160, 0.22, { type: 'square', vol: 0.1 }); tone(120, 0.3, { type: 'square', vol: 0.1, delay: 0.12 }); }
  };
})();
