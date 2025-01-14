import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './style.css';
import router from './router';
import { useAuthStore } from './stores/authStore';
const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);
// Initialize auth before mounting the app
const authStore = useAuthStore();
authStore.initializeAuth().then(() => {
    app.mount('#app');
});
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}
