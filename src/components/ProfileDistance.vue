<template>
  <div class="border rounded-lg overflow-hidden mb-4">
    <!-- Botón para alternar la visibilidad del panel -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
    >
      <h3 class="text-lg font-medium text-gray-900">Gestión de Ubicaciones</h3>
      <ChevronDownIcon
        :class="['h-5 w-5 transition-transform', open ? 'transform rotate-180' : '']"
      />
    </button>

    <!-- Contenido principal -->
    <div v-if="open" class="p-4">
      <!-- Lista de ubicaciones -->
      <div class="mb-4 border rounded-lg overflow-hidden">
        <div
          v-for="(loc, index) in locationsWithRoutes"
          :key="index"
          class="p-4 flex justify-between items-center cursor-pointer border-b"
          :class="{ 'bg-red-50': !loc.coord, 'bg-green-50': hasValidRouteInfo(loc) }"
        >
          <!-- Información de la ubicación -->
          <div class="flex flex-col gap-2">
            <h4 class="font-medium text-gray-800">
              {{ loc.location || "Sin nombre" }}
            </h4>
            <div class="flex items-center text-sm text-gray-600">
              <MapIcon class="h-4 w-4 mr-2" />
              <span>
                {{
                  loc.sinCoord
                    ? "Sin coordenadas asignadas"
                    : formatCoordinates(loc.coord)
                }}
              </span>
            </div>
            <div
              v-if="loc.routeInfo?.duration"
              class="flex items-center text-sm text-gray-600"
            >
              <ClockIcon class="h-4 w-4 mr-2" />
              <span>Duración: {{ loc.routeInfo.duration }}</span>
            </div>
            <div
              v-if="loc.routeInfo?.distance"
              class="flex items-center text-sm text-gray-600"
            >
              <MapPinIcon class="h-4 w-4 mr-2" />
              <span>Distancia: {{ loc.routeInfo.distance }}</span>
            </div>
            <div v-if="loc.isCalculating" class="text-sm text-blue-600">
              Calculando ruta...
            </div>
          </div>
          <!-- Botones de acción -->
          <div class="flex items-center gap-2 ml-auto">
            <button @click.stop="openEditModal(loc)" class="btn-icon" title="Abrir mapa">
              <MapIcon class="h-4 w-4" />
            </button>
            <button
              @click.stop="recalcForLocation(loc)"
              class="btn-icon"
              title="Refrescar ruta"
              v-if="loc.coord"
            >
              <RefreshIcon
                class="h-4 w-4"
                :class="{ 'animate-spin': loc.isCalculating }"
              />
            </button>
            <button
              @click.stop="confirmDelete(loc)"
              class="btn-icon text-red-600"
              title="Eliminar coordenadas"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de Edición -->
  <div
    v-if="showEditModal"
    class="fixed inset-0 h-screen bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto"
  >
    <div class="relative bg-white rounded-lg w-full max-w-4xl h-full">
      <!-- Botón de cierre -->
      <button
        @click="closeEditModal"
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-500 z-10"
      >
        <XMarkIcon class="h-6 w-6" />
      </button>
      <!-- Contenido del modal -->
      <div class="p-6 h-full overflow-y-auto">
        <h3 class="text-lg font-medium mb-4">
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
            <p v-if="formErrors.location" class="text-xs text-red-500 mt-1">
              {{ formErrors.location }}
            </p>
          </div>
          <!-- Coordenadas -->
          <div>
            <label class="block text-sm font-medium text-gray-700">
              Coordenadas
            </label>
            <input
              v-model="coordinatesInput"
              type="text"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              readonly
            />
            <p class="text-xs text-gray-500 mt-1">
              Haz clic en el mapa para seleccionar una ubicación.
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ selectedLocation?.routeInfo?.distance }} -
              {{ selectedLocation?.routeInfo?.duration }}
            </p>
            <p v-if="formErrors.coordinates" class="text-xs text-red-500 mt-1">
              {{ formErrors.coordinates }}
            </p>
          </div>
          <!-- Botones de acción -->
          <div class="mt-6 flex justify-end gap-3 sticky bottom-0 bg-white py-4">
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
          <!-- Componente de mapa -->
          <div class="h-96 bg-gray-100 rounded-lg overflow-hidden">
            <MapSearch
              :destinationCoordinates="selectedLocation?.coord"
              :currentLocation="currentPosition"
              v-model:searchQuery="searchQuery"
              @save-coordinates="handleSaveCoordinates"
              @update-route="handleRouteUpdate"
              @marker-drag="handleMarkerDrag"
              @map-click="onMapClick"
              class="h-full bg-gray-100 rounded-lg overflow-hidden"
            />
          </div>
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
</template>

