/* Chart studies · initializes the six frappe-charts examples.
   All values are placeholder — flagged on each plate in the UI. */

(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') return fn();
    document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    if (!window.frappe || !window.frappe.Chart) {
      console.error('[wireframe] frappe-charts global not found — check the local UMD path.');
      return;
    }

    var C = window.frappe.Chart;

    var luke   = '#a8c4b5';
    var laurie = '#c9d5e8';
    var zach   = '#e8c89f';
    var sule   = '#c9a6cf';
    var warm   = '#d9b48c';
    var bright = '#8fd5c3';
    var muted  = '#8aa8c7';

    /* ── 01 · LW5 · stacked bar ───────────────────────────────── */
    new C('#chart-01', {
      type: 'bar',
      height: 300,
      colors: [luke, 'rgba(168, 196, 181, 0.28)'],
      axisOptions: { xAxisMode: 'tick', yAxisMode: 'tick', xIsSeries: false },
      barOptions: { stacked: 1, spaceRatio: 0.45 },
      tooltipOptions: {
        formatTooltipX: function (d) { return d; },
        formatTooltipY: function (v) { return v + ' campuses'; }
      },
      data: {
        labels: ['Staten Is.', 'Manhattan', 'Bronx', 'Queens', 'Brooklyn'],
        datasets: [
          { name: 'CALI-participating',   values: [1, 6, 3, 4, 3] },
          { name: 'Other CUNY campuses',  values: [1, 2, 1, 1, 2] }
        ]
      }
    });

    /* ── 02 · LW6 · axis-mixed (bar + line) ───────────────────── */
    // spline disabled: only 2 data points → degenerate bezier control points.
    new C('#chart-02', {
      type: 'axis-mixed',
      height: 300,
      colors: [luke, warm],
      axisOptions: { xAxisMode: 'tick', yAxisMode: 'span' },
      lineOptions: { regionFill: 0, hideDots: 0, spline: 0 },
      data: {
        labels: ['Cohort 1', 'Cohort 2'],
        datasets: [
          { name: 'Faculty',     chartType: 'bar',  values: [18, 27] },
          { name: 'Disciplines', chartType: 'line', values: [9, 14] }
        ]
      }
    });

    /* ── 03 · LH4+LH5 · two-series line ───────────────────────── */
    // spline disabled: long zero runs produce NaN control points.
    new C('#chart-03', {
      type: 'line',
      height: 300,
      colors: [laurie, warm],
      axisOptions: { xAxisMode: 'tick', yAxisMode: 'span' },
      lineOptions: { hideDots: 0, heatline: 0, regionFill: 0, spline: 0 },
      data: {
        labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
          { name: 'Spring meetings',  values: [0, 0, 0, 0, 12, 14, 16, 15, 0, 0, 0, 0] },
          { name: 'Summer institute', values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 20, 0] }
        ]
      }
    });

    /* ── 04 · LH11 · percentage strip ─────────────────────────── */
    new C('#chart-04', {
      type: 'percentage',
      height: 220,
      colors: [laurie, bright, warm, muted, '#a88fc7'],
      maxSlices: 5,
      data: {
        labels: ['Refusal', 'Tinkering', 'Critique', 'Integration', 'World-building'],
        datasets: [
          { name: 'Share (placeholder)', values: [12, 28, 22, 18, 20] }
        ]
      }
    });

    /* ── 05 · ZM6 · smooth line ───────────────────────────────── */
    // Illustrative proxy: coherence "score" collapsing as temperature rises.
    var temps = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0];
    var coherence = [0.96, 0.95, 0.93, 0.89, 0.83, 0.74, 0.63, 0.50, 0.36, 0.22, 0.11];

    new C('#chart-05', {
      type: 'line',
      height: 320,
      colors: [zach],
      axisOptions: { xAxisMode: 'span', yAxisMode: 'span', xIsSeries: 1 },
      lineOptions: { hideDots: 0, heatline: 0, regionFill: 0, spline: 0 },
      tooltipOptions: {
        formatTooltipX: function (d) { return 'T = ' + Number(d).toFixed(1); },
        formatTooltipY: function (v) { return Number(v).toFixed(2); }
      },
      data: {
        labels: temps.map(function (t) { return t.toFixed(1); }),
        datasets: [
          { name: 'coherence (proxy)', values: coherence }
        ]
      }
    });

    /* ── 06 · SA4 · bar (three themes) ────────────────────────── */
    new C('#chart-06', {
      type: 'bar',
      height: 300,
      colors: [sule],
      axisOptions: { xAxisMode: 'tick', yAxisMode: 'tick' },
      barOptions: { spaceRatio: 0.55 },
      tooltipOptions: {
        formatTooltipY: function (v) { return v + ' mentions'; }
      },
      data: {
        labels: ['Techno-determinism', 'Threat to agency', 'Material implications'],
        datasets: [
          { name: 'Reflection mentions (placeholder)', values: [23, 19, 14] }
        ]
      }
    });

  });
})();
