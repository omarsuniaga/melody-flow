import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png'
      ],
      manifest: {
        name: 'Modern Calendar',
        short_name: 'Calendar',
        description: 'A modern calendar application',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff'
        // Eliminar la propiedad screenshots
      },
      // Se añade configuración adicional para workbox (caching offline)
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300
              }
            }
          }
        ],
        maximumFileSizeToCacheInBytes: 3000000 // Aumentamos a 3MB
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Permite acceso desde otros dispositivos en la red local
    port: 5173,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'Content-Security-Policy': `
        default-src 'self';
        connect-src 'self' 
          https://*.firebaseio.com 
          https://*.googleapis.com 
          wss://*.firebaseio.com 
          https://*.firebaseapp.com
          https://api.exchangerate-api.com 
          https://nominatim.openstreetmap.org
          https://*.openstreetmap.org
          https://router.project-osrm.org
          https://*.project-osrm.org
          https://identitytoolkit.googleapis.com
          https://securetoken.googleapis.com
          https://www.googleapis.com;
        img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.googleusercontent.com;
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com https://www.gstatic.com;
        style-src 'self' 'unsafe-inline';
        frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://apis.google.com;
        font-src 'self' data: https://fonts.gstatic.com;
        worker-src 'self' blob:;
      `.replace(/\s+/g, ' ').trim()
    },
    proxy: {
      '/auth': {
        target: 'https://accounts.google.com',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/auth/iframe': {
        target: 'https://accounts.google.com',
        changeOrigin: true,
        secure: true
      },
      '/apis': {
        target: 'https://apis.google.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      },
      '/gtag': {
        target: 'https://www.googletagmanager.com',
        changeOrigin: true,
        secure: true
      },
      '/firebase': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: true,
        headers: {
          'Cross-Origin-Resource-Policy': 'cross-origin'
        }
      },
      '/v1alpha': {
        target: 'https://firebase.googleapis.com',
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.setHeader('Origin', 'https://firebase.googleapis.com')
          })
        }
      },
      '/google.firestore.v1.Firestore': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.css'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url))
    }
  },
  optimizeDeps: {
    include: ['@vuepic/vue-datepicker', 'pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'vue',
            'vue-router',
            'pinia',
            'date-fns'
          ],
          'ui': [
            '@heroicons/vue',
            '@headlessui/vue'
          ],
          // Dividir el PDF en chunks más pequeños
          'pdf-core': ['pdfmake/build/pdfmake'],
          'pdf-fonts': ['pdfmake/build/vfs_fonts'],
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'leaflet': ['leaflet'],
          'calendar-components': [
            './src/components/MonthSelector.vue',
            './src/components/EventsMetrics.vue'
          ],
          'analytics-components': [
            './src/components/ProviderBreakdown.vue',
            './src/components/ProviderDistribution.vue'
          ],
          'dashboard-components': [
            './src/components/LocationsPanel.vue',
            './src/components/TotalEventsPanel.vue',
            './src/components/AverageEventPanel.vue'
          ],
          'utils': [
            './src/utils/helpers.ts',
            './src/utils/icons.ts',
            './src/utils/pdfMakeConfig.ts',
            './src/utils/pdfTemplates.ts'
          ],
          pdfmake: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts']
        },
        // Configurar el nombre de los chunks generados
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1500, // Aumentamos el límite
    sourcemap: true,
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },
  envPrefix: 'VITE_',
  assetsInclude: ['**/*.svg']
})
