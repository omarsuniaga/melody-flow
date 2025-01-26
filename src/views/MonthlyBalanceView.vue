<template>
  <div class="min-h-screen p-2 sm:p-4">
    <div class="max-w-7xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <!-- Title and Month Selector -->
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
          <h2 class="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ChartBarIcon class="h-6 w-6 text-blue-600" />
            Balance Mensual - {{ format(selectedMonth, "MMMM yyyy") }}
          </h2>
          <div class="flex items-center gap-4">
            <div class="flex gap-2">
              <button @click="previousMonth" class="btn btn-secondary">
                <ChevronLeftIcon class="h-5 w-5" />
              </button>
              <button @click="selectedMonth = new Date()" class="btn btn-secondary">
                Mes Actual
              </button>
              <button @click="nextMonth" class="btn btn-secondary">
                <ChevronRightIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div @click="toggleTotalEvents" class="cursor-pointer">
              <h3
                class="text-lg font-medium text-blue-900 flex items-center justify-between"
              >
                <span>Eventos Totales</span>
                <ChevronDownIcon
                  class="h-5 w-5 ml-2 transform transition-transform duration-200"
                  :class="{ 'rotate-180': showTotalEvents }"
                />
              </h3>
              <p class="text-3xl font-bold text-blue-600">
                {{ monthlyStats.totalEvents }}
              </p>
            </div>

            <!-- Panel expandible de eventos totales -->
            <div v-if="showTotalEvents" class="mt-4 space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="provider in sortedProviderStatsByEvents"
                :key="provider.name"
                class="flex justify-between items-center p-2 bg-white rounded"
              >
                <span class="text-gray-700">{{ provider.name }}</span>
                <span class="font-medium text-blue-600"
                  >{{ provider.eventCount }} eventos</span
                >
              </div>
            </div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div @click="toggleTotalRevenue" class="cursor-pointer">
              <h3
                class="text-lg font-medium text-green-900 flex items-center justify-between"
              >
                <span>Ingresos Totales</span>
                <ChevronDownIcon
                  class="h-5 w-5 ml-2 transform transition-transform duration-200"
                  :class="{ 'rotate-180': showTotalRevenue }"
                />
              </h3>
              <p class="text-3xl font-bold text-green-600">
                {{ formatCurrency(monthlyStats.totalRevenue) }}
              </p>
            </div>

            <!-- Panel expandible de ingresos totales -->
            <div v-if="showTotalRevenue" class="mt-4 space-y-4">
              <!-- Eventos Pendientes -->
              <div class="bg-red-100 p-3 rounded">
                <div
                  @click="togglePendingPayments"
                  class="cursor-pointer flex justify-between items-center"
                >
                  <span class="font-medium">Eventos Pendientes</span>
                  <div class="flex items-center">
                    <span>{{ formatCurrency(totalPendingAmount) }}</span>
                    <ChevronDownIcon
                      class="h-5 w-5 ml-2 transform transition-transform duration-200"
                      :class="{ 'rotate-180': showPendingPayments }"
                    />
                  </div>
                </div>
                <div v-if="showPendingPayments" class="mt-2">
                  <div
                    v-for="(events, provider) in groupedPendingPayments"
                    :key="provider"
                  >
                    <div
                      class="flex items-center p-2 bg-white rounded cursor-pointer"
                      @click="toggleProvider(String(provider))"
                    >
                      <div class="flex-none w-48">
                        <p class="font-medium">{{ provider }}</p>
                        <p class="text-sm text-gray-600">{{ events.length }} eventos</p>
                      </div>
                      <div class="flex-grow text-center">
                        <span class="font-medium text-red-600">{{
                          formatCurrency(
                            events.reduce((sum, event) => sum + event.amount, 0)
                          )
                        }}</span>
                      </div>
                      <button
                        @click.stop="generateProviderPDF(String(provider), events)"
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
                    <div v-if="expandedProvider === provider" class="pl-4">
                      <div
                        v-for="event in sortedEvents(events)"
                        :key="event.id"
                        class="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p class="text-sm text-gray-600">
                            {{ format(parseISO(event.date), "MMM d, yyyy") }}
                          </p>
                          <p class="text-sm text-gray-600">{{ event.location }}</p>
                        </div>
                        <span class="font-medium text-red-600">{{
                          formatCurrency(event.amount)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Eventos Pagados -->
              <div class="bg-green-100 p-3 rounded">
                <div
                  @click="toggleCompletedPayments"
                  class="cursor-pointer flex justify-between items-center"
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
                  >
                    <div
                      class="flex justify-between items-center p-2 bg-white rounded cursor-pointer"
                      @click="toggleProvider(String(provider))"
                    >
                      <div>
                        <p class="font-medium">{{ provider }}</p>
                        <p class="text-sm text-gray-600">{{ events.length }} eventos</p>
                      </div>
                      <span class="font-medium text-green-600">{{
                        formatCurrency(
                          events.reduce((sum, event) => sum + event.amount, 0)
                        )
                      }}</span>
                    </div>
                    <div v-if="expandedProvider === provider" class="pl-4">
                      <div
                        v-for="event in sortedEvents(events)"
                        :key="event.id"
                        class="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <div>
                          <p class="text-sm text-gray-600">
                            {{ format(parseISO(event.date), "MMM d, yyyy") }}
                          </p>
                          <p class="text-sm text-gray-600">{{ event.location }}</p>
                        </div>
                        <span class="font-medium text-green-600">{{
                          formatCurrency(event.amount)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <h3 class="text-lg font-medium text-purple-900">Promedio por Evento</h3>
            <p class="text-3xl font-bold text-purple-600">
              {{ formatCurrency(monthlyStats.averagePerEvent) }}
            </p>
          </div>
        </div>

        <!-- Provider Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Provider Revenue Breakdown -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3
              class="text-lg font-medium text-gray-900 mb-4 cursor-pointer flex items-center"
              @click="toggleProviderRevenue"
            >
              Ingresos por Proveedor
              <ChevronDownIcon class="h-5 w-5 ml-2" />
            </h3>
            <div v-if="showProviderRevenue" class="space-y-2 max-h-64 overflow-y-auto">
              <div
                v-for="provider in sortedProviderStatsByRevenue"
                :key="provider.name"
                class="flex justify-between items-center"
              >
                <span class="text-gray-700">{{ provider.name }}</span>
                <span class="font-medium">{{ formatCurrency(provider.revenue) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Status Lists -->

        <!-- Locations with Most Activities -->
        <div class="bg-gray-50 p-4 rounded-lg mt-6">
          <h3
            class="text-lg font-medium text-gray-900 mb-4 cursor-pointer flex items-center"
            @click="toggleTopLocations"
          >
            Ubicaciones Principales
            <ChevronDownIcon class="h-5 w-5 ml-2" />
          </h3>
          <div v-if="showTopLocations" class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="location in sortedLocationsByRecurrence"
              :key="location.name"
              class="flex justify-between items-center"
            >
              <span class="text-gray-700">{{ location.name }}</span>
              <span class="font-medium">{{ location.count }} actividades</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useToast } from "vue-toastification"; // Cambiar esta línea
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";
import ChevronLeftIcon from "@heroicons/vue/24/outline/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/vue/24/outline/ChevronRightIcon";
import { ChevronDownIcon, ChartBarIcon } from "@heroicons/vue/24/outline";
import { useEventStore } from "../stores/eventStore";
import { useRouter } from "vue-router";
import { getPendingEventsTemplate } from "../utils/pdfTemplates";
import { useUserStore } from "../stores/userStore";
import { initializePdfMake } from "../utils/pdfMakeConfig";

const toast = useToast(); // Agregar esta línea

const eventStore = useEventStore();
const selectedMonth = ref(new Date());
const showPendingPayments = ref(false);
const showCompletedPayments = ref(false);
const expandedProvider = ref<string | null>(null);

const showProviderDistribution = ref(false);
const showProviderRevenue = ref(false);
const showTopLocations = ref(false);
const showTotalRevenue = ref(false); // Agregar nuevo ref para controlar la expansión del panel de ingresos totales
const showTotalEvents = ref(false); // Agregar nuevo ref para controlar la expansión del panel de eventos totales

const router = useRouter();
const userStore = useUserStore();

function togglePendingPayments() {
  showPendingPayments.value = !showPendingPayments.value;
}

function toggleCompletedPayments() {
  showCompletedPayments.value = !showCompletedPayments.value;
}

function toggleProvider(provider: string): void {
  expandedProvider.value = expandedProvider.value === provider ? null : provider;
}

function toggleProviderDistribution() {
  showProviderDistribution.value = !showProviderDistribution.value;
}

function toggleProviderRevenue() {
  showProviderRevenue.value = !showProviderRevenue.value;
}

function toggleTopLocations() {
  showTopLocations.value = !showTopLocations.value;
}

function toggleTotalRevenue() {
  // Agregar nueva función para alternar la visualización del panel de ingresos totales
  showTotalRevenue.value = !showTotalRevenue.value;
}

function toggleTotalEvents() {
  // Agregar nueva función para alternar la visualización del panel de eventos totales
  showTotalEvents.value = !showTotalEvents.value;
}

// Get all events for the selected month
const monthEvents = computed(() => {
  const start = startOfMonth(selectedMonth.value);
  const end = endOfMonth(selectedMonth.value);
  return eventStore.events.filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= start && eventDate <= end;
  });
});

// Calculate monthly statistics
const monthlyStats = computed(() => {
  const events = monthEvents.value;
  const totalRevenue = events.reduce((sum, event) => sum + event.amount, 0);
  return {
    totalEvents: events.length,
    totalRevenue,
    averagePerEvent: events.length > 0 ? totalRevenue / events.length : 0,
  };
});

// Calculate provider statistics
const providerStats = computed(() => {
  const stats = new Map();

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

// Sort provider statistics by events and revenue
const sortedProviderStatsByEvents = computed(() => {
  return providerStats.value.sort((a, b) => b.eventCount - a.eventCount);
});

const sortedProviderStatsByRevenue = computed(() => {
  return providerStats.value.sort((a, b) => b.revenue - a.revenue);
});

// Filter events by payment status
const pendingPayments = computed(() =>
  monthEvents.value.filter((event) => event.paymentStatus === "Pendiente")
);

const completedPayments = computed(() =>
  monthEvents.value.filter((event) => event.paymentStatus === "Pagado")
);

// Actualizar la definición del tipo MusicEvent para que coincida con la estructura real
type MusicEvent = {
  id: string; // Cambiado de number a string
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

type EventGroups = {
  [key: string]: MusicEvent[];
};

// Group events by provider con el tipo correcto
const groupedPendingPayments = computed(() => {
  return pendingPayments.value.reduce((groups: EventGroups, event) => {
    if (!groups[event.provider]) {
      groups[event.provider] = [];
    }
    groups[event.provider].push(event);
    return groups;
  }, {});
});

const groupedCompletedPayments = computed(() => {
  return completedPayments.value.reduce((groups: EventGroups, event) => {
    if (!groups[event.provider]) {
      groups[event.provider] = [];
    }
    groups[event.provider].push(event);
    return groups;
  }, {});
});

// Calculate locations with most activities
const locationStats = computed(() => {
  const stats = new Map();

  monthEvents.value.forEach((event) => {
    const current = stats.get(event.location) || { count: 0 };
    stats.set(event.location, {
      count: current.count + 1,
    });
  });

  return Array.from(stats.entries()).map(([name, data]) => ({
    name,
    ...data,
  }));
});

const sortedLocationsByRecurrence = computed(() => {
  return locationStats.value.sort((a, b) => b.count - a.count);
});

const totalPendingAmount = computed(() => {
  return pendingPayments.value.reduce((sum, event) => sum + event.amount, 0);
});

const totalCompletedAmount = computed(() => {
  return completedPayments.value.reduce((sum, event) => sum + event.amount, 0);
});

function previousMonth() {
  selectedMonth.value = subMonths(selectedMonth.value, 1);
}

function nextMonth() {
  selectedMonth.value = addMonths(selectedMonth.value, 1);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Añadir función para ordenar eventos
function sortedEvents(events: any[]) {
  return [...events].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

// Modificar la función generateProviderPDF
const generateProviderPDF = async (provider: string, events: any[]) => {
  try {
    const pdfMake = await initializePdfMake();
    toast.info("Generando PDF..."); // Cambiado a .info para mostrar un loading más simple

    const docDefinition = await getPendingEventsTemplate(provider, events);

    pdfMake
      .createPdf(docDefinition)
      .download(`eventos_${provider}_${format(new Date(), "yyyyMMdd")}.pdf`);

    toast.success("PDF generado correctamente");
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast.error("Error al generar el PDF");
  }
};

// Actualiza las interfaces de tipos
interface ProviderStats {
  name: string;
  eventCount: number;
  revenue: number;
}

interface LocationStats {
  name: string;
  count: number;
}

interface MonthlyStats {
  totalEvents: number;
  totalRevenue: number;
  averagePerEvent: number;
}
</script>

<style scoped>
/* Opcional: agregar animaciones para una mejor experiencia de usuario */
.mt-4 {
  transition: all 0.3s ease-in-out;
}
</style>
