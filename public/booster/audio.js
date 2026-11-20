/* ZENKAI 2027 — sons synthétisés (Web Audio), aucun fichier externe. */
(function () {
  let ctx = null, master, music, sfx, rev, noiseBuf, amb = null, muted = false;
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0; music.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(master);
    // réverbe synthétique
    rev = ctx.createConvolver();
    const len = ctx.sampleRate * 2.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = 0.35; rev.connect(rg); rg.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }
  const now = () => ctx.currentTime;
  function env(g, t, a, peak, d, end = 0.0001) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d);
  }
  function noise(t, dur, type, f0, f1, q, peak, a = 0.01, wet = 0.3) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, a, peak, dur);
    s.connect(f); f.connect(g); g.connect(sfx); const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(rev);
    s.start(t, Math.random()); s.stop(t + a + dur + 0.05);
  }
  function tone(t, freq, dur, type = "sine", peak = 0.2, a = 0.005, f1 = null, wet = 0.4) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, a, peak, dur);
    o.connect(g); g.connect(sfx); const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(rev);
    o.start(t); o.stop(t + a + dur + 0.05);
  }
  const A = {
    init, get ready() { return !!ctx; },
    mute(m) { muted = m; if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.8, now(), 0.05); },
    get muted() { return muted; },
    ambient(on, fade = 1.5) {
      if (!ctx) return;
      if (on && !amb) {
        amb = [];
        [55, 82.4, 110.0, 164.8].forEach((f, i) => {
          [0, 1].forEach(k => {
            const o = ctx.createOscillator(); o.type = i < 2 ? "sawtooth" : "triangle"; o.frequency.value = f * (1 + (k ? 0.004 : -0.004));
            const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420 + i * 120;
            const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07 + i * 0.03; const lg = ctx.createGain(); lg.gain.value = 160;
            lfo.connect(lg); lg.connect(lp.frequency);
            const g = ctx.createGain(); g.gain.value = 0.05 / (i + 1);
            o.connect(lp); lp.connect(g); g.connect(music); o.start(); lfo.start(); amb.push(o, lfo);
          });
        });
      }
      music.gain.cancelScheduledValues(now());
      music.gain.setTargetAtTime(on ? 0.9 : 0.0001, now(), fade / 3);
    },
    cut() { if (ctx) { music.gain.cancelScheduledValues(now()); music.gain.setValueAtTime(0.0001, now()); } },
    tint(type) { // couleur de l'ambiance
      if (!ctx || !amb) return;
    },
    hover() { if (!ctx) return; noise(now(), 0.08, "bandpass", 3000, 5000, 3, 0.03); },
    crinkle(n = 6, spread = 0.35) {
      if (!ctx) return; const t = now();
      for (let i = 0; i < n; i++) { const tt = t + Math.random() * spread; noise(tt, 0.04 + Math.random() * 0.07, "bandpass", 2000 + Math.random() * 5000, 1500 + Math.random() * 4000, 2 + Math.random() * 4, 0.12 + Math.random() * 0.15, 0.002, 0.1); }
    },
    tear() {
      if (!ctx) return; const t = now();
      noise(t, 0.55, "bandpass", 900, 5200, 1.2, 0.45, 0.01, 0.15);
      for (let i = 0; i < 18; i++) noise(t + i * 0.028 + Math.random() * 0.015, 0.025, "highpass", 3000, 6000, 1, 0.18, 0.001, 0.05);
      tone(t + 0.5, 180, 0.4, "sine", 0.12, 0.002, 90);
    },
    lightBurst() {
      if (!ctx) return; const t = now();
      noise(t, 1.6, "lowpass", 300, 6000, 0.7, 0.25, 0.4, 0.6);
      [523.3, 659.3, 784, 1046.5, 1318.5].forEach((f, i) => tone(t + 0.25 + i * 0.07, f, 2.4, "sine", 0.06, 0.02, null, 0.8));
    },
    whoosh(d = 0.6, up = true) { if (!ctx) return; noise(now(), d, "bandpass", up ? 300 : 3000, up ? 3000 : 300, 1.5, 0.25, d * 0.4, 0.3); },
    pop() { if (!ctx) return; tone(now(), 880, 0.15, "sine", 0.08, 0.003, 1320, 0.5); },
    flipChime() {
      if (!ctx) return; const t = now();
      [1046.5, 1568, 2093].forEach((f, i) => tone(t + i * 0.05, f, 1.2, "sine", 0.05, 0.004, null, 0.9));
    },
    mirageStart() {
      if (!ctx) return; const t = now();
      [220, 277.2, 329.6, 440].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = "triangle"; o.frequency.value = f;
        const v = ctx.createOscillator(); v.frequency.value = 5 + i; const vg = ctx.createGain(); vg.gain.value = f * 0.012; v.connect(vg); vg.connect(o.frequency);
        const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
        o.connect(g); g.connect(sfx); const w = ctx.createGain(); w.gain.value = 1; g.connect(w); w.connect(rev);
        o.start(t); v.start(t); o.stop(t + 3.3); v.stop(t + 3.3);
      });
      noise(t, 2.5, "bandpass", 600, 2400, 4, 0.06, 1.0, 1);
    },
    mirageMerge() {
      if (!ctx) return; const t = now();
      noise(t, 0.5, "bandpass", 4000, 800, 2, 0.15, 0.25, 0.6);
      [659.3, 830.6, 987.8, 1318.5, 1661].forEach((f, i) => tone(t + 0.2 + i * 0.06, f, 2.2, "sine", 0.05, 0.01, null, 1));
    },
    eclatFlip() {
      if (!ctx) return; const t = now();
      noise(t, 0.3, "bandpass", 3000, 7000, 3, 0.08, 0.05, 0.4);
      [1318.5, 1975.5].forEach((f, i) => tone(t + 0.15 + i * 0.07, f, 1.0, "sine", 0.05, 0.003, null, 0.8));
    },
    prismeStart() {
      if (!ctx) return; const t = now();
      [1046.5, 1318.5, 1568, 2093, 2637, 3136].forEach((f, i) => tone(t + i * 0.09, f, 0.9, "sine", 0.04, 0.003, null, 0.9));
      noise(t, 1.0, "bandpass", 2000, 8000, 4, 0.05, 0.4, 0.8);
    },
    prismeFlip() {
      if (!ctx) return; const t = now();
      noise(t, 0.4, "bandpass", 1500, 6000, 2, 0.12, 0.1, 0.5);
      [784, 987.8, 1174.7, 1568].forEach((f, i) => tone(t + 0.2 + i * 0.05, f, 1.6, "sine", 0.05, 0.005, null, 1));
    },
    spectreStart() {
      if (!ctx) return; const t = now();
      tone(t, 55, 2.2, "sawtooth", 0.08, 0.6, 41, 0.5);
      noise(t, 1.6, "bandpass", 200, 1800, 3, 0.12, 0.8, 0.8);
      for (let i = 0; i < 14; i++) noise(t + 0.3 + Math.random() * 1.1, 0.03 + Math.random() * 0.05, "highpass", 2500, 7000, 1, 0.12, 0.001, 0.2);
      [233.1, 277.2, 349.2].forEach((f, i) => tone(t + 0.2 + i * 0.1, f, 1.6, "triangle", 0.03, 0.5, f * 0.97, 1));
    },
    spectreFlip() {
      if (!ctx) return; const t = now();
      noise(t, 0.6, "bandpass", 600, 5000, 2, 0.2, 0.3, 0.5);
      tone(t + 0.25, 110, 1.2, "sine", 0.3, 0.003, 55, 0.4);
      [440, 554.4, 698.5, 880].forEach((f, i) => tone(t + 0.3 + i * 0.05, f, 1.8, "sine", 0.045, 0.01, null, 1));
    },
    spin(d = 1.2) { if (!ctx) return; const t = now(); for (let i = 0; i < 9; i++) noise(t + d * (1 - Math.pow(1 - i / 9, 1.6)), 0.12, "bandpass", 500, 2600, 2, 0.12, 0.04, 0.2); },
    stopHit() { if (!ctx) return; tone(now(), 90, 0.5, "sine", 0.35, 0.002, 45, 0.3); },
    rumble(d) {
      if (!ctx) return; const t = now();
      const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.setValueAtTime(38, t); o.frequency.exponentialRampToValueAtTime(70, t + d);
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.setValueAtTime(120, t); lp.frequency.exponentialRampToValueAtTime(900, t + d);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + d); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
      o.connect(lp); lp.connect(g); g.connect(sfx); o.start(t); o.stop(t + d + 0.1);
      noise(t, d, "bandpass", 200, 3000, 1.5, 0.12, d * 0.9, 0.4);
      // montée de voix (accord qui grimpe)
      [196, 246.9, 293.7].forEach(f => tone(t + d * 0.3, f, d * 0.7, "sawtooth", 0.025, d * 0.6, f * 2, 0.6));
    },
    impact() {
      if (!ctx) return; const t = now();
      tone(t, 140, 1.4, "sine", 0.7, 0.002, 32, 0.2);
      noise(t, 1.2, "lowpass", 5000, 200, 0.7, 0.5, 0.002, 0.6);
      tone(t, 60, 2.2, "triangle", 0.25, 0.01, 40, 0.5);
    },
    zenkaiChord() {
      if (!ctx) return; const t = now();
      [65.4, 130.8, 196, 261.6, 329.6, 392].forEach((f, i) => tone(t + i * 0.015, f, 5, i < 2 ? "sawtooth" : "sine", i < 2 ? 0.03 : 0.04, 0.25, null, 0.9));
    },
    // ---- sons « réels » des révélations (papier, air, feu), sans carillons
    slide(out = false) { if (!ctx) return; const t = now(); noise(t, out ? 0.32 : 0.45, "bandpass", out ? 2600 : 1200, out ? 900 : 3200, 1.1, 0.09, out ? 0.02 : 0.12, 0.12); },
    flick(heavy = false) {
      if (!ctx) return; const t = now();
      noise(t, 0.035, "highpass", 2500, 4500, 0.8, heavy ? 0.22 : 0.16, 0.001, 0.08);           // claquement du carton
      noise(t + 0.01, heavy ? 0.4 : 0.22, "bandpass", heavy ? 900 : 1600, heavy ? 260 : 500, 1.3, heavy ? 0.16 : 0.1, 0.03, 0.15); // souffle d'air
      if (heavy) tone(t, 70, 0.6, "sine", 0.18, 0.01, 48, 0.3);
    },
    glass() { if (!ctx) return; const t = now(); noise(t, 1.6, "highpass", 5000, 9000, 0.7, 0.04, 0.7, 0.9); tone(t + 0.2, 1760, 2.2, "sine", 0.012, 0.6, 1764, 1); tone(t + 0.2, 2640, 2.0, "sine", 0.008, 0.7, 2646, 1); },
    fire(d = 2.5) {
      if (!ctx) return; const t = now();
      noise(t, d, "lowpass", 180, 900, 0.6, 0.22, d * 0.6, 0.35);                                // grondement
      noise(t, d, "bandpass", 1200, 2600, 0.9, 0.08, d * 0.7, 0.3);                              // souffle
      for (let i = 0; i < 70; i++) { const k = Math.pow(Math.random(), 0.6); noise(t + 0.2 + k * d, 0.008 + Math.random() * 0.02, "highpass", 2000 + Math.random() * 4000, 3000, 1, 0.05 + Math.random() * 0.12 * k, 0.001, 0.05); }
    },
    whoomph() { if (!ctx) return; const t = now(); noise(t, 0.9, "lowpass", 900, 120, 0.7, 0.28, 0.06, 0.5); tone(t, 62, 1.2, "sine", 0.2, 0.02, 40, 0.3); },
    heat() {
      if (!ctx) return; const t = now();
      noise(t, 2.6, "bandpass", 500, 1400, 2.5, 0.07, 1.4, 0.8);
      [110, 164.8, 220].forEach((f, i) => { const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = f; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.04 / (i + 1), t + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4); o.connect(g); g.connect(sfx); const w = ctx.createGain(); w.gain.value = 0.8; g.connect(w); w.connect(rev); o.start(t); o.stop(t + 3.5); });
    },
    resolve() { if (!ctx) return; const t = now(); [146.8, 220, 293.7, 370].forEach((f, i) => tone(t + i * 0.02, f, 3.2, "sine", 0.035, 0.35, null, 0.9)); },
    dark() { if (!ctx) return; const t = now(); tone(t, 48, 0.9, "sine", 0.18, 0.005, 36, 0.4); noise(t, 0.5, "lowpass", 600, 80, 0.7, 0.12, 0.005, 0.5); },
    cardOut() { if (!ctx) return; noise(now(), 0.35, "bandpass", 2500, 600, 2, 0.12, 0.05, 0.2); },
    close() { if (!ctx) return; noise(now(), 1.2, "lowpass", 5000, 200, 0.7, 0.2, 0.05, 0.6); tone(now(), 392, 1.5, "sine", 0.06, 0.05, 196, 0.8); },
  };
  window.ZKA = A;
})();
