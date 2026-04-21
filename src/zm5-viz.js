'use strict';
(function () {
  var canvas = document.getElementById('zm5-canvas');
  if (!canvas) return;

  var HR = '232,200,159';   // amber accent
  var FG = '218,225,232';   // foreground
  var MR = '125,211,184';   // teal (model)
  var BG = '#080b10';

  var ctx, W, H, dpr, raf, frame = 0, running = false;

  // 12s cycle at 60fps ≈ 720 frames. Phases:
  //  0–240 sealed   (consumer chat surface)
  //  240–360 fracture (crack propagates, structure ghosts in behind)
  //  360–600 reveal  (surface dissolves, cards exposed)
  //  600–720 reseal  (surface re-forms)
  var CYCLE = 720;

  // Streaming token chips for the TOKEN STREAM card.
  var STREAM_TOKENS = [
    'The', ' student', ' opens', ' the', ' door', ' and', ' steps',
    ' inside', ' the', ' classroom', '.', ' The', ' lights', ' are'
  ];

  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  function reset() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    if (!W || !H) return false;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return true;
  }

  // ---------- BACKGROUND CARDS (the "infrastructure" beneath the surface) ----------

  function cardLayout() {
    var pad = Math.max(16, W * 0.05);
    var x = pad, y = pad;
    var w = W - pad * 2;
    var h = H - pad * 2;
    var gap = Math.max(10, h * 0.025);
    // four stacked rows
    var rowH = (h - gap * 3) / 4;
    return {
      pad: pad, gap: gap, x: x, y: y, w: w, h: h, rowH: rowH,
      rows: [
        { y: y + (rowH + gap) * 0, label: 'SYSTEM PROMPT' },
        { y: y + (rowH + gap) * 1, label: 'API REQUEST' },
        { y: y + (rowH + gap) * 2, label: 'MODEL · WEIGHTS' },
        { y: y + (rowH + gap) * 3, label: 'TOKEN STREAM' }
      ]
    };
  }

  function drawCardShell(x, y, w, h, label, color, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    rrect(x, y, w, h, 7);
    ctx.strokeStyle = 'rgba(' + color + ',0.42)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + color + ',0.82)';
    ctx.fillText(label, x + 10, y + 16);
    ctx.restore();
  }

  function drawSystemPrompt(row, w, alpha) {
    drawCardShell(row.x, row.y, w, row.h, 'SYSTEM PROMPT', HR, alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '12px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + FG + ',0.78)';
    var lines = [
      'You are a Spanish conversation partner for a heritage learner.',
      'Reply in short sentences. Ask one follow-up question.'
    ];
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], row.x + 12, row.y + 36 + i * 16);
    }
    ctx.restore();
  }

  function drawApiRequest(row, w, alpha, f) {
    drawCardShell(row.x, row.y, w, row.h, 'API REQUEST', HR, alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '12px "IBM Plex Mono", monospace';
    var lines = [
      ['POST ', 'https://api.openai.com/v1/chat/completions'],
      ['  model: ', '"gpt-4o-mini"'],
      ['  temperature: ', '0.7'],
      ['  messages: ', '[ {role:"system",…}, {role:"user",…} ]']
    ];
    for (var i = 0; i < lines.length; i++) {
      var ly = row.y + 34 + i * 15;
      ctx.fillStyle = 'rgba(' + HR + ',0.65)';
      ctx.fillText(lines[i][0], row.x + 12, ly);
      var kw = ctx.measureText(lines[i][0]).width;
      ctx.fillStyle = 'rgba(' + FG + ',0.82)';
      ctx.fillText(lines[i][1], row.x + 12 + kw, ly);
    }
    // pulse a small "indicator" dot
    var p = 0.4 + 0.4 * Math.abs(Math.sin(f * 0.06));
    ctx.fillStyle = 'rgba(' + HR + ',' + p + ')';
    ctx.beginPath();
    ctx.arc(row.x + w - 16, row.y + 16, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawModelWeights(row, w, alpha, f) {
    drawCardShell(row.x, row.y, w, row.h, 'MODEL · WEIGHTS', MR, alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    // Tiny abstracted lattice — three columns, four rows of nodes
    var cols = 4, rows = 3;
    var lx = row.x + 14;
    var ly = row.y + 30;
    var lw = w - 28;
    var lh = row.h - 40;
    var nodes = [];
    for (var c = 0; c < cols; c++) {
      var col = [];
      for (var r = 0; r < rows; r++) {
        col.push({
          x: lx + (lw / (cols - 1)) * c,
          y: ly + (lh / (rows - 1)) * r
        });
      }
      nodes.push(col);
    }
    // edges
    for (var c2 = 0; c2 < cols - 1; c2++) {
      for (var s = 0; s < rows; s++) {
        for (var d = 0; d < rows; d++) {
          var pulse = Math.sin(f * 0.05 + (c2 + s + d) * 0.7) * 0.5 + 0.5;
          ctx.strokeStyle = 'rgba(' + MR + ',' + (0.05 + pulse * 0.10) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[c2][s].x, nodes[c2][s].y);
          ctx.lineTo(nodes[c2 + 1][d].x, nodes[c2 + 1][d].y);
          ctx.stroke();
        }
      }
    }
    // nodes
    for (var c3 = 0; c3 < cols; c3++) {
      for (var r3 = 0; r3 < rows; r3++) {
        var n = nodes[c3][r3];
        var pp = Math.sin(f * 0.04 + c3 * 1.1 + r3 * 0.7) * 0.5 + 0.5;
        ctx.fillStyle = 'rgba(' + MR + ',' + (0.45 + pp * 0.45) + ')';
        ctx.beginPath();
        ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawTokenStream(row, w, alpha, f) {
    drawCardShell(row.x, row.y, w, row.h, 'TOKEN STREAM', HR, alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    // chips streaming right→left
    var chipPad = 8;
    var chipH = Math.max(20, row.h * 0.42);
    var chipY = row.y + (row.h - chipH) * 0.62;
    ctx.font = '12px "IBM Plex Mono", monospace';
    var x = row.x + w - 12 + ((f * 0.6) % 80);
    var leftBound = row.x + 12;
    var i = 0;
    while (x > leftBound - 80) {
      var tok = STREAM_TOKENS[(i + Math.floor(f / 80)) % STREAM_TOKENS.length];
      var tw = ctx.measureText(tok).width + chipPad * 2;
      x -= tw + 4;
      if (x + tw < leftBound) break;
      // clip chips to card interior
      ctx.save();
      rrect(row.x + 8, row.y + 22, w - 16, row.h - 28, 4);
      ctx.clip();
      rrect(x, chipY, tw, chipH, 4);
      ctx.fillStyle = 'rgba(' + HR + ',0.10)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + HR + ',0.40)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(' + FG + ',0.88)';
      ctx.fillText(tok, x + chipPad, chipY + chipH * 0.66);
      ctx.restore();
      i++;
      if (i > 40) break;
    }
    ctx.restore();
  }

  function drawInfraStack(layout, alpha, f) {
    var rows = layout.rows;
    for (var i = 0; i < rows.length; i++) {
      rows[i].x = layout.x;
      rows[i].h = layout.rowH;
    }
    drawSystemPrompt(rows[0], layout.w, alpha);
    drawApiRequest(rows[1], layout.w, alpha, f);
    drawModelWeights(rows[2], layout.w, alpha, f);
    drawTokenStream(rows[3], layout.w, alpha, f);
  }

  // ---------- FOREGROUND SURFACE (consumer chat) ----------

  function drawConsumerSurface(alpha, fractureAmt, f) {
    if (alpha <= 0.001) return;
    var pad = Math.max(28, W * 0.07);
    var sx = pad, sy = pad;
    var sw = W - pad * 2;
    var sh = H - pad * 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    // Surface fill — opaque card so it actually hides what's behind.
    rrect(sx, sy, sw, sh, 14);
    ctx.fillStyle = '#0e131b';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + FG + ',0.28)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    // Header strip
    ctx.save();
    rrect(sx, sy, sw, 30, 14);
    ctx.clip();
    ctx.fillStyle = 'rgba(' + FG + ',0.05)';
    ctx.fillRect(sx, sy, sw, 30);
    ctx.restore();
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + FG + ',0.55)';
    ctx.fillText('OPENAI  ·  CHATGPT', sx + 14, sy + 19);
    // window dots
    ['#5a6271', '#5a6271', '#5a6271'].forEach(function (c, i) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(sx + sw - 16 - i * 14, sy + 15, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Two stacked chat bubbles
    var bubbleY = sy + 56;
    var bubbleH = (sh - 96) * 0.42;
    var bubbleGap = (sh - 96) * 0.10;

    // user bubble (right-aligned)
    var ubW = sw * 0.55;
    var ubX = sx + sw - ubW - 22;
    rrect(ubX, bubbleY, ubW, bubbleH, 12);
    ctx.fillStyle = 'rgba(' + HR + ',0.10)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + HR + ',0.32)';
    ctx.lineWidth = 1;
    ctx.stroke();
    [0.78, 0.62].forEach(function (frac, i) {
      ctx.fillStyle = 'rgba(' + FG + ',0.55)';
      ctx.fillRect(ubX + 14, bubbleY + 18 + i * 14, (ubW - 28) * frac, 5);
    });

    // assistant bubble (left-aligned)
    var abY = bubbleY + bubbleH + bubbleGap;
    var abW = sw * 0.66;
    rrect(sx + 22, abY, abW, bubbleH, 12);
    ctx.fillStyle = 'rgba(' + FG + ',0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + FG + ',0.22)';
    ctx.stroke();
    // assistant text-bars fill left-to-right with frame
    var lineFracs = [0.92, 0.78, 0.84, 0.55];
    var totalF = lineFracs.length * 22 + 30;
    var sf = (frame % totalF);
    var lineIdx = Math.min(Math.floor(sf / 22), lineFracs.length);
    var linePct = (sf % 22) / 22;
    for (var i2 = 0; i2 < lineFracs.length; i2++) {
      var maxLineW = (abW - 28) * lineFracs[i2];
      var drawn = i2 < lineIdx ? maxLineW : (i2 === lineIdx ? maxLineW * linePct : 0);
      if (drawn > 0) {
        ctx.fillStyle = 'rgba(' + FG + ',0.70)';
        ctx.fillRect(sx + 22 + 14, abY + 18 + i2 * 14, drawn, 5);
      }
    }

    // Composer pill
    var cpY = sy + sh - 42;
    rrect(sx + 22, cpY, sw - 44, 28, 14);
    ctx.fillStyle = 'rgba(' + FG + ',0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + FG + ',0.20)';
    ctx.stroke();
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + FG + ',0.40)';
    ctx.fillText('Send a message…', sx + 38, cpY + 18);

    ctx.restore();

    // FRACTURE — hairline cracks across the surface
    if (fractureAmt > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, fractureAmt) * alpha;
      ctx.strokeStyle = 'rgba(' + HR + ',0.85)';
      ctx.lineWidth = 1;
      // primary jagged crack
      var cracks = [
        [[sx + sw * 0.10, sy + sh * 0.18],
         [sx + sw * 0.32, sy + sh * 0.26],
         [sx + sw * 0.41, sy + sh * 0.48],
         [sx + sw * 0.58, sy + sh * 0.55],
         [sx + sw * 0.70, sy + sh * 0.78],
         [sx + sw * 0.88, sy + sh * 0.86]],
        [[sx + sw * 0.41, sy + sh * 0.48],
         [sx + sw * 0.30, sy + sh * 0.62],
         [sx + sw * 0.20, sy + sh * 0.74]],
        [[sx + sw * 0.58, sy + sh * 0.55],
         [sx + sw * 0.66, sy + sh * 0.40],
         [sx + sw * 0.80, sy + sh * 0.30]]
      ];
      cracks.forEach(function (path) {
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        for (var k = 1; k < path.length; k++) ctx.lineTo(path[k][0], path[k][1]);
        ctx.stroke();
      });
      // tiny shards at intersections
      ctx.fillStyle = 'rgba(' + HR + ',0.7)';
      [
        [sx + sw * 0.41, sy + sh * 0.48],
        [sx + sw * 0.58, sy + sh * 0.55]
      ].forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 2.4, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
  }

  // ---------- PHASE LABEL ----------

  function drawPhaseLabel(text, alpha) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    ctx.letterSpacing = '2px';
    var w = ctx.measureText(text).width;
    var x = W - w - 18;
    var y = H - 14;
    ctx.fillStyle = BG;
    ctx.fillRect(x - 8, y - 12, w + 16, 18);
    ctx.fillStyle = 'rgba(' + HR + ',0.78)';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // ---------- DRAW ----------

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function draw() {
    if (!ctx || !W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    var t = frame % CYCLE;

    // Surface alpha (opacity of consumer chat skin)
    var surfaceAlpha = 1;
    var fracture = 0;
    var infraAlpha = 0;
    var phaseLabel = '';
    var phaseLabelAlpha = 0;

    if (t < 240) {
      // sealed
      surfaceAlpha = 1;
      fracture = 0;
      infraAlpha = 0;
      phaseLabel = 'CONSUMER SURFACE';
      phaseLabelAlpha = t < 30 ? t / 30 : (t > 200 ? (240 - t) / 40 : 1);
    } else if (t < 360) {
      // fracture
      var ft = (t - 240) / 120;
      surfaceAlpha = 1 - easeInOut(ft) * 0.15;
      fracture = easeInOut(ft);
      infraAlpha = easeInOut(ft) * 0.18;
      phaseLabel = 'BREAKDOWN';
      phaseLabelAlpha = ft < 0.2 ? ft / 0.2 : 1;
    } else if (t < 600) {
      // reveal
      var rt = (t - 360) / 240;
      surfaceAlpha = (1 - easeInOut(Math.min(1, rt * 1.4))) * 0.85;
      fracture = (1 - rt) * 0.5;
      infraAlpha = 0.18 + easeInOut(Math.min(1, rt * 1.4)) * 0.82;
      phaseLabel = 'INFRASTRUCTURE';
      phaseLabelAlpha = rt < 0.15 ? rt / 0.15 : (rt > 0.85 ? (1 - rt) / 0.15 : 1);
    } else {
      // reseal
      var st = (t - 600) / 120;
      surfaceAlpha = easeInOut(st);
      fracture = (1 - st) * 0.3;
      infraAlpha = (1 - easeInOut(st)) * 1.0;
      phaseLabel = '';
      phaseLabelAlpha = 0;
    }

    // Always draw infra in background (alpha controls visibility)
    var layout = cardLayout();
    drawInfraStack(layout, infraAlpha, frame);

    // Surface skin on top
    drawConsumerSurface(surfaceAlpha, fracture, frame);

    // Phase label bottom-right
    drawPhaseLabel(phaseLabel, phaseLabelAlpha);

    frame++;
  }

  function loop() { if (!running) return; draw(); raf = requestAnimationFrame(loop); }

  function start() {
    if (running) return;
    if (!reset()) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  canvas.__deckResize = function () {
    var was = running; stop();
    if (was) start();
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
