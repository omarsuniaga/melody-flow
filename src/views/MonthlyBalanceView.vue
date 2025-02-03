<template>
  <!-- Se agregan los eventos touchstart y touchend en el contenedor raíz -->
  <div
    class="min-h-screen p-2 sm:p-4"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p6">
        <!-- Subcomponente para la selección del mes -->
        <MonthSelector
          :selectedMonth="selectedMonth"
          @previous="previousMonth"
          @next="nextMonth"
          @reset="resetToCurrentMonth"
        />

        <!-- Subcomponente para las métricas principales -->
        <EventsMetrics
          :monthlyStats="monthlyStats"
          :showTotalEvents="showTotalEvents"
          :showTotalRevenue="showTotalRevenue"
          :events="monthEvents"
          @toggleTotalEvents="toggleTotalEvents"
          @toggleTotalRevenue="toggleTotalRevenue"
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
          @togglePendingPayments="togglePendingPayments"
          @toggleCompletedPayments="toggleCompletedPayments"
          @toggleProvider="toggleProvider"
          @toggleProviderRevenue="toggleProviderRevenue"
          @generatePDF="generateProviderPDF"
        />

        <!-- Subcomponente para la distribución de eventos por proveedor -->
        <ProviderDistribution
          :providerDistribution="providerDistribution"
          :showProviderDistribution="showProviderDistribution"
          :events="monthEvents"
          @toggleProviderDistribution="toggleProviderDistribution"
        />

        <!-- Subcomponente para las ubicaciones con mayor actividad -->
        <LocationsPanel
          :sortedLocationsByRecurrence="sortedLocationsByRecurrence"
          :showTopLocations="showTopLocations"
          @toggleTopLocations="toggleTopLocations"
        />
      </div>
    </div>
  </div>

  <!-- Botón flotante para abrir el modal makePayments -->
  <div class="fixed bottom-14 right-6">
    <button
      @click="showMakePayments = true"
      class="rounded-full bg-blue-600 text-white p-4 shadow-lg flex items-center gap-2"
    >
      <BanknotesIcon class="h-6 w-6" />
    </button>
  </div>

  <!-- Componente makePayments -->
  <make-payments v-if="showMakePayments" @close="showMakePayments = false" />
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BanknotesIcon } from "../utils/icons";
import { useToast } from "vue-toastification";
import { useEventStore } from "../stores/eventStore";
import { createAndDownloadPdf } from "../utils/pdfMakeConfig"; // Simplificar importación
import { getPendingEventsTemplate } from "../utils/pdfTemplates";
import { defineAsyncComponent } from "vue";

// Componentes cargados dinámicamente
const MonthSelector = defineAsyncComponent(
  () => import("../components/MonthSelector.vue")
);
const EventsMetrics = defineAsyncComponent(
  () => import("../components/EventsMetrics.vue")
);
const ProviderDistribution = defineAsyncComponent(
  () => import("../components/ProviderDistribution.vue")
);
const LocationsPanel = defineAsyncComponent(
  () => import("../components/LocationsPanel.vue")
);
const makePayments = defineAsyncComponent(() => import("../components/makePayments.vue"));

// Estado principal
const toast = useToast();
const eventStore = useEventStore();

const selectedMonth = ref(new Date());
const showTotalEvents = ref(false);
const showTotalRevenue = ref(false);
const showPendingPayments = ref(false);
const showCompletedPayments = ref(false);
const expandedProvider = ref<string | null>(null);
const showProviderDistribution = ref(false);
const showProviderRevenue = ref(false); // Se puede usar en ProviderBreakdown si es necesario
const showTopLocations = ref(false);
const showMakePayments = ref(false);

// Toggle functions para los paneles
const toggleTotalEvents = () => {
  showTotalEvents.value = !showTotalEvents.value;
};
const toggleTotalRevenue = () => {
  showTotalRevenue.value = !showTotalRevenue.value;
};
const togglePendingPayments = () => {
  showPendingPayments.value = !showPendingPayments.value;
};
const toggleCompletedPayments = () => {
  showCompletedPayments.value = !showCompletedPayments.value;
};
const toggleProvider = (provider: string) => {
  expandedProvider.value = expandedProvider.value === provider ? null : provider;
};
const toggleProviderRevenue = () => {
  showProviderRevenue.value = !showProviderRevenue.value;
};
const toggleProviderDistribution = () => {
  showProviderDistribution.value = !showProviderDistribution.value;
};
const toggleTopLocations = () => {
  showTopLocations.value = !showTopLocations.value;
};

// Change month functions
const previousMonth = () => {
  selectedMonth.value = subMonths(selectedMonth.value, 1);
};
const nextMonth = () => {
  selectedMonth.value = addMonths(selectedMonth.value, 1);
};
const resetToCurrentMonth = () => {
  selectedMonth.value = new Date();
};

// Implementación del swipe
const touchStartX = ref<number | null>(null);
const touchEndX = ref<number | null>(null);
const swipeThreshold = 50; // píxeles

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].clientX;
};

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].clientX;
  if (touchStartX.value !== null && touchEndX.value !== null) {
    const diff = touchStartX.value - touchEndX.value;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextMonth();
      } else {
        previousMonth();
      }
    }
  }
  touchStartX.value = null;
  touchEndX.value = null;
};

// Filtrar eventos para el mes seleccionado
const monthEvents = computed(() => {
  const start = startOfMonth(selectedMonth.value);
  const end = endOfMonth(selectedMonth.value);
  return eventStore.events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= start && eventDate <= end;
  });
});

