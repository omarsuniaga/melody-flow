import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Modern Calendar',
        short_name: 'Calendar',
        description: 'A modern calendar application',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
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
        ]
      }
    })
  ],
  server: {
    port: 5173,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', // Cambiado para permitir popups
      'Cross-Origin-Embedder-Policy': 'unsafe-none', // O ajusta según tus necesidades
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    proxy: {
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
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'vue',
            'vue-router',
            'pinia',
            'date-fns'
          ],
          ui: [
            '@heroicons/vue',
            '@headlessui/vue'
          ],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    },
    chunkSizeWarningLimit: 800,
    sourcemap: true,
    outDir: 'dist'
  },
  envPrefix: 'VITE_'
})
