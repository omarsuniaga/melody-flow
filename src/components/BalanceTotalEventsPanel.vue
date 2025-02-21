<!-- TotalEventsPanel.vue -->
<template>
  <div class="bg-indigo-50 p-4 rounded-lg">
    <div
      @click="$emit('toggleTotalEvents')"
      class="cursor-pointer flex justify-between items-center"
    >
      <h3 class="text-lg font-medium text-indigo-900">
        <span>Total de Eventos</span>
      </h3>
      <div class="flex items-center">
        <p class="text-3xl font-bold text-indigo-600">{{ totalEvents }}</p>
        <ChevronDownIcon
          class="h-5 w-5 ml-2 transform transition-transform duration-200"
          :class="{ 'rotate-180': showTotalEvents }"
        />
      </div>
    </div>

    <transition name="slide">
      <div v-if="showTotalEvents" class="mt-4 space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="event in sortedEvents"
          :key="event.id"
          class="bg-white p-2 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium text-indigo-900">{{ event.provider }}</p>
              <p class="text-sm text-gray-600">
                {{ formatDate(event.date) }}
              </p>
              <p class="text-xs text-gray-500">{{ event.location }}</p>
            </div>
            <span class="font-medium text-indigo-600">
              {{ formatCurrency(event.amount) }}
            </span>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronDownIcon } from "../utils/icons";
import { formatCurrency } from "../utils/helpers";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const props = defineProps<{
  totalEvents: number;
  events: Array<{
    id: string;
    date: string;
    provider: string;
    location: string;
    amount: number;
  }>;
  showTotalEvents: boolean;
}>();

defineEmits<{
  (e: "toggleTotalEvents"): void;
}>();

const formatDate = (date: string) => {
  try {
    return format(new Date(date), "EEEE d 'de' MMMM", { locale: es });
  } catch {
    return "Fecha inválida";
  }
};

const sortedEvents = computed(() => {
  if (!props.events?.length) return [];
  return [...props.events].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
});
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
