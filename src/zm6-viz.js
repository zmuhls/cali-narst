'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="zach-talk-6"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.classList.add('diagram-stage');
  figure.style.position = figure.style.position || 'relative';
  var canvas = document.createElement('canvas');
  canvas.id = 'zm6-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;';
  figure.appendChild(canvas);

  var HR = '232,200,159';
  var FG = '218,225,232';
  var BG = '#080b10';

  var NARROW_VOCAB = ['the', 'and', 'of', 'a', 'to', 'in'];
  var WIDE_VOCAB   = [
    'the', 'and', 'of', 'a', 'to', 'in', 'model', 'prompt', 'token',
    'drift', 'weight', 'rubric', 'bricolage', 'signal', 'loss',
    'σ', 'λ', '∿', '≈', '⌖', '—', '//', '{}', '[]'
  ];
  var GLITCH_CHARS = '!@#$%^&*<>?~|\\/=+';

  var ctx, W, H, dpr, raf, frame = 0, running = false;
  var temperature = 0.35; // 0..2
  var topP        = 0.55; // 0..1
  var drag = null; // 'temp' | 'topP' | null
  var tokens = [];

  function seedTokens() {
    tokens = [];
    var N = 18;
    for (var i = 0; i < N; i++) {
      var t = { x: 0, seed: Math.random(), ttl: 60 + Math.random() * 60, text: '' };
      t.x = (i / N) * W * 1.1 - 30;
      assignText(t);
      tokens.push(t);
    }
  }

  function assignText(t) {
    var pool = t.seed < topP ? WIDE_VOCAB : NARROW_VOCAB;
    var idx  = Math.floor(t.seed * 997) % pool.length;
    var w    = pool[idx];
    var glitchP = Math.max(0, (temperature - 0.6) * 0.55);
    if (Math.random() < glitchP) {
      var n = 1 + Math.floor(Math.random() * 3);
      var out = '';
      for (var k = 0; k < n; k++) out += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
      t.text = out;
    } else if (temperature > 1.4 && Math.random() < 0.35) {
      t.text = w + ' ' + w;
    } else {
      t.text = w;
    }
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
    seedTokens();
    return true;
  }

  function layout() {
    var pad = W * 0.08;
    return {
      tempY:  H * 0.22,
      topPY:  H * 0.38,
      trackL: pad,
      trackR: W - pad,
      streamY: H * 0.68,
      streamH: H * 0.22
    };
  }

  function drawTrack(label, y, val, max, L, R, active) {
    ctx.save();
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + HR + ',0.62)';
    ctx.fillText(label.toUpperCase(), L, y - 14);
    ctx.fillStyle = 'rgba(' + FG + ',0.55)';
    var valStr = val.toFixed(2);
    ctx.textAlign = 'right';
    ctx.fillText(valStr, R, y - 14);
    ctx.textAlign = 'left';

    // track line
    ctx.strokeStyle = 'rgba(' + FG + ',0.22)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();

    // tick at 1.7 threshold for temp
    if (label === 'temperature') {
      var tx = L + (R - L) * (1.7 / max);
      ctx.strokeStyle = 'rgba(' + FG + ',0.28)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(tx, y - 6); ctx.lineTo(tx, y + 6); ctx.stroke();
      ctx.setLineDash([]);
    }

    // handle
    var hx = L + (R - L) * (val / max);
    ctx.beginPath();
    ctx.arc(hx, y, active ? 7 : 5.5, 0, Math.PI * 2);
    ctx.fillStyle = active ? '#e8c89f' : 'rgba(' + HR + ',0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + HR + ',0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    return hx;
  }

  function drawStream(l) {
    ctx.save();
    ctx.font = '14px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'middle';

    // thin baseline
    ctx.strokeStyle = 'rgba(' + FG + ',0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(l.trackL, l.streamY);
    ctx.lineTo(l.trackR, l.streamY);
    ctx.stroke();

    // label
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + HR + ',0.55)';
    ctx.fillText('OUTPUT STREAM', l.trackL, l.streamY - l.streamH / 2 - 8);

    ctx.font = '14px "IBM Plex Mono", monospace';
    var speed = 0.6 + temperature * 0.4;
    var jitter = temperature * (l.streamH * 0.45);

    // approximate spacing so tokens don't overlap on spawn
    var spawnGap = (l.trackR - l.trackL) / tokens.length;
    var rightmost = -Infinity;
    for (var s = 0; s < tokens.length; s++) if (tokens[s].x > rightmost) rightmost = tokens[s].x;

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      t.x -= speed;
      if (t.x < l.trackL - 80) {
        t.seed = Math.random();
        t.x = Math.max(l.trackR + 10, rightmost + spawnGap * (0.9 + Math.random() * 0.3));
        rightmost = t.x;
        assignText(t);
      }
      var y = l.streamY + Math.sin(frame * 0.03 + t.seed * 10) * jitter * (0.5 + t.seed * 0.5);
      if (t.x < l.trackL - 10 || t.x > l.trackR + 10) continue;
      var mix = Math.min(1, temperature / 2);
      var rgb = 'rgba(' + FG + ',' + (0.75 - mix * 0.15) + ')';
      if (temperature > 1.4 && (t.seed * 10) % 1 < 0.25) rgb = 'rgba(' + HR + ',0.9)';
      ctx.fillStyle = rgb;
      ctx.fillText(t.text, t.x, y);
    }

    ctx.restore();
  }

  function draw() {
    if (!ctx || !W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    var l = layout();

    ctx.save();
    ctx.font = 'bold 14px "IBM Plex Mono", monospace';
    ctx.letterSpacing = '2px';
    ctx.fillStyle = 'rgba(' + HR + ',0.5)';
    var hl = 'HYPERPARAMETERS';
    ctx.fillText(hl, W * 0.5 - ctx.measureText(hl).width / 2, H * 0.08);
    ctx.restore();

    drawTrack('temperature', l.tempY, temperature, 2.0, l.trackL, l.trackR, drag === 'temp');
    drawTrack('top-p',       l.topPY, topP,        1.0, l.trackL, l.trackR, drag === 'topP');
    drawStream(l);

    // hint
    ctx.save();
    ctx.font = '10px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + FG + ',0.32)';
    var hint = 'drag handles · temp > 1.7 → drift';
    ctx.fillText(hint, l.trackR - ctx.measureText(hint).width, H * 0.94);
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

  function pick(e) {
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left;
    var y = e.clientY - r.top;
    var l = layout();
    var tempHx = l.trackL + (l.trackR - l.trackL) * (temperature / 2);
    var topHx  = l.trackL + (l.trackR - l.trackL) * topP;
    if (Math.abs(y - l.tempY) < 18 && Math.abs(x - tempHx) < 28) return 'temp';
    if (Math.abs(y - l.topPY) < 18 && Math.abs(x - topHx)  < 28) return 'topP';
    if (Math.abs(y - l.tempY) < 12) return 'temp';
    if (Math.abs(y - l.topPY) < 12) return 'topP';
    return null;
  }

  canvas.addEventListener('pointerdown', function (e) {
    drag = pick(e);
    if (drag) {
      canvas.setPointerCapture(e.pointerId);
      moveDrag(e);
    }
  });
  canvas.addEventListener('pointermove', function (e) {
    if (drag) moveDrag(e);
  });
  canvas.addEventListener('pointerup', function (e) {
    drag = null;
    try { canvas.releasePointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointercancel', function () { drag = null; });

  function moveDrag(e) {
    var r = canvas.getBoundingClientRect();
    var x = e.clientX - r.left;
    var l = layout();
    var pct = Math.max(0, Math.min(1, (x - l.trackL) / (l.trackR - l.trackL)));
    if (drag === 'temp') temperature = pct * 2.0;
    else if (drag === 'topP') topP = pct;
  }

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
