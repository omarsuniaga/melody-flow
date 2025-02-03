// Configuración del Service Worker
self.addEventListener('fetch', event => {
  // No interceptar solicitudes externas
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response(null, {
        status: 408,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});

// Agregar headers CORS a las respuestas
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Limpiar caches antiguos si es necesario
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    ])
  );
});
