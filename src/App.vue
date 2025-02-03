<template>
  <div v-if="authStore.initialized">
    <RouterView />
  </div>
  <div v-else class="min-h-screen flex items-center justify-center">
    <div
      class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import { useAuthStore } from "./stores/authStore";
import { onMounted, onUnmounted } from "vue";
import { useEventStore } from "./stores/eventStore";
import { NotificationService } from "./services/NotificationService";

const authStore = useAuthStore();
const eventStore = useEventStore();

// Inicializar auth al montar la aplicación
authStore.initializeAuth();

onMounted(async () => {
  await eventStore.fetchEvents();
  const notificationService = NotificationService.getInstance();
  notificationService.startMonitoring();
});

onUnmounted(() => {
  const notificationService = NotificationService.getInstance();
  notificationService.stopMonitoring(); // Cambiado a stop
});
</script>
