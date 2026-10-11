/* (c) 2026 Cristian - Turbo Riviera. CC BY-NC 4.0: libero uso, copia e modifica con citazione dell'autore, ma vietata la vendita / free to use, share and modify with credit, NO commercial use or sale. See LICENSE. */
/* Turbo Riviera - audio: musiche originali sintetizzate con Web Audio + effetti */
'use strict';
var TR = window.TR = window.TR || {};
(function () {
  var AC = null, master = null, musicBus = null, sfxBus = null, delay = null, delayFb = null, delayWet = null, noiseBuf = null;
  var muted = false;
  try { muted = JSON.parse(localStorage.getItem('tr_mute') || 'false'); } catch (e) { }

  function init() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return true; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; return false; }
    master = AC.createGain(); master.gain.value = muted ? 0 : 0.85;
    var comp = AC.createDynamicsCompressor();
    comp.threshold.value = -12; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.2;
    master.connect(comp); comp.connect(AC.destination);
    musicBus = AC.createGain(); musicBus.gain.value = 0.5; musicBus.connect(master);
    sfxBus = AC.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
    delay = AC.createDelay(1.5); delay.delayTime.value = 0.3;
    delayFb = AC.createGain(); delayFb.gain.value = 0.3;
    delayWet = AC.createGain(); delayWet.gain.value = 0.25;
    var dl = AC.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2500;
    delay.connect(dl); dl.connect(delayFb); delayFb.connect(delay); dl.connect(delayWet); delayWet.connect(musicBus);
    var n = AC.sampleRate * 2; noiseBuf = AC.createBuffer(1, n, AC.sampleRate);
    var d = noiseBuf.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    makeEngine();
    // la musica viene programmata anche da un timer, così continua se il disegno rallenta
    setInterval(tick, 120);
    queue = [0, 1, 2, 3];
    if (cur >= 0) { var c0 = cur; cur = -1; playSong(c0); }
    else loadSong(queue.shift());
    return true;
  }

  /* ---------- strumenti ---------- */
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function lead(m, t, dur, v, ins) {
    var f = mtof(m), o1 = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
    o1.type = ins.w1; o2.type = ins.w2; o1.frequency.value = f; o2.frequency.value = f * (ins.oct2 || 1); o2.detune.value = ins.det || 7;
    fl.type = 'lowpass'; fl.frequency.value = ins.cut || 3000; fl.Q.value = 0.8;
    var g2 = AC.createGain(); g2.gain.value = ins.mix2 == null ? 0.6 : ins.mix2;
    o1.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(musicBus); g.connect(delay);
    if (dur > 0.3) {
      var lfo = AC.createOscillator(), lg = AC.createGain(); lfo.frequency.value = 5.6;
      lg.gain.setValueAtTime(0, t); lg.gain.setValueAtTime(0, t + 0.15); lg.gain.linearRampToValueAtTime(f * 0.011, t + Math.min(dur, 0.5));
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); lfo.start(t); lfo.stop(t + dur + 0.3);
    }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.012);
    g.gain.setTargetAtTime(v * (ins.sus || 0.7), t + 0.012, 0.12);
    g.gain.setTargetAtTime(0, t + dur, 0.05);
    o1.start(t); o2.start(t); o1.stop(t + dur + 0.35); o2.stop(t + dur + 0.35);
  }
  function bass(m, t, dur, v, ins) {
    var o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), fl = AC.createBiquadFilter();
    o.type = ins.bw || 'sawtooth'; o2.type = 'square'; o.frequency.value = mtof(m); o2.frequency.value = mtof(m) / 2;
    var g2 = AC.createGain(); g2.gain.value = 0.35;
    fl.type = 'lowpass'; fl.Q.value = 5;
    fl.frequency.setValueAtTime(ins.bcut || 1600, t); fl.frequency.exponentialRampToValueAtTime(260, t + 0.18);
    o.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(musicBus);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006);
    g.gain.setTargetAtTime(v * 0.6, t + 0.01, 0.1); g.gain.setTargetAtTime(0, t + dur, 0.03);
    o.start(t); o2.start(t); o.stop(t + dur + 0.2); o2.stop(t + dur + 0.2);
  }
  function pad(ms, t, dur, v, ins) {
    var g = AC.createGain(), fl = AC.createBiquadFilter();
    fl.type = 'lowpass'; fl.frequency.value = ins.pcut || 1800; fl.connect(g); g.connect(musicBus);
    if (ins.pdelay) g.connect(delay);
    ms.forEach(function (m) {
      var o = AC.createOscillator(); o.type = ins.pw || 'square'; o.frequency.value = mtof(m); o.detune.value = (Math.random() - 0.5) * 10;
      o.connect(fl); o.start(t); o.stop(t + dur + 0.4);
    });
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + (ins.patk || 0.01));
    g.gain.setTargetAtTime(v * (ins.psus || 0.45), t + 0.02, 0.15); g.gain.setTargetAtTime(0, t + dur, 0.06);
  }
  function noiseHit(t, dur, v, type, freq, q, dest) {
    var s = AC.createBufferSource(); s.buffer = noiseBuf;
    var f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    var g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || musicBus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.02);
  }
  function kick(t, v) {
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.3);
  }
  function snare(t, v) {
    noiseHit(t, 0.17, v * 0.8, 'highpass', 1400, 0.7);
    var o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.08);
    g.gain.setValueAtTime(v * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.12);
  }
  function hat(t, v, open) { noiseHit(t, open ? 0.22 : 0.045, v, 'highpass', 7500, 0.8); }
  function tom(t, v, f) {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine';
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + 0.2);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + 0.27);
  }

  /* ---------- notazione ---------- */
  var NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function nm(s) { var r = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!r) return 0; return 12 * (+r[3] + 1) + NN[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0); }
  var QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], sus4: [0, 5, 7], add9: [0, 4, 7, 14], m9: [0, 3, 7, 10, 14], '6': [0, 4, 7, 9] };
  function chord(s) {
    var r = /^([A-G])([#b]?)(.*)$/.exec(s), root = NN[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
    var q = QUAL[r[3]] || QUAL[''];
    return { root: root, iv: q, third: q[1] };
  }
  var BCH = { R: 0, O: 12, F: 7, f: -5, T: -1, b: 10, N: 2 };

  function compile(s) {
    var ev = [], bars = [];
    s.form.forEach(function (k) { var sec = s.sec[k]; sec.b.forEach(function (b, i) { bars.push({ c: b[0], m: b[1], sec: sec, last: i === sec.b.length - 1 }); }); });
    for (var i = 0; i < bars.length * 16; i++) ev.push([]);
    bars.forEach(function (bar, bi) {
      var base = bi * 16, sec = bar.sec, ch = chord(bar.c);
      // melodia
      var pos = 0;
      if (bar.m) bar.m.split(/\s+/).forEach(function (tok) {
        if (!tok) return;
        var p = tok.split('/'), len = +p[1];
        if (p[0] !== 'r') ev[base + pos].push({ k: 'L', m: nm(p[0]) + (s.mtr || 0), len: len });
        pos += len;
      });
      // batteria
      var dr = s.drums[(bar.last && sec.fill) ? sec.fill : (sec.d || 'main')];
      if (dr) for (var st = 0; st < 16; st++) {
        if (dr.k && dr.k[st] === 'x') ev[base + st].push({ k: 'K' });
        if (dr.s && dr.s[st] === 'x') ev[base + st].push({ k: 'S' });
        if (dr.s && dr.s[st] === 'g') ev[base + st].push({ k: 'S', soft: 1 });
        if (dr.h && dr.h[st] === 'x') ev[base + st].push({ k: 'H' });
        if (dr.h && dr.h[st] === 'o') ev[base + st].push({ k: 'H', open: 1 });
        if (dr.t && dr.t[st] !== '.' && dr.t[st]) ev[base + st].push({ k: 'T', f: { h: 260, m: 190, l: 130 }[dr.t[st]] });
      }
      // basso
      var bp = s.bass[sec.bs || 'main'];
      if (bp) for (st = 0; st < 16; st++) {
        var c = bp[st]; if (c === '.' || c === '-') continue;
        var off = c === 'T' ? ch.third : BCH[c]; if (off == null) continue;
        var l = 1; while (st + l < 16 && bp[st + l] === '-') l++;
        ev[base + st].push({ k: 'B', m: 36 + ((ch.root + 12 - 4) % 12) + 4 + off, len: Math.max(l, 1) });
      }
      // accordi
      var pp = s.pad[sec.ps || 'main'];
      if (pp) for (st = 0; st < 16; st++) {
        if (pp[st] !== 'x' && pp[st] !== 'H') continue;
        var l2 = 1; while (st + l2 < 16 && pp[st + l2] === '-') l2++;
        var rootM = 48 + ((ch.root + 12 - 5) % 12) + 5;
        ev[base + st].push({ k: 'P', m: ch.iv.slice(0, 3).map(function (x) { return rootM + x; }), len: l2 });
      }
    });
    return { ev: ev, steps: bars.length * 16 };
  }

  /* ---------- le canzoni (composizioni originali) ---------- */
  var SONGS = [
    { name: 'Blue Wave', fm: '88.6', bpm: 146, mtr: 0,
      ins: { w1: 'square', w2: 'sawtooth', det: 9, cut: 3600, sus: 0.75, mix2: 0.45, pw: 'square', pcut: 2200, psus: 0.35, bcut: 1800 }, vol: { L: 0.15, B: 0.26, P: 0.07, K: 0.75, S: 0.38, H: 0.07 },
      drums: {
        main: { k: 'x.....x...x.....', s: '....x.......x..g', h: 'x.xxx.xxx.xxx.xo' },
        brk: { k: 'x.........x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.xo' },
        fill: { k: 'x.....x...x.....', s: '....x...x.xxxxxx', h: 'x.x.x.x.........', t: '..........hhmmll' }
      },
      bass: { main: 'R.RO.RO.R.RO.RF.', brk: 'R.......R.O.R...' },
      pad: { main: 'x--x--x---x--x--', brk: 'H---------------' },
      sec: {
        A: { fill: 'fill', b: [
          ['Fmaj7', 'A5/3 G5/1 A5/2 C6/2 E6/4 C6/4'], ['G', 'D5/2 E5/2 G5/4 r/2 E5/2 D5/2 B4/2'],
          ['Em7', 'E5/6 G5/2 B5/4 A5/2 G5/2'], ['Am7', 'A5/8 r/4 E5/2 G5/2'],
          ['Dm7', 'F5/3 E5/1 F5/2 A5/2 C6/4 A5/4'], ['Em7', 'G5/2 A5/2 B5/4 r/2 G5/2 E5/2 D5/2'],
          ['Fmaj7', 'C5/2 E5/2 A5/4 G5/2 F5/2 E5/2 C5/2'], ['G', 'D5/8 r/4 G4/2 B4/2']] },
        B: { fill: 'fill', b: [
          ['Cmaj7', 'E5/2 G5/2 B5/2 C6/6 B5/2 G5/2'], ['Am7', 'A5/4 E5/2 C5/2 E5/4 G5/4'],
          ['Dm7', 'F5/2 A5/2 D6/4 C6/2 A5/2 F5/4'], ['G', 'G5/6 F5/2 E5/2 D5/2 B4/4'],
          ['Cmaj7', 'E5/2 G5/2 B5/2 C6/6 D6/2 E6/2'], ['Am7', 'C6/4 B5/2 A5/2 E5/4 C5/4'],
          ['Fmaj7', 'A5/2 C6/2 F6/4 E6/2 C6/2 A5/4'], ['G7', 'B5/4 D6/4 F6/2 E6/2 D6/2 B5/2']] },
        C: { d: 'brk', bs: 'brk', ps: 'brk', fill: 'fill', b: [
          ['Am7', 'r/16'], ['G', 'r/8 B4/2 D5/2 G5/4'], ['Fmaj7', 'A5/12 r/4'], ['G', 'r/4 D5/2 E5/2 G5/4 B5/4']] }
      },
      form: ['A', 'A', 'B', 'C', 'A', 'B'] },

    { name: 'Summer Breeze', fm: '94.2', bpm: 120, mtr: 0,
      ins: { w1: 'triangle', w2: 'square', det: 4, cut: 2600, sus: 0.65, mix2: 0.25, pw: 'triangle', pcut: 2600, psus: 0.55, patk: 0.03, pdelay: 1, bcut: 1200, bw: 'sawtooth' }, vol: { L: 0.24, B: 0.28, P: 0.12, K: 0.7, S: 0.3, H: 0.06 },
      drums: {
        main: { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
        fill: { k: 'x.......x.x.....', s: '....x.......x.gg', h: 'x.x.x.x.x.x.x.o.' }
      },
      bass: { main: 'R...R.O.R...F.O.' },
      pad: { main: 'x-------x--x----' },
      sec: {
        A: { fill: 'fill', b: [
          ['Gmaj7', 'F#5/6 E5/2 D5/4 B4/4'], ['F#m7', 'C#5/4 E5/4 A5/8'],
          ['Em7', 'G5/6 F#5/2 E5/4 D5/2 E5/2'], ['A', 'C#5/8 r/4 A4/2 C#5/2'],
          ['Gmaj7', 'D5/2 F#5/2 A5/4 B5/6 A5/2'], ['F#m7', 'A5/4 F#5/2 E5/2 C#5/8'],
          ['Bm7', 'D5/4 F#5/4 B5/4 A5/2 F#5/2'], ['A', 'E5/12 r/4']] },
        B: { fill: 'fill', b: [
          ['Em7', 'B4/2 D5/2 E5/2 G5/4 F#5/2 E5/2 D5/2'], ['A7', 'E5/6 C#5/2 A4/4 G5/4'],
          ['F#m7', 'F#5/6 E5/2 C#5/4 A4/4'], ['Bm7', 'B4/2 C#5/2 D5/2 F#5/4 E5/2 D5/2 C#5/2'],
          ['Em7', 'G5/4 B5/4 D6/4 C#6/2 B5/2'], ['A7', 'A5/6 G5/2 E5/4 C#5/4'],
          ['Dmaj7', 'D5/2 F#5/2 A5/2 C#6/10'], ['Dmaj7', 'r/16']] }
      },
      form: ['A', 'A', 'B', 'B', 'A'] },

    { name: 'Fire on the Sea', fm: '101.7', bpm: 160, mtr: 0,
      ins: { w1: 'sawtooth', w2: 'square', det: 12, cut: 3200, sus: 0.8, mix2: 0.5, pw: 'sawtooth', pcut: 1500, psus: 0.4, bcut: 2000 }, vol: { L: 0.13, B: 0.27, P: 0.07, K: 0.8, S: 0.42, H: 0.07 },
      drums: {
        main: { k: 'x...x...x...x...', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
        fill: { k: 'x...x...x.......', s: '....x.......xxxx', h: 'x.x.x.x.x.......', t: '........hhmmll..' }
      },
      bass: { main: 'R.R.R.R.R.R.R.O.' },
      pad: { main: 'x-----x-----x---' },
      sec: {
        A: { fill: 'fill', b: [
          ['Em', 'E5/2 E5/2 G5/2 B5/4 A5/2 G5/2 F#5/2'], ['C', 'E5/4 G5/2 C6/6 B5/2 G5/2'],
          ['D', 'F#5/2 A5/2 D6/4 C6/2 A5/2 F#5/4'], ['B7', 'D#5/4 F#5/4 B5/8'],
          ['Em', 'B5/2 A5/2 G5/2 E5/4 G5/2 B5/2 E6/2'], ['C', 'E6/4 D6/2 C6/2 G5/4 E5/4'],
          ['Am', 'A5/2 C6/2 E6/4 D6/2 C6/2 A5/4'], ['B7', 'B5/6 A5/2 F#5/4 D#5/4']] },
        B: { fill: 'fill', b: [
          ['C', 'G5/4 E5/2 G5/2 C6/8'], ['D', 'A5/4 F#5/2 A5/2 D6/8'],
          ['Bm', 'F#5/4 D5/2 F#5/2 B5/6 A5/2'], ['Em', 'G5/12 r/4'],
          ['C', 'C6/2 B5/2 G5/2 E5/2 C6/2 B5/2 G5/2 E5/2'], ['D', 'D6/2 C6/2 A5/2 F#5/2 D6/2 C6/2 A5/2 F#5/2'],
          ['B7', 'B5/4 A5/4 F#5/4 D#5/4'], ['B7', 'B4/2 D#5/2 F#5/2 A5/2 B5/8']] }
      },
      form: ['A', 'A', 'B', 'A', 'B', 'B'] },

    { name: 'Last Sunset', fm: '', bpm: 84, mtr: 0, hidden: 1,
      ins: { w1: 'triangle', w2: 'sawtooth', det: 6, cut: 2200, sus: 0.7, mix2: 0.2, pw: 'triangle', pcut: 2400, psus: 0.6, patk: 0.08, pdelay: 1, bcut: 1000 }, vol: { L: 0.26, B: 0.26, P: 0.13, K: 0.6, S: 0.25, H: 0.05 },
      drums: { main: { k: 'x.......x.......', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' } },
      bass: { main: 'R.......F...O...' },
      pad: { main: 'H---------------' },
      sec: {
        A: { b: [
          ['Cmaj7', 'E5/8 D5/4 B4/4'], ['Bm7', 'D5/8 F#5/4 A5/4'], ['Am7', 'G5/6 E5/2 C5/8'], ['D', 'D5/12 r/4'],
          ['Cmaj7', 'E5/4 G5/4 B5/8'], ['Bm7', 'A5/4 F#5/4 D5/8'], ['Em7', 'E5/8 G5/4 B5/4'], ['D', 'A5/16']] }
      },
      form: ['A'] }
  ];
  SONGS.forEach(function (s) { s.c = compile(s); });

  var cur = -1, step = 0, nextT = 0, songVol = 1;
  function playSong(i) {
    if (!AC) { cur = i; return; }
    if (cur === i && (srcNode || nextT > 0)) return;
    cur = i; step = 0; nextT = 0;
    stopBuf();
    if (i < 0) return;
    if (!useSynth) { if (bufs[i]) startBuf(i); else { queue = queue.filter(function (k) { return k !== i; }); if (!Object.keys(loading).some(function (k) { return loading[k]; })) loadSong(i); else queue.unshift(i); } }
  }
  function stopSong() { cur = -1; nextT = 0; stopBuf(); }
  function tick() {
    if (!AC || cur < 0 || !useSynth) return;
    if (nextT === 0) { nextT = AC.currentTime + 0.08; delay.delayTime.value = (60 / SONGS[cur].bpm) * 0.75; }
    var s = SONGS[cur], sp = 60 / s.bpm / 4;
    if (nextT < AC.currentTime - 1.0) nextT = AC.currentTime + 0.05;
    while (nextT < AC.currentTime + 0.6) {
      playStep(s, s.c.ev[step], nextT, sp);
      step = (step + 1) % s.c.steps; nextT += sp;
    }
  }
  function playStep(s, evs, t, sp) {
    var v = s.vol, ins = s.ins;
    for (var i = 0; i < evs.length; i++) {
      var e = evs[i];
      switch (e.k) {
        case 'L': lead(e.m, t, e.len * sp * 0.92, v.L, ins); break;
        case 'B': bass(e.m, t, e.len * sp * 0.85, v.B, ins); break;
        case 'P': pad(e.m, t, e.len * sp * 0.9, v.P, ins); break;
        case 'K': kick(t, v.K); break;
        case 'S': snare(t, e.soft ? v.S * 0.45 : v.S); break;
        case 'H': hat(t, v.H, e.open); break;
        case 'T': tom(t, v.K * 0.6, e.f); break;
      }
    }
  }

  /* ---------- registrazione dei brani (usata una volta per creare i file in music/) ---------- */
  function renderOffline(i, sr) {
    var s = SONGS[i], sp = 60 / s.bpm / 4, len = s.c.steps * sp, N = Math.round(len * sr), tail = 4;
    var oc = new OfflineAudioContext(2, N + tail * sr, sr);
    var save = [AC, musicBus, delay, noiseBuf];
    AC = oc;
    musicBus = oc.createGain(); musicBus.gain.value = 0.5; musicBus.connect(oc.destination);
    delay = oc.createDelay(1.5); delay.delayTime.value = (60 / s.bpm) * 0.75;
    var fb = oc.createGain(); fb.gain.value = 0.3; var wet = oc.createGain(); wet.gain.value = 0.25;
    var dl = oc.createBiquadFilter(); dl.type = 'lowpass'; dl.frequency.value = 2500;
    delay.connect(dl); dl.connect(fb); fb.connect(delay); dl.connect(wet); wet.connect(musicBus);
    var n = sr * 2; noiseBuf = oc.createBuffer(1, n, sr); var d = noiseBuf.getChannelData(0); for (var k = 0; k < n; k++) d[k] = Math.random() * 2 - 1;
    for (var st = 0; st < s.c.steps; st++) playStep(s, s.c.ev[st], st * sp, sp);
    AC = save[0]; musicBus = save[1]; delay = save[2]; noiseBuf = save[3];
    return oc.startRendering().then(function (buf) {
      var out = [];
      for (var c = 0; c < 2; c++) {
        var src = buf.getChannelData(c), o = new Float32Array(N);
        o.set(src.subarray(0, N));
        for (var j = N; j < src.length; j++) o[j - N] += src[j]; // la coda torna all'inizio: giro continuo senza stacchi
        out.push(o);
      }
      return { sr: sr, data: out };
    });
  }

  /* ---------- riproduzione dai file registrati (leggera per il processore del monitor) ---------- */
  var bufs = {}, loading = {}, srcNode = null, srcGain = null, useSynth = false, queue = [];
  var MU = new Float32Array(256);
  for (var q = 0; q < 256; q++) { var y = q / 127.5 - 1; MU[q] = (y < 0 ? -1 : 1) * (Math.pow(256, Math.abs(y)) - 1) / 255; }
  function loadSong(i, cb) {
    if (i == null) return;
    if (bufs[i]) { if (queue.length) loadSong(queue.shift()); return; }
    if (loading[i]) { return; }
    loading[i] = true;
    if (TR.MUSIC && TR.MUSIC[i]) {
      // PCM mu-law decodificato a pezzi, così l'immagine non si blocca
      try {
        var m = TR.MUSIC[i], bin = atob(m.d), n = m.n, f = new Float32Array(n), pos = 0;
        var step = function () {
          var end = Math.min(n, pos + 120000);
          for (; pos < end; pos++) f[pos] = MU[bin.charCodeAt(pos)];
          if (pos < n) { setTimeout(step, 0); return; }
          var b = AC.createBuffer(1, n, m.sr); b.getChannelData(0).set(f);
          bufs[i] = b; loading[i] = false; bin = null;
          if (cur === i) startBuf(i);
          if (queue.length) loadSong(queue.shift());
        };
        setTimeout(step, 0);
      } catch (e) { useSynth = true; loading[i] = false; }
      return;
    }
    var x = new XMLHttpRequest();
    x.open('GET', 'music/song' + i + '.ogg', true); x.responseType = 'arraybuffer';
    x.onload = function () {
      if (!x.response || !x.response.byteLength) { useSynth = true; loading[i] = false; return; }
      AC.decodeAudioData(x.response, function (b) { bufs[i] = b; loading[i] = false; if (cur === i) startBuf(i); }, function () { useSynth = true; loading[i] = false; if (cur === i) { nextT = 0; } });
    };
    x.onerror = function () { useSynth = true; loading[i] = false; };
    x.send();
  }
  function stopBuf() {
    if (srcNode) { try { var g = srcGain; g.gain.setTargetAtTime(0, AC.currentTime, 0.05); srcNode.stop(AC.currentTime + 0.3); } catch (e) { } srcNode = null; }
  }
  function startBuf(i) {
    stopBuf();
    var s = AC.createBufferSource(); s.buffer = bufs[i]; s.loop = true; s.loopStart = 0; s.loopEnd = Math.min(bufs[i].duration, SONGS[i].c.steps * 15 / SONGS[i].bpm);
    srcGain = AC.createGain(); srcGain.gain.value = 1;
    s.connect(srcGain); srcGain.connect(master); s.start(AC.currentTime + 0.02);
    srcNode = s;
  }

  /* ---------- motore e rumori continui ---------- */
  var eng = null;
  function makeEngine() {
    eng = {};
    eng.o1 = AC.createOscillator(); eng.o1.type = 'sawtooth';
    eng.o2 = AC.createOscillator(); eng.o2.type = 'square';
    eng.f = AC.createBiquadFilter(); eng.f.type = 'lowpass'; eng.f.frequency.value = 500; eng.f.Q.value = 3;
    eng.g = AC.createGain(); eng.g.gain.value = 0;
    var g2 = AC.createGain(); g2.gain.value = 0.5;
    eng.o1.connect(eng.f); eng.o2.connect(g2); g2.connect(eng.f); eng.f.connect(eng.g); eng.g.connect(sfxBus);
    eng.o1.start(); eng.o2.start();
    function loopNoise(type, freq, q) {
      var s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
      var f = AC.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      var g = AC.createGain(); g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(sfxBus); s.start();
      return g;
    }
    eng.skid = loopNoise('bandpass', 2100, 3);
    eng.rumble = loopNoise('lowpass', 260, 1);
    eng.wind = loopNoise('bandpass', 900, 0.5);
  }
  function engine(on, rpm, skid, offroad, spd) {
    if (!eng) return;
    var t = AC.currentTime, f = 38 + rpm * 120;
    eng.o1.frequency.setTargetAtTime(f, t, 0.05); eng.o2.frequency.setTargetAtTime(f * 0.5, t, 0.05);
    eng.f.frequency.setTargetAtTime(300 + rpm * 900, t, 0.05);
    eng.g.gain.setTargetAtTime(on ? 0.05 + rpm * 0.05 : 0, t, 0.08);
    eng.skid.gain.setTargetAtTime(on && skid ? 0.09 : 0, t, 0.05);
    eng.rumble.gain.setTargetAtTime(on && offroad ? 0.35 * Math.min(1, spd * 2 + 0.2) : 0, t, 0.05);
    eng.wind.gain.setTargetAtTime(on ? spd * spd * 0.05 : 0, t, 0.1);
  }

  /* ---------- effetti ---------- */
  function tone(f, dur, type, vol, slideTo, when) {
    if (!AC) return;
    var t = when || AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol || 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + dur + 0.02);
  }
  function arp(notes, stp, type, vol) { if (!AC) return; var t = AC.currentTime; notes.forEach(function (m, i) { tone(mtof(m), stp * 1.8, type || 'square', vol || 0.12, 0, t + i * stp); }); }
  var SFX = {
    beep: function () { tone(660, 0.25, 'square', 0.18); },
    go: function () { tone(1320, 0.7, 'square', 0.18); },
    select: function () { tone(1046, 0.06, 'square', 0.1); },
    ok: function () { arp([72, 79, 84], 0.05, 'square', 0.12); },
    shift: function () { tone(180, 0.12, 'square', 0.12, 90); },
    bump: function () { if (!AC) return; tone(110, 0.2, 'triangle', 0.5, 50); noiseHit(AC.currentTime, 0.15, 0.4, 'lowpass', 900, 1, sfxBus); },
    crash: function () {
      if (!AC) return; var t = AC.currentTime;
      noiseHit(t, 0.8, 0.5, 'lowpass', 1200, 1, sfxBus); tone(90, 0.5, 'sawtooth', 0.25, 35); noiseHit(t + 0.5, 0.5, 0.3, 'lowpass', 700, 1, sfxBus);
    },
    checkpoint: function () { arp([72, 76, 79, 84, 79, 84, 88], 0.07, 'square', 0.14); },
    goal: function () { arp([67, 72, 76, 79, 84, 88, 91, 96], 0.09, 'square', 0.15); },
    tick: function () { tone(1760, 0.05, 'square', 0.09); },
    radio: function () { if (!AC) return; noiseHit(AC.currentTime, 0.3, 0.25, 'bandpass', 2500, 0.6, sfxBus); tone(3000, 0.06, 'sine', 0.05); },
    splash: function () { if (!AC) return; noiseHit(AC.currentTime, 0.3, 0.3, 'bandpass', 1800, 0.7, sfxBus); tone(260, 0.18, 'triangle', 0.2, 120); },
    pause: function () { arp([79, 72], 0.08, 'square', 0.12); },
    letter: function () { tone(880, 0.05, 'square', 0.1); },
    over: function () { arp([72, 71, 70, 69, 67, 60], 0.14, 'triangle', 0.18); }
  };

  function setMute(m) {
    muted = m; try { localStorage.setItem('tr_mute', JSON.stringify(m)); } catch (e) { }
    if (master) master.gain.setTargetAtTime(m ? 0 : 0.85, AC.currentTime, 0.02);
  }
  function suspend(s) { if (!AC) return; try { if (s) AC.suspend(); else AC.resume(); } catch (e) { } }

  TR.audio = {
    init: init, tick: tick, playSong: playSong, stopSong: stopSong, engine: engine, sfx: SFX,
    setMute: setMute, isMuted: function () { return muted; }, suspend: suspend,
    songs: SONGS, renderOffline: renderOffline, status: function () { return { synth: useSynth, loaded: Object.keys(bufs).map(function (k) { return k + ":" + bufs[k].duration.toFixed(2); }), playing: !!srcNode }; }, current: function () { return cur; }, ctx: function () { return AC; }
  };
})();
