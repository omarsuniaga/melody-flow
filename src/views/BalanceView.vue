<template>
  <!-- Contenedor principal con soporte para gestos táctiles (swipe) -->
  <div
    class="min-h-screen p-2 sm:p-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="max-w-7xl mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-6 transition-colors duration-300">
        <!-- Selector de mes -->
        <MonthSelector
          :selectedMonth="selectedMonth"
          @previous="previousMonth"
          @next="nextMonth"
          @reset="resetToCurrentMonth"
        />

        <!-- Métricas de eventos del mes -->
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
          :sortedEvents="sortedMonthEvents"
          :showPendingPayments="showPendingPayments"
          :showCompletedPayments="showCompletedPayments"
          :showProviderRevenue="showProviderRevenue"
          @togglePendingPayments="togglePendingPayments"
          @toggleCompletedPayments="toggleCompletedPayments"
          @toggleProvider="toggleProvider"
          @toggleProviderRevenue="toggleProviderRevenue"
          @generatePDF="generateProviderPDF"
        />

        <!-- Eventos realizados pasados -->
        <BalanceMonthlyProjection :events="monthEvents" />

        <!-- Distribución de eventos por proveedor -->
        <ProviderDistribution
          :providerDistribution="providerDistribution"
          :showProviderDistribution="showProviderDistribution"
          :events="monthEvents"
          @toggleProviderDistribution="toggleProviderDistribution"
        />

        <!-- Panel de ubicaciones con mayor actividad -->
        <LocationsPanel
          :sortedLocationsByRecurrence="sortedLocationsByRecurrence"
          :showTopLocations="showTopLocations"
          @toggleTopLocations="toggleTopLocations"
        />
      </div>
    </div>
  </div>

  <!-- Botón flotante para abrir el modal de pagos -->
  <div class="fixed bottom-14 right-6">
    <button
      @click="showMakePayments = true"
      class="rounded-full bg-blue-600 text-white p-4 shadow-lg flex items-center gap-2"
    >
      <BanknotesIcon class="h-6 w-6" />
    </button>
  </div>

  <!-- Modal para realizar pagos -->
  <make-payments v-if="showMakePayments" @close="showMakePayments = false" />
</template>

<script setup lang="ts">
defineOptions({ name: "MonthlyBalanceView" });

import { ref, computed } from "vue";
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { BanknotesIcon } from "../utils/icons";
import { useToast } from "vue-toastification";
import { useEventStore } from "../stores/eventStore";
import { createAndDownloadPdf } from "../utils/pdfMakeConfig";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { getPendingEventsTemplate } from "../utils/pdfTemplates";
import { defineAsyncComponent } from "vue";
import BalanceMonthlyProjection from "../components/BalanceMonthlyProjection.vue";
import { useUserStore } from "../stores/userStore";
// Estado y utilidades principales
const toast = useToast();
const eventStore = useEventStore();
const userStore = useUserStore();
// Componentes cargados de forma asíncrona para optimizar el rendimiento
const MonthSelector = defineAsyncComponent(
  () => import("../components/MonthSelector.vue")
);
const EventsMetrics = defineAsyncComponent(
  () => import("../components/BalanceEventsMetrics.vue")
);
const ProviderDistribution = defineAsyncComponent(
  () => import("../components/BalanceProviderDistribution.vue")
);
const LocationsPanel = defineAsyncComponent(
  () => import("../components/BalanceLocationsPanel.vue")
);
const makePayments = defineAsyncComponent(
  () => import("../components/BalanceMakePayments.vue")
);

// Estado de selección y toggles
const selectedMonth = ref(new Date());
const showTotalEvents = ref(false);
const showTotalRevenue = ref(false);
const showPendingPayments = ref(false);
const showCompletedPayments = ref(false);
const expandedProvider = ref<string | null>(null);
const showProviderDistribution = ref(false);
const showProviderRevenue = ref(false);
const showTopLocations = ref(false);
const showMakePayments = ref(false);

// Funciones para alternar visibilidad de paneles y secciones
const toggleTotalEvents = () => (showTotalEvents.value = !showTotalEvents.value);
const toggleTotalRevenue = () => (showTotalRevenue.value = !showTotalRevenue.value);
const togglePendingPayments = () =>
  (showPendingPayments.value = !showPendingPayments.value);
