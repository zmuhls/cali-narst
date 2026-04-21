'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="sule-10"]');
  if (!slide) return;
  // slide-testimonial hides figure.stage via CSS, so mount canvas at section
  // level as a background layer with content lifted above it.
  if (getComputedStyle(slide).position === 'static') slide.style.position = 'relative';
  var canvas = document.createElement('canvas');
  canvas.id = 'sa10-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;z-index:0;';
  slide.insertBefore(canvas, slide.firstChild);
  var content = slide.querySelector('.content');
  if (content) { content.style.position = 'relative'; content.style.zIndex = '1'; }

  var SR = '201,166,207'; // --accent-sule
  var FG = '218,225,232';
  var BG = '#080b10';

  var LAYERS = [
    { key: 'mineral extraction',  range: [0.05, 0.35] },
    { key: 'labor',               range: [0.15, 0.50] },
    { key: 'power',               range: [0.30, 0.65] },
    { key: 'water / cooling',     range: [0.45, 0.80] },
    { key: 'capital',             range: [0.60, 1.00] }
  ];

  var ctx, W, H, dpr, raf, frame = 0, running = false;
  var reveal = 0; // 0..1, fraction of cloud peeled back
  var auto = true;
  var pointer = { x: 0, y: 0, over: false };

  function reset() {
    dpr = window.devicePixelRatio || 1;
    W   = canvas.clientWidth;
    H   = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return true;
  }

  function layerAlpha(layer) {
    var r = reveal;
    if (r < layer.range[0]) return 0;
    if (r > layer.range[1]) return 1;
    return (r - layer.range[0]) / (layer.range[1] - layer.range[0]);
  }

  function drawCloud(cx, cy, r, alpha) {
    // Stylized cloud: overlapping soft circles
    ctx.save();
    ctx.fillStyle = 'rgba(235,240,248,' + alpha * 0.92 + ')';
    var lobes = [
      [-r * 0.55, r * 0.15, r * 0.55],
      [-r * 0.15, -r * 0.20, r * 0.60],
      [ r * 0.25, -r * 0.10, r * 0.55],
      [ r * 0.55, r * 0.20, r * 0.48],
      [ 0,        r * 0.35, r * 0.52]
    ];
    ctx.beginPath();
    for (var i = 0; i < lobes.length; i++) {
      ctx.moveTo(cx + lobes[i][0] + lobes[i][2], cy + lobes[i][1]);
      ctx.arc(cx + lobes[i][0], cy + lobes[i][1], lobes[i][2], 0, Math.PI * 2);
    }
    ctx.fill();
    // outline
    ctx.strokeStyle = 'rgba(' + SR + ',' + alpha * 0.75 + ')';
    ctx.lineWidth = 1.2;
    for (var j = 0; j < lobes.length; j++) {
      ctx.beginPath();
      ctx.arc(cx + lobes[j][0], cy + lobes[j][1], lobes[j][2], 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMineral(cx, cy, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    // grid
    ctx.strokeStyle = 'rgba(' + FG + ',0.08)';
    ctx.lineWidth = 1;
    var step = 18;
    for (var gx = -w / 2; gx <= w / 2; gx += step) {
      ctx.beginPath(); ctx.moveTo(cx + gx, cy - h / 2); ctx.lineTo(cx + gx, cy + h / 2); ctx.stroke();
    }
    for (var gy = -h / 2; gy <= h / 2; gy += step) {
      ctx.beginPath(); ctx.moveTo(cx - w / 2, cy + gy); ctx.lineTo(cx + w / 2, cy + gy); ctx.stroke();
    }
    // extraction dots
    var seeds = 24;
    for (var i = 0; i < seeds; i++) {
      var sx = cx + (Math.sin(i * 7.3) * 0.45) * w;
      var sy = cy + (Math.cos(i * 4.7) * 0.45) * h;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + SR + ',0.75)';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLabor(cx, cy, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    var n = 16;
    var spacing = w / (n + 1);
    for (var i = 0; i < n; i++) {
      var fx = cx - w / 2 + spacing * (i + 1);
      // tiny figure: head + torso
      ctx.fillStyle = 'rgba(' + FG + ',0.55)';
      ctx.beginPath(); ctx.arc(fx, cy - 6, 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(' + FG + ',0.55)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fx, cy - 3); ctx.lineTo(fx, cy + 6);
      ctx.moveTo(fx - 3, cy + 1); ctx.lineTo(fx + 3, cy + 1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPower(cx, cy, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(' + FG + ',0.42)';
    ctx.lineWidth = 1;
    // horizontal baseline
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx + w / 2, cy);
    ctx.stroke();
    // pylons
    var pylons = 5;
    for (var i = 0; i <= pylons; i++) {
      var px = cx - w / 2 + (w / pylons) * i;
      ctx.beginPath();
      ctx.moveTo(px, cy); ctx.lineTo(px, cy - 12);
      ctx.moveTo(px - 6, cy - 10); ctx.lineTo(px + 6, cy - 10);
      ctx.moveTo(px - 4, cy - 6); ctx.lineTo(px + 4, cy - 6);
      ctx.stroke();
      // catenary line
      if (i < pylons) {
        var nx = cx - w / 2 + (w / pylons) * (i + 1);
        ctx.beginPath();
        ctx.moveTo(px, cy - 10);
        ctx.quadraticCurveTo((px + nx) / 2, cy - 3, nx, cy - 10);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawWater(cx, cy, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(' + FG + ',0.35)';
    ctx.lineWidth = 1;
    for (var line = 0; line < 3; line++) {
      ctx.beginPath();
      for (var x = -w / 2; x <= w / 2; x += 6) {
        var yy = cy + line * 6 + Math.sin((x + frame * 0.8) * 0.06 + line) * 3;
        if (x === -w / 2) ctx.moveTo(cx + x, yy);
        else ctx.lineTo(cx + x, yy);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCapital(cx, cy, w, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    // hairline network graph
    var nodes = [];
    for (var i = 0; i < 9; i++) {
      nodes.push({
        x: cx + (Math.sin(i * 1.7) * 0.4) * w,
        y: cy + (Math.cos(i * 2.1) * 0.5) * 28
      });
    }
    ctx.strokeStyle = 'rgba(' + SR + ',0.45)';
    ctx.lineWidth = 0.8;
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        if ((a * 3 + b) % 3 === 0) {
          ctx.beginPath();
          ctx.moveTo(nodes[a].x, nodes[a].y);
          ctx.lineTo(nodes[b].x, nodes[b].y);
          ctx.stroke();
        }
      }
    }
    ctx.fillStyle = 'rgba(' + SR + ',0.75)';
    for (var k = 0; k < nodes.length; k++) {
      ctx.beginPath();
      ctx.arc(nodes[k].x, nodes[k].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRevealSlider() {
    var y = H - 26;
    var L = W * 0.12, R = W * 0.88;
    ctx.save();
    ctx.strokeStyle = 'rgba(' + FG + ',0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
    var hx = L + (R - L) * reveal;
    ctx.beginPath();
    ctx.arc(hx, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + SR + ',0.9)';
    ctx.fill();
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + FG + ',0.4)';
    ctx.fillText('abstraction', L, y - 8);
    ctx.textAlign = 'right';
    ctx.fillText('materiality', R, y - 8);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function draw() {
    if (!ctx || !W || !H) return;

    // Drive reveal: cursor X when over canvas, otherwise auto-cycle
    if (pointer.over) {
      var target = Math.max(0, Math.min(1, (pointer.x - W * 0.08) / (W * 0.84)));
      reveal += (target - reveal) * 0.12;
    } else if (auto) {
      var t = (frame % 420) / 420;
      var target2 = t < 0.5 ? t * 2 : (1 - t) * 2;
      reveal += (target2 - reveal) * 0.04;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    var cx = W * 0.5;
    var cy = H * 0.42;
    var cloudR = Math.min(W * 0.28, H * 0.35);

    // Layers behind the cloud
    var layerBandW = W * 0.72;
    var layerSpacing = (H * 0.62) / LAYERS.length;
    for (var i = 0; i < LAYERS.length; i++) {
      var a = layerAlpha(LAYERS[i]);
      if (a <= 0) continue;
      var ly = H * 0.18 + i * layerSpacing;
      // label
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = '10px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(' + SR + ',0.75)';
      ctx.fillText(LAYERS[i].key.toUpperCase(), W * 0.14, ly - 10);
      ctx.restore();
      if (LAYERS[i].key === 'mineral extraction') drawMineral(cx, ly + 6, layerBandW, 30, a);
      else if (LAYERS[i].key === 'labor') drawLabor(cx, ly + 6, layerBandW, a);
      else if (LAYERS[i].key === 'power') drawPower(cx, ly + 6, layerBandW, a);
      else if (LAYERS[i].key === 'water / cooling') drawWater(cx, ly + 6, layerBandW, a);
      else if (LAYERS[i].key === 'capital') drawCapital(cx, ly + 6, layerBandW, a);
    }

    // Cloud: solid at reveal=0, fades as reveal increases
    var cloudAlpha = 1 - reveal * 0.92;
    if (cloudAlpha > 0.02) drawCloud(cx, cy, cloudR, cloudAlpha);

    drawRevealSlider();

    frame++;
  }

  function loop() { if (!running) return; draw(); raf = requestAnimationFrame(loop); }

  function start() {
    if (running) return;
    if (!reset()) return;
    running = true;
    loop();
  }

  function stop() { running = false; cancelAnimationFrame(raf); }

  canvas.addEventListener('pointermove', function (e) {
    var r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.over = true;
    auto = false;
  });
  canvas.addEventListener('pointerleave', function () {
    pointer.over = false;
    setTimeout(function () { if (!pointer.over) auto = true; }, 2000);
  });

  canvas.__deckResize = function () {
    var was = running; stop(); if (was) start();
  };

  var section = canvas.closest('section.slide');
  if (section) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.2 }).observe(section);
  }

  var rto;
  window.addEventListener('resize', function () {
    clearTimeout(rto);
    rto = setTimeout(function () { var was = running; stop(); if (was) start(); }, 150);
  });
}());
