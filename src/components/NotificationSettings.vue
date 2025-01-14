<template>
  <div class="space-y-4">
    <h3 class="text-lg font-medium">Configuración de Notificaciones</h3>

    <div class="space-y-2">
      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          v-model="settings.enabled"
          class="form-checkbox"
          @change="saveSettings"
        />
        <span>Activar notificaciones</span>
      </label>

      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          v-model="settings.sound"
          class="form-checkbox"
          :disabled="!settings.enabled"
          @change="saveSettings"
        />
        <span>Sonido</span>
      </label>

      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          v-model="settings.vibration"
          class="form-checkbox"
          :disabled="!settings.enabled"
          @change="saveSettings"
        />
        <span>Vibración</span>
      </label>

      <!-- Eliminar o ajustar la referencia a 'threshold' -->
      <!-- Por ejemplo: <input v-model="settings.threshold" /> para comentarlo o quitarlo -->
    </div>

    <div class="mt-4">
      <ButtonComponent
        variant="secondary"
        @click="testNotification"
        :disabled="!settings.enabled"
      >
        Probar Notificación
      </ButtonComponent>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useSettingsStore } from "../stores/settingsStore";
import { NotificationService } from "../services/NotificationService";
import ButtonComponent from "./ButtonComponent.vue";

const settingsStore = useSettingsStore();
const settings = ref(settingsStore.notificationSettings);

function saveSettings() {
  settingsStore.updateNotificationSettings(settings.value);
}

async function testNotification() {
  const notificationService = NotificationService.getInstance();
  await notificationService.testNotification();
}

onMounted(async () => {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      settings.value.enabled = true;
      saveSettings();
    }
  }
});
</script>