const toggleCompletedPayments = () =>
  (showCompletedPayments.value = !showCompletedPayments.value);
const toggleProvider = (provider: string) =>
  (expandedProvider.value = expandedProvider.value === provider ? null : provider);
const toggleProviderRevenue = () =>
  (showProviderRevenue.value = !showProviderRevenue.value);
const toggleProviderDistribution = () =>
  (showProviderDistribution.value = !showProviderDistribution.value);
const toggleTopLocations = () => (showTopLocations.value = !showTopLocations.value);

// Funciones para cambiar el mes seleccionado
const previousMonth = () => (selectedMonth.value = subMonths(selectedMonth.value, 1));
const nextMonth = () => (selectedMonth.value = addMonths(selectedMonth.value, 1));
const resetToCurrentMonth = () => (selectedMonth.value = new Date());

// Implementación de gestos táctiles (swipe) para cambiar de mes
const touchStartX = ref<number | null>(null);
const touchEndX = ref<number | null>(null);
const swipeThreshold = 50; // Umbral en píxeles para considerar un swipe

const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].clientX;
};

const handleTouchEnd = (e: TouchEvent) => {
  touchEndX.value = e.changedTouches[0].clientX;
  if (touchStartX.value !== null && touchEndX.value !== null) {
    const diff = touchStartX.value - touchEndX.value;
    if (Math.abs(diff) > swipeThreshold) {
      diff > 0 ? nextMonth() : previousMonth();
    }
  }
  // Reiniciar valores para el próximo gesto
  touchStartX.value = null;
  touchEndX.value = null;
};

// Función mejorada para manejar fechas de manera segura y consistente
function safeDate(dateStr: string | null): Date {
  if (!dateStr) return new Date();

  try {
    // Si la fecha está en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // Crear la fecha en la zona horaria local para evitar el desplazamiento
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(year, month - 1, day);
    }

    // Para otros formatos, usar el constructor estándar
    return new Date(dateStr);
  } catch (e) {
    console.error("Error al parsear fecha:", dateStr, e);
    return new Date();
  }
}

// Modificar la función monthEvents para usar la nueva función safeDate
const monthEvents = computed(() => {
  const start = startOfMonth(selectedMonth.value);
  const end = endOfMonth(selectedMonth.value);

  return eventStore.events.filter((event) => {
    if (!event.date) return false;

    // Usar la función mejorada para crear fechas consistentes
    const eventDate = safeDate(event.date);

    // Comparar año y mes directamente para evitar problemas de zona horaria
    return (
      eventDate.getFullYear() === start.getFullYear() &&
      eventDate.getMonth() === start.getMonth()
    );
  });
});

// Computed: Estadísticas mensuales
const monthlyStats = computed(() => {
  const events = monthEvents.value;
  const totalRevenue = events.reduce((sum, event) => sum + event.amount, 0);
  return {
    totalEvents: events.length,
    totalRevenue,
    averagePerEvent: events.length > 0 ? totalRevenue / events.length : 0,
  };
});

// Computed: Estadísticas por proveedor
const providerStats = computed(() => {
  const stats = new Map<string, { eventCount: number; revenue: number }>();
  monthEvents.value.forEach((event) => {
    const current = stats.get(event.provider) || { eventCount: 0, revenue: 0 };
    stats.set(event.provider, {
      eventCount: current.eventCount + 1,
      revenue: current.revenue + event.amount,
    });
  });
  return Array.from(stats.entries()).map(([name, data]) => ({ name, ...data }));
});

const sortedProviderStatsByRevenue = computed(() =>
  [...providerStats.value].sort((a, b) => b.revenue - a.revenue)
);

// Computed: Distribución de eventos por proveedor en porcentaje
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

// Computed: Filtrar eventos por estado de pago
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

