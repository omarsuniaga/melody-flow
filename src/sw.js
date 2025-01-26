const CACHE_NAME = 'melodyflow-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.endsWith('/share-target')) {
    event.respondWith((async () => {
      const formData = await event.request.formData();
      formData.get('name'); // 'title' is not used, so we just retrieve the value without assigning it
      formData.get('description');
      formData.get('link');

      // Procesar los datos compartidos y almacenarlos en IndexedDB o localStorage
      // ...

      return Response.redirect('/', 303);
    })());
  } else {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
