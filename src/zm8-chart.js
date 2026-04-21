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
      height: 300,
      colors: ['#e8c89f', '#8fd5c3'],
      data: {
        labels: ['Prompt rewrites', 'Token tuning', 'Temperature tuning', 'Persona pivots'],
        datasets: [
          { name: 'Baruch', values: [12, 6, 0, 4] },
          { name: 'Hunter', values: [14, 11, 3, 4] }
        ]
      },
      axisOptions: { xAxisMode: 'tick', xIsSeries: 0 },
      barOptions: { spaceRatio: 0.38 },
      tooltipOptions: {
        formatTooltipY: function (d) { return d + ' events'; }
      },
      animate: true,
      truncateLegends: false
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
