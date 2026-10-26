/*
  sw.js – OPTIONAL offline helper ("service worker").
  Only used when the game is opened from a web server (https:// or
  http://localhost). It keeps a copy of all game files in the browser,
  so the game also starts later without internet.
  When you open index.html directly from the disk, this file is not used
  (and not needed: everything is already on your disk).

  How updates work (no number to change by hand any more):
  - "network first": when there is internet, the newest file is loaded
    (always checked with the server, never an old browser-cache copy)
    and the saved copy is replaced with it;
  - without internet (or if the network takes longer than 3 seconds),
    the saved copy is used.
  So after you upload a new version, phones get it the next time they
  open the game with internet.

  FILES must list every file index.html loads – the automatic tests
  check this (tests/e2e.js). Not listed on purpose: the 3 MB voice file of
  the kar game (assets/voice-computer-kar.js) – it is saved the first time
  that game is opened.
*/
var CACHE = 'borno';
var NETWORK_WAIT_MS = 3000;

var FILES = [
  './',
  'index.html',
  'style.css',
  'assets/letters.js',
  'assets/reading.js',
  'assets/strings.js',
  'assets/voices.js',
  'assets/voice-computer.js',
  'assets/strokes.js',
  'js/core.js',
  'js/progress.js',
  'js/games.js',
  'js/sound.js',
  'js/board.js',
  'js/ui.js',
  'js/parent.js',
  'js/main.js',
  'assets/fonts/BalooDa2.ttf',
  'assets/images/icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    // "reload" skips the browser's own HTTP cache, so we save fresh files
    return cache.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  // remove caches from older versions of this file (borno-v1, borno-v2, ...)
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                           .map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(new Promise(function (resolve) {
    var answered = false;
    var answer = function (res) { if (!answered) { answered = true; resolve(res); } };

    // slow network: use the saved copy (if there is one) after 3 seconds
    var timer = setTimeout(function () {
      caches.match(req, { ignoreSearch: true }).then(function (hit) { if (hit) answer(hit); });
    }, NETWORK_WAIT_MS);

    // "no-cache": always ask the server whether the file changed (cheap when it did
    // not). Without it the browser may give a 10-minute-old copy, and a phone could
    // run new and old game files mixed together.
    var fresh = req.mode === 'navigate' ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' })
                                        : new Request(req, { cache: 'no-cache' });
    fetch(fresh).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(req, copy); });
      }
      answer(res);
    }).catch(function () {
      // no internet: use the saved copy
      clearTimeout(timer);
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        answer(hit || new Response('Offline', { status: 503, statusText: 'Offline' }));
      });
    });
  }));
});
