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
          v-for="(loc, index) in locationsWithRoutes"
          :key="index"
          class="p-4 flex justify-between bg-green-200 items-center cursor-pointer border-b"
          :class="{ 'bg-red-50': !loc.coord, 'bg-green-50': hasValidRouteInfo(loc) }"
        >
          <!-- Información: Alineado a la izquierda -->
          <div class="flex flex-col gap-2">
            <h4 class="font-medium text-gray-800">{{ loc.location || "Sin nombre" }}</h4>

            <!-- Coordenadas -->
            <div class="flex items-center text-sm text-gray-600">
              <MapIcon class="h-4 w-4 mr-2" />
              <span>{{
                loc.sinCoord ? "Sin coordenadas asignadas" : formatCoordinates(loc.coord)
              }}</span>
            </div>

            <!-- Duración -->
            <div
              v-if="loc.routeInfo?.duration"
              class="flex items-center text-sm text-gray-600"
            >
              <ClockIcon class="h-4 w-4 mr-2" />
              <span>Duración: {{ loc.routeInfo.duration }}</span>
            </div>

            <!-- Distancia -->
            <div
              v-if="loc.routeInfo?.distance"
              class="flex items-center text-sm text-gray-600"
            >
              <MapPinIcon class="h-4 w-4 mr-2" />
              <span>Distancia: {{ loc.routeInfo.distance }}</span>
            </div>

            <!-- Indicador de estado cuando está calculando -->
            <div v-if="loc.isCalculating" class="text-sm text-blue-600">
              Calculando ruta...
            </div>
          </div>
          <!-- Botones de acción: Alineados a la derecha -->
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

      <!-- Contenido del modal con scroll -->
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
            <label class="block text-sm font-medium text-gray-700"> Coordenadas </label>
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
              <!-- mostrar la distancia y la duracion del recorrido -->
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

          <!-- Mapa -->
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
            >
            </MapSearch>
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
// Importaciones del sistema
import { ref, computed, onMounted, onUnmounted, watch, watchEffect } from "vue";
import "leaflet/dist/leaflet.css";

// Importaciones de servicios y utilidades
import { getUserLocation } from "../utils/geolocation";
import { calculateRoute, formatDistance, formatDuration } from "../services/RouteService";
import { useEventStore } from "../stores/eventStore";

// Importaciones de componentes
import MapSearch from "./MapSearch.vue";
import { LMap, LTileLayer, LMarker } from "@vue-leaflet/vue-leaflet";

// Importaciones de iconos
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
  coord?: { lat: number; lng: number };
  routeInfo?: {
    distance: string;
    duration: string;
  };
  isCalculating?: boolean;
}

// Estados Reactivos
const eventStore = useEventStore();

// Estados del panel principal
const open = ref(false);
const locations = ref<Location[]>([]);

// Estados de geolocalización
const currentPosition = ref<{ lat: number; lng: number } | null>(null);
const updateInterval = ref<number | null>(null);

// Estados del mapa
// const mapZoom = ref(13);
const mapCenter = ref<[number, number]>([0, 0]);
const markerPosition = ref<{ lat: number; lng: number } | null>(null);
const tileLayerUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const routeCache = ref(new Map());

// Estados del formulario
const searchQuery = ref("");
const coordinatesInput = ref("");
const editingLocation = ref<Partial<Location>>({});
const formErrors = ref<{ location?: string; coordinates?: string }>({});

// Estados de modales
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedLocation = ref<Location | null>(null);

// Emits
const emit = defineEmits([
  "select-location",
  "update:searchQuery",
  "save-coordinates",
  "update-route",
]);

// mostrar en consola los valores de routeInfo que viene del componente hijo
watchEffect(() => {
  console.log("routeInfo", routeCache.value);
});

// Computed Properties
const locationsWithRoutes = computed(() => {
  const unique = new Set();
  return eventStore.events
    .filter((event) => {
      if (unique.has(event.location)) return false;
      unique.add(event.location);
      return true;
    })
    .map((event) => {
      const routeInfo = routeCache.value.get(event.id); // Usar el ID como clave
      return {
        ...event,
        sinCoord: !event.coord,
        routeInfo: routeInfo
          ? {
              distance: routeInfo.distance,
              duration: routeInfo.duration,
            }
          : null,
        isCalculating: false,
      };
    });
});

// Funciones de utilidad
const formatCoordinates = (
  coords: { lat: number; lng: number } | null | undefined
): string =>
  coords ? `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}` : "Sin coordenadas";

// Remove the unused function since hasValidRouteInfo already provides similar functionality

// Funciones de manejo de UI
const toggle = () => (open.value = !open.value);

