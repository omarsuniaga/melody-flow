<template>
  <div class="grid grid-cols-7 gap-1">
    <!-- Day Headers -->
    <div
      v-for="day in weekDays"
      :key="day"
      class="p-1 sm:p-2 text-center text-xs sm:text-sm font-semibold text-gray-600"
    >
      {{ isMobile ? day.charAt(0) : day }}
    </div>

    <!-- Calendar Days -->
    <CalendarDay
      v-for="day in calendarDays"
      :key="day.date.toISOString()"
      :date="day.date"
      :events="getDateEvents(day.date)"
      :isMobile="isMobile"
      :isCurrentMonth="day.isCurrentMonth"
      @click-day="handleDayClick"
    />
  </div>
</template>

<script setup lang="ts">
import CalendarDay from "./CalendarDay.vue";

import { PropType } from "vue";

const props = defineProps({
  calendarDays: {
    type: Array as PropType<{ date: Date; isCurrentMonth: boolean }[]>,
    required: true,
  },
  getDateEvents: {
    type: Function as PropType<(date: Date) => any[]>,
    required: true,
  },
  isMobile: {
    type: Boolean,
    required: true,
  },
  weekDays: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits(["selectDate"]);

function selectDate(date: Date): void {
  emit("selectDate", date);
}

function handleDayClick(date: Date): void {
  emit("selectDate", date);
}
</script>
<script lang="ts">
export default {
  name: "CalendarGrid",
};
</script>
