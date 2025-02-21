<template>
  <div class="bg-green-50 p-4 rounded-lg">
    <!-- Encabezado principal -->
    <div @click="$emit('toggleTotalRevenue')" class="cursor-pointer">
      <h3 class="text-lg font-medium text-green-900 flex items-center justify-between">
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

    <!-- Panel de categorías de pago -->
    <transition name="slide">
      <div v-if="showTotalRevenue" class="mt-4 space-y-3">
        <!-- Eventos Pendientes -->
        <div class="bg-red-100 rounded-lg overflow-hidden">
          <div class="p-3 cursor-pointer hover:bg-red-50" @click="togglePendingPayments">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium text-red-900">Eventos Pendientes</p>
                <p class="text-sm text-red-700">{{ pendingEvents.length }} eventos</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-red-900">
                  {{ formatCurrency(totalPendingAmount) }}
                </span>
                <ChevronDownIcon
                  class="h-5 w-5 transform transition-transform duration-200"
                  :class="{ 'rotate-180': showPendingSection }"
                />
              </div>
            </div>
          </div>

          <!-- Lista de eventos pendientes -->
          <div v-if="showPendingSection" class="divide-y divide-red-50">
            <div v-for="event in pendingEvents" :key="event.id" class="p-3 bg-white">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-900">{{ event.provider }}</p>
                  <p class="text-sm text-gray-600">{{ formatDate(event.date) }}</p>
                  <p class="text-xs text-gray-500">{{ event.location }}</p>
                </div>
                <span class="font-medium text-red-600">
                  {{ formatCurrency(event.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Eventos Pagados -->
        <div class="bg-green-100 rounded-lg overflow-hidden">
          <div class="p-3 cursor-pointer hover:bg-green-50" @click="togglePaidPayments">
            <div class="flex justify-between items-center">
              <div>
                <p class="font-medium text-green-900">Eventos Pagados</p>
                <p class="text-sm text-green-700">{{ paidEvents.length }} eventos</p>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-medium text-green-900">
                  {{ formatCurrency(totalPaidAmount) }}
                </span>
                <ChevronDownIcon
                  class="h-5 w-5 transform transition-transform duration-200"
                  :class="{ 'rotate-180': showPaidSection }"
                />
              </div>
            </div>
          </div>

          <!-- Lista de eventos pagados -->
          <div v-if="showPaidSection" class="divide-y divide-green-50">
            <div v-for="event in paidEvents" :key="event.id" class="p-3 bg-white">
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-medium text-gray-900">{{ event.provider }}</p>
                  <p class="text-sm text-gray-600">{{ formatDate(event.date) }}</p>
                  <p class="text-xs text-gray-500">{{ event.location }}</p>
                </div>
                <span class="font-medium text-green-600">
                  {{ formatCurrency(event.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ChevronDownIcon } from "../utils/icons";
import { formatCurrency } from "../utils/helpers";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// Estado local para las secciones expandibles
const showPendingSection = ref(false);
const showPaidSection = ref(false);

const props = defineProps<{
  monthlyStats: { totalEvents: number; totalRevenue: number; averagePerEvent: number };
  showTotalRevenue: boolean;
  events: Array<{
    id: string;
    date: string;
    provider: string;
    location: string;
    amount: number;
    paymentStatus: string;
  }>;
}>();

// Formato de fecha
const formatDate = (date: string) => {
  return format(parseISO(date), "EEEE d 'de' MMMM, yyyy", { locale: es });
};

// Computed properties para los eventos
const pendingEvents = computed(() => {
  return props.events
    .filter((event) => event.paymentStatus === "Pendiente")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const paidEvents = computed(() => {
  return props.events
    .filter((event) => event.paymentStatus === "Pagado")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const totalPendingAmount = computed(() =>
  pendingEvents.value.reduce((sum, event) => sum + event.amount, 0)
);

const totalPaidAmount = computed(() =>
  paidEvents.value.reduce((sum, event) => sum + event.amount, 0)
);

// Toggle functions
const togglePendingPayments = () => {
  showPendingSection.value = !showPendingSection.value;
  if (showPendingSection.value) showPaidSection.value = false;
};

const togglePaidPayments = () => {
  showPaidSection.value = !showPaidSection.value;
  if (showPaidSection.value) showPendingSection.value = false;
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
</style>
