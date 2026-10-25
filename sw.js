/*
  sw.js – OPTIONAL offline helper ("service worker").
  Only used when the game is opened from a web server (https:// or
  http://localhost). It saves all game files in the browser the first
  time, so the game also starts later without internet.
  When you open index.html directly from the disk, this file is not used
  (and not needed: everything is already on your disk).

  If you change any game file, change the number in CACHE below so
  browsers fetch the new version.
*/
var CACHE = 'borno-v2';

var FILES = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'assets/letters.js',
  'assets/strings.js',
  'assets/fonts/BalooDa2.ttf',
  'assets/images/icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(FILES); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  // remove old versions of the cache
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
                           .map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  // cached file first; otherwise load it and keep a copy (e.g. new sound files)
  event.respondWith(caches.match(event.request).then(function (hit) {
    return hit || fetch(event.request).then(function (res) {
      if (res && res.ok && new URL(event.request.url).origin === self.location.origin) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
      }
      return res;
    });
  }));
});
