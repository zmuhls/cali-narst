'use strict';

let idx = 0;
const slides = Array.from(document.querySelectorAll('section.slide'));
const scrubber = document.getElementById('slide-scrubber');
const sliderCounter = document.getElementById('slider-counter');
const sliderProgress = document.querySelector('.slider-progress');
const sliderThumb = document.querySelector('.slider-thumb');

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function fragsOf(slide) {
  return Array.from(slide.querySelectorAll('.frag'));
}

function show(i, revealAll) {
  var next = clamp(i, 0, slides.length - 1);
  // Kill any running gallery timers on the slide we're leaving
  slides[idx].querySelectorAll('.stage-gallery').forEach(function(g) {
    if (g._timer) { clearInterval(g._timer); g._timer = null; }
  });
  slides[idx].classList.remove('active');
  idx = next;
  slides[idx].classList.add('active');
  fragsOf(slides[idx]).forEach(function(f) { f.classList.toggle('visible', !!revealAll); });

  if (sliderCounter) sliderCounter.textContent = (idx + 1) + ' / ' + slides.length;
  if (scrubber) scrubber.value = String(idx + 1);

  var progress = ((idx + 1) / slides.length) * 100;
  if (sliderProgress) sliderProgress.style.width = progress + '%';
  if (sliderThumb) sliderThumb.style.left = 'calc(' + progress + '% - 10px)';

  history.replaceState(null, '', '#' + (idx + 1));

  var f = slides[idx].querySelector('.content');
  if (f && document.activeElement !== scrubber) {
    f.setAttribute('tabindex', '-1');
    f.focus({ preventScroll: true });
  }

  initGalleries(slides[idx]);
}

function advance() {
  var frags = fragsOf(slides[idx]);
  var hidden = frags.filter(function(f) { return !f.classList.contains('visible'); });
  if (hidden.length) {
    var frag = hidden[0];
    frag.classList.add('visible');
    syncGalleryForward(frag, slides[idx]);
  } else if (idx < slides.length - 1) {
    show(idx + 1);
  }
}

function retreat() {
  var frags = fragsOf(slides[idx]);
  var shown = frags.filter(function(f) { return f.classList.contains('visible'); });
  if (shown.length) {
    var frag = shown[shown.length - 1];
    frag.classList.remove('visible');
    syncGalleryBackward(frag, slides[idx]);
  } else if (idx > 0) {
    show(idx - 1, true);
  }
}

/* ── Gallery ↔ fragment sync ── */
function syncGalleryForward(frag, slide) {
  var gallery = slide.querySelector('.stage-gallery');
  if (!gallery) return;
  if (frag.dataset.startGallery !== undefined && !gallery._timer) {
    var items = gallery.querySelectorAll('.gallery-item');
    var interval = parseInt(gallery.dataset.interval || '6000', 10);
    gallery._timer = setInterval(function() {
      var cur = gallery.querySelector('.gallery-item.active');
      var curIdx = Array.from(items).indexOf(cur);
      showGalleryItem(gallery, (curIdx + 1) % items.length);
    }, interval);
  }
  if (frag.dataset.galleryIdx !== undefined) {
    showGalleryItem(gallery, parseInt(frag.dataset.galleryIdx, 10));
  }
}

function syncGalleryBackward(frag, slide) {
  var gallery = slide.querySelector('.stage-gallery');
  if (!gallery) return;
  if (frag.dataset.startGallery !== undefined && gallery._timer) {
    clearInterval(gallery._timer);
    gallery._timer = null;
    showGalleryItem(gallery, 0);
  }
  if (frag.dataset.galleryIdx !== undefined) {
    var visible = fragsOf(slide).filter(function(f) {
      return f.classList.contains('visible') && f.dataset.galleryIdx !== undefined;
    });
    showGalleryItem(gallery, visible.length
      ? parseInt(visible[visible.length - 1].dataset.galleryIdx, 10) : 0);
  }
}

function toggleOverview() {
  var on = document.body.classList.toggle('overview');
  if (on) {
    slides[idx].scrollIntoView({ block: 'center', behavior: 'instant' });
  }
}

