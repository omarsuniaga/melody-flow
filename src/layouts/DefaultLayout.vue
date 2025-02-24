<template>
  <div class="min-h-screen pb-16">
    <!-- Indicador de estado offline -->
    <div v-if="isOffline" class="bg-yellow-200 text-yellow-800 p-2 text-center text-sm">
      Estás en modo offline. Mostrando datos en caché.
    </div>
    <RouterView />
    <FooterLayout />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { RouterView } from "vue-router";
import { useEventStore } from "../stores/eventStore";
import FooterLayout from "@/layouts/FooterLayout.vue";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { auth } from "../firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const eventStore = useEventStore();
const isAuthenticated = ref(false);
const isOffline = ref(!navigator.onLine);

window.addEventListener("online", () => (isOffline.value = false));
window.addEventListener("offline", () => (isOffline.value = true));

onMounted(async () => {
  onAuthStateChanged(auth, (user) => {
    isAuthenticated.value = !!user;
  });
  if (isAuthenticated.value) {
    try {
      await eventStore.fetchEvents();
      localStorage.setItem("events", JSON.stringify(eventStore.events));
    } catch (err) {
      console.warn("Fallo al obtener eventos; cargando desde cache.", err);
      const cachedEvents = localStorage.getItem("events");
      if (cachedEvents) {
        eventStore.events = JSON.parse(cachedEvents);
      }
    }
  }
});

const currentEventIndex = ref(0);
const todayEvents = computed(() => {
  if (!isAuthenticated.value) return [];
  const today = new Date();
  const startOfToday = startOfDay(today);
  const endOfToday = endOfDay(today);
  return eventStore.events
    .filter((event) => {
      const eventDate = parseISO(event.date);
      return eventDate >= startOfToday && eventDate <= endOfToday;
    })
    .sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateA.getTime() - dateB.getTime();
    });
});

watch(todayEvents, () => (currentEventIndex.value = 0));
</script>
