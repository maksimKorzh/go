self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('my-app-cache').then((cache) => {
      return cache.addAll([
        '/go/',
        '/go/manifest.json',
        '/go/index.html',
        '/go/js/tensorflow.js',
        '/go/js/goban.js',
        '/go/js/book.js',
        '/go/js/model.js',
        '/go/model/model.json',
        '/go/model/group1-shard1of1.bin',
        '/go/images/icon-192x192.png',
        '/go/images/icon-512x512.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
