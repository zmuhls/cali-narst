'use strict';
(function () {
  var host = document.getElementById('zm8-chart');
  if (!host) return;
  var chart = null;

  function build() {
    if (!window.frappe || !window.frappe.Chart) return;
    host.replaceChildren();
    chart = new frappe.Chart(host, {
      type: 'bar',
      height: 320,
      colors: ['#e8c89f', '#8fd5c3', '#c9a6cf'],
      data: {
        labels: ['Prompts', 'Max Tokens', 'Temperature', 'Personas', 'Models'],
        datasets: [
          { name: 'Baruch',   values: [12, 6, 0, 4, 2] },
          { name: 'Hunter',   values: [14, 11, 3, 4, 2] },
          { name: 'Brooklyn', values: [21, 5, 9, 6, 5] }
        ]
      },
      axisOptions: { xAxisMode: 'tick', xIsSeries: 0, yAxisMode: 'tick' },
      barOptions: { spaceRatio: 0.3 },
      tooltipOptions: {
        formatTooltipY: function (d) { return d + ' events'; }
      },
      animate: true,
      truncateLegends: false
    });
    // Frappe doesn't expose a y-interval option; rewrite axis ticks to 0,5,10,15,20,25.
    // Run after layout settles.
    requestAnimationFrame(function () { rewriteYAxis(); });
  }

  function rewriteYAxis() {
    var svg = host.querySelector('svg');
    if (!svg) return;
    var yAxis = svg.querySelector('.y-axis');
    if (!yAxis) return;
    var lines = Array.prototype.slice.call(yAxis.querySelectorAll('.tick'));
    if (!lines.length) return;
    // Determine the existing numeric ticks and their pixel positions to
    // build a linear mapping from data-value -> y-pixel.
    var pts = lines.map(function (g) {
      var t = g.querySelector('text');
      var v = t ? parseFloat(t.textContent) : NaN;
      var tr = g.getAttribute('transform') || '';
      var m = tr.match(/translate\(([-0-9.]+),\s*([-0-9.]+)\)/);
      var y = m ? parseFloat(m[2]) : NaN;
      return { v: v, y: y, g: g };
    }).filter(function (p) { return !isNaN(p.v) && !isNaN(p.y); });
    if (pts.length < 2) return;
    pts.sort(function (a, b) { return a.v - b.v; });
    var v0 = pts[0].v, v1 = pts[pts.length - 1].v;
    var y0 = pts[0].y, y1 = pts[pts.length - 1].y;
    var slope = (y1 - y0) / (v1 - v0);
    var newVals = [0, 5, 10, 15, 20, 25];
    // Remove existing tick groups
    pts.forEach(function (p) { p.g.parentNode.removeChild(p.g); });
    // Rebuild ticks from a template clone
    var tmpl = pts[0].g.cloneNode(true);
    var lineEl = tmpl.querySelector('line');
    var textEl = tmpl.querySelector('text');
    newVals.forEach(function (v) {
      var y = y0 + (v - v0) * slope;
      var g = tmpl.cloneNode(true);
      g.setAttribute('transform', 'translate(0, ' + y + ')');
      var t = g.querySelector('text');
      if (t) t.textContent = v;
      yAxis.appendChild(g);
    });
  }

  host.__deckResize = function () {
    if (!chart) { build(); return; }
    window.dispatchEvent(new Event('resize'));
  };

  var section = host.closest('section.slide');
  if (section && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !chart) build();
    }, { threshold: 0.15 }).observe(section);
  } else {
    build();
  }
}());
