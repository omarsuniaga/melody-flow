<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { isSameDay, parse } from "date-fns";
import { formatCurrency } from "../utils/helpers";

interface Event {
  id: string;
  date: string; // "yyyy-MM-dd"
  provider: string;
  location: string;
  amount: number;
  time?: string; // "HH:mm"
}

const props = defineProps<{ events: Event[] }>();

// Reloj reactivo
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

// Parseo local de la fecha (ignora UTC)
function parseLocalDate(dateStr: string): Date {
  return parse(dateStr, "yyyy-MM-dd", new Date());
}

// Combina fecha y hora
function getEventDateTime(event: Event): Date {
  const date = parseLocalDate(event.date);
  if (event.time) {
    const [hours, minutes] = event.time.split(":").map(Number);
    date.setHours(hours, minutes, 0, 0);
  }
  return date;
}

// ¿Es pasado?
function isEventPast(event: Event): boolean {
  const eventDateTime = getEventDateTime(event);
  return eventDateTime.getTime() < currentTime.value.getTime();
}

// ¿Es futuro?
function isEventFuture(event: Event): boolean {
  const eventDateTime = getEventDateTime(event);
  return eventDateTime.getTime() >= currentTime.value.getTime();
}

// Filtramos
const pastEvents = computed(() => props.events.filter((e) => isEventPast(e)));

const futureEvents = computed(() => props.events.filter((e) => isEventFuture(e)));

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
export default {
  name: "BalanceMonthlyProjection",
};
</script>

<template>
  <div class="bg-gray-50 p-4 rounded-lg">
    <h3 class="text-lg font-medium text-gray-800 mb-4">Proyección Total del Mes</h3>
    <div class="space-y-2">
      <div class="flex justify-between">
        <span>
          Eventos Realizados:
          {{ pastEvents.length ? "(" + pastEvents.length + ")" : "" }}
        </span>
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
/* ...existing styles... */
</style>
