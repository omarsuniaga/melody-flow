<template>
  <div class="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg transition-colors duration-300">
    <div class="cursor-pointer flex justify-between items-center">
      <h3 class="text-lg font-medium text-purple-900 dark:text-purple-300">Promedio por Evento</h3>
      <p class="text-3xl font-bold text-purple-600 dark:text-purple-400">
        {{ formatCurrency(averageAmount) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from "../utils/helpers";

defineProps<{
  averageAmount: number;
}>();
</script>
<script lang="ts">
// exportar componente
export default {
  name: "AverageEventPanel",
};
</script>
