<template>
  <ModalComponent
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="`Nuevo Evento - ${format(selectedDate, 'MMMM d, yyyy')}`"
  >
    <!-- Agregar mensaje de error si existe -->
    <div v-if="errorMessage" class="mb-4 p-2 bg-red-100 text-red-700 rounded">
      {{ errorMessage }}
    </div>

    <!-- Botón de prueba API -->
    <div class="mb-4 flex justify-end">
      <ButtonComponent
        variant="secondary"
        size="sm"
        @click="testGeminiAPI"
        :disabled="isTestingAPI"
      >
        <template v-if="isTestingAPI">
          <span class="inline-block animate-spin mr-2">⌛</span>
          Probando API...
        </template>
        <template v-else> 🔍 Probar API </template>
      </ButtonComponent>
    </div>

    <!-- Mostrar resultado de la prueba -->
    <div
      v-if="apiTestResult !== null"
      :class="[
        'mb-4 p-2 rounded text-sm',
        apiTestResult ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
      ]"
    >
      {{
        apiTestResult
          ? "✅ API funcionando correctamente"
          : "❌ Error al conectar con la API"
      }}
    </div>

    <!-- Formulario principal -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Tipo de Actividad -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Tipo de Actividad</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.activityType"
              value="Eventual"
              class="form-radio text-blue-600"
            />
            <span class="ml-2">Evento Único</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.activityType"
              value="Fija"
              class="form-radio text-blue-600"
            />
            <span class="ml-2">Evento Fijo Semanal</span>
          </label>
        </div>
        <p v-if="eventForm.activityType === 'Fija'" class="text-sm text-gray-500">
          Este evento se repetirá todos los {{ getDayName(selectedDayOfWeek) }} de este
          mes
        </p>
      </div>

      <!-- Estado de Pago -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Estado de Pago</label>
        <div class="flex gap-4">
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.paymentStatus"
              value="Pagado"
              class="form-radio text-green-600"
            />
            <span class="ml-2">Pagado</span>
          </label>
          <label class="inline-flex items-center">
            <input
              type="radio"
              v-model="eventForm.paymentStatus"
              value="Pendiente"
              class="form-radio text-red-600"
            />
            <span class="ml-2">Pendiente</span>
          </label>
        </div>
      </div>

      <!-- Campos del formulario -->
      <div class="space-y-4">
        <!-- Proveedor -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Proveedor</label>
          <input
            v-model="eventForm.provider"
            type="text"
            required
            @focus="fetchSuggestions('provider')"
            list="provider-list"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="provider-list">
            <option
              v-for="suggestion in providerSuggestions"
              :key="suggestion"
              :value="suggestion"
            />
          </datalist>
        </div>

        <!-- Descripción -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Descripción</label>
          <input
            v-model="eventForm.description"
            type="text"
            required
            @focus="fetchSuggestions('description')"
            list="description-list"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="description-list">
            <option
              v-for="suggestion in descriptionSuggestions"
              :key="suggestion"
              :value="suggestion"
            />
          </datalist>
        </div>

        <!-- Lugar -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Lugar</label>
          <input
            v-model="eventForm.location"
            type="text"
            required
            @focus="fetchSuggestions('location')"
            list="location-list"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <datalist id="location-list">
            <option
              v-for="suggestion in locationSuggestions"
              :key="suggestion"
              :value="suggestion"
            />
          </datalist>
        </div>

        <!-- Fecha y Hora -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Fecha</label>
            <input
              v-model="eventForm.date"
              type="date"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Hora</label>
            <input
              v-model="eventForm.time"
              type="time"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Monto -->
        <div>
          <label class="block text-sm font-medium text-gray-700">Monto</label>
          <input
            v-model.number="eventForm.amount"
            type="number"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="flex justify-end gap-3">
        <ButtonComponent
          type="button"
          variant="secondary"
          @click="close"
          :disabled="isSubmitting"
        >
          Cancelar
        </ButtonComponent>
        <ButtonComponent
          type="submit"
          variant="primary"
          :disabled="isSubmitting"
        >
          {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
        </ButtonComponent>
        <!--
        <ButtonComponent variant="danger" @click="deleteEvent">
          Eliminar
        </ButtonComponent>
        -->
      </div>
    </form>
  </ModalComponent>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import { useEventStore } from "../stores/eventStore";
import { useUserStore } from "../stores/userStore";
import { addWeeks, isSameMonth, getDay, format, addDays } from "date-fns";
import { MessageParserService } from "../services/MessageParserService";
import { EventFormData } from "../types/event";
import { useAuthStore } from "../stores/authStore";

/**
 * Props
 */
const props = defineProps({
  modelValue: Boolean,
  selectedDate: Date,
  sharedMessage: String,
});

/**
 * Emits
 */
const emit = defineEmits(["update:modelValue", "saved"]);

/**
 * Stores
 */
const eventStore = useEventStore();
const userStore = useUserStore();
const authStore = useAuthStore();
type PaymentStatus = "Pendiente" | "Pagado";

/**
 * Formulario por defecto
 */
const defaultFormValues: EventFormData = {
  id: Date.now().toString(), // id temporal
  activityType: "Eventual",
  paymentStatus: "Pendiente",
  provider: "",
  description: "",
  location: "",
  date: format(new Date(), "yyyy-MM-dd"),
  time: "19:00",
  amount: 6000,
  userId: authStore.user?.uid || "",
};

/**
 * Estado Reactivo del Form
 */
const eventForm = ref({ ...defaultFormValues } as EventFormData);

/**
 * Sugerencias (localStorage)
 */
const providerSuggestions = ref<string[]>([]);
const descriptionSuggestions = ref<string[]>([]);
const locationSuggestions = ref<string[]>([]);

/**
 * Estado del Test de API
 */
const isTestingAPI = ref(false);
const apiTestResult = ref<boolean | null>(null);

/**
 * Agregar estas variables reactivas
 */
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

/**
 * Watcher para el cambio de fecha seleccionada
 */
watch(
  () => props.selectedDate,
  (newDate) => {
    if (newDate) {
      eventForm.value.date = format(newDate, 'yyyy-MM-dd');
    }
  },
  { immediate: true }
);

/**
 * Manejo de sugerencias desde localStorage
 */
function fetchSuggestions(field: string) {
  const suggestions = JSON.parse(localStorage.getItem(field) || "[]");
  if (field === "provider") {
    providerSuggestions.value = suggestions;
  } else if (field === "description") {
    descriptionSuggestions.value = suggestions;
  } else if (field === "location") {
    locationSuggestions.value = suggestions;
  }
}

function saveSuggestions(field: string, value: string) {
  const suggestions = JSON.parse(localStorage.getItem(field) || "[]");
  if (!suggestions.includes(value)) {
    suggestions.push(value);
    localStorage.setItem(field, JSON.stringify(suggestions));
  }
}

/**
 * Función para guardar el evento
 */
async function saveEvent() {
  if (!eventForm.value.date) return;

  try {
    const eventToSave = {
      ...eventForm.value,
    };

    await eventStore.addEvent(eventToSave);
    saveSuggestions("provider", eventForm.value.provider);
    saveSuggestions("description", eventForm.value.description);
    saveSuggestions("location", eventForm.value.location);

    // Resetear el formulario
    eventForm.value = { ...defaultFormValues };

    emit("saved");
    close();
    // Actualizar el calendario
    await eventStore.fetchEvents();
  } catch (error) {
    console.error("Error al guardar el evento:", error);
  }
}

/**
 * Cerrar el modal
 */
function close() {
  emit("update:modelValue", false);
}

/**
 * Procesar mensaje compartido
 */
async function processSharedMessage(message: string) {
  try {
    const parsedData = await MessageParserService.parseSharedMessage(message);

    // Actualizar el formulario con los datos extraídos
    if (parsedData.provider) eventForm.value.provider = parsedData.provider;
    if (parsedData.description) eventForm.value.description = parsedData.description;
    if (parsedData.location) eventForm.value.location = parsedData.location;
    if (parsedData.date) eventForm.value.date = parsedData.date;
    if (parsedData.time) eventForm.value.time = parsedData.time;
    if (parsedData.amount) eventForm.value.amount = parsedData.amount;
  } catch (error) {
    console.error("Error processing shared message:", error);
  }
}

/**
 * Watch para sharedMessage (si se provee)
 */
watch(
  () => props.sharedMessage,
  (newMessage) => {
    if (newMessage) {
      processSharedMessage(newMessage);
    }
  }
);

/**
 * Test de API (Gemini)
 */
async function testGeminiAPI() {
  try {
    isTestingAPI.value = true;
    console.log("Iniciando prueba de API...");
    const result = await MessageParserService.testConnection();
    console.log("Resultado de la prueba:", result);
    apiTestResult.value = result;
  } catch (error) {
    console.error("Error al probar la API:", error);
    apiTestResult.value = false;
  } finally {
    isTestingAPI.value = false;
    setTimeout(() => {
      apiTestResult.value = null;
    }, 3000);
  }
}

const selectedDayOfWeek = computed(() => {
  if (!eventForm.value.date) return 0;
  return getDay(new Date(eventForm.value.date));
});

function getDayName(day: number): string {
  const days = [
    "domingos",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábados",
  ];
  return days[day];
}

const handleSubmit = async () => {
  if (!eventForm.value.date || !eventForm.value.provider) {
    alert('Por favor complete todos los campos requeridos');
    return;
  }

  try {
    isSubmitting.value = true;
    await saveEvent(); // Usar la función saveEvent en lugar de eventStore.addEvent directamente
    emit('saved');
  } catch (error) {
    console.error('Error al guardar el evento:', error);
    errorMessage.value = 'Error al guardar el evento';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<script lang="ts">
export default {
  name: "EventFormModal",
};
</script>
