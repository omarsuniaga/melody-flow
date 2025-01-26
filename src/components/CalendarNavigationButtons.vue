<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "../utils/icons";
import ButtonComponent from "./ButtonComponent.vue";
import { format, addMonths, subMonths } from "date-fns";
import { computed } from "vue";
import { es } from "date-fns/locale";

type Props = {
  currentDate: Date;
};

const props = withDefaults(defineProps<Props>(), {
  currentDate: () => new Date(),
});

const emit = defineEmits<{
  "update:currentDate": [date: Date];
}>();

function previousMonth(): void {
  emit("update:currentDate", subMonths(props.currentDate, 1));
}

function nextMonth(): void {
  emit("update:currentDate", addMonths(props.currentDate, 1));
}

function goToToday(): void {
  emit("update:currentDate", new Date());
}

const currentMonthLabel = computed(() => {
  return format(props.currentDate, "MMMM yyyy", { locale: es });
});
</script>
<script lang="ts">
export default {
  name: "CalendarNavigationButtons",
};
</script>

<template>
  <div
    class="flex items-center gap-2 px-4 py-2"
    role="group"
    aria-label="Navegación del calendario"
  >
    <ButtonComponent
      type="button"
      variant="secondary"
      class="p-1 sm:p-2 hover:bg-gray-100"
      aria-label="Mes anterior"
      @click="previousMonth"
    >
      <ChevronLeftIcon class="h-4 w-4 sm:h-5 sm:w-5" />
    </ButtonComponent>

    <ButtonComponent
      type="button"
      variant="primary"
      class="px-3 py-1 text-sm font-medium"
      @click="goToToday"
    >
      Hoy
    </ButtonComponent>

    <span class="text-sm font-medium text-gray-700 min-w-[120px] text-center">
      {{ currentMonthLabel }}
    </span>

    <ButtonComponent
      type="button"
      variant="secondary"
      class="p-1 sm:p-2 hover:bg-gray-100"
      aria-label="Mes siguiente"
      @click="nextMonth"
    >
      <ChevronRightIcon class="h-4 w-4 sm:h-5 sm:w-5" />
    </ButtonComponent>
  </div>
</template>

<style lang="postcss">
.button-group {
  @apply inline-flex rounded-md shadow-sm;
}

.button-group > :first-child {
  @apply rounded-l-md;
}

.button-group > :last-child {
  @apply rounded-r-md;
}
</style>
