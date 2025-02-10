<template>
  <div v-if="event?.coord" class="bg-white rounded-lg shadow-lg p-4 mb-4">
    <div class="flex items-start space-x-4">
      <!-- Ícono y título -->
      <div class="flex-shrink-0">
        <MapPinIcon class="h-6 w-6 text-blue-500" />
      </div>

      <div class="flex-grow">
        <!-- Título del evento -->
        <h3 class="font-medium text-gray-900 flex items-center justify-between">
          <span>
            Próximo evento en {{ event.location || "Ubicación no especificada" }}
          </span>
          <span class="text-blue-600">
            {{ formatTime(event.time) }}
          </span>
        </h3>

        <!-- Resto del contenido solo si hay coordenadas -->
        <template v-if="event.coord">
          <!-- Información de distancia y tiempo -->
          <div class="mt-3 flex items-center text-sm text-gray-600 space-x-4">
            <span class="flex items-center">
              <ClockIcon class="h-4 w-4 mr-1 text-gray-400" />
              {{ routeInfo?.duration || "Presiona Actualizar Ruta" }}
            </span>
            <span class="text-gray-300">|</span>
            <span class="flex items-center">
              <MapIcon class="h-4 w-4 mr-1 text-gray-400" />
              {{ routeInfo?.distance || "Presiona Actualizar Ruta" }}
            </span>
          </div>

          <!-- Recomendación de salida -->
          <div class="mt-3 bg-blue-50 rounded-md p-3">
            <p class="text-sm text-blue-700 flex items-start">
              <InformationCircleIcon class="h-5 w-5 mr-2 flex-shrink-0 text-blue-500" />
              <span>
                Deberías salir a las
                <strong class="font-semibold">{{ suggestedDepartureTime }}</strong>
                considerando {{ setupTime }} de preparación y
                {{ routeInfo?.duration || "N/A" }} de viaje
              </span>
            </p>
          </div>

          <!-- Acciones -->
          <div class="mt-4 flex items-center space-x-3">
            <button
              @click="refreshLocation"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshIcon class="h-4 w-4 mr-2" />
              Actualizar ruta
            </button>

            <button
              @click="setAlarm"
              :disabled="alarmSet"
              class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              <BellIcon class="h-4 w-4 mr-2" />
              {{ alarmSet ? "Alarma configurada" : "Programar alarma" }}
            </button>
          </div>
        </template>
        <template v-else>
          <div class="mt-3 bg-yellow-50 rounded-md p-3">
            <p class="text-sm text-yellow-700">
              Este evento no tiene coordenadas configuradas
            </p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted, defineProps } from "vue";