<script setup lang="ts">
// Importaciones del sistema y librerías
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import "leaflet/dist/leaflet.css";

// Importaciones de servicios y utilidades
import { getUserLocation } from "../utils/geolocation";
import { calculateRoute, formatDistance, formatDuration } from "../services/RouteService";
import { useEventStore } from "../stores/eventStore";

// Importaciones de componentes e íconos
import MapSearch from "./MapSearch.vue";
import {
  MapPinIcon,
  ClockIcon,
  MapIcon,
  RefreshIcon,
  TrashIcon,
  XMarkIcon,
  ChevronDownIcon,
} from "../utils/icons";

// Tipos e interfaces
interface Location {
  id: string;
  userId: string;
  activityType: "Fija" | "Eventual";
  amount: number;
  createdAt: string;
  location: string;
  sinCoord: boolean;
  coord?: { lat: number; lng: number } | null;
  routeInfo?: {
    distance: string;
    duration: string;
    timestamp: number;
  } | null;
  isCalculating?: boolean;
}

type RouteCacheEntry = {
  distance: string;
  duration: string;
  timestamp: number;
  rawDistance: number;
  rawDuration: number;
};

// Estados Reactivos
const eventStore = useEventStore();
const open = ref(false);
const locations = ref<Location[]>([]);
const currentPosition = ref<{ lat: number; lng: number } | null>(null);
const updateInterval = ref<number | null>(null);
const mapCenter = ref<[number, number]>([0, 0]);
const markerPosition = ref<{ lat: number; lng: number } | null>(null);
const routeCache = ref(new Map<string, RouteCacheEntry>());
const searchQuery = ref("");
const coordinatesInput = ref("");
const editingLocation = ref<Partial<Location>>({});
const formErrors = ref<{ location?: string; coordinates?: string }>({});
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedLocation = ref<Location | null>(null);

// Computed: integrar rutas con las ubicaciones
const locationsWithRoutes = computed(() => {
  const unique = new Set();
  return eventStore.events
    .filter((event) => {
      if (unique.has(event.location)) return false;
      unique.add(event.location);
      return true;
    })
    .map((event) => {
      const routeInfo = routeCache.value.get(event.id);
      return {
        ...event,
        sinCoord: !event.coord,
        routeInfo: routeInfo
          ? {
              distance: routeInfo.distance,
              duration: routeInfo.duration,
              timestamp: routeInfo.timestamp,
            }
          : null,
        isCalculating: false,
      };
    });
});

// Función para formatear las coordenadas
const formatCoordinates = (
  coords: { lat: number; lng: number } | null | undefined
): string =>
  coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Sin coordenadas";

// Alternar visibilidad del panel
const toggle = () => {
  open.value = !open.value;
};

