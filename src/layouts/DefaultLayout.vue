<template>
  <div class="min-h-screen pb-16">
    <RouterView />
    <FooterLayout />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router';
import FooterLayout from './FooterLayout.vue';
import { ref, computed, onMounted, watch } from "vue";
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "../utils/icons";
import { useEventStore } from "../stores/eventStore";
import { format, isToday, startOfDay, endOfDay, parseISO } from "date-fns";
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
