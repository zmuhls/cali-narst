'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="zach-talk-6"]');
  if (!slide) return;

  // Rewrite slide bullets: drop top-p, focus on temperature + inference.
  var ul = slide.querySelector('.content ul.parallel-points');
  if (ul) {
    while (ul.firstChild) ul.removeChild(ul.firstChild);
    function mkLi() { var li = document.createElement('li'); li.className = 'frag'; return li; }
    function mkStrong(t) { var s = document.createElement('strong'); s.textContent = t; return s; }

    var b1 = mkLi();
    b1.appendChild(mkStrong('Temperature'));
    b1.appendChild(document.createTextNode(' controls how deterministic the model’s next-token choice is'));
    var b2 = mkLi();
    b2.textContent = 'Low temperature → predictable, repetitive output; high temperature → varied, divergent output';
    var b3 = mkLi();
    b3.textContent = 'These settings can align output with classroom goals or push it toward drift';
    var b4 = mkLi();
    b4.appendChild(document.createTextNode('At '));
    b4.appendChild(mkStrong('temperature 2.0'));
    b4.appendChild(document.createTextNode(', output drifts into repeated tokens, dialect bleed-through, fragments of the pretraining corpus'));
    ul.appendChild(b1); ul.appendChild(b2); ul.appendChild(b3); ul.appendChild(b4);
  }

  var figure = slide.querySelector('figure.stage');
  if (!figure) return;
  figure.removeAttribute('aria-hidden');
  figure.setAttribute(
    'aria-label',
    'Screenshot: CUNY AI Lab interface showing gpt-oss-120b producing garbled output when temperature is set to 2.0'
  );
  figure.classList.add('image-stage');
  if (!figure.style.position) figure.style.position = 'relative';

  var img = document.createElement('img');
  img.src = 'images/temperature.png';
  img.alt = '';
  img.style.cssText =
    'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;' +
    'object-position:center;display:block;';
  figure.appendChild(img);
}());
