'use strict';
(function () {
  var canvas = document.getElementById('zm4-canvas');
  if (!canvas) return;

  var HR = '232,200,159'; // --accent-zach amber
  var MR = '125,211,184'; // teal for model
  var BG = '#080b10';

  var ctx, W, H, dpr, raf, frame = 0, running = false;
  var promptLines   = [0.82, 0.65, 0.78, 0.55, 0.70];
  var responseLines = [0.90, 0.78, 0.88, 0.60];
  var netNodes = [], packets = [];

  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,    x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y,    x + r, y, r);
    ctx.closePath();
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
    buildNet();
    seedPackets();
    return true;
  }

  function buildNet() {
    var by  = H * 0.5;
    var top = by + (H - by) * 0.22;
    var bot = H  * 0.92;
    var lft = W  * 0.09;
    var rgt = W  * 0.91;
    var mH  = bot - top;
    var mW  = rgt - lft;
    var layers = [3, 4, 4, 3];
    netNodes = layers.map(function (n, li) {
      var x = lft + (mW / (layers.length - 1)) * li;
      return Array.from({ length: n }, function (_, ni) {
        return {
          x:     x,
          y:     top + (mH / (n + 1)) * (ni + 1),
          phase: (li * 1.3 + ni * 0.9) * Math.PI / 2,
          rate:  0.028 + li * 0.008 + ni * 0.005
        };
      });
    });
  }

  function seedPackets() {
    var by = H * 0.5;
    packets = [
      { x: 0.12, f: 0.30, dir: 'down' },
      { x: 0.28, f: 0.60, dir: 'up'   },
      { x: 0.43, f: 0.20, dir: 'down' },
      { x: 0.57, f: 0.72, dir: 'up'   },
      { x: 0.72, f: 0.45, dir: 'down' },
      { x: 0.87, f: 0.80, dir: 'up'   },
    ].map(function (d) {
      return {
        x:     W * d.x,
        y:     d.dir === 'up' ? by + (H - by) * d.f : by * d.f,
        speed: 0.9 + d.x,
        dir:   d.dir,
        sz:    3.5 + d.f * 3,
        a:     0.65 + d.f * 0.2
      };
    });
  }

  function spawnPacket() {
    var idx = frame % 11;
    var dir = idx % 2 === 0 ? 'up' : 'down';
    var xf  = 0.07 + idx * 0.085;
    packets.push({
      x:     W * xf,
      y:     dir === 'up' ? H * 0.90 : H * 0.10,
      speed: 0.9 + (idx % 5) * 0.22,
      dir:   dir,
      sz:    3 + (idx % 4),
      a:     0.60 + (idx % 3) * 0.13
    });
  }

  function draw() {
    if (!ctx || !W || !H) return;
    ctx.clearRect(0, 0, W, H);
    var by = H * 0.5;

    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(' + HR + ',0.036)';
    ctx.fillRect(0, 0, W, by);
    ctx.fillStyle = 'rgba(' + MR + ',0.036)';
    ctx.fillRect(0, by, W, H - by);

    drawHarness(by);
    drawPackets();
    drawBoundary(by);
    drawModel(by);

    frame++;
    if (frame % 52 === 0) spawnPacket();
    packets = packets.filter(function (p) {
      return p.dir === 'up' ? p.y > -8 : p.y < H + 8;
    });
  }

  function drawHarness(by) {
    var pad = W * 0.06;

    ctx.save();
    ctx.font = 'bold 14px "IBM Plex Mono", monospace';
    ctx.letterSpacing = '2px';
    ctx.fillStyle = 'rgba(' + HR + ',0.55)';
    var hl = 'HARNESS / INTERFACE';
    ctx.fillText(hl, W * 0.5 - ctx.measureText(hl).width / 2, 24);
    ctx.restore();

    // System prompt box
    var spX = pad, spY = 34, spW = W * 0.46 - pad, spH = by - 74 - spY;
    ctx.save();
    rrect(spX, spY, spW, spH, 7);
    ctx.clip();
    ctx.fillStyle = 'rgba(' + HR + ',0.07)';
    ctx.fillRect(spX, spY, spW, 22);
    ctx.restore();
    rrect(spX, spY, spW, spH, 7);
    ctx.strokeStyle = 'rgba(' + HR + ',0.38)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + HR + ',0.78)';
    ctx.fillText('SYSTEM PROMPT', spX + 9, spY + 15);
    ctx.fillStyle = 'rgba(' + HR + ',0.22)';
    promptLines.forEach(function (f, i) {
      ctx.fillRect(spX + 9, spY + 30 + i * 12, (spW - 18) * f, 4.5);
    });

    // Temperature slider
    var slY = by - 52;
    ctx.strokeStyle = 'rgba(' + HR + ',0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, slY); ctx.lineTo(pad + spW, slY); ctx.stroke();
    var kx = pad + spW * (0.33 + 0.08 * Math.sin(frame * 0.022));
    ctx.beginPath(); ctx.arc(kx, slY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c89f'; ctx.fill();
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + HR + ',0.50)';
    ctx.fillText('temperature', pad, by - 32);

    // Response box
    var rbX = W * 0.50 + pad * 0.3, rbY = 34, rbW = W - rbX - pad, rbH = by - 74 - rbY;
    ctx.save();
    rrect(rbX, rbY, rbW, rbH, 7);
    ctx.clip();
    ctx.fillStyle = 'rgba(' + HR + ',0.07)';
    ctx.fillRect(rbX, rbY, rbW, 22);
    ctx.restore();
    rrect(rbX, rbY, rbW, rbH, 7);
    ctx.strokeStyle = 'rgba(' + HR + ',0.28)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '11px "IBM Plex Mono", monospace';
    ctx.fillStyle = 'rgba(' + HR + ',0.78)';
    ctx.fillText('RESPONSE', rbX + 9, rbY + 15);

    var totalF  = responseLines.length * 18 + 36;
    var sf      = frame % totalF;
    var lineIdx = Math.min(Math.floor(sf / 18), responseLines.length);
    var linePct = (sf % 18) / 18;
    for (var i = 0; i < responseLines.length; i++) {
      var maxW  = (rbW - 18) * responseLines[i];
      var drawn = i < lineIdx ? maxW : (i === lineIdx ? maxW * linePct : 0);
      if (drawn > 0) {
        ctx.fillStyle = 'rgba(' + HR + ',0.28)';
        ctx.fillRect(rbX + 9, rbY + 30 + i * 12, drawn, 4.5);
      }
    }
    if (lineIdx < responseLines.length && Math.floor(frame / 20) % 2 === 0) {
      var curW = (rbW - 18) * responseLines[lineIdx] * linePct;
      ctx.fillStyle = '#e8c89f';
      ctx.fillRect(rbX + 9 + curW + 1, rbY + 26 + lineIdx * 12, 2, 11);
    }
  }

  function drawBoundary(by) {
    var glow = 0.35 + 0.12 * Math.abs(Math.sin(frame * 0.018));
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255,255,255,' + glow + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, by); ctx.lineTo(W, by); ctx.stroke();
    ctx.restore();

    var lbl = 'API BOUNDARY';
    ctx.save();
    ctx.font = 'bold 13px "IBM Plex Mono", monospace';
    ctx.letterSpacing = '1.5px';
    var lw = ctx.measureText(lbl).width;
    ctx.fillStyle = BG;
    ctx.fillRect(W / 2 - lw / 2 - 12, by - 11, lw + 24, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.68)';
    ctx.fillText(lbl, W / 2 - lw / 2, by + 5.5);
    ctx.restore();
  }

  function drawModel(by) {
    ctx.save();
    ctx.font = 'bold 14px "IBM Plex Mono", monospace';
    ctx.letterSpacing = '2px';
    ctx.fillStyle = 'rgba(' + MR + ',0.50)';
    var ml = 'MODEL  /  LLM';
    ctx.fillText(ml, W * 0.5 - ctx.measureText(ml).width / 2, by + 23);
    ctx.restore();

    ctx.lineWidth = 1;
    for (var li = 0; li < netNodes.length - 1; li++) {
      var srcL = netNodes[li], dstL = netNodes[li + 1];
      for (var si = 0; si < srcL.length; si++) {
        for (var di = 0; di < dstL.length; di++) {
          var p = Math.sin(frame * 0.04 + srcL[si].phase + dstL[di].phase) * 0.5 + 0.5;
          ctx.strokeStyle = 'rgba(' + MR + ',' + (0.05 + p * 0.13) + ')';
          ctx.beginPath();
          ctx.moveTo(srcL[si].x, srcL[si].y);
          ctx.lineTo(dstL[di].x, dstL[di].y);
          ctx.stroke();
        }
      }
    }

    for (var col = 0; col < netNodes.length; col++) {
      for (var row = 0; row < netNodes[col].length; row++) {
        var n     = netNodes[col][row];
        var pulse = Math.sin(frame * n.rate + n.phase) * 0.5 + 0.5;
        var r     = 5.5 + pulse * 3.5;
        var grd   = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.5);
        grd.addColorStop(0, 'rgba(' + MR + ',' + (0.22 + pulse * 0.28) + ')');
        grd.addColorStop(1, 'rgba(' + MR + ',0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle   = 'rgba(' + MR + ',' + (0.28 + pulse * 0.5) + ')';
        ctx.fill();
        ctx.strokeStyle = 'rgba(' + MR + ',' + (0.55 + pulse * 0.45) + ')';
        ctx.lineWidth   = 1.5; ctx.stroke();
      }
    }
  }

  function drawPackets() {
    packets.forEach(function (p) {
      p.y += p.dir === 'up' ? -p.speed : p.speed;
      ctx.fillStyle = 'rgba(' + (p.dir === 'up' ? MR : HR) + ',' + p.a + ')';
      ctx.fillRect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz, p.sz);
    });
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

  // slides.js calls this after 60 ms on each slide navigation
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
