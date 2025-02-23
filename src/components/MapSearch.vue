<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import L from "leaflet";
import { PropType } from "vue";
import {
  MapPinIcon,
  ClockIcon,
  MapIcon,
  SearchIcon,
  SaveIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "../utils/icons";
import dragDirective from "../directives/drag";

// Interfaces
interface RouteInfo {
  distance: number;
  duration: number;
}
interface Location {
  location: string;
  coord?: { lat: number; lng: number };
}

// Estados reactivos
const map = ref<L.Map | null>(null);
const destinationMarker = ref<L.Marker | null>(null);
const currentLocationMarker = ref<L.Marker | null>(null);
const routeLine = ref<L.Polyline | null>(null);
const routeInfo = ref<RouteInfo | null>(null);
const loading = ref(false);
const error = ref("");

// Iconos personalizados
const currentLocationIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
const destinationIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Props y variables locales
const props = defineProps({
  destinationCoordinates: {
    type: Object as () => { lat: number; lng: number } | null,
    default: null,
  },
  searchQuery: {
    type: String,
    default: "",
  },
  existingLocation: {
    type: Object as PropType<Location>,
    default: null,
  },
});
const localSearchQuery = ref(props.searchQuery);
watch(
  () => props.searchQuery,
  (newVal) => (localSearchQuery.value = newVal),
  { immediate: true }
);

// Emisor de eventos
const emit = defineEmits<{
  (e: "save-coordinates", coord: { lat: number; lng: number }): void;
  (e: "update-location", location: Location): void;
  (e: "update-route", route: { distance: string; duration: string }): void;
}>();

// Estado para modal de confirmación (sin cambios)
const showConfirmModal = ref(false);
const pendingCoordinates = ref<{ lat: number; lng: number } | null>(null);

// -- Inicialización del mapa --
onMounted(() => {
  map.value = L.map("map").setView([0, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map.value as L.Map);

  if (props.existingLocation?.coord) {
    const { lat, lng } = props.existingLocation.coord!;
    destinationMarker.value = L.marker([lat, lng], {
      icon: destinationIcon,
      draggable: true,
    })
      .bindPopup("Destino")
      .addTo(map.value as L.Map);
    map.value.setView([lat, lng], 16);
  }
  map.value.on("click", () => {
    showConfirmModal.value = false;
  });
});

// Watch para actualizar el marcador destino
watch(
  () => props.destinationCoordinates,
  (newCoord) => {
    if (!map.value) return;
    if (newCoord) {
      const lat = Number(newCoord.lat);
      const lng = Number(newCoord.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        if (destinationMarker.value) {
          destinationMarker.value.setLatLng([lat, lng]);
        } else {
          destinationMarker.value = L.marker([lat, lng], {
            icon: destinationIcon,
            draggable: true,
          })
            .bindPopup("Destino Seleccionado")
            .addTo(map.value as L.Map);
          destinationMarker.value.on("dragend", () => {
            const pos = destinationMarker.value?.getLatLng();
            if (pos) calculateRoute(); // Recalcular ruta
          });
        }
        map.value.setView([lat, lng], 16);
      }
    } else if (destinationMarker.value) {
      destinationMarker.value.remove();
      destinationMarker.value = null;
    }
  }
);

// Función para obtener la ubicación (manteniendo estructura)
function getCurrentLocation() {
  if (!map.value) return;
  if ("geolocation" in navigator) {
    loading.value = true;
    error.value = "";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (currentLocationMarker.value) {
          currentLocationMarker.value.setLatLng([latitude, longitude]);
        } else {
          currentLocationMarker.value = L.marker([latitude, longitude], {
            icon: currentLocationIcon,
          })
            .bindPopup("Tu ubicación")
            .addTo(map.value as L.Map);
        }
        map.value.setView([latitude, longitude], 13);
        loading.value = false;
        if (destinationMarker.value) calculateRoute();
      },
      (err) => {
        error.value = "Error obteniendo ubicación: " + err.message;
        loading.value = false;
      }
    );
  } else error.value = "Geolocalización no soportada";
}

