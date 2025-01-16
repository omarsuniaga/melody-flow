<template>
  <div class="min-h-screen bg-gray-100 flex flex-col pb-20">
    <!-- Barra de eventos del día -->
    <div
      v-if="isAuthenticated && todayEvents.length > 0"
      class="fixed top-0 left-0 right-0 bg-white shadow-md z-50"
    >
      <div class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center gap-4">
          <!-- Botón previo -->
          <button
            v-if="todayEvents.length > 1"
            @click="prevEvent"
            class="flex-none text-blue-600 hover:text-blue-800"
          >
            <ChevronLeftIcon class="h-5 w-5" />
          </button>

          <!-- Contador -->
          <div class="flex items-center gap-2 min-w-[80px]">
            <CalendarIcon class="h-5 w-5 text-blue-600" />
            <span class="text-sm font-medium"
              >{{ currentEventIndex + 1 }}/{{ todayEvents.length }}</span
            >
          </div>

          <!-- Descripción y hora -->
          <div class="flex-1">
            <span class="font-medium text-gray-900">
              {{ todayEvents[currentEventIndex]?.description }}
            </span>
            <span class="text-sm text-gray-600 ml-2">
              {{ todayEvents[currentEventIndex]?.time }}
            </span>
          </div>

          <!-- Ubicación -->
          <div class="flex-none text-right">
            <span class="text-sm text-gray-600">
              {{ todayEvents[currentEventIndex]?.location }}
            </span>
          </div>

          <!-- Botón siguiente -->
          <button
            v-if="todayEvents.length > 1"
            @click="nextEvent"
            class="flex-none text-blue-600 hover:text-blue-800"
          >
            <ChevronRightIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Espaciador para compensar la barra fija -->
    <div v-if="isAuthenticated && todayEvents.length > 0" class="h-[52px]"></div>

    <!-- Contenido principal -->
    <main class="flex-1">
      <router-view></router-view>
    </main>

    <!-- Footer solo visible para usuarios autenticados -->
    <FooterLayout v-if="isAuthenticated" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "../utils/icons";
import { useEventStore } from "../stores/eventStore";
import { format, isToday, startOfDay, endOfDay, parseISO } from "date-fns";
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

const currentEventIndex = ref(0);
const todayEvents = computed(() => {
  if (!isAuthenticated.value) return [];

  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);

  return eventStore.events
    .filter((event) => {
      // Convertir la fecha del evento a objeto Date
      const eventDate = parseISO(event.date);

      // Comparar si el evento está dentro del día actual
      const isToday = eventDate >= startOfToday && eventDate <= endOfToday;

      return isToday;
    })
    .sort((a, b) => {
      // Corregir la ordenación por hora
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
});

// Asegurarse de cargar los eventos cuando se monta el componente
onMounted(async () => {
  if (isAuthenticated.value) {
    await eventStore.fetchEvents(); // Asegúrate de que tienes este método en tu store
  }
});

const nextEvent = () => {
  if (currentEventIndex.value < todayEvents.value.length - 1) {
    currentEventIndex.value++;
  }
};

const prevEvent = () => {
  if (currentEventIndex.value > 0) {
    currentEventIndex.value--;
  }
};

// Resetear el índice cuando cambian los eventos
watch(todayEvents, () => {
  currentEventIndex.value = 0;
});
</script>
