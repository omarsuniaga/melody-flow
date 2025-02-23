<script setup lang="ts">
import { ref } from "vue";
import MapSearch from "./MapSearch.vue";
import ProfileDistance from "./ProfileDistance.vue";
// import LocationManager from "./LocationManager.vue";

const destinationCoordinates = ref<{ lat: number; lng: number } | null>(null);

// Handler para capturar el evento desde ProfileDistance
function handleSelectLocation(coord: { lat: number; lng: number }) {
  destinationCoordinates.value = coord;
  // También se podría limpiar la búsqueda en MapSearch si es necesario
}
</script>
<script lang="ts">
// exportar componente
export default {
  name: "UnifiedLocationSearch",
};
</script>

<template>
  <div class="unified-location-search p-4 space-y-6">
    <!-- Sección de búsqueda y visualización de la ruta.
         Se pasa la prop destinationCoordinates a MapSearch -->
    <section class="map-search-section">
      <MapSearch :destinationCoordinates="destinationCoordinates" />
    </section>

    <!-- Sección con información de distancia y administración de ubicaciones -->
    <section class="flex flex-col md:flex-row gap-6">
      <div class="w-full md:w-1/2">
        <!-- Se escucha el evento "select-location" en ProfileDistance -->
        <ProfileDistance @select-location="handleSelectLocation" />
      </div>
      <div class="w-full md:w-1/2">
        <!-- <LocationManager /> -->
      </div>
    </section>
  </div>
</template>
