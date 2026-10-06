/* Turkey Brief Daily – podcast player
   Markup: <div class="tbp" data-src="...mp3" data-title="..." data-date="..." data-cover="..." data-url="..."></div>
   Re-scan dynamically added players with window.TBPlayer.scan() */
(function () {
  if (window.TBPlayer) { window.TBPlayer.scan(); return; }
  var BARS = 72, SPEEDS = [1, 1.25, 1.5, 2, 0.75];
  var I = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4.2" height="14" rx="1.2"/><rect x="13.8" y="5" width="4.2" height="14" rx="1.2"/></svg>',
    load: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9h-2.5A6.5 6.5 0 1 1 12 5.5V3z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/><text x="12" y="16.2" font-size="6.5" text-anchor="middle" font-weight="700" font-family="sans-serif">15</text></svg>',
    fwd: '<svg viewBox="0 0 24 24"><path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6h2a8 8 0 1 1-8-8z"/><text x="12" y="16.2" font-size="6.5" text-anchor="middle" font-weight="700" font-family="sans-serif">30</text></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M11 4h2v8.6l3.3-3.3 1.4 1.4L12 16.4l-5.7-5.7 1.4-1.4 3.3 3.3V4zM5 18h14v2H5z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><path d="M18 16a3 3 0 0 0-2.4 1.2L9 13.7a3 3 0 0 0 0-1.4l6.6-3.5A3 3 0 1 0 15 7l-6.6 3.5a3 3 0 1 0 0 3L15 17a3 3 0 1 0 3-1z"/></svg>'
  };
  var players = [];

  function fmt(s) {
    if (!isFinite(s) || s < 0) s = 0;
    s = Math.floor(s);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function seeded(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return function () { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function init(el) {
    if (el.getAttribute('data-ready')) return;
    el.setAttribute('data-ready', '1');
    var d = el.dataset, src = d.src;
    if (!src) return;
    var title = d.title || 'Turkey Brief Daily', url = d.url || location.href;
    var rnd = seeded(src), bars = '';
    for (var i = 0; i < BARS; i++) {
      var v = 0.22 + 0.78 * Math.abs(Math.sin(i / 4.3 + rnd() * 2)) * (0.55 + 0.45 * rnd());
      bars += '<span style="height:' + Math.round(v * 100) + '%"></span>';
    }
    el.innerHTML = '<div class="tbp-in">' +
      '<div class="tbp-art">' + (d.cover ? '<img alt="" src="' + esc(d.cover) + '" loading="lazy">' : '') +
      '<div class="tbp-eq"><i></i><i></i><i></i><i></i></div></div>' +
      '<div class="tbp-body"><div class="tbp-eyebrow">Turkey Brief Daily</div>' +
      '<div class="tbp-title">' + (d.link ? '<a href="' + esc(d.link) + '">' + esc(title) + '</a>' : esc(title)) + '</div>' +
      '<div class="tbp-meta">' + esc(d.date || '') + (d.duration ? ' · ' + esc(d.duration) : '') + '</div>' +
      '<div class="tbp-wave" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' + bars + '</div>' +
      '<div class="tbp-time"><span class="tbp-cur">0:00</span><span class="tbp-dur">' + esc(d.duration || '--:--') + '</span></div>' +
      '<div class="tbp-ctrl">' +
      '<button type="button" class="tbp-back" aria-label="Back 15 seconds">' + I.back + '</button>' +
      '<button type="button" class="tbp-play" aria-label="Play">' + I.play + '</button>' +
      '<button type="button" class="tbp-fwd" aria-label="Forward 30 seconds">' + I.fwd + '</button>' +
      '<span class="tbp-spacer"></span>' +
      '<button type="button" class="tbp-speed" aria-label="Playback speed">1×</button>' +
      '<button type="button" class="tbp-share" aria-label="Share">' + I.share + '<span>Share</span></button>' +
      '<a class="tbp-btn tbp-dl" href="' + esc(src) + '" download aria-label="Download MP3">' + I.dl + '<span>MP3</span></a>' +
      '</div></div></div><div class="tbp-toast"></div>';

    var a = new Audio();
    a.preload = 'none';
    a.src = src;
    var $ = function (s) { return el.querySelector(s); };
    var play = $('.tbp-play'), wave = $('.tbp-wave'), spans = wave.children, cur = $('.tbp-cur'), dur = $('.tbp-dur'),
        speed = $('.tbp-speed'), toast = $('.tbp-toast'), si = 0, lastOn = -1;

    function say(t) { toast.textContent = t; toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { toast.classList.remove('show'); }, 1400); }
    function paint() {
      var p = a.duration ? a.currentTime / a.duration : 0, on = Math.round(p * BARS);
      if (on !== lastOn) { for (var i = 0; i < BARS; i++) spans[i].classList.toggle('on', i < on); lastOn = on; }
      cur.textContent = fmt(a.currentTime);
      wave.setAttribute('aria-valuenow', Math.round(p * 100));
    }
    function setIcon() {
      var playing = !a.paused;
      el.classList.toggle('is-playing', playing);
      play.innerHTML = el.classList.contains('is-loading') ? I.load : (playing ? I.pause : I.play);
      play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    }
    function toggle() {
      if (a.paused) {
        players.forEach(function (o) { if (o !== a) o.pause(); });
        el.classList.add('is-loading'); setIcon();
        var pr = a.play();
        if (pr && pr.catch) pr.catch(function () { el.classList.remove('is-loading'); setIcon(); });
      } else a.pause();
    }
    function seekTo(clientX) {
      var r = wave.getBoundingClientRect(), p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      if (a.duration) { a.currentTime = p * a.duration; paint(); }
      else { a.preload = 'metadata'; a.addEventListener('loadedmetadata', function f() { a.removeEventListener('loadedmetadata', f); a.currentTime = p * a.duration; paint(); }); a.load(); }
    }

    play.addEventListener('click', toggle);
    $('.tbp-back').addEventListener('click', function () { a.currentTime = Math.max(0, a.currentTime - 15); paint(); });
    $('.tbp-fwd').addEventListener('click', function () { a.currentTime = Math.min(a.duration || 0, a.currentTime + 30); paint(); });
    speed.addEventListener('click', function () { si = (si + 1) % SPEEDS.length; a.playbackRate = SPEEDS[si]; speed.textContent = SPEEDS[si] + '×'; });
    $('.tbp-share').addEventListener('click', function () {
      if (navigator.share) navigator.share({ title: title, url: url }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { say('Link copied'); });
    });

    var dragging = false;
    wave.addEventListener('pointerdown', function (e) { dragging = true; wave.setPointerCapture(e.pointerId); seekTo(e.clientX); });
    wave.addEventListener('pointermove', function (e) {
      var r = wave.getBoundingClientRect(), h = Math.floor((e.clientX - r.left) / r.width * BARS);
      for (var i = 0; i < BARS; i++) spans[i].classList.toggle('hov', i <= h);
      if (dragging) seekTo(e.clientX);
    });
    wave.addEventListener('pointerup', function () { dragging = false; });
    wave.addEventListener('pointerleave', function () { for (var i = 0; i < BARS; i++) spans[i].classList.remove('hov'); });
    wave.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { a.currentTime += 5; e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { a.currentTime -= 5; e.preventDefault(); }
      else if (e.key === ' ' || e.key === 'Enter') { toggle(); e.preventDefault(); }
      paint();
    });

    a.addEventListener('loadedmetadata', function () { dur.textContent = fmt(a.duration); });
    a.addEventListener('timeupdate', paint);
    a.addEventListener('playing', function () { el.classList.remove('is-loading'); setIcon(); });
    a.addEventListener('waiting', function () { el.classList.add('is-loading'); setIcon(); });
    a.addEventListener('pause', setIcon);
    a.addEventListener('ended', function () { a.currentTime = 0; paint(); setIcon(); });
    a.addEventListener('error', function () { el.classList.remove('is-loading'); setIcon(); say('Audio could not be loaded'); });
    a.addEventListener('play', function () {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({ title: title, artist: 'Turkey Brief Daily', album: 'Turkey Brief',
          artwork: d.cover ? [{ src: d.cover, sizes: '512x512', type: 'image/jpeg' }] : [] });
        navigator.mediaSession.setActionHandler('seekbackward', function () { a.currentTime -= 15; });
        navigator.mediaSession.setActionHandler('seekforward', function () { a.currentTime += 30; });
      }
    });
    players.push(a);
  }

  function scan() { var els = document.querySelectorAll('.tbp'); for (var i = 0; i < els.length; i++) init(els[i]); }
  window.TBPlayer = { scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
