<template>
  <div class="border rounded-lg overflow-hidden mb-4">
    <!-- Botón para alternar la visibilidad del panel -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
    >
      <h3 class="text-lg font-medium text-gray-900">Gestion de Ubicaciones</h3>
      <ChevronDownIcon
        :class="['h-5 w-5 transition-transform', open ? 'transform rotate-180' : '']"
      />
    </button>

    <!-- Contenido principal -->
    <div v-if="open" class="p-4">
      <!-- Lista de ubicaciones -->
      <div class="mb-4 border rounded-lg overflow-hidden">
        <div
          v-for="(location, index) in locationsWithRoutes"
          :key="index"
          class="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
          :class="location.coord ? 'bg-green-100' : 'bg-red-100'"
          @click="openEditModal(location)"
        >
          <!-- Información de ubicación -->
          <div class="flex-grow">
            <h4 class="font-medium">{{ location.location }}</h4>
            <div v-if="location.coord" class="text-sm text-gray-600">
              <p class="flex items-center gap-2">
                <MapPinIcon class="h-4 w-4" />
                {{ formatCoordinates(location.coord) }}
              </p>
              <p v-if="location.routeInfo" class="flex items-center gap-2 mt-1">
                <ClockIcon class="h-4 w-4" />
                {{ location.routeInfo.duration }}
                <span class="text-gray-400">•</span>
                <MapIcon class="h-4 w-4" />
                {{ location.routeInfo.distance }}
              </p>
            </div>
          </div>
          <!-- Botones de acción -->
          <div class="flex items-center gap-2">
            <button
              @click.stop="openEditModal(location)"
              class="btn-icon"
              title="Editar ubicación"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              v-if="location.coord"
              @click.stop="recalculateRoute(location)"
              class="btn-icon"
              :disabled="location.isCalculating"
            >
              <RefreshIcon
                class="h-4 w-4"
                :class="{ 'animate-spin': location.isCalculating }"
              />
            </button>
            <button
              @click.stop="confirmDelete(location)"
              class="btn-icon text-red-600"
              title="Eliminar ubicación"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Edición -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto"
    >
      <div class="relative bg-white rounded-lg max-w-4xl w-full my-8">
        <!-- Botón de cierre -->
        <button
          @click="closeEditModal"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>

        <!-- Contenido del modal con scroll -->
        <div class="p-6 max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-medium mb-4 pr-8">
            {{ selectedLocation ? "Editar" : "Nueva" }} Ubicación
          </h3>
          <div class="space-y-4">
            <!-- Nombre de referencia -->
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Nombre de referencia</label
              >
              <input
                v-model="editingLocation.location"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              <p v-if="formErrors.location" class="text-xs text-red-500 mt-1">
                {{ formErrors.location }}
              </p>
            </div>

            <!-- Campo de búsqueda con botón -->
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Buscar ubicación</label
              >
              <div class="flex gap-2">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Ej: Calle Principal 123, Ciudad"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                <button
                  @click="geocodeSearch"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Buscar
                </button>
              </div>
            </div>

            <!-- Coordenadas -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Coordenadas</label>
              <input
                v-model="coordinatesInput"
                type="text"
                placeholder="Ej: 40.416775,-3.703790"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                readonly
              />
              <p v-if="formErrors.coordinates" class="text-xs text-red-500 mt-1">
                {{ formErrors.coordinates }}
              </p>
            </div>

            <!-- Mapa -->
            <div class="h-64 sm:h-96 bg-gray-100 rounded-lg overflow-hidden">
              <LMap
                v-if="showEditModal"
                :zoom="mapZoom"
                :center="mapCenter"
                @click="onMapClick"
                class="h-full w-full"
              >
                <LTileLayer
                  :url="tileLayerUrl"
                  attribution="&copy; OpenStreetMap contributors"
                  crossOrigin="anonymous"
                />
                <LMarker v-if="markerPosition" :lat-lng="markerPosition" />
              </LMap>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="flex justify-end space-x-3 mt-6 sticky bottom-0 bg-white py-4">
            <button
              @click="closeEditModal"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              @click="saveLocation"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Confirmación de Eliminación -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-medium mb-4">Confirmar eliminación</h3>
        <p class="text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar esta ubicación?
        </p>
        <div class="flex justify-end space-x-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            @click="deleteLocation"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import "leaflet/dist/leaflet.css";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getUserLocation } from "../utils/geolocation";
