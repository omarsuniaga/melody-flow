<template>
  <div class="bg-gray-50 p-4 rounded-lg mt-6">
    <div
      class="flex justify-between items-center cursor-pointer"
      @click="$emit('toggleTopLocations')"
    >
      <h3 class="text-lg font-medium text-gray-900">
        <span>Ubicaciones Principales</span>
      </h3>
      <ChevronDownIcon
        class="h-5 w-5 ml-2 transform transition-transform duration-200"
        :class="{ 'rotate-180': showTopLocations }"
      />
    </div>

    <transition name="slide">
      <div v-if="showTopLocations" class="mt-4 space-y-2 max-h-64 overflow-y-auto">
        <div
          v-for="location in sortedLocationsByRecurrence"
          :key="location.name"
          class="bg-white p-3 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex justify-between items-center"
        >
          <span class="text-gray-700">{{ location.name }}</span>
          <span class="font-medium text-blue-600">{{ location.count }} actividades</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";
import { ChevronDownIcon } from "../utils/icons";

defineProps<{
  sortedLocationsByRecurrence: Array<{ name: string; count: number }>;
  showTopLocations: boolean;
}>();

defineEmits<{
  (e: "toggleTopLocations"): void;
}>();
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
