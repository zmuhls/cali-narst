'use strict';
(function () {
  var canvas = document.getElementById('zm5-canvas');
  if (!canvas) return;

  var HR = '232,200,159';   // amber accent
  var FG = '218,225,232';   // foreground
  var MR = '125,211,184';   // teal (model)
  var BG = '#080b10';

  var ctx, W, H, dpr, raf, frame = 0, running = false;

  // ── Timing ───────────────────────────────────────────────────────────
  // Contemplative cycle. Phases are intentionally long so viewers can
  // parse each infrastructure card and read tokens streaming in real time.
  // All phase lengths below are in frames (assume 60fps — seconds in
  // comments).
  var P_SEAL_END    = 540;   // 0–540    · sealed surface (9.0s)
  var P_CRACK_END   = 780;   // 540–780  · cracks propagate (4.0s)
  var P_SHATTER_END = 1140;  // 780–1140 · shards fall & settle (6.0s)
  var P_INFRA_END   = 2460;  // 1140–2460 · infrastructure visible (22.0s)
  var CYCLE         = 2700;  // 2460–2700 · reseal (4.0s) — total 45s

  // ── Real inference sequence ──────────────────────────────────────────
  // System prompt + user message + streamed response tokens, matched so
  // the cards narrate a single coherent inference call end-to-end.
  var SYSTEM_LINES = [
    'You are a helpful assistant.',
    'Keep answers to one sentence.'
  ];

  var USER_MESSAGE = 'What does temperature do?';

  // Rough BPE-style tokenization of the response — subword splits on
  // "sharpen"/"flatten" and punctuation attached to leading whitespace,
  // so the stream reads the way a real model emits tokens.
  var STREAM_TOKENS = [
    'Temperature', ' reshapes', ' the', ' next', '-token',
    ' distribution', '.', ' Lower', ' values', ' sharpen',
    ' the', ' peak', ';', ' higher', ' values', ' flatten',
    ' it', '.'
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

  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

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

  // ── Background cards (the "infrastructure" beneath the surface) ──────

  function cardLayout() {
    var pad = Math.max(16, W * 0.05);
    var x = pad, y = pad;
    var w = W - pad * 2;
    var h = H - pad * 2;
    var gap = Math.max(10, h * 0.025);
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
    for (var i = 0; i < SYSTEM_LINES.length; i++) {
      ctx.fillText(SYSTEM_LINES[i], row.x + 12, row.y + 36 + i * 16);
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
      ['  user: ', '"' + USER_MESSAGE + '"']
    ];
    for (var i = 0; i < lines.length; i++) {
      var ly = row.y + 34 + i * 15;
      ctx.fillStyle = 'rgba(' + HR + ',0.65)';
      ctx.fillText(lines[i][0], row.x + 12, ly);
      var kw = ctx.measureText(lines[i][0]).width;
      ctx.fillStyle = 'rgba(' + FG + ',0.82)';
      ctx.fillText(lines[i][1], row.x + 12 + kw, ly);
    }
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
    var cols = 4, rows = 3;
    var lx = row.x + 14;
    var ly = row.y + 30;
    var lw = w - 28;
    var lh = row.h - 40;
    var nodes = [];
    for (var c = 0; c < cols; c++) {
      var col = [];
      for (var r = 0; r < rows; r++) {
        col.push({ x: lx + (lw / (cols - 1)) * c, y: ly + (lh / (rows - 1)) * r });
      }
      nodes.push(col);
    }
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

  // Frames each token takes to fully emerge. At 60fps this is ~0.8s per
  // token, matching the cadence of a real streaming chat completion.
  var FRAMES_PER_TOKEN = 50;

  function drawTokenStream(row, w, alpha, f) {
    drawCardShell(row.x, row.y, w, row.h, 'TOKEN STREAM', HR, alpha);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '12px "IBM Plex Mono", monospace';

    var chipPad = 8;
    var chipGap = 4;
    var chipH = Math.max(20, row.h * 0.42);
    var chipY = row.y + (row.h - chipH) * 0.62;
    var leftBound = row.x + 12;
    var rightBound = row.x + w - 20;   // reserve space for cursor
    var available = rightBound - leftBound;

    // Which token is currently being sampled; how far along it is.
    var tokenIdx   = Math.floor(f / FRAMES_PER_TOKEN);
    var tokenFrac  = (f % FRAMES_PER_TOKEN) / FRAMES_PER_TOKEN;
    var easedFrac  = easeOut(tokenFrac);

    // Build tokens emitted so far (wrapping the array so the stream loops).
    var chips = [];
    for (var k = 0; k <= tokenIdx; k++) {
      var tok = STREAM_TOKENS[k % STREAM_TOKENS.length];
      var tw  = ctx.measureText(tok).width + chipPad * 2;
      chips.push({ tok: tok, w: tw, isCurrent: k === tokenIdx });
    }

    // Fit from newest backward: drop oldest tokens until the visible set
    // fits the card. newest chip counts as 0 width while it's emerging —
    // this gives the "cursor at end" feel before the chip fully materializes.
    var startIdx = 0;
    function totalWidth() {
      var total = 0;
      for (var j = startIdx; j < chips.length; j++) {
        var cw = chips[j].isCurrent ? chips[j].w * easedFrac : chips[j].w;
        total += cw + (j < chips.length - 1 ? chipGap : 0);
      }
      return total;
    }
    while (totalWidth() > available && startIdx < chips.length - 1) {
      startIdx++;
    }

    // Clip to the card body so overflow at the edges is clean.
    ctx.save();
    rrect(row.x + 8, row.y + 22, w - 16, row.h - 28, 4);
    ctx.clip();

    var x = leftBound;
    for (var j2 = startIdx; j2 < chips.length; j2++) {
      var c = chips[j2];
      var cw = c.isCurrent ? c.w * easedFrac : c.w;
      if (cw < 2) break;

      // Chip body
      rrect(x, chipY, cw, chipH, 4);
      var bodyA = c.isCurrent ? 0.06 + 0.12 * easedFrac : 0.12;
      ctx.fillStyle = 'rgba(' + HR + ',' + bodyA + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(' + HR + ',' + (c.isCurrent ? 0.30 + 0.30 * easedFrac : 0.45) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Token glyph — for the current chip only, clip the text to the
      // partial chip width so the character reveals left-to-right.
      if (c.isCurrent) {
        ctx.save();
        rrect(x, chipY, cw, chipH, 4);
        ctx.clip();
        ctx.fillStyle = 'rgba(' + FG + ',' + (0.4 + 0.5 * easedFrac) + ')';
        ctx.fillText(c.tok, x + chipPad, chipY + chipH * 0.66);
        ctx.restore();
      } else {
        ctx.fillStyle = 'rgba(' + FG + ',0.88)';
        ctx.fillText(c.tok, x + chipPad, chipY + chipH * 0.66);
      }
      x += cw + chipGap;
    }

    // Blinking cursor right after the emerging token.
    var cursorX = x - chipGap + 2;
    var blink = 0.35 + 0.55 * Math.abs(Math.sin(f * 0.18));
    ctx.fillStyle = 'rgba(' + HR + ',' + blink + ')';
    ctx.fillRect(cursorX, chipY + 3, 1.8, chipH - 6);

    ctx.restore();
    ctx.restore();
  }

  function drawInfraStack(layout, alpha, f) {
    if (alpha <= 0.01) return;
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

  // ── Foreground consumer surface (intact) ─────────────────────────────

  function drawConsumerSurface(alpha, fractureAmt, f) {
    if (alpha <= 0.001) return;
    var pad = Math.max(28, W * 0.07);
    var sx = pad, sy = pad;
    var sw = W - pad * 2;
    var sh = H - pad * 2;

    ctx.save();
    ctx.globalAlpha = alpha;

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
    ['#5a6271', '#5a6271', '#5a6271'].forEach(function (c, i) {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(sx + sw - 16 - i * 14, sy + 15, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Chat bubbles
    var bubbleY = sy + 56;
    var bubbleH = (sh - 96) * 0.42;
    var bubbleGap = (sh - 96) * 0.10;

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

    var abY = bubbleY + bubbleH + bubbleGap;
    var abW = sw * 0.66;
    rrect(sx + 22, abY, abW, bubbleH, 12);
    ctx.fillStyle = 'rgba(' + FG + ',0.06)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(' + FG + ',0.22)';
    ctx.stroke();
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

    // Composer
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

    // Cracks propagating across the intact surface
    if (fractureAmt > 0.01) drawCracks(sx, sy, sw, sh, fractureAmt, alpha);
  }

  // Multi-branch radial cracks. fractureAmt goes 0→1 over the crack phase;
  // we stage three crack paths so they emerge sequentially (impact-style).
  var CRACK_PATHS = null;
  function crackPaths(sx, sy, sw, sh) {
    if (CRACK_PATHS && CRACK_PATHS._key === sx + '_' + sy + '_' + sw + '_' + sh) return CRACK_PATHS;
    var impact = [sx + sw * 0.48, sy + sh * 0.40];
    var make = function (angles, reach) {
      return angles.map(function (a) {
        var pts = [impact.slice()];
        var len = reach * (0.6 + Math.random() * 0.5);
        var n = 5 + ((Math.random() * 3) | 0);
        for (var k = 1; k <= n; k++) {
          var step = (len / n) * k;
          var jag = (Math.random() - 0.5) * 18;
          pts.push([
            impact[0] + Math.cos(a) * step + Math.cos(a + Math.PI / 2) * jag,
            impact[1] + Math.sin(a) * step + Math.sin(a + Math.PI / 2) * jag
          ]);
        }
        return pts;
      });
    };
    // three waves of branches, emerging at different fractureAmt thresholds
    CRACK_PATHS = {
      _key: sx + '_' + sy + '_' + sw + '_' + sh,
      impact: impact,
      waves: [
        { start: 0.00, end: 0.45, paths: make([-0.6, 0.4, 1.9, 2.8, -2.2, 3.6], Math.max(sw, sh) * 0.55) },
        { start: 0.25, end: 0.75, paths: make([-1.1, 0.9, 2.3, -1.8, 3.1], Math.max(sw, sh) * 0.45) },
        { start: 0.55, end: 1.00, paths: make([-0.3, 1.4, 2.6, -2.6, 0.2, -1.5], Math.max(sw, sh) * 0.38) }
      ]
    };
    return CRACK_PATHS;
  }

  function drawCracks(sx, sy, sw, sh, amt, alpha) {
    var cp = crackPaths(sx, sy, sw, sh);
    ctx.save();
    rrect(sx, sy, sw, sh, 14);
    ctx.clip();

    // Impact flash (bright bloom at start of crack)
    var flashA = amt < 0.15 ? (1 - amt / 0.15) * 0.55 : 0;
    if (flashA > 0.01) {
      var grd = ctx.createRadialGradient(cp.impact[0], cp.impact[1], 0,
                                          cp.impact[0], cp.impact[1], Math.max(sw, sh) * 0.35);
      grd.addColorStop(0, 'rgba(' + HR + ',' + flashA + ')');
      grd.addColorStop(1, 'rgba(' + HR + ',0)');
      ctx.globalAlpha = alpha;
      ctx.fillStyle = grd;
      ctx.fillRect(sx, sy, sw, sh);
    }

    for (var w = 0; w < cp.waves.length; w++) {
      var wave = cp.waves[w];
      if (amt < wave.start) continue;
      var u = Math.min(1, (amt - wave.start) / (wave.end - wave.start));
      var eu = easeOut(u);
      for (var p = 0; p < wave.paths.length; p++) {
        var path = wave.paths[p];
        // Draw from impact to (n * eu)-th segment
        var segs = (path.length - 1);
        var drawnSegs = segs * eu;
        ctx.strokeStyle = 'rgba(' + HR + ',' + (0.55 + 0.3 * eu) * alpha + ')';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(path[0][0], path[0][1]);
        for (var k = 1; k <= segs; k++) {
          var segProg = drawnSegs - (k - 1);
          if (segProg <= 0) break;
          if (segProg >= 1) {
            ctx.lineTo(path[k][0], path[k][1]);
          } else {
            ctx.lineTo(
              path[k - 1][0] + (path[k][0] - path[k - 1][0]) * segProg,
              path[k - 1][1] + (path[k][1] - path[k - 1][1]) * segProg
            );
          }
        }
        ctx.stroke();
        // Thin parallel highlight for depth
        ctx.strokeStyle = 'rgba(255,255,255,' + 0.08 * eu * alpha + ')';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    // Shard glints at intersections (impact area)
    var glintA = Math.min(1, amt / 0.4) * alpha;
    if (glintA > 0.01) {
      ctx.fillStyle = 'rgba(' + HR + ',' + (0.75 * glintA) + ')';
      for (var g = 0; g < 6; g++) {
        var ang = (g / 6) * Math.PI * 2 + amt * 2;
        var rd = 6 + (g % 2) * 4;
        ctx.beginPath();
        ctx.arc(cp.impact[0] + Math.cos(ang) * rd,
                cp.impact[1] + Math.sin(ang) * rd,
                1.5 + (g % 2) * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ── Shatter: polygonal shards that fall with gravity ────────────────

  var shards = null;
  var shardCycleStart = -1;

  function makeShards(sx, sy, sw, sh) {
    var list = [];
    var cols = 4, rows = 4;
    var cellW = sw / cols, cellH = sh / rows;
    // Shared vertex grid with small displacement — adjacent shards share
    // a vertex so they fit together as one pane before falling.
    var verts = [];
    for (var r = 0; r <= rows; r++) {
      var row = [];
      for (var c = 0; c <= cols; c++) {
        var jx = (r === 0 || r === rows) ? 0 : (Math.random() - 0.5) * cellW * 0.22;
        var jy = (c === 0 || c === cols) ? 0 : (Math.random() - 0.5) * cellH * 0.22;
        row.push([sx + c * cellW + jx, sy + r * cellH + jy]);
      }
      verts.push(row);
    }
    // Extract 4-corner polys per cell
    for (var r2 = 0; r2 < rows; r2++) {
      for (var c2 = 0; c2 < cols; c2++) {
        var polyWorld = [
          verts[r2][c2],
          verts[r2][c2 + 1],
          verts[r2 + 1][c2 + 1],
          verts[r2 + 1][c2]
        ];
        var cx = 0, cy = 0;
        for (var v = 0; v < 4; v++) { cx += polyWorld[v][0]; cy += polyWorld[v][1]; }
        cx /= 4; cy /= 4;
        var local = polyWorld.map(function (p) { return [p[0] - cx, p[1] - cy]; });
        // Shards scatter across the bottom band of the surface, not a
        // single scan line. baseRest sweeps the bottom ~32% of the
        // surface so glass doesn't pile on the TOKEN STREAM card, and
        // each shard picks a rest depth at random within that band.
        var baseBandTop = sy + sh * 0.68;
        var baseBandBot = sy + sh - 4;
        var restY = baseBandTop + Math.random() * (baseBandBot - baseBandTop);
        // Stagger falling so impact cascades from center outward
        var dx = c2 - (cols - 1) / 2;
        var dy = r2 - (rows - 1) / 2;
        var distFromCenter = Math.sqrt(dx * dx + dy * dy);
        var delay = distFromCenter * 10 + Math.random() * 26;
        list.push({
          local: local,
          x0: cx, y0: cy,
          x: cx, y: cy,
          vy: 0,
          // Wider horizontal drift — shards fan out as they fall.
          vx: (Math.random() - 0.5) * 1.8,
          rot: 0,
          vrot: (Math.random() - 0.5) * 0.05,
          restY: restY,
          finalRot: (Math.random() - 0.5) * 0.14,  // near-horizontal rest
          delay: delay,
          col: c2,
          row: r2,
          bounced: false,
          settled: false,
          flattenT: 0   // ramps 0→1 after settlement; compresses y-scale
        });
      }
    }
    return list;
  }

  function stepShard(sh, tInShatter) {
    if (sh.settled) {
      // After settlement, continue flattening toward full compression so
      // the shard reads as a glass chip on the floor rather than an
      // upright fragment blocking the infrastructure cards behind it.
      if (sh.flattenT < 1) sh.flattenT = Math.min(1, sh.flattenT + 0.03);
      return;
    }
    if (tInShatter < sh.delay) { sh.x = sh.x0; sh.y = sh.y0; sh.rot = 0; return; }
    var g = 0.34;
    sh.vy += g;
    sh.y += sh.vy;
    sh.x += sh.vx;
    sh.rot += sh.vrot;
    if (sh.y >= sh.restY) {
      sh.y = sh.restY;
      if (!sh.bounced && sh.vy > 3.5) {
        // single bounce on impact — dampened and halved
        sh.vy = -sh.vy * 0.32;
        sh.vrot *= 0.6;
        sh.vx *= 0.7;
        sh.bounced = true;
      } else {
        sh.vy = 0;
        sh.vx *= 0.8;
        sh.vrot *= 0.8;
        if (Math.abs(sh.vrot) < 0.004 && Math.abs(sh.vx) < 0.05) {
          sh.vrot = 0; sh.vx = 0;
          // Lerp remaining rotation toward final rest angle
          sh.rot += (sh.finalRot - sh.rot) * 0.18;
          if (Math.abs(sh.rot - sh.finalRot) < 0.01) {
            sh.rot = sh.finalRot;
            sh.settled = true;
          }
        }
      }
    }
  }

  function drawShard(sh, alpha, fallenAmt) {
    // fallenAmt 0 = still at original position; 1 = fully fallen/settled.
    // Controls how "broken glass" it reads — faint fill when still in place,
    // stronger glass look once in flight.
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sh.x, sh.y);
    ctx.rotate(sh.rot);
    // Settled shards flatten to thin glass chips so they don't occlude
    // the infrastructure above. flattenT ramps after each shard's rest.
    var flat = 1 - sh.flattenT * 0.82;
    ctx.scale(1, flat);
    ctx.beginPath();
    ctx.moveTo(sh.local[0][0], sh.local[0][1]);
    for (var v = 1; v < sh.local.length; v++) ctx.lineTo(sh.local[v][0], sh.local[v][1]);
    ctx.closePath();

    // Glass body: translucent dark, darker underside
    var grd = ctx.createLinearGradient(0, -30, 0, 30);
    grd.addColorStop(0, 'rgba(26, 36, 50, ' + (0.72 + 0.18 * fallenAmt) + ')');
    grd.addColorStop(1, 'rgba(10, 14, 22, ' + (0.55 + 0.30 * fallenAmt) + ')');
    ctx.fillStyle = grd;
    ctx.fill();

    // Edge: cool steel
    ctx.strokeStyle = 'rgba(' + FG + ',' + (0.34 + 0.28 * fallenAmt) + ')';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Amber inner-edge highlight on two vertices — signature of fracture
    ctx.strokeStyle = 'rgba(' + HR + ',' + (0.55 * fallenAmt) + ')';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(sh.local[0][0], sh.local[0][1]);
    ctx.lineTo(sh.local[1][0], sh.local[1][1]);
    ctx.stroke();

    // Glint: tiny white highlight on top-left vertex — fades as shard flattens
    if (fallenAmt > 0.15 && sh.flattenT < 0.7) {
      ctx.fillStyle = 'rgba(255,255,255,' + (0.35 * fallenAmt * (1 - sh.flattenT)) + ')';
      ctx.beginPath();
      ctx.arc(sh.local[0][0] * 0.7, sh.local[0][1] * 0.7, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function drawShards(alpha, fallenAmt) {
    if (!shards || alpha <= 0.01) return;
    // Sort by y so shards closer to the floor render last (visually on top)
    var ordered = shards.slice().sort(function (a, b) { return a.y - b.y; });
    for (var i = 0; i < ordered.length; i++) drawShard(ordered[i], alpha, fallenAmt);
  }

  // ── Phase label ──────────────────────────────────────────────────────

  function drawPhaseLabel(text, alpha) {
    if (alpha <= 0.01 || !text) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 11px "IBM Plex Mono", monospace';
    var w = ctx.measureText(text).width;
    var x = W - w - 18;
    var y = H - 14;
    ctx.fillStyle = BG;
    ctx.fillRect(x - 8, y - 12, w + 16, 18);
    ctx.fillStyle = 'rgba(' + HR + ',0.82)';
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  // ── Draw ─────────────────────────────────────────────────────────────

  function draw() {
    if (!ctx || !W || !H) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    var cycleStart = Math.floor(frame / CYCLE) * CYCLE;
    var t = frame - cycleStart;

    // Surface rect (same math as drawConsumerSurface)
    var pad = Math.max(28, W * 0.07);
    var sx = pad, sy = pad, sw = W - pad * 2, sh = H - pad * 2;

    // Fresh shards at the top of each cycle
    if (shardCycleStart !== cycleStart || !shards) {
      shards = makeShards(sx, sy, sw, sh);
      shardCycleStart = cycleStart;
      // Reset crack path randomness each cycle for variety
      CRACK_PATHS = null;
    }

    var surfaceAlpha, fractureAmt, infraAlpha, shardAlpha, fallenAmt, phaseLabel, phaseLabelAlpha;

    if (t < P_SEAL_END) {
      // SEAL
      var seal_u = t / P_SEAL_END;
      surfaceAlpha = 1;
      fractureAmt = 0;
      infraAlpha = 0;
      shardAlpha = 0;
      fallenAmt = 0;
      phaseLabel = 'CONSUMER SURFACE';
      phaseLabelAlpha = seal_u < 0.08 ? seal_u / 0.08 : (seal_u > 0.92 ? (1 - seal_u) / 0.08 : 1);
    } else if (t < P_CRACK_END) {
      // CRACK — intact surface still visible, cracks propagate
      var u = (t - P_SEAL_END) / (P_CRACK_END - P_SEAL_END);
      surfaceAlpha = 1 - easeInOut(u) * 0.10;
      fractureAmt = easeOut(u);
      infraAlpha = easeInOut(u) * 0.18;
      shardAlpha = 0;
      fallenAmt = 0;
      phaseLabel = 'FRACTURE';
      phaseLabelAlpha = u < 0.15 ? u / 0.15 : 1;
    } else if (t < P_SHATTER_END) {
      // SHATTER — surface crossfades to shards, shards fall
      var u2 = (t - P_CRACK_END) / (P_SHATTER_END - P_CRACK_END);
      var surfaceFade = easeInOut(Math.min(1, u2 * 2.8));
      surfaceAlpha = Math.max(0, 1 - surfaceFade);
      fractureAmt = (1 - u2) * 0.55;
      infraAlpha = 0.18 + easeInOut(u2) * 0.72;
      shardAlpha = easeInOut(Math.min(1, u2 * 3));
      fallenAmt = easeOut(u2);
      phaseLabel = 'SHATTER';
      phaseLabelAlpha = u2 < 0.1 ? u2 / 0.1 : (u2 > 0.88 ? (1 - u2) / 0.12 : 1);
      // Step shard physics
      var st = t - P_CRACK_END;
      for (var i = 0; i < shards.length; i++) stepShard(shards[i], st);
    } else if (t < P_INFRA_END) {
      // INFRASTRUCTURE — shards settled at bottom, cards fully visible
      var u3 = (t - P_SHATTER_END) / (P_INFRA_END - P_SHATTER_END);
      surfaceAlpha = 0;
      fractureAmt = 0;
      infraAlpha = 1;
      // Settled shards are thin glass-chip scatter over the bottom band
      // of the surface. Kept fairly translucent so the TOKEN STREAM and
      // MODEL · WEIGHTS cards stay legible through them.
      shardAlpha = 0.34;
      fallenAmt = 1;
      phaseLabel = 'INFRASTRUCTURE';
      phaseLabelAlpha = u3 < 0.06 ? u3 / 0.06 : (u3 > 0.94 ? (1 - u3) / 0.06 : 1);
      // Step every shard so flattenT advances after settlement. Unsettled
      // stragglers still complete their micro-rest here.
      for (var si = 0; si < shards.length; si++) stepShard(shards[si], t - P_CRACK_END);
    } else {
      // RESEAL — surface returns, shards evaporate, infrastructure dims
      var u4 = (t - P_INFRA_END) / (CYCLE - P_INFRA_END);
      surfaceAlpha = easeInOut(u4);
      fractureAmt = (1 - u4) * 0.18;
      infraAlpha = 1 - easeInOut(u4);
      shardAlpha = 0.34 * (1 - easeInOut(u4));
      fallenAmt = 1;
      phaseLabel = '';
      phaseLabelAlpha = 0;
    }

    // Draw order: infrastructure → shards → surface → cracks → label
    var layout = cardLayout();
    drawInfraStack(layout, infraAlpha, frame);

    // Shards always drawn above infrastructure once visible
    if (shardAlpha > 0.01) drawShards(shardAlpha, fallenAmt);

    // Intact surface above shards (only when surfaceAlpha > 0)
    drawConsumerSurface(surfaceAlpha, fractureAmt, frame);

    drawPhaseLabel(phaseLabel, phaseLabelAlpha);

    frame++;
  }

  function loop() { if (!running) return; draw(); raf = requestAnimationFrame(loop); }

  function start() {
    if (running) return;
    if (!reset()) return;
    running = true;
    frame = 0;            // restart cycle each time slide becomes visible
    shardCycleStart = -1; // force shard regen
    CRACK_PATHS = null;
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
