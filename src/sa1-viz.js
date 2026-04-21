'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="sule-1"]');
  if (!slide) return;
  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.style.position = figure.style.position || 'relative';
  var canvas = document.createElement('canvas');
  canvas.id = 'sa1-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair;';
  figure.appendChild(canvas);

  var SR = '201,166,207';       // --accent-sule
  var FG = '218,225,232';
  var BG = '#080b10';

  var ctx, W, H, dpr, raf, frame = 0, running = false;

  // Branch pool. Each branch has parent, depth, start (fx,fy),
  // end (fx,fy), control-point sag, growT [0..1], alpha [0..1],
  // phase: 'grow' | 'live' | 'wither' | 'dead'.
  var branches = [];
  var MAX_DEPTH = 6;
  var cycleCooldown = 0; // frames until next wither/sprout event

  // Pointer highlight
  var cursor = { x: -9999, y: -9999, override: 0 };

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function seedTrunk() {
    branches.length = 0;
    var root = {
      id: 0,
      parent: -1,
      depth: 0,
      sx: 0.04, sy: 0.52,
      ex: 0.22, ey: 0.50 + rand(-0.015, 0.015),
      sag: rand(-0.02, 0.02),
      growT: 0,
      alpha: 1,
      phase: 'grow',
      spawned: false
    };
    branches.push(root);
  }

  function spawnChildren(parent) {
    if (parent.depth >= MAX_DEPTH) return;
    // 2 children at shallow depths (strong bifurcation),
    // 1–3 deeper to vary canopy density.
    var n;
    if (parent.depth < 2) n = 2;
    else n = 1 + ((Math.random() < 0.55) ? 1 : 0) + ((Math.random() < 0.2) ? 1 : 0);
    // angle from parent
    var pdx = parent.ex - parent.sx;
    var pdy = parent.ey - parent.sy;
    var pAng = Math.atan2(pdy, pdx);
    // length falls off with depth; slight randomness
    var baseLen = 0.22 * Math.pow(0.78, parent.depth) * rand(0.9, 1.12);
    for (var i = 0; i < n; i++) {
      // fan split centered on parent angle
      var spread = (n === 1) ? rand(-0.35, 0.35)
                              : (i - (n - 1) / 2) * rand(0.55, 0.85) + rand(-0.12, 0.12);
      var ang = pAng + spread;
      // bias forward — keep canopy drifting right
      if (Math.cos(ang) < 0.12) ang = pAng * 0.4 + rand(-0.3, 0.3);
      var len = baseLen * rand(0.85, 1.15);
      var ex = parent.ex + Math.cos(ang) * len;
      var ey = parent.ey + Math.sin(ang) * len;
      // clip stray leaves inside the canvas
      ex = Math.max(0.03, Math.min(0.985, ex));
      ey = Math.max(0.06, Math.min(0.94, ey));
      branches.push({
        id: branches.length,
        parent: parent.id,
        depth: parent.depth + 1,
        sx: parent.ex, sy: parent.ey,
        ex: ex, ey: ey,
        sag: rand(-0.035, 0.035),
        growT: 0,
        alpha: 1,
        phase: 'grow',
        spawned: false
      });
    }
    parent.spawned = true;
  }

  function stepGrowth() {
    for (var i = 0; i < branches.length; i++) {
      var b = branches[i];
      if (b.phase === 'grow') {
        b.growT += 0.018 + (MAX_DEPTH - b.depth) * 0.004;
        if (b.growT >= 1) {
          b.growT = 1;
          b.phase = 'live';
        }
      } else if (b.phase === 'wither') {
        b.alpha -= 0.014;
        if (b.alpha <= 0) { b.alpha = 0; b.phase = 'dead'; }
      }
      // spawn children once a branch is ~70% grown
      if (!b.spawned && b.growT > 0.72 && b.depth < MAX_DEPTH) {
        spawnChildren(b);
      }
    }
  }

  function leafBranches() {
    // A branch is a "leaf" if it's live and has no live/growing children.
    var childMap = {};
    for (var i = 0; i < branches.length; i++) {
      var p = branches[i].parent;
      if (p < 0) continue;
      if (!childMap[p]) childMap[p] = 0;
      if (branches[i].phase !== 'dead') childMap[p]++;
    }
    var out = [];
    for (var j = 0; j < branches.length; j++) {
      var b = branches[j];
      if (b.phase !== 'live') continue;
      if (!childMap[b.id]) out.push(b);
    }
    return out;
  }

  function cycleContingency() {
    if (cycleCooldown > 0) { cycleCooldown--; return; }
    var leaves = leafBranches();
    if (leaves.length < 3) return;
    // wither one
    var victim = pick(leaves);
    if (victim.depth < 2) return; // don't wither the trunk
    victim.phase = 'wither';
    // walk descendants and wither them too
    var q = [victim.id];
    while (q.length) {
      var id = q.shift();
      for (var k = 0; k < branches.length; k++) {
        if (branches[k].parent === id && branches[k].phase !== 'dead') {
          branches[k].phase = 'wither';
          q.push(branches[k].id);
        }
      }
    }
    // sprout a replacement from the victim's parent (if it exists and is live)
    var parent = branches[victim.parent];
    if (parent && parent.phase === 'live' && parent.depth < MAX_DEPTH) {
      var pAng = Math.atan2(parent.ey - parent.sy, parent.ex - parent.sx);
      var ang = pAng + rand(-0.85, 0.85);
      if (Math.cos(ang) < 0.1) ang += rand(0.3, 0.6);
      var len = 0.22 * Math.pow(0.78, parent.depth) * rand(0.95, 1.15);
      var ex = Math.max(0.03, Math.min(0.985, parent.ex + Math.cos(ang) * len));
      var ey = Math.max(0.06, Math.min(0.94, parent.ey + Math.sin(ang) * len));
      branches.push({
        id: branches.length,
        parent: parent.id,
        depth: parent.depth + 1,
        sx: parent.ex, sy: parent.ey,
        ex: ex, ey: ey,
        sag: rand(-0.035, 0.035),
        growT: 0,
        alpha: 1,
        phase: 'grow',
        spawned: false
      });
    }
    cycleCooldown = (180 + (Math.random() * 120) | 0);
  }

  function reset() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width  = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    seedTrunk();
    cycleCooldown = 220;
    frame = 0;
    return true;
  }

  function drawBackground() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    // dotted ground — very faint horizontal drift of dots near center-bottom
    ctx.fillStyle = 'rgba(' + FG + ',0.08)';
    var rows = 3;
    for (var r = 0; r < rows; r++) {
      var y = H * (0.78 + r * 0.055);
      var step = 14 + r * 4;
      for (var x = (frame * 0.2) % step; x < W; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // horizon hairline
    ctx.strokeStyle = 'rgba(' + FG + ',0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.52);
    ctx.lineTo(W, H * 0.52);
    ctx.stroke();
  }

  function branchGeom(b) {
    var x1 = b.sx * W, y1 = b.sy * H;
    var x2e = b.ex * W, y2e = b.ey * H;
    // current grown endpoint
    var x2 = x1 + (x2e - x1) * b.growT;
    var y2 = y1 + (y2e - y1) * b.growT;
    // perpendicular sag for hand-drawn curvature
    var midX = (x1 + x2) / 2;
    var midY = (y1 + y2) / 2;
    var dx = x2 - x1, dy = y2 - y1;
    var L = Math.sqrt(dx * dx + dy * dy) || 1;
    var perpX = -dy / L, perpY = dx / L;
    var sagPx = b.sag * Math.min(W, H);
    var cx = midX + perpX * sagPx;
    var cy = midY + perpY * sagPx;
    return { x1: x1, y1: y1, x2: x2, y2: y2, cx: cx, cy: cy };
  }

  function drawGhostLayer() {
    // offset duplicate — echoes of paths not taken
    ctx.save();
    ctx.translate(4, 3);
    for (var i = 0; i < branches.length; i++) {
      var b = branches[i];
      if (b.phase === 'dead') continue;
      var g = branchGeom(b);
      var width = Math.max(0.4, 2.0 - b.depth * 0.28);
      ctx.strokeStyle = 'rgba(' + FG + ',' + (0.05 * b.alpha) + ')';
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(g.x1, g.y1);
      ctx.quadraticCurveTo(g.cx, g.cy, g.x2, g.y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function nearestLeaf() {
    if (cursor.override <= 0) return null;
    var leaves = leafBranches();
    var best = null, bestD = Infinity;
    for (var i = 0; i < leaves.length; i++) {
      var b = leaves[i];
      var g = branchGeom(b);
      var dx = g.x2 - cursor.x, dy = g.y2 - cursor.y;
      var d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = b; }
    }
    if (bestD > 140 * 140) return null;
    return best;
  }

  function drawBranches() {
    var hl = nearestLeaf();
    for (var i = 0; i < branches.length; i++) {
      var b = branches[i];
      if (b.phase === 'dead') continue;
      var g = branchGeom(b);
      // width tapers with depth; inflates slightly during growth for an ink-loaded feel
      var base = Math.max(0.75, 2.6 - b.depth * 0.33);
      var growPulse = (b.phase === 'grow') ? (1 + (1 - b.growT) * 0.35) : 1;
      var width = base * growPulse;

      var alpha = 0.58 * b.alpha;
      if (b.depth === 0) alpha = 0.85 * b.alpha;
      else if (b.depth === 1) alpha = 0.72 * b.alpha;

      // highlight the path from highlighted leaf back to root
      var onPath = false;
      if (hl) {
        var cur = hl;
        while (cur) {
          if (cur.id === b.id) { onPath = true; break; }
          if (cur.parent < 0) break;
          cur = branches[cur.parent];
        }
      }
      if (onPath) alpha = Math.min(1, alpha + 0.25);

      ctx.strokeStyle = 'rgba(' + SR + ',' + alpha + ')';
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(g.x1, g.y1);
      ctx.quadraticCurveTo(g.cx, g.cy, g.x2, g.y2);
      ctx.stroke();

      // terminal glyphs at fully-grown leaf tips
      if (b.phase === 'live' && b.growT >= 1) {
        // treat as leaf only if no live children — crude check
        var hasChild = false;
        for (var k = 0; k < branches.length; k++) {
          if (branches[k].parent === b.id && branches[k].phase !== 'dead') { hasChild = true; break; }
        }
        if (!hasChild) {
          // hollow ring
          ctx.strokeStyle = 'rgba(' + FG + ',' + (0.55 * b.alpha) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(g.x2, g.y2, 3.2, 0, Math.PI * 2);
          ctx.stroke();
          // accent dot
          ctx.fillStyle = 'rgba(' + SR + ',' + (0.92 * b.alpha) + ')';
          ctx.beginPath();
          ctx.arc(g.x2, g.y2, 1.5, 0, Math.PI * 2);
          ctx.fill();
          // faint tick stand-in for an unread label on ~1/3 of leaves
          if ((b.id % 3) === 0) {
            ctx.strokeStyle = 'rgba(' + FG + ',' + (0.28 * b.alpha) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(g.x2 + 6, g.y2);
            ctx.lineTo(g.x2 + 18, g.y2);
            ctx.stroke();
          }
        }
      }
    }
  }

  function drawCaption() {
    // Tiny annotation near the root — a sumi-style mark, no text.
    // Horizontal tick + ring to signal "present / point of divergence".
    var x = 0.04 * W, y = 0.52 * H;
    ctx.strokeStyle = 'rgba(' + FG + ',0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - 16, y);
    ctx.lineTo(x - 4, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x - 20, y, 2.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  function draw() {
    if (!ctx || !W || !H) return;
    stepGrowth();
    cycleContingency();
    if (cursor.override > 0) cursor.override--;
    drawBackground();
    drawGhostLayer();
    drawBranches();
    drawCaption();
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
    cursor.x = e.clientX - r.left;
    cursor.y = e.clientY - r.top;
    cursor.override = 180;
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
