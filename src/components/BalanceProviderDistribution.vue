<template>
  <div v-if="props.providerDistribution.length" class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-6 transition-colors duration-300">
    <div
      class="flex justify-between items-center cursor-pointer"
      @click="emit('toggleProviderDistribution')"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
        Distribución de Eventos por Proveedor
      </h3>
      <ChevronDownIcon
        class="h-5 w-5 ml-2 transform transition-transform duration-200 text-gray-500 dark:text-gray-400"
        :class="{ 'rotate-180': showProviderDistribution }"
      />
    </div>
    <div v-if="showProviderDistribution" class="mt-4 space-y-3">
      <div
        v-for="provider in providerDistribution"
        :key="provider.name"
        class="bg-white dark:bg-gray-700 rounded-lg shadow-sm overflow-hidden"
      >
        <div
          class="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          @click="toggleProvider(provider.name)"
        >
          <div class="flex-1">
            <span class="font-medium text-gray-900 dark:text-gray-100">{{ provider.name }}</span>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ provider.eventCount }} eventos ({{ provider.percentage }}%)
            </p>
          </div>
          <ChevronDownIcon
            class="h-5 w-5 transform transition-transform duration-200 text-gray-500 dark:text-gray-400"
            :class="{ 'rotate-180': expandedProvider === provider.name }"
          />
        </div>

        <transition name="slide">
          <div
            v-if="
              expandedProvider === provider.name &&
              getProviderEvents(provider.name).length > 0
            "
            class="divide-y divide-gray-100 dark:divide-gray-600"
          >
            <div
              v-for="event in getProviderEvents(provider.name)"
              :key="event.id"
              class="p-3 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm text-gray-900 dark:text-gray-100">
                    {{ event.date ? formatDate(event.date) : "N/A" }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ event.location || "N/A" }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-500">{{ event.description || "N/A" }}</p>
                </div>
                <span class="font-medium text-gray-900 dark:text-gray-100">
                  {{ event.amount ? formatCurrency(event.amount) : "N/A" }}
                </span>
              </div>
            </div>
          </div>
          <div v-else-if="expandedProvider === provider.name" class="p-3 text-gray-600 dark:text-gray-400">
            <p>No events for this provider.</p>
          </div>
        </transition>
      </div>
    </div>
  </div>
  <div v-else class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mt-6 transition-colors duration-300">
    <p class="text-gray-600 dark:text-gray-400">No hay datos disponibles</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ChevronDownIcon } from "../utils/icons";
import { formatCurrency } from "../utils/helpers";
import { format, parseISO } from "date-fns";
import type { AppEvent } from "../types/event";

interface Provider {
  name: string;
  eventCount: number;
  percentage: string;
}

// Props y Emits
const props = defineProps<{
  providerDistribution: Provider[];
  showProviderDistribution: boolean;
  events: AppEvent[];
}>();

const emit = defineEmits<{
  (e: "toggleProviderDistribution"): void;
}>();

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

// 6. Funciones del componente
const toggleProvider = (provider: string): void => {
  expandedProvider.value = expandedProvider.value === provider ? null : provider;
};

const getProviderEvents = (provider: string): AppEvent[] => {
  if (!props.events) return [];
  return props.events
    .filter((event) => event.provider === provider)
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());
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
