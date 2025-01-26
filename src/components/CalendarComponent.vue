<template>
  <div class="calendar-component">
    <div :class="['calendar-container', { dark: isDark }]">
      <!-- Calendar Header -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-semibold">{{ currentMonthName }}</h2>
        <div class="flex gap-2">
          <button @click="previousMonth" class="btn-nav">
            <ChevronLeftIcon class="h-5 w-5" />
          </button>
          <button @click="currentDate = new Date()" class="btn-today">Hoy</button>
          <button @click="nextMonth" class="btn-nav">
            <ChevronRightIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Calendar Grid -->
      <div role="grid" class="calendar-grid">
        <!-- Weekday Headers -->
        <div
          v-for="day in weekDays"
          :key="day"
          role="columnheader"
          class="weekday-header"
        >
          {{ day }}
        </div>

        <!-- Calendar Days -->
        <div
          v-for="day in calendarDays"
          :key="day.date.toISOString()"
          role="gridcell"
          :class="[
            'calendar-day',
            { 'current-month': day.isCurrentMonth },
            { 'has-events': day.events.length > 0 },
          ]"
          @click="selectDate(day.date)"
        >
          <span class="day-number">{{ day.date.getDate() }}</span>
          <div v-if="day.events.length > 0" class="event-indicator">
            {{ day.events.length }}
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <TransitionRoot :show="isLoading" as="template">
        <div class="loading-overlay">
          <LoadingSpinner />
        </div>
      </TransitionRoot>

      <!-- Error Message -->
      <TransitionRoot :show="!!error" as="template">
        <div class="error-message">
          {{ error }}
        </div>
      </TransitionRoot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineExpose, defineEmits } from "vue";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
} from "date-fns";
import { MusicEvent } from "../types/event";
import ChevronLeftIcon from "@heroicons/vue/24/outline/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/vue/24/outline/ChevronRightIcon";

// Props
import { PropType } from "vue";

const props = defineProps({
  events: {
    type: Array as PropType<MusicEvent[]>,
    required: true,
  },
  isDark: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select-date"]);
const currentDate = ref(new Date());
const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const isLoading = ref(false); // Add this line to define isLoading
const error = ref<string | null>(null); // Add this line to define error

// Métodos expuestos
function previousMonth() {
  currentDate.value = subMonths(currentDate.value, 1);
}

function nextMonth() {
  currentDate.value = addMonths(currentDate.value, 1);
}

function getCurrentDate() {
  return currentDate.value;
}

function selectDate(date: Date) {
  // Emitir evento para seleccionar la fecha
  emit("select-date", date);
}

// Exponer métodos
defineExpose({ previousMonth, nextMonth, getCurrentDate });

// Computed properties
const currentMonthName = computed(() => {
  return format(currentDate.value, "MMMM yyyy");
});

const calendarDays = computed(() => {
  const start = startOfMonth(currentDate.value);
  const end = endOfMonth(currentDate.value);
  const days = eachDayOfInterval({ start, end }).map((date) => {
    return {
      date,
      isCurrentMonth: isSameMonth(date, currentDate.value),
      events: props.events.filter(
        (event) =>
          format(new Date(event.date), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      ),
    };
  });
  return days;
});
</script>
<script lang="ts">
export default {
  name: "CalendarComponent",
};
</script>

<style lang="postcss">
.calendar-container {
  @apply p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg;
}

.calendar-grid {
  @apply grid grid-cols-7 gap-1;
}

.weekday-header {
  @apply p-2 text-center font-medium text-gray-600 dark:text-gray-300;
}

.calendar-day {
  @apply p-2 min-h-[100px] border rounded-md relative transition-all
         hover:border-blue-500 dark:border-gray-600;
}

.current-month {
  @apply bg-white dark:bg-gray-700;
}

.has-events {
  @apply bg-blue-50 dark:bg-blue-900;
}

.day-number {
  @apply text-sm font-medium text-gray-700 dark:text-gray-200;
}

.event-indicator {
  @apply absolute top-2 right-2 w-6 h-6 flex items-center justify-center
         rounded-full bg-blue-500 text-white text-xs font-medium;
}

.btn-nav {
  @apply p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
         text-gray-600 dark:text-gray-300 transition-colors;
}

.btn-today {
  @apply px-4 py-2 rounded-md bg-blue-500 text-white
         hover:bg-blue-600 transition-colors;
}

/* Transitions */
.calendar-enter-active,
.calendar-leave-active {
  transition: all 0.3s ease;
}

.calendar-enter-from,
.calendar-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* Dark mode transitions */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1f2937;
}

:root[class~="dark"] {
  --bg-primary: #1f2937;
  --text-primary: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1f2937;
    --text-primary: #ffffff;
  }
}
</style>