// Actualizar posición del marcador al hacer clic en el mapa
const onMapClick = (e: any) => {
  const { lat, lng } = e.latlng;
  markerPosition.value = { lat, lng };
  coordinatesInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

// Validación del formulario de edición
const validateForm = (): boolean => {
  formErrors.value = {};
  let isValid = true;
  if (!editingLocation.value.location?.trim()) {
    formErrors.value.location = "El nombre de la ubicación es requerido.";
    isValid = false;
  }
  if (!markerPosition.value) {
    formErrors.value.coordinates = "Debe seleccionar una ubicación válida en el mapa.";
    isValid = false;
  }
  return isValid;
};

// Cargar ubicaciones desde el store
const loadLocations = async () => {
  try {
    const data = await eventStore.getLocations();
    if (!Array.isArray(data)) {
      console.error("Datos de ubicaciones en formato inesperado:", data);
      alert("Error al cargar ubicaciones: datos no válidos");
      return;
    }
    locations.value = data.map((item) => ({
      id: "id" in item ? item.id : String(Math.random()),
      location: item.location,
      sinCoord: item.sinCoord,
      coord: item.coord,
      routeInfo: undefined,
      isCalculating: false,
    }));
    await calculateAllRoutes();
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
    alert("Error al cargar ubicaciones. Inténtelo de nuevo más tarde.");
  }
};

// Calcular la ruta para una ubicación
const calculateRouteForLocation = async (location: Location) => {
  if (!location.coord || !currentPosition.value) return;
  location.isCalculating = true;
  try {
    const route = await calculateRoute(currentPosition.value, location.coord);
    if (!route) {
      console.error("No se pudo calcular la ruta");
      alert(`No se pudo calcular la ruta para ${location.location}`);
      return;
    }
    const routeInfo: RouteCacheEntry = {
      distance: formatDistance(route.distance || 0),
      duration: formatDuration(route.duration || 0),
      timestamp: Date.now(),
      rawDistance: route.distance,
      rawDuration: route.duration,
    };
    routeCache.value.set(location.id, routeInfo);
  } catch (error) {
    console.error(`Error calculando ruta para ${location.location}:`, error);
    alert(`Error calculando ruta para ${location.location}`);
  } finally {
    location.isCalculating = false;
  }
};

// Calcular rutas para todas las ubicaciones en lotes
const calculateAllRoutes = async () => {
  if (!currentPosition.value) {
    console.warn("No hay posición actual disponible");
    return;
  }
  const locationsToUpdate = locations.value.filter(
    (loc) => loc.coord && !loc.isCalculating
  );
  if (locationsToUpdate.length === 0) {
    console.log("No hay ubicaciones para actualizar");
    return;
  }
  const batchSize = 3;
  for (let i = 0; i < locationsToUpdate.length; i += batchSize) {
    const batch = locationsToUpdate.slice(i, i + batchSize);
    await Promise.all(batch.map((location) => calculateRouteForLocation(location)));
  }
  console.log("Cálculo de rutas completado");
};

// Verificar si la información de la ruta es obsoleta
const isRouteStale = (routeInfo: RouteCacheEntry | undefined): boolean => {
  if (!routeInfo || !routeInfo.timestamp || !routeInfo.distance || !routeInfo.duration)
    return true;
  const ROUTE_TTL = 5 * 60 * 1000; // 5 minutos
  return Date.now() - routeInfo.timestamp > ROUTE_TTL;
};

// Detectar cambios significativos en la posición
const hasPositionChangedSignificantly = (
  oldPos: { lat: number; lng: number } | null,
  newPos: { lat: number; lng: number } | null
): boolean => {
  if (!oldPos || !newPos) return true;
  const THRESHOLD = 0.0001; // Aproximadamente 11 metros
  return (
    Math.abs(oldPos.lat - newPos.lat) > THRESHOLD ||
    Math.abs(oldPos.lng - newPos.lng) > THRESHOLD
  );
};

// Recalcular la ruta de una ubicación específica
const recalcForLocation = async (location: Location) => {
  if (!currentPosition.value) return;
  await calculateRouteForLocation(location);
};

// Abrir modal de edición y configurar datos iniciales
const openEditModal = async (location: Location) => {
  selectedLocation.value = location;
  editingLocation.value = {
    location: location.location,
    coord: location.coord ? { lat: location.coord.lat, lng: location.coord.lng } : undefined,
  };
  if (!currentPosition.value) {
    try {
      currentPosition.value = await getUserLocation();
    } catch (error) {
      console.error("Error obteniendo ubicación actual:", error);
      alert("Error obteniendo ubicación actual");
    }
  }
  if (currentPosition.value) {
    mapCenter.value = [currentPosition.value.lat, currentPosition.value.lng];
    if (location.coord) {
      markerPosition.value = location.coord;
      await calculateRouteForLocation(location);
    }
  }
  showEditModal.value = true;
  coordinatesInput.value = location.coord
    ? `${location.coord.lat.toFixed(6)}, ${location.coord.lng.toFixed(6)}`
    : "";
};

// Cerrar modal de edición y limpiar estados
const closeEditModal = () => {
  showEditModal.value = false;
  selectedLocation.value = null;
  editingLocation.value = {};
  formErrors.value = {};
  markerPosition.value = null;
  coordinatesInput.value = "";
};

// Eliminar coordenadas de la ubicación seleccionada
const deleteLocation = async () => {
  if (!selectedLocation.value) return;
  try {
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar las coordenadas de esta ubicación? Esta acción no se puede deshacer."
      )
    ) {
      const events = await eventStore.getLocations();
      const locationEvents = events.filter((event: { location: string; sinCoord: boolean; coord?: { lat: number; lng: number } }) =>
        event.location === selectedLocation.value?.location
      );
      for (const event of locationEvents) {
        if (event.coord) {
          const updatedEvent = { ...event, coord: null };
          await eventStore.updateEvent(event.id, updatedEvent);
        }
      }
      await loadLocations();
      showDeleteModal.value = false;
      selectedLocation.value = null;
    } else {
      showDeleteModal.value = false;
    }
  } catch (error) {
    console.error("Error al eliminar las coordenadas:", error);
    alert("Error al eliminar las coordenadas de la ubicación");
  }
};

