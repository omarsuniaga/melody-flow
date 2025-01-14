<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Opcional: Barra superior para evento del día -->
    <div v-if="todayEvent" class="bg-white shadow px-4 py-2">
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <CalendarIcon class="h-5 w-5 text-blue-600" />
            <span class="text-sm">Evento de hoy:</span>
            <span class="font-medium"
              >{{ todayEvent.description }} - {{ todayEvent.time }}</span
            >
          </div>
          <span class="text-sm text-gray-600">{{ todayEvent.location }}</span>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <main class="flex-1">
      <router-view></router-view>
    </main>

    <!-- Footer navigation -->
    <footer class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-around py-2">
          <router-link
            v-for="link in navigationLinks"
            :key="link.path"
            :to="link.path"
            class="flex flex-col items-center p-2 text-gray-600 hover:text-blue-600"
            :class="{ 'text-blue-600': isCurrentRoute(link.path) }"
          >
            <component :is="link.icon" class="h-6 w-6" />
            <span class="text-xs mt-1">{{ link.name }}</span>
          </router-link>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { CalendarIcon, ChartBarIcon, UserIcon } from "@heroicons/vue/24/outline";
import { useEventStore } from "../stores/eventStore";
import { format, isToday } from "date-fns";

const router = useRouter();
const route = useRoute();
const eventStore = useEventStore();

const navigationLinks = [
  { path: "/calendar", name: "Calendario", icon: CalendarIcon },
  { path: "/monthly-balance", name: "Balance", icon: ChartBarIcon },
  { path: "/profile", name: "Perfil", icon: UserIcon },
];

const todayEvent = computed(() => {
  return eventStore.events.find((event) => {
    const eventDate = new Date(event.date);
    return isToday(eventDate);
  });
});

function isCurrentRoute(path: string): boolean {
  return route.path === path;
}
</script>
