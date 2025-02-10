import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfmake/build')) {
            return 'pdfmake';
          }
          // ...existing configuration if any...
        }
      }
    }
  }
});
