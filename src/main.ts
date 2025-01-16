import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './style.css'
import router from './router'
import { useAuthStore } from './stores/authStore'
import Toast from "vue-toastification"
import "vue-toastification/dist/index.css"
import { BackgroundTaskService } from './services/BackgroundTaskService'
import { NotificationService } from './services/NotificationService'

const app = createApp(App)
const pinia = createPinia()
// Opciones para las notificaciones
const toastOptions = {
  position: "top-right",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: true,
  closeButton: "button",
  icon: true,
  rtl: false
}

app.use(pinia)
app.use(Toast, toastOptions)
app.use(router)

// Initialize services and auth
const authStore = useAuthStore()
const notificationService = NotificationService.getInstance()
const backgroundTaskService = BackgroundTaskService.getInstance()

authStore.initializeAuth().then(async () => {
    await notificationService.requestNotificationPermission()
    backgroundTaskService.startMonitoring()
    app.mount('#app')
})

// Register service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
    })
}
