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

  var ctx, W, H, dpr, raf, frame = 0, running = false;

  // Embedding points in 2D projection of a higher-dim space.
  // Stored as fractional coords; each has an implicit high-dim identity
  // encoded in "embed" (8D vector) used to compute neighbor distances.
  var points = [];
  var POINT_COUNT = 160;

  // 5 hotspots the magnifier tours — each a specific point index chosen
  // to expose a distinct topology: dense cluster, sparse outlier, bridge, etc.
  var hotspots = [];
  var tourIdx = 0;
  var tourT = 0;
  var TOUR_HOLD = 120;    // frames paused on a hotspot
  var TOUR_TRAVEL = 90;   // frames to travel between hotspots
  var tourPhase = 'hold'; // 'hold' | 'travel'
  var fromLens = { x: 0, y: 0 };
  var toLens = { x: 0, y: 0 };

  var lens = { x: 0, y: 0, r: 110, cursorOverride: 0 /* frames remaining */ };

  function seed() {
    points = [];
    // Four cluster centers + scattered outliers
    var clusters = [
      { fx: 0.25, fy: 0.32, n: 40, sig: 0.06, sigDim: 0.25 },
      { fx: 0.70, fy: 0.28, n: 35, sig: 0.07, sigDim: 0.35 },
      { fx: 0.55, fy: 0.70, n: 45, sig: 0.05, sigDim: 0.20 },
      { fx: 0.82, fy: 0.75, n: 25, sig: 0.08, sigDim: 0.40 }
    ];
    function gauss() { // box-muller
      var u = 1 - Math.random(), v = 1 - Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }
    for (var c = 0; c < clusters.length; c++) {
      var cl = clusters[c];
      var centerEmbed = [];
      for (var d = 0; d < 8; d++) centerEmbed.push(gauss());
      for (var i = 0; i < cl.n; i++) {
        var embed = [];
        for (var dd = 0; dd < 8; dd++) embed.push(centerEmbed[dd] + gauss() * cl.sigDim);
        points.push({
          fx:    cl.fx + gauss() * cl.sig,
          fy:    cl.fy + gauss() * cl.sig,
          embed: embed,
          cluster: c,
          r: 1.0 + Math.random() * 0.5,
          intensity: 0.3 + Math.random() * 0.5
        });
      }
    }
    // Outliers
    for (var o = 0; o < POINT_COUNT - points.length; o++) {
      var oe = [];
      for (var de = 0; de < 8; de++) oe.push(gauss() * 1.8);
      points.push({
        fx: 0.1 + Math.random() * 0.8,
        fy: 0.1 + Math.random() * 0.8,
        embed: oe,
        cluster: -1,
        r: 0.8 + Math.random() * 0.4,
        intensity: 0.18 + Math.random() * 0.22
      });
    }
    // Hotspots: pick one representative point per topology
    hotspots = [];
    // Dense pocket → random point in cluster 2 (largest)
    hotspots.push(pickFromCluster(2));
    // Cluster boundary → cluster 0
    hotspots.push(pickFromCluster(0, true));
    // Bridge (between 1 and 3): pick an outlier midway
    hotspots.push(pickBridge(1, 3));
    // Sparse outlier
    hotspots.push(pickOutlier());
    // Another dense cluster center
    hotspots.push(pickFromCluster(1));
  }

  function pickFromCluster(cIdx, atBoundary) {
    var members = points.filter(function (p) { return p.cluster === cIdx; });
    if (!members.length) return points[0];
    if (atBoundary) {
      members.sort(function (a, b) {
        var cx = 0, cy = 0;
        for (var k = 0; k < members.length; k++) { cx += members[k].fx; cy += members[k].fy; }
        cx /= members.length; cy /= members.length;
        var da = (a.fx - cx) * (a.fx - cx) + (a.fy - cy) * (a.fy - cy);
        var db = (b.fx - cx) * (b.fx - cx) + (b.fy - cy) * (b.fy - cy);
        return db - da; // farther first → boundary
      });
    }
    return members[0];
  }
  function pickBridge(a, b) {
    var outliers = points.filter(function (p) { return p.cluster === -1; });
    var ca = centroid(a), cb = centroid(b);
    if (!outliers.length) return points[0];
    outliers.sort(function (p1, p2) {
      var d1 = Math.abs((p1.fx - (ca.x + cb.x) / 2)) + Math.abs((p1.fy - (ca.y + cb.y) / 2));
      var d2 = Math.abs((p2.fx - (ca.x + cb.x) / 2)) + Math.abs((p2.fy - (ca.y + cb.y) / 2));
      return d1 - d2;
    });
    return outliers[0];
  }
  function pickOutlier() {
    var outliers = points.filter(function (p) { return p.cluster === -1; });
    if (!outliers.length) return points[0];
    return outliers[(Math.random() * outliers.length) | 0];
  }
  function centroid(cIdx) {
    var x = 0, y = 0, n = 0;
    for (var i = 0; i < points.length; i++) {
      if (points[i].cluster === cIdx) { x += points[i].fx; y += points[i].fy; n++; }
    }
    return { x: x / n, y: y / n };
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
    lens.r = Math.min(W, H) * 0.16;
    if (lens.r < 80) lens.r = 80;
    seed();
    lens.x = hotspots[0].fx * W;
    lens.y = hotspots[0].fy * H;
    fromLens.x = toLens.x = lens.x;
    fromLens.y = toLens.y = lens.y;
    tourPhase = 'hold';
    tourT = 0;
    tourIdx = 0;
    return true;
  }

  function stepTour() {
    if (lens.cursorOverride > 0) {
      lens.cursorOverride -= 1;
      return;
    }
    tourT += 1;
    if (tourPhase === 'hold') {
      if (tourT >= TOUR_HOLD) {
        tourPhase = 'travel';
        tourT = 0;
        tourIdx = (tourIdx + 1) % hotspots.length;
        fromLens.x = lens.x;
        fromLens.y = lens.y;
        toLens.x = hotspots[tourIdx].fx * W;
        toLens.y = hotspots[tourIdx].fy * H;
      }
    } else {
      // ease-in-out cubic
      var p = tourT / TOUR_TRAVEL;
      if (p >= 1) {
        lens.x = toLens.x;
        lens.y = toLens.y;
        tourPhase = 'hold';
        tourT = 0;
      } else {
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        lens.x = fromLens.x + (toLens.x - fromLens.x) * e;
        lens.y = fromLens.y + (toLens.y - fromLens.y) * e;
      }
    }
  }

  function distHighDim(p1, p2) {
    // cosine distance
    var dot = 0, n1 = 0, n2 = 0;
    for (var i = 0; i < p1.embed.length; i++) {
      dot += p1.embed[i] * p2.embed[i];
      n1 += p1.embed[i] * p1.embed[i];
      n2 += p2.embed[i] * p2.embed[i];
    }
    var denom = Math.sqrt(n1) * Math.sqrt(n2);
    if (denom === 0) return 1;
    return 1 - (dot / denom); // 0 identical → ~2 opposite
  }

  function findFocal() {
    // Nearest point to lens center (in screen space)
    var best = null, bestD = Infinity;
    for (var i = 0; i < points.length; i++) {
      var dx = points[i].fx * W - lens.x;
      var dy = points[i].fy * H - lens.y;
      var d2 = dx * dx + dy * dy;
      if (d2 < bestD) { bestD = d2; best = points[i]; }
    }
    return best;
  }

  function drawBackground() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    // Faint background dot-field: every point rendered small & low contrast
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      ctx.fillStyle = 'rgba(' + FG + ',' + p.intensity * 0.35 + ')';
      ctx.beginPath();
      ctx.arc(p.fx * W, p.fy * H, p.r * 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawLens() {
    var focal = findFocal();
    if (!focal) return;

    // Compute k nearest neighbors in high-dim
    var k = 6;
    var neigh = points
      .filter(function (p) { return p !== focal; })
      .map(function (p) { return { p: p, d: distHighDim(focal, p) }; })
      .sort(function (a, b) { return a.d - b.d; })
      .slice(0, k);

    // Clip to lens circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2);
    ctx.clip();

    // Dark wash inside lens
    ctx.fillStyle = 'rgba(8,11,16,0.72)';
    ctx.fillRect(lens.x - lens.r, lens.y - lens.r, lens.r * 2, lens.r * 2);

    // Faint backdrop: inherited dot-field dimmed further
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var dx = p.fx * W - lens.x;
      var dy = p.fy * H - lens.y;
      if (dx * dx + dy * dy > lens.r * lens.r) continue;
      ctx.fillStyle = 'rgba(' + FG + ',' + p.intensity * 0.25 + ')';
      ctx.beginPath();
      ctx.arc(p.fx * W, p.fy * H, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw neighbor spokes
    var fx = focal.fx * W, fy = focal.fy * H;
    var maxD = neigh[k - 1].d || 1;
    for (var j = 0; j < neigh.length; j++) {
      var n = neigh[j];
      // Orient spoke at a stable angle derived from p.embed[0], p.embed[1]
      var ang = Math.atan2(n.p.embed[1], n.p.embed[0]) + j * 0.02;
      var spokeLen = lens.r * 0.85 * (n.d / maxD);
      var nx = fx + Math.cos(ang) * spokeLen;
      var ny = fy + Math.sin(ang) * spokeLen;

      // Spoke line
      ctx.strokeStyle = 'rgba(' + SR + ',' + (0.45 + (1 - n.d / maxD) * 0.35) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Tick marks along the spoke (quarters)
      var tickCount = 4;
      for (var tk = 1; tk < tickCount; tk++) {
        var tx = fx + Math.cos(ang) * (spokeLen * tk / tickCount);
        var ty = fy + Math.sin(ang) * (spokeLen * tk / tickCount);
        var perpX = -Math.sin(ang), perpY = Math.cos(ang);
        ctx.beginPath();
        ctx.moveTo(tx + perpX * 3, ty + perpY * 3);
        ctx.lineTo(tx - perpX * 3, ty - perpY * 3);
        ctx.stroke();
      }

      // Neighbor point (hairline ring)
      ctx.strokeStyle = 'rgba(' + FG + ',0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(nx, ny, 3, 0, Math.PI * 2);
      ctx.stroke();
      // Tiny index tick at end
      ctx.fillStyle = 'rgba(' + SR + ',0.85)';
      ctx.beginPath();
      ctx.arc(nx, ny, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Focal point (solid filled)
    ctx.fillStyle = 'rgba(' + SR + ',0.95)';
    ctx.beginPath();
    ctx.arc(fx, fy, 4.5, 0, Math.PI * 2);
    ctx.fill();
    // Halo
    ctx.strokeStyle = 'rgba(' + SR + ',0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(fx, fy, 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Lens ring
    ctx.strokeStyle = 'rgba(' + SR + ',0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(' + SR + ',0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(lens.x, lens.y, lens.r - 5, 0, Math.PI * 2);
    ctx.stroke();
    // handle stub
    var ang2 = Math.PI * 0.25;
    ctx.beginPath();
    ctx.moveTo(lens.x + Math.cos(ang2) * lens.r, lens.y + Math.sin(ang2) * lens.r);
    ctx.lineTo(lens.x + Math.cos(ang2) * (lens.r + 22), lens.y + Math.sin(ang2) * (lens.r + 22));
    ctx.strokeStyle = 'rgba(' + SR + ',0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function draw() {
    if (!ctx || !W || !H) return;
    stepTour();
    drawBackground();
    drawLens();
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
    lens.cursorOverride = 180; // ~3 seconds at 60fps
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
