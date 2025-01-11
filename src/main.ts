import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth before mounting the app
const authStore = useAuthStore()
authStore.initializeAuth().then(() => {
  app.mount('#app')
})