import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// Ejemplo: si quieres usar path en Node 14 o anterior
// import path from 'path';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

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
      },
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
        maximumFileSizeToCacheInBytes: 3000000 // Cache de hasta 3MB
      }
    })
  ],

  server: {
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
      '/google.firestore.v1.Firestore': {
        target: 'https://firestore.googleapis.com',
        changeOrigin: true,
        secure: true
      }
    }
  },

  resolve: {
    // Puedes ajustar según tus necesidades
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.css'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@components': fileURLToPath(new URL('./src/components', import.meta.url))
    }
  },

  optimizeDeps: {
    include: [
      '@vuepic/vue-datepicker',
      'pdfmake/build/pdfmake',
      'pdfmake/build/vfs_fonts'
    ]
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Librerías principales
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
          // Chunks específicos de PDFMake
          'pdfmake': [
            'pdfmake/build/pdfmake',
            'pdfmake/build/vfs_fonts'
          ],
          // Firebase
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          // Leaflet
          'leaflet': ['leaflet'],
          // Ejemplo de componentes agrupados
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
          ]
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 1500, // Ajusta el límite de advertencia según tus necesidades
    sourcemap: true,             // Si no lo necesitas, cámbialo a false
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  },

  envPrefix: 'VITE_',
  assetsInclude: ['**/*.svg']
})
