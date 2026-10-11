/* (c) 2026 Cristian - Turbo Riviera. CC BY-NC 4.0: libero uso, copia e modifica con citazione dell'autore, ma vietata la vendita / free to use, share and modify with credit, NO commercial use or sale. See LICENSE. */
/* Turbo Riviera - corsa arcade in pseudo-3D per LG webOS
   Gioco originale in stile anni '90: grafica e musica generate dal codice. */
'use strict';
(function () {
  var TR = window.TR, A = TR.audio, G = TR.gfx, S = G.S;
  var W = 640, H = 360, UW = 1920, UH = 1080, K = UW / W;
  var FONT = '"Arial Black","Arial",Helvetica,sans-serif';
  var cv = document.getElementById('game'), cx = cv.getContext('2d');
  var uv = document.getElementById('ui'), ux = uv.getContext('2d');
  // risoluzione di disegno del mondo (strada, sfondo, sprite): più bassa = più veloce; le coordinate restano 640x360
  var RS = 0.96;
  cv.width = Math.round(W * RS); cv.height = Math.round(H * RS); uv.width = UW; uv.height = UH;
  cx.setTransform(RS, 0, 0, RS, 0, 0);
  cx.imageSmoothingEnabled = false;
  function fit() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H), w = Math.floor(W * s), h = Math.floor(H * s);
    [cv, uv].forEach(function (c) {
      c.style.width = w + 'px'; c.style.height = h + 'px';
      c.style.left = Math.floor((window.innerWidth - w) / 2) + 'px'; c.style.top = Math.floor((window.innerHeight - h) / 2) + 'px';
    });
  }
  window.addEventListener('resize', fit); fit();
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  };

  /* ================= COSTANTI ================= */
  var SEG = 200, ROADW = 1800, LANES = 4, RUMBLE = 3, CAMH = 1500, DEPTH = 1 / Math.tan(50 * Math.PI / 180);
  var DRAW = 162, PZ = CAMH * DEPTH, MAXS = SEG * 60, FORKC = 1.85, FK = 1.5, PW = 0.33, CENT = 0.3, FOGD = 1.56, STUB = 20;
  var LANEX = [-0.75, -0.25, 0.25, 0.75];

  /* ================= TAPPE (15, a piramide come i bivi) ================= */
  var TH = [
    { n: 'Azure Riviera', sky: ['#1f7fe8', '#a8dcff'], fog: '#b8e2ff', sun: [0.78, 0.16, 16, '#fff8d0'], far: 'sea', farC: ['#1a66c8', '#5ab0ff', '#5a8aa0'], clouds: 1,
      grass: ['#ecd592', '#e2c982'], road: ['#727272', '#6b6b6b'], rumble: ['#ffffff', '#e02020'], lane: '#ffffff', spr: [['ad', 0.9], ['palm', 6], ['umbrella', 3], ['lighthouse', 0.4]], dens: 0.55 },
    { n: 'Marche Hills', sky: ['#3a8ef0', '#d8eeff'], fog: '#d8eeff', sun: [0.25, 0.14, 14, '#fff8d0'], far: 'mount', farC: ['#8aa8c8', '#7aa070'], near: 'trees', nearC: ['#5a8a3a', '#3a6a2a'], clouds: 1,
      grass: ['#a8c048', '#9ab43e'], road: ['#727272', '#6b6b6b'], rumble: ['#ffffff', '#c02020'], lane: '#ffffff', spr: [['ad', 0.9], ['cypress', 6], ['haybale', 2], ['oak', 2]], dens: 0.5 },
    { n: 'Red Canyon', sky: ['#ff8a3a', '#ffd9a0'], fog: '#ffd0a0', sun: [0.7, 0.3, 24, '#fff0a0'], far: 'mesa', farC: ['#b04a2a', '#d0683a'],
      grass: ['#d07a48', '#c46e3e'], road: ['#7a6a60', '#746458'], rumble: ['#ffffff', '#303030'], lane: '#ffffff', spr: [['ad', 0.9], ['redrock', 3], ['cactus', 3], ['drybush', 2], ['rock', 2]], dens: 0.45 },
    { n: 'Alpine Lake', sky: ['#2a7ae0', '#cfe6ff'], fog: '#d8ecff', sun: [0.6, 0.12, 14, '#ffffff'], far: 'snow', farC: ['#6a7fa8', '#4a6a8a'], near: 'trees', nearC: ['#2a5a3a', '#1d4a2a'], clouds: 1,
      grass: ['#4aa04a', '#3f923f'], road: ['#6e6e74', '#68686e'], rumble: ['#ffffff', '#2050c0'], lane: '#ffffff', spr: [['ad', 0.9], ['pine', 6], ['rock', 2], ['bush', 1]], dens: 0.55 },
    { n: 'Night City', night: 1, sky: ['#05061a', '#2a1a50'], fog: '#241848', moon: [0.2, 0.15, 10, '#f0f0ff'], far: 'city', farC: ['#1a1838', '#24204a'],
      grass: ['#2a2a3a', '#262636'], road: ['#3c3c46', '#383840'], rumble: ['#c0c0c0', '#c02020'], lane: '#e0e0e0', spr: [['nad', 1.6], ['nbld0', 2], ['nbld1', 2], ['nbld2', 2], ['nlamp', 4]], dens: 0.65 },
    { n: 'Golden Desert', sky: ['#3a9af0', '#f8e8b0'], fog: '#f8e8b0', sun: [0.5, 0.1, 18, '#ffffff'], far: 'dunes', farC: ['#e0b060', '#d09a50'],
      grass: ['#eac47a', '#e0b86c'], road: ['#7a7470', '#74706a'], rumble: ['#ffffff', '#d06020'], lane: '#ffffff', spr: [['ad', 0.9], ['cactus', 3], ['dune', 2], ['drybush', 2], ['rock', 1]], dens: 0.4 },
    { n: 'Autumn Forest', sky: ['#5a90d0', '#f0d8b0'], fog: '#f0dcc0', sun: [0.3, 0.2, 16, '#fff0c0'], far: 'mount', farC: ['#8a7aa0', '#a06a40'], near: 'trees', nearC: ['#a04a20', '#c0602a'], clouds: 1,
      grass: ['#8a8a30', '#7e7e2a'], road: ['#6e6a66', '#686460'], rumble: ['#ffffff', '#d07020'], lane: '#ffffff', spr: [['ad', 0.9], ['autumn', 6], ['oak', 1], ['bush', 1]], dens: 0.55 },
    { n: 'Valley of Temples', sky: ['#3a2a7a', '#ff9a5a'], fog: '#ffa070', sun: [0.65, 0.34, 26, '#ffd060'], far: 'mount', farC: ['#6a4a6a', '#8a5a5a'],
      grass: ['#c0a050', '#b49648'], road: ['#7a6e66', '#746860'], rumble: ['#ffffff', '#a03020'], lane: '#ffffff', spr: [['ad', 0.9], ['column', 4], ['ruins', 2], ['cypress', 2], ['drybush', 1]], dens: 0.5 },
    { n: 'Tropical Coast', sky: ['#ff5a9a', '#ffd0a0'], fog: '#ffd0b0', sun: [0.35, 0.3, 22, '#fff0b0'], far: 'sea', farC: ['#2a6ad0', '#ff9ac0', '#7a4a8a'], clouds: 1, cloudC: 'rgba(255,220,240,0.8)',
      grass: ['#f4dca0', '#eacf90'], road: ['#747070', '#6e6a6a'], rumble: ['#ffffff', '#ff4a90'], lane: '#ffffff', spr: [['ad', 0.9], ['palm', 7], ['umbrella', 2]], dens: 0.6 },
    { n: 'Windy Plateau', sky: ['#7a8aa8', '#d0d8e0'], fog: '#d0d8e0', far: 'mount', farC: ['#7a8a9a', '#6a7a6a'], near: 'hills', nearC: ['#6a8a4a', '#5a7a3a'], clouds: 1, cloudC: 'rgba(230,234,240,0.9)',
      grass: ['#7aa048', '#6e9440'], road: ['#6a6a6a', '#646464'], rumble: ['#ffffff', '#404040'], lane: '#ffffff', spr: [['ad', 0.9], ['rock', 3], ['bush', 3], ['drybush', 2]], dens: 0.45 },
    { n: 'Glacier Pass', sky: ['#3a6ad0', '#e8f4ff'], fog: '#eef6ff', sun: [0.8, 0.12, 13, '#ffffff'], far: 'snow', farC: ['#9ab0d0', '#c0d0e8'], near: 'hills', nearC: ['#e8f0ff', '#c8d8f0'],
      grass: ['#f4f8ff', '#e2eaf6'], road: ['#6a6e78', '#646872'], rumble: ['#d02020', '#ffffff'], lane: '#ffffff', spr: [['ad', 0.9], ['snowpine', 5], ['ice', 2], ['snowman', 0.5]], dens: 0.55 },
    { n: 'Vulcano', sky: ['#2a0a0a', '#c03a1a'], fog: '#a0401a', far: 'volcano', farC: ['#2a1a1a', '#3a2222'],
      grass: ['#3a3030', '#342a2a'], road: ['#4a4446', '#444042'], rumble: ['#ffcc00', '#202020'], lane: '#ffcc00', spr: [['ad', 0.9], ['lavarock', 5], ['rock', 1]], dens: 0.45 },
    { n: 'Metropoli', night: 1, sky: ['#0a0420', '#5a1a6a'], fog: '#4a1658', moon: [0.82, 0.12, 9, '#ffe0ff'], far: 'city', farC: ['#1a1030', '#2a1440'],
      grass: ['#26203a', '#221c34'], road: ['#3a3644', '#36323f'], rumble: ['#ff4ae0', '#4af0ff'], lane: '#ffffff', spr: [['nad', 1.6], ['nbld0', 3], ['nbld1', 3], ['nbld2', 3], ['nlamp', 3]], dens: 0.7 },
    { n: 'Distant Oasis', sky: ['#4aa0f0', '#fff0c0'], fog: '#fff0c8', sun: [0.2, 0.12, 18, '#ffffff'], far: 'dunes', farC: ['#e8b868', '#d8a458'],
      grass: ['#ecc880', '#e2bc72'], road: ['#7a7470', '#74706a'], rumble: ['#ffffff', '#20a060'], lane: '#ffffff', spr: [['ad', 0.9], ['palm', 4], ['dune', 2], ['cactus', 1], ['drybush', 1]], dens: 0.45 },
    { n: 'Sunset Harbour', sky: ['#4a2a8a', '#ffb070'], fog: '#ffb88a', sun: [0.5, 0.33, 28, '#ffd060'], far: 'sea', farC: ['#3a4aa0', '#ffb080', '#4a3a6a'],
      grass: ['#a8a4a0', '#9e9a96'], road: ['#6a6670', '#64606a'], rumble: ['#ffffff', '#2050c0'], lane: '#ffffff', spr: [['ad', 0.9], ['lamp', 4], ['lighthouse', 1], ['palm', 2], ['umbrella', 1]], dens: 0.55 }
  ];
  TH.forEach(function (t, i) { t.seed = i * 31 + 5; t.rgb = {}; ['fog', 'lane'].forEach(function (k) { t.rgb[k] = rgb(t[k]); }); ['sky', 'grass', 'road', 'rumble'].forEach(function (k) { t.rgb[k] = [rgb(t[k][0]), rgb(t[k][1])]; }); });
  function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function css(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function levelOf(id) { return id < 1 ? 0 : id < 3 ? 1 : id < 6 ? 2 : 3; }
  // bivi: per ogni nodo le due direzioni (sinistra, destra), come nello schema del percorso
  var FORK = [['Fermo', 'Macerata'], ['Ancona', 'Ascoli Piceno'], ['Ascoli Piceno', 'Pesaro Urbino'],
    ['Ancona', 'Ascoli Piceno'], ['Pesaro Urbino', 'Fermo'], ['Fermo', 'Macerata']];
  var REGION_TOWNS = {
    'Fermo': ['Porto San Giorgio', "Porto Sant'Elpidio", 'Pedaso', 'Montegranaro'],
    'Macerata': ['Civitanova Marche', 'Recanati', 'Tolentino', 'Potenza Picena'],
    'Ancona': ['Senigallia', 'Jesi', 'Osimo', 'Falconara'],
    'Ascoli Piceno': ['San Benedetto', 'Grottammare', 'Offida', 'Ripatransone'],
    'Pesaro Urbino': ['Fano', 'Urbino', 'Fossombrone', 'Gabicce Mare'] };
  var region = 'Fermo';
  function idxIn(id) { return id - [0, 1, 3, 6, 10][levelOf(id)]; }
  function childOf(id, right) { if (id >= 3) return 6 + (id - 3) * 2 + (right ? 1 : 0); var L = levelOf(id), i = idxIn(id); return [0, 1, 3, 6, 10][L + 1] + i + (right ? 1 : 0); }
  var bgCache = {};
  function bgOf(id) { return bgCache[id] || (bgCache[id] = G.background(TH[id])); }

  /* ================= COSTRUZIONE DEL PERCORSO ================= */
  var B = null;
  function lastY() { var s = B.segs; return s.length ? s[s.length - 1].p2.y : 0; }
  function lastF() { var s = B.segs; return s.length ? s[s.length - 1].f2 : 0; }
  function addSeg(curve, y, f) {
    var n = B.segs.length;
    B.segs.push({ i: n, p1: { y: lastY(), z: n * SEG }, p2: { y: y, z: (n + 1) * SEG }, curve: curve, f1: lastF(), f2: f || 0, fs: B.side || 0, spr: [], cars: [], clip: 0, fog: 1 });
  }
  function easeIn(a, b, p) { return a + (b - a) * p * p; }
  function easeInOut(a, b, p) { return a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5); }
  function addRoad(enter, hold, leave, curve, dy) {
    curve *= 1.1;
    var sy = lastY(), ey = sy + dy * SEG, tot = enter + hold + leave, n;
    for (n = 0; n < enter; n++) addSeg(easeIn(0, curve, n / enter), easeInOut(sy, ey, n / tot));
    for (n = 0; n < hold; n++) addSeg(curve, easeInOut(sy, ey, (enter + n) / tot));
    for (n = 0; n < leave; n++) addSeg(easeInOut(curve, 0, n / leave), easeInOut(sy, ey, (enter + hold + n) / tot));
  }
  S.puddle.ww = ROADW * 0.5;   // larga 1/4 della carreggiata
  var adN = 0;
  function adName(nm) { return nm === 'ad' ? 'bill' + (adN++ % G.NADS) : nm === 'nad' ? 'neon' + (adN++ % G.NADS) : nm; }
  function addSpr(i, name, off, fl) { var s = B.segs[i]; if (s) s.spr.push({ s: typeof name === 'string' ? S[name] : name, off: off, fl: fl }); }
  function lamps(from, to, night) {
    for (var i = from; i < to; i += 8) { var s = B.segs[i]; if (!s) continue; var c = s.f1 * FORKC, m = s.fs ? s.fs * c : 0, o = s.fs ? 1.6 : c + 1.6; addSpr(i, night ? 'nlamp' : 'lamp', m - o, false); addSpr(i, night ? 'nlamp' : 'lamp', m + o, true); }
  }
  function pick(list, r) { var t = 0, i; for (i = 0; i < list.length; i++) t += list[i][1]; var x = r() * t; for (i = 0; i < list.length; i++) { x -= list[i][1]; if (x <= 0) return list[i][0]; } return list[0][0]; }

  function buildStage(id, first, side) {
    var lv = levelOf(id), th = TH[id], r = TR.rng(id * 977 + 13 + (first === 'demo' ? 5 : 0)), n, i;
    B = { segs: [], id: id, lv: lv, gateIdx: -1, forkStart: -1, final: lv === 3, side: 0 };
    var gates = [];
    if (first) { addRoad(0, 50, 0, 0, 0); gates.push([10, 'START', '#1e64d0', 0]); }
    else {
      // la strada scelta continua a divergere dall'altra (che non c'è più) e poi rientra lentamente al centro
      B.side = side || 0;
      for (n = 0; n < STUB; n++) addSeg(0, 0, FK);
      for (n = 0; n < 260; n++) addSeg(0, 0, easeInOut(FK, FK + 0.6, n / 260));
      for (n = 0; n < 500; n++) addSeg(0, 0, easeInOut(FK + 0.6, 0, n / 500));
      B.side = 0;
      addRoad(0, 40, 0, 0, 0);
      lamps(STUB + 8, STUB + 400, th.night);
      gates.push([STUB, 'CHECKPOINT', '#e02020', side * FORKC * FK]);
    }
    var bodyStart = B.segs.length, target = 2300 + lv * 180;
    var cmax = 2.2 + Math.min(lv, 2) * 0.9 + Math.max(0, lv - 2) * 0.35, hmax = 25 + lv * 10, curY = 0;
    while (B.segs.length - bodyStart < target) {
      var t = r(), ny = r() < 0.35 ? curY : Math.round((r() * 2 - 1) * hmax), dy = ny - curY; curY = ny;
      if (t < 0.22) addRoad(20 + (r() * 20 | 0), 30 + (r() * 60 | 0), 20 + (r() * 20 | 0), 0, dy);
      else if (t < 0.75) { var c = (1.5 + r() * cmax) * (r() < 0.5 ? -1 : 1); addRoad(25 + (r() * 25 | 0), 40 + (r() * 80 | 0), 25 + (r() * 25 | 0), c, dy); }
      else { var c2 = 1.5 + r() * cmax, sg = r() < 0.5 ? -1 : 1; addRoad(25, 40, 25, c2 * sg, dy / 2); addRoad(25, 40, 25, -c2 * sg, dy - (dy / 2 | 0)); }
    }
    addRoad(30, 30, 30, 0, -curY);
    var bodyEnd = B.segs.length;
    // decorazioni (senza cartelloni pubblicitari)
    var sprs = th.spr.filter(function (e) { return e[0] !== 'ad' && e[0] !== 'nad'; });
    for (i = bodyStart + 6; i < bodyEnd; i += 3) {
      var sgm = B.segs[i];
      if (r() < th.dens) {
        var nm = adName(pick(sprs, r)), sp = S[nm], side = r() < 0.5 ? -1 : 1;
        addSpr(i, nm, side * ((nm.indexOf('bld') >= 0 ? 2.2 : 1.2) + sp.ww / ROADW / 2 + r() * (nm.indexOf('bld') >= 0 ? 1.5 : 0.9)));
      }
      if (r() < 0.12 && sprs.length) { var nm2 = adName(pick(sprs, r)), sp2 = S[nm2]; addSpr(i + 1, nm2, (r() < 0.5 ? -1 : 1) * (2.6 + sp2.ww / ROADW / 2 + r() * 2)); }
    }
    for (i = bodyStart + 1; i < bodyEnd; i++) {
      var a = B.segs[i - 1].curve, b = B.segs[i].curve;
      if (Math.abs(a) < 0.01 && Math.abs(b) >= 0.01 && i > bodyStart + 30) {
        var right = b > 0;
        for (n = 0; n < 5; n++) addSpr(i - 20 + n * 6, right ? 'signR' : 'signL', right ? -1.3 : 1.3);
      }
    }
    // indicazioni stradali: 4 paesi della zona in cui si sta andando; cartelli blu con le direzioni del prossimo bivio
    var RT = REGION_TOWNS[region] || REGION_TOWNS.Fermo, tn = 0;
    for (i = bodyStart + 90, n = 0; id > 0 && i < bodyEnd - 60; i += 230 + ((r() * 120) | 0), n++) {
      var sg;
      if (n % 2 && !B.final) {
        var k1 = (5 + r() * 40 | 0) + ' km', k2 = (8 + r() * 60 | 0) + ' km';
        sg = G.dirSign(FORK[id][0], k1, FORK[id][1], k2);
      } else sg = G.townSign(RT[tn++ % 4]);
      for (var q = i - 30; q < i + 6; q++) if (B.segs[q]) B.segs[q].spr = B.segs[q].spr.filter(function (x) { return x.s !== S.signL && x.s !== S.signR && (q !== i || Math.abs(x.off) > 3); });
      addSpr(i, sg, (r() < 0.75 ? 1 : -1) * (1.45 + sg.ww / ROADW / 2));
    }
    // pozzanghere (dal secondo livello): 2 per tratta nel livello 2, 3 nel livello 3
    B.puddles = [];
    var npud = round >= 4 ? 4 : round === 3 ? 3 : round === 2 ? 2 : 0;
    for (n = 0; n < npud; n++) {
      var span = bodyEnd - bodyStart - 500, pidx = bodyStart + 250 + Math.floor(((n + 0.15 + Math.random() * 0.7) / npud) * span), poff = (Math.random() * 2 - 1) * 0.72;
      addSpr(pidx, 'puddle', poff, false);
      B.puddles.push({ z: pidx * SEG + SEG / 2, off: poff, hit: false });
    }
    if (!B.final) {
      B.forkStart = B.segs.length;
      for (n = 0; n < 230; n++) addSeg(0, lastY(), easeInOut(0, FK, n / 230));
      B.gateIdx = B.segs.length;
      // dopo il cancello le due strade restano separate (non si ricongiungono): la tappa successiva prosegue solo su quella scelta
      for (n = 0; n < STUB; n++) addSeg(0, lastY(), FK);
      for (n = 0; n < 260; n++) addSeg(0, lastY(), easeInOut(FK, FK + 0.6, n / 260));
      var L = FORK[id][0], Rn = FORK[id][1];
      B.forkL = L; B.forkR = Rn;
      var fs = G.forkSign(L, Rn);
      addSpr(B.forkStart + 150, fs, 0); addSpr(B.forkStart + 200, fs, 0);
      for (i = B.forkStart + 20; i < B.gateIdx - STUB; i += 8) { var cf = B.segs[i].f1 * FORKC; addSpr(i, th.night ? 'nlamp' : 'lamp', -(cf + 1.6)); addSpr(i, th.night ? 'nlamp' : 'lamp', cf + 1.6); }
      lamps(B.gateIdx + 8, B.gateIdx + 190, th.night);
      gates.push([B.gateIdx, 'CHECKPOINT', '#e02020', -FORKC * FK], [B.gateIdx, 'CHECKPOINT', '#e02020', FORKC * FK]);
    } else {
      addRoad(0, 40, 0, 0, 0);
      B.gateIdx = B.segs.length;
      addRoad(0, 320, 0, 0, 0);
      lamps(B.gateIdx - 60, B.gateIdx + 200, th.night);
      gates.push([B.gateIdx, 'FINISH', '#18a040', 0]);
    }
    var gc = {};
    gates.forEach(function (gd) { var key = gd[1] + gd[2]; gc[key] = gc[key] || G.gate(gd[1], gd[2]); B.segs[gd[0]].spr = []; addSpr(gd[0], gc[key], gd[3]); });
    if (first) for (i = 0; i < 40; i++) B.segs[i].spr = B.segs[i].spr.filter(function (x) { return x.s.nc; });
    B.len = B.segs.length * SEG;
    return B;
  }

  /* ================= SPRITE AUTO ================= */
  var HS = 3, carFrames = {};
  var carTurned = {}, carCheer = {}, cheerT = 0;
  [-1, 0, 1].forEach(function (d) { carFrames[d] = [G.playerCar(d, false, false, HS), G.playerCar(d, true, false, HS)]; carTurned[d] = [G.playerCar(d, false, true, HS), G.playerCar(d, true, true, HS)]; carCheer[d] = [G.playerCar(d, false, 'cheer', HS), G.playerCar(d, true, 'cheer', HS)]; });
  var lookT = 0, flameT = 0;
  var traffic = [];
  ['car', 'car', 'van', 'truck', 'sport', 'car', 'sport'].forEach(function (tp, k) {
    for (var j = 0; j < 3; j++) {
      var col = G.CARCOL[(k * 3 + j * 4) % G.CARCOL.length], img = G.trafficCar(tp, col);
      traffic.push({ img: img, ww: tp === 'truck' ? 760 : tp === 'van' ? 690 : 650, tp: tp });
    }
  });

  /* ================= STATO DI GIOCO ================= */
  var T = null;                 // percorso attuale
  var position = 0, speed = 0, playerX = 0, cars = [];
  var timeLeft = 0, score = 0, stageTime = 0, totalTime = 0, path = [0], stageId = 0;
  var prevTheme = 0, themeT = 1, bgOff = [0, 0, 0], cloudDrift = 0;
  var round = 1, slipT = 0, slipDir = 0, clipBalloons = [], forkSide = 0, gasOn = false, downT = 0, gearHi = false, crashT = 0, crashAng = 0, shake = 0, steerDir = 0, brakeOn = false, offroad = false, skid = false;
  var state = 'intro', stateT = 0, msg = [], menuSel = 0, pauseSel = 0;
  var autoGas = store.get('tr_auto', true), station = store.get('tr_station', 0);
  var lapTimes = [], countN = 3, demo = false, nameChars = [0, 0, 0], namePos = 0, newRank = -1, endBonus = 0;
  var scores = store.get('tr_scores', null) || [
    { n: 'ELE', s: 3500000, st: 'Sunset Harbour' }, { n: 'CRI', s: 2800000, st: 'Vulcano' },
    { n: 'MAX', s: 2000000, st: 'Autumn Forest' }, { n: 'SOF', s: 1200000, st: 'Alpine Lake' }, { n: 'TEO', s: 600000, st: 'Marche Hills' }];
  var stationShowT = 0;

  function findSeg(z) { var i = Math.floor(z / SEG); if (i < 0) i = 0; if (i >= T.segs.length) i = T.segs.length - 1; return T.segs[i]; }
  function stageSecs(tr) { return (tr.gateIdx * SEG) / (MAXS * 0.8); }

  function spawnCars(tr, fromZ, toZ, count, r) {
    count = Math.round(count * (1 + 0.1 * (round - 1)));   // +10% di traffico per livello
    for (var k = 0; k < count; k++) {
      var tv = traffic[(r() * traffic.length) | 0], ln = (r() * 4) | 0;
      cars.push({ z: fromZ + r() * (toZ - fromZ), off: LANEX[ln], tOff: LANEX[ln], ln: ln, spd: MAXS * (0.22 + r() * 0.3), tm: 2 + r() * 6, v: tv });
    }
  }

  function startDemo() {
    demo = true; round = 1; stageId = 0; region = 'Fermo'; T = buildStage(0, 'demo'); prevTheme = 0; themeT = 1;
    position = 60 * SEG; speed = MAXS * 0.72; playerX = 0; cars = []; crashT = 0;
  }
  function startGame() {
    demo = false; round = 1; slipT = 0; stageId = 0; region = 'Fermo'; forkSide = 0; path = [0]; T = buildStage(0, true); prevTheme = 0; themeT = 1;
    position = 0; speed = 0; playerX = -0.25; cars = []; crashT = 0; shake = 0; gearHi = false; gasOn = false; downT = 0;
    timeLeft = Math.ceil(stageSecs(T)) + 8; score = 0; stageTime = 0; totalTime = 0; lapTimes = [];
    var r = TR.rng(Date.now() & 0xffff);
    spawnCars(T, 60 * SEG, T.forkStart * SEG - 20 * SEG, 34, r);
    state = 'count'; stateT = 0; countN = 3; msg = [];
    A.playSong(station);
    showMsg(TH[0].n.toUpperCase(), '#ffffff', 3.5, 'stage');
  }
  function nextRound() {
    score += endBonus; endBonus = 0;
    round++; stageId = 0; region = 'Fermo'; forkSide = 0; path = [0]; slipT = 0; prevTheme = 0; themeT = 1;
    T = buildStage(0, true);
    position = 0; speed = 0; playerX = -0.25; cars = []; crashT = 0; shake = 0; gearHi = false; gasOn = false; downT = 0;
    timeLeft = Math.ceil(stageSecs(T)) + 8; stageTime = 0;
    spawnCars(T, 60 * SEG, T.forkStart * SEG - 20 * SEG, 34, TR.rng(Date.now() & 0xffff));
    state = 'count'; stateT = 0; countN = 3; msg = [];
    A.playSong(station);
    showMsg('LEVEL ' + round, '#ffe14a', 3.5, 'big');
    showMsg(TH[0].n.toUpperCase(), '#ffffff', 3.5, 'stage');
  }
  function showMsg(text, col, dur, kind) { msg.push({ t: text, c: col, d: dur, a: 0, k: kind || '' }); }

  function checkpoint() {
    var right = playerX >= 0, next = childOf(stageId, right);
    region = FORK[stageId][right ? 1 : 0]; forkSide = right ? 1 : -1;
    var old = T, gz = old.gateIdx * SEG;
    lapTimes.push(stageTime); stageTime = 0;
    prevTheme = stageId; stageId = next; themeT = 0; path.push(next);
    T = buildStage(next, false, right ? 1 : -1);
    position = position - gz + STUB * SEG;
    // le auto già oltre il portale proseguono nel nuovo tratto
    var keep = [];
    cars.forEach(function (c) { if (c.z > gz - 10 * SEG) { c.z = c.z - gz + STUB * SEG; keep.push(c); } });
    cars = keep;
    var r = TR.rng((Date.now() + next) & 0xffff);
    spawnCars(T, (STUB + 220) * SEG, (T.forkStart > 0 ? T.forkStart : T.gateIdx - 30) * SEG, 34 + T.lv * 9, r);
    var add = Math.ceil(stageSecs(T) - (STUB + 0) * SEG / (MAXS * 0.8)) + 2 - T.lv;
    timeLeft += add;
    A.sfx.checkpoint();
    showMsg('EXTRA TIME!', '#ffe14a', 3, 'big');
    showMsg('+' + add + ' SECONDS', '#ffffff', 3, 'small');
    showMsg(TH[next].n.toUpperCase(), '#ffffff', 4, 'stage');
    mapT = 5;
    score += 100000;
  }
  var mapT = 0;

  /* ================= INPUT ================= */
  var KEYMAP = { 37: 'left', 39: 'right', 38: 'up', 40: 'down', 13: 'ok', 32: 'ok', 90: 'ok',
    65: 'left', 68: 'right', 87: 'up', 83: 'down',
    461: 'back', 27: 'back', 8: 'back', 10009: 'back',
    403: 'red', 82: 'red', 404: 'green', 77: 'green', 405: 'yellow', 89: 'yellow', 406: 'blue', 80: 'back', 19: 'back', 415: 'ok' };
  var keys = {}, pressed = {};
  window.addEventListener('keydown', function (ev) {
    A.init();
    var a = KEYMAP[ev.keyCode]; if (!a) return;
    ev.preventDefault();
    if (!keys[a]) pressed[a] = true;
    keys[a] = true;
  });
  window.addEventListener('keyup', function (ev) { var a = KEYMAP[ev.keyCode]; if (!a) return; ev.preventDefault(); keys[a] = false; });
  window.addEventListener('mousedown', function () { A.init(); if (!keys.ok) pressed.ok = true; keys.ok = true; });
  window.addEventListener('mouseup', function () { keys.ok = false; });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (state === 'play' || state === 'count') { state = 'pause'; pauseSel = 0; } A.suspend(true); }
    else A.suspend(false);
  });

  function nextStation(d) {
    station = (station + d + 3) % 3; store.set('tr_station', station);
    A.sfx.radio(); A.playSong(station); stationShowT = 3;
  }

  /* ================= LOGICA ================= */
  function onRoadAt(seg, pct, x) {
    var c = (seg.f1 + (seg.f2 - seg.f1) * pct) * FORKC;
    if (c === 0) return Math.abs(x) <= 1;
    if (seg.fs) return Math.abs(x - seg.fs * c) <= 1;
    return Math.abs(x + c) <= 1 || Math.abs(x - c) <= 1;
  }
  function drive(dt, ctrl) {
    var z0 = position + PZ, pSeg = findSeg(position + PZ), pPct = ((position + PZ) % SEG) / SEG, spd = speed / MAXS;
    var cNow = (pSeg.f1 + (pSeg.f2 - pSeg.f1) * pPct) * FORKC;
    var left = false, right = false, gas = false, brk = false;
    if (ctrl === 'player' && crashT <= 0) {
      left = keys.left; right = keys.right; brk = keys.down;
      // ▲ (anche un solo tocco) inserisce l'acceleratore, che resta inserito (vale anche in automatico);
      // ▼: il primo terzo di secondo stacca l'acceleratore (velocità costante), se si continua a premere l'auto frena
      if (pressed.up || keys.up) { gasOn = true; downT = 0; }
      if (keys.down) { gasOn = false; downT += dt; } else downT = 0;
      brk = downT > 1 / 3;
      gas = !brk && gasOn;
      // cambio manuale: OK alterna LO / HI
      if (!autoGas && pressed.ok) { gearHi = !gearHi; A.sfx.shift(); if (gearHi) flameT = 0.45; }
    } else if (ctrl === 'auto' || ctrl === 'stop') {
      var target = cNow > 1.1 ? (playerX < 0 ? -cNow : cNow) : 0;
      var look = findSeg(position + PZ + 12 * SEG), want = target - look.curve * 0.12;
      if (playerX < want - 0.08) right = true; else if (playerX > want + 0.08) left = true;
      gas = ctrl === 'auto' && speed < MAXS * 0.72; brk = ctrl === 'stop';
    }
    if (slipT > 0) { left = right = false; }   // sulla pozzanghera lo sterzo non risponde
    var dx = dt * 1.6 * Math.min(1, spd * 1.5);
    position += speed * dt;
    steerDir = slipT > 0 ? slipDir : left ? -1 : right ? 1 : 0;
    if (left) playerX -= dx; else if (right) playerX += dx;
    if (slipT > 0) { slipT -= dt; playerX += slipDir * dt * 3.3 * Math.min(1, spd * 1.5 + 0.2); }
    else if (ctrl === 'player' && crashT <= 0 && T.puddles) {
      var z1 = position + PZ;
      for (var pi = 0; pi < T.puddles.length; pi++) {
        var pd = T.puddles[pi];
        if (!pd.hit && pd.z > z0 && pd.z <= z1 && Math.abs(playerX - pd.off) < (PW + 0.5) / 2) { pd.hit = true; slipT = 1 / 3; slipDir = Math.random() < 0.5 ? -1 : 1; shake = 0.2; A.sfx.splash(); }
      }
    }
    playerX -= dx * spd * pSeg.curve * CENT;
    // al bivio, una volta imboccata una strada non si passa nell'altra attraverso l'erba
    if (cNow > 1.2 && !forkSide && Math.abs(playerX) > 0.5) forkSide = playerX < 0 ? -1 : 1;
    if (cNow < 0.01) forkSide = 0;
    else if (forkSide) { var mnx = Math.max(0, cNow - 1.15); if (playerX * forkSide < mnx) playerX = forkSide * mnx; }
    if (crashT > 0) {
      crashT -= dt; speed = Math.max(0, speed - MAXS * 1.1 * dt);
      if (crashT < 0.9) { var tgt = cNow > 1.1 ? (playerX < 0 ? -cNow : cNow) : Math.max(-0.75, Math.min(0.75, playerX)); playerX += (tgt - playerX) * Math.min(1, dt * 4); }
      if (crashT <= 0) { crashT = 0; crashAng = 0; }
      else crashAng += dt * 14 * Math.min(1, crashT);
    } else {
      var manual = ctrl === 'player' && !autoGas;
      if (gas) {
        var acc = gearHi ? MAXS * 0.2 * (1.15 - spd) : MAXS * 0.42 * (1.1 - spd);
        if (manual) acc *= 1.21;   // in manuale si accelera il 21% più in fretta (+10% +10%)
        if (manual && gearHi && spd < 0.4) acc *= 0.35 + spd;   // in HI da fermi si parte piano
        speed += Math.max(acc, MAXS * 0.03) * dt;
        if (manual && !gearHi && speed > MAXS * 0.56) speed = MAXS * 0.56;   // in LO la velocità ha un limite
      }
      else if (brk) speed -= MAXS * 0.9 * dt;
      else if (ctrl !== 'player') speed -= MAXS * 0.18 * dt;   // il giocatore, rilasciando i tasti, mantiene la velocità
      if (manual && !gearHi && speed > MAXS * 0.56) speed -= MAXS * 0.25 * dt;   // freno motore se si scala in LO
    }
    offroad = !onRoadAt(pSeg, pPct, playerX);
    if (offroad && speed > MAXS / 4) speed -= MAXS * 0.6 * dt;
    speed = Math.max(0, Math.min(manual ? MAXS * 296 / 293 : MAXS, speed));   // in manuale fino a 296 km/h
    var lim = cNow + 2.4; playerX = Math.max(-lim, Math.min(lim, playerX));
    brakeOn = brk && speed > 1;
    // marce automatiche
    spd = speed / MAXS;
    if (!(ctrl === 'player' && !autoGas)) {
      if (!gearHi && spd > 0.52) { gearHi = true; if (ctrl === 'player') { A.sfx.shift(); flameT = 0.45; } }
      else if (gearHi && spd < 0.4) gearHi = false;
    }
    skid = crashT <= 0 && (slipT > 0 || (steerDir !== 0 && spd > 0.75 && Math.abs(pSeg.curve) > 2.5) || (brk && spd > 0.6));
    // collisioni con gli oggetti
    if (crashT <= 0 && ctrl === 'player') {
      for (var i = 0; i < pSeg.spr.length; i++) {
        var sp = pSeg.spr[i];
        if (sp.s.nc) continue;
        var sw = Math.min(sp.s.ww, 1600) / ROADW * 0.85;
        if (Math.abs(playerX - sp.off) < (PW + sw) / 2) {
          if (speed > MAXS * 0.45) { crashT = 2.4; crashAng = 0; shake = 0.6; A.sfx.crash(); lookT = 5; }
          else { speed = MAXS / 10; position = pSeg.p1.z - PZ; shake = 0.25; A.sfx.bump(); }
          break;
        }
      }
      for (i = 0; i < cars.length; i++) {
        var c = cars[i], dz = c.z - (position + PZ);
        // controllo "a tratto": a velocità alta l'auto può saltare la finestra di collisione in un solo frame
        if (speed > c.spd && dz < SEG * 0.8 && dz + (speed - c.spd) * dt > -SEG * 0.4) {
          var cs = findSeg(c.z), cc = ((cs.f1 + cs.f2) / 2) * FORKC, co = c.off + (cs.fs ? cs.fs * cc : (c.off < 0 ? -cc : cc));
          if (Math.abs(playerX - co) < (PW + c.v.ww / ROADW) / 2 * 0.85) {
            speed = c.spd * 0.6; position = c.z - PZ - SEG; shake = 0.35; A.sfx.bump(); score = Math.max(0, score - 5000);
            break;
          }
        }
      }
    }
    // sfondo
    var pct = speed * dt / SEG;
    bgOff[0] += pSeg.curve * pct * 0.0008; bgOff[1] += pSeg.curve * pct * 0.0016; bgOff[2] += pSeg.curve * pct * 0.0026;
    cloudDrift += dt * 0.002;
    if (shake > 0) shake -= dt;
    if (lookT > 0) lookT -= dt; if (flameT > 0) flameT -= dt;
    if (ctrl === 'player' && speed > MAXS * 0.96 && crashT <= 0 && lookT <= 0) cheerT = 1.2; else if (cheerT > 0) cheerT -= dt;
    return pSeg;
  }

  function updateCars(dt) {
    var lo = position - 6 * SEG, hi = T.len - 3 * SEG;
    for (var i = cars.length - 1; i >= 0; i--) {
      var c = cars[i];
      c.z += c.spd * dt;
      c.tm -= dt;
      if (c.tm < 0) {
        c.tm = 3 + Math.random() * 6;
        var s = findSeg(c.z), nl = c.ln + (Math.random() < 0.5 ? -1 : 1);
        if (nl >= 0 && nl < 4 && (s.f1 === 0 || (nl < 2) === (c.ln < 2))) { c.ln = nl; c.tOff = LANEX[nl]; }
      }
      var d = c.tOff - c.off; c.off += Math.max(-dt * 0.35, Math.min(dt * 0.35, d));
      if (c.z < lo || c.z > hi) cars.splice(i, 1);
    }
  }

  function update(dt) {
    A.tick(); stateT += dt;
    if (stationShowT > 0) stationShowT -= dt;
    if (mapT > 0) mapT -= dt;
    msg.forEach(function (m) { m.a += dt; }); msg = msg.filter(function (m) { return m.a < m.d; });
    var spd = speed / MAXS, pSeg;
    switch (state) {
      case 'intro':
        if (stateT > 0.3 && A.current() !== station) A.playSong(station);
        if (pressed.ok || pressed.back || pressed.up || pressed.down || pressed.left || pressed.right || pressed.red || pressed.green || stateT > 11) { state = 'title'; stateT = 0; A.sfx.ok(); }
        break;
      case 'title':
        if (!T || !demo) startDemo();
        pSeg = drive(dt, 'auto');
        if (position > (T.forkStart - 60) * SEG) { position = 60 * SEG; }
        if (pressed.up) { menuSel = (menuSel + 3) % 4; A.sfx.select(); }
        if (pressed.down) { menuSel = (menuSel + 1) % 4; A.sfx.select(); }
        if (pressed.ok) {
          A.sfx.ok();
          if (menuSel === 0) { state = 'radio'; stateT = 0; A.playSong(station); }
          else if (menuSel === 1) { state = 'rank'; stateT = 0; }
          else if (menuSel === 2) { autoGas = !autoGas; store.set('tr_auto', autoGas); }
          else if (menuSel === 3) { A.setMute(!A.isMuted()); }
        }
        if (pressed.red) nextStation(1);
        if (pressed.green) A.setMute(!A.isMuted());
        if (pressed.back) { try { if (window.webOS && webOS.platformBack) webOS.platformBack(); else window.close(); } catch (e) { try { window.close(); } catch (e2) { } } }
        A.engine(false, 0, false, false, 0);
        break;
      case 'rank':
        pSeg = drive(dt, 'auto');
        if (position > (T.forkStart - 60) * SEG) position = 60 * SEG;
        if (pressed.ok || pressed.back || stateT > 12) { state = 'title'; stateT = 0; }
        break;
      case 'radio':
        pSeg = drive(dt, 'auto');
        if (position > (T.forkStart - 60) * SEG) position = 60 * SEG;
        if (pressed.left) nextStation(-1);
        if (pressed.right || pressed.red) nextStation(1);
        if (pressed.green) A.setMute(!A.isMuted());
        if (pressed.ok) { A.sfx.ok(); startGame(); }
        if (pressed.back) { state = 'title'; stateT = 0; }
        break;
      case 'count':
        A.engine(true, 0.15 + (keys.up || keys.ok ? 0.3 : 0), false, false, 0);
        if (stateT > 0.6 && countN === 3) { A.sfx.beep(); countN = 2.5; }
        if (stateT > 1.6 && countN === 2.5) { A.sfx.beep(); countN = 2; }
        if (stateT > 2.6 && countN === 2) { A.sfx.beep(); countN = 1; }
        if (stateT > 3.6) { A.sfx.go(); state = 'play'; stateT = 0; showMsg('GO!', '#ffe14a', 1.2, 'go'); }
        if (pressed.back) { state = 'pause'; pauseSel = 0; A.sfx.pause(); }
        if (pressed.red) nextStation(1);
        break;
      case 'play':
        pSeg = drive(dt, 'player'); updateCars(dt);
        var oldT = timeLeft;
        timeLeft -= dt; stageTime += dt; totalTime += dt;
        if (timeLeft < 10 && Math.floor(oldT) !== Math.floor(timeLeft) && timeLeft > 0) A.sfx.tick();
        score += (speed / MAXS) * 293 * dt * 40;
        if (themeT < 1) themeT = Math.min(1, (position - (STUB * SEG - PZ)) / (170 * SEG));
        var rpm = gearHi ? 0.45 + (spd - 0.4) / 0.6 * 0.55 : spd / 0.52;
        A.engine(true, Math.max(0.12, rpm), skid, offroad, spd);
        if (position + PZ >= T.gateIdx * SEG) {
          if (T.final) { lapTimes.push(stageTime); state = 'goal'; stateT = 0; A.sfx.goal(); A.playSong(3); endBonus = Math.max(0, Math.floor(timeLeft)) * 50000; showMsg('FINISH!', '#ffe14a', 4, 'big'); showMsg('WELCOME TO ' + region.toUpperCase(), '#ffffff', 6, 'stage'); }
          else checkpoint();
        }
        if (T.forkStart > 0 && position + PZ > (T.forkStart - 40) * SEG && position + PZ < T.gateIdx * SEG && Math.floor(stateT * 2) % 2 === 0 && !msg.some(function (m) { return m.k === 'fork'; }))
          showMsg('FORK!  CHOOSE YOUR ROAD', '#ffe14a', 2.5, 'fork');
        if (timeLeft <= 0) { timeLeft = 0; state = 'timeup'; stateT = 0; A.sfx.over(); }
        if (pressed.back) { state = 'pause'; pauseSel = 0; A.sfx.pause(); }
        if (pressed.red) nextStation(1);
        if (pressed.green) A.setMute(!A.isMuted());
        if (pressed.yellow) { autoGas = !autoGas; store.set('tr_auto', autoGas); showMsg(autoGas ? 'AUTO GEARS: ▲ GAS ON  ▼ TAP OFF / HOLD BRAKE' : 'MANUAL: ▲ GAS ON  ▼ TAP OFF / HOLD BRAKE  OK GEAR', '#ffffff', 2, 'small'); }
        break;
      case 'pause':
        A.engine(false, 0, false, false, 0);
        var items = 5;
        if (pressed.up) { pauseSel = (pauseSel + items - 1) % items; A.sfx.select(); }
        if (pressed.down) { pauseSel = (pauseSel + 1) % items; A.sfx.select(); }
        if (pressed.left && pauseSel === 1) nextStation(-1);
        if (pressed.right && pauseSel === 1) nextStation(1);
        if (pressed.back) { state = timeLeft > 0 && stateT >= 0 ? (stageTime > 0 || totalTime > 0 ? 'play' : 'count') : 'play'; if (state === 'count') stateT = 0; }
        else if (pressed.ok) {
          A.sfx.ok();
          if (pauseSel === 0) { state = (totalTime > 0 || stageTime > 0) ? 'play' : 'count'; if (state === 'count') { stateT = 0; countN = 3; } }
          else if (pauseSel === 1) nextStation(1);
          else if (pauseSel === 2) { autoGas = !autoGas; store.set('tr_auto', autoGas); }
          else if (pauseSel === 3) startGame();
          else if (pauseSel === 4) { state = 'title'; stateT = 0; menuSel = 0; startDemo(); }
        }
        if (pressed.green) A.setMute(!A.isMuted());
        break;
      case 'timeup':
        pSeg = drive(dt, 'stop'); updateCars(dt);
        A.engine(true, Math.max(0.1, spd), false, offroad, spd);
        if (stateT > 4.5 || (stateT > 1.5 && pressed.ok)) endGame();
        break;
      case 'goal':
        pSeg = drive(dt, stateT > 1.5 ? 'stop' : 'auto'); updateCars(dt);
        A.engine(true, Math.max(0.1, spd), false, false, spd);
        if (stateT > 1 && endBonus > 0) { var step = Math.min(endBonus, 50000 * dt * 8); endBonus -= step; score += step; }
        if (stateT > 6 || (stateT > 2 && pressed.ok)) {
          if (round < 4) nextRound();
          else {
            score += endBonus; endBonus = 0; state = 'clip'; stateT = 0; speed = 0; clipSmoke = [];
            var BC = ['#ff4a4a', '#ffd21f', '#3a9af0', '#2fd06a', '#ff7ab0', '#ff9a1f', '#a45cff'];
            clipBalloons = [];
            for (var bi = 0; bi < 30; bi++) clipBalloons.push({ x: 90 + Math.random() * (UW - 180), y0: UH + 90 + Math.random() * 380, vy: 150 + Math.random() * 120, r: 40 + Math.random() * 26, col: BC[bi % 7], ph: Math.random() * 6.28, dl: Math.random() * 2.2 });
          }
        }
        break;
      case 'clip':
        // filmato finale: sgommata e fuga verso l'orizzonte
        updateCars(dt);
        var cp = clipPos(stateT);
        A.engine(true, stateT < CLIP_BURN ? 0.95 : Math.max(0.15, 1 - (stateT - CLIP_BURN) * 0.15), stateT < CLIP_BURN + 0.6, false, cp.d);
        if (Math.random() < (stateT < CLIP_BURN ? 0.9 : stateT < CLIP_BURN + 0.5 ? 0.4 : 0)) [-1, 1].forEach(function (sd) {
          clipSmoke.push({ x: cp.x + sd * cp.w * 0.3 + (Math.random() - 0.5) * 30 * cp.d, y: cp.y - 20 * cp.d, r: (30 + Math.random() * 30) * cp.d, vx: sd * (40 + Math.random() * 80), vy: -20 - Math.random() * 40, a: 0.75 });
        });
        clipSmoke.forEach(function (m) { m.x += m.vx * dt; m.y += m.vy * dt; m.r += 70 * dt; m.a -= 0.4 * dt; });
        clipSmoke = clipSmoke.filter(function (m) { return m.a > 0; });
        if (stateT > CLIP_LEN || (stateT > 1.5 && pressed.ok)) { state = 'ending'; stateT = 0; clipSmoke = []; }
        break;
      case 'ending':
        A.engine(false, 0, false, false, 0);
        if (stateT > 2 && pressed.ok) endGame();
        break;
      case 'name':
        A.engine(false, 0, false, false, 0);
        var NL = LETTERS.length;
        if (pressed.up) { nameChars[namePos] = (nameChars[namePos] + 1) % NL; A.sfx.letter(); }
        if (pressed.down) { nameChars[namePos] = (nameChars[namePos] + NL - 1) % NL; A.sfx.letter(); }
        if (pressed.left && namePos > 0) { namePos--; A.sfx.select(); }
        if (pressed.right || pressed.ok) {
          A.sfx.ok(); namePos++;
          if (namePos >= 3) {
            scores[newRank].n = nameChars.map(function (k) { return LETTERS[k]; }).join('');
            store.set('tr_scores', scores); store.set('tr_name', nameChars);
            state = 'rank'; stateT = 0; startDemo(); A.playSong(station);
          }
        }
        break;
    }
    pressed = {};
  }
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!♥ ';
  function endGame() {
    var st = region, rec = { n: '???', s: Math.floor(score), st: st };
    newRank = -1;
    for (var i = 0; i < scores.length; i++) if (rec.s > scores[i].s) { newRank = i; break; }
    if (newRank < 0 && scores.length < 5) newRank = scores.length;
    if (newRank >= 0) {
      scores.splice(newRank, 0, rec); scores = scores.slice(0, 5);
      nameChars = store.get('tr_name', [2, 17, 8]); namePos = 0; state = 'name'; stateT = 0; A.playSong(3);
    } else { state = 'title'; stateT = 0; menuSel = 0; startDemo(); A.playSong(station); }
  }

  /* ================= DISEGNO DEL MONDO ================= */
  function project(p, camX, camY, camZ) {
    var cxw = -camX, cyw = p.y - camY; p.cz = p.z - camZ;
    p.sc = DEPTH / p.cz;
    p.sx = Math.round(W / 2 + p.sc * cxw * W / 2);
    p.sy = Math.round(H / 2 - p.sc * cyw * H / 2);
    p.sw = Math.round(p.sc * ROADW * W / 2);
  }
  function poly(x1, y1, x2, y2, x3, y3, x4, y4, col) {
    cx.fillStyle = col; cx.beginPath(); cx.moveTo(x1, y1); cx.lineTo(x2, y2); cx.lineTo(x3, y3); cx.lineTo(x4, y4); cx.closePath(); cx.fill();
  }
  // part: 0 cordoli, 1 asfalto, 2 strisce, 3 cordoli+asfalto; senza part disegna tutto. Ai bivi i due rami si disegnano per parti, così non si coprono a vicenda.
  function roadPoly(x1, y1, w1, x2, y2, w2, light, pal, part) {
    var all = part === undefined, r1 = w1 / 7, r2 = w2 / 7;
    if (all || part === 0 || part === 3) {
      poly(x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, light ? pal.rumble0 : pal.rumble1);
      poly(x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, light ? pal.rumble0 : pal.rumble1);
    }
    if (all || part === 1 || part === 3) poly(x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, light ? pal.road0 : pal.road1);
    if (light && (all || part === 2)) {
      var l1 = w1 / 34, l2 = w2 / 34, lw1 = 2 * w1 / LANES, lw2 = 2 * w2 / LANES;
      for (var ln = 1; ln < LANES; ln++) {
        var a = x1 - w1 + lw1 * ln, b = x2 - w2 + lw2 * ln;
        poly(a - l1 / 2, y1, a + l1 / 2, y1, b + l2 / 2, y2, b - l2 / 2, y2, pal.lane);
      }
    }
  }
  // palette della strada con asfalto scuro miscelato in base alla distanza (k 0..1)
  var farCache = { pal: null, k: -1, out: null };
  function farPal(pal, k) {
    var q = Math.round(k * 20) / 20;
    if (farCache.pal === pal && farCache.k === q) return farCache.out;
    var dark = [38, 42, 50];
    function m(c) { return c.replace(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/, function (_, r, g, b) {
      return 'rgb(' + [r, g, b].map(function (v, i) { return Math.round(+v + (dark[i] - +v) * q); }).join(',') + ')'; }); }
    var out = { road0: m(pal.road0), road1: m(pal.road1), rumble0: m(pal.rumble0), rumble1: m(pal.rumble1), lane: pal.lane };
    farCache = { pal: pal, k: q, out: out };
    return out;
  }
  var palCache = { key: '', pal: null };
  function palette() {
    var a = TH[prevTheme].rgb, b = TH[stageId].rgb, t = themeT, key = prevTheme + ':' + stageId + ':' + t.toFixed(2);
    if (palCache.key === key) return palCache.pal;
    var p = {
      sky0: css(mix(a.sky[0], b.sky[0], t)), sky1: css(mix(a.sky[1], b.sky[1], t)), fog: css(mix(a.fog, b.fog, t)), fogRGB: mix(a.fog, b.fog, t),
      grass0: css(mix(a.grass[0], b.grass[0], t)), grass1: css(mix(a.grass[1], b.grass[1], t)),
      road0: css(mix(a.road[0], b.road[0], t)), road1: css(mix(a.road[1], b.road[1], t)),
      rumble0: css(mix(a.rumble[0], b.rumble[0], t)), rumble1: css(mix(a.rumble[1], b.rumble[1], t)), lane: css(mix(a.lane, b.lane, t))
    };
    palCache = { key: key, pal: p };
    return p;
  }
  function layer(img, off, yBottom, alpha) {
    if (alpha <= 0.01) return;
    var iw = img.width, sx = ((Math.floor(off * iw) % iw) + iw) % iw, y = yBottom - img.height;
    cx.globalAlpha = alpha;
    var w1 = Math.min(W, iw - sx);
    cx.drawImage(img, sx, 0, w1, img.height, 0, y, w1, img.height);
    if (w1 < W) cx.drawImage(img, 0, 0, W - w1, img.height, w1, y, W - w1, img.height);
    cx.globalAlpha = 1;
  }
  function drawSky(pal) {
    var g = cx.createLinearGradient(0, 0, 0, H / 2 + 4); g.addColorStop(0, pal.sky0); g.addColorStop(1, pal.sky1);
    cx.fillStyle = g; cx.fillRect(0, 0, W, H / 2 + 6);
    var list = (themeT >= 1 || prevTheme === stageId) ? [[stageId, 1]] : [[prevTheme, 1], [stageId, themeT]];
    list.forEach(function (pp) {
      var th = TH[pp[0]], al = pp[1]; if (al <= 0.01) return;
      var s = th.sun || th.moon;
      if (s) {
        var sa = list.length > 1 ? (pp[0] === stageId ? themeT : 1 - themeT) : 1;
        cx.globalAlpha = sa * 0.35; G.E(cx, s[0] * W, s[1] * H, s[2] * 1.8, s[2] * 1.8, s[3]);
        cx.globalAlpha = sa; G.E(cx, s[0] * W, s[1] * H, s[2], s[2], s[3]);
        if (th.moon) G.E(cx, s[0] * W + s[2] * 0.45, s[1] * H - s[2] * 0.2, s[2] * 0.85, s[2] * 0.85, pal.sky0);
        cx.globalAlpha = 1;
      }
      var bg = bgOf(pp[0]);
      layer(bg.clouds, bgOff[0] + (th.night ? 0 : cloudDrift), H / 2 - 20, al);
      layer(bg.far, bgOff[1], H / 2 + 3, al);
      layer(bg.near, bgOff[2], H / 2 + 5, al);
    });
  }
  function drawSprite(img, ww, sc, x, y, clipY) {
    var dw = ww * sc * W / 2, dh = dw * img.height / img.width, dx = x - dw / 2, dy = y - dh;
    if (dw < 0.8 || dx > W || dx + dw < 0 || dw > W * 5) return;
    var bottom = Math.min(dy + dh, clipY || dy + dh, H), top = Math.max(dy, 0);
    var left = Math.max(dx, 0), right = Math.min(dx + dw, W);
    if (bottom <= top || right <= left) return;
    // disegna solo la parte visibile: gli oggetti vicinissimi non pesano sul processore
    var kx = img.width / dw, ky = img.height / dh;
    var sx0 = Math.max(0, (left - dx) * kx), sy0 = Math.max(0, (top - dy) * ky);
    var sw = Math.min(img.width - sx0, (right - left) * kx), sh = Math.min(img.height - sy0, (bottom - top) * ky);
    if (sw < 0.5 || sh < 0.5) return;
    cx.drawImage(img, sx0, sy0, sw, sh, left, top, right - left, bottom - top);
  }

  // auto del giocatore: disegnata sul canvas ad alta risoluzione (3x) per avere nitidi i due passeggeri
  var shakeX = 0, shakeY = 0;
  function drawPlayerCar() {
    var cx = ux;
    cx.save(); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
    cx.scale(K, K); cx.translate(shakeX, shakeY);
    if (state !== 'title' && state !== 'radio' && state !== 'rank' && state !== 'clip') {
      var spd = speed / MAXS, bounce = (offroad && spd > 0.05 ? (Math.random() * 3) : (Math.random() * 1.2 * spd)) | 0;
      var img = (lookT > 0 ? carTurned : cheerT > 0 ? carCheer : carFrames)[crashT > 0 ? 0 : steerDir][brakeOn ? 1 : 0];
      var iw = img.width / HS, ih = img.height / HS, px = W / 2, py = H - 6 - bounce;
      if (crashT > 0) {
        var ph = Math.max(0, crashT - 1.2), hop = ph > 0 ? Math.sin((1 - ph / 1.2) * Math.PI) * 40 : 0;
        cx.save(); cx.translate(px, py - ih / 2 - hop); cx.rotate(Math.sin(crashAng) * 0.5 + (ph > 0 ? crashAng : 0));
        cx.drawImage(img, -iw / 2, -ih / 2, iw, ih); cx.restore();
        if (ph > 0) for (var k = 0; k < 6; k++) { cx.fillStyle = 'rgba(200,200,200,' + (0.5 * Math.random()) + ')'; cx.fillRect(px - 60 + Math.random() * 120, py - Math.random() * 40, 6, 6); }
      } else {
        cx.drawImage(img, px - iw / 2, py - ih, iw, ih);
        if (flameT > 0 && Math.random() < 0.85) {
          // fiammata dagli scarichi al cambio marcia
          var fx0 = Math.round(px - iw / 2) + 2, fy = Math.round(py - ih) + 64, k2 = Math.min(1, flameT * 3), fl = (8 + Math.random() * 10) * k2;
          [37.5, 90.5].forEach(function (ex) {
            G.E(cx, fx0 + ex, fy + 2, 10 * k2, 7 * k2, 'rgba(255,120,30,0.35)');
            G.E(cx, fx0 + ex + (Math.random() - 0.5) * 3, fy + fl * 0.4, 7 * k2, fl * 0.55, 'rgba(255,80,20,0.95)');
            G.E(cx, fx0 + ex, fy + fl * 0.3, 4.5 * k2, fl * 0.35, '#ffd23a');
            G.E(cx, fx0 + ex, fy + 2, 2.5 * k2, 2.5 * k2, '#ffffff');
          });
        }
        if (offroad && spd > 0.1) for (k = 0; k < 4; k++) { cx.fillStyle = 'rgba(160,130,90,0.5)'; cx.fillRect(px - 62 + Math.random() * 18 + (k % 2) * 100, py - 8 - Math.random() * 12, 5, 5); }
        if (skid) for (k = 0; k < 3; k++) { cx.fillStyle = 'rgba(230,230,230,0.45)'; cx.fillRect(px - 60 + (k % 2) * 104 + Math.random() * 10, py - 4 - Math.random() * 10, 7, 5); }
      }
    }
    cx.restore();
  }

  function renderWorld() {
    var pal = palette();
    var base = findSeg(position), basePct = (position % SEG) / SEG;
    var pSeg = findSeg(position + PZ), pPct = ((position + PZ) % SEG) / SEG;
    var pY = pSeg.p1.y + (pSeg.p2.y - pSeg.p1.y) * pPct;
    var sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random() - 0.5) * 8 * shake; sy = (Math.random() - 0.5) * 6 * shake; }
    cx.save(); cx.translate(sx, sy);
    drawSky(pal);
    cx.fillStyle = pal.grass1; cx.fillRect(-10, H / 2 + 4, W + 20, H / 2 + 10);
    var maxy = H + 10, x = 0, dx = -(base.curve * basePct), n, seg;
    // assegna le auto ai segmenti visibili
    for (n = 0; n < DRAW; n++) { seg = T.segs[base.i + n]; if (seg) seg.cars.length = 0; }
    cars.forEach(function (c) { var i = Math.floor(c.z / SEG); if (i >= base.i && i < base.i + DRAW) T.segs[i].cars.push(c); });
    var fogR = pal.fogRGB, nStart = -1, yStart = 0;
    for (n = 0; n < DRAW; n++) {
      seg = T.segs[base.i + n]; if (!seg) break;
      var d = n / DRAW; seg.fog = Math.max(0.61, 1 / Math.pow(Math.E, d * d * FOGD)); seg.clip = maxy;
      project(seg.p1, playerX * ROADW - x, pY + CAMH, position);
      project(seg.p2, playerX * ROADW - x - dx, pY + CAMH, position);
      x += dx; dx += seg.curve;
      // da qui in poi i segmenti sono più bassi di un pixel e la strada non verrebbe disegnata
      if (nStart < 0 && seg.p1.cz > DEPTH && seg.p2.sy >= seg.p1.sy) { nStart = n; yStart = maxy; }
      if (seg.p1.cz <= DEPTH || seg.p2.sy >= seg.p1.sy || seg.p2.sy >= maxy) continue;
      var p1 = seg.p1, p2 = seg.p2, light = Math.floor(seg.i / RUMBLE) % 2 === 0;
      cx.fillStyle = light ? pal.grass0 : pal.grass1; cx.fillRect(-10, p2.sy, W + 20, p1.sy - p2.sy);
      var c1 = seg.f1 * FORKC, c2 = seg.f2 * FORKC;
      // strada lontana: più scura, così non si confonde con la sabbia
      // in lontananza la strada non deve assottigliarsi fino a sparire: larghezza minima
      var rp = seg.fog < 0.99 ? farPal(pal, Math.min(0.55, (1 - seg.fog) * 2)) : pal;
      var w1 = seg.fog < 0.99 ? Math.max(p1.sw, 6) : p1.sw, w2 = seg.fog < 0.99 ? Math.max(p2.sw, 6) : p2.sw;
      // meno rifinito: oltre 40 segmenti niente strisce di corsia
      var np = n >= 40 && c1 === 0 && c2 === 0 ? 2 : 3;
      if (c1 === 0 && c2 === 0) roadPoly(p1.sx, p1.sy, w1, p2.sx, p2.sy, w2, light, rp, n >= 40 ? 3 : undefined);
      else {
        for (var part = 0; part < np; part++) {
          if (seg.fs !== 1) roadPoly(p1.sx - c1 * w1, p1.sy, w1, p2.sx - c2 * w2, p2.sy, w2, light, rp, part);
          if (seg.fs !== -1) roadPoly(p1.sx + c1 * w1, p1.sy, w1, p2.sx + c2 * w2, p2.sy, w2, light, rp, part);
        }
      }
      if (seg.fog < 0.99) { cx.fillStyle = 'rgba(' + (fogR[0] | 0) + ',' + (fogR[1] | 0) + ',' + (fogR[2] | 0) + ',' + (1 - seg.fog).toFixed(3) + ')'; cx.fillRect(-10, p2.sy, W + 20, p1.sy - p2.sy); }
      maxy = p2.sy;
    }
    // pezzi di strada mancanti: fasce di strada vera (cordoli, asfalto, strisce) proiettate fino all'orizzonte
    if (nStart >= 0) {
      var prev = null, last = yStart, hz = H / 2 + 4, q1, cur, rpf;
      for (n = nStart; n < DRAW; n++) {
        seg = T.segs[base.i + n]; if (!seg) break;
        q1 = seg.p1; if (q1.cz <= DEPTH || q1.sy >= last || q1.sy < hz) continue;
        cur = { c: seg.f1 * FORKC, fs: seg.fs, sx: q1.sx, sy: q1.sy, sw: Math.max(q1.sw, 2), light: Math.floor(seg.i / RUMBLE) % 2 === 0, fog: seg.fog };
        if (!prev) prev = { c: cur.c, fs: cur.fs, sx: q1.sx, sy: yStart, sw: cur.sw, light: cur.light, fog: seg.fog };
        rpf = farPal(pal, Math.min(0.55, (1 - cur.fog) * 2));
        if (cur.c === 0 && prev.c === 0) roadPoly(prev.sx, prev.sy, prev.sw, cur.sx, cur.sy, cur.sw, cur.light, rpf);
        else for (var pt = 0; pt < 3; pt++) { if (cur.fs !== 1) roadPoly(prev.sx - prev.c * prev.sw, prev.sy, prev.sw, cur.sx - cur.c * cur.sw, cur.sy, cur.sw, cur.light, rpf, pt); if (cur.fs !== -1) roadPoly(prev.sx + prev.c * prev.sw, prev.sy, prev.sw, cur.sx + cur.c * cur.sw, cur.sy, cur.sw, cur.light, rpf, pt); }
        last = q1.sy; prev = cur;
      }
    }
    var pz = position + PZ;
    for (n = DRAW - 1; n > 0; n--) {
      seg = T.segs[base.i + n]; if (!seg || !seg.p1.sc || seg.p1.cz <= DEPTH) continue;
      var i, sc;
      for (i = 0; i < seg.cars.length; i++) {
        var c = seg.cars[i]; if (c.z < pz - SEG * 0.3) continue;
        var pct = (c.z % SEG) / SEG; sc = seg.p1.sc + (seg.p2.sc - seg.p1.sc) * pct;
        var cc = (seg.f1 + (seg.f2 - seg.f1) * pct) * FORKC, co = c.off + (seg.fs ? seg.fs * cc : (c.off < 0 ? -cc : cc));
        var swp = seg.p1.sw + (seg.p2.sw - seg.p1.sw) * pct;
        var cxp = seg.p1.sx + (seg.p2.sx - seg.p1.sx) * pct + co * swp;
        var cyp = seg.p1.sy + (seg.p2.sy - seg.p1.sy) * pct;
        cx.imageSmoothingEnabled = true; drawSprite(c.v.img, c.v.ww, sc, cxp, cyp, seg.clip); cx.imageSmoothingEnabled = false;
      }
      for (i = 0; i < seg.spr.length; i++) {
        var sp = seg.spr[i]; sc = seg.p1.sc;
        drawSprite((sp.fl === undefined ? sp.off > 0 : sp.fl) && sp.s.imgR ? sp.s.imgR : sp.s.img, sp.s.ww, sc, seg.p1.sx + sp.off * seg.p1.sw, seg.p1.sy, seg.clip);
      }
    }
    shakeX = sx; shakeY = sy;
    cx.restore();
  }

  /* ================= INTERFACCIA (canvas ad alta risoluzione) ================= */
  function txt(s, x, y, size, col, align, italic, stroke) {
    ux.font = (italic ? 'italic ' : '') + '900 ' + size + 'px ' + FONT;
    ux.textAlign = align || 'left'; ux.textBaseline = 'alphabetic'; ux.lineJoin = 'round';
    if (stroke !== 0) { ux.lineWidth = Math.max(4, size * 0.16); ux.strokeStyle = stroke || '#101018'; ux.strokeText(s, x, y); }
    ux.fillStyle = col; ux.fillText(s, x, y);
  }
  function fmtT(t) { var m = Math.floor(t / 60), s = Math.floor(t % 60), c = Math.floor((t * 100) % 100); return m + "'" + (s < 10 ? '0' : '') + s + '"' + (c < 10 ? '0' : '') + c; }
  function fmtN(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function panel(x, y, w, h, a) { ux.fillStyle = 'rgba(10,8,30,' + (a == null ? 0.72 : a) + ')'; ux.fillRect(x, y, w, h); ux.strokeStyle = '#ff4ae0'; ux.lineWidth = 4; ux.strokeRect(x, y, w, h); }

  function hud() {
    var spd = speed / MAXS, kmh = Math.round(spd * 293);
    // tempo
    txt('TIME', 70, 80, 40, '#ffe14a', 'left', true);
    var tl = Math.ceil(Math.max(0, timeLeft)), low = timeLeft < 10 && Math.floor(stateT * 4) % 2 === 0;
    txt(String(tl), 80, 200, 130, low ? '#ff3030' : '#ffffff', 'left', true);
    // punteggio
    txt('SCORE', UW / 2, 70, 36, '#ff7ab0', 'center', true);
    txt(fmtN(score), UW / 2, 140, 64, '#ffffff', 'center', true);
    // giro
    txt('LEVEL ' + round + '   STAGE ' + (levelOf(stageId) + 1) + ' / 4', UW - 70, 70, 36, '#4af0ff', 'right', true);
    txt(fmtT(stageTime), UW - 70, 140, 56, '#ffffff', 'right', true);
    // tachimetro
    var bx = 70, by = UH - 70;
    txt(String(kmh), bx + 300, by, 110, '#ffffff', 'right', true);
    txt('km/h', bx + 315, by, 40, '#ffe14a', 'left', true);
    for (var i = 0; i < 20; i++) {
      var on = i < Math.round(spd * 20);
      ux.fillStyle = on ? (i < 10 ? '#30e060' : i < 16 ? '#ffe14a' : '#ff3030') : 'rgba(0,0,0,0.45)';
      ux.fillRect(bx + i * 24, by - 150 - i * 2.2, 18, 26 + i * 2.2);
    }
    txt(gearHi ? 'HI' : 'LO', bx + 520, by - 120, 56, gearHi ? '#ff4ae0' : '#4af0ff', 'left', true);
    if (stationShowT > 0 || state === 'count') {
      var s = A.songs[station];
      txt('♪ FM ' + s.fm + '  ' + s.name.toUpperCase(), UW - 70, UH - 70, 42, '#ffffff', 'right', true);
    }
    if (A.isMuted()) txt('AUDIO OFF', UW - 70, UH - 130, 36, '#ff8080', 'right', true);
  }
  function drawMsgs() {
    var yb = 420;
    msg.forEach(function (m) {
      var a = m.a, blink = m.k === 'big' || m.k === 'fork';
      if (blink && Math.floor(a * 6) % 2 === 1 && a < m.d - 0.5) return;
      if (m.k === 'go') { txt(m.t, UW / 2, 470, 160, m.c, 'center', true); }
      else if (m.k === 'big') { txt(m.t, UW / 2, 470, 140, m.c, 'center', true); }
      else if (m.k === 'small') { txt(m.t, UW / 2, 575, 60, m.c, 'center', true); }
      else if (m.k === 'stage') { if (a > 0.3) { txt(m.t, UW / 2, 290, 72, m.c, 'center', true, '#1a0f4a'); } }
      else if (m.k === 'fork') {
        txt(m.t, UW / 2, 300, 70, m.c, 'center', true);
        var l = (T.forkL || '').toUpperCase(), r = (T.forkR || '').toUpperCase();
        txt('◀ ' + l, UW / 2 - 60, 390, 48, '#ffffff', 'right', true); txt(r + ' ▶', UW / 2 + 60, 390, 48, '#ffffff', 'left', true);
      }
    });
  }
  function drawMap(x0, y0, sc) {
    var pos = function (id) { if (id >= 6) return [x0 + ((id - 6) - 2.5) * 60 * sc, y0 + 3 * 70 * sc]; var L = levelOf(id), i = idxIn(id); return [x0 + (i - L / 2) * 120 * sc, y0 + L * 70 * sc]; };
    ux.lineWidth = 6 * sc;
    for (var id = 0; id < 6; id++) for (var r = 0; r < 2; r++) {
      var a = pos(id), b = pos(childOf(id, r)), onPath = path.indexOf(id) >= 0 && path.indexOf(childOf(id, r)) >= 0;
      ux.strokeStyle = onPath ? '#ffe14a' : 'rgba(255,255,255,0.35)'; ux.beginPath(); ux.moveTo(a[0], a[1]); ux.lineTo(b[0], b[1]); ux.stroke();
    }
    for (id = 0; id < 12; id++) {
      var p = pos(id), cur = id === stageId, vis = path.indexOf(id) >= 0;
      if (cur && state === 'play' && Math.floor(stateT * 2) % 2) continue;
      ux.fillStyle = cur ? '#ff4ae0' : vis ? '#ffe14a' : '#5a5a7a';
      ux.beginPath(); ux.arc(p[0], p[1], (id >= 6 ? 12 : 16) * sc, 0, Math.PI * 2); ux.fill(); ux.strokeStyle = '#101018'; ux.lineWidth = 4; ux.stroke();
      if (id >= 6) txt(['AN', 'AP', 'PU', 'FM', 'FM', 'MC'][id - 6], p[0], p[1] + 38 * sc, 22 * sc, vis ? '#ffe14a' : '#aaaacc', 'center', true);
    }
  }
  var logoCanvas = null;
  function makeLogo() {
    logoCanvas = TR.mk(1400, 520);
    var g = logoCanvas.getContext('2d');
    G.sunStripes(g, 700, 230, 210, '#ffe14a', '#ff3a7a');
    g.font = 'italic 900 210px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    g.lineWidth = 26; g.strokeStyle = '#1a0f4a'; g.strokeText('TURBO', 700, 300);
    var gr = g.createLinearGradient(0, 130, 0, 300);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#a8e8ff'); gr.addColorStop(0.5, '#2a4ad0'); gr.addColorStop(0.75, '#ff9ae0'); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.fillText('TURBO', 700, 300);
    g.font = 'italic 900 150px ' + FONT;
    g.lineWidth = 22; g.strokeStyle = '#1a0f4a'; g.strokeText('RIVIERA', 720, 450);
    g.shadowColor = '#ff4ae0'; g.shadowBlur = 30; g.fillStyle = '#ff4ae0'; g.fillText('RIVIERA', 720, 450); g.shadowBlur = 0;
    g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.strokeText('RIVIERA', 720, 450);
  }
  function drawTitle() {
    if (!logoCanvas) makeLogo();
    ux.fillStyle = 'rgba(10,6,40,0.25)'; ux.fillRect(0, 0, UW, UH);
    ux.drawImage(logoCanvas, (UW - 1400) / 2, 20);
    var items = ['PLAY', 'HIGH SCORES', 'THROTTLE: ' + (autoGas ? 'AUTO' : 'MANUAL'), 'SOUND: ' + (A.isMuted() ? 'OFF' : 'ON')];
    items.forEach(function (it, i) {
      var sel = i === menuSel, y = 640 + i * 90;
      if (sel) { ux.fillStyle = 'rgba(255,74,224,0.35)'; ux.fillRect(UW / 2 - 470, y - 66, 940, 84); }
      txt((sel ? '▶ ' : '') + it, UW / 2, y, sel ? 64 : 54, sel ? '#ffe14a' : '#ffffff', 'center', true);
    });
    txt('▲▼ select   OK confirm   RED radio   GREEN sound   BACK exit', UW / 2, UH - 50, 32, '#ffffff', 'center', false);
  }
  function drawRank() {
    ux.fillStyle = 'rgba(10,6,40,0.55)'; ux.fillRect(0, 0, UW, UH);
    txt('HIGH SCORES', UW / 2, 170, 110, '#ffe14a', 'center', true);
    scores.forEach(function (r, i) {
      var y = 330 + i * 120, hl = i === newRank && Math.floor(stateT * 4) % 2 === 0;
      var col = hl ? '#ff4ae0' : '#ffffff';
      txt((i + 1) + '°', 300, y, 70, '#4af0ff', 'left', true);
      txt(r.n, 470, y, 70, col, 'left', true);
      txt(fmtN(r.s), 1150, y, 70, col, 'right', true);
      txt(r.st || '', 1220, y, 42, '#ffe14a', 'left', true);
    });
    txt('OK to go back', UW / 2, UH - 60, 36, '#ffffff', 'center', false);
  }
  function drawRadio() {
    ux.fillStyle = 'rgba(10,6,40,0.45)'; ux.fillRect(0, 0, UW, UH);
    txt('CHOOSE YOUR RADIO', UW / 2, 170, 100, '#ffe14a', 'center', true);
    // autoradio
    var x = 260, y = 280, w = 1400, h = 520;
    ux.fillStyle = '#1a1a22'; ux.fillRect(x, y, w, h); ux.strokeStyle = '#6a6a78'; ux.lineWidth = 8; ux.strokeRect(x, y, w, h);
    ux.fillStyle = '#0c2a1a'; ux.fillRect(x + 60, y + 50, w - 120, 150);
    var s = A.songs[station];
    txt('FM ' + s.fm + ' MHz', x + 100, y + 150, 80, '#5aff8a', 'left', false, 0);
    txt('♪ ' + s.name.toUpperCase(), x + w - 100, y + 150, 56, '#5aff8a', 'right', false, 0);
    // scala delle frequenze
    ux.fillStyle = '#c8c0a0'; ux.fillRect(x + 60, y + 240, w - 120, 90);
    for (var f = 0; f <= 20; f++) { ux.fillStyle = '#222'; ux.fillRect(x + 80 + f * (w - 160) / 20, y + 250, 3, f % 5 ? 25 : 45); }
    var fx = x + 80 + ((parseFloat(s.fm) - 87.5) / 20.5) * (w - 160);
    ux.fillStyle = '#ff2a2a'; ux.fillRect(fx - 4, y + 236, 8, 98);
    for (var i = 0; i < 3; i++) {
      var bxx = x + 120 + i * 400, sel = i === station;
      ux.fillStyle = sel ? '#ffe14a' : '#3a3a48'; ux.fillRect(bxx, y + 370, 360, 110);
      txt(A.songs[i].name, bxx + 180, y + 420, 38, sel ? '#1a1a22' : '#ffffff', 'center', false, 0);
      txt('FM ' + A.songs[i].fm, bxx + 180, y + 465, 32, sel ? '#1a1a22' : '#aaaacc', 'center', false, 0);
    }
    txt('◀ ▶ change station     OK  GO!', UW / 2, UH - 120, 54, '#ffffff', 'center', true);
    txt('While driving, the RED button changes station', UW / 2, UH - 50, 34, '#ffe14a', 'center', false);
  }
  function drawPause() {
    ux.fillStyle = 'rgba(10,6,40,0.6)'; ux.fillRect(0, 0, UW, UH);
    txt('PAUSE', UW / 2, 230, 130, '#ffe14a', 'center', true);
    var s = A.songs[station];
    var items = ['RESUME', '◀ RADIO: ' + s.name.toUpperCase() + ' ▶', 'THROTTLE: ' + (autoGas ? 'AUTO' : 'MANUAL'), 'RESTART', 'BACK TO TITLE'];
    items.forEach(function (it, i) {
      var sel = i === pauseSel, y = 420 + i * 100;
      if (sel) { ux.fillStyle = 'rgba(255,74,224,0.35)'; ux.fillRect(UW / 2 - 560, y - 70, 1120, 90); }
      txt(it, UW / 2, y, sel ? 64 : 54, sel ? '#ffe14a' : '#ffffff', 'center', true);
    });
    txt('◀ ▶ steer   ▼ brake   ' + (autoGas ? '▲ gas on   ▼ tap: hold speed, keep pressed: brake   (automatic gears)' : '▲ gas on   ▼ tap: hold speed, keep pressed: brake   OK gear') + '   YELLOW toggles throttle', UW / 2, UH - 50, 30, '#ffffff', 'center', false);
  }
  var CLIP_BURN = 2.4, CLIP_LEN = 8, clipSmoke = [], clipCar = null;
  function clipPos(t) {
    // posizione e grandezza dell'auto: ferma (sgommata) poi sempre più piccola verso il punto di fuga
    var base = 132 * K * 2, d = 1;
    if (t > CLIP_BURN) { var p = t - CLIP_BURN; d = 1 / (1 + p * p * 1.6 + p * 0.6); }
    var hy = UH * 0.565, by = UH - 20;
    var shake = t < CLIP_BURN ? (Math.random() - 0.5) * 8 : 0;
    return { d: d, w: base * d, x: UW / 2 + shake, y: hy + (by - hy) * d + (t < CLIP_BURN ? Math.random() * 4 : 0) };
  }
  function drawBalloons(t) {
    clipBalloons.forEach(function (b) {
      var tt = t - b.dl; if (tt <= 0) return;
      var y = b.y0 - tt * b.vy, x = b.x + Math.sin(tt * 1.6 + b.ph) * 22;
      if (y < -200) return;
      var rx = b.r, ry = b.r * 1.22;
      ux.strokeStyle = 'rgba(255,255,255,0.75)'; ux.lineWidth = 2.5; ux.beginPath(); ux.moveTo(x, y + ry + 6);
      ux.bezierCurveTo(x - 14 + Math.sin(tt * 3 + b.ph) * 10, y + ry + 40, x + 14, y + ry + 70, x + Math.sin(tt * 2 + b.ph) * 12, y + ry + 110); ux.stroke();
      var g = ux.createRadialGradient(x - rx * 0.35, y - ry * 0.4, rx * 0.1, x, y, rx * 1.15); g.addColorStop(0, '#ffffff'); g.addColorStop(0.18, b.col); g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ux.fillStyle = b.col; ux.beginPath(); ux.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ux.fill();
      ux.fillStyle = g; ux.globalAlpha = 0.85; ux.beginPath(); ux.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ux.fill(); ux.globalAlpha = 1;
      ux.fillStyle = b.col; ux.beginPath(); ux.moveTo(x, y + ry - 2); ux.lineTo(x - 8, y + ry + 12); ux.lineTo(x + 8, y + ry + 12); ux.closePath(); ux.fill();
      ux.fillStyle = 'rgba(255,255,255,0.7)'; ux.beginPath(); ux.ellipse(x - rx * 0.4, y - ry * 0.45, rx * 0.16, ry * 0.26, -0.5, 0, Math.PI * 2); ux.fill();
    });
  }
  function drawFinishTitle(t) {
    if (t < 0.4) return;
    var k = Math.min(1, (t - 0.4) / 0.6), sc = 1 + Math.sin(k * Math.PI) * 0.25 + (k >= 1 ? Math.sin(t * 3) * 0.02 : 0), cxp = UW / 2, cyp = 330;
    ux.save(); ux.globalAlpha = k; ux.translate(cxp, cyp); ux.scale(sc * k, sc * k);
    ux.font = 'italic 900 330px ' + FONT; ux.textAlign = 'center'; ux.textBaseline = 'alphabetic'; ux.lineJoin = 'round';
    ux.shadowColor = '#ff4ae0'; ux.shadowBlur = 50; ux.lineWidth = 46; ux.strokeStyle = '#1a0f4a'; ux.strokeText('FINISH', 0, 110);
    ux.shadowBlur = 0; ux.lineWidth = 22; ux.strokeStyle = '#ffffff'; ux.strokeText('FINISH', 0, 110);
    var gr = ux.createLinearGradient(0, -170, 0, 120); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.45, '#ffc21f'); gr.addColorStop(0.5, '#ff7a1f'); gr.addColorStop(1, '#ff2a7a');
    ux.fillStyle = gr; ux.fillText('FINISH', 0, 110);
    ux.fillStyle = 'rgba(255,255,255,0.35)'; ux.save(); ux.beginPath(); ux.rect(-700, -170, 1400, 120); ux.clip(); ux.fillText('FINISH', 0, 110); ux.restore();
    ux.restore();
    // stelline che brillano intorno alla scritta
    for (var i = 0; i < 9; i++) {
      var a = (t * 2 + i * 0.7) % 2, sx = cxp + Math.cos(i * 2.4) * 640, sy = cyp - 40 + Math.sin(i * 3.1) * 130, r = 18 * Math.max(0, 1 - Math.abs(a - 1)) * k;
      if (r > 1) { ux.fillStyle = '#ffffff'; ux.beginPath(); ux.moveTo(sx, sy - r * 2); ux.lineTo(sx + r * 0.5, sy - r * 0.5); ux.lineTo(sx + r * 2, sy); ux.lineTo(sx + r * 0.5, sy + r * 0.5); ux.lineTo(sx, sy + r * 2); ux.lineTo(sx - r * 0.5, sy + r * 0.5); ux.lineTo(sx - r * 2, sy); ux.lineTo(sx - r * 0.5, sy - r * 0.5); ux.closePath(); ux.fill(); }
    }
  }
  function drawClip(t) {
    if (!clipCar) clipCar = G.carHD('cheer', 6);
    var cp = clipPos(t), h = cp.w * clipCar.height / clipCar.width;
    ux.save(); ux.imageSmoothingEnabled = true; ux.imageSmoothingQuality = 'high';
    // fumo dietro le gomme
    clipSmoke.forEach(function (m) { if (m.y > cp.y - h * 0.3) return; G.E(ux, m.x, m.y, m.r, m.r * 0.7, 'rgba(235,235,240,' + (m.a * 0.8) + ')'); });
    var sg = ux.createRadialGradient(cp.x, cp.y - h * 0.04, cp.w * 0.05, cp.x, cp.y - h * 0.04, cp.w * 0.62);
    sg.addColorStop(0, 'rgba(0,0,0,0.45)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ux.save(); ux.translate(cp.x, cp.y - h * 0.04); ux.scale(1, 0.18); ux.translate(-cp.x, -(cp.y - h * 0.04)); ux.fillStyle = sg; ux.fillRect(cp.x - cp.w, cp.y - h * 0.04 - cp.w, cp.w * 2, cp.w * 2); ux.restore();
    ux.drawImage(clipCar, cp.x - cp.w / 2, cp.y - h, cp.w, h);
    // riflesso dell'auto sull'asfalto
    ux.save(); ux.globalAlpha = 0.12; ux.translate(0, (cp.y) * 2); ux.scale(1, -1); ux.drawImage(clipCar, 0, clipCar.height * 0.62, clipCar.width, clipCar.height * 0.38, cp.x - cp.w / 2, cp.y - h * 0.38 - h * 0.02, cp.w, h * 0.38); ux.restore();
    // fiammate all'avvio
    if (t > CLIP_BURN && t < CLIP_BURN + 0.7 && Math.random() < 0.85) [37.5, 90.5].forEach(function (ex) {
      var k = cp.w / 132, fx = cp.x - cp.w / 2 + (ex + 2) * k, fy = cp.y - h + 66 * k, fl = (10 + Math.random() * 12) * k;
      G.E(ux, fx, fy + fl * 0.4, 7 * k, fl * 0.55, 'rgba(255,80,20,0.95)'); G.E(ux, fx, fy + fl * 0.3, 4.5 * k, fl * 0.35, '#ffd23a');
    });
    clipSmoke.forEach(function (m) { if (m.y <= cp.y - h * 0.3) return; G.E(ux, m.x, m.y, m.r, m.r * 0.7, 'rgba(235,235,240,' + (m.a * 0.8) + ')'); });
    ux.restore();
    drawBalloons(t); drawFinishTitle(t);
    if (t > CLIP_BURN + 1.5) txt('SEE YOU ON THE RIVIERA!', UW / 2, 470, 84, '#ffe14a', 'center', true);
    if (t > CLIP_LEN - 0.8) { ux.fillStyle = 'rgba(10,6,40,' + Math.min(1, (t - CLIP_LEN + 0.8) / 0.8) + ')'; ux.fillRect(0, 0, UW, UH); }
  }
  function drawEnding() {
    ux.fillStyle = 'rgba(10,6,40,' + Math.min(0.75, stateT * 0.5) + ')'; ux.fillRect(0, 0, UW, UH);
    if (!logoCanvas) makeLogo();
    txt('CONGRATULATIONS!', UW / 2, 220, 140, '#ffe14a', 'center', true);
    txt('Welcome to ' + region + '!', UW / 2, 340, 64, '#ffffff', 'center', true);
    txt('Total time ' + fmtT(totalTime), UW / 2, 450, 56, '#4af0ff', 'center', true);
    txt('Score ' + fmtN(score), UW / 2, 560, 72, '#ff7ab0', 'center', true);
    if (stateT > 2 && Math.floor(stateT * 2) % 2 === 0) txt('press OK', UW / 2, UH - 50, 44, '#ffffff', 'center', true);
  }
  function drawName() {
    ux.fillStyle = 'rgba(10,6,40,0.7)'; ux.fillRect(0, 0, UW, UH);
    txt('NEW RECORD!', UW / 2, 200, 120, '#ffe14a', 'center', true);
    txt(['1st', '2nd', '3rd', '4th', '5th'][newRank] + ' place  -  ' + fmtN(score) + ' points', UW / 2, 320, 60, '#ffffff', 'center', true);
    txt('Enter your initials', UW / 2, 430, 50, '#4af0ff', 'center', true);
    for (var i = 0; i < 3; i++) {
      var x = UW / 2 + (i - 1) * 220, sel = i === namePos;
      ux.fillStyle = sel ? 'rgba(255,74,224,0.45)' : 'rgba(255,255,255,0.12)'; ux.fillRect(x - 90, 500, 180, 220);
      txt(LETTERS[nameChars[i]], x, 680, 160, sel ? '#ffe14a' : '#ffffff', 'center', true);
      if (sel) { txt('▲', x, 495, 50, '#ffffff', 'center', false); txt('▼', x, 780, 50, '#ffffff', 'center', false); }
    }
    txt('▲▼ letter   ◀ ▶ move   OK confirm', UW / 2, UH - 70, 44, '#ffffff', 'center', false);
  }

  function render() {
    if (state === 'intro') { drawIntro(stateT); return; }
    renderWorld();
    ux.clearRect(0, 0, UW, UH);
    drawPlayerCar();
    switch (state) {
      case 'title': drawTitle(); break;
      case 'rank': drawRank(); break;
      case 'radio': drawRadio(); break;
      case 'count':
        hud(); drawMsgs();
        var n = stateT < 0.6 ? 0 : stateT < 1.6 ? 3 : stateT < 2.6 ? 2 : 1;
        if (n) txt(String(n), UW / 2, 560, 260, '#ffe14a', 'center', true);
        // semaforo
        for (var i = 0; i < 3; i++) { ux.fillStyle = '#111'; ux.fillRect(UW / 2 - 200 + i * 140, 600, 120, 120); ux.fillStyle = (4 - n) > i && n ? '#ff3030' : '#3a1010'; ux.beginPath(); ux.arc(UW / 2 - 140 + i * 140, 660, 46, 0, 7); ux.fill(); }
        drawMap(UW - 320, 260, 0.8);
        break;
      case 'play': hud(); drawMsgs(); if (mapT > 0) drawMap(UW - 320, 260, 0.8); break;
      case 'pause': hud(); drawPause(); break;
      case 'timeup': hud(); if (Math.floor(stateT * 3) % 2 === 0) txt('TIME UP', UW / 2, 460, 140, '#ff3030', 'center', true); txt('GAME OVER', UW / 2, 600, 80, '#ffffff', 'center', true); break;
      case 'goal': mapT = 0; hud(); drawMsgs(); if (stateT > 1) txt('TIME BONUS ' + fmtN(endBonus), UW / 2, 560, 70, '#ffffff', 'center', true); break;
      case 'clip': drawClip(stateT); break;
      case 'ending': drawEnding(); break;
      case 'name': drawName(); break;
    }
  }


  /* ================= INTRO ================= */
  var introC = null;
  function makeIntro() {
    introC = {};
    var t = TR.mk(1300, 260), g = t.getContext('2d');
    g.font = 'italic 900 210px ' + FONT; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    g.lineWidth = 26; g.strokeStyle = '#1a0f4a'; g.strokeText('TURBO', 650, 225);
    var gr = g.createLinearGradient(0, 55, 0, 225);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#a8e8ff'); gr.addColorStop(0.5, '#2a4ad0'); gr.addColorStop(0.75, '#ff9ae0'); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.fillText('TURBO', 650, 225);
    introC.turbo = t;
    var r = TR.mk(1300, 230), h = r.getContext('2d');
    h.font = 'italic 900 150px ' + FONT; h.textAlign = 'center'; h.textBaseline = 'alphabetic'; h.lineJoin = 'round';
    h.lineWidth = 22; h.strokeStyle = '#1a0f4a'; h.strokeText('RIVIERA', 650, 170);
    h.shadowColor = '#ff4ae0'; h.shadowBlur = 30; h.fillStyle = '#ff4ae0'; h.fillText('RIVIERA', 650, 170); h.shadowBlur = 0;
    h.lineWidth = 3; h.strokeStyle = '#ffffff'; h.strokeText('RIVIERA', 650, 170);
    introC.riviera = r;
    var sn = TR.mk(600, 600); G.sunStripes(sn.getContext('2d'), 300, 300, 280, '#ffe14a', '#ff3a7a'); introC.sun = sn;
    var st = TR.mk(UW, 640), sg = st.getContext('2d'), rr = TR.rng(99);
    for (var i = 0; i < 220; i++) { sg.fillStyle = 'rgba(255,255,255,' + (0.3 + rr() * 0.7) + ')'; var z = rr() < 0.15 ? 4 : 2; sg.fillRect(rr() * UW, rr() * 600, z, z); }
    introC.stars = st;
  }
  function ease(x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); }
  function drawIntro(t) {
    if (!introC) makeIntro();
    cx.fillStyle = '#05021a'; cx.fillRect(0, 0, W, H);
    var HZ = 640, a = Math.min(1, t / 1.0);
    ux.globalAlpha = 1; ux.fillStyle = '#05021a'; ux.fillRect(0, 0, UW, UH);
    ux.globalAlpha = a;
    var gr = ux.createLinearGradient(0, 0, 0, HZ); gr.addColorStop(0, '#05021a'); gr.addColorStop(0.6, '#3a0f5a'); gr.addColorStop(1, '#ff3a7a');
    ux.fillStyle = gr; ux.fillRect(0, 0, UW, HZ);
    ux.drawImage(introC.stars, 0, 0);
    // sole che sorge
    var sy = HZ + 300 - ease((t - 0.3) / 2.2) * 480;
    ux.save(); ux.beginPath(); ux.rect(0, 0, UW, HZ); ux.clip(); ux.drawImage(introC.sun, UW / 2 - 300, sy - 300); ux.restore();
    // pavimento a griglia al neon che scorre
    ux.fillStyle = '#0a0420'; ux.fillRect(0, HZ, UW, UH - HZ);
    ux.strokeStyle = '#ff4ae0'; ux.lineWidth = 3;
    var fr = (t * 1.6) % 1;
    for (var k = 0; k < 16; k++) { var p = (k + fr) / 16, y = HZ + (UH - HZ) * p * p; ux.globalAlpha = a * Math.min(1, p * 3); ux.beginPath(); ux.moveTo(0, y); ux.lineTo(UW, y); ux.stroke(); }
    ux.globalAlpha = a;
    for (var j = -12; j <= 12; j++) { ux.beginPath(); ux.moveTo(UW / 2 + j * 30, HZ); ux.lineTo(UW / 2 + j * 260, UH); ux.stroke(); }
    ux.fillStyle = '#ff9ae0'; ux.fillRect(0, HZ - 2, UW, 4);
    ux.globalAlpha = 1;
    // l'auto arriva dal basso
    var img = carFrames[0][0], cw = img.width * 5 / HS, ch = img.height * 5 / HS;
    var cy = UH + 40 - ease((t - 1.2) / 1.6) * (ch + 10);
    ux.imageSmoothingEnabled = false;
    ux.drawImage(img, UW / 2 - cw / 2, cy - ch + ch, cw, ch);
    if (t > 2.8 && t < 3.4 && Math.random() < 0.85) {
      [37.5, 90.5].forEach(function (ex) {
        var fx = UW / 2 - cw / 2 + (ex + 2) * 5, fy = cy + 64 * 5, fl = 40 + Math.random() * 50;
        ux.fillStyle = 'rgba(255,80,20,0.9)'; ux.beginPath(); ux.ellipse(fx, fy + fl * 0.4, 32, fl * 0.55, 0, 0, 7); ux.fill();
        ux.fillStyle = '#ffd23a'; ux.beginPath(); ux.ellipse(fx, fy + fl * 0.3, 20, fl * 0.35, 0, 0, 7); ux.fill();
      });
    }
    // scritte che entrano
    var tx = -1400 + ease((t - 2.2) / 0.8) * (1400 + UW / 2 - 650);
    if (t > 2.2) ux.drawImage(introC.turbo, tx, 60);
    var rx = UW + 100 - ease((t - 2.8) / 0.8) * (UW + 100 - (UW / 2 - 630));
    if (t > 2.8) ux.drawImage(introC.riviera, rx, 290);
    if (t > 3.6 && t < 4.2) { ux.fillStyle = 'rgba(255,255,255,' + (1 - (t - 3.6) / 0.6) + ')'; ux.fillRect(0, 0, UW, UH); }
    if (t > 4.3 && Math.floor(t * 1.5) % 2 === 0) txt('PRESS OK', UW / 2, 600, 56, '#ffffff', 'center', true);
    if (t > 4.3) txt('a game for Cristian  •  2026', UW - 40, UH - 30, 28, '#ff9ae0', 'right', false, 0);
  }

  /* ================= CICLO PRINCIPALE ================= */
  var last = 0, errN = 0, lastErr = '';
  function noteErr(e) { errN++; lastErr = String(e && e.message || e).slice(0, 80); try { if (errN < 5 && window.console) console.error(e); } catch (x) { } }
  function loop(ts) {
    requestAnimationFrame(loop);
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60; last = ts;
    // un errore in un fotogramma non deve mai fermare il gioco
    try { update(dt); } catch (e) { noteErr(e); }
    try { render(); } catch (e) { noteErr(e); try { cx.restore(); } catch (e2) { } }
    if (errN) try { txt('E' + errN + ' ' + lastErr, 20, UH - 12, 18, '#ffffff', 'left', false, 0); } catch (e) { }
  }
  startDemo();
  try { A.init(); } catch (e) { }
  requestAnimationFrame(loop);
  TR.debug = { get state() { return state; }, set: function (k, v) { eval(k + '=v'); }, get: function (k) { return eval(k); }, startGame: startGame, keys: keys, pressed: function (a) { pressed[a] = true; } };
})();