// Renombrar alias para evitar conflicto con el tipo global Event
// Antes: type Event = MusicEvent;
type AppEvent = {
  id: string;
  createdAt: string;
  createdBy?: string;
  userIP?: string;
  coord?: { lat: number; lng: number };
  activityType: "Eventual" | "Fija";
  paymentStatus: "Pendiente" | "Pagado";
  date: string | null;
  description: string | null;
  location: string | null;
  provider: string | null;
  amount: number;
  time: string | null;
  userId: string;
  isFixed?: boolean;
};

interface EventGroups {
  [key: string]: AppEvent[];
}

// Computed: Agrupar eventos pendientes y completados por proveedor
const groupedPendingPayments = computed<EventGroups>(() =>
  pendingPayments.value.reduce((groups: EventGroups, event) => {
    // Asegurarse de que provider no sea null
    const provider = event.provider || "Sin proveedor";

    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push({
      ...event,
      isFixed: event.activityType === "Fija",
    });
    return groups;
  }, {})
);

const groupedCompletedPayments = computed<EventGroups>(() =>
  completedPayments.value.reduce((groups: EventGroups, event) => {
    // Asegurarse de que provider no sea null
    const provider = event.provider || "Sin proveedor";

    if (!groups[provider]) {
      groups[provider] = [];
    }
    groups[provider].push({
      ...event,
      isFixed: event.activityType === "Fija",
    });
    return groups;
  }, {})
);

// Computed: Estadísticas por ubicaciones y ordenarlas según recurrencia
const locationStats = computed(() => {
  const stats = new Map<string, { count: number }>();
  monthEvents.value.forEach((event) => {
    // Usar una ubicación por defecto si es null
    const location = event.location || "Sin ubicación";
    const current = stats.get(location) || { count: 0 };
    stats.set(location, { count: current.count + 1 });
  });
  return Array.from(stats.entries()).map(([name, data]) => ({ name, ...data }));
});

const sortedLocationsByRecurrence = computed(() =>
  [...locationStats.value].sort((a, b) => b.count - a.count)
);

// Usar en sortedMonthEvents
const sortedMonthEvents = computed(() => {
  return monthEvents.value
    .slice()
    .sort((a, b) => safeDate(b.date).getTime() - safeDate(a.date).getTime());
});

// Función para generar y descargar PDF de eventos de un proveedor
// Actualizar firma para usar AppEvent[] en lugar de Event[]
const generateProviderPDF = async (
  provider: string,
  events: AppEvent[]
): Promise<void> => {
  try {
    const fileName = `reporte_eventos_${provider.replace(/\s+/g, "_")}_${format(
      new Date(),
      "yyyyMMdd"
    )}.pdf`;

    toast.info("Generando PDF...");
    // Obtener datos bancarios del usuario
    userStore.fetchUserBankData().then((bankData) => {
      console.log("Datos bancarios cargados:", bankData);
    });
    toast.info("Cargando datos bancarios...");

    // Generar el documento PDF utilizando la plantilla, que internamente consulta bankData
    const docDefinition = getPendingEventsTemplate(provider, events);
    await createAndDownloadPdf((docDefinition as unknown) as TDocumentDefinitions, {
      fileName,
    });

    toast.success("PDF generado y descargado correctamente");
  } catch (error) {
    console.error("Error al generar PDF:", error);
    toast.error(`Error al generar el PDF: ${(error as Error).message}`);
    // Registrar el error para análisis
    logErrorToAnalytics("pdf_generation_error", {
      provider,
      errorMessage: (error as Error).message,
    });
  }
};

const itemsPerPage = ref(10);
const currentPage = ref(1);

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return sortedMonthEvents.value.slice(start, end);
});

// Modificar la función getEventsForMonth
const getEventsForMonth = (year: number, month: number) => {
  // Corregir el filtrado para incluir correctamente el día 1
  return events.value.filter((event) => {
    // Asegurarse de que event.date existe
    if (!event.date) return false;

    // Usar safeDate para manejar posibles valores nulos
    const eventDate = safeDate(event.date);

    // Extraer año y mes (0-11) del evento
    const eventYear = eventDate.getFullYear();
    const eventMonth = eventDate.getMonth();

    // Comparar año y mes (sin considerar el día)
    return eventYear === year && eventMonth === month;
  });
};
</script>

<style scoped>
.mt-4 {
  transition: all 0.3s ease-in-out;
}
</style>
