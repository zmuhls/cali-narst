'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="sule-10"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.style.position = figure.style.position || 'relative';

  var canvas = document.createElement('canvas');
  canvas.id = 'sa10-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair;';
  figure.appendChild(canvas);

  var SR = '201,166,207'; // --accent-sule
  var FG = '218,225,232';
  var BG = '#080b10';

  var ctx, W, H, dpr, raf, frame = 0, running = false;

  // Data-center clusters (fx,fy in 0..1 of canvas viewport). Positions
  // approximate major hyperscale concentrations when mapped onto a
  // Mercator-ish grid occupying the canvas.
  var DC = [
    { fx: 0.18, fy: 0.38 }, // NA west
    { fx: 0.28, fy: 0.40 }, // NA central
    { fx: 0.34, fy: 0.42 }, // NA east
    { fx: 0.48, fy: 0.36 }, // Dublin
    { fx: 0.52, fy: 0.38 }, // Frankfurt
    { fx: 0.56, fy: 0.40 }, // Amsterdam
    { fx: 0.50, fy: 0.32 }, // London/Manchester
    { fx: 0.74, fy: 0.48 }, // Mumbai
    { fx: 0.82, fy: 0.40 }, // Singapore/Tokyo
    { fx: 0.84, fy: 0.36 }, // Tokyo
    { fx: 0.78, fy: 0.44 }, // Hong Kong
    { fx: 0.88, fy: 0.55 }, // Sydney
    { fx: 0.22, fy: 0.45 }, // SFO
    { fx: 0.30, fy: 0.36 }  // NYC metro
  ];

  // Extractive / mineral sites (cobalt, rare earths, lithium belts)
  var EX = [
    { fx: 0.52, fy: 0.68 }, // DRC cobalt
    { fx: 0.56, fy: 0.72 }, // Zambia copperbelt
    { fx: 0.15, fy: 0.70 }, // Chile lithium
    { fx: 0.18, fy: 0.76 }, // Bolivia salar
    { fx: 0.82, fy: 0.78 }, // Australia
    { fx: 0.68, fy: 0.38 }, // Kazakhstan
    { fx: 0.78, fy: 0.50 }, // Myanmar / Indonesia nickel
    { fx: 0.80, fy: 0.55 }, // Indonesia
    { fx: 0.24, fy: 0.60 }, // Mexico
    { fx: 0.70, fy: 0.55 }, // India rare earths
    { fx: 0.60, fy: 0.58 }, // Tanzania
    { fx: 0.50, fy: 0.80 }  // South Africa
  ];

  // Generation stacks (hydro / thermal / nuclear)
  var GEN = [
    { fx: 0.20, fy: 0.50 },
    { fx: 0.32, fy: 0.48 },
    { fx: 0.46, fy: 0.42 },
    { fx: 0.58, fy: 0.45 },
    { fx: 0.72, fy: 0.52 },
    { fx: 0.84, fy: 0.48 },
    { fx: 0.28, fy: 0.55 },
    { fx: 0.50, fy: 0.50 }
  ];

  // Water / cooling stacks
  var WATER = [
    { fx: 0.15, fy: 0.55 },
    { fx: 0.30, fy: 0.46 },
    { fx: 0.52, fy: 0.48 },
    { fx: 0.76, fy: 0.55 },
    { fx: 0.86, fy: 0.52 }
  ];

  // Precomputed dependency pairings: for each DC, pick 2-3 nearest
  // extractive sites, 1-2 generation stacks, 1-2 water stacks.
  var deps = [];

  function buildDeps() {
    deps = DC.map(function (dc) {
      function nearest(list, k) {
        return list.slice().sort(function (a, b) {
          return dist2(a, dc) - dist2(b, dc);
        }).slice(0, k);
      }
      return {
        ex:    nearest(EX, 3),
        gen:   nearest(GEN, 2),
        water: nearest(WATER, 2)
      };
    });
  }
  function dist2(a, b) { var dx = a.fx - b.fx, dy = a.fy - b.fy; return dx * dx + dy * dy; }

  var pointer = { x: -9999, y: -9999, over: false, idleFor: 0 };
  var scanDot = { t: 0 }; // auto-scan progress 0..1

  function reset() {
    dpr = window.devicePixelRatio || 1;
    W   = canvas.clientWidth;
    H   = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    buildDeps();
    return true;
  }

  function drawGrid() {
    ctx.save();
    ctx.strokeStyle = 'rgba(' + FG + ',0.06)';
    ctx.lineWidth = 1;
    // meridians (8)
    for (var i = 1; i < 10; i++) {
      var x = (i / 10) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    // parallels (6)
    for (var j = 1; j < 8; j++) {
      var y = (j / 8) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    // equator slightly darker
    ctx.strokeStyle = 'rgba(' + FG + ',0.12)';
    ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke();
    ctx.restore();
  }

  function drawExSites() {
    ctx.save();
    for (var i = 0; i < EX.length; i++) {
      var p = EX[i];
      ctx.strokeStyle = 'rgba(' + SR + ',0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(p.fx * W, p.fy * H, 2.2, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGenSites() {
    ctx.save();
    ctx.strokeStyle = 'rgba(' + FG + ',0.42)';
    ctx.lineWidth = 1;
    for (var i = 0; i < GEN.length; i++) {
      var p = GEN[i];
      var x = p.fx * W, y = p.fy * H;
      // square glyph
      ctx.strokeRect(x - 2.5, y - 2.5, 5, 5);
    }
    ctx.restore();
  }

  function drawWaterSites() {
    ctx.save();
    ctx.strokeStyle = 'rgba(143,213,195,0.42)'; // --accent-bright
    ctx.lineWidth = 1;
    for (var i = 0; i < WATER.length; i++) {
      var p = WATER[i];
      var x = p.fx * W, y = p.fy * H;
      // tilde-like water glyph: small wave
      ctx.beginPath();
      ctx.moveTo(x - 4, y);
      ctx.quadraticCurveTo(x - 2, y - 3, x, y);
      ctx.quadraticCurveTo(x + 2, y + 3, x + 4, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDC() {
    for (var i = 0; i < DC.length; i++) {
      var p = DC[i];
      var x = p.fx * W, y = p.fy * H;
      // pulse
      var pulse = 0.5 + 0.5 * Math.sin(frame * 0.06 + i * 0.9);
      // halo
      var grd = ctx.createRadialGradient(x, y, 0, x, y, 18);
      grd.addColorStop(0, 'rgba(' + SR + ',' + (0.12 + pulse * 0.18) + ')');
      grd.addColorStop(1, 'rgba(' + SR + ',0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, Math.PI * 2);
      ctx.fill();
      // core dot
      ctx.fillStyle = 'rgba(' + SR + ',' + (0.65 + pulse * 0.3) + ')';
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawDashSegment(x1, y1, x2, y2, color, dashOffset) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.lineDashOffset = dashOffset;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function revealAt(rx, ry, radius) {
    var dashOffset = -frame * 0.6;
    for (var i = 0; i < DC.length; i++) {
      var p = DC[i];
      var x = p.fx * W, y = p.fy * H;
      var dx = x - rx, dy = y - ry;
      var d2 = dx * dx + dy * dy;
      if (d2 > radius * radius) continue;
      // Strength proportional to proximity
      var prox = 1 - Math.sqrt(d2) / radius;
      var d = deps[i];
      // Bright ring around revealed DC
      ctx.strokeStyle = 'rgba(' + SR + ',' + (0.4 + prox * 0.5) + ')';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.stroke();

      // Extractive lines — sule purple
      for (var k = 0; k < d.ex.length; k++) {
        var e = d.ex[k];
        drawDashSegment(x, y, e.fx * W, e.fy * H,
          'rgba(' + SR + ',' + (0.35 + prox * 0.45) + ')', dashOffset);
      }
      // Power lines — neutral white
      for (var g = 0; g < d.gen.length; g++) {
        var ge = d.gen[g];
        drawDashSegment(x, y, ge.fx * W, ge.fy * H,
          'rgba(' + FG + ',' + (0.28 + prox * 0.4) + ')', dashOffset + 2);
      }
      // Water lines — accent-bright
      for (var w = 0; w < d.water.length; w++) {
        var we = d.water[w];
        drawDashSegment(x, y, we.fx * W, we.fy * H,
          'rgba(143,213,195,' + (0.3 + prox * 0.45) + ')', dashOffset + 4);
      }
    }
  }

  function draw() {
    if (!ctx || !W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    drawGrid();

    // Pointer idle accounting
    pointer.idleFor = pointer.over ? 0 : pointer.idleFor + 1;

    // Auto-scan path: a slow Lissajous across the map
    scanDot.t += 0.003;
    var sx = W * (0.5 + Math.cos(scanDot.t) * 0.42);
    var sy = H * (0.45 + Math.sin(scanDot.t * 1.3) * 0.28);

    var radius = Math.min(W, H) * 0.22;

    // Reveal under pointer (if inside canvas), else under auto-scan
    var rx, ry;
    if (pointer.over) { rx = pointer.x; ry = pointer.y; }
    else if (pointer.idleFor > 120) { rx = sx; ry = sy; }

    if (rx !== undefined) revealAt(rx, ry, radius);

    // Sites always visible
    drawExSites();
    drawGenSites();
    drawWaterSites();

    // Data centers on top
    drawDC();

    // Auto-scan dot glyph (so the motion is legible)
    if (!pointer.over && pointer.idleFor > 120) {
      ctx.strokeStyle = 'rgba(' + FG + ',0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(' + FG + ',0.15)';
      ctx.beginPath();
      ctx.arc(sx, sy, 12, 0, Math.PI * 2);
      ctx.stroke();
    }

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
  });
  canvas.addEventListener('pointerleave', function () { pointer.over = false; });

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
