const CACHE_NAME = 'melodyflow-v2';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/src/style.css',
  '/src/main.ts',
  '/src/App.vue',
  
];

// Instalación del SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)),
      // Forzar al SW a activarse inmediatamente
      self.skipWaiting()
    ])
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Tomar control inmediatamente
      self.clients.claim()
    ])
  );
});

// Manejo de peticiones con estrategia Cache First
self.addEventListener('fetch', (event) => {
  // Manejo especial para solicitudes POST
  if (event.request.method === 'POST') {
    // Si no hay conexión, encolar para sincronización posterior
    if (!navigator.onLine) {
      event.respondWith(
        (async () => {
          await saveForLater(event.request.clone());
          return new Response(JSON.stringify({
            offline: true,
            message: 'Datos guardados para sincronización posterior'
          }));
        })()
      );
      return;
    }
    return;
  }

  // Para peticiones GET, usar estrategia Cache First
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Actualizar cache en segundo plano
          fetchAndCache(event.request);
          return cachedResponse;
        }
        return fetchAndCache(event.request);
      })
      .catch(() => {
        // Si falla todo, mostrar página offline
        return caches.match(OFFLINE_URL);
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(
      (async () => {
        const pendingRequests = await getPendingRequests();
        for (const request of pendingRequests) {
          await sendToServer(request);
        }
      })()
    );
  }
});

async function fetchAndCache(request) {
  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

async function saveForLater(request) {
  const db = await openDatabase();
  const tx = db.transaction('pending', 'readwrite');
  const store = tx.objectStore('pending');
  await store.put(request);
  await tx.complete;
}

async function getPendingRequests() {
  const db = await openDatabase();
  const tx = db.transaction('pending', 'readonly');
  const store = tx.objectStore('pending');
  return await store.getAll();
}

async function sendToServer(request) {
  const response = await fetch(request);
  if (response.ok) {
    const db = await openDatabase();
    const tx = db.transaction('pending', 'readwrite');
    const store = tx.objectStore('pending');
    await store.delete(request);
    await tx.complete;
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('sync-db', 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('pending', { autoIncrement: true });
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}