const onMapClick = (e: any) => {
  // Actualizar la posición del marcador y el input de coordenadas
  const { lat, lng } = e.latlng;
  markerPosition.value = { lat, lng };
  coordinatesInput.value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
};

// Funciones de validación
const validateForm = (): boolean => {
  formErrors.value = {};
  let isValid = true;

  if (!editingLocation.value.location?.trim()) {
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
};

// Funciones de gestión de ubicaciones
const loadLocations = async () => {
  try {
    const data = await eventStore.getLocations();
    locations.value = Array.isArray(data)
      ? data.map((item, index) => ({
          id: "id" in item ? Number(item.id) : index,
          location: item.location,
          sinCoord: item.sinCoord,
          coord: item.coord,
          routeInfo: undefined,
          isCalculating: false,
        }))
      : [];
    await calculateAllRoutes();
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
  }
};

// Funciones de cálculo de rutas
const calculateRouteForLocation = async (location: Location) => {
  if (!location.coord || !currentPosition.value) return;

  location.isCalculating = true;
  try {
    const route = await calculateRoute(currentPosition.value, location.coord);

    if (!route) {
      console.error("No se pudo calcular la ruta");
      return;
    }

    // Asegurarse de que distance y duration estén formateados correctamente
    const routeInfo = {
      distance: formatDistance(route.distance || 0),
      duration: formatDuration(route.duration || 0),
      timestamp: Date.now(),
      // Guardar valores raw para cálculos
      rawDistance: route.distance,
      rawDuration: route.duration,
    };

    // Actualizar el cache
    routeCache.value.set(location.id, routeInfo);

    // Forzar actualización de la UI
    locations.value = locations.value.map((loc) =>
      loc.id === location.id ? { ...loc, routeInfo, isCalculating: false } : loc
    );
  } catch (error) {
    console.error(`Error calculando ruta para ${location.location}:`, error);
  } finally {
    location.isCalculating = false;
  }
};

// Mejorar la función calculateAllRoutes para procesar en lotes
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

  // Procesar en lotes de 3 para no sobrecargar el servidor
  const batchSize = 3;
  for (let i = 0; i < locationsToUpdate.length; i += batchSize) {
    const batch = locationsToUpdate.slice(i, i + batchSize);
    await Promise.all(batch.map((location) => calculateRouteForLocation(location)));
  }

  console.log("Cálculo de rutas completado");
};

// Agregar una función para verificar si una ruta necesita actualización
const isRouteStale = (routeInfo: any): boolean => {
  if (!routeInfo?.timestamp) return true;

  const ROUTE_TTL = 5 * 60 * 1000; // 5 minutos en milisegundos
  return Date.now() - routeInfo.timestamp > ROUTE_TTL;
};

// Modificar el intervalo de actualización para ser más eficiente
onMounted(async () => {
  try {
    currentPosition.value = await getUserLocation();
    await loadLocations();
    onMapClick({
      latlng: { lat: currentPosition.value.lat, lng: currentPosition.value.lng },
    });
    // Configurar intervalo de actualización
    updateInterval.value = window.setInterval(async () => {
      const newPosition = await getUserLocation();

      // Solo actualizar si la posición ha cambiado significativamente
      if (hasPositionChangedSignificantly(currentPosition.value, newPosition)) {
        currentPosition.value = newPosition;
        await calculateAllRoutes();
      } else {
        // Actualizar solo rutas obsoletas
        const staleLocations = locations.value.filter((loc) =>
          isRouteStale(routeCache.value.get(loc.id))
        );

        if (staleLocations.length > 0) {
          for (const location of staleLocations) {
            await calculateRouteForLocation(location);
          }
        }
      }
    }, 300000); // Cada 5 minutos
  } catch (error) {
    console.error("Error en la inicialización:", error);
  }
});

// Función auxiliar para detectar cambios significativos en la posición
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

const recalcForLocation = async (location: Location) => {
  if (!currentPosition.value) return;
  await calculateRouteForLocation(location);
};

// Funciones de gestión de modales
const openEditModal = async (location: Location) => {
  selectedLocation.value = location;
  editingLocation.value = {
    location: location.location,
    coord: location.coord
      ? { lat: location.coord.lat, lng: location.coord.lng }
      : undefined,
  };

  // Obtener ubicación actual si no está disponible
  if (!currentPosition.value) {
    try {
      currentPosition.value = await getUserLocation();
    } catch (error) {
      console.error("Error obteniendo ubicación actual:", error);
    }
  }

  // Configurar el mapa
  if (currentPosition.value) {
    mapCenter.value = [currentPosition.value.lat, currentPosition.value.lng];

    // Si la ubicación tiene coordenadas, establecer el marcador
    if (location.coord) {
      markerPosition.value = location.coord;
      // Calcular la ruta automáticamente
      await calculateRouteForLocation(location);
    }
  }

  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedLocation.value = null;
  editingLocation.value = {};
  formErrors.value = {};
};

