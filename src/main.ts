import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index' // Cambiado de indexBorrar a index
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css' // Importante: añadir los estilos
import { useAuthStore } from './stores/authStore'
import { BackgroundTaskService } from './services/BackgroundTaskService'
import { NotificationService } from './services/NotificationService'
import { createPinia } from 'pinia'
import type { ComponentPublicInstance } from 'vue'
import './style.css'

// Agregar configuración de íconos para Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

let appInstance: ComponentPublicInstance | null = null; // Para controlar si la app ya está montada

const initializeApp = async () => {
  try {
    // Crear la aplicación y configurar plugins
    const app = createApp(App);
    const pinia = createPinia();
    
    // Configurar Toast antes de otros plugins
    app.use(Toast, {
      position: "top-right",
      timeout: 3000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: "button",
      icon: true,
      rtl: false,
      transition: "Vue-Toastification__bounce",
      maxToasts: 5,
      newestOnTop: true
    });

    app.use(pinia);
    app.use(router);

    // Inicializar autenticación
    const authStore = useAuthStore();
    try {
      await authStore.initializeAuth();
    } catch (authError) {
      console.error("Error initializing auth:", authError);
      // Se podría redirigir a una página de error o notificar al usuario
      return; // Se detiene la inicialización
    }

    // Esperar a que el router esté listo
    try {
      await router.isReady();
    } catch (routerError) {
      console.error("Error waiting for router to be ready:", routerError);
      return;
    }

    // Solicitar permiso para notificaciones
    const notificationService = NotificationService.getInstance();
    try {
      await notificationService.requestNotificationPermission();
    } catch (notificationError) {
      console.warn("Error requesting notification permission:", notificationError);
      // Error no crítico, se continúa
    }

    // Iniciar tareas en segundo plano
    const backgroundTaskService = BackgroundTaskService.getInstance();
    backgroundTaskService.startMonitoring();

    // Montar la aplicación si aún no está montada
    if (!appInstance) {
      try {
        appInstance = app.mount('#app');
      } catch (mountError) {
        console.error("Error mounting app:", mountError);
        return;
      }
    }
  } catch (error) {
    console.error('Error durante la inicialización:', error);
  }
};

initializeApp();

// Registrar el service worker si es compatible
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration);
      })
      .catch(err => {
        console.error('Error al registrar el Service Worker:', err);
      });
  });
}

router.isReady()
  .catch((e) => {
    console.error("Error al montar la aplicación:", e);
  });
