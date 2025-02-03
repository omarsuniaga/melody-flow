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
      :provider="expandedProvider ?? ''"
      :expandedProvider="expandedProvider"
      :sortedEvents="sortedEvents"
      :showPendingPayments="showPendingPayments"
      :showCompletedPayments="showCompletedPayments"
      :showProviderRevenue="showProviderRevenue"
      @togglePendingPayments="$emit('togglePendingPayments')"
      @toggleCompletedPayments="$emit('toggleCompletedPayments')"
      @toggleProvider="$emit('toggleProvider', $event)"
      @toggleProviderRevenue="$emit('toggleProviderRevenue')"
      @generatePDF="$emit('generatePDF', $event)"
    />

    <AverageEventPanel :averageAmount="monthlyStats.averagePerEvent" />
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
import TotalEventsPanel from "./TotalEventsPanel.vue";
import ProviderBreakdown from "./ProviderBreakdown.vue";
import AverageEventPanel from "./AverageEventPanel.vue";
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
