'use strict';
// Quadratic angle walk — port of gallery/quadwalk.html (creative-clawing),
// adapted to the deck harness: IntersectionObserver start/stop, DPR sizing,
// pointer-scoped advance, no window-level listeners.
//
// At step n, move 1 unit then rotate by (p/q)·π·n² radians. The path closes
// after 2q steps by quadratic-Gauss-sum symmetry.
(function () {
  var slide = document.querySelector('section[data-slide="sule-2"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.style.position = figure.style.position || 'relative';

  var canvas = document.createElement('canvas');
  canvas.id = 'sa2-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:pointer;touch-action:none;';
  figure.appendChild(canvas);

  var info = document.createElement('div');
  info.className = 'sa2-info';
  info.style.cssText = [
    'position:absolute',
    'left:14px',
    'bottom:12px',
    'padding:4px 9px',
    'border-radius:6px',
    'background:rgba(0,0,0,0.42)',
    'color:rgba(230,220,235,0.82)',
    'font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace',
    'letter-spacing:0.04em',
    'pointer-events:none',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)'
  ].join(';');
  figure.appendChild(info);

  var hint = document.createElement('div');
  hint.className = 'sa2-hint';
  hint.style.cssText = [
    'position:absolute',
    'right:14px',
    'bottom:12px',
    'color:rgba(201,166,207,0.55)',
    'font:10.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace',
    'letter-spacing:0.06em',
    'pointer-events:none'
  ].join(';');
  hint.textContent = 'tap to cycle';
  figure.appendChild(hint);

  var ctx, W, H, dpr, raf, running = false;
  var lastT = 0;

  // q candidates — each (p, q) pair produces a distinct symmetric figure.
  var qList = [
    [1, 3], [1, 4], [1, 6], [1, 12],
    [2, 5], [3, 7], [5, 9], [4, 7],
    [1, 8], [3, 8], [7, 12], [5, 12],
    [2, 9], [7, 10], [3, 10], [11, 12],
    [5, 6], [7, 8], [3, 4], [5, 8]
  ];
  var qIdx = 0;
  var currentQ = qList[0];

  var pathData = null;
  var fit = null;

  var progress = 0;
  var phase = 'draw';       // 'draw' | 'hold' | 'fade'
  var holdTimer = 0;
  var transitionAlpha = 0;
  var drawSpeed = 0.6;      // fraction of total path per second

  function computePath(p, q) {
    var N = 2 * q;
    var pts = new Float64Array(2 * (N + 1));
    var x = 0, y = 0, angle = 0;
    for (var n = 0; n <= N; n++) {
      pts[n * 2] = x;
      pts[n * 2 + 1] = y;
      angle += (p / q) * Math.PI * (n * n);
      x += Math.cos(angle);
      y += Math.sin(angle);
    }
    return { pts: pts, N: N };
  }

  function fitPath(pts, N, cx, cy, maxR) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i <= N; i++) {
      var x = pts[i * 2], y = pts[i * 2 + 1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    var w = (maxX - minX) || 1;
    var h = (maxY - minY) || 1;
    var scale = maxR / (Math.max(w, h) * 0.5);
    var ox = cx - (minX + w / 2) * scale;
    var oy = cy - (minY + h / 2) * scale;
    return { scale: scale, ox: ox, oy: oy };
  }

  function buildPath() {
    var p = currentQ[0], q = currentQ[1];
    pathData = computePath(p, q);
    fit = fitPath(pathData.pts, pathData.N, W / 2, H / 2, Math.min(W, H) * 0.42);
  }

  function updateInfo() {
    info.textContent = 'q = ' + currentQ[0] + '/' + currentQ[1] + '  ·  ' + (2 * currentQ[1]) + ' steps';
  }

  function hue(t) {
    return (t * 360 + 200) % 360;
  }

  function drawGlow(alpha) {
    if (!pathData) return;
    var pts = pathData.pts, N = pathData.N;
    var scale = fit.scale, ox = fit.ox, oy = fit.oy;
    var steps = Math.floor(progress * N);
    if (steps < 2) return;

    ctx.globalAlpha = alpha * 0.18;
    ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.008);
    ctx.lineCap = 'round';
    ctx.filter = 'blur(' + (Math.min(W, H) * 0.003) + 'px)';
    for (var i = 0; i < steps; i++) {
      var t = i / N;
      ctx.beginPath();
      ctx.moveTo(pts[i * 2] * scale + ox, pts[i * 2 + 1] * scale + oy);
      ctx.lineTo(pts[(i + 1) * 2] * scale + ox, pts[(i + 1) * 2 + 1] * scale + oy);
      ctx.strokeStyle = 'hsl(' + hue(t) + ',100%,75%)';
      ctx.stroke();
    }
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
  }

  function drawPath(alpha) {
    if (!pathData) return;
    var pts = pathData.pts, N = pathData.N;
    var scale = fit.scale, ox = fit.ox, oy = fit.oy;
    var steps = Math.floor(progress * N);

    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1.2, Math.min(W, H) * 0.0028);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (var i = 0; i < steps; i++) {
      var t = i / N;
      ctx.beginPath();
      ctx.moveTo(pts[i * 2] * scale + ox, pts[i * 2 + 1] * scale + oy);
      ctx.lineTo(pts[(i + 1) * 2] * scale + ox, pts[(i + 1) * 2 + 1] * scale + oy);
      ctx.strokeStyle = 'hsl(' + hue(t) + ',85%,62%)';
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildPath();
    return true;
  }

  function advance() {
    qIdx = (qIdx + 1) % qList.length;
    currentQ = qList[qIdx];
    buildPath();
    updateInfo();
  }

  function tick(t) {
    if (!running) return;
    var dt = Math.min((t - lastT) / 1000, 0.05);
    lastT = t;

    if (phase === 'draw') {
      progress = Math.min(1, progress + drawSpeed * dt);
      if (progress >= 1) {
        phase = 'hold';
        holdTimer = 2.2;
      }
    } else if (phase === 'hold') {
      holdTimer -= dt;
      if (holdTimer <= 0) {
        phase = 'fade';
        transitionAlpha = 1;
      }
    } else if (phase === 'fade') {
      transitionAlpha -= dt * 1.8;
      if (transitionAlpha <= 0) {
        transitionAlpha = 0;
        advance();
        phase = 'draw';
        progress = 0;
      }
    }

    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, W, H);

    var cx = W / 2, cy = H / 2;
    var rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.5);
    rg.addColorStop(0, 'rgba(60,40,100,0.12)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    var a = (phase === 'fade') ? transitionAlpha : 1;
    drawGlow(a);
    drawPath(a);

    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    if (!resize()) return;
    updateInfo();
    running = true;
    lastT = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  canvas.addEventListener('pointerdown', function () {
    if (phase === 'draw' || phase === 'hold') {
      phase = 'fade';
      transitionAlpha = 1;
    }
  });

  canvas.__deckResize = function () {
    var was = running;
    stop();
    if (was) start();
  };

  new IntersectionObserver(function (entries) {
    entries[0].isIntersecting ? start() : stop();
  }, { threshold: 0.2 }).observe(slide);

  var rto;
  window.addEventListener('resize', function () {
    clearTimeout(rto);
    rto = setTimeout(function () {
      var was = running;
      stop();
      if (was) start();
    }, 150);
  });
}());
