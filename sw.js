/* Service worker for the Life Ledger capture page.
 *
 * BUMP CACHE_VERSION ON EVERY CHANGE to any file in inbox/. A service worker
 * serves its cached copy indefinitely, so a stale version here means an
 * installed phone keeps running last month's page no matter how many times it
 * is reopened. This single constant is the only thing standing between a fix
 * and a phone that never sees it.
 */
var CACHE_VERSION = 'll-inbox-v2';
var ASSETS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE_VERSION).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  // Drop every older cache, then take over open pages immediately so a bumped
  // version applies on the next open rather than the one after it.
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE_VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  // Only the page's own assets are cached. The sync call must always hit the
  // network — a cached "success" would silently swallow a real note.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (resp) {
        return caches.open(CACHE_VERSION).then(function (c) { c.put(e.request, resp.clone()); return resp; });
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