import { calculateRoute, formatDistance, formatDuration } from "../services/RouteService";
import { ChevronDownIcon } from "../utils/icons";
import { MapPinIcon } from "../utils/icons";
import { ClockIcon } from "../utils/icons";
import { MapIcon } from "../utils/icons";
import { RefreshIcon } from "../utils/icons";
import { PencilIcon } from "../utils/icons";
import { TrashIcon } from "../utils/icons";
import { XMarkIcon } from "../utils/icons";
import { LMap } from "@vue-leaflet/vue-leaflet";
import { LTileLayer } from "@vue-leaflet/vue-leaflet";
import { LMarker } from "@vue-leaflet/vue-leaflet";
import { useEventStore } from "../stores/eventStore";

// Estados fundamentales
const open = ref(false);
const eventStore = useEventStore();
const currentPosition = ref<{ lat: number; lng: number } | null>(null);
const locations = ref<any[]>([]);
const routeCache = ref(new Map());
const updateInterval = ref<number | null>(null);

// Estados del mapa
const mapZoom = ref(13);
const mapCenter = ref<[number, number]>([0, 0]);
const markerPosition = ref<{ lat: number; lng: number } | null>(null);
// const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileLayerUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const searchQuery = ref("");
const coordinatesInput = ref("");

// Estado para el formulario y validación
const editingLocation = ref({ location: "", coordinates: "" });
const formErrors = ref<{ location?: string; coordinates?: string }>({});

// Estado para modales
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedLocation = ref<{
  id?: number;
  location?: string;
  coordinates?: { lat: number; lng: number };
} | null>(null);

// Computed para obtener los eventos con rutas
const locationsWithRoutes = computed(() => {
  return eventStore.events.map((location) => {
    const routeInfo = routeCache.value.get(location);
    return { ...location, routeInfo, isCalculating: false };
  });
});

// Función para alternar el panel
const toggle = () => (open.value = !open.value);

