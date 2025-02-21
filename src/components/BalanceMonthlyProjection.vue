<script setup lang="ts">
import { computed, withDefaults, ref, onMounted, onUnmounted, watch } from "vue";
import { formatCurrency } from "../utils/helpers";
import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import { isSameDay } from "date-fns";

// Definir tipos mínimos para evento
interface Event {
  id: string;
  date: string;
  provider: string;
  location: string;
  amount: number;
  time?: string; // hora del evento, formato "HH:mm"
}

const props = withDefaults(defineProps<{ events: Event[] }>(), { events: () => [] });

// Crear variable reactiva para la hora actual
const currentTime = ref(new Date());
let intervalId: number | null = null;
onMounted(() => {
  intervalId = window.setInterval(() => {
    currentTime.value = new Date();
  }, 60000); // Actualiza cada minuto
});
onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

// Watch para ver la actualización de la hora
watch(currentTime, (newTime, oldTime) => {
  console.log("Current time updated:", newTime);
});

// Computed: Eventos pasados y futuros usando isSameDay
const pastEvents = computed(() => {
  return props.events.filter((event) => {
    const eventDate = new Date(event.date);
    // Si el evento no es hoy, se compara la fecha completa
    if (!isSameDay(eventDate, currentTime.value)) {
      return eventDate.getTime() < currentTime.value.getTime();
    }
    // Si es hoy, se construye la fecha completa usando event.time (si existe)
    if (event.time) {
      const [hours, minutes] = event.time.split(":").map(Number);
      const eventDateTime = new Date(eventDate);
      eventDateTime.setHours(hours, minutes, 0, 0);
      return eventDateTime.getTime() < currentTime.value.getTime();
    }
    // Si es hoy y no hay hora, se asume que aún no ocurrió
    return false;
  });
});

const futureEvents = computed(() => {
  return props.events.filter((event) => {
    const eventDate = new Date(event.date);
    if (!isSameDay(eventDate, currentTime.value)) {
      return eventDate.getTime() > currentTime.value.getTime();
    }
    if (event.time) {
      const [hours, minutes] = event.time.split(":").map(Number);
      const eventDateTime = new Date(eventDate);
      eventDateTime.setHours(hours, minutes, 0, 0);
      return eventDateTime.getTime() >= currentTime.value.getTime();
    }
    // Si es hoy y sin hora, se asume que el evento es futuro
    return true;
  });
});

console.log("Eventos pasados:", pastEvents.value);
console.log("Eventos futuros:", futureEvents.value);

const totalPastRevenue = computed(() =>
  pastEvents.value.reduce((sum, event) => sum + event.amount, 0)
);

const totalFutureRevenue = computed(() =>
  futureEvents.value.reduce((sum, event) => sum + event.amount, 0)
);

const projectedTotalRevenue = computed(
  () => totalPastRevenue.value + totalFutureRevenue.value
);
</script>

<script lang="ts">
// Exportar componente
export default {
  name: "BalanceMonthlyProjection",
};
</script>

<template>
  <div class="bg-gray-50 p-4 rounded-lg">
    <h3 class="text-lg font-medium text-gray-800 mb-4">Proyección Total del Mes</h3>
    <div class="space-y-2">
      <div class="flex justify-between">
        <span
          >Eventos Realizados:
          {{ pastEvents.length ? "(" + pastEvents.length + ")" : "" }}</span
        >
        <span>{{ formatCurrency(totalPastRevenue) }}</span>
      </div>
      <div class="flex justify-between">
        <span>
          Eventos por Hacer:
          {{ futureEvents.length ? "(" + futureEvents.length + ")" : "" }}
        </span>
        <span>{{ formatCurrency(totalFutureRevenue) }}</span>
      </div>
      <div class="flex justify-between font-bold border-t pt-2 mt-2">
        <span>Total Proyectado:</span>
        <span>{{ formatCurrency(projectedTotalRevenue) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ...existing styles si aplican... */
</style>
