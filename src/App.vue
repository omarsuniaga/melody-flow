<template>
  <!-- Si la autenticación está inicializada, se muestra el contenido principal (RouterView);
       de lo contrario, se muestra un spinner de carga -->
  <div v-if="authStore.initialized">
    <RouterView />
  </div>
  <div v-else class="min-h-screen flex items-center justify-center">
    <!-- Spinner de carga -->
    <div
      class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
    ></div>
  </div>
</template>

<script setup lang="ts">
/**
 * Para identificar el componente en las herramientas de depuración y linters,
 * usamos defineOptions para asignarle un nombre.
 * Nota: Esto requiere Vue 3.3 o superior.
 */
defineOptions({ name: "App" });

import { onMounted, onUnmounted } from "vue";
import { RouterView } from "vue-router";
import { useAuthStore } from "./stores/authStore";
import { useEventStore } from "./stores/eventStore";
import { NotificationService } from "./services/NotificationService";

// Instanciar los stores de autenticación y eventos
const authStore = useAuthStore();
const eventStore = useEventStore();

/**
 * Inicializa la autenticación.
 * Nota: Si ya se inicializa la autenticación en main.ts, verifica que no se
 * duplique la llamada para evitar inicializaciones redundantes.
 */
authStore.initializeAuth();

onMounted(async () => {
  // Obtener los eventos desde el store de eventos
  try {
    await eventStore.fetchEvents();
  } catch (error) {
    console.error("Error al obtener los eventos:", error);
  }

  // Iniciar el monitoreo de notificaciones utilizando el patrón singleton
  const notificationService = NotificationService.getInstance();
  try {
    notificationService.startMonitoring();
  } catch (error) {
    console.error("Error al iniciar el monitoreo de notificaciones:", error);
  }
});

onUnmounted(() => {
  // Detener el monitoreo de notificaciones al desmontar el componente
  const notificationService = NotificationService.getInstance();
  notificationService.stopMonitoring();
});
</script>

<style scoped>
/* Estilos específicos para el componente App.vue */
</style>
