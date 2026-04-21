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
      height: 340,
      colors: ['#e8c89f', '#8fd5c3', '#c9a6cf'],
      data: {
        labels: ['Prompts', 'Tokens', 'Temperature', 'Personas', 'Models'],
        datasets: [
          { name: 'Baruch',   values: [12, 6, 0, 4, 2] },
          { name: 'Hunter',   values: [14, 11, 3, 4, 2] },
          { name: 'Brooklyn', values: [21, 5, 9, 6, 5] }
        ]
      },
      axisOptions: { xAxisMode: 'tick', xIsSeries: 0 },
      barOptions: { spaceRatio: 0.3 },
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
