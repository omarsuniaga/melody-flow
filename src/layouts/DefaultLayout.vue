<template>
  <div class="min-h-screen bg-gray-100 flex flex-col pb-20">
    <!-- Opcional: Barra superior para evento del día -->
    <div v-if="isAuthenticated && todayEvent" class="bg-white shadow px-4 py-2">
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

    <!-- Footer solo visible para usuarios autenticados -->
    <FooterLayout v-if="isAuthenticated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { CalendarIcon, ChartBarIcon, UserIcon } from "@heroicons/vue/24/outline";
import { useEventStore } from "../stores/eventStore";
import { format, isToday } from "date-fns";
import FooterLayout from "./footerLayout.vue";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const eventStore = useEventStore();
const isAuthenticated = ref(false);

// Escuchar cambios en el estado de autenticación
onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    isAuthenticated.value = !!user;
  });
});

const todayEvent = computed(() => {
  if (!isAuthenticated.value) return null;

  return eventStore.events.find((event) => {
    const eventDate = new Date(event.date);
    return isToday(eventDate);
  });
});
</script>
