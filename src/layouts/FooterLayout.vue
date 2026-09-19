<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white shadow-md">
    <div class="flex justify-around py-2">
      <router-link
        to="/calendar"
        class="flex flex-col items-center"
        :class="{ 'text-purple-600': isActive('calendar') }"
      >
        <CalendarIcon class="h-6 w-6" />
        <span class="text-xs">Calendario</span>
      </router-link>
      <!-- Se actualiza el link de balance para usar la ruta nombrada "balance" -->
      <router-link
        :to="{ name: 'balance' }"
        class="flex flex-col items-center"
        :class="{ 'text-blue-600': isActive('balance') }"
      >
        <ChartBarIcon class="h-6 w-6" />
        <span class="text-xs">Balance</span>
      </router-link>
      <router-link
        to="/profile"
        class="flex flex-col items-center"
        :class="{ 'text-orange-600': isActive('profile') }"
      >
        <UserIcon class="h-6 w-6" />
        <span class="text-xs">Perfil</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import { CalendarIcon, UserIcon, ChartBarIcon } from "@heroicons/vue/24/outline";

// Función para comparar el nombre de la ruta actual
const route = useRoute();
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
  background-color: #fff;
  border-top: 1px solid #e5e7eb;
}
</style>