/* ── Gallery (multi-image carousel in stage) ── */
function initGalleries(slide) {
  var galleries = slide.querySelectorAll('.stage-gallery');
  galleries.forEach(function(gallery) {
    if (gallery.dataset.init) return;
    gallery.dataset.init = '1';
    var items = gallery.querySelectorAll('.gallery-item');
    var dots = gallery.querySelector('.gallery-dots');
    if (!dots || items.length < 2) return;
    dots.innerHTML = '';
    items.forEach(function(item, i) {
      var dot = document.createElement('button');
      dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Image ' + (i + 1) + ' of ' + items.length);
      dot.addEventListener('click', function() { showGalleryItem(gallery, i); });
      dots.appendChild(dot);
    });
    if (gallery.dataset.fragSync) return;
    var interval = parseInt(gallery.dataset.interval || '6000', 10);
    gallery._timer = setInterval(function() {
      var cur = gallery.querySelector('.gallery-item.active');
      var curIdx = Array.from(items).indexOf(cur);
      showGalleryItem(gallery, (curIdx + 1) % items.length);
    }, interval);
  });
}

function showGalleryItem(gallery, i) {
  var items = gallery.querySelectorAll('.gallery-item');
  var dots = gallery.querySelectorAll('.gallery-dot');
  items.forEach(function(item, j) { item.classList.toggle('active', j === i); });
  dots.forEach(function(dot, j) { dot.classList.toggle('active', j === i); });
}

/* ── Event listeners ── */
slides.forEach(function(s, i) {
  s.setAttribute('data-slide-num', i + 1);
  s.addEventListener('click', function() {
    if (!document.body.classList.contains('overview')) return;
    document.body.classList.remove('overview');
    show(i, true);
  });
});

document.addEventListener('keydown', function(e) {
  if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if (e.key === 'Escape') { e.preventDefault(); toggleOverview(); return; }
  if (document.body.classList.contains('overview')) return;
  if (['ArrowRight','PageDown',' '].includes(e.key)) { e.preventDefault(); advance(); }
  if (['ArrowLeft','PageUp'].includes(e.key)) { e.preventDefault(); retreat(); }
  if (e.key === 'Home') { e.preventDefault(); show(0); }
  if (e.key === 'End') { e.preventDefault(); show(slides.length - 1, true); }
});

var btnPrev = document.getElementById('btn-prev');
var btnNext = document.getElementById('btn-next');
if (btnPrev) btnPrev.addEventListener('click', retreat);
if (btnNext) btnNext.addEventListener('click', advance);

if (scrubber) {
  scrubber.min = 1;
  scrubber.max = slides.length;
  scrubber.step = 1;
  scrubber.addEventListener('input', function(e) {
    show(parseInt(e.target.value) - 1, true);
  });
}

/* ── Touch / swipe ── */
var tx = 0, ty = 0, swipeOk = false;

document.addEventListener('touchstart', function(e) {
  if (e.touches.length !== 1 || e.target.closest('.stage') || e.target === scrubber || e.target.closest('.sticky-footer')) { swipeOk = false; return; }
  tx = e.touches[0].clientX; ty = e.touches[0].clientY; swipeOk = true;
}, { passive: true });

document.addEventListener('touchmove', function(e) {
  if (!swipeOk || e.touches.length !== 1) return;
  if (Math.abs(e.touches[0].clientY - ty) > Math.abs(e.touches[0].clientX - tx) * 1.5) swipeOk = false;
}, { passive: true });

document.addEventListener('touchend', function(e) {
  if (!swipeOk) return;
  var dx = e.changedTouches[0].clientX - tx;
  var dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) >= 48 && Math.abs(dx) >= Math.abs(dy) * 1.2) { dx < 0 ? advance() : retreat(); }
  else if (Math.abs(dx) < 16 && Math.abs(dy) < 16) { advance(); }
  swipeOk = false;
}, { passive: true });

/* ── Trackpad wheel ── */
var wheelLock = false;
document.addEventListener('wheel', function(e) {
  if (document.body.classList.contains('overview') || e.target === scrubber || e.target.closest('.sticky-footer') || wheelLock) return;
  var absX = Math.abs(e.deltaX), absY = Math.abs(e.deltaY);
  if (absX < 30 || absX < absY) return;
  wheelLock = true;
  e.deltaX > 0 ? advance() : retreat();
  setTimeout(function() { wheelLock = false; }, 400);
}, { passive: true });

window.addEventListener('hashchange', function() {
  var m = location.hash.match(/^#(\d+)$/);
  if (m) show(parseInt(m[1], 10) - 1, true);
});

var m = location.hash.match(/^#(\d+)$/);
show(m ? clamp(parseInt(m[1], 10) - 1, 0, slides.length - 1) : 0, true);
