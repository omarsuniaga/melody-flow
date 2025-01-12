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
