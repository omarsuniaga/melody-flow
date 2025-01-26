<template>
  <div class="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
    <h2 class="text-xl sm:text-2xl font-bold text-gray-800">
      {{ title }}
    </h2>
    <CalendarNavigationButtons
      :currentDate="currentDate"
      @update:currentDate="$emit('update:currentDate', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import CalendarNavigationButtons from "./CalendarNavigationButtons.vue";
import { PropType } from "vue";
const props = defineProps({
  currentDate: {
    type: Date as PropType<Date>,
    required: true,
  },
  title: {
    type: String as PropType<string>,
    required: true,
  },
});

const emit = defineEmits<{
  (e: "update:currentDate", value: Date): void;
}>();
</script>
<script lang="ts">
export default {
  name: "CalendarHeader",
};
</script>
