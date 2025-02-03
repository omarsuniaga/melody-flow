<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <TotalEventsPanel
      :totalEvents="monthlyStats.totalEvents"
      :events="events"
      :showTotalEvents="showTotalEvents"
      @toggleTotalEvents="$emit('toggleTotalEvents')"
    />

    <ProviderBreakdown
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
      @togglePendingPayments="$emit('togglePendingPayments')"
      @toggleCompletedPayments="$emit('toggleCompletedPayments')"
      @toggleProvider="$emit('toggleProvider', $event)"
      @toggleProviderRevenue="$emit('toggleProviderRevenue')"
      @generatePDF="handlePdfGeneration"
    />

    <AverageEventPanel :averageAmount="monthlyStats.averagePerEvent" />
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import TotalEventsPanel from "./TotalEventsPanel.vue";
import ProviderBreakdown from "./ProviderBreakdown.vue";
import AverageEventPanel from "./AverageEventPanel.vue";

// Actualizar la lista completa de eventos emitidos
const emit = defineEmits<{
  (e: "generatePDF", provider: string, events: any[]): void;
  (e: "toggleTotalEvents"): void;
  (e: "toggleProviderRevenue"): void;
  (e: "togglePendingPayments"): void;
  (e: "toggleCompletedPayments"): void;
  (e: "toggleProvider", provider: string): void;
  (e: "update:modelValue", value: boolean): void;
  (e: "saved"): void;
  (e: "close"): void;
}>();

// Función para manejar la generación del PDF
const handlePdfGeneration = (provider: string, events: any[]) => {
  console.log("EventsMetrics: Iniciando proceso de generación de PDF");
  console.log("Proveedor:", provider);
  console.log("Número de eventos:", events.length);

  // Validación básica antes de propagar el evento
  if (!events || events.length === 0) {
    console.warn("EventsMetrics: No hay eventos para generar PDF");
    return;
  }

  // Verificar que los eventos tienen la estructura correcta
  const validEvents = events.every(
    (event) =>
      event.date &&
      event.location &&
      typeof event.amount === "number" &&
      event.description
  );

  if (!validEvents) {
    console.warn("EventsMetrics: Algunos eventos no tienen la estructura correcta");
    return;
  }

  console.log("EventsMetrics: Propagando evento generatePDF al componente padre");
  emit("generatePDF", provider, events);
};

defineProps<{
  monthlyStats: {
    totalEvents: number;
    totalRevenue: number;
    averagePerEvent: number;
  };
  events: Array<{
    id: string;
    date: string;
    provider: string;
    location: string;
    amount: number;
    paymentStatus: string;
  }>;
  showTotalEvents: boolean;
  showProviderRevenue: boolean;
  showPendingPayments: boolean;
  showCompletedPayments: boolean;
  expandedProvider: string | null;
  totalPendingAmount: number;
  totalCompletedAmount: number;
  groupedPendingPayments: Record<string, any>;
  groupedCompletedPayments: Record<string, any>;
  sortedProviderStatsByRevenue: Array<{ name: string; revenue: number }>;
  sortedEvents: (events: any[]) => any[];
}>();
</script>

<script lang="ts">
export default {
  name: "EventsMetrics",
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
