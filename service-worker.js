self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('my-app-cache').then((cache) => {
      return cache.addAll([
        '/go/',
        '/go/manifest.json',
        '/go/index.html',
        '/go/analyzer.html',
        '/go/css/styles.css',
        '/go/js/tensorflow.js',
        '/go/js/goban.js',
        '/go/js/games_black.js',
        '/go/js/games_white.js',
        '/go/js/gui.js',
        '/go/js/main.js',
        '/go/model/kyu/model.json',
        '/go/model/kyu/group1-shard1of1.bin',
        '/go/model/dan/model.json',
        '/go/model/dan/group1-shard1of3.bin',
        '/go/model/dan/group1-shard2of3.bin',
        '/go/model/dan/group1-shard3of3.bin',
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