import {
  format,
  subMinutes,
  parse,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import MapPinIcon from "@heroicons/vue/24/outline/MapPinIcon";
import ClockIcon from "@heroicons/vue/24/outline/ClockIcon";
import MapIcon from "@heroicons/vue/24/outline/MapIcon";
import BellIcon from "@heroicons/vue/24/outline/BellIcon";
import InformationCircleIcon from "@heroicons/vue/24/outline/InformationCircleIcon";
import RefreshIcon from "@heroicons/vue/24/outline/ArrowPathIcon"; // Añadir RefreshIcon como alias de ArrowPathIcon
import { calculateRoute, formatDistance, formatDuration } from "../services/RouteService";
import { getUserLocation } from "../utils/geolocation";
import { useEventStore } from "../stores/eventStore";
import type { MusicEvent } from "../types/event";

// Estado global
const eventStore = useEventStore();
const activeEvents = ref<MusicEvent[]>([]);
const currentPosition = ref<{ lat: number; lng: number } | null>(null);
const alarmSet = ref(false);
const setupTime = "30 minutos";

// Variable para el setInterval
let updateInterval: number | null = null;

// Computed: Obtener el evento más próximo (hoy con coordenadas)
const nearestActiveEvent = computed(() => {
  if (!activeEvents.value.length) return null;
  const now = new Date();
  return activeEvents.value
    .filter((event) => {
      // Solo verificamos coordenadas por ahora
      return event.coord;
    })
    .sort((a, b) => {
      const timeA = parse(a.time, "HH:mm", now);
      const timeB = parse(b.time, "HH:mm", now);
      return timeA.getTime() - timeB.getTime();
    })[0];
});

// Constante para el tiempo de preparación en minutos
const SETUP_TIME_MINUTES = 30;

// Computed para calcular la hora de salida sugerida
const suggestedDepartureTime = computed(() => {
  if (!event.value?.time || !routeInfo.value?.durationMinutes) return "---";
  try {
    const eventTime = parse(event.value.time, "HH:mm", new Date());
    const totalMinutesToSubtract = SETUP_TIME_MINUTES + routeInfo.value.durationMinutes;
    const departureTime = subMinutes(eventTime, totalMinutesToSubtract);
    return format(departureTime, "HH:mm");
  } catch (error) {
    console.error("Error calculando hora de salida:", error);
    return "Error";
  }
});

// Props
const props = defineProps<{ activeEvent: MusicEvent | null }>();

// Computed para acceder al evento de forma más limpia
const event = computed(() => {
  return props.activeEvent;
});

// Computed para la información de ruta
const routeInfo = ref<{
  distance: string;
  duration: string;
  durationMinutes: number;
} | null>(null);

// Métodos
function formatTime(time: string) {
  return format(parse(time, "HH:mm", new Date()), "h:mm a", { locale: es });
}

async function calculateRouteInfo() {
  if (!currentPosition.value || !event.value?.coord) {
    return;
  }
  try {
    const route = await calculateRoute(currentPosition.value, event.value.coord);
    routeInfo.value = {
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
      durationMinutes: Math.round(route.duration / 60),
    };
  } catch (error) {
    console.error("Error calculando la ruta:", error);
    routeInfo.value = null;
  }
}

function updateActiveEvents() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);
  activeEvents.value = eventStore.events.filter((event) => {
    const eventDate = new Date(event.date);
    return isWithinInterval(eventDate, { start, end });
  });
}

async function setAlarm() {
  if (!("Notification" in window)) {
    alert("Este navegador no soporta notificaciones");
    return;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const alarmTime = suggestedDepartureTime.value;
      const now = new Date();
      const scheduledTime = parse(alarmTime, "HH:mm", now);
      const timeoutMs = scheduledTime.getTime() - now.getTime();
      if (timeoutMs > 0) {
        setTimeout(() => {
          new Notification("¡Es hora de prepararse!", {
            body: `Tienes un evento en ${nearestActiveEvent.value?.location} a las ${nearestActiveEvent.value?.time}`,
          });
        }, timeoutMs);
        alarmSet.value = true;
      }
    }
  } catch (error) {
    console.error("Error configurando la alarma:", error);
  }
}

// Actualizar la ubicación actual y recalcular ruta
async function refreshLocation() {
  try {
    currentPosition.value = await getUserLocation();
    if (event.value?.coord) {
      await calculateRouteInfo();
    }
  } catch (err) {
    console.error("Error actualizando ubicación:", err);
  }
}

// Watchers
watch(() => eventStore.events, updateActiveEvents, { deep: true });

watch(
  nearestActiveEvent,
  async (newEvent) => {
    if (newEvent?.coord) {
      await calculateRouteInfo();
    }
  },
  { deep: true }
);

watch(
  () => event.value?.coord,
  async (newCoord) => {
    if (newCoord) {
      await calculateRouteInfo();
    }
  },
  { immediate: true }
);

// Lifecycle
onMounted(async () => {
  if (event.value?.coord) {
    await calculateRouteInfo();
  }
  try {
    // Obtener ubicación actual
    currentPosition.value = await getUserLocation();
    // Obtener eventos del día
    updateActiveEvents();
    // Si hay un evento con coord, calcular ruta
    if (nearestActiveEvent.value?.coord) {
      await calculateRouteInfo();
    }
  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
  // Iniciar intervalo para refrescar la lista de eventos
  updateInterval = window.setInterval(updateActiveEvents, 60000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

// agregar un observable que actualice cada 5 min refreshLocation()
watch(
  () => currentPosition.value,
  async (newPosition) => {
    if (newPosition && event.value?.coord) {
      await calculateRouteInfo();
    }
  },
  { deep: true }
);
</script>

<script lang="ts">
export default {
  name: "CalendarDistance",
};
</script>
