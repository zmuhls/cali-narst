'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="zach-talk-3"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.style.position = figure.style.position || 'relative';
  var canvas = document.createElement('canvas');
  canvas.id = 'zm3-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  figure.appendChild(canvas);

  var HR = '232,200,159'; // --accent-zach amber
  var BG = '#080b10';

  var GLYPHS = [
    'engagement', 'intentionality', 'innovation', 'solidarity',
    'model', 'dataset', 'prompt', 'corpus', 'weight', 'token',
    'pilot', 'refactor', 'retrieval', 'rubric', 'shim',
    '//', '{}', '</>', '—', '≈', '⌖', '·', '⟡',
    '[ ]', '( )', 'σ', 'λ', '∿'
  ];

  var ctx, W, H, dpr, raf, frame = 0, running = false;
  var fragments = [];
  var pointer = { x: 0, y: 0, active: false, idleFor: 0 };
  var voidRadius = 48; // the unfilled gestalt core

  function seed() {
    fragments = [];
    for (var i = 0; i < 44; i++) {
      var text = GLYPHS[i % GLYPHS.length];
      fragments.push({
        text:    text,
        x:       Math.random() * W,
        y:       Math.random() * H,
        vx:      (Math.random() - 0.5) * 0.35,
        vy:      (Math.random() - 0.5) * 0.35,
        sz:      9 + Math.random() * 5,
        a:       0.32 + Math.random() * 0.38,
        phase:   Math.random() * Math.PI * 2,
        isGlyph: text.length <= 3
      });
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
    pointer.x = W * 0.5;
    pointer.y = H * 0.5;
    voidRadius = Math.min(W, H) * 0.09;
    seed();
    return true;
  }

  function draw() {
    if (!ctx || !W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // Auto-orbit the attractor when pointer is idle
    pointer.idleFor += 1;
    var ax = pointer.x, ay = pointer.y;
    if (pointer.idleFor > 60) {
      var t = frame * 0.006;
      ax = W * 0.5 + Math.cos(t) * W * 0.18;
      ay = H * 0.5 + Math.sin(t * 1.3) * H * 0.14;
    }

    // Hairline halo around the void — faint, barely visible
    ctx.save();
    ctx.strokeStyle = 'rgba(' + HR + ',0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(ax, ay, voidRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.textBaseline = 'middle';

    for (var i = 0; i < fragments.length; i++) {
      var f = fragments[i];

      // attraction toward the attractor, repulsion from the void core
      var dx = ax - f.x;
      var dy = ay - f.y;
      var d  = Math.sqrt(dx * dx + dy * dy) + 0.01;
      var pull = 0.0016;
      f.vx += (dx / d) * pull * (150 + d * 0.2);
      f.vy += (dy / d) * pull * (150 + d * 0.2);

      if (d < voidRadius + 18) {
        var push = (voidRadius + 18 - d) * 0.012;
        f.vx -= (dx / d) * push;
        f.vy -= (dy / d) * push;
      }

      // damping + gentle noise
      f.vx *= 0.94;
      f.vy *= 0.94;
      f.phase += 0.02;
      f.vx += Math.cos(f.phase) * 0.04;
      f.vy += Math.sin(f.phase * 1.1) * 0.04;

      f.x += f.vx;
      f.y += f.vy;

      // wrap
      if (f.x < -60) f.x = W + 60;
      if (f.x > W + 60) f.x = -60;
      if (f.y < -30) f.y = H + 30;
      if (f.y > H + 30) f.y = -30;

      ctx.fillStyle = 'rgba(' + HR + ',' + f.a + ')';
      ctx.font = (f.isGlyph ? (f.sz + 3) : f.sz) + 'px "IBM Plex Mono", monospace';
      ctx.fillText(f.text, f.x, f.y);
    }

    // Attractor point — a single small mark, no fill circle
    ctx.strokeStyle = 'rgba(' + HR + ',0.55)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(ax - 4, ay); ctx.lineTo(ax + 4, ay);
    ctx.moveTo(ax, ay - 4); ctx.lineTo(ax, ay + 4);
    ctx.stroke();

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
    pointer.active = true;
    pointer.idleFor = 0;
  });
  canvas.addEventListener('pointerleave', function () { pointer.active = false; });

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
