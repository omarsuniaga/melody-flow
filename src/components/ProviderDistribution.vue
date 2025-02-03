<template>
  <div class="bg-gray-100 p-4 rounded-lg mt-6">
    <div
      class="flex justify-between items-center cursor-pointer"
      @click="$emit('toggleProviderDistribution')"
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
          <div v-if="expandedProvider === provider.name" class="divide-y divide-gray-100">
            <div
              v-for="event in getProviderEvents(provider.name)"
              :key="event.id"
              class="p-3 hover:bg-gray-50"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-sm text-gray-900">
                    {{ formatDate(event.date) }}
                  </p>
                  <p class="text-sm text-gray-600">{{ event.location }}</p>
                  <p class="text-xs text-gray-500">{{ event.description }}</p>
                </div>
                <span class="font-medium text-gray-900">
                  {{ formatCurrency(event.amount) }}
                </span>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, ref } from "vue";
import { ChevronDownIcon } from "../utils/icons";
import { formatCurrency } from "../utils/helpers";
import { parseISO, format } from "date-fns";
const expandedProvider = ref<string | null>(null);

const props = defineProps<{
  providerDistribution: Array<{ name: string; eventCount: number; percentage: string }>;
  showProviderDistribution: boolean;
  events: Array<{
    id: string;
    date: string;
    provider: string;
    location: string;
    amount: number;
    description?: string;
  }>;
}>();

const toggleProvider = (provider: string) => {
  expandedProvider.value = expandedProvider.value === provider ? null : provider;
};

const getProviderEvents = (provider: string) => {
  return props.events
    .filter((event) => event.provider === provider)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const formatDate = (dateString: string) => {
  const date = parseISO(dateString);
  return format(date, "dd/MM/yyyy");
};
</script>
<script lang="ts">
// exportar componente
export default {
  name: "ProviderDistribution",
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
