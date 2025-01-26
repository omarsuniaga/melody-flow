<script setup lang="ts">
import { computed } from "vue";
import { isToday } from "date-fns";
import type { MusicEvent } from "../types/event";

interface Props {
  date: Date;
  events: MusicEvent[];
  isCurrentMonth: boolean;
  isMobile: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "click-day", date: Date): void;
}>();

const dayNumber = computed(() => props.date.getDate());

const today = computed(() => isToday(props.date));

const hasEvents = computed(() => props.events.length > 0);

const dayColorClass = computed(() => {
  if (hasEvents.value) {
    const hasUnpaidEvents = props.events.some(
      (event) => event.paymentStatus === "Pendiente"
    );
    return hasUnpaidEvents ? "bg-pink-100" : "bg-green-100";
  }
  return "";
});

function selectDate() {
  emit("click-day", props.date);
}
</script>

<template>
  <div
    :class="[
      'p-1 sm:p-2 min-h-[45px] sm:min-h-[80px] md:min-h-[100px] border rounded-md relative',
      today ? 'border-blue-500' : 'border-gray-200',
      hasEvents ? dayColorClass : '',
      'cursor-pointer hover:border-blue-300',
      !isCurrentMonth ? 'opacity-50' : '',
    ]"
    @click="selectDate"
  >
    <div class="flex justify-between items-start">
      <span
        :class="[
          'text-xs sm:text-sm font-medium',
          !isCurrentMonth ? 'text-gray-400' : 'text-gray-700',
        ]"
      >
        {{ dayNumber }}
      </span>
      <!-- Badge de eventos optimizado para móvil -->
      <div
        v-if="hasEvents"
        class="flex items-center justify-center min-w-[1rem] sm:min-w-[1.25rem] h-4 sm:h-5 px-1 text-[10px] sm:text-xs font-bold text-white bg-blue-500 rounded-full shadow-sm"
      >
        {{ events.length }}
      </div>
    </div>
    <!-- Vista previa de eventos optimizada -->
    <div
      class="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1 max-h-[60px] sm:max-h-[100px] overflow-y-auto"
    >
      <div
        v-for="(event, index) in events.slice(0, isMobile ? 1 : 2)"
        :key="index"
        class="text-[8px] sm:text-[10px] md:text-xs truncate p-0.5 rounded"
        :class="
          event.paymentStatus === 'Pagado'
            ? 'bg-green-200 text-green-800'
            : 'bg-red-200 text-red-800'
        "
      >
        {{ event.provider }}
      </div>
      <div
        v-if="events.length > (isMobile ? 1 : 2)"
        class="text-[8px] sm:text-[10px] md:text-xs text-gray-500 pl-0.5"
      >
        +{{ events.length - (isMobile ? 1 : 2) }}
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
/* necesito un scrollview */

.calendar-day {
  @apply transition-all duration-200 ease-in-out;
}

.calendar-day:hover {
  @apply transform scale-[1.02] shadow-sm;
}

.event-badge {
  @apply absolute top-1 right-1 flex items-center justify-center;
}

@media (max-width: 640px) {
  .event-badge {
    @apply top-0.5 right-0.5;
  }
}
</style>
<script lang="ts">
export default {
  name: "CalendarDay",
};
</script>
