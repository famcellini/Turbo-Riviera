/* (c) 2026 Cristian - Turbo Riviera. CC BY-NC 4.0: libero uso, copia e modifica con citazione dell'autore, ma vietata la vendita / free to use, share and modify with credit, NO commercial use or sale. See LICENSE. */
/* Turbo Riviera - grafica: tutti gli sprite sono disegnati dal codice (nessuna immagine esterna) */
'use strict';
var TR = window.TR = window.TR || {};
(function () {
  function mk(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function R(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
  function P(g, pts, c) { g.fillStyle = c; g.beginPath(); g.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); g.closePath(); g.fill(); }
  function E(g, x, y, rx, ry, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2); g.fill(); }
  function RR(g, x, y, w, h, r, c) {
    g.fillStyle = c; g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath(); g.fill();
  }
  // poligono con angoli arrotondati (r: raggio unico o uno per vertice)
  function rpPath(g, pts, r) {
    var n = pts.length / 2, i, o, k, ax, ay, bx, by, cx, cy, rr, l1, l2, m;
    g.beginPath();
    for (i = 0; i <= n; i++) {
      o = i % n; k = (o + 1) % n; m = (o + n - 1) % n;
      ax = pts[2 * m]; ay = pts[2 * m + 1]; bx = pts[2 * o]; by = pts[2 * o + 1]; cx = pts[2 * k]; cy = pts[2 * k + 1];
      rr = typeof r === 'number' ? r : r[o];
      l1 = Math.hypot(ax - bx, ay - by) / 2; l2 = Math.hypot(cx - bx, cy - by) / 2;
      if (i === 0) g.moveTo((bx + cx) / 2, (by + cy) / 2);
      else g.arcTo(bx, by, (bx + cx) / 2, (by + cy) / 2, Math.min(rr, l1, l2));
    }
    g.closePath();
  }
  function RP(g, pts, r, c) { g.fillStyle = c; rpPath(g, pts, r); g.fill(); }
  var BODY = [2, 30, 8, 21, 120, 21, 126, 30, 126, 51, 2, 51], BODYR = [5, 7, 7, 5, 3, 3];
  var DECK = [6, 22, 22, 12, 106, 12, 122, 22], DECKR = [2, 6, 6, 2];
  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); }
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
  }
  TR.mk = mk; TR.rng = rng; TR.shade = shade; TR.RR = RR;

  /* ================= AUTO DEL GIOCATORE (cabriolet rossa, vista da dietro) ================= */
  // sprite di lei disegnati da Cristian (pass.js), decodificati una volta sola
  var herCache = {}, ANGRY_SHIFT = -7;
  function herSprite(k) {
    if (!TR.PASS || !TR.PASS[k]) return null;
    if (herCache[k]) return herCache[k];
    var d = TR.PASS[k], c = mk(d.w, d.h), x = c.getContext('2d'), im = x.createImageData(d.w, d.h), bin = atob(d.d), i;
    for (i = 0; i < bin.length; i++) im.data[i] = bin.charCodeAt(i);
    x.putImageData(im, 0, 0);
    if (d.full) return (herCache[k] = { c: c, full: d });
    // sommita' della chioma arrotondata con una curva (il ritaglio era tagliato di netto)
    var R = 8.5, hc = d.hc, hw = d.hw, ht = d.ht;
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = '#000';
    x.save(); x.beginPath(); x.rect(k === 'c' ? hc : hc - hw - 3, ht - 1, k === 'c' ? hw + 3 : 2 * hw + 6, R + 1); x.clip();
    x.beginPath(); x.rect(hc - hw - 4, ht - 2, 2 * hw + 8, R + 3); x.ellipse(hc, ht + R, hw, R, 0, 0, Math.PI * 2, true); x.fill('evenodd');
    x.restore();
    if (k === 'c') {
      // angolo alto-sinistro della chioma (lato viso): solo un raccordo morbido, il viso resta com'e'
      var hl = d.hl, rc = 4.5;
      x.save(); x.beginPath(); x.rect(hl - 1, ht - 1, rc + 1, rc + 1); x.clip();
      x.beginPath(); x.rect(hl - 2, ht - 2, rc + 3, rc + 3); x.arc(hl + rc, ht + rc, rc, 0, Math.PI * 2, true); x.fill('evenodd'); x.restore();
    }
    x.globalCompositeOperation = 'source-over';
    return (herCache[k] = { c: c, cx: d.cx, top: d.top });
  }
  // dopo il cappotto: mano alzata con l'indice dritto verso di lui, gesto "stai attento"
  function fistHand(g, sh) {
    var SKIN = '#f6cfb0', SD = '#e2a888';
    g.lineCap = 'round';
    g.strokeStyle = SKIN; g.lineWidth = 2.8; g.beginPath(); g.moveTo(78 + sh, 10); g.lineTo(69.5 + sh, 6.8); g.stroke();
    E(g, 67.4 + sh, 5.9, 2.7, 2.4, SKIN);
    E(g, 67.4 + sh, 7.2, 2.4, 0.9, SD);
    // indice teso, leggermente inclinato verso di lui
    g.strokeStyle = SKIN; g.lineWidth = 1.8; g.beginPath(); g.moveTo(66.3 + sh, 4.6); g.lineTo(65.2 + sh, 0.2); g.stroke();
    E(g, 65.15 + sh, -0.05, 0.6, 0.6, '#d4143a');
    // mano sinistra vista da dietro (palmo verso di lui): dorso della mano, pollice nascosto, dita chiuse solo accennate
    E(g, 67.6 + sh, 7.3, 2.2, 0.7, SD);
    g.strokeStyle = SD; g.lineWidth = 0.4; g.beginPath(); g.moveTo(65.2 + sh, 7.2); g.lineTo(65.2 + sh, 8.2); g.stroke();
    E(g, 66.2 + sh, 4.9, 0.9, 0.5, '#fbe0c8');
  }

  // capelli corti visti da dietro: unica sagoma, tonda in alto e ristretta sulla nuca, ombreggiata dall'alto a sinistra
  function pixHairBack(g, cx, pal, seed) {
    var rnd = rng(seed), y, x, hw, u, v, l, t, ny;
    for (y = -8; y <= 10; y++) {
      if (y < 2) { v = (y + 0.5) / 8.5; hw = 8.6 * Math.sqrt(Math.max(0, 1 - v * v)); }
      else if (y <= 5) { hw = 8.6; }
      else { hw = 8.6 - (y - 5) * 0.62; }
      for (x = -Math.floor(hw); x <= Math.floor(hw); x++) {
        u = x / 8.6; ny = (y + 8) / 18;
        l = -(u * 0.45 + ny * 0.55) + 0.25 + (rnd() - 0.5) * 0.5 - (Math.abs(u) > 0.8 ? 0.25 : 0);
        t = l > 0.5 ? 3 : l > 0.05 ? 2 : l > -0.4 ? 1 : 0;
        R(g, Math.round(cx + x), y, 1, 1, pal[t]);
      }
    }
  }
  // capigliatura a pixel: ellisse con ciuffi, 4 toni sfumati dall'alto a sinistra
  function pixHair(g, cx, cy, rx, ry, pal, seed, flare) {
    var rnd = rng(seed), x, y, u, v, r, lim, l, t;
    for (y = -Math.floor(ry); y <= Math.floor(ry); y++) {
      for (x = -Math.floor(rx); x <= Math.floor(rx); x++) {
        u = x / rx; v = y / ry;
        if (flare && v > 0) u /= 1 + 0.14 * v;
        lim = 1 + (flare ? 0.07 : 0.03) * Math.sin(Math.atan2(v, u) * (flare ? 7 : 5) + seed);
        r = Math.sqrt(u * u + v * v);
        if (r > lim) continue;
        l = -(u * 0.45 + v * 0.75) + (rnd() - 0.5) * 0.5 - (r > 0.82 ? 0.35 : 0);
        t = l > 0.5 ? 3 : l > 0.05 ? 2 : l > -0.45 ? 1 : 0;
        R(g, Math.round(cx + x), Math.round(cy + y), 1, 1, pal[t]);
      }
    }
  }
  function playerCar(dir, brake, turned, hs, noShadow) {
    // sportiva italiana anni '80 scoperta: larga e bassa, griglia a lamelle sopra i fanali
    // hs: fattore di risoluzione (per il filmato finale l'auto è disegnata più grande e più definita)
    hs = hs || 1;
    var c = mk(132 * hs, 90 * hs), g = c.getContext('2d'), sh = dir * 3, i;
    g.scale(hs, hs);
    g.translate(2, 22);
    if (!noShadow) E(g, 64, 62, 64, 6, 'rgba(0,0,0,0.4)');
    // ruote larghe
    RR(g, 4 - (dir > 0 ? 2 : 0), 38, 25, 24, 5, '#101010'); RR(g, 99 + (dir < 0 ? 2 : 0), 38, 25, 24, 5, '#101010');
    for (i = 0; i < 4; i++) { R(g, 7 - (dir > 0 ? 2 : 0), 42 + i * 5, 19, 1, '#2a2a2a'); R(g, 102 + (dir < 0 ? 2 : 0), 42 + i * 5, 19, 1, '#2a2a2a'); }
    // parabrezza basso e inclinato, piu' largo del 20% e con gli angoli arrotondati
    var wc = 64 + sh, wx = function (o) { return wc + 1.2 * o; };
    var wpts = [wx(-34), 14.5, wx(-29), -3.5, wx(29), -3.5, wx(34), 14.5];
    RP(g, wpts, [1.5, 6, 6, 1.5], 'rgba(170,225,255,0.4)');
    g.save(); g.strokeStyle = '#1e1e1e'; g.lineWidth = 2.4; g.lineJoin = 'round'; rpPath(g, wpts, [1.5, 6, 6, 1.5]); g.stroke(); g.restore();
    // poggiatesta
    // passeggeri a pixel, vista da dietro come nel riferimento: lui castano con giubbotto blu, lei bionda riccia con top rosa
    var lx = 46 + sh, rx0 = (turned === true ? 90 : 88) + sh;
    var PK = TR.PASS && TR.PASS[turned === 'cheer' ? 'P2' : turned === true ? 'P3' : 'P1'];
    if (PK) {
      // passeggeri disegnati da Cristian (immagine unica: lui e lei), appoggiati sul bordo della scocca
      var pkey = 'P' + (turned === 'cheer' ? 2 : turned === true ? 3 : 1), pk = herCache[pkey];
      if (!pk) {
        // sprite unico di Cristian: lo divido lungo il percorso a minore opacita' tra i due passeggeri
        var pc = mk(PK.w, PK.h), px2 = pc.getContext('2d'), pim = px2.createImageData(PK.w, PK.h), pb = atob(PK.d), pi, r, o, n, l, bi, bn;
        for (pi = 0; pi < pb.length; pi++) pim.data[pi] = pb.charCodeAt(pi);
        px2.putImageData(pim, 0, 0);
        var src = pim.data, x0 = Math.round(PK.w * 0.3), sw = Math.round(PK.w * 0.65) - x0, cost = [], from = [];
        for (r = 0; r < PK.h; r++) {
          cost[r] = new Float64Array(sw); from[r] = new Int16Array(sw);
          for (o = 0; o < sw; o++) {
            var al = src[4 * (r * PK.w + x0 + o) + 3];
            if (r === 0) { cost[r][o] = al; continue; }
            bn = 1e18; bi = o;
            for (l = -2; l <= 2; l++) { n = o + l; if (n >= 0 && n < sw && cost[r - 1][n] + 0.5 * Math.abs(l) < bn) { bn = cost[r - 1][n] + 0.5 * Math.abs(l); bi = n; } }
            cost[r][o] = bn + al; from[r][o] = bi;
          }
        }
        bn = 1e18; bi = 0;
        for (o = 0; o < sw; o++) if (cost[PK.h - 1][o] < bn) { bn = cost[PK.h - 1][o]; bi = o; }
        var seam = new Int16Array(PK.h);
        for (r = PK.h - 1; r >= 0; r--) { seam[r] = x0 + bi; bi = from[r][bi]; }
        pk = [mk(PK.w, PK.h), mk(PK.w, PK.h)];
        pk.forEach(function (cv, side) {
          var cx2 = cv.getContext('2d'), im2 = cx2.createImageData(PK.w, PK.h), x, y2, k;
          for (y2 = 0; y2 < PK.h; y2++) for (x = 0; x < PK.w; x++) if ((x < seam[y2]) === (side === 0)) { k = 4 * (y2 * PK.w + x); im2.data[k] = src[k]; im2.data[k + 1] = src[k + 1]; im2.data[k + 2] = src[k + 2]; im2.data[k + 3] = src[k + 3]; }
          cx2.putImageData(im2, 0, 0);
        });
        herCache[pkey] = pk;
      }
      g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      var spread = 36 * 0.2 / 2, pl = lx - PK.ax * PK.u, pt = 13 - PK.h * PK.u;   // distanziati del 20%
      var recoil = turned === true ? ANGRY_SHIFT : 0;   // arrabbiata: lui si sposta della larghezza del volante, poi torna al suo posto negli altri sprite
      g.drawImage(pk[0], pl - spread + recoil, pt, PK.w * PK.u, PK.h * PK.u); g.drawImage(pk[1], pl + spread, pt, PK.w * PK.u, PK.h * PK.u);
      // poggiatesta grigi davanti ai due passeggeri (come nel riferimento di Cristian)
      [lx - 3.6 + 2.5, lx + (turned === 'cheer' ? 36 : turned === true ? 37 : 34) + 2.5].forEach(function (hx) {
        RR(g, hx - 9.5, 7, 19, 5.8, 2.6, '#47474f');
        RR(g, hx - 9.1, 7.35, 18.2, 5.1, 2.4, '#b4b4be');
        RR(g, hx - 8, 7.8, 16, 1.6, 0.8, '#e4e4ec');
        R(g, hx - 7.2, 10.8, 14.4, 0.9, '#8c8c98');
      });
    } else {
    R(g, 32 + sh, 10, 28, 9, '#2a4fd0'); R(g, 33 + sh, 10, 26, 2, '#5a7ae8'); R(g, 32 + sh, 17, 28, 2, '#1a2f9a');
    // lui: capelli castani che coprono la nuca e il collo (niente collo squadrato)
    pixHair(g, lx, -0.5, 8.5, 8, ['#5a2e08', '#8a4e10', '#b06c16', '#d08a24'], 3, 0);
    // lui: collo e capelli castani in un'unica massa continua (calotta tonda che scende e si stringe sulla nuca)
    R(g, lx - 3, 9, 6, 4, '#e8a878'); R(g, lx - 3, 9, 1, 4, '#c98a5c');
    pixHairBack(g, lx, ['#5a2e08', '#8a4e10', '#b06c16', '#d08a24'], 3);
    R(g, 71 + sh, 10, 28, 9, '#f0b890'); R(g, 72 + sh, 12, 26, 7, '#b0206c'); R(g, 72 + sh, 12, 26, 2, '#d83a92');
    R(g, 84 + sh, 6, 8, 6, '#f0b890');
    var HER = herSprite(turned === 'cheer' ? 'u' : turned ? 'c' : 'n');
    if (HER && HER.full) {
      // sprite di lei girata disegnato da Cristian, riportato in scala sull'ancora della bocca
      var F = HER.full; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
      g.drawImage(HER.c, 77.5 + sh - F.mx * F.u, 5.5 - F.my * F.u, F.w * F.u, F.h * F.u);
    } else if (HER) { g.imageSmoothingEnabled = false; g.drawImage(HER.c, Math.round(88 + sh - HER.cx), -8 - HER.top); }
    else pixHair(g, rx0, 2, 11.5, 10, ['#c89a00', '#f0c800', '#ffe616', '#fff47a'], 7, 1);
    }
    if (!PK && !HER && turned === true) {
      // girata verso di lui, arrabbiata: viso piccolo di profilo, occhio, bocca aperta, braccio teso
      var fy, fw;
      for (fy = -3; fy <= 8; fy++) { fw = Math.round(4.5 * Math.sqrt(Math.max(0, 1 - Math.pow((fy - 2.5) / 5.8, 2)))); R(g, 79 + sh - fw, fy, fw * 2 + 1, 1, '#f2b896'); }
      R(g, 73 + sh, 3, 1, 2, '#f2b896'); R(g, 74 + sh, 2, 1, 1, '#e49c7c');
      R(g, 76 + sh, 1, 3, 2, '#ffffff'); R(g, 76 + sh, 1, 1, 2, '#2f8fb8');
      R(g, 76 + sh, 5, 2, 3, '#b01028'); R(g, 76 + sh, 5, 1, 1, '#e0405a');
      R(g, 76 + sh, -1, 4, 1, '#e8b000'); R(g, 77 + sh, -3, 8, 2, '#ffe616');
      P(g, [75 + sh, 13, 62 + sh, 7.5, 62.5 + sh, 5.2, 76 + sh, 10.5], '#f2b896'); E(g, 62 + sh, 6.3, 1.8, 1.4, '#f6c4a2');
    }
    if (!PK && !HER && turned === 'cheer') {
      // lei felice: tutte e due le braccia in alto
      P(g, [74 + sh, 12, 66 + sh, -2, 69 + sh, -3, 78 + sh, 11], '#f0b890'); E(g, 67 + sh, -4, 2.6, 2.6, '#f6c4a2');
      P(g, [100 + sh, 12, 108 + sh, -2, 105 + sh, -3, 96 + sh, 11], '#f0b890'); E(g, 107 + sh, -4, 2.6, 2.6, '#f6c4a2');
      // mani aperte: quattro dita + pollice, unghie rosse
      [[67, -4, -1], [107, -4, 1]].forEach(function (h) {
        var hx = h[0] + sh, hy = h[1], d = h[2], k;
        for (k = -2; k <= 1; k++) {
          var ax = hx + k * 1.7 + d * 0.4, ay = hy - 3.4 - (k === -1 || k === 0 ? 1.4 : 0.4);
          P(g, [hx + k * 1.1 - 0.5, hy - 1.5, hx + k * 1.1 + 0.5, hy - 1.5, ax + 0.45, ay, ax - 0.45, ay], '#f6c4a2');
          E(g, ax, ay - 0.1, 0.4, 0.5, '#d4143a');
        }
        P(g, [hx - d * 2.4, hy + 0.4, hx - d * 3.8, hy - 1.6, hx - d * 3.1, hy - 2.1, hx - d * 1.5, hy - 0.4], '#f6c4a2');
        E(g, hx - d * 3.5, hy - 2.0, 0.4, 0.5, '#d4143a');
      });
    }
    // cofano posteriore
    RP(g, [6, 22, 22 + sh, 12, 106 + sh, 12, 122, 22], DECKR, '#c01016');
    RR(g, 24 + sh, 12, 80, 2, 1, '#ff4a40');
    // carrozzeria
    RP(g, BODY, BODYR, '#d8141a');
    if (dir > 0) { RP(g, [122, 22, 126.6, 28, 126.6, 51, 124.6, 51], [1.5, 3, 2, 1], '#8e0c0c'); for (i = 0; i < 4; i++) RR(g, 124.6, 29 + i * 4, 1.4, 1, 0.5, '#3a0606'); }
    if (dir < 0) { RP(g, [6, 22, 1.4, 28, 1.4, 51, 3.4, 51], [1.5, 3, 2, 1], '#8e0c0c'); for (i = 0; i < 4; i++) RR(g, 2.0, 29 + i * 4, 1.4, 1, 0.5, '#3a0606'); }
    RR(g, 10, 22, 108, 2, 1, '#ff5040');
    // griglia nera a lamelle con i fanali dietro
    RR(g, 8, 28, 112, 15, 5, '#121212');
    // fanali come in Out Run: fascia nera con, alle estremita', lampada rosso scuro con blocco arancio esterno e bianco interno
    RR(g, 9, 30, 36, 11, 4.5, brake ? '#e01a14' : '#7a0a0e'); RR(g, 83, 30, 36, 11, 4.5, brake ? '#e01a14' : '#7a0a0e');
    RR(g, 11, 32, 18, 6, 2.6, brake ? '#ffb030' : '#ff9a10'); RR(g, 29, 32, 13, 6, 2, '#f6f6f6');
    RR(g, 86, 32, 13, 6, 2, '#f6f6f6'); RR(g, 99, 32, 18, 6, 2.6, brake ? '#ffb030' : '#ff9a10');
    // cavallino rampante giallo al centro della griglia
    g.save(); g.translate(59, 32.8); g.scale(0.78, 0.78); g.fillStyle = '#ffd21f';
    (function () {
      function tube(P, w0, w1) {
        var n = 40, t, u, x, y, k;
        for (k = 0; k <= n; k++) {
          t = k / n; u = 1 - t;
          if (P.length === 6) { x = u * u * P[0] + 2 * u * t * P[2] + t * t * P[4]; y = u * u * P[1] + 2 * u * t * P[3] + t * t * P[5]; }
          else { x = u * u * u * P[0] + 3 * u * u * t * P[2] + 3 * u * t * t * P[4] + t * t * t * P[6]; y = u * u * u * P[1] + 3 * u * u * t * P[3] + 3 * u * t * t * P[5] + t * t * t * P[7]; }
          g.beginPath(); g.arc(x, y, (w0 + (w1 - w0) * t) / 2, 0, 7); g.fill();
        }
      }
      tube([9.0, 7.8, 7.4, 6.6, 6.2, 5.0], 2.6, 2.6);
      tube([6.2, 5.0, 5.8, 3.4, 5.0, 1.8], 2.2, 1.5);
      tube([5.0, 1.8, 4.0, 1.3, 2.0, 2.7], 1.6, 0.8);
      g.beginPath(); g.moveTo(4.5, 1.2); g.lineTo(4.9, -0.6); g.lineTo(5.6, 1.2); g.fill();
      tube([5.8, 1.6, 6.9, 2.6, 7.0, 4.0], 0.8, 0.5);
      tube([5.8, 5.4, 4.6, 5.5, 3.6, 5.0, 2.6, 5.6], 1.1, 0.6);
      tube([6.0, 6.0, 5.0, 7.1, 4.2, 7.0, 3.6, 8.2], 1.1, 0.6);
      tube([8.6, 8.0, 9.0, 9.6, 8.7, 10.6, 8.9, 11.8], 1.8, 0.9);
      tube([8.2, 8.4, 7.2, 9.6, 7.0, 10.6, 6.5, 11.8], 1.5, 0.9);
      tube([9.6, 6.8, 11.8, 6.0, 12.8, 8.0, 11.4, 10.8], 1.2, 0.3);
    })();
    g.restore();
    if (brake) { E(g, 25, 35, 20, 9, 'rgba(255,70,40,0.35)'); E(g, 103, 35, 20, 9, 'rgba(255,70,40,0.35)'); }
    // targa e paraurti
    R(g, 50, 44, 28, 7, '#f4f4f4'); R(g, 50, 44, 3, 7, '#2a4ad0');
    for (i = 0; i < 5; i++) R(g, 55 + i * 4.4, 46, 3, 3, '#222');
    R(g, 4, 51, 120, 3, '#1a1a1a');
    E(g, 34, 54, 3, 2, '#a8acb4'); E(g, 41, 54, 3, 2, '#a8acb4'); E(g, 87, 54, 3, 2, '#a8acb4'); E(g, 94, 54, 3, 2, '#a8acb4');
    E(g, 34, 54, 1.5, 1, '#333'); E(g, 41, 54, 1.5, 1, '#333'); E(g, 87, 54, 1.5, 1, '#333'); E(g, 94, 54, 1.5, 1, '#333');
    return c;
  }

  // versione rifinita per il filmato finale: stessa auto, con sfumature, ombre e riflessi
  function carHD(turned, hs, dir, brake, noShadow) {
    var c = playerCar(dir || 0, !!brake, turned, hs, noShadow), g = c.getContext('2d');
    g.save(); g.setTransform(hs, 0, 0, hs, 2 * hs, 22 * hs);
    function clipPath(pts) { rpPath(g, pts, pts === BODY ? BODYR : DECKR); }
    var body = BODY, deck = DECK;
    var gr;
    // cofano posteriore: luce dall'alto e riflesso del cielo
    g.save(); clipPath(deck); g.clip();
    gr = g.createLinearGradient(0, 12, 0, 22); gr.addColorStop(0, 'rgba(255,190,180,0.55)'); gr.addColorStop(0.45, 'rgba(255,90,80,0.12)'); gr.addColorStop(1, 'rgba(60,0,0,0.35)');
    g.fillStyle = gr; g.fillRect(0, 10, 132, 14);
    gr = g.createLinearGradient(22, 0, 106, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, 'rgba(255,255,255,0.45)'); gr.addColorStop(0.42, 'rgba(255,255,255,0)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.78, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 12, 132, 4);
    g.restore();
    // carrozzeria: volume (bordi più scuri, centro più chiaro) e ombra verso terra
    g.save(); clipPath(body); g.clip();
    gr = g.createLinearGradient(2, 0, 126, 0); gr.addColorStop(0, 'rgba(40,0,0,0.45)'); gr.addColorStop(0.12, 'rgba(40,0,0,0)'); gr.addColorStop(0.88, 'rgba(40,0,0,0)'); gr.addColorStop(1, 'rgba(40,0,0,0.45)');
    g.fillStyle = gr; g.fillRect(0, 20, 132, 32);
    gr = g.createLinearGradient(0, 21, 0, 51); gr.addColorStop(0, 'rgba(255,170,160,0.35)'); gr.addColorStop(0.12, 'rgba(255,170,160,0)'); gr.addColorStop(0.75, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(30,0,0,0.45)');
    g.fillStyle = gr; g.fillRect(0, 20, 132, 32);
    // spigolo lucido sopra la griglia
    g.fillStyle = 'rgba(255,230,220,0.6)'; g.fillRect(10, 25.6, 108, 0.6);
    g.restore();
    // griglia: vetro scuro con riflesso
    g.save(); rpPath(g, [8, 28, 120, 28, 120, 43, 8, 43], 5); g.clip();
    gr = g.createLinearGradient(0, 28, 0, 43); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.35, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = gr; g.fillRect(8, 28, 112, 15);
    g.globalCompositeOperation = 'lighter';
    [25, 103].forEach(function (x) { var rg = g.createRadialGradient(x, 35, 1, x, 35, 16); rg.addColorStop(0, 'rgba(255,60,40,0.55)'); rg.addColorStop(1, 'rgba(255,0,0,0)'); g.fillStyle = rg; g.fillRect(x - 16, 28, 32, 15); });
    g.restore();
    // terminali di scarico cromati
    [34, 41, 87, 94].forEach(function (x) {
      var rg = g.createRadialGradient(x - 1, 53.4, 0.3, x, 54, 3.2); rg.addColorStop(0, '#ffffff'); rg.addColorStop(0.45, '#b8bcc6'); rg.addColorStop(1, '#4a4e58');
      g.fillStyle = rg; g.beginPath(); g.ellipse(x, 54, 3, 2, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#151515'; g.beginPath(); g.ellipse(x, 54.3, 1.6, 1, 0, 0, Math.PI * 2); g.fill();
    });
    // paraurti e targa con riflesso
    gr = g.createLinearGradient(0, 51, 0, 54); gr.addColorStop(0, 'rgba(255,255,255,0.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(4, 51, 120, 3);
    gr = g.createLinearGradient(50, 44, 78, 51); gr.addColorStop(0, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(50, 44, 28, 7);
    // capelli di lei: lucentezza
    g.globalCompositeOperation = 'source-atop';
    var rg2 = g.createRadialGradient(84, -2, 0.5, 84, -2, 9); rg2.addColorStop(0, 'rgba(255,255,230,0.55)'); rg2.addColorStop(1, 'rgba(255,255,230,0)');
    g.fillStyle = rg2; g.fillRect(74, -12, 22, 20);
    g.restore();
    return c;
  }

  /* ================= AUTO DEL TRAFFICO ================= */
  var CARCOL = ['#2a5bd7', '#f0f0f0', '#ffd21f', '#1c9c4a', '#7a2fb5', '#e86a12', '#2b2f36', '#9aa3ad', '#18a4b8', '#c2185b'];
  function trafficCar(type, col) {
    var c, g, dk = shade(col, -0.35), lt = shade(col, 0.3);
    if (type === 'car') {
      c = mk(204, 138); g = c.getContext('2d'); g.scale(3, 3);
      E(g, 34, 43, 33, 3, 'rgba(0,0,0,0.35)');
      RR(g, 4, 30, 13, 14, 3, '#111'); RR(g, 51, 30, 13, 14, 3, '#111');
      P(g, [12, 18, 17, 3, 51, 3, 56, 18], dk); P(g, [15, 16, 19, 6, 49, 6, 53, 16], '#2b3c55'); R(g, 20, 7, 10, 2, '#6c86a8');
      RR(g, 2, 17, 64, 21, 4, col); R(g, 4, 19, 60, 2, lt);
      RR(g, 4, 23, 13, 6, 2, '#c0101a'); RR(g, 51, 23, 13, 6, 2, '#c0101a'); R(g, 4, 23, 4, 6, '#ff9a00'); R(g, 60, 23, 4, 6, '#ff9a00');
      R(g, 27, 27, 14, 6, '#eeeeee'); RR(g, 3, 34, 62, 5, 2, '#3a3a3a');
      P(g, [20, 15, 24, 7, 34, 7, 30, 15], 'rgba(255,255,255,0.28)'); R(g, 33, 17, 1, 19, 'rgba(0,0,0,0.25)');
      E(g, 10.5, 37, 3, 3, '#9a9a9a'); E(g, 57.5, 37, 3, 3, '#9a9a9a'); R(g, 6, 24, 9, 1, '#ff6a6a'); R(g, 53, 24, 9, 1, '#ff6a6a');
      g.fillStyle = '#222'; g.font = 'bold 5px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('MC 432', 34, 30);
    } else if (type === 'van') {
      c = mk(204, 180); g = c.getContext('2d'); g.scale(3, 3);
      E(g, 34, 57, 33, 3, 'rgba(0,0,0,0.35)');
      RR(g, 4, 44, 13, 14, 3, '#111'); RR(g, 51, 44, 13, 14, 3, '#111');
      RR(g, 3, 2, 62, 50, 6, col); R(g, 5, 4, 58, 2, lt);
      RR(g, 9, 8, 22, 14, 3, '#2b3c55'); RR(g, 37, 8, 22, 14, 3, '#2b3c55'); R(g, 33, 6, 2, 44, dk);
      R(g, 3, 26, 62, 3, '#ffffff'); R(g, 3, 29, 62, 2, dk);
      RR(g, 4, 34, 8, 10, 2, '#c0101a'); RR(g, 56, 34, 8, 10, 2, '#c0101a');
      R(g, 27, 40, 14, 6, '#eeeeee'); RR(g, 2, 48, 64, 5, 2, '#3a3a3a');
      P(g, [11, 9, 16, 9, 12, 21, 9, 21], 'rgba(255,255,255,0.25)'); P(g, [39, 9, 44, 9, 40, 21, 37, 21], 'rgba(255,255,255,0.25)');
      E(g, 10.5, 54, 3, 3, '#9a9a9a'); E(g, 57.5, 54, 3, 3, '#9a9a9a'); R(g, 5, 35, 6, 1, '#ff6a6a'); R(g, 57, 35, 6, 1, '#ff6a6a');
      g.fillStyle = '#222'; g.font = 'bold 5px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('AN 117', 34, 43);
    } else if (type === 'truck') {
      c = mk(228, 264); g = c.getContext('2d'); g.scale(3, 3);
      E(g, 38, 85, 37, 3, 'rgba(0,0,0,0.35)');
      RR(g, 3, 70, 16, 16, 3, '#111'); RR(g, 57, 70, 16, 16, 3, '#111'); RR(g, 20, 72, 10, 14, 2, '#111'); RR(g, 46, 72, 10, 14, 2, '#111');
      R(g, 2, 0, 72, 70, '#e8e8e8'); R(g, 2, 0, 72, 3, '#ffffff'); R(g, 2, 67, 72, 3, '#9a9a9a');
      R(g, 37, 3, 2, 64, '#b8b8b8'); R(g, 5, 30, 66, 10, col); R(g, 5, 40, 66, 2, dk);
      for (var i = 0; i < 4; i++) { R(g, 12, 6 + i * 16, 4, 3, '#999'); R(g, 60, 6 + i * 16, 4, 3, '#999'); }
      R(g, 4, 70, 68, 5, '#444'); RR(g, 4, 71, 9, 4, 1, '#d01010'); RR(g, 63, 71, 9, 4, 1, '#d01010');
      for (i = 0; i < 8; i++) R(g, 16 + i * 6, 75, 3, 3, i % 2 ? '#ffcc00' : '#222');
      R(g, 2, 14, 72, 1, 'rgba(0,0,0,0.12)'); R(g, 2, 48, 72, 1, 'rgba(0,0,0,0.12)'); R(g, 5, 31, 66, 1, 'rgba(255,255,255,0.35)');
      E(g, 11, 78, 3, 3, '#9a9a9a'); E(g, 65, 78, 3, 3, '#9a9a9a'); R(g, 5, 71, 7, 1, '#ff7a7a'); R(g, 64, 71, 7, 1, '#ff7a7a');
    } else { // sportiva
      c = mk(210, 120); g = c.getContext('2d'); g.scale(3, 3);
      E(g, 35, 37, 34, 3, 'rgba(0,0,0,0.35)');
      RR(g, 3, 24, 15, 14, 3, '#111'); RR(g, 52, 24, 15, 14, 3, '#111');
      P(g, [14, 15, 20, 4, 50, 4, 56, 15], dk); P(g, [18, 13, 22, 6, 48, 6, 52, 13], '#22303f');
      P(g, [1, 22, 6, 14, 64, 14, 69, 22, 69, 33, 1, 33], col); R(g, 5, 16, 60, 2, lt);
      R(g, 2, 10, 66, 3, dk); R(g, 6, 12, 3, 5, '#222'); R(g, 61, 12, 3, 5, '#222');
      R(g, 4, 21, 62, 4, '#b0101a'); R(g, 4, 21, 62, 1, '#ff4a4a');
      R(g, 28, 26, 14, 5, '#eeeeee'); RR(g, 2, 30, 66, 4, 2, '#262626');
      P(g, [22, 12, 26, 6, 36, 6, 32, 12], 'rgba(255,255,255,0.28)'); R(g, 7, 22, 12, 1, '#ff7a7a'); R(g, 51, 22, 12, 1, '#ff7a7a');
      E(g, 10.5, 31, 3, 3, '#9a9a9a'); E(g, 59.5, 31, 3, 3, '#9a9a9a');
      g.fillStyle = '#222'; g.font = 'bold 4px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PU 905', 35, 28.5);
    }
    var cw = c.width, ch = c.height, sg = g.createLinearGradient(0, 0, 0, ch);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
    sg.addColorStop(0, 'rgba(255,255,255,0.16)'); sg.addColorStop(0.45, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,0.18)');
    g.fillStyle = sg; g.fillRect(0, 0, cw, ch); g.restore();
    return c;
  }

  /* ================= SPRITE DEL PAESAGGIO ================= */
  var S = {};
  function def(name, w, h, ww, fn, opt) { var c = mk(w, h); fn(c.getContext('2d'), w, h); S[name] = { img: c, ww: ww, nc: !!(opt && opt.nc) }; }

  function palm(g, w, h, r) {
    var bx = w / 2 - 6, tx = w / 2 + 8;
    for (var i = 0; i < 22; i++) {
      var p = i / 22, x = bx + (tx - bx) * p * p, y = h - 4 - (h - 40) * p;
      R(g, x - 4 + p * 1.5, y - 6, 9 - p * 3, 7, i % 2 ? '#8a5a2b' : '#a87038');
    }
    var cx = tx, cy = 38;
    g.lineCap = 'round';
    [[-1, 0.1], [-0.8, -0.5], [-0.3, -0.9], [0.3, -0.85], [0.8, -0.45], [1, 0.15], [-0.4, 0.4], [0.5, 0.45]].forEach(function (a, k) {
      var ex = cx + a[0] * 36, ey = cy + a[1] * 20 + 16;
      g.strokeStyle = k % 2 ? '#1f8a3a' : '#2fae4a'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + a[0] * 22, cy + a[1] * 26 - 8, ex, ey); g.stroke();
      g.strokeStyle = '#7fe07a'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx, cy - 1); g.quadraticCurveTo(cx + a[0] * 22, cy + a[1] * 26 - 10, ex, ey - 2); g.stroke();
    });
    E(g, cx - 3, cy + 5, 4, 4, '#6b3e1c'); E(g, cx + 4, cy + 6, 4, 4, '#5a3214'); E(g, cx, cy + 9, 4, 4, '#6b3e1c');
  }
  def('palm', 84, 160, 1500, palm);
  def('cypress', 30, 130, 520, function (g, w, h) {
    R(g, w / 2 - 2, h - 12, 4, 12, '#5a3a1a');
    P(g, [w / 2, 0, w - 2, h * 0.45, w - 4, h - 10, 4, h - 10, 2, h * 0.45], '#1d4a26');
    for (var i = 0; i < 18; i++) R(g, 6 + (i * 7) % (w - 12), 12 + i * 6, 3, 4, i % 2 ? '#2b6a36' : '#163b1e');
  });
  function pine(g, w, h, snow) {
    R(g, w / 2 - 4, h - 16, 8, 16, '#5a3a1a');
    for (var i = 0; i < 4; i++) {
      var y = 4 + i * (h - 24) / 4, hw = 10 + i * (w / 2 - 10) / 3;
      P(g, [w / 2, y, w / 2 + hw, y + 30, w / 2 - hw, y + 30], i % 2 ? '#1b5e2e' : '#227038');
      if (snow) P(g, [w / 2, y, w / 2 + hw * 0.5, y + 12, w / 2 - hw * 0.5, y + 12], '#f4f8ff');
    }
  }
  def('pine', 60, 110, 1100, function (g, w, h) { pine(g, w, h, false); });
  def('snowpine', 60, 110, 1100, function (g, w, h) { pine(g, w, h, true); });
  function tree(g, w, h, cols) {
    R(g, w / 2 - 4, h - 34, 8, 34, '#5a3a1a'); R(g, w / 2 - 12, h - 30, 8, 3, '#5a3a1a');
    var r = rng(w * 7 + h);
    for (var i = 0; i < 16; i++) E(g, 12 + r() * (w - 24), 12 + r() * (h - 52), 9 + r() * 6, 8 + r() * 5, cols[i % cols.length]);
  }
  def('autumn', 76, 92, 1400, function (g, w, h) { tree(g, w, h, ['#d2541c', '#f08a24', '#b8321a', '#f4b833', '#e06a20']); });
  def('oak', 76, 92, 1400, function (g, w, h) { tree(g, w, h, ['#2f8a3a', '#3fa848', '#236e2e', '#55b850']); });
  def('bush', 48, 28, 800, function (g, w, h) { E(g, 14, 18, 13, 10, '#2a7a34'); E(g, 32, 16, 15, 12, '#349040'); E(g, 24, 12, 10, 9, '#46a850'); });
  def('drybush', 48, 26, 700, function (g, w, h) { E(g, 14, 17, 13, 9, '#8a8a3a'); E(g, 32, 15, 15, 11, '#a09a48'); E(g, 24, 11, 10, 8, '#b8ae5a'); });
  def('rock', 56, 38, 1100, function (g, w, h) { P(g, [2, h, 8, 12, 22, 2, 40, 6, 54, 20, 54, h], '#7a7a80'); P(g, [8, 12, 22, 2, 40, 6, 30, 16], '#a0a0a8'); P(g, [30, 16, 40, 6, 54, 20, 54, h, 40, h], '#5a5a62'); });
  def('redrock', 90, 76, 2200, function (g, w, h) {
    P(g, [4, h, 10, 14, 30, 6, 64, 8, 82, 16, 86, h], '#b0442a');
    for (var i = 0; i < 6; i++) R(g, 8, 20 + i * 9, 76, 3, i % 2 ? '#c85a36' : '#8e3420');
    P(g, [64, 8, 82, 16, 86, h, 70, h], 'rgba(60,10,0,0.3)');
  });
  def('lavarock', 60, 40, 1100, function (g, w, h) {
    P(g, [2, h, 8, 12, 24, 2, 42, 6, 58, 18, 58, h], '#2a2224'); P(g, [8, 12, 24, 2, 42, 6, 30, 14], '#3e3436');
    g.strokeStyle = '#ff6a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 30); g.lineTo(24, 20); g.lineTo(30, 28); g.lineTo(44, 16); g.stroke();
  });
  def('cactus', 40, 72, 650, function (g, w, h) {
    RR(g, 15, 4, 11, h - 4, 5, '#2f8a3a'); RR(g, 3, 24, 8, 22, 4, '#2f8a3a'); R(g, 6, 40, 12, 6, '#2f8a3a');
    RR(g, 29, 16, 8, 24, 4, '#2f8a3a'); R(g, 22, 34, 10, 6, '#2f8a3a'); R(g, 18, 6, 2, h - 8, '#55b850');
  });
  def('column', 24, 90, 480, function (g, w, h) {
    R(g, 2, 0, 20, 8, '#e8dcc0'); R(g, 0, h - 8, 24, 8, '#d8ccb0'); R(g, 4, 8, 16, h - 16, '#f0e6cc');
    for (var i = 0; i < 4; i++) R(g, 6 + i * 4, 8, 1, h - 16, '#c8bc9c');
  });
  def('ruins', 120, 80, 2800, function (g, w, h) {
    for (var i = 0; i < 4; i++) { R(g, 6 + i * 30, 18, 14, h - 24, '#efe4c8'); R(g, 9 + i * 30, 18, 2, h - 24, '#cfc2a0'); }
    P(g, [0, 18, 60, 2, 120, 18], '#e2d6b6'); R(g, 0, 14, 120, 6, '#d8ccac'); R(g, 0, h - 6, 120, 6, '#cfc2a0');
    R(g, 94, 14, 26, 6, 'rgba(0,0,0,0)'); g.clearRect(98, 0, 22, 20);
  });
  function building(g, w, h, night, col, seed) {
    var r = rng(seed);
    R(g, 0, 0, w, h, col); R(g, 0, 0, w, 4, shade(col, -0.3)); R(g, w - 6, 0, 6, h, shade(col, -0.25));
    for (var y = 10; y < h - 14; y += 12) for (var x = 6; x < w - 12; x += 10) {
      var lit = r() < (night ? 0.55 : 0.0);
      R(g, x, y, 6, 7, lit ? (r() < 0.8 ? '#ffe27a' : '#ffffff') : (night ? '#1a2238' : '#8fb4d8'));
    }
    R(g, w / 2 - 8, h - 14, 16, 14, night ? '#ffd27a' : '#3a3a44');
  }
  [0, 1, 2].forEach(function (k) {
    var hs = [150, 210, 120][k], cols = ['#c8b8a0', '#9aa8b8', '#d8a080'][k], ncols = ['#283048', '#30304a', '#3a2c48'][k];
    def('bld' + k, 72, hs, 2600, function (g, w, h) { building(g, w, h, false, cols, k + 3); });
    def('nbld' + k, 72, hs, 2600, function (g, w, h) { building(g, w, h, true, ncols, k + 9); });
  });
  def('lamp', 30, 100, 600, function (g, w, h) {
    R(g, 4, 6, 3, h - 6, '#8a8f98'); R(g, 4, 6, 18, 3, '#8a8f98'); RR(g, 16, 7, 12, 5, 2, '#5a5f68');
    E(g, 22, 13, 6, 3, '#fff6c0'); R(g, 1, h - 5, 9, 5, '#5a5f68');
  }, { nc: false });
  def('nlamp', 30, 100, 600, function (g, w, h) {
    E(g, 22, 16, 9, 6, 'rgba(255,230,140,0.45)');
    R(g, 4, 6, 3, h - 6, '#5a5f68'); R(g, 4, 6, 18, 3, '#5a5f68'); RR(g, 16, 7, 12, 5, 2, '#3a3f48');
    E(g, 22, 13, 6, 3, '#fff6c0'); R(g, 1, h - 5, 9, 5, '#3a3f48');
  });
  // lampioni: versione speculare per il lato destro (il braccio deve puntare verso la strada)
  ['lamp', 'nlamp'].forEach(function (n) {
    var o = S[n], m = mk(o.img.width, o.img.height), mg = m.getContext('2d');
    mg.translate(m.width, 0); mg.scale(-1, 1); mg.drawImage(o.img, 0, 0); o.imgR = m;
  });
  def('umbrella', 56, 52, 950, function (g, w, h) {
    R(g, 27, 12, 2, h - 12, '#eeeeee');
    for (var i = 0; i < 6; i++) P(g, [28, 2, 2 + i * 8.7, 18, 2 + (i + 1) * 8.7, 18], i % 2 ? '#ffffff' : '#e8242c');
    R(g, 6, h - 6, 26, 5, '#2a8ad8'); R(g, 6, h - 4, 26, 1, '#ffffff');
  });
  def('haybale', 40, 30, 800, function (g, w, h) {
    E(g, 20, 15, 18, 14, '#e2b850'); E(g, 20, 15, 12, 9, '#d0a440'); E(g, 20, 15, 6, 4, '#e8c860');
    g.strokeStyle = '#b88a30'; g.lineWidth = 1; g.beginPath(); g.arc(20, 15, 9, 0, 5); g.stroke();
  });
  def('ice', 50, 38, 1000, function (g, w, h) { P(g, [2, h, 6, 10, 20, 2, 40, 8, 48, h], '#bfe6ff'); P(g, [6, 10, 20, 2, 26, 14], '#ffffff'); P(g, [26, 14, 40, 8, 48, h, 34, h], '#8cc4ec'); });
  def('lighthouse', 34, 130, 900, function (g, w, h) {
    P(g, [8, h, 12, 18, 22, 18, 26, h], '#f4f4f4');
    for (var i = 0; i < 4; i++) P(g, [8 + i * 1, h - 10 - i * 26, 9 + i * 1, h - 22 - i * 26, 25 - i * 1, h - 22 - i * 26, 26 - i * 1, h - 10 - i * 26], '#d82020');
    R(g, 10, 8, 14, 10, '#ffe27a'); R(g, 8, 6, 18, 3, '#333'); P(g, [8, 6, 17, 0, 26, 6], '#d82020');
  });
  def('dune', 150, 40, 3600, function (g, w, h) {
    g.fillStyle = '#e8c070'; g.beginPath(); g.moveTo(0, h); g.quadraticCurveTo(50, 0, 90, 14); g.quadraticCurveTo(120, 22, 150, h); g.fill();
    g.fillStyle = '#d0a458'; g.beginPath(); g.moveTo(60, 8); g.quadraticCurveTo(110, 18, 150, h); g.lineTo(80, h); g.fill();
  }, { nc: true });
  def('snowman', 30, 44, 500, function (g, w, h) { E(g, 15, 32, 12, 11, '#ffffff'); E(g, 15, 13, 8, 8, '#ffffff'); P(g, [15, 13, 22, 15, 15, 15], '#ff8a1a'); R(g, 9, 2, 12, 4, '#222'); R(g, 7, 5, 16, 2, '#222'); });

  function billboard(txt, bg, fg, sub, neon) {
    return function (g, w, h) {
      R(g, 18, 50, 5, h - 50, '#5a5f68'); R(g, w - 23, 50, 5, h - 50, '#5a5f68');
      R(g, 2, 2, w - 4, 50, neon ? '#14102a' : '#ffffff'); R(g, 5, 5, w - 10, 44, bg);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (neon) { g.shadowColor = fg; g.shadowBlur = 6; }
      g.fillStyle = fg; tallText(g, txt, w - 16, sub ? 26 : 34, 'bold italic', w / 2, sub ? 19 : 27);
      if (sub) tallText(g, sub, w - 16, 15, 'bold', w / 2, 41);
      g.shadowBlur = 0;
    };
  }
  // pubblicità di attività del Fermano e dintorni (di giorno 'bill', di notte insegne al neon)
  var ADS = [['COCHETTI SHOP', '#1e64d0', '#ffe14a', '', '#ffe14a'], ['GELATERIA PELLACANI', '#ff7ab0', '#ffffff', 'ICE CREAM', '#ff8ad0'],
    ['OBBI', '#ff7a00', '#ffffff', 'CIVITANOVA MARCHE', '#ff9a3a'], ['LIDOL', '#d02a2a', '#ffffff', 'CAMPIGLIONE', '#ff5a5a'],
    ['SAPOR DI MAR', '#1aa0c8', '#ffffff', '', '#4af0ff'], ['BAR ITALIA', '#ffffff', '#1a8a3a', 'COFFEE', '#4aff7a'],
    ['BAR RAGNO', '#c81818', '#ffffff', 'COFFEE', '#ff4ae0'], ['PIZZERIA IL PIMCIO', '#1a8a3a', '#ffffff', 'PIZZA', '#4af0ff'],
    ['LOASI FM', '#5a2a9a', '#ffe14a', '', '#ffe14a']];
  ADS.forEach(function (a, i) {
    def('bill' + i, 120, 76, 600, billboard(a[0], a[1], a[2], a[3]));
    def('neon' + i, 120, 76, 600, billboard(a[0], '#14102a', a[4], a[3], true));
  });
  // pozzanghera: ellisse piatta, trasparente ai bordi, con riflesso del cielo
  def('puddle', 120, 22, 900, function (g, w, h) {
    var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(150,200,240,0.9)'); gr.addColorStop(1, 'rgba(40,80,140,0.92)');
    g.fillStyle = 'rgba(30,50,90,0.55)'; g.beginPath(); g.ellipse(w / 2, h / 2 + 1, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = gr; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 3, h / 2 - 2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.65)'; g.beginPath(); g.ellipse(w * 0.4, h * 0.38, w * 0.2, h * 0.12, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(w * 0.55, h * 0.58, w * 0.22, 1.5);
  }, { nc: true });
  function chevron(left) {
    return function (g, w, h) {
      R(g, w / 2 - 2, 26, 4, h - 26, '#8a8f98'); R(g, 2, 2, w - 4, 26, '#202020'); R(g, 4, 4, w - 8, 22, '#ffd21f');
      for (var i = 0; i < 2; i++) {
        var x = 9 + i * 10;
        if (left) P(g, [x + 8, 7, x, 15, x + 8, 23, x + 12, 23, x + 4, 15, x + 12, 7], '#202020');
        else P(g, [x, 7, x + 8, 15, x, 23, x + 4, 23, x + 12, 15, x + 4, 7], '#202020');
      }
    };
  }
  def('signL', 36, 56, 750, chevron(true));
  def('signR', 36, 56, 750, chevron(false));

  // portale: partenza / checkpoint / traguardo (scritta personalizzata)
  function gate(text, col) {
    var c = mk(260, 110), g = c.getContext('2d');
    for (var y = 20; y < 110; y += 10) { R(g, 0, y, 12, 10, (y / 10) % 2 ? '#ffffff' : col); R(g, 248, y, 12, 10, (y / 10) % 2 ? '#ffffff' : col); }
    R(g, 0, 0, 260, 34, '#202020'); R(g, 3, 3, 254, 28, col);
    for (var x = 0; x < 260; x += 8) R(g, x, 31, 4, 3, '#ffffff');
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold italic 21px Arial';
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillText(text, 132, 19); g.fillStyle = '#ffffff'; g.fillText(text, 130, 17);
    return { img: c, ww: 2 * 1800 * 1.18, nc: true };
  }
  function forkSign(l, r) {
    var c = mk(270, 92), g = c.getContext('2d');
    R(g, 50, 54, 6, 38, '#8a8f98'); R(g, 214, 54, 6, 38, '#8a8f98');
    R(g, 0, 0, 270, 58, '#ffffff'); R(g, 3, 3, 264, 52, '#1a7a3a');
    g.fillStyle = '#ffffff'; g.textBaseline = 'middle';
    P(g, [10, 29, 24, 17, 24, 41], '#ffffff'); P(g, [260, 29, 246, 17, 246, 41], '#ffffff');
    g.textAlign = 'left'; tallText(g, l.toUpperCase(), 100, 18, 'bold', 28, 20);
    g.textAlign = 'right'; tallText(g, r.toUpperCase(), 100, 18, 'bold', 242, 40);
    R(g, 133, 8, 4, 42, '#ffffff');
    return { img: c, ww: 3200, nc: false };
  }

  // cartelli stradali con i paesi del Fermano
  var signCache = {};
  // testo alto 'size' px: se è più largo di maxw viene compresso in orizzontale (caratteri più alti, non più larghi)
  function tallText(g, s, maxw, size, weight, x, y) {
    g.font = (weight || 'bold') + ' ' + size + 'px Arial';
    var tw = g.measureText(s).width, k = tw > maxw ? maxw / tw : 1;
    g.save(); g.translate(x, y); g.scale(k, 1); g.fillText(s, 0, 0); g.restore();
  }
  function fitText(g, s, maxw, size, weight) {
    var sz = size; do { g.font = (weight || 'bold') + ' ' + sz + 'px Arial'; sz--; } while (g.measureText(s).width > maxw && sz > 7); return sz;
  }
  function townSign(name) {
    var k = 'T' + name; if (signCache[k]) return signCache[k];
    var c = mk(150, 74), g = c.getContext('2d');
    R(g, 36, 40, 4, 34, '#8a8f98'); R(g, 110, 40, 4, 34, '#8a8f98');
    R(g, 0, 0, 150, 44, '#ffffff'); R(g, 3, 3, 144, 38, '#111111'); R(g, 5, 5, 140, 34, '#ffffff');
    g.fillStyle = '#111'; g.textAlign = 'center'; g.textBaseline = 'middle';
    tallText(g, name.toUpperCase(), 136, 30, 'bold', 75, 22);
    return (signCache[k] = { img: c, ww: 2300, nc: false });
  }
  function dirSign(a, ka, b, kb) {
    var k = 'D' + a + b; if (signCache[k]) return signCache[k];
    var c = mk(450, 252), g = c.getContext('2d');
    g.scale(3, 3);
    R(g, 72, 52, 6, 32, '#8a8f98');
    R(g, 0, 0, 150, 54, '#ffffff'); R(g, 2, 2, 146, 50, '#1d4fb8');
    g.fillStyle = '#ffffff'; g.textBaseline = 'middle';
    [[a, ka, 15], [b, kb, 39]].forEach(function (r, j) {
      g.textAlign = 'left'; tallText(g, r[0], 66, 22, 'bold', 22, r[2]);
      g.textAlign = 'right'; tallText(g, r[1], 46, 20, 'bold', 144, r[2]);
      if (j === 0) P(g, [6, r[2], 14, r[2] - 6, 14, r[2] + 6], '#ffffff'); else P(g, [16, r[2], 8, r[2] - 6, 8, r[2] + 6], '#ffffff');
    });
    R(g, 4, 27, 142, 1, '#ffffff');
    return (signCache[k] = { img: c, ww: 2990, nc: false });
  }
  var PROVINCE = ['Fermo', 'Macerata', 'Ascoli Piceno', 'Pesaro Urbino'];
  var TOWNS = ['Fermo', 'Porto San Giorgio', "Porto Sant'Elpidio", 'Pedaso', "Sant'Elpidio a Mare", 'Montegranaro', 'Monte Urano',
    'Altidona', 'Campofilone', 'Lapedona', 'Grottazzolina', 'Montegiorgio', 'Falerone', 'Amandola', 'Monterubbiano',
    'Torre San Patrizio', 'Servigliano', 'Petritoli', 'Magliano di Tenna', 'Rapagnano', 'Marina Palmense', 'Lido di Fermo', 'Capodarco'];

  /* ================= SFONDI ================= */
  function background(th) {
    var r = rng(th.seed || 7), far = mk(1280, 170), near = mk(1280, 110), cl = mk(1280, 110);
    var g = far.getContext('2d'), i, x;
    var fc = th.farC;
    if (th.far === 'sea') {
      // isole lontane e mare
      for (i = 0; i < 4; i++) {
        x = r() * 1280; var w = 120 + r() * 200, hh = 20 + r() * 30;
        g.fillStyle = fc[2]; g.beginPath(); g.moveTo(x, 150); g.quadraticCurveTo(x + w / 2, 150 - hh * 2, x + w, 150); g.fill();
      }
      R(g, 0, 148, 1280, 22, fc[0]);
      for (i = 0; i < 60; i++) R(g, r() * 1280, 150 + r() * 18, 6 + r() * 20, 1, fc[1]);
    } else if (th.far === 'mount' || th.far === 'snow' || th.far === 'mesa' || th.far === 'volcano' || th.far === 'dunes') {
      var pts = [], n = th.far === 'dunes' ? 10 : 26;
      for (i = 0; i <= n; i++) pts.push([i * 1280 / n, (th.far === 'dunes' ? 110 : 60) + r() * (th.far === 'dunes' ? 30 : 70)]);
      pts[n][1] = pts[0][1];
      g.fillStyle = fc[0]; g.beginPath(); g.moveTo(0, 170);
      for (i = 0; i <= n; i++) {
        if (th.far === 'mesa' && i % 3 === 1) { g.lineTo(pts[i][0] - 10, pts[i][1] - 20); g.lineTo(pts[i][0] + 30, pts[i][1] - 20); }
        else if (th.far === 'dunes') { var px = i ? pts[i - 1] : pts[0]; g.quadraticCurveTo((px[0] + pts[i][0]) / 2, pts[i][1] - 25, pts[i][0], pts[i][1]); }
        else g.lineTo(pts[i][0], pts[i][1]);
      }
      g.lineTo(1280, 170); g.fill();
      if (th.far === 'snow') for (i = 0; i <= n; i++) if (pts[i][1] < 95) P(g, [pts[i][0], pts[i][1], pts[i][0] + 16, pts[i][1] + 14, pts[i][0] - 16, pts[i][1] + 14], '#ffffff');
      if (th.far === 'volcano') {
        P(g, [480, 170, 600, 30, 660, 30, 800, 170], fc[1]); P(g, [600, 30, 630, 20, 660, 30, 640, 60, 620, 50], '#ff5a1a');
        for (i = 0; i < 9; i++) E(g, 630 + i * 14 + r() * 20, 22 - i * 9, 14 + i * 3, 9 + i * 2, 'rgba(60,50,60,' + (0.7 - i * 0.06) + ')');
      }
      // seconda catena più vicina
      g.fillStyle = fc[1]; g.beginPath(); g.moveTo(0, 170);
      for (i = 0; i <= 16; i++) g.lineTo(i * 80, 120 + Math.sin(i * 1.7 + (th.seed || 0)) * 14 + (i % 2) * 10);
      g.lineTo(1280, 170); g.fill();
    } else if (th.far === 'city') {
      for (x = 0; x < 1280;) {
        var bw = 30 + r() * 50, bh = 40 + r() * 110;
        R(g, x, 170 - bh, bw, bh, fc[r() < 0.5 ? 0 : 1]);
        for (var wy = 170 - bh + 6; wy < 166; wy += 8) for (var wx = x + 4; wx < x + bw - 4; wx += 7) if (r() < (th.night ? 0.4 : 0.1)) R(g, wx, wy, 3, 4, th.night ? '#ffe27a' : '#cfe0f0');
        if (r() < 0.2) R(g, x + bw / 2 - 1, 170 - bh - 18, 2, 18, fc[0]);
        x += bw + r() * 6;
      }
    }
    // strato vicino
    var gn = near.getContext('2d');
    if (th.near === 'hills' || th.near === 'trees') {
      gn.fillStyle = th.nearC[0]; gn.beginPath(); gn.moveTo(0, 110);
      for (i = 0; i <= 64; i++) gn.lineTo(i * 20, 60 + Math.sin(i * 0.45 + (th.seed || 0)) * 20 + Math.sin(i * 1.3) * 6);
      gn.lineTo(1280, 110); gn.fill();
      if (th.near === 'trees') for (i = 0; i < 90; i++) { x = r() * 1280; var ty = 64 + Math.sin(x / 20 * 0.45 + (th.seed || 0)) * 20; E(gn, x, ty, 8 + r() * 8, 12 + r() * 8, th.nearC[1]); }
      else for (i = 0; i < 30; i++) { x = r() * 1280; R(gn, x, 70 + r() * 30, 2, 8 + r() * 6, th.nearC[1]); E(gn, x + 1, 68 + r() * 30, 3, 9, th.nearC[1]); }
    }
    // nuvole o stelle
    var gc = cl.getContext('2d');
    if (th.night) for (i = 0; i < 140; i++) R(gc, r() * 1280, r() * 110, r() < 0.15 ? 2 : 1, r() < 0.15 ? 2 : 1, 'rgba(255,255,255,' + (0.4 + r() * 0.6) + ')');
    else if (th.clouds) for (i = 0; i < 9; i++) {
      x = r() * 1280; var y = 14 + r() * 70, s = 0.6 + r() * 0.8;
      for (var k = 0; k < 5; k++) E(gc, x + k * 16 * s, y - (k % 2) * 6 * s, 18 * s, 9 * s, th.cloudC || 'rgba(255,255,255,0.85)');
    }
    return { far: far, near: near, clouds: cl };
  }

  /* ================= LOGO / ICONA ================= */
  function sunStripes(g, x, y, r, c1, c2) {
    var gr = g.createLinearGradient(0, y - r, 0, y + r); gr.addColorStop(0, c1); gr.addColorStop(1, c2);
    g.save(); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    for (var i = 0; i < 7; i++) { var yy = y + r * 0.1 + i * r * 0.13; g.clearRect(x - r, yy, r * 2, r * 0.025 * (i + 1)); }
    g.restore();
  }
  function icon(size) {
    var c = mk(size, size), g = c.getContext('2d');
    var gr = g.createLinearGradient(0, 0, 0, size); gr.addColorStop(0, '#1a0f4a'); gr.addColorStop(0.55, '#e8327a'); gr.addColorStop(1, '#ff9a3a');
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    var s2 = mk(size, size), g2 = s2.getContext('2d');
    sunStripes(g2, size / 2, size * 0.48, size * 0.3, '#ffe14a', '#ff5a3a'); g.drawImage(s2, 0, 0);
    // strada
    P(g, [size * 0.05, size, size * 0.45, size * 0.62, size * 0.55, size * 0.62, size * 0.95, size], '#3a3a48');
    P(g, [size * 0.48, size * 0.66, size * 0.52, size * 0.66, size * 0.53, size * 0.76, size * 0.47, size * 0.76], '#ffffff');
    R(g, 0, size * 0.62, size, size * 0.012, '#ff4ae0');
    var car = playerCar(0, false), cw = size * 0.62;
    g.imageSmoothingEnabled = false;
    g.drawImage(car, (size - cw) / 2, size - cw * car.height / car.width - size * 0.02, cw, cw * car.height / car.width);
    return c;
  }

  TR.gfx = {
    S: S, playerCar: playerCar, carHD: carHD, trafficCar: trafficCar, CARCOL: CARCOL, gate: gate, forkSign: forkSign,
    townSign: townSign, dirSign: dirSign, TOWNS: TOWNS, PROVINCE: PROVINCE, NADS: ADS.length, background: background, sunStripes: sunStripes, icon: icon, R: R, P: P, E: E
  };
})();