// Funciones de gestión de datos

const deleteLocation = async () => {
  if (!selectedLocation.value) return;

  try {
    if (
      confirm(
        "¿Estás seguro de que deseas eliminar las coordenadas de esta ubicación? Esta acción no se puede deshacer."
      )
    ) {
      // Obtener los eventos asociados a esta ubicación
      const events = await eventStore.getLocations();
      const locationEvents = events.filter(
        (event: {
          location: string;
          sinCoord: boolean;
          coord?: { lat: number; lng: number };
        }) => event.location === selectedLocation.value?.location
      );

      // Actualizar cada evento eliminando solo las coordenadas
      for (const event of locationEvents) {
        if (event.coord) {
          // Crear una copia del evento sin las coordenadas
          const updatedEvent = {
            ...event,
            coord: null, // Simplemente establecemos coord a null
          };

          await eventStore.updateEvent(event.id, updatedEvent);
        }
      }

      // Recargar las ubicaciones y cerrar modales
      await loadLocations();
      showDeleteModal.value = false;
      selectedLocation.value = null;
    } else {
      // Si el usuario cancela, solo cerramos el modal
      showDeleteModal.value = false;
    }
  } catch (error) {
    console.error("Error al eliminar las coordenadas:", error);
    alert("Error al eliminar las coordenadas de la ubicación");
  }
};

const saveLocation = async () => {
  if (!validateForm()) return;

  try {
    const newLocationName = editingLocation.value.location!.trim();
    const newCoordinates = markerPosition.value!;

    if (!selectedLocation.value) {
      alert(
        "Por favor, selecciona una ubicación existente para actualizar sus coordenadas."
      );
      return;
    }

    if (selectedLocation.value.location !== newLocationName) {
      await eventStore.updateEventsLocation(
        selectedLocation.value.location!,
        newLocationName
      );
    }

    await eventStore.updateEventsCoordinates(newLocationName, newCoordinates);
    await loadLocations();
    closeEditModal();
  } catch (error) {
    console.error("Error al guardar la ubicación:", error);
    alert("Error al guardar la ubicación");
  }
};

const confirmDelete = (location: Location) => {
  selectedLocation.value = location;
  showDeleteModal.value = true;
};

// Lifecycle hooks
onUnmounted(() => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value);
  }
});

// Agregar función helper para validar la información de ruta
const hasValidRouteInfo = (location: Location): boolean => {
  // Si la ubicación está marcada como sinCoord, debería tener fondo rojo
  if (location.sinCoord) {
    return false;
  }

  return Boolean(
    location.coord &&
      location.routeInfo?.distance &&
      location.routeInfo?.duration &&
      !location.isCalculating
  );
}; // Agregar punto y coma aquí

// Agregar un watch para debug
watch(
  routeCache,
  (newCache) => {
    console.log("Cache actualizado:", [...newCache.entries()]);
  },
  { deep: true }
);

// Agregar nuevos métodos para manejar las interacciones con el mapa
const handleSaveCoordinates = async (coordinates: { lat: number; lng: number }) => {
  if (!selectedLocation.value) return;

  try {
    // Actualizar las coordenadas del evento
    await eventStore.updateEventsCoordinates(
      selectedLocation.value.location!,
      coordinates
    );

    // Actualizar el estado local
    selectedLocation.value.coord = coordinates;

    // Recalcular la ruta
    await calculateRouteForLocation(selectedLocation.value);

    // Mostrar confirmación
    alert("Coordenadas guardadas correctamente");
  } catch (error) {
    console.error("Error al guardar coordenadas:", error);
    alert("Error al guardar las coordenadas");
  }
};

const handleRouteUpdate = (routeInfo: { distance: string; duration: string }) => {
  if (!selectedLocation.value?.id) return;

  // Actualizar el cache con la nueva información de ruta
  routeCache.value.set(selectedLocation.value.id, {
    ...routeInfo,
    timestamp: Date.now(),
  });

  // Forzar actualización de la UI
  locations.value = [...locations.value];

  // Mostrar confirmación
  alert("Ruta actualizada correctamente");
};

const handleMarkerDrag = (newPosition: { lat: number; lng: number }) => {
  if (!selectedLocation.value) return;

  // Actualizar el input de coordenadas
  coordinatesInput.value = `${newPosition.lat.toFixed(6)}, ${newPosition.lng.toFixed(6)}`;

  // Actualizar la posición del marcador
  markerPosition.value = newPosition;
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
