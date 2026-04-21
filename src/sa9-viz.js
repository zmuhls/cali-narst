'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="sule-9"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.style.position = figure.style.position || 'relative';
  var canvas = document.createElement('canvas');
  canvas.id = 'sa9-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair;';
  figure.appendChild(canvas);

  var SR = '201,166,207'; // --accent-sule
  var FG = '218,225,232';
  var BG = '#080b10';

  // Micro-content: fixed coordinates (as fractions of W/H) that are invisible
  // at slide scale but resolve under the magnifier lens.
  var MICRO = [
    { fx: 0.22, fy: 0.28, render: 'text', value: 'epistemic agency' },
    { fx: 0.68, fy: 0.22, render: 'text', value: 'sensemaking' },
    { fx: 0.38, fy: 0.58, render: 'text', value: 'resistance' },
    { fx: 0.78, fy: 0.64, render: 'text', value: 'SSI-based instruction' },
    { fx: 0.18, fy: 0.76, render: 'text', value: 'critical consciousness' },
    { fx: 0.55, fy: 0.42, render: 'classroom' }, // 12-dot classroom diagram
    { fx: 0.85, fy: 0.40, render: 'crossed-equals' } // AI ≠ inevitability
  ];

  var ctx, W, H, dpr, raf, frame = 0, running = false;
  var lens = { x: 0, y: 0, r: 110, active: false, idleFor: 0 };
  var noiseField = null; // offscreen canvas

  function buildNoise() {
    // Low-contrast monochrome grid noise that reads as "uniform texture" at normal scale
    var off = document.createElement('canvas');
    off.width  = Math.max(1, Math.round(W));
    off.height = Math.max(1, Math.round(H));
    var o = off.getContext('2d');
    var img = o.createImageData(off.width, off.height);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      var v = 22 + ((Math.random() * 16) | 0);
      d[i] = v; d[i+1] = v; d[i+2] = v + 2; d[i+3] = 255;
    }
    o.putImageData(img, 0, 0);
    // Overlay faint grid
    o.strokeStyle = 'rgba(218,225,232,0.04)';
    o.lineWidth = 1;
    for (var gx = 0; gx < off.width; gx += 18) {
      o.beginPath(); o.moveTo(gx, 0); o.lineTo(gx, off.height); o.stroke();
    }
    for (var gy = 0; gy < off.height; gy += 18) {
      o.beginPath(); o.moveTo(0, gy); o.lineTo(off.width, gy); o.stroke();
    }
    noiseField = off;
  }

  function reset() {
    dpr = window.devicePixelRatio || 1;
    W   = canvas.clientWidth;
    H   = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    lens.x = W * 0.5;
    lens.y = H * 0.5;
    lens.r = Math.min(W, H) * 0.18;
    buildNoise();
    return true;
  }

  function drawMicroItem(item, cx, cy, scale) {
    // Render the micro-item at (cx, cy) at the given scale (magnified = ~7x)
    ctx.save();
    if (item.render === 'text') {
      ctx.font = (11 * scale) + 'px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(' + FG + ',0.85)';
      var w = ctx.measureText(item.value).width;
      ctx.fillText(item.value, cx - w / 2, cy);
    } else if (item.render === 'classroom') {
      // 4x3 grid of tiny dots — a "classroom"
      var step = 5 * scale;
      for (var r = 0; r < 3; r++) {
        for (var c = 0; c < 4; c++) {
          ctx.beginPath();
          ctx.arc(cx - step * 1.5 + c * step, cy - step + r * step, 0.9 * scale, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + SR + ',0.85)';
          ctx.fill();
        }
      }
      // seat of the teacher
      ctx.beginPath();
      ctx.arc(cx, cy + step * 2.2, 1.3 * scale, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + FG + ',0.7)';
      ctx.fill();
    } else if (item.render === 'crossed-equals') {
      ctx.font = (10 * scale) + 'px "IBM Plex Mono", monospace';
      ctx.fillStyle = 'rgba(' + FG + ',0.85)';
      var left = 'AI';
      var right = 'inevitability';
      var lw = ctx.measureText(left).width;
      var rw = ctx.measureText(right).width;
      var gap = 14 * scale;
      ctx.fillText(left, cx - lw - gap, cy);
      ctx.fillText(right, cx + gap, cy);
      // equals sign
      ctx.strokeStyle = 'rgba(' + FG + ',0.7)';
      ctx.lineWidth = 0.8 * scale;
      ctx.beginPath();
      ctx.moveTo(cx - gap * 0.6, cy - 2 * scale); ctx.lineTo(cx + gap * 0.6, cy - 2 * scale);
      ctx.moveTo(cx - gap * 0.6, cy + 2 * scale); ctx.lineTo(cx + gap * 0.6, cy + 2 * scale);
      ctx.stroke();
      // slash through
      ctx.strokeStyle = 'rgba(' + SR + ',0.9)';
      ctx.lineWidth = 1.2 * scale;
      ctx.beginPath();
      ctx.moveTo(cx - gap * 0.8, cy + 5 * scale); ctx.lineTo(cx + gap * 0.8, cy - 5 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    if (!ctx || !W || !H) return;

    // Auto-drift when pointer is idle
    lens.idleFor += 1;
    var lx = lens.x, ly = lens.y;
    if (lens.idleFor > 90) {
      var t = frame * 0.005;
      lx = W * 0.5 + Math.cos(t) * W * 0.28;
      ly = H * 0.5 + Math.sin(t * 1.4) * H * 0.28;
    }

    // Background: noise field
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    if (noiseField) ctx.drawImage(noiseField, 0, 0, W, H);

    // Render micro items at subpixel scale (1.0) so they're basically invisible
    for (var i = 0; i < MICRO.length; i++) {
      var m = MICRO[i];
      drawMicroItem(m, m.fx * W, m.fy * H, 1.0);
    }

    // Magnified region inside lens
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, lens.r, 0, Math.PI * 2);
    ctx.clip();

    // Soft dark wash inside lens so magnified content reads
    ctx.fillStyle = 'rgba(8,11,16,0.55)';
    ctx.fillRect(lx - lens.r, ly - lens.r, lens.r * 2, lens.r * 2);

    // For each micro item within lens range, render at scale 7
    var scale = 7;
    for (var j = 0; j < MICRO.length; j++) {
      var m2 = MICRO[j];
      var mx = m2.fx * W;
      var my = m2.fy * H;
      var dx = mx - lx;
      var dy = my - ly;
      var d  = Math.sqrt(dx * dx + dy * dy);
      if (d < lens.r * 1.1) {
        // magnified position: item position translated/scaled around the lens center
        var cx = lx + dx * scale * 0.3;
        var cy = ly + dy * scale * 0.3;
        drawMicroItem(m2, cx, cy, scale * 0.45);
      }
    }
    ctx.restore();

    // Lens ring
    ctx.save();
    ctx.strokeStyle = 'rgba(' + SR + ',0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lx, ly, lens.r, 0, Math.PI * 2);
    ctx.stroke();
    // inner hairline
    ctx.strokeStyle = 'rgba(' + SR + ',0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(lx, ly, lens.r - 5, 0, Math.PI * 2);
    ctx.stroke();
    // handle (small stroke extending out)
    var ang = Math.PI * 0.25;
    ctx.beginPath();
    ctx.moveTo(lx + Math.cos(ang) * lens.r, ly + Math.sin(ang) * lens.r);
    ctx.lineTo(lx + Math.cos(ang) * (lens.r + 22), ly + Math.sin(ang) * (lens.r + 22));
    ctx.strokeStyle = 'rgba(' + SR + ',0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Hint
    ctx.save();
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + FG + ',0.3)';
    var hint = 'move cursor to scrutinize';
    ctx.fillText(hint, 14, H - 14);
    ctx.restore();

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
    lens.x = e.clientX - r.left;
    lens.y = e.clientY - r.top;
    lens.idleFor = 0;
    lens.active = true;
  });
  canvas.addEventListener('pointerleave', function () { lens.active = false; });

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
