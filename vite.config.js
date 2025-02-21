import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()], // se añade el plugin Vue
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    chunkSizeWarningLimit: 2000, // aumentar el límite a 1000 kB, ajustar según se requiera
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('pdfmake/build')) {
            return 'pdfmake';
          }
          // ...existing configuration if any...
        }
      },
      
      // Si se prefiere externalizar algún recurso, puede agregarse aquí:
      // external: ['@/assets/icons/icon-192x192.png']
    }
  }
});
