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
  }
});
