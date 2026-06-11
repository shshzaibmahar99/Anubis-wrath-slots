/* Anubis Wrath — BET 777 : synthesized audio engine (no asset files) */
const SND = (() => {
  let ac = null, master = null, muted = false, spinSrc = null;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.65;
    master.connect(ac.destination);
    ambience();
    music();
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
    dg.gain.value = 0.045;
    drone.connect(dg).connect(master); drone.start();

    const len = ac.sampleRate * 4;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const wind = ac.createBufferSource(); wind.buffer = buf; wind.loop = true;
    const wf = ac.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 320; wf.Q.value = 0.6;
    const wg = ac.createGain(); wg.gain.value = 0.015;
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 0.09; lg.gain.value = 0.01;
    lfo.connect(lg).connect(wg.gain); lfo.start();
    wind.connect(wf).connect(wg).connect(master); wind.start();
  }

  /* ----- continuous generative score: D phrygian-dominant, frame drums ----- */
  let musicBus = null, musicTimer = null;
  const ROOT = 146.83; // D3
  const SCALE = [1, 16 / 15, 5 / 4, 4 / 3, 3 / 2, 8 / 5, 16 / 9, 2]; // hicaz/phrygian dominant
  let mStep = 0, mNext = 0, mDeg = 0, phraseRest = 0;

  function music() {
    musicBus = ac.createGain();
    musicBus.gain.value = 0.40;
    musicBus.connect(master);
    // desert echo
    const dly = ac.createDelay(1.2);
    dly.delayTime.value = 0.42;
    const fb = ac.createGain(); fb.gain.value = 0.32;
    const wet = ac.createGain(); wet.gain.value = 0.4;
    dly.connect(fb).connect(dly);
    dly.connect(wet).connect(musicBus);
    music.send = node => { node.connect(musicBus); node.connect(dly); };

    mNext = ac.currentTime + 0.2;
    const spb = 60 / 84 / 2; // eighth notes @ 84bpm
    musicTimer = setInterval(() => {
      if (muted) { mNext = Math.max(mNext, ac.currentTime + 0.1); return; }
      while (mNext < ac.currentTime + 0.9) {
        scheduleStep(mStep, mNext, spb);
        mStep++; mNext += spb;
      }
    }, 220);
  }

  function ney(freq, t0, dur, vol) {
    // breathy reed flute: detuned pair + vibrato + lowpass
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.06);
    g.gain.setValueAtTime(vol, t0 + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const f = ac.createBiquadFilter();
    f.type = 'lowpass'; f.frequency.value = 1500; f.Q.value = 1.5;
    const vib = ac.createOscillator(), vg = ac.createGain();
    vib.frequency.value = 5.4; vg.gain.value = freq * 0.006;
    vib.connect(vg);
    [0, 1.5].forEach(det => {
      const o = ac.createOscillator();
      o.type = det ? 'sawtooth' : 'triangle';
      o.frequency.value = freq + det;
      vg.connect(o.frequency);
      const og = ac.createGain(); og.gain.value = det ? 0.25 : 1;
      o.connect(og).connect(f);
      o.start(t0); o.stop(t0 + dur + 0.05);
    });
    vib.start(t0); vib.stop(t0 + dur + 0.05);
    f.connect(g);
    music.send(g);
  }

  function dum(t0, vol = 0.5) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t0);
    o.frequency.exponentialRampToValueAtTime(54, t0 + 0.16);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
    o.connect(g); music.send(g);
    o.start(t0); o.stop(t0 + 0.35);
  }

  function tek(t0, vol = 0.16) {
    const len = (0.06 * ac.sampleRate) | 0;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 2;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.06);
    s.connect(f).connect(g); music.send(g);
    s.start(t0);
  }

  function scheduleStep(step, t0, spb) {
    const b = step % 16;
    // maqsum-flavoured frame drum
    if (b === 0 || b === 6 || b === 8) dum(t0, b === 0 ? 0.9 : 0.65);
    if (b === 4 || b === 12 || b === 14) tek(t0, 0.3);
    if (b === 10 && Math.random() < 0.5) tek(t0, 0.18);
    // distant fire crackle
    if (Math.random() < 0.3) {
      const len = ((0.02 + Math.random() * 0.05) * ac.sampleRate) | 0;
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const s = ac.createBufferSource(); s.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass';
      f.frequency.value = 2800 + Math.random() * 2600; f.Q.value = 1.4;
      const g = ac.createGain(); g.gain.value = 0.05 + Math.random() * 0.08;
      s.connect(f).connect(g).connect(master);
      s.start(t0 + Math.random() * spb);
    }
    // low drone reinforcement each bar
    if (b === 0) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = ROOT / 2;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + spb * 16);
      o.connect(f).connect(g); music.send(g);
      o.start(t0); o.stop(t0 + spb * 16 + 0.1);
    }
    // warm pad swell (root + fifth) every half bar phrase
    if (b === 0 || b === 8) {
      [1, 1.5].forEach(m => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = ROOT * m;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.07, t0 + spb * 3);
        g.gain.linearRampToValueAtTime(0.0001, t0 + spb * 8);
        o.connect(g); music.send(g);
        o.start(t0); o.stop(t0 + spb * 8 + 0.1);
      });
    }
    // wandering melody phrase on off-structure
    if (b % 2 === 0) {
      if (phraseRest > 0) { phraseRest--; return; }
      if (Math.random() < 0.45) return;
      const moves = [-2, -1, -1, 0, 1, 1, 2, 3];
      mDeg += moves[(Math.random() * moves.length) | 0];
      if (mDeg < 0) mDeg = 0;
      if (mDeg > 7) mDeg = 7;
      const oct = mDeg === 7 ? 1 : 2;
      const freq = ROOT * SCALE[mDeg % 8] * oct;
      const dur = spb * (Math.random() < 0.3 ? 4 : 2) * 0.95;
      ney(freq, t0, dur, 0.19);
      if (Math.random() < 0.22) phraseRest = 2 + ((Math.random() * 3) | 0);
    }
  }

  return {
    init,
    setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.65; },
    isMuted() { return muted; },

    click() { tone(640, 0.07, { type: 'triangle', vol: 0.22 }); tone(1280, 0.05, { type: 'sine', vol: 0.1, delay: 0.015 }); },

    blip(up) {
      // bet +/- ticks
      const f = up ? 760 : 520;
      tone(f, 0.06, { type: 'triangle', vol: 0.24 });
      tone(f * 1.5, 0.05, { type: 'sine', vol: 0.12, delay: 0.03 });
    },

    open() { tone(440, 0.12, { type: 'sine', vol: 0.2 }); tone(660, 0.14, { type: 'sine', vol: 0.16, delay: 0.06 }); },
    close() { tone(660, 0.1, { type: 'sine', vol: 0.16 }); tone(440, 0.12, { type: 'sine', vol: 0.18, delay: 0.05 }); },

    spinStart() {
      noiseBurst(0.35, { vol: 0.18, fc: 900, q: 0.8 });
      tone(180, 0.3, { type: 'sawtooth', vol: 0.08, slide: 220 });
      if (spinSrc) { try { spinSrc.stop(); } catch (e) {} }
      spinSrc = noiseBurst(1.6, { vol: 0.05, fc: 2400, q: 0.4 });
    },

    reelStop(i) {
      tone(110 - i * 6, 0.16, { type: 'sine', vol: 0.5, attack: 0.004 });
      tone(420 - i * 18, 0.05, { type: 'triangle', vol: 0.22, attack: 0.002 });
      noiseBurst(0.06, { vol: 0.2, fc: 2200, q: 1.2 });
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
      // harp glissando over the score's scale — longer/higher for bigger wins
      const notes = 5 + level * 2;
      for (let i = 0; i < notes; i++) {
        const f = ROOT * 2 * SCALE[i % 8] * (i >= 8 ? 2 : 1);
        tone(f, 0.5, { type: 'triangle', vol: 0.15, delay: i * 0.055 });
        tone(f * 2, 0.3, { type: 'sine', vol: 0.05, delay: i * 0.055 });
      }
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
