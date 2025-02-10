<template>
  <div class="border rounded-lg overflow-hidden mb-4">
    <!-- Botón para alternar la visibilidad del panel -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
    >
      <h3 class="text-lg font-medium text-gray-900">Preferencias de Notificaciones</h3>
      <ChevronDownIcon
        :class="['h-5 w-5 transition-transform', open ? 'transform rotate-180' : '']"
      />
    </button>

    <div v-show="open" class="p-4 max-h-[70vh] overflow-y-auto">
      <!-- Sección: Configuración General -->
      <div class="space-y-4 mb-6">
        <h4 class="font-medium mb-4">Configuración General</h4>
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            v-model="settings.enabled"
            class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Activar Notificaciones</span>
        </label>
      </div>

      <!-- Sección: Configuración de Sonido -->
      <div class="space-y-4 mb-6">
        <h4 class="font-medium">Sonido de Notificación</h4>
        <!-- Menú desplegable para seleccionar un sonido preestablecido o personalizado -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Sonidos disponibles
          </label>
          <div class="relative">
            <!-- Botón del dropdown -->
            <button
              @click="toggleDropdown"
              class="w-full border border-gray-300 rounded-md px-4 py-2 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
            >
              <span>{{ selectedAudioName }}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <!-- Menú desplegable -->
            <transition name="fade">
              <div
                v-if="dropdownOpen"
                class="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200"
              >
                <ul>
                  <li
                    v-for="audio in allAudios"
                    :key="audio.path"
                    class="flex justify-between items-center px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    @click="selectAudio(audio)"
                  >
                    <span>{{ audio.name }}</span>
                    <!-- Botón Play para previsualizar sin cerrar el menú -->
                    <button
                      @click.stop="playAudio(audio.path)"
                      class="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      type="button"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M14.752 11.168l-5.197-3.034A1 1 0 008 9.028v5.944a1 1 0 001.555.832l5.197-3.034a1 1 0 000-1.664z"
                        />
                      </svg>
                      <span>Play</span>
                    </button>
                  </li>
                </ul>
              </div>
            </transition>
          </div>
        </div>
        <!-- Opción para subir sonido personalizado -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            O sube tu propio sonido
          </label>
          <input
            type="file"
            accept="audio/*"
            @change="handleAudioFileChange"
            class="mt-1 block w-full text-sm text-gray-500"
          />
        </div>
      </div>

      <!-- Sección: Configuración de Tiempos de Alerta -->
      <div class="space-y-4 mb-6">
        <h4 class="font-medium">Tiempos de Alerta</h4>
        <!-- Alarma Final -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">
            Alarma Final (minutos antes del evento)
          </label>
          <div class="mt-1 flex items-center gap-2">
            <input
              type="number"
              v-model="finalAlertMinutes"
              class="input w-24"
              min="15"
              step="15"
            />
            <button @click="updateFinalAlert" class="btn btn-secondary">
              Actualizar
            </button>
          </div>
        </div>
        <!-- Agregar alerta personalizada -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700">
            Agregar Alerta (horas antes del evento)
          </label>
          <div class="mt-1 flex items-center gap-2">
            <input
              type="number"
              v-model="newAlertHours"
              class="input w-24"
              min="1"
              step="1"
            />
            <button @click="addNewAlert" class="btn btn-secondary">Agregar</button>
          </div>
        </div>
        <!-- Lista de alertas configuradas -->
        <div class="space-y-2">
          <h4 class="font-medium text-gray-700">Alertas Configuradas</h4>
          <div
            v-for="alert in sortedAlerts"
            :key="alert.minutes + '-' + alert.type"
            class="flex items-center justify-between p-2 bg-gray-50 rounded"
          >
            <span>
              {{ formatAlertTime(alert.minutes) }}
              <span v-if="alert.isFinal" class="text-red-600 ml-2">(Alarma Final)</span>
            </span>
            <button
              v-if="!alert.isFinal"
              @click="removeAlert(alert.minutes)"
              class="text-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Sección: Pruebas del Sistema -->
      <div class="space-y-4">
        <h4 class="font-medium">Pruebas del Sistema</h4>
        <div class="flex flex-wrap gap-2">
          <button
            @click="startNotificationTest"
            class="btn btn-primary flex items-center gap-2"
            :disabled="isTesting"
          >
            <span>{{ isTesting ? `Probando en ${countdown}s` : "Probar Todo" }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";
import { notificationConfig } from "../config/notification";
import { useSettingsStore } from "../stores/settingsStore";

// --- Estado y Configuración ---
const open = ref(false);
const dropdownOpen = ref(false);
const settingsStore = useSettingsStore();
const settings = computed({
  get: () => settingsStore.notificationSettings,
  set: (newSettings) => settingsStore.updateNotificationSettings(newSettings),
});

// Variables para tiempos de alerta y configuración de sonido
const finalAlertMinutes = ref(60);
const newAlertHours = ref(2);

// Lista de audios preestablecidos (ubicados en /public/audios/)
const availableAudios = [
  { name: "Sound 0", path: "/audios/sound0.mp3" },
  { name: "Sound 1", path: "/audios/sound1.mp3" },
  { name: "Sound 2", path: "/audios/sound2.mp3" },
  { name: "Sound 3", path: "/audios/sound3.mp3" },
  { name: "Sound 4", path: "/audios/sound4.mp3" },
];

// Variable reactiva para audios personalizados subidos por el usuario.
const customAudios = ref<Array<{ name: string; path: string }>>([]);

// Propiedad computada que combina audios preestablecidos y personalizados.
const allAudios = computed(() => {
  return [...availableAudios, ...customAudios.value];
});

// Opción seleccionada (por defecto, se selecciona el primero)
const selectedAudio = ref(availableAudios[0].path);

// Computed para mostrar el nombre del audio seleccionado
const selectedAudioName = computed(() => {
  const found = allAudios.value.find((audio) => audio.path === selectedAudio.value);
  return found ? found.name : "Seleccionar sonido";
});

const isTesting = ref(false);
const countdown = ref(10);

// Computed: Ordena las alertas configuradas según la propiedad "minutes"
const sortedAlerts = computed(() => {
  return settings.value.alertTimes
    .map((alert) => ({
      ...alert,
      isFinal: alert.type === "final",
    }))
    .sort((a, b) => b.minutes - a.minutes);
});

// --- Funciones de Utilidad ---
function toggle() {
  open.value = !open.value;
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

/**
 * Selecciona un audio del listado y actualiza la configuración.
 */
function selectAudio(audio: { name: string; path: string }) {
  selectedAudio.value = audio.path;
  settingsStore.updateNotificationSettings({
    customAudioUrl: audio.path,
    sound: true,
  });
  dropdownOpen.value = false;
}

/**
 * Formatea los minutos a un formato legible (ej. "1h 30m").
 */
function formatAlertTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h${mins ? ` ${mins}m` : ""}` : `${mins}m`;
}

// --- Funciones para Actualizar Alarmas ---
function updateFinalAlert() {
  if (finalAlertMinutes.value < 15) {
    alert("La alarma final debe ser al menos 15 minutos antes del evento");
    return;
  }
  settingsStore.setDefaultFinalAlert(finalAlertMinutes.value);
}

function addNewAlert() {
  if (newAlertHours.value < 1) {
    alert("Las alertas deben ser al menos 1 hora antes del evento");
    return;
  }
  settingsStore.addCustomAlertTime(newAlertHours.value);
}

function removeAlert(minutes: number) {
  settingsStore.removeCustomAlertTime(minutes);
}

// --- Funciones de Configuración de Sonido ---

/**
 * Actualiza la configuración con la URL del audio seleccionado.
 * Se invoca automáticamente con el watcher sobre "selectedAudio".
 */
function handleDefaultSoundChange() {
  if (selectedAudio.value) {
    settingsStore.updateNotificationSettings({
      customAudioUrl: selectedAudio.value,
      sound: true,
    });
  }
}

/**
 * Manejador para cuando se sube un archivo de audio personalizado.
 * Además de actualizar la configuración, agrega el audio a la lista de audios personalizados.
 */
async function handleAudioFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length) {
    const file = target.files[0];
    const url = URL.createObjectURL(file);
    settingsStore.updateNotificationSettings({
      customAudioUrl: url,
      sound: true,
    });
    selectedAudio.value = url;
    // Agregar el audio subido a la lista de audios personalizados.
    customAudios.value.push({ name: file.name, path: url });
  }
  target.value = "";
}

/**
 * Variable global para mantener la referencia del audio actualmente reproduciéndose.
 */
let currentAudio: HTMLAudioElement | null = null;

/**
 * Reproduce el audio cuyo URL se pasa como parámetro, deteniendo cualquier audio previamente en reproducción.
 * @param url URL del audio a reproducir.
 */
async function playAudio(url: string) {
  try {
    if (!url) {
      alert("No hay ningún audio para reproducir.");
      return;
    }
    // Detener el audio que se esté reproduciendo actualmente.
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(url);
    await currentAudio.play();
  } catch (error) {
    console.error("Error al reproducir el audio:", error);
    alert("Error al reproducir el audio.");
  }
}

// --- Funciones de Prueba de Notificaciones ---
async function startNotificationTest() {
  if (isTesting.value) return;
  isTesting.value = true;
  countdown.value = 10;
  const interval = setInterval(() => {
    countdown.value--;
    if (countdown.value <= 0) {
      clearInterval(interval);
      testFullNotification();
      isTesting.value = false;
    }
  }, 1000);
}

/**
 * Función para probar la notificación completa combinando sonido, vibración y notificación push.
 */
async function testFullNotification() {
  try {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("Alerta de Notificación", {
          body: "Esta es una prueba completa de notificación.",
          icon: notificationConfig.icon || "",
        });
      } else if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          new Notification("Alerta de Notificación", {
            body: "Esta es una prueba completa de notificación.",
            icon: notificationConfig.icon || "",
          });
        }
      }
    }
  } catch (error) {
    console.error("Error en la prueba completa de notificación:", error);
  }
}

// --- Watchers ---
watch(selectedAudio, () => {
  // Actualiza la configuración cada vez que cambia la selección.
  handleDefaultSoundChange();
});

onMounted(() => {
  // Sincronizar o inicializar estado si es necesario.
});

defineOptions({ name: "ProfileNotifications" });
</script>

<script lang="ts">
export default {
  name: "ProfileNotifications",
};
</script>

<style scoped lang="postcss">
.input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500;
}
.label {
  @apply block text-sm font-medium text-gray-700;
}

/* Transición para el dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
