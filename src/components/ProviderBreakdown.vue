<template>
  <div class="bg-green-50 p-4 rounded-lg">
    <!-- MENÚ PRINCIPAL: Ingresos Totales -->
    <div
      class="cursor-pointer flex justify-between items-center"
      @click="$emit('toggleProviderRevenue')"
    >
      <h3 class="text-lg font-medium text-blue-900 flex items-center justify-between">
        <span>Ingresos Totales</span>
      </h3>
      <div class="flex items-center">
        <!-- Se muestra el total global de ingresos -->
        <p class="text-3xl font-bold text-blue-600">
          {{ formatCurrency(monthlyStats.value.totalRevenue) }}
        </p>
        <ChevronDownIcon
          class="h-5 w-5 ml-2 transform transition-transform duration-200"
          :class="{ 'rotate-180': showProviderRevenue.value }"
        />
      </div>
    </div>

    <!-- Si el menú principal está abierto, se muestran los submenús -->
    <div v-if="showProviderRevenue.value" class="mt-4 space-y-4">
      <!-- Submenú: Eventos Pendientes -->
      <div class="bg-red-100 p-3 rounded">
        <div
          class="cursor-pointer flex justify-between items-center"
          @click="$emit('togglePendingPayments')"
        >
          <span class="font-medium">Eventos Pendientes</span>
          <div class="flex items-center">
            <span>{{ formatCurrency(totalPendingAmount.value) }}</span>
            <ChevronDownIcon
              class="h-5 w-5 ml-2 transform transition-transform duration-200"
              :class="{ 'rotate-180': showPendingPayments.value }"
            />
          </div>
        </div>
        <div v-if="showPendingPayments.value" class="mt-2">
          <div
            v-for="(events, provider) in groupedPendingPayments.value"
            :key="provider"
            class="mb-2"
          >
            <!-- Fila del proveedor -->
            <div
              class="flex items-center p-2 bg-white rounded cursor-pointer"
              @click="$emit('toggleProvider', provider)"
            >
              <div class="w-48">
                <p class="font-medium">{{ provider }}</p>
                <p class="text-sm text-gray-600">{{ events.length }} eventos</p>
              </div>
              <div class="flex-grow text-center">
                <span class="font-medium text-red-600">
                  {{ formatCurrency(events.reduce((sum: number, event: { amount: number }) => sum + event.amount, 0)) }}
                </span>
              </div>
              <button
                @click.stop="
                  $emit('generatePDF', provider, groupedPendingPayments.value[provider])
                "
                class="flex-none text-blue-600 hover:text-blue-800 p-2"
                title="Descargar PDF"
              >
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
            <div v-if="expandedProvider.value === provider" class="pl-4">
              <div
                v-for="event in sortedEvents(events)"
                :key="event.id"
                class="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div>
                  <p class="text-sm text-gray-600">{{ formatDate(event.date) }}</p>
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
            <span>{{ formatCurrency(totalCompletedAmount.value) }}</span>
            <ChevronDownIcon
              class="h-5 w-5 ml-2 transform transition-transform duration-200"
              :class="{ 'rotate-180': showCompletedPayments.value }"
            />
          </div>
        </div>
        <div v-if="showCompletedPayments.value" class="mt-2">
          <div
            v-for="(events, provider) in groupedCompletedPayments.value"
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
                {{ formatCurrency(events.reduce((sum, event) => sum + event.amount, 0)) }}
              </span>
            </div>
            <!-- Detalle de eventos para el proveedor (Pagados) -->
            <div v-if="expandedProvider.value === provider" class="pl-4">
              <div
                v-for="event in sortedEvents(events)"
                :key="event.id"
                class="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <div>
                  <p class="text-sm text-gray-600">{{ formatDate(event.date) }}</p>
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
import { defineProps, toRefs } from "vue";
import { ChevronDownIcon } from "../utils/icons";
import { formatCurrency } from "../utils/helpers";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Función para formatear fecha con local español
const formatDate = (date: string) => {
  return format(parseISO(date), "EEEE d 'de' MMMM, yyyy", { locale: es });
};

// Definición de props requeridas, utilizando toRefs para mantener la reactividad
const props = defineProps<{
  monthlyStats: { totalEvents: number; totalRevenue: number; averagePerEvent: number };
  totalPendingAmount: number;
  totalCompletedAmount: number;
  groupedPendingPayments: Record<string, any>;
  groupedCompletedPayments: Record<string, any>;
  sortedProviderStatsByRevenue: Array<{ name: string; revenue: number }>;
  expandedProvider: string | null;
  sortedEvents: (events: any[]) => any[];
  showPendingPayments: boolean;
  showCompletedPayments: boolean;
  showProviderRevenue: boolean;
}>();

const monthlyStats = toRefs(props).monthlyStats;
const totalPendingAmount = toRefs(props).totalPendingAmount;
const totalCompletedAmount = toRefs(props).totalCompletedAmount;
const groupedPendingPayments = toRefs(props).groupedPendingPayments;
const groupedCompletedPayments = toRefs(props).groupedCompletedPayments;
const expandedProvider = toRefs(props).expandedProvider;
const sortedEvents = toRefs(props).sortedEvents;
const showPendingPayments = toRefs(props).showPendingPayments;
const showCompletedPayments = toRefs(props).showCompletedPayments;
const showProviderRevenue = toRefs(props).showProviderRevenue;
</script>

<script lang="ts">
export default {
  name: "ProviderBreakdown",
};
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease-out;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
.slide-enter-to,
.slide-leave-from {
  transform: translateY(0);
  opacity: 1;
}
</style>