// Función de búsqueda
async function searchLocation() {
  if (!localSearchQuery.value.trim() || !map.value) return;
  loading.value = true;
  error.value = "";
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        localSearchQuery.value
      )}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      const lat = Number(data[0].lat),
        lon = Number(data[0].lon);
      if (!isNaN(lat) && !isNaN(lon)) {
        if (destinationMarker.value) destinationMarker.value.setLatLng([lat, lon]);
        else {
          destinationMarker.value = L.marker([lat, lon], {
            icon: destinationIcon,
            draggable: true,
          })
            .bindPopup("Destino")
            .addTo(map.value as L.Map);
          destinationMarker.value.on("dragend", () => {
            const pos = destinationMarker.value?.getLatLng();
            if (pos) calculateRoute();
          });
        }
        map.value.setView([lat, lon], 16);
        if (currentLocationMarker.value) calculateRoute();
      } else error.value = "Coordenadas inválidas";
    } else error.value = "Ubicación no encontrada";
  } catch (e) {
    error.value = "Error buscando ubicación";
  } finally {
    loading.value = false;
  }
}

// Función principal para calcular la ruta
async function calculateRoute() {
  if (!map.value || !currentLocationMarker.value || !destinationMarker.value) return;
  const start = currentLocationMarker.value.getLatLng(),
    end = destinationMarker.value.getLatLng();
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    if (data.code === "Ok") {
      if (routeLine.value) routeLine.value.remove();
      routeLine.value = L.polyline(
        data.routes[0].geometry.coordinates.map((coord: [number, number]) => [
          coord[1],
          coord[0],
        ]),
        { color: "blue" }
      ).addTo(map.value as L.Map);
      routeInfo.value = {
        distance: Math.round(data.routes[0].distance / 1000),
        duration: Math.round(data.routes[0].duration / 60),
      };
      map.value.fitBounds(routeLine.value.getBounds(), { padding: [50, 50] });
    }
  } catch (e) {
    error.value = "Error calculando ruta";
  }
}

// Función para guardar la ruta
async function saveRoute() {
  if (destinationMarker.value) {
    await calculateRoute();
    const coordinates = destinationMarker.value.getLatLng();
    if (coordinates)
      handleSaveCoordinates({ lat: coordinates.lat, lng: coordinates.lng });
    else console.error("No se pudieron obtener las coordenadas.");
  }
}
function handleSaveCoordinates(coordinates: { lat: number; lng: number }) {
  if (props.existingLocation?.coord) {
    pendingCoordinates.value = coordinates;
    showConfirmModal.value = true;
  } else emit("save-coordinates", coordinates);
}
function confirmUpdateCoordinates() {
  if (pendingCoordinates.value && props.existingLocation) {
    emit("update-location", {
      location: props.existingLocation.location,
      coord: pendingCoordinates.value,
    });
    showConfirmModal.value = false;
    pendingCoordinates.value = null;
  }
}

// Computed para verificar si se puede mostrar la ruta
const canShowRoute = computed(
  () => currentLocationMarker.value && destinationMarker.value
);

// Función integrada para calcular y emitir la ruta
const calculateAndShowRoute = async () => {
  if (!canShowRoute.value) return;
  try {
    loading.value = true;
    await calculateRoute();
    if (routeInfo.value) {
      emit("update-route", {
        distance: routeInfo.value.distance + " km",
        duration: routeInfo.value.duration + " min",
      });
    }
  } catch (error) {
    console.error("Error calculando ruta:", error);
  } finally {
    loading.value = false;
  }
};

// Último watch para actualizar la ruta automáticamente
watch(
  [() => props.destinationCoordinates, currentLocationMarker],
  async () => {
    if (props.destinationCoordinates && currentLocationMarker.value)
      await calculateAndShowRoute();
  },
  { immediate: true }
);

