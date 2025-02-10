// vite.config.ts
import { defineConfig } from "file:///C:/Users/Admin/Desktop/MELODYFLOW-V2/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/Admin/Desktop/MELODYFLOW-V2/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { VitePWA } from "file:///C:/Users/Admin/Desktop/MELODYFLOW-V2/node_modules/vite-plugin-pwa/dist/index.js";
import { fileURLToPath, URL } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Admin/Desktop/MELODYFLOW-V2/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png"
      ],
      manifest: {
        name: "Modern Calendar",
        short_name: "Calendar",
        description: "A modern calendar application",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff"
        // Eliminar la propiedad screenshots
      },
      // Se añade configuración adicional para workbox (caching offline)
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/api\//,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300
              }
            }
          }
        ],
        maximumFileSizeToCacheInBytes: 3e6
        // Aumentamos a 3MB
      }
    })
  ],
  server: {
    port: 5173,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Resource-Policy": "cross-origin",
      // Unifica las directivas CSP en una sola
      "Content-Security-Policy": "default-src 'self' https://*.firebaseapp.com https://*.googleapis.com; frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://api.exchangerate-api.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://apis.google.com https://*.firebaseapp.com https://*.googleapis.com https://www.googletagmanager.com;"
    },
    proxy: {
      "/auth": {
        target: "https://accounts.google.com",
        changeOrigin: true,
        secure: false,
        ws: true
      },
      "/auth/iframe": {
        target: "https://accounts.google.com",
        changeOrigin: true,
        secure: true
      },
      "/apis": {
        target: "https://apis.google.com",
        changeOrigin: true,
        secure: true,
        headers: {
          "Access-Control-Allow-Origin": "*"
        }
      },
      "/gtag": {
        target: "https://www.googletagmanager.com",
        changeOrigin: true,
        secure: true
      },
      "/firebase": {
        target: "https://firestore.googleapis.com",
        changeOrigin: true,
        secure: true,
        headers: {
          "Cross-Origin-Resource-Policy": "cross-origin"
        }
      },
      "/v1alpha": {
        target: "https://firebase.googleapis.com",
        changeOrigin: true,
        secure: true,
        configure: (proxy, options) => {
          proxy.on("proxyReq", (proxyReq, req, res) => {
            proxyReq.setHeader("Origin", "https://firebase.googleapis.com");
          });
        }
      },
      "/google.firestore.v1.Firestore": {
        target: "https://firestore.googleapis.com",
        changeOrigin: true,
        secure: true
      }
    }
  },
  resolve: {
    extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".vue", ".css"],
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url)),
      "@assets": fileURLToPath(new URL("./src/assets", __vite_injected_original_import_meta_url)),
      "@components": fileURLToPath(new URL("./src/components", __vite_injected_original_import_meta_url))
    }
  },
  optimizeDeps: {
    include: ["@vuepic/vue-datepicker"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor": [
            "vue",
            "vue-router",
            "pinia",
            "date-fns"
          ],
          "ui": [
            "@heroicons/vue",
            "@headlessui/vue"
          ],
          // Dividir el PDF en chunks más pequeños
          "pdf-core": ["pdfmake/build/pdfmake"],
          "pdf-fonts": ["pdfmake/build/vfs_fonts"],
          "firebase-core": ["firebase/app"],
          "firebase-auth": ["firebase/auth"],
          "firebase-firestore": ["firebase/firestore"],
          "leaflet": ["leaflet"],
          "calendar-components": [
            "./src/components/MonthSelector.vue",
            "./src/components/EventsMetrics.vue"
          ],
          "analytics-components": [
            "./src/components/ProviderBreakdown.vue",
            "./src/components/ProviderDistribution.vue"
          ],
          "dashboard-components": [
            "./src/components/LocationsPanel.vue",
            "./src/components/TotalEventsPanel.vue",
            "./src/components/AverageEventPanel.vue"
          ],
          "utils": [
            "./src/utils/helpers.ts",
            "./src/utils/icons.ts",
            "./src/utils/pdfMakeConfig.ts",
            "./src/utils/pdfTemplates.ts"
          ]
        },
        // Configurar el nombre de los chunks generados
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]"
      }
    },
    chunkSizeWarningLimit: 1500,
    // Aumentamos el límite
    sourcemap: true,
    outDir: "dist"
  },
  envPrefix: "VITE_",
  assetsInclude: ["**/*.svg"]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxBZG1pblxcXFxEZXNrdG9wXFxcXE1FTE9EWUZMT1ctVjJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEFkbWluXFxcXERlc2t0b3BcXFxcTUVMT0RZRkxPVy1WMlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQWRtaW4vRGVza3RvcC9NRUxPRFlGTE9XLVYyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcbmltcG9ydCB7IGZpbGVVUkxUb1BhdGgsIFVSTCB9IGZyb20gJ25vZGU6dXJsJ1xyXG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSAncGF0aCdcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCdcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XHJcbiAgcGx1Z2luczogW1xyXG4gICAgdnVlKCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXHJcbiAgICAgIGluY2x1ZGVBc3NldHM6IFtcclxuICAgICAgICAnZmF2aWNvbi5pY28nLFxyXG4gICAgICAgICdhcHBsZS10b3VjaC1pY29uLnBuZycsXHJcbiAgICAgICAgJ2ljb25zL2ljb24tMTkyLnBuZycsXHJcbiAgICAgICAgJ2ljb25zL2ljb24tNTEyLnBuZydcclxuICAgICAgXSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiAnTW9kZXJuIENhbGVuZGFyJyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnQ2FsZW5kYXInLFxyXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQSBtb2Rlcm4gY2FsZW5kYXIgYXBwbGljYXRpb24nLFxyXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnI2ZmZmZmZicsXHJcbiAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL2ljb25zL2ljb24tMTkyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICcvaWNvbnMvaWNvbi01MTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcclxuICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxyXG4gICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2ZmZmZmZidcclxuICAgICAgICAvLyBFbGltaW5hciBsYSBwcm9waWVkYWQgc2NyZWVuc2hvdHNcclxuICAgICAgfSxcclxuICAgICAgLy8gU2UgYVx1MDBGMWFkZSBjb25maWd1cmFjaVx1MDBGM24gYWRpY2lvbmFsIHBhcmEgd29ya2JveCAoY2FjaGluZyBvZmZsaW5lKVxyXG4gICAgICB3b3JrYm94OiB7XHJcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdXJsUGF0dGVybjogL1xcL2FwaVxcLy8sXHJcbiAgICAgICAgICAgIGhhbmRsZXI6ICdOZXR3b3JrRmlyc3QnLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnYXBpLWNhY2hlJyxcclxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiA1MCxcclxuICAgICAgICAgICAgICAgIG1heEFnZVNlY29uZHM6IDMwMFxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgbWF4aW11bUZpbGVTaXplVG9DYWNoZUluQnl0ZXM6IDMwMDAwMDAgLy8gQXVtZW50YW1vcyBhIDNNQlxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gIF0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgaGVhZGVyczoge1xyXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxyXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctTWV0aG9kcyc6ICdHRVQsIFBPU1QsIFBVVCwgREVMRVRFLCBPUFRJT05TJyxcclxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlLCBBdXRob3JpemF0aW9uLCBYLVJlcXVlc3RlZC1XaXRoJyxcclxuICAgICAgJ0Nyb3NzLU9yaWdpbi1PcGVuZXItUG9saWN5JzogJ3NhbWUtb3JpZ2luLWFsbG93LXBvcHVwcycsXHJcbiAgICAgICdDcm9zcy1PcmlnaW4tRW1iZWRkZXItUG9saWN5JzogJ3Vuc2FmZS1ub25lJyxcclxuICAgICAgJ0Nyb3NzLU9yaWdpbi1SZXNvdXJjZS1Qb2xpY3knOiAnY3Jvc3Mtb3JpZ2luJyxcclxuICAgICAgLy8gVW5pZmljYSBsYXMgZGlyZWN0aXZhcyBDU1AgZW4gdW5hIHNvbGFcclxuICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzogXCJkZWZhdWx0LXNyYyAnc2VsZicgaHR0cHM6Ly8qLmZpcmViYXNlYXBwLmNvbSBodHRwczovLyouZ29vZ2xlYXBpcy5jb207IGZyYW1lLXNyYyAnc2VsZicgaHR0cHM6Ly8qLmZpcmViYXNlYXBwLmNvbSBodHRwczovLyouZ29vZ2xlYXBpcy5jb207IGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczovLyouZmlyZWJhc2Vpby5jb20gaHR0cHM6Ly8qLmdvb2dsZWFwaXMuY29tIHdzczovLyouZmlyZWJhc2Vpby5jb20gaHR0cHM6Ly9hcGkuZXhjaGFuZ2VyYXRlLWFwaS5jb207IGltZy1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOjsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZSc7IHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2FwaXMuZ29vZ2xlLmNvbSBodHRwczovLyouZmlyZWJhc2VhcHAuY29tIGh0dHBzOi8vKi5nb29nbGVhcGlzLmNvbSBodHRwczovL3d3dy5nb29nbGV0YWdtYW5hZ2VyLmNvbTtcIlxyXG4gICAgfSxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgICcvYXV0aCc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20nLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIHdzOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgICcvYXV0aC9pZnJhbWUnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hY2NvdW50cy5nb29nbGUuY29tJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiB0cnVlXHJcbiAgICAgIH0sXHJcbiAgICAgICcvYXBpcyc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaXMuZ29vZ2xlLmNvbScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogdHJ1ZSxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAnL2d0YWcnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly93d3cuZ29vZ2xldGFnbWFuYWdlci5jb20nLFxyXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICBzZWN1cmU6IHRydWVcclxuICAgICAgfSxcclxuICAgICAgJy9maXJlYmFzZSc6IHtcclxuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2ZpcmVzdG9yZS5nb29nbGVhcGlzLmNvbScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogdHJ1ZSxcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAnQ3Jvc3MtT3JpZ2luLVJlc291cmNlLVBvbGljeSc6ICdjcm9zcy1vcmlnaW4nXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAnL3YxYWxwaGEnOiB7XHJcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9maXJlYmFzZS5nb29nbGVhcGlzLmNvbScsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogdHJ1ZSxcclxuICAgICAgICBjb25maWd1cmU6IChwcm94eSwgb3B0aW9ucykgPT4ge1xyXG4gICAgICAgICAgcHJveHkub24oJ3Byb3h5UmVxJywgKHByb3h5UmVxLCByZXEsIHJlcykgPT4ge1xyXG4gICAgICAgICAgICBwcm94eVJlcS5zZXRIZWFkZXIoJ09yaWdpbicsICdodHRwczovL2ZpcmViYXNlLmdvb2dsZWFwaXMuY29tJylcclxuICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICAnL2dvb2dsZS5maXJlc3RvcmUudjEuRmlyZXN0b3JlJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vZmlyZXN0b3JlLmdvb2dsZWFwaXMuY29tJyxcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9LFxyXG4gIHJlc29sdmU6IHtcclxuICAgIGV4dGVuc2lvbnM6IFsnLmpzJywgJy50cycsICcuanN4JywgJy50c3gnLCAnLmpzb24nLCAnLnZ1ZScsICcuY3NzJ10sXHJcbiAgICBhbGlhczoge1xyXG4gICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcclxuICAgICAgJ0Bhc3NldHMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL2Fzc2V0cycsIGltcG9ydC5tZXRhLnVybCkpLFxyXG4gICAgICAnQGNvbXBvbmVudHMnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjL2NvbXBvbmVudHMnLCBpbXBvcnQubWV0YS51cmwpKVxyXG4gICAgfVxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbJ0B2dWVwaWMvdnVlLWRhdGVwaWNrZXInXVxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XHJcbiAgICAgICAgICAndmVuZG9yJzogW1xyXG4gICAgICAgICAgICAndnVlJyxcclxuICAgICAgICAgICAgJ3Z1ZS1yb3V0ZXInLFxyXG4gICAgICAgICAgICAncGluaWEnLFxyXG4gICAgICAgICAgICAnZGF0ZS1mbnMnXHJcbiAgICAgICAgICBdLFxyXG4gICAgICAgICAgJ3VpJzogW1xyXG4gICAgICAgICAgICAnQGhlcm9pY29ucy92dWUnLFxyXG4gICAgICAgICAgICAnQGhlYWRsZXNzdWkvdnVlJ1xyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgIC8vIERpdmlkaXIgZWwgUERGIGVuIGNodW5rcyBtXHUwMEUxcyBwZXF1ZVx1MDBGMW9zXHJcbiAgICAgICAgICAncGRmLWNvcmUnOiBbJ3BkZm1ha2UvYnVpbGQvcGRmbWFrZSddLFxyXG4gICAgICAgICAgJ3BkZi1mb250cyc6IFsncGRmbWFrZS9idWlsZC92ZnNfZm9udHMnXSxcclxuICAgICAgICAgICdmaXJlYmFzZS1jb3JlJzogWydmaXJlYmFzZS9hcHAnXSxcclxuICAgICAgICAgICdmaXJlYmFzZS1hdXRoJzogWydmaXJlYmFzZS9hdXRoJ10sXHJcbiAgICAgICAgICAnZmlyZWJhc2UtZmlyZXN0b3JlJzogWydmaXJlYmFzZS9maXJlc3RvcmUnXSxcclxuICAgICAgICAgICdsZWFmbGV0JzogWydsZWFmbGV0J10sXHJcbiAgICAgICAgICAnY2FsZW5kYXItY29tcG9uZW50cyc6IFtcclxuICAgICAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvTW9udGhTZWxlY3Rvci52dWUnLFxyXG4gICAgICAgICAgICAnLi9zcmMvY29tcG9uZW50cy9FdmVudHNNZXRyaWNzLnZ1ZSdcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICAnYW5hbHl0aWNzLWNvbXBvbmVudHMnOiBbXHJcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL1Byb3ZpZGVyQnJlYWtkb3duLnZ1ZScsXHJcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL1Byb3ZpZGVyRGlzdHJpYnV0aW9uLnZ1ZSdcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgICAnZGFzaGJvYXJkLWNvbXBvbmVudHMnOiBbXHJcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL0xvY2F0aW9uc1BhbmVsLnZ1ZScsXHJcbiAgICAgICAgICAgICcuL3NyYy9jb21wb25lbnRzL1RvdGFsRXZlbnRzUGFuZWwudnVlJyxcclxuICAgICAgICAgICAgJy4vc3JjL2NvbXBvbmVudHMvQXZlcmFnZUV2ZW50UGFuZWwudnVlJ1xyXG4gICAgICAgICAgXSxcclxuICAgICAgICAgICd1dGlscyc6IFtcclxuICAgICAgICAgICAgJy4vc3JjL3V0aWxzL2hlbHBlcnMudHMnLFxyXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvaWNvbnMudHMnLFxyXG4gICAgICAgICAgICAnLi9zcmMvdXRpbHMvcGRmTWFrZUNvbmZpZy50cycsXHJcbiAgICAgICAgICAgICcuL3NyYy91dGlscy9wZGZUZW1wbGF0ZXMudHMnXHJcbiAgICAgICAgICBdXHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBDb25maWd1cmFyIGVsIG5vbWJyZSBkZSBsb3MgY2h1bmtzIGdlbmVyYWRvc1xyXG4gICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnYXNzZXRzL2pzL1tuYW1lXS1baGFzaF0uanMnLFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiAnYXNzZXRzL1tleHRdL1tuYW1lXS1baGFzaF0uW2V4dF0nXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDE1MDAsIC8vIEF1bWVudGFtb3MgZWwgbFx1MDBFRG1pdGVcclxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcclxuICAgIG91dERpcjogJ2Rpc3QnXHJcbiAgfSxcclxuICBlbnZQcmVmaXg6ICdWSVRFXycsXHJcbiAgYXNzZXRzSW5jbHVkZTogWycqKi8qLnN2ZyddXHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBd1MsU0FBUyxvQkFBb0I7QUFDclUsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZTtBQUN4QixTQUFTLGVBQWUsV0FBVztBQUhzSixJQUFNLDJDQUEyQztBQU8xTyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxlQUFlO0FBQUEsUUFDYjtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxRQUNaLGFBQWE7QUFBQSxRQUNiLGFBQWE7QUFBQSxRQUNiLE9BQU87QUFBQSxVQUNMO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFVBQ0E7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE9BQU87QUFBQSxZQUNQLE1BQU07QUFBQSxVQUNSO0FBQUEsUUFDRjtBQUFBLFFBQ0EsV0FBVztBQUFBLFFBQ1gsU0FBUztBQUFBLFFBQ1Qsa0JBQWtCO0FBQUE7QUFBQSxNQUVwQjtBQUFBO0FBQUEsTUFFQSxTQUFTO0FBQUEsUUFDUCxnQkFBZ0I7QUFBQSxVQUNkO0FBQUEsWUFDRSxZQUFZO0FBQUEsWUFDWixTQUFTO0FBQUEsWUFDVCxTQUFTO0FBQUEsY0FDUCxXQUFXO0FBQUEsY0FDWCxZQUFZO0FBQUEsZ0JBQ1YsWUFBWTtBQUFBLGdCQUNaLGVBQWU7QUFBQSxjQUNqQjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsK0JBQStCO0FBQUE7QUFBQSxNQUNqQztBQUFBLElBQ0YsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLCtCQUErQjtBQUFBLE1BQy9CLGdDQUFnQztBQUFBLE1BQ2hDLGdDQUFnQztBQUFBLE1BQ2hDLDhCQUE4QjtBQUFBLE1BQzlCLGdDQUFnQztBQUFBLE1BQ2hDLGdDQUFnQztBQUFBO0FBQUEsTUFFaEMsMkJBQTJCO0FBQUEsSUFDN0I7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLElBQUk7QUFBQSxNQUNOO0FBQUEsTUFDQSxnQkFBZ0I7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsVUFDUCwrQkFBK0I7QUFBQSxRQUNqQztBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxhQUFhO0FBQUEsUUFDWCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsVUFDUCxnQ0FBZ0M7QUFBQSxRQUNsQztBQUFBLE1BQ0Y7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFdBQVcsQ0FBQyxPQUFPLFlBQVk7QUFDN0IsZ0JBQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxLQUFLLFFBQVE7QUFDM0MscUJBQVMsVUFBVSxVQUFVLGlDQUFpQztBQUFBLFVBQ2hFLENBQUM7QUFBQSxRQUNIO0FBQUEsTUFDRjtBQUFBLE1BQ0Esa0NBQWtDO0FBQUEsUUFDaEMsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsWUFBWSxDQUFDLE9BQU8sT0FBTyxRQUFRLFFBQVEsU0FBUyxRQUFRLE1BQU07QUFBQSxJQUNsRSxPQUFPO0FBQUEsTUFDTCxLQUFLLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQ3BELFdBQVcsY0FBYyxJQUFJLElBQUksZ0JBQWdCLHdDQUFlLENBQUM7QUFBQSxNQUNqRSxlQUFlLGNBQWMsSUFBSSxJQUFJLG9CQUFvQix3Q0FBZSxDQUFDO0FBQUEsSUFDM0U7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsd0JBQXdCO0FBQUEsRUFDcEM7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxVQUNaLFVBQVU7QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsTUFBTTtBQUFBLFlBQ0o7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBO0FBQUEsVUFFQSxZQUFZLENBQUMsdUJBQXVCO0FBQUEsVUFDcEMsYUFBYSxDQUFDLHlCQUF5QjtBQUFBLFVBQ3ZDLGlCQUFpQixDQUFDLGNBQWM7QUFBQSxVQUNoQyxpQkFBaUIsQ0FBQyxlQUFlO0FBQUEsVUFDakMsc0JBQXNCLENBQUMsb0JBQW9CO0FBQUEsVUFDM0MsV0FBVyxDQUFDLFNBQVM7QUFBQSxVQUNyQix1QkFBdUI7QUFBQSxZQUNyQjtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSx3QkFBd0I7QUFBQSxZQUN0QjtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsVUFDQSx3QkFBd0I7QUFBQSxZQUN0QjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBLFVBQ0EsU0FBUztBQUFBLFlBQ1A7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBO0FBQUEsUUFFQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLHVCQUF1QjtBQUFBO0FBQUEsSUFDdkIsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFdBQVc7QUFBQSxFQUNYLGVBQWUsQ0FBQyxVQUFVO0FBQzVCLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
