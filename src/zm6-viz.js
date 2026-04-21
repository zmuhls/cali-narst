'use strict';
(function () {
  var slide = document.querySelector('section[data-slide="zach-talk-6"]');
  if (!slide) return;

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
