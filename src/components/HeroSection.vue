<template>
  <div class="mt-8 mb-8 text-center">
    <img src="/icons/icon-512x512.png" alt="MelodyFlow" class="w-24 h-24 mx-auto" />
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Apptividades</h2>
    <p class="text-gray-600 max-w-2xl mx-auto">
      Apptividades es tu compañero perfecto para la gestión musical profesional. Organiza
      tus eventos musicales, administra tu calendario, controla tus pagos y optimiza tu
      tiempo con nuestras herramientas diseñadas especialmente para músicos.
    </p>
    <div class="mt-8 mb-8 text-center">
      <div class="grid grid-cols-3 md:grid-cols-3 gap-4 mt-6 max-w-2xl mx-auto text-left">
        <div class="p-4 bg-gray-50 rounded-lg">
          <CalendarIcon class="h-6 w-6 text-blue-600 mb-2" />
          <h3 class="font-semibold">Gestión de Eventos</h3>
          <p class="text-sm text-gray-600">
            Calendario intuitivo para tus presentaciones y ensayos
          </p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <ClockIcon class="h-6 w-6 text-blue-600 mb-2" />
          <h3 class="font-semibold">Control de Horarios</h3>
          <p class="text-sm text-gray-600">
            Organiza tu disponibilidad y evita conflictos
          </p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg">
          <ChartBarIcon class="h-6 w-6 text-blue-600 mb-2" />
          <h3 class="font-semibold">Balance Financiero</h3>
          <p class="text-sm text-gray-600">Seguimiento de pagos y ganancias</p>
        </div>
      </div>
      <h4 class="text-sm text-gray-600 mt-4">
        ¡Regístrate y descubre todas las funcionalidades que tenemos para ti!
      </h4>
      <div class="mt-6 text-center text-sm">
        <router-link
          to="/register"
          class="text-blue-600 hover:text-blue-500 flex items-center justify-center gap-1"
        >
          <UserPlusIcon class="h-5 w-5" />
          Crear una cuenta
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import CalendarIcon from "@heroicons/vue/24/outline/CalendarIcon";
import ClockIcon from "@heroicons/vue/24/outline/ClockIcon";
import ChartBarIcon from "@heroicons/vue/24/outline/ChartBarIcon";
import UserPlusIcon from "@heroicons/vue/24/outline/UserPlusIcon";
</script>
<script lang="ts">
// exportar componente
export default {
  name: "HeroSection",
};
</script>
