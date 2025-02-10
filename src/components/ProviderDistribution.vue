<template>
  <div v-if="props.providerDistribution.length" class="bg-gray-100 p-4 rounded-lg mt-6">
    <div
      class="flex justify-between items-center cursor-pointer"
      @click="emit('toggleProviderDistribution')"
    >
      <h3 class="text-lg font-medium text-gray-900">
        Distribución de Eventos por Proveedor
      </h3>
      <ChevronDownIcon
        class="h-5 w-5 ml-2 transform transition-transform duration-200"
        :class="{ 'rotate-180': showProviderDistribution }"
      />
    </div>
    <div v-if="showProviderDistribution" class="mt-4 space-y-3">
      <div
        v-for="provider in providerDistribution"
        :key="provider.name"
        class="bg-white rounded-lg shadow-sm overflow-hidden"
      >
        <div
          class="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          @click="toggleProvider(provider.name)"
        >
          <div class="flex-1">
            <span class="font-medium text-gray-900">{{ provider.name }}</span>
            <p class="text-sm text-gray-600">
              {{ provider.eventCount }} eventos ({{ provider.percentage }}%)
            </p>
          </div>
          <ChevronDownIcon
            class="h-5 w-5 transform transition-transform duration-200"
            :class="{ 'rotate-180': expandedProvider === provider.name }"
          />
        </div>

        <transition name="slide">
          <div
            v-if="
              expandedProvider === provider.name &&
              getProviderEvents(provider.name).length > 0
            "
            class="divide-y divide-gray-100"
          >
            <div
              v-for="event in getProviderEvents(provider.name)"
              :key="event.id"
              class="p-3 hover:bg-gray-50"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm text-gray-900">
                    {{ event.date ? formatDate(event.date) : "N/A" }}
                  </p>
                  <p class="text-sm text-gray-600">{{ event.location || "N/A" }}</p>
                  <p class="text-xs text-gray-500">{{ event.description || "N/A" }}</p>
                </div>
                <span class="font-medium text-gray-900">
                  {{ event.amount ? formatCurrency(event.amount) : "N/A" }}
                </span>
              </div>
            </div>
          </div>
          <div v-else-if="expandedProvider === provider.name">
            <p>No events for this provider.</p>
          </div>
        </transition>
      </div>
    </div>
  </div>
  <div v-else class="bg-gray-100 p-4 rounded-lg mt-6">
    <p class="text-gray-600">No hay datos disponibles</p>
  </div>
</template>

<script setup lang="ts">
// 1. Primero los tipos
interface Event {
  id: string;
  date: string;
  provider: string;
  location: string;
  amount: number;
  description?: string;
}

interface Provider {
  name: string;
  eventCount: number;
  percentage: string;
}

// 2. Props y Emits
const props = defineProps<{
  providerDistribution: Provider[];
  showProviderDistribution: boolean;
  events: Event[];
}>();

const emit = defineEmits<{
  (e: "toggleProviderDistribution"): void;
}>();

// 3. Importaciones
import { ref } from "vue";
import { ChevronDownIcon } from "../utils/icons";
import { formatCurrency } from "../utils/helpers";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// 4. Referencias y estado
const expandedProvider = ref<string | null>(null);

// 5. Funciones utilitarias
const formatDate = (dateString?: string): string => {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "dd/MM/yyyy");
  } catch {
    return "N/A";
  }
};

const formatCurrencyHelper = (amount?: number): string => {
  if (amount == null) return "N/A";
  try {
    return formatCurrency(amount);
  } catch {
    return "N/A";
  }
};

// 6. Funciones del componente
const toggleProvider = (provider: string): void => {
  expandedProvider.value = expandedProvider.value === provider ? null : provider;
};

const getProviderEvents = (provider: string): Event[] => {
  if (!props.events) return [];
  return props.events
    .filter((event) => event.provider === provider)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

.divide-y > * + * {
  border-top-width: 1px;
}
</style>