// Estadísticas mensuales
const monthlyStats = computed(() => {
  const events = monthEvents.value;
  const totalRevenue = events.reduce((sum, event) => sum + event.amount, 0);
  return {
    totalEvents: events.length,
    totalRevenue,
    averagePerEvent: events.length > 0 ? totalRevenue / events.length : 0,
  };
});

// Estadísticas por proveedor
const providerStats = computed(() => {
  const stats = new Map<string, { eventCount: number; revenue: number }>();
  monthEvents.value.forEach((event) => {
    const current = stats.get(event.provider) || { eventCount: 0, revenue: 0 };
    stats.set(event.provider, {
      eventCount: current.eventCount + 1,
      revenue: current.revenue + event.amount,
    });
  });
  return Array.from(stats.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
});
const sortedProviderStatsByRevenue = computed(() =>
  [...providerStats.value].sort((a, b) => b.revenue - a.revenue)
);

// Provider Distribution: porcentaje y orden descendente
const providerDistribution = computed(() => {
  const totalEvents = monthlyStats.value.totalEvents;
  if (totalEvents === 0) return [];
  return providerStats.value
    .map((provider) => ({
      name: provider.name,
      eventCount: provider.eventCount,
      percentage: ((provider.eventCount / totalEvents) * 100).toFixed(1),
    }))
    .sort((a, b) => b.eventCount - a.eventCount);
});

// Propiedades de pago
const pendingPayments = computed(() =>
  monthEvents.value.filter((event) => event.paymentStatus === "Pendiente")
);
const completedPayments = computed(() =>
  monthEvents.value.filter((event) => event.paymentStatus === "Pagado")
);
const totalPendingAmount = computed(() =>
  pendingPayments.value.reduce((sum, event) => sum + event.amount, 0)
);
const totalCompletedAmount = computed(() =>
  completedPayments.value.reduce((sum, event) => sum + event.amount, 0)
);

// Agrupar eventos por proveedor
type MusicEvent = {
  id: string;
  date: string;
  location: string;
  amount: number;
  provider: string;
  paymentStatus: string;
  activityType: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  time: string;
  userId: string;
  isFixed: boolean;
};
interface EventGroups {
  [key: string]: MusicEvent[];
}
const groupedPendingPayments = computed(
  (): EventGroups => {
    return pendingPayments.value.reduce((groups: EventGroups, event) => {
      if (!groups[event.provider]) {
        groups[event.provider] = [];
      }
      groups[event.provider].push({
        ...event,
        isFixed: event.activityType === "Fija",
      });
      return groups;
    }, {});
  }
);
const groupedCompletedPayments = computed(
  (): EventGroups => {
    return completedPayments.value.reduce((groups: EventGroups, event) => {
      if (!groups[event.provider]) {
        groups[event.provider] = [];
      }
      groups[event.provider].push({
        ...event,
        isFixed: event.activityType === "Fija",
      });
      return groups;
    }, {});
  }
);

// Estadísticas por ubicaciones
const locationStats = computed(() => {
  const stats = new Map<string, { count: number }>();
  monthEvents.value.forEach((event) => {
    const current = stats.get(event.location) || { count: 0 };
    stats.set(event.location, { count: current.count + 1 });
  });
  return Array.from(stats.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
});
const sortedLocationsByRecurrence = computed(() =>
  [...locationStats.value].sort((a, b) => b.count - a.count)
);

// Utility: ordenar eventos descendente por fecha
function sortedEvents(events: MusicEvent[]) {
  return [...events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

// Generar PDF para proveedor
const generateProviderPDF = async (provider: string, events: MusicEvent[]) => {
  try {
    console.log('MonthlyBalanceView recibió solicitud de PDF:', {
      provider,
      eventsCount: events?.length
    });

    if (!provider?.trim()) {
      console.warn("Proveedor no válido:", provider);
      toast.error("Proveedor no válido");
      return;
    }

    if (!Array.isArray(events) || events.length === 0) {
      console.warn("No hay eventos para procesar:", events);
      toast.error("No hay eventos para generar el PDF");
      return;
    }

    toast.info("Generando PDF...");
    console.log('Eventos originales:', events);

    // Validar y formatear los eventos
    const formattedEvents = events
      .filter(event => event && typeof event === 'object')
      .map(event => ({
        date: event.date || new Date().toISOString(),
        location: event.location || 'Sin ubicación',
        time: event.time || '00:00',
        amount: Number(event.amount) || 0,
        description: event.description || 'Sin descripción',
        provider: event.provider || provider,
        paymentStatus: event.paymentStatus || 'Pendiente'
      }));

    console.log('Eventos formateados:', formattedEvents);

    if (formattedEvents.length === 0) {
      console.warn('No hay eventos válidos después del formateo');
      throw new Error('No hay eventos válidos para procesar');
    }

    // Generar la definición del documento
    const docDefinition = await getPendingEventsTemplate(provider, formattedEvents);
    console.log('Definición del documento generada:', docDefinition);

    const fileName = `eventos_${provider.replace(/\s+/g, '_')}_${format(new Date(), "yyyyMMdd")}.pdf`;
    console.log('Intentando crear PDF con nombre:', fileName);

    await createAndDownloadPdf(docDefinition, fileName);
    console.log('PDF generado exitosamente');
    toast.success("PDF generado correctamente");
  } catch (error) {
    console.error("Error detallado al generar PDF:", error);
    toast.error(`Error al generar el PDF: ${(error as Error).message}`);
  }
};
</script>

<style scoped>
.mt-4 {
  transition: all 0.3s ease-in-out;
}
</style>
