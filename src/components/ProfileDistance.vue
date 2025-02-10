<template>
  <div class="border rounded-lg overflow-hidden mb-4">
    <!-- Header -->
    <div class="bg-gray-50 p-4 flex justify-between items-center">
      <h3 class="text-lg font-medium">Gestión de Ubicaciones</h3>
      <button @click="toggle" class="p-2 hover:bg-gray-200 rounded-full">
        <ChevronDownIcon
          :class="['h-5 w-5 transition-transform', open ? 'rotate-180' : '']"
        />
      </button>
    </div>

    <!-- Contenido principal -->
    <div v-if="open" class="p-4">
      <!-- Lista de ubicaciones -->
      <div class="mb-4 border rounded-lg overflow-hidden">
        <div
          v-for="location in locationsWithRoutes"
          :key="location.id"
          class="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
          :class="location.coordinates ? 'bg-green-50' : 'bg-red-50'"
          @click="openEditModal(location)"
        >
          <!-- Información de ubicación -->
          <div class="flex-grow">
            <h4 class="font-medium">{{ location.location }}</h4>
            <div v-if="location.coordinates" class="text-sm text-gray-600">
              <p class="flex items-center gap-2">
                <MapPinIcon class="h-4 w-4" />
                {{ formatCoordinates(location.coordinates) }}
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
              v-if="location.coordinates"
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
              <label class="block text-sm font-medium text-gray-700">
                Nombre de referencia
              </label>
              <input
                v-model="editingLocation.location"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>

            <!-- Campo de búsqueda con botón -->
            <div>
              <label class="block text-sm font-medium text-gray-700">
                Buscar ubicación
              </label>
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
              <label class="block text-sm font-medium text-gray-700"> Coordenadas </label>
              <input
                v-model="coordinatesInput"
                type="text"
                placeholder="Ej: 40.416775,-3.703790"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                readonly
              />
            </div>

            <!-- Mapa -->
            <div class="h-96 bg-gray-100 rounded-lg overflow-hidden">
              <LMap
                v-if="showEditModal"
                :zoom="mapZoom"
                :center="mapCenter"
                @click="onMapClick"
                class="h-full w-full"
              >
                <LTileLayer :url="tileLayerUrl" />
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
import { ref, computed, onMounted, onUnmounted } from "vue";
import { getUserLocation } from "../utils/geolocation";
import {
  getLocations,
  deleteLocation as deleteLocationService,
  updateLocation,
  addLocation,
} from "../services/LocationsServices"; // Agregar updateLocation y addLocation
import { calculateRoute, formatDistance, formatDuration } from "../services/RouteService";
import {
  ChevronDownIcon,
  MapPinIcon,
  ClockIcon,
  MapIcon,
  RefreshIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "../utils/icons";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";
import "leaflet/dist/leaflet.css";
import { useEventStore } from "../stores/eventStore";

// Estados
const open = ref(false);
const eventStore = useEventStore();
const currentPosition = ref<{ lat: number; lng: number } | null>(null);
const locations = ref<any[]>([]);
const routeCache = ref(new Map());
const updateInterval = ref<number | null>(null); // Referencia para el intervalo

// Añadir estados para el mapa
const mapZoom = ref(13);
const mapCenter = ref<[number, number]>([0, 0]);
const markerPosition = ref<{ lat: number; lng: number } | null>(null);
const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const searchQuery = ref("");
const coordinatesInput = ref("");

// Funciones de carga de datos
async function loadLocations() {
  try {
    locations.value = await getLocations();
    await calculateAllRoutes();
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
  }
}

// Estado para los modales
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedLocation = ref<{
  id?: number;
  location?: string;
  coordinates?: { lat: number; lng: number };
} | null>(null);
const editingLocation = ref({
  location: "",
  coordinates: "",
});

// Computed
const locationsWithRoutes = computed(() => {
  return locations.value.map((loc) => ({
    ...loc,
    routeInfo: routeCache.value.get(loc.id),
    isCalculating: false,
  }));
});

// Métodos
const toggle = () => (open.value = !open.value);

const formatCoordinates = (coords: { lat: number; lng: number }) =>
  `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;

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

// Funciones para el modal de edición
function openEditModal(location: any) {
  selectedLocation.value = location;
  editingLocation.value = {
    location: location.location,
    coordinates: location.coordinates
      ? `${location.coordinates.lat},${location.coordinates.lng}`
      : "",
  };

  // Configurar el mapa
  if (location.coordinates) {
    mapCenter.value = [location.coordinates.lat, location.coordinates.lng];
    markerPosition.value = location.coordinates;
    coordinatesInput.value = `${location.coordinates.lat},${location.coordinates.lng}`;
  } else {
    // Si no hay coordenadas, centrar en la ubicación actual del usuario
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
}

async function saveLocation() {
  if (!markerPosition.value) {
    alert("Por favor, selecciona una ubicación en el mapa");
    return;
  }

  try {
    const locationData = {
      location: editingLocation.value.location,
      coordinates: markerPosition.value,
    };

    if (selectedLocation.value?.id) {
      await updateLocation(selectedLocation.value.id, locationData);
      await eventStore.updateEventsCoordinates(
        selectedLocation.value.id as number,
        locationData.coordinates as { lat: number; lng: number }
      );
    } else {
      await addLocation(locationData.location, locationData.coordinates);
    }

    await loadLocations();
    closeEditModal();
  } catch (error) {
    console.error("Error al guardar la ubicación:", error);
    alert("Error al guardar la ubicación");
  }
}

// Función para manejar el clic en el mapa
function onMapClick(e: any) {
  const { lat, lng } = e.latlng;
  markerPosition.value = { lat, lng };
  coordinatesInput.value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

// Función para buscar ubicación
async function geocodeSearch() {
  if (!searchQuery.value) {
    alert("Por favor ingresa un término de búsqueda");
    return;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery.value
    )}&format=json&limit=1`;

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

// Funciones para el modal de eliminación
function confirmDelete(location: any) {
  selectedLocation.value = location;
  showDeleteModal.value = true;
}

async function deleteLocation() {
  if (!selectedLocation.value?.id) return;

  try {
    await deleteLocationService(selectedLocation.value.id);
    await loadLocations(); // Ahora loadLocations está definida
    showDeleteModal.value = false;
    selectedLocation.value = null;
  } catch (error) {
    console.error("Error al eliminar la ubicación:", error);
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Obtener ubicación actual
    currentPosition.value = await getUserLocation();

    // Cargar ubicaciones
    locations.value = await getLocations();

    // Calcular rutas iniciales
    await calculateAllRoutes();

    // Actualizar cada 5 minutos
    updateInterval.value = window.setInterval(async () => {
      currentPosition.value = await getUserLocation();
      await calculateAllRoutes();
    }, 300000);
  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});

// Registrar onUnmounted antes de cualquier operación asíncrona
onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});
</script>

<style scoped>
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
</style>
