<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import L from "leaflet";
// Cambiar las importaciones de Heroicons para usar exports nombrados:
import { ChevronDownIcon, MapPinIcon, ClockIcon, MapIcon, PencilIcon, XMarkIcon, TrashIcon, ArrowPathIcon } from "@heroicons/vue/24/outline";
import { LMap } from "@vue-leaflet/vue-leaflet";
import { LTileLayer } from "@vue-leaflet/vue-leaflet";
import { LMarker } from "@vue-leaflet/vue-leaflet";

const emit = defineEmits<{
  (e: "update-route-info", route: { distance: string; duration: string }): void;
}>();

interface Location {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  routeInfo?: {
    distance: string;
    duration: string;
  };
  isCalculating?: boolean;
}

// Panel state
const isPanelOpen = ref(false);

// Map state
const map = ref<L.Map | null>(null);
const mapZoom = ref(13);
const mapCenter = ref<[number, number]>([0, 0]);
const currentLocation = ref<L.LatLng | null>(null);
const locations = ref<Location[]>([]);
const selectedLocation = ref<Location | null>(null);
const routeLine = ref<L.Polyline | null>(null);

// UI state
const loading = ref(false);
const error = ref("");
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const searchQuery = ref("");
const markerPosition = ref<{ lat: number; lng: number } | null>(null);
const coordinatesInput = ref("");

// Form state
const editingLocation = ref({ name: "", coordinates: "" });
const formErrors = ref<{ name?: string; coordinates?: string }>({});

// Custom icons
const currentLocationIcon = L.icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Removed unused destinationIcon declaration.

// Get current location
async function getCurrentLocation() {
  if (!map.value) return;

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude: lat, longitude: lng } = position.coords;
    currentLocation.value = L.latLng(lat, lng);

    // Update map view
    map.value.setView([lat, lng], 13);

    // Add or update marker
    if (currentLocation.value) {
      L.marker([lat, lng], { icon: currentLocationIcon })
        .bindPopup("Your current location")
        .addTo(map.value as L.Map);
    }

    // Recalculate routes if needed
    if (locations.value.length > 0) {
      await calculateAllRoutes();
    }

    return { lat, lng };
  } catch (err) {
    error.value = "Error getting current location: " + (err as Error).message;
    throw err;
  }
}

