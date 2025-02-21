<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <Suspense>
      <template #default>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          <!-- Total Events Panel -->
          <lazy-total-events-panel
            :totalEvents="monthlyStats.totalEvents"
            :events="events"
            :showTotalEvents="showTotalEvents"
            @toggleTotalEvents="emit('toggleTotalEvents')"
          />

          <!-- Panel de Resumen Financiero -->
          <lazy-provider-breakdown
            :monthlyStats="monthlyStats"
            :totalPendingAmount="totalPendingAmount"
            :totalCompletedAmount="totalCompletedAmount"
            :groupedPendingPayments="groupedPendingPayments"
            :groupedCompletedPayments="groupedCompletedPayments"
            :sortedProviderStatsByRevenue="sortedProviderStatsByRevenue"
            :expandedProvider="expandedProvider"
            :sortedEvents="sortedEvents"
            :showPendingPayments="showPendingPayments"
            :showCompletedPayments="showCompletedPayments"
            :showProviderRevenue="showProviderRevenue"
            @togglePendingPayments="emit('togglePendingPayments')"
            @toggleCompletedPayments="emit('toggleCompletedPayments')"
            @toggleProvider="emit('toggleProvider', $event)"
            @toggleProviderRevenue="emit('toggleProviderRevenue')"
            @generatePDF="handlePdfGeneration"
          />

          <!-- Panel de Promedio por Evento -->
          <lazy-average-event-panel :averageAmount="monthlyStats.averagePerEvent" />
        </div>
      </template>
      <template #fallback>
        <div class="col-span-3 flex justify-center items-center p-4">
          <div class="animate-pulse text-gray-500">Cargando métricas...</div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from "vue";

// Renombrar la interfaz para evitar conflicto con el tipo Event
interface AppEvent {
  id: string;
  date: string;
  provider: string;
  location: string;
  amount: number;
  paymentStatus: string;
  description?: string;
}

interface MonthlyStats {
  totalEvents: number;
  totalRevenue: number;
  averagePerEvent: number;
}

interface Props {
  monthlyStats: MonthlyStats;
  events: AppEvent[]; // Actualizar el tipo a AppEvent[]
  showTotalEvents: boolean;
  showProviderRevenue: boolean;
  showPendingPayments: boolean;
  showCompletedPayments: boolean;
  expandedProvider: string | null;
  totalPendingAmount: number;
  totalCompletedAmount: number;
  groupedPendingPayments: Record<string, AppEvent[]>;
  groupedCompletedPayments: Record<string, AppEvent[]>;
  sortedProviderStatsByRevenue: Array<{ name: string; revenue: number }>;
  sortedEvents: AppEvent[]; // Actualizar el tipo a AppEvent[]
}

// Lazy loading de componentes
const LazyTotalEventsPanel = defineAsyncComponent(
  () => import("./BalanceTotalEventsPanel.vue")
);
const LazyProviderBreakdown = defineAsyncComponent(
  () => import("./BalanceProviderBreakdown.vue")
);
const LazyAverageEventPanel = defineAsyncComponent(
  () => import("./BalanceAverageEventPanel.vue")
);

// Props con tipado estricto
const props = defineProps<Props>();
console.log(props);
// Removed unused destructured elements

// Eventos tipados
const emit = defineEmits<{
  (e: "generatePDF", provider: string, events: AppEvent[]): void;
  (e: "toggleProviderRevenue"): void;
  (e: "togglePendingPayments"): void;
  (e: "toggleCompletedPayments"): void;
  (e: "toggleProvider", provider: string): void;
  (e: "toggleTotalEvents"): void;
}>();

// Handler para generación de PDF con validación
const handlePdfGeneration = (provider: string, events: AppEvent[]): void => {
  try {
    if (!events?.length) {
      throw new Error("No hay eventos para generar el PDF");
    }

    const validEvents = events.every(
      (event) => event.date && event.location && typeof event.amount === "number"
    );

    if (!validEvents) {
      throw new Error("Datos de eventos incompletos o inválidos");
    }

    emit("generatePDF", provider, events);
  } catch (error) {
    console.error("Error al generar PDF:", error);
    // Aquí podrías emitir un evento de error si lo necesitas
  }
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