// Guardar la ubicación (actualizar nombre y coordenadas)
const saveLocation = async () => {
  if (!validateForm()) return;
  try {
    const newLocationName = editingLocation.value.location!.trim();
    const newCoordinates = markerPosition.value!;
    if (!selectedLocation.value) {
      alert("No se ha seleccionado una ubicación");
      return;
    }
    if (selectedLocation.value.location !== newLocationName) {
      await eventStore.updateEvent(selectedLocation.value.id, { location: newLocationName });
      // Actualizar la cache de rutas si es necesario
      routeCache.value.forEach((value, key) => {
        const oldName = selectedLocation.value?.location;
        if (key.includes(oldName)) {
          const newKey = key.replace(oldName, newLocationName);
          routeCache.value.set(newKey, value);
          routeCache.value.delete(key);
        }
      });
    }
    await saveCoordinates(newCoordinates);
    await calculateAllRoutes();
    await loadLocations();
    closeEditModal();
  } catch (error) {
    console.error("Error al guardar la ubicación:", error);
    alert("Error al guardar la ubicación");
  }
};

// Guardar las coordenadas en el store
const saveCoordinates = async (coordinates: { lat: number; lng: number }) => {
  if (!selectedLocation.value) throw new Error("No se ha seleccionado una ubicación.");
  await eventStore.updateEventsCoordinates(selectedLocation.value.id, coordinates);
  selectedLocation.value.coord = coordinates;
};

// Manejar el guardado de coordenadas desde el componente MapSearch
const handleSaveCoordinates = async (coordinates: { lat: number; lng: number }) => {
  if (!selectedLocation.value) return;
  try {
    await saveCoordinates(coordinates);
    await calculateRouteForLocation(selectedLocation.value);
    await calculateAllRoutes();
    alert("Coordenadas guardadas correctamente");
  } catch (error) {
    console.error("Error al guardar coordenadas:", error);
    alert("Error al guardar las coordenadas");
  }
};

// Actualizar la ruta desde MapSearch
const handleRouteUpdate = (routeInfo: { distance: string; duration: string }) => {
  if (!selectedLocation.value?.id) return;
  routeCache.value.set(selectedLocation.value.id, {
    ...routeInfo,
    timestamp: Date.now(),
    rawDistance: 0,
    rawDuration: 0,
  });
  locations.value = [...locations.value]; // Forzar actualización de la UI
  alert("Ruta actualizada correctamente");
};

// Actualizar el input y posición al arrastrar el marcador en el mapa
const handleMarkerDrag = (newPosition: { lat: number; lng: number }) => {
  if (!selectedLocation.value) return;
  coordinatesInput.value = `${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`;
  markerPosition.value = newPosition;
};

// Inicialización: obtener ubicación actual, cargar ubicaciones y configurar intervalos
onMounted(async () => {
  try {
    currentPosition.value = await getUserLocation();
    await loadLocations();
    onMapClick({
      latlng: { lat: currentPosition.value.lat, lng: currentPosition.value.lng },
    });
    updateInterval.value = window.setInterval(async () => {
      const newPosition = await getUserLocation();
      if (hasPositionChangedSignificantly(currentPosition.value, newPosition)) {
        currentPosition.value = newPosition;
        await calculateAllRoutes();
      } else {
        const staleLocations = locations.value.filter((loc) =>
          isRouteStale(routeCache.value.get(loc.id))
        );
        for (const location of staleLocations) {
          await calculateRouteForLocation(location);
        }
      }
    }, 300000); // Cada 5 minutos
  } catch (error) {
    console.error("Error en la inicialización:", error);
    alert("Error en la inicialización");
  }
});

onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});

// Helper para verificar si una ubicación tiene información de ruta válida
const hasValidRouteInfo = (location: Location): boolean => {
  if (location.sinCoord) return false;
  return Boolean(
    location.coord &&
      location.routeInfo?.distance &&
      location.routeInfo?.duration &&
      !location.isCalculating
  );
};

// Debug: Mostrar cambios en la cache de rutas
watch(
  routeCache,
  (newCache) => {
    console.log("Cache actualizado:", [...newCache.entries()]);
  },
  { deep: true }
);
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
    height: 16rem;
  }
}
.leaflet-container {
  height: 100% !important;
  width: 100% !important;
}
</style>