// Calculate route
async function calculateRoute(location: any) {
  if (!currentLocation.value || !map.value) return;

  location.isCalculating = true;

  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${currentLocation.value.lng},${currentLocation.value.lat};${location.coordinates.lng},${location.coordinates.lat}?overview=full&geometries=geojson`
    );

    const data = await response.json();

    if (data.code === "Ok") {
      // Clear existing route
      if (routeLine.value) {
        routeLine.value.remove();
      }

      // Draw new route as a polyline using the coordinates from the GeoJSON data
      routeLine.value = L.polyline(
        data.routes[0].geometry.coordinates.map((coord: [number, number]) => [
          coord[1],
          coord[0],
        ]),
        { color: "blue" }
      ).addTo(map.value as L.Map);

      const route = {
        distance: `${Math.round(data.routes[0].distance / 1000)} km`,
        duration: `${Math.round(data.routes[0].duration / 60)} minutes`,
      };

      location.routeInfo = route;

      // Fit map to show the entire route if routeLine exists
      if (routeLine.value) {
        map.value.fitBounds(routeLine.value.getBounds(), { padding: [50, 50] });
      }

      // Emit route info
      emit("update-route-info", route);
    }
  } catch (e) {
    console.error("Error calculating route:", e);
    error.value = "Error calculating route";
  } finally {
    location.isCalculating = false;
  }
}

async function calculateAllRoutes() {
  for (const location of locations.value) {
    await calculateRoute(location);
  }
}

// Form validation
function validateForm(): boolean {
  let isValid = true;
  formErrors.value = {};

  if (!editingLocation.value.name || editingLocation.value.name.trim() === "") {
    formErrors.value.name = "Location name is required";
    isValid = false;
  }

  if (!markerPosition.value) {
    formErrors.value.coordinates = "Please select a location on the map";
    isValid = false;
  }

  return isValid;
}

// Location management
async function saveLocation() {
  if (!validateForm()) return;

  try {
    const newLocation: Location = {
      id: selectedLocation.value?.id || Date.now().toString(),
      name: editingLocation.value.name.trim(),
      coordinates: markerPosition.value!,
    };

    if (selectedLocation.value) {
      // Update existing location
      const index = locations.value.findIndex((l) => l.id === selectedLocation.value!.id);
      if (index !== -1) {
        locations.value[index] = newLocation;
      }
    } else {
      // Add new location
      locations.value.push(newLocation);
    }

    await calculateRoute(newLocation);
    closeEditModal();
  } catch (err) {
    console.error("Error saving location:", err);
    error.value = "Error saving location";
  }
}

function openEditModal(location?: Location) {
  selectedLocation.value = location || null;
  editingLocation.value = {
    name: location?.name || "",
    coordinates: location?.coordinates
      ? `${location.coordinates.lat},${location.coordinates.lng}`
      : "",
  };
  markerPosition.value = location?.coordinates || null;
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  selectedLocation.value = null;
  editingLocation.value = { name: "", coordinates: "" };
  markerPosition.value = null;
  formErrors.value = {};
}

function confirmDelete(location: Location) {
  selectedLocation.value = location;
  showDeleteModal.value = true;
}

function deleteLocation() {
  if (selectedLocation.value) {
    locations.value = locations.value.filter((l) => l.id !== selectedLocation.value!.id);
    showDeleteModal.value = false;
    selectedLocation.value = null;
  }
}

// Map interaction
function onMapClick(e: any) {
  const { lat, lng } = e.latlng;
  markerPosition.value = { lat, lng };
  coordinatesInput.value = `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

// Geocoding search
async function geocodeSearch() {
  if (!searchQuery.value || !map.value) return;

  loading.value = true;
  error.value = "";

  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      searchQuery.value
    )}`;
    if (currentLocation.value) {
      const { lat, lng } = currentLocation.value;
      url += `&viewbox=${lng - 0.5},${lat + 0.5},${lng + 0.5},${lat - 0.5}&bounded=1`;
    }
    url += "&format=json&limit=1";

    const response = await fetch(url);
    const data = await response.json();

    if (data.length > 0) {
      const { lat, lon } = data[0];
      mapCenter.value = [parseFloat(lat), parseFloat(lon)];
      markerPosition.value = { lat: parseFloat(lat), lng: parseFloat(lon) };
      coordinatesInput.value = `${lat},${lon}`;
    } else {
      error.value = "Location not found";
    }
  } catch (err) {
    console.error("Error in search:", err);
    error.value = "Error searching location";
  } finally {
    loading.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await getCurrentLocation();
    const updateInterval = window.setInterval(async () => {
      await getCurrentLocation();
    }, 300000); // Update every 5 minutes

    onUnmounted(() => {
      clearInterval(updateInterval);
    });
  } catch (error) {
    console.error("Error in initialization:", error);
  }
});
</script>
<script lang="ts">
// exportar componente
export default {
  name: "LocationManager",
};
</script>

<template>
  <div class="border rounded-lg overflow-hidden mb-4">
    <!-- Panel toggle -->
    <button
      @click="isPanelOpen = !isPanelOpen"
      class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
    >
      <h3 class="text-lg font-medium text-gray-900">Location Management</h3>
      <ChevronDownIcon
        class="h-5 w-5 transition-transform"
        :class="{ 'transform rotate-180': isPanelOpen }"
      />
    </button>

    <!-- Main content -->
    <div v-if="isPanelOpen" class="p-4">
      <!-- Controls -->
      <div class="mb-4 flex gap-2 flex-wrap">
        <button
          @click="openEditModal()"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Add Location
        </button>
        <button
          @click="getCurrentLocation"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Update Current Location
        </button>
      </div>

      <!-- Locations list -->
      <div class="mb-4 border rounded-lg overflow-hidden">
        <div
          v-for="location in locations"
          :key="location.id"
          class="flex items-center justify-between p-4 hover:bg-gray-50"
          :class="location.coordinates ? 'bg-green-50' : 'bg-red-50'"
        >
          <div class="flex-grow">
            <h4 class="font-medium">{{ location.name }}</h4>
            <div class="text-sm text-gray-600">
              <p class="flex items-center gap-2">
                <MapPinIcon class="h-4 w-4" />
                {{ location.coordinates.lat.toFixed(6) }},
                {{ location.coordinates.lng.toFixed(6) }}
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

          <div class="flex items-center gap-2">
            <button
              @click="openEditModal(location)"
              class="p-2 rounded-full hover:bg-gray-100"
              title="Edit location"
            >
              <PencilIcon class="h-4 w-4" />
            </button>
            <button
              v-if="location.coordinates"
              @click="calculateRoute(location)"
              class="p-2 rounded-full hover:bg-gray-100"
              :disabled="location.isCalculating"
            >
              <ArrowPathIcon
                class="h-4 w-4"
                :class="{ 'animate-spin': location.isCalculating }"
              />
            </button>
            <button
              @click="confirmDelete(location)"
              class="p-2 rounded-full hover:bg-gray-100 text-red-600"
              title="Delete location"
            >
              <TrashIcon class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="h-96 bg-gray-100 rounded-lg overflow-hidden">
        <div id="map" class="h-full w-full"></div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 overflow-y-auto"
    >
      <div class="relative bg-white rounded-lg max-w-4xl w-full my-8">
        <button
          @click="closeEditModal"
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <XMarkIcon class="h-6 w-6" />
        </button>

        <div class="p-6">
          <h3 class="text-lg font-medium mb-4">
            {{ selectedLocation ? "Edit" : "Add" }} Location
          </h3>

          <div class="space-y-4">
            <!-- Location name -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Location name</label>
              <input
                v-model="editingLocation.name"
                type="text"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              <p v-if="formErrors.name" class="mt-1 text-sm text-red-600">
                {{ formErrors.name }}
              </p>
            </div>

            <!-- Search -->
            <div>
              <label class="block text-sm font-medium text-gray-700"
                >Search location</label
              >
              <div class="flex gap-2">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Enter address or place name"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
                <button
                  @click="geocodeSearch"
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>

            <!-- Coordinates -->
            <div>
              <label class="block text-sm font-medium text-gray-700">Coordinates</label>
              <input
                v-model="coordinatesInput"
                type="text"
                readonly
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
              />
            </div>

            <!-- Map -->
            <div class="h-96 bg-gray-100 rounded-lg overflow-hidden">
              <LMap
                v-if="showEditModal"
                :zoom="mapZoom"
                :center="mapCenter"
                @click="onMapClick"
              >
                <LTileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                />
                <LMarker
                  v-if="markerPosition"
                  :lat-lng="[markerPosition.lat, markerPosition.lng]"
                />
              </LMap>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="closeEditModal"
              class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              @click="saveLocation"
              class="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-lg p-6 max-w-sm w-full">
        <h3 class="text-lg font-medium mb-4">Confirm deletion</h3>
        <p class="text-gray-600 mb-6">Are you sure you want to delete this location?</p>
        <div class="flex justify-end gap-3">
          <button
            @click="showDeleteModal = false"
            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            @click="deleteLocation"
            class="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

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
</style>
