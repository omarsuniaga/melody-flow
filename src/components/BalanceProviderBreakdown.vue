<template>
  <div class="bg-green-50 dark:bg-gray-800 p-4 rounded-lg">
    <!-- MENÚ PRINCIPAL: Ingresos Totales -->
    <div
      class="cursor-pointer flex justify-between items-center"
      @click="$emit('toggleProviderRevenue')"
    >
      <h3 class="text-lg font-medium text-blue-900 dark:text-blue-300 flex items-center justify-between">
        <span>Ingresos Totales</span>
      </h3>
      <div class="flex items-center">
        <!-- Se muestra el total global de ingresos -->
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {{ formatCurrency(monthlyStats.totalRevenue) }}
        </p>
        <ChevronDownIcon
          class="h-5 w-5 ml-2 transform transition-transform duration-200 text-gray-500 dark:text-gray-400"
          :class="{ 'rotate-180': showProviderRevenue }"
        />
      </div>
    </div>

    <!-- Si el menú principal está abierto, se muestran los submenús -->
    <div v-if="showProviderRevenue" class="mt-4 space-y-4">
      <!-- Submenú: Eventos Pendientes -->
      <div class="bg-red-100 dark:bg-red-950 p-3 rounded">
        <div
          class="cursor-pointer flex justify-between items-center"
          @click="$emit('togglePendingPayments')"
        >
          <span class="font-medium text-gray-900 dark:text-gray-100">Eventos Pendientes</span>
          <div class="flex items-center">
            <span class="text-gray-900 dark:text-gray-100">{{ formatCurrency(totalPendingAmount) }}</span>
            <ChevronDownIcon
              class="h-5 w-5 ml-2 transform transition-transform duration-200 text-gray-500 dark:text-gray-400"
              :class="{ 'rotate-180': showPendingPayments }"
            />
          </div>
        </div>
        <div v-if="showPendingPayments" class="mt-2">
          <div
            v-for="(events, provider) in groupedPendingPayments"
            :key="provider"
            class="mb-2"
          >
            <!-- Fila del proveedor -->
            <div
              class="flex items-center p-2 bg-white dark:bg-gray-700 rounded cursor-pointer"
              @click="$emit('toggleProvider', provider)"
            >
              <div class="flex-1 min-w-0 mr-2">
                <p class="font-medium truncate text-gray-900 dark:text-gray-100">{{ provider }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ events.length }} eventos</p>
              </div>
              <div class="flex-grow text-center">
                <span class="font-medium text-red-600 dark:text-red-400">
                  {{ formatCurrency(calculateEventsTotal(events)) }}
                </span>
              </div>
              <button
                @click.stop="handlePdfGeneration(provider, events)"
                class="flex-none text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2"
                title="Descargar PDF"
              >
                <!-- Ícono SVG para PDF -->
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
            </div>
            <!-- Detalle de eventos para el proveedor (Pendientes) -->
            <div v-if="expandedProvider === provider" class="pl-4">
              <div
                v-for="event in sortEventsByDate(events)"
                :key="event.id"
                class="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div>
                  <p class="text-sm text-gray-600">
                    {{ formatDate(event.date) }}
                  </p>
                  <p class="text-sm text-gray-600">{{ event.location }}</p>
                </div>
                <span class="font-medium text-red-600">
                  {{ formatCurrency(event.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Submenú: Eventos Pagados -->
      <div class="bg-green-100 p-3 rounded">
        <div
          class="cursor-pointer flex justify-between items-center"
          @click="$emit('toggleCompletedPayments')"
        >
          <span class="font-medium">Eventos Pagados</span>
          <div class="flex items-center">
            <span>{{ formatCurrency(totalCompletedAmount) }}</span>
            <ChevronDownIcon
              class="h-5 w-5 ml-2 transform transition-transform duration-200"
              :class="{ 'rotate-180': showCompletedPayments }"
            />
          </div>
        </div>
        <div v-if="showCompletedPayments" class="mt-2">
          <div
            v-for="(events, provider) in groupedCompletedPayments"
            :key="provider"
            class="mb-2"
          >
            <div
              class="flex justify-between items-center p-2 bg-white rounded cursor-pointer"
              @click="$emit('toggleProvider', provider)"
            >
              <div>
                <p class="font-medium">{{ provider }}</p>
                <p class="text-sm text-gray-600">{{ events.length }} eventos</p>
              </div>
              <span class="font-medium text-green-600">
                {{ formatCurrency(calculateTotalAmount(events)) }}
              </span>
            </div>
            <!-- Detalle de eventos para el proveedor (Pagados) -->
            <div v-if="expandedProvider === provider" class="pl-4">
              <div
                v-for="event in sortEventsByDate(events)"
                :key="event.id"
                class="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div>
                  <p class="text-sm text-gray-600">
                    {{ formatDate(event.date) }}
                  </p>
                  <p class="text-sm text-gray-600">{{ event.location }}</p>
                </div>
                <span class="font-medium text-green-600">
                  {{ formatCurrency(event.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon } from "../utils/icons";
import { formatCurrency } from "../utils/helpers";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { AppEvent } from "../types/event";

// Define formato de fecha reutilizable
const formatDate = (date: string) => {
  return format(parseISO(date), "EEEE d 'de' MMMM, yyyy", { locale: es });
};

const calculateTotalAmount = (events: AppEvent[]): number => {
  return events.reduce((sum, event) => sum + (event?.amount ?? 0), 0);
};

// Función de utilidad para calcular el total
const calculateEventsTotal = (events: AppEvent[]): number => {
  if (!events?.length) return 0;
  return events.reduce((sum, event) => sum + (event?.amount || 0), 0);
};

// Agregar función de ordenamiento local
const sortEventsByDate = (events: AppEvent[]): AppEvent[] => {
  return [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

// Definición de props requeridas
const props = defineProps<{
  monthlyStats: { totalEvents: number; totalRevenue: number; averagePerEvent: number };
  totalPendingAmount: number;
  totalCompletedAmount: number;
  groupedPendingPayments: Record<string, AppEvent[]>;
  groupedCompletedPayments: Record<string, AppEvent[]>;
  sortedProviderStatsByRevenue: Array<{ name: string; revenue: number }>;
  expandedProvider: string | null;
  sortedEvents: AppEvent[]; // Cambiar a AppEvent[] en lugar de función
  showPendingPayments: boolean;
  showCompletedPayments: boolean;
  showProviderRevenue: boolean;
}>();

// Definir emits
const emit = defineEmits<{
  (e: "generatePDF", provider: string, events: AppEvent[]): void;
  (e: "toggleProvider", provider: string): void;
  (e: "toggleProviderRevenue"): void;
  (e: "togglePendingPayments"): void;
  (e: "toggleCompletedPayments"): void;
}>();

// Función para manejar la generación del PDF
const handlePdfGeneration = async (provider: string, events: AppEvent[]) => {
  try {
    if (import.meta.env.DEV) {
      console.group(`📊 REPORTE DE EVENTOS PENDIENTES - ${provider.toUpperCase()}`);
      console.log("📅 Fecha de generación:", format(new Date(), "dd/MM/yyyy HH:mm:ss"));
      console.log("👤 Proveedor:", provider);
    }

    // Formatear eventos para el PDF
    const formattedEvents = events.map((event) => ({
      ...event,
      location: event.location || "Sin ubicación",
      time: event.time || "00:00",
      description: event.description || "Sin descripción",
      amount: Number(event.amount),
      provider: provider,
    }));

    emit("generatePDF", provider, formattedEvents);
    if (import.meta.env.DEV) {
      console.groupEnd();
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("❌ Error al preparar el PDF:", error);
      console.groupEnd();
    }
  }
};
</script>
<script lang="ts">
export default {
  name: "ProviderBreakdown",
};
</script>
