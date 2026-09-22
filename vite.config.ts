import { defineConfig, loadEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

function firebaseServiceWorkerPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'firebase-service-worker-replace',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/firebase-messaging-sw.js')
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8')
        content = content
          .replace('__VITE_FIREBASE_API_KEY__', env.VITE_FIREBASE_API_KEY || '')
          .replace('__VITE_FIREBASE_PROJECT_ID__', env.VITE_FIREBASE_PROJECT_ID || '')
          .replace('__VITE_FIREBASE_MESSAGING_SENDER_ID__', env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')
          .replace('__VITE_FIREBASE_APP_ID__', env.VITE_FIREBASE_APP_ID || '')
        fs.writeFileSync(swPath, content, 'utf-8')
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/firebase-messaging-sw.js') {
          const swPath = path.resolve(__dirname, 'public/firebase-messaging-sw.js')
          if (fs.existsSync(swPath)) {
            let content = fs.readFileSync(swPath, 'utf-8')
            content = content
              .replace('__VITE_FIREBASE_API_KEY__', env.VITE_FIREBASE_API_KEY || '')
              .replace('__VITE_FIREBASE_PROJECT_ID__', env.VITE_FIREBASE_PROJECT_ID || '')
              .replace('__VITE_FIREBASE_MESSAGING_SENDER_ID__', env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')
              .replace('__VITE_FIREBASE_APP_ID__', env.VITE_FIREBASE_APP_ID || '')
            res.setHeader('Content-Type', 'application/javascript')
            return res.end(content)
          }
        }
        next()
      })
    }
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      firebaseServiceWorkerPlugin(env),
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
  }
})
