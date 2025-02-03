<template>
  <div class="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6">
    <h2 class="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
      <ChartBarIcon class="h-6 w-6 text-blue-600" />
      Balance Mensual - {{ formattedMonth }}
    </h2>
    <div class="flex items-center gap-4">
      <div class="flex gap-2">
        <button @click="$emit('previous')" class="btn btn-secondary">
          <ChevronLeftIcon class="h-5 w-5" />
        </button>
        <button @click="$emit('reset')" class="btn btn-secondary">Mes Actual</button>
        <button @click="$emit('next')" class="btn btn-secondary">
          <ChevronRightIcon class="h-5 w-5" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineProps } from "vue";
import { format } from "date-fns";
import { ChartBarIcon, ChevronLeftIcon, ChevronRightIcon } from "../utils/icons";

const props = defineProps<{
  selectedMonth: Date;
}>();

const formattedMonth = computed(() => format(props.selectedMonth, "MMMM yyyy"));
</script>
<script lang="ts">
// exportar componente
export default {
  name: "MonthSelector",
};
</script>
