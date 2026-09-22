<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md transition-colors duration-300">
    <div class="flex justify-around py-2">
      <router-link
        to="/calendar"
        class="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        :class="{ 'text-purple-600 dark:text-purple-400': isActive('calendar') }"
      >
        <CalendarIcon class="h-6 w-6" />
        <span class="text-xs">Calendario</span>
      </router-link>
      <router-link
        :to="{ name: 'balance' }"
        class="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        :class="{ 'text-blue-600 dark:text-blue-400': isActive('balance') }"
      >
        <ChartBarIcon class="h-6 w-6" />
        <span class="text-xs">Balance</span>
      </router-link>
      <router-link
        to="/profile"
        class="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        :class="{ 'text-orange-600 dark:text-orange-400': isActive('profile') }"
      >
        <UserIcon class="h-6 w-6" />
        <span class="text-xs">Perfil</span>
      </router-link>
      <button
        @click="toggleTheme"
        class="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-300 transition-colors"
        :title="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
      >
        <SunIcon v-if="isDark" class="h-6 w-6" />
        <MoonIcon v-else class="h-6 w-6" />
        <span class="text-xs">{{ isDark ? 'Claro' : 'Oscuro' }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { CalendarIcon, UserIcon, ChartBarIcon } from "@heroicons/vue/24/outline";
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";
import { useTheme } from "../composables/useTheme";

const route = useRoute();
const { isDark, toggleTheme } = useTheme();

function isActive(routeName: string): boolean {
  return route.name === routeName;
}
</script>
<script lang="ts">
export default {
  name: "FooterLayout",
};
</script>
<style scoped>
nav {
  border-top: 1px solid #e5e7eb;
}
:root.dark nav {
  border-top-color: #374151;
}
</style>
