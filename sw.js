// Este es un archivo de ejemplo de Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Puedes agregar lógica de instalación aquí
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Puedes agregar lógica de activación aquí
});

self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  // Puedes agregar lógica de manejo de fetch aquí
});


// Agregar manejo de notificaciones
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data && event.notification.data.eventId) {
    const urlToOpen = new URL(`/calendar?event=${event.notification.data.eventId}`, self.location.origin);

    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(windowClients => {
        // Si hay una ventana abierta, úsala
        for (const client of windowClients) {
          if (client.url === urlToOpen.href && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abre una nueva
        return self.clients.openWindow(urlToOpen.href);
      })
    );
  }
});

// Agregar manejo de sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-events') {
    event.waitUntil(checkUpcomingEvents());
  }
});

// Define the checkUpcomingEvents function
function checkUpcomingEvents() {
  // Add your logic to check upcoming events here
  return new Promise((resolve) => {
    // Simulate async operation
    setTimeout(() => {
      console.log('Checking upcoming events...');
      resolve();
    }, 1000);
  });
}
const CACHE_NAME = 'v1';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/assets/main.css'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(networkFirst(e.request));
  } else {
    e.respondWith(cacheFirst(e.request));
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached ?? fetch(request);
}

async function networkFirst(request) {
  const cache = await caches.open('api-cache');
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    return cache.match(request);
  }
}