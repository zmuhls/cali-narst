'use strict';
// ZM1 · Tinkering as Critical AI Literacy — Langton's Ant.
// Ported from milwrite/creative-clawing gallery/langton.html.
// Click (or tap) the canvas during the slide to drop an additional ant —
// the viz itself is the thesis: simple rules + immediate feedback +
// open-ended experimentation = tinkerability.
(function () {
  var slide = document.querySelector('section[data-slide="zach-talk-1"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.classList.remove('diagram-stage');
  figure.style.position = figure.style.position || 'relative';

  var canvas = document.createElement('canvas');
  canvas.id = 'zm1-canvas';
  canvas.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;display:block;' +
    'image-rendering:pixelated;image-rendering:crisp-edges;' +
    'touch-action:none;cursor:crosshair;';
  figure.appendChild(canvas);

  var ctx = canvas.getContext('2d');

  // Deck-aligned palette. State 0 is deep near-black; state 1 is Zach's
  // amber accent. Ants are marked in bright cream so they stand out
  // against both states.
  var PALETTE = [
    [8, 11, 16],       // state 0
    [232, 200, 159]    // state 1 — accent-zach
  ];
  var ANT_COLOR = [255, 248, 230];

  var CELL = 3;                // px per cell (screen-space)
  var SPF_DEFAULT = 28;        // simulation steps per frame
  var DX = [0, 1, 0, -1];
  var DY = [-1, 0, 1, 0];

  var cols, rows, grid, ants, step, running, raf, spf, dpr;

  function rng(n) { return (Math.random() * n) | 0; }

  function makeAnt(x, y, h) {
    return { x: x, y: y, d: rng(4), h: h };
  }

  function init() {
    dpr = 1; // pixel-art look — don't multiply by devicePixelRatio
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (!w || !h) return false;
    var pw = Math.max(4, Math.floor(w / CELL));
    var ph = Math.max(4, Math.floor(h / CELL));
    canvas.width = pw;
    canvas.height = ph;
    cols = pw;
    rows = ph;
    grid = new Uint8Array(cols * rows);
    // Seed with a single ant near the center
    ants = [makeAnt((cols / 2) | 0, (rows / 2) | 0, 38)];
    step = 0;
    spf = SPF_DEFAULT;
    return true;
  }

  function tick() {
    for (var i = 0; i < ants.length; i++) {
      var a = ants[i];
      var idx = a.y * cols + a.x;
      var s = grid[idx];
      // Langton's RL rule: state 0 → turn right, state 1 → turn left
      a.d = ((a.d + (s === 0 ? 1 : -1)) + 4) % 4;
      grid[idx] = 1 - s;
      a.x = (a.x + DX[a.d] + cols) % cols;
      a.y = (a.y + DY[a.d] + rows) % rows;
    }
    step++;
  }

  function draw() {
    if (!cols || !rows) return;
    var img = ctx.getImageData(0, 0, cols, rows);
    var d = img.data;
    var n = cols * rows;
    for (var i = 0; i < n; i++) {
      var p = PALETTE[grid[i]];
      var b = i * 4;
      d[b]     = p[0];
      d[b + 1] = p[1];
      d[b + 2] = p[2];
      d[b + 3] = 255;
    }
    for (var k = 0; k < ants.length; k++) {
      var a = ants[k];
      var bb = (a.y * cols + a.x) * 4;
      d[bb]     = ANT_COLOR[0];
      d[bb + 1] = ANT_COLOR[1];
      d[bb + 2] = ANT_COLOR[2];
      d[bb + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  function loop() {
    if (!running) return;
    if (running) {
      for (var i = 0; i < spf; i++) tick();
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    if (!init()) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
  }

  // Click / tap to drop a new ant at the pointer. Prevents the slide's
  // click handler (overview toggle) from firing via stopPropagation.
  function dropAntAt(clientX, clientY) {
    if (!cols || !rows) return;
    var r = canvas.getBoundingClientRect();
    var x = Math.floor((clientX - r.left) / r.width * cols);
    var y = Math.floor((clientY - r.top) / r.height * rows);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    ants.push(makeAnt(x, y, Math.random() * 360));
  }

  canvas.addEventListener('click', function (e) {
    e.stopPropagation();
    dropAntAt(e.clientX, e.clientY);
  });
  canvas.addEventListener('touchend', function (e) {
    e.preventDefault();
    e.stopPropagation();
    var t = e.changedTouches && e.changedTouches[0];
    if (t) dropAntAt(t.clientX, t.clientY);
  }, { passive: false });

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
