<template>
  <div class="bg-blue-50 p-4 rounded-lg">
    <div class="cursor-pointer flex justify-between items-center">
      <h3 class="text-lg font-medium text-purple-900">Promedio por Evento</h3>
      <p class="text-3xl font-bold text-purple-600">
        {{ formatCurrency(averageAmount) }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from "vue";
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
