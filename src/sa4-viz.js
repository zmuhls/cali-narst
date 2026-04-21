'use strict';
// Thomas cyclically symmetric attractor — port of gallery/thomas.html
// (creative-clawing). Adapted to the deck harness: IntersectionObserver
// start/stop, DPR sizing, pointer-scoped interaction, no window listeners
// that survive teardown.
//
//   dx/dt = sin(y) − b·x
//   dy/dt = sin(z) − b·y
//   dz/dt = sin(x) − b·z
//
// Integrated with RK4 at dt = 0.06. Parameter b sweeps through presets on
// tap; drag rotates the view and pauses autorotate briefly.
(function () {
  var slide = document.querySelector('section[data-slide="sule-4"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.style.position = figure.style.position || 'relative';

  var canvas = document.createElement('canvas');
  canvas.id = 'sa4-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none;';
  figure.appendChild(canvas);

  var info = document.createElement('div');
  info.className = 'sa4-info';
  info.style.cssText = [
    'position:absolute',
    'left:14px',
    'bottom:12px',
    'padding:4px 9px',
    'border-radius:6px',
    'background:rgba(0,0,0,0.42)',
    'color:rgba(120,184,224,0.88)',
    'font:11px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace',
    'letter-spacing:0.04em',
    'pointer-events:none',
    'backdrop-filter:blur(4px)',
    '-webkit-backdrop-filter:blur(4px)'
  ].join(';');
  figure.appendChild(info);

  var hint = document.createElement('div');
  hint.className = 'sa4-hint';
  hint.style.cssText = [
    'position:absolute',
    'right:14px',
    'bottom:12px',
    'color:rgba(120,184,224,0.45)',
    'font:10.5px/1 ui-monospace,SFMono-Regular,Menlo,monospace',
    'letter-spacing:0.06em',
    'pointer-events:none'
  ].join(';');
  hint.textContent = 'drag · tap to cycle';
  figure.appendChild(hint);

  var ctx, W, H, dpr, raf, running = false;

  var PRESETS = [
    { b: 0.19,  label: 'classic' },
    { b: 0.208, label: 'edge'    },
    { b: 0.16,  label: 'wild'    },
    { b: 0.32,  label: 'sparse'  },
    { b: 0.10,  label: 'dense'   }
  ];
  var presetIdx = 0;
  var pb = PRESETS[0].b;
  var dt = 0.06;

  var MAX_POINTS = 80000;
  var points = [];
  var x = 0.1, y = 0, z = -0.1;

  var rotY = 0, rotX = -0.25;
  var autoRotate = true;
  var manualPauseFrames = 0;

  var AUTO_CYCLE_FRAMES = 60 * 18; // ~18 s at 60 fps
  var cycleCountdown = AUTO_CYCLE_FRAMES;

  var dragging = false;
  var pointerId = null;
  var lastMX = 0, lastMY = 0;
  var downX = 0, downY = 0;
  var didDrag = false;

  function updateInfo() {
    info.textContent = 'Thomas · b=' + pb.toFixed(3) + ' · ' + PRESETS[presetIdx].label;
  }

  function resetState() {
    x = 0.1; y = 0; z = -0.1;
    points = [];
  }

  function rk4Step() {
    function f(px, py, pz) {
      return [Math.sin(py) - pb * px, Math.sin(pz) - pb * py, Math.sin(px) - pb * pz];
    }
    var k1 = f(x, y, z);
    var k2 = f(x + dt / 2 * k1[0], y + dt / 2 * k1[1], z + dt / 2 * k1[2]);
    var k3 = f(x + dt / 2 * k2[0], y + dt / 2 * k2[1], z + dt / 2 * k2[2]);
    var k4 = f(x + dt * k3[0], y + dt * k3[1], z + dt * k3[2]);
    x += dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    y += dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    z += dt / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    if (!isFinite(x) || !isFinite(y) || !isFinite(z) ||
        Math.abs(x) > 200 || Math.abs(y) > 200 || Math.abs(z) > 200) {
      resetState();
    }
  }

  function project(px, py, pz) {
    var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
    var rx = px * cosY - pz * sinY;
    var rz = px * sinY + pz * cosY;
    var cosX = Math.cos(rotX), sinX = Math.sin(rotX);
    var ry = py * cosX - rz * sinX;
    rz = py * sinX + rz * cosX;
    var scale = Math.min(W, H) / 20;
    return { sx: W / 2 + rx * scale, sy: H / 2 + ry * scale, depth: rz };
  }

  function draw() {
    var STEPS_PER_FRAME = 120;
    for (var s = 0; s < STEPS_PER_FRAME; s++) {
      rk4Step();
      points.push([x, y, z]);
      if (points.length > MAX_POINTS) points.shift();
    }

    if (autoRotate && manualPauseFrames <= 0) rotY += 0.003;
    if (manualPauseFrames > 0) manualPauseFrames--;

    ctx.fillStyle = 'rgba(3,5,8,0.18)';
    ctx.fillRect(0, 0, W, H);

    if (points.length < 2) return;

    var n = points.length;
    var stride = Math.max(1, Math.floor(n / 4000));

    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';

    var prev = null;
    for (var i = 0; i < n; i += stride) {
      var p = points[i];
      var proj = project(p[0], p[1], p[2]);
      var age = i / n;
      var depth = (proj.depth + 10) / 20;
      var d = Math.max(0, Math.min(1, depth));
      var brightness = 0.3 + age * 0.7;
      var cr = Math.floor(20 + d * 30 * brightness);
      var cg = Math.floor(120 + d * 80 * brightness);
      var cb = Math.floor(160 + d * 80 * brightness);
      var alpha = 0.15 + age * 0.65;
      if (prev && i > 0) {
        ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + alpha + ')';
        ctx.beginPath();
        ctx.moveTo(prev.sx, prev.sy);
        ctx.lineTo(proj.sx, proj.sy);
        ctx.stroke();
      }
      prev = proj;
    }
  }

  function cyclePreset() {
    presetIdx = (presetIdx + 1) % PRESETS.length;
    pb = PRESETS[presetIdx].b;
    resetState();
    cycleCountdown = AUTO_CYCLE_FRAMES;
    updateInfo();
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#030508';
    ctx.fillRect(0, 0, W, H);
    return true;
  }

  function tick() {
    if (!running) return;
    draw();
    if (--cycleCountdown <= 0) cyclePreset();
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    if (!resize()) return;
    updateInfo();
    running = true;
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  canvas.addEventListener('pointerdown', function (e) {
    dragging = true;
    didDrag = false;
    pointerId = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    lastMX = e.clientX; lastMY = e.clientY;
    downX = e.clientX; downY = e.clientY;
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!dragging || e.pointerId !== pointerId) return;
    var mx = e.clientX - lastMX;
    var my = e.clientY - lastMY;
    if (!didDrag) {
      var totX = e.clientX - downX;
      var totY = e.clientY - downY;
      if (totX * totX + totY * totY > 25) didDrag = true;
    }
    if (didDrag) {
      rotY += mx * 0.005;
      rotX += my * 0.005;
      manualPauseFrames = 240; // ~4 s before autorotate resumes
    }
    lastMX = e.clientX; lastMY = e.clientY;
  });

  function endPointer(e) {
    if (e.pointerId !== pointerId) return;
    var wasDrag = didDrag;
    dragging = false;
    pointerId = null;
    canvas.style.cursor = 'grab';
    if (!wasDrag) cyclePreset();
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

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