// Estado y funciones del panel flotante (arrastrable)
const isCollapsed = ref(false);
const toggleCollapse = () => (isCollapsed.value = !isCollapsed.value);
</script>

<template>
  <div class="map-wrapper">
    <!-- Mapa -->
    <div id="map" class="map-display"></div>

    <!-- Panel flotante personalizado -->
    <div class="floating-panel" v-drag>
      <div class="panel-header">
        <span>Controles del mapa</span>
        <button @click="toggleCollapse" class="collapse-btn">
          <ChevronUpIcon v-if="!isCollapsed" class="h-4 w-4" />
          <ChevronDownIcon v-else class="h-4 w-4" />
        </button>
      </div>
      <div v-show="!isCollapsed" class="panel-content">
        <!-- Controles de búsqueda -->
        <div class="search-box">
          <input
            v-model="localSearchQuery"
            @keyup.enter="searchLocation"
            type="text"
            placeholder="Buscar ubicación..."
            :disabled="loading"
          />
          <button @click="searchLocation" :disabled="loading" class="search-btn">
            <SearchIcon class="h-5 w-5" />
          </button>
        </div>
        <!-- Botones de control -->
        <div class="control-buttons">
          <button @click="getCurrentLocation" class="location-btn" :disabled="loading">
            <MapPinIcon class="h-5 w-5" /> Mi ubicación
          </button>
          <button
            @click="calculateAndShowRoute"
            class="route-btn"
            :disabled="!canShowRoute"
          >
            <MapIcon class="h-5 w-5" /> Ver ruta
          </button>
          <button
            @click="saveCoordinates"
            class="save-btn"
            :disabled="!destinationMarker"
          >
            <SaveIcon class="h-5 w-5" /> Guardar
          </button>
        </div>
        <!-- Información de ruta -->
        <div v-if="routeInfo" class="route-info">
          <div class="info-item">
            <ClockIcon class="h-5 w-5" /> <span>{{ routeInfo.duration }} min</span>
          </div>
          <div class="info-item">
            <MapPinIcon class="h-5 w-5" /> <span>{{ routeInfo.distance }} km</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Contenedor principal */
.map-wrapper {
  position: relative;
  width: 100%;
  height: 900px; /* Margen vertical ampliado */
}
/* Mapa */
.map-display {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}
/* Panel flotante */
.floating-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}
.panel-header {
  background-color: #f3f4f6;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
}
.collapse-btn {
  @apply p-1 hover:bg-gray-200 rounded-md;
}
.panel-content {
  padding: 12px;
}
/* Controles de búsqueda */
.search-box {
  @apply flex gap-2;
}
.search-box input {
  @apply flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500;
  background-color: #f9fafb;
  transition: background-color 0.2s ease;
}
.search-box input:hover {
  background-color: #f3f4f6;
}
.search-btn {
  @apply px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center;
}
/* Botones de control */
.control-buttons {
  @apply grid grid-cols-3 gap-2;
}
.control-buttons button {
  @apply px-2 py-1 rounded-md flex items-center justify-center gap-1 text-sm;
}
.route-info {
  @apply flex justify-around p-2 bg-gray-50 rounded-md;
}
.info-item {
  @apply flex items-center gap-2;
}
/* Utilidades */
button:disabled {
  @apply opacity-50 cursor-not-allowed;
}
/* Colores personalizados para cada botón */
.location-btn {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}
.route-btn {
  @apply bg-indigo-600 hover:bg-indigo-700 text-white;
}
.save-btn {
  @apply bg-purple-600 hover:bg-purple-700 text-white;
}
/* Responsive */
@media (max-width: 640px) {
  .floating-panel {
    width: 90% !important;
    left: 5% !important;
  }
  .control-buttons {
    @apply grid-cols-2;
  }
}
@media (max-width: 480px) {
  .floating-panel {
    width: 95% !important;
    left: 2.5% !important;
  }
  .control-buttons {
    @apply grid-cols-1;
  }
}
</style>