// Formateo de coordenadas
const formatCoordinates = (coords: { lat: number; lng: number }) =>
  `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

// Validación del formulario
function validateForm(): boolean {
  let isValid = true;
  formErrors.value = {};

  if (!editingLocation.value.location || editingLocation.value.location.trim() === "") {
    formErrors.value.location = "El nombre de la ubicación es requerido.";
    isValid = false;
  }

  if (
    !markerPosition.value ||
    isNaN(markerPosition.value.lat) ||
    isNaN(markerPosition.value.lng)
  ) {
    formErrors.value.coordinates = "Debe seleccionar una ubicación válida en el mapa.";
    isValid = false;
  }
  return isValid;
}

// Guardar ubicación (actualización o creación)
async function saveLocation() {
  if (!validateForm()) return;

  try {
    const newLocationName = editingLocation.value.location.trim();
    const newCoordinates = markerPosition.value;

    if (!selectedLocation.value) {
      alert(
        "Por favor, selecciona una ubicación existente para actualizar sus coordenadas."
      );
      return;
    }

    // Si el nombre de la referencia ha cambiado, actualizar la propiedad "location" del evento
    if (selectedLocation.value.location !== newLocationName) {
      await eventStore.updateEventsLocation(
        selectedLocation.value.location!,
        newLocationName
      );
    }
    // Actualizar la propiedad "coord" del evento
    await eventStore.updateEventsCoordinates(newLocationName, newCoordinates!);

    await loadLocations();
    closeEditModal();
  } catch (error) {
    console.error("Error al guardar la ubicación:", error);
    alert("Error al guardar la ubicación");
  }
}

// Carga de ubicaciones
async function loadLocations() {
  try {
    const data = await eventStore.getLocations();
    locations.value = Array.isArray(data) ? data : [];
    await calculateAllRoutes();
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
  }
}

// Gestión de rutas
async function calculateRouteForLocation(location: any) {
  if (!location.coordinates || !currentPosition.value) return;
  location.isCalculating = true;
  try {
    const route = await calculateRoute(currentPosition.value, location.coordinates);
    routeCache.value.set(location.id, {
      distance: formatDistance(route.distance),
      duration: formatDuration(route.duration),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error(`Error calculando ruta para ${location.location}:`, error);
  } finally {
    location.isCalculating = false;
  }
}

async function recalculateRoute(location: any) {
  await calculateRouteForLocation(location);
}

async function calculateAllRoutes() {
  if (!currentPosition.value) return;
  for (const location of locations.value) {
    if (location.coordinates) {
      await calculateRouteForLocation(location);
    }
  }
}

// Apertura y cierre del modal de edición
function openEditModal(location: any) {
  selectedLocation.value = location;
  editingLocation.value = {
    location: location.location,
    // Si la ubicación posee coordenadas, también se asigna su valor, de lo contrario dejar vacío
    coordinates: location.coordinates
      ? `${location.coordinates.lat},${location.coordinates.lng}`
      : "",
  };
  // Pre-cargar el campo de búsqueda con el nombre de referencia
  searchQuery.value = editingLocation.value.location;
  // Forzar que el mapa se centre en la posición actual del usuario
  if (currentPosition.value) {
    mapCenter.value = [currentPosition.value.lat, currentPosition.value.lng];
    markerPosition.value = location.coordinates ? location.coordinates : null;
    coordinatesInput.value = location.coordinates
      ? `${location.coordinates.lat},${location.coordinates.lng}`
      : "";
  } else {
    // Si no se conoce la posición actual, se obtiene antes de abrir el modal
    getUserLocation().then((pos) => {
      mapCenter.value = [pos.lat, pos.lng];
    });
  }
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  selectedLocation.value = null;
  editingLocation.value = { location: "", coordinates: "" };
  formErrors.value = {};
}

// Función para manejar clics en el mapa
function onMapClick(e: any) {
  const { lat, lng } = e.latlng;
  markerPosition.value = { lat, lng };
  coordinatesInput.value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

// Búsqueda de ubicación mediante geocodificación
async function geocodeSearch() {
  if (!searchQuery.value) {
    alert("Por favor ingresa un término de búsqueda");
    return;
  }
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery.value
    )}`;
    // Si se conoce la posición actual, restringir resultados a una caja de aproximadamente 1 grado de diferencia
    if (currentPosition.value) {
      const lat = currentPosition.value.lat;
      const lng = currentPosition.value.lng;
      const viewbox = `${lng - 0.5},${lat + 0.5},${lng + 0.5},${lat - 0.5}`;
      url += `&viewbox=${viewbox}&bounded=1`;
    }
    url += `&format=json&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.length > 0) {
      const { lat, lon } = data[0];
      mapCenter.value = [parseFloat(lat), parseFloat(lon)];
      markerPosition.value = { lat: parseFloat(lat), lng: parseFloat(lon) };
      coordinatesInput.value = `${lat},${lon}`;
    } else {
      alert("No se encontraron resultados");
    }
  } catch (error) {
    console.error("Error en la búsqueda:", error);
    alert("Error al buscar la ubicación");
  }
}

// Modal de eliminación
function confirmDelete(location: any) {
  selectedLocation.value = location;
  showDeleteModal.value = true;
}

async function deleteLocation() {
  if (!selectedLocation.value?.id) return;
  try {
    await eventStore.deleteEvent(String(selectedLocation.value.id));
    await loadLocations();
    showDeleteModal.value = false;
    selectedLocation.value = null;
  } catch (error) {
    console.error("Error al eliminar la ubicación:", error);
  }
}

// Ciclo de vida
onMounted(async () => {
  try {
    currentPosition.value = await getUserLocation();
    locations.value = await eventStore.getLocations();
    await calculateAllRoutes();
    updateInterval.value = window.setInterval(async () => {
      currentPosition.value = await getUserLocation();
      await calculateAllRoutes();
    }, 300000);
  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});
</script>

<script lang="ts">
export default {
  name: "ProfileDistance",
};
</script>

<style lang="postcss">
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.btn-icon {
  @apply p-2 rounded-full hover:bg-gray-100 transition-colors;
}

/* Estilos adicionales para el modal */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}
@media (max-width: 640px) {
  .h-64 {
    height: 16rem; /* 256px, ajustable para móviles */
  }
}

/* Asegurar que el contenedor de Leaflet se visualice correctamente en dispositivos móviles */
.leaflet-container {
  height: 100% !important;
  width: 100% !important;
}
</style>
