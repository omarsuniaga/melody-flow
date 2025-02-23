<template>
  <div>
    <!-- Botón flotante para abrir el modal -->
    <button
      @click="openModal"
      class="fixed bottom-16 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center transition-all hover:shadow-xl"
    >
      <PlusIcon class="h-6 w-6" />
    </button>
    <!-- Modal -->
    <ModalComponent
      :model-value="isOpen"
      @update:model-value="closeModal"
      title="Describe tu evento"
      class="prompt-modal"
    >
      <div class="p-4">
        <textarea
          v-model="promptText"
          class="w-full h-32 p-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe tu evento (ejemplo: 'Este Viernes a las 8pm, en el Hotel California, por 6500 Pesos con ProductionEvents, en el Restaurant Pergola')"
          :disabled="isProcessing"
        ></textarea>

        <!-- Nueva sección para elegir modo de interpretación -->
        <div class="mt-4 flex justify-center gap-4"></div>
        <!-- Fin de la nueva sección -->

        <div v-if="parsedResult" class="interpretation-section">
          <div class="interpretation-header">
            <h3 class="text-lg font-semibold text-gray-800">
              <span class="icon">🎯</span> Interpretación
              <span v-if="confidence" class="text-sm text-gray-500">
                ({{ Math.round(confidence * 100) }}% de confianza)
              </span>
            </h3>
          </div>
          <div class="interpretation-content">
            <div v-for="(value, key) in displayFields" :key="key" class="field-item">
              <div class="field-label">{{ fieldLabels[key] }}:</div>
              <template v-if="isEditing">
                <input
                  v-if="['provider', 'description', 'location'].includes(key)"
                  v-model="parsedResult[key]"
                  type="text"
                  class="field-input"
                  :placeholder="getPlaceholder(key)"
                />
                <input
                  v-else-if="key === 'date'"
                  v-model="parsedResult[key]"
                  type="date"
                  class="field-input"
                  @invalid="handleDateInvalid"
                />
                <input
                  v-else-if="key === 'time'"
                  v-model="parsedResult[key]"
                  type="time"
                  class="field-input"
                />
                <template v-else-if="key === 'amount'">
                  <!-- Usar computed editableAmount para suportar numero u objeto -->
                  <input
                    v-model.number="editableAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    class="field-input"
                  />
                </template>
              </template>
              <div v-else class="field-value" :class="getFieldClass(value)">
                <span>{{ formatFieldValue(value, key) }}</span>
              </div>
            </div>
            <div class="interpretation-actions">
              <template v-if="!showCorrection">
                <ButtonComponent
                  variant="secondary"
                  class="edit-button"
                  @click="toggleEditMode"
                >
                  <template v-if="isProcessing && isEditing">
                    <svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                    Guardando...
                  </template>
                  <template v-else>
                    <PencilIcon class="w-4 h-4 mr-2" />
                    {{ isEditing ? "Guardar cambios" : "Editar" }}
                  </template>
                </ButtonComponent>
              </template>
              <ButtonComponent
                variant="primary"
                class="confirm-button"
                @click="handleConfirm"
                :disabled="!isValid"
              >
                <CheckIcon class="w-4 h-4 mr-2" />
                Confirmar
              </ButtonComponent>
            </div>
          </div>
        </div>
        <div v-if="error" class="mt-2 text-red-600 text-sm">{{ error }}</div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            @click="processPromptWithAI"
            class="flex items-center px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
            :disabled="!geminiAvailable || isProcessing"
            title="Interpretar con AI (GeminiService)"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="size-6"
            >
              <path
                fill-rule="evenodd"
                d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0 1 16.5 15Z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
          <!-- boton de interpretar que muestra una animacion de engranaja al cargar  -->
          <button
            @click="processPromptLocal"
            class="flex items-center px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            :disabled="isProcessing"
            title="Interpretar localmente"
          >
            <CogIcon class="w-6 h-6" />
          </button>
        </div>
      </div>
    </ModalComponent>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import PlusIcon from "@heroicons/vue/24/solid/PlusIcon";
import PencilIcon from "@heroicons/vue/24/solid/PencilIcon";
import CheckIcon from "@heroicons/vue/24/solid/CheckIcon";
import CogIcon from "@heroicons/vue/24/solid/CogIcon"; // Nuevo: icono de engranaje para local
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import { LocalNLPService } from "../services/LocalNLPService";
import { CorrectionService } from "../services/CorrectionService"; // Nuevo import
import { processEventText } from "../services/geminiService"; // Nuevo import

const geminiAvailable = ref(true); // Bandera para indicar disponibilidad de GeminiService

const emit = defineEmits(["eventProcessed"]);

const isOpen = ref(false);
const promptText = ref("");
const isProcessing = ref(false);
const error = ref("");

// Nueva variable reactiva para asegurar edición de interpretaciones
const interpretation = ref("");

const fieldLabels = {
  provider: "Proveedor",
  description: "Descripción",
  location: "Ubicación",
  date: "Fecha",
  time: "Hora",
  amount: "Monto",
};

const isEditing = ref(false);
const parsedResult = ref<any>(null); // Mejorar tipado según sea posible
const showCorrection = ref(false);

// Nueva propiedad computada para el monto editable
const editableAmount = computed({
  get() {
    return typeof parsedResult.value?.amount === "number"
      ? parsedResult.value.amount
      : parsedResult.value?.amount?.value || 0;
  },
  set(val: number) {
    if (parsedResult.value) {
      if (
        typeof parsedResult.value.amount === "object" &&
        parsedResult.value.amount !== null
      ) {
        parsedResult.value.amount.value = val;
      } else {
        parsedResult.value.amount = val;
      }
    }
  },
});

const openModal = () => {
  isOpen.value = true;
};

const closeModal = () => {
  isOpen.value = false;
  promptText.value = "";
  error.value = "";
  parsedResult.value = null;
};

const confidence = computed(() => parsedResult.value?.confidence || 0);

const getPlaceholder = (
  key: keyof {
    provider: string;
    description: string;
    location: string;
    date: string;
    time: string;
    amount: string;
  }
) => {
  const placeholders = {
    provider: "Nombre del proveedor",
    description: "Descripción del evento",
    location: "Ubicación del evento",
    date: "Fecha del evento",
    time: "Hora del evento",
    amount: "Monto a cobrar",
  };
  return placeholders[key];
};

const formatFieldValue = (value: any, key: string) => {
  if (!value) return "No detectado";
  switch (key) {
    case "amount":
      return `$${value}`;
    case "date":
      try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [year, month, day] = value.split("-");
          return `${day}/${month}/${year}`;
        }
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
        return new Date(value).toLocaleDateString();
      } catch {
        return value;
      }
    default:
      return value;
  }
};

// Removed unused processPrompt function.

const handleConfirm = async () => {
  if (!parsedResult.value) return;
  try {
    const eventData = {
      provider: parsedResult.value.provider || "",
      description: parsedResult.value.description || "",
      location: parsedResult.value.location || "",
      date: formatDateToISO(
        parsedResult.value.date || new Date().toISOString().split("T")[0]
      ),
      time: parsedResult.value.time || "",
      amount:
        typeof parsedResult.value.amount === "object" &&
        parsedResult.value.amount !== null
          ? parsedResult.value.amount.value
          : parsedResult.value.amount || 0,
      activityType: "Eventual",
      paymentStatus: "Pendiente",
    };
    console.log("Datos del evento formateados:", eventData);
    emit("eventProcessed", eventData);
    closeModal();
  } catch (err) {
    console.error("Error al procesar el evento:", err);
    error.value = "No se pudo crear el evento";
  }
};

// Removed unused handleCorrect function as it was not utilized in the component.

const getFieldClass = (value: any) => ({
  "text-yellow-600": !value,
  "text-green-600": value?.confidence > 0.8,
  "text-blue-600": value?.confidence > 0.5 && value?.confidence <= 0.8,
  "text-gray-600": value?.confidence <= 0.5,
});

const formatDateToISO = (dateStr: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : dateStr;
};

const handleDateInvalid = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.validity.badInput) {
    error.value = `El valor "${target.value}" no cumple el formato requerido: yyyy-MM-dd`;
  }
};

const displayFields = computed(() => ({
  provider: parsedResult.value?.provider,
  description: parsedResult.value?.description,
  location: parsedResult.value?.location,
  date: parsedResult.value?.date,
  time: parsedResult.value?.time,
  amount:
    typeof parsedResult.value?.amount === "number"
      ? parsedResult.value.amount
      : parsedResult.value?.amount?.value ?? "No detectado",
}));

const isValid = computed(() => {
  return (
    parsedResult.value && Object.values(displayFields.value).some((value) => !!value)
  );
});

// Agregar función para guardar la corrección y reentrenar el modelo
const saveCorrection = async () => {
  if (!parsedResult.value) return;
  isProcessing.value = true;
  try {
    // Se envía el texto original, la predicción original y la versión corregida
    await CorrectionService.correctAndLearn(
      promptText.value, // Texto original
      parsedResult.value, // Predicción original
      { ...parsedResult.value } // Corrección (se asume que el usuario editó manualmente los campos)
    );
    console.log("Corrección guardada y modelo reentrenado.");
  } catch (error) {
    console.error("Error al guardar la corrección:", error);
  } finally {
    isProcessing.value = false;
  }
};

// Modificar toggleEditMode para llamar a saveCorrection al salir del modo edición
const toggleEditMode = () => {
  isEditing.value = !isEditing.value;
  if (!isEditing.value && parsedResult.value) {
    saveCorrection();
  }
};

// Agregar dos métodos para interpretar con AI o local
const processPromptWithAI = async () => {
  if (!geminiAvailable.value) return;
  isProcessing.value = true;
  error.value = "";
  try {
    // Consumir el servicio de Gemini para interpretar el texto
    const result = await processEventText(promptText.value);
    parsedResult.value = result;
    console.log("Resultado de Gemini AI:", result);
  } catch (err) {
    console.error("Error en interpretación AI:", err);
    error.value = "Error en interpretación AI.";
  } finally {
    isProcessing.value = false;
  }
};

const processPromptLocal = async () => {
  if (!promptText.value.trim()) return;
  isProcessing.value = true;
  error.value = "";
  try {
    const result = await LocalNLPService.parseText(promptText.value);
    parsedResult.value = result;
  } catch (err) {
    console.error("Error en procesamiento local:", err);
    error.value = "Error en procesamiento local.";
  } finally {
    isProcessing.value = false;
  }
};
</script>

<script lang="ts">
export default {
  name: "AddPrompt",
};
</script>

<style lang="postcss" scoped>
.prompt-modal :deep(.modal-content) {
  @apply shadow-xl;
  max-width: 500px;
}

.form-input {
  @apply rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500;
}

.form-group label {
  @apply block text-gray-700;
}

.interpretation-section {
  @apply bg-white rounded-lg shadow-sm p-4 mt-4 border border-gray-200;
  animation: slideIn 0.3s ease-out;
}

.interpretation-header {
  @apply mb-4 pb-2 border-b border-gray-100;
}

.interpretation-content {
  @apply space-y-3;
}

.field-item {
  @apply flex items-center py-2 px-3 rounded-md hover:bg-gray-50 transition-colors;
}

.field-label {
  @apply w-1/3 text-sm font-medium text-gray-600;
}

.field-value {
  @apply w-2/3 text-sm text-gray-800;
}

.field-input {
  @apply w-2/3 px-2 py-1 text-sm border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white;
}

.interpretation-actions {
  @apply flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100;
}

.edit-button {
  @apply hover:bg-gray-100 transition-colors;
}

.confirm-button {
  @apply hover:bg-blue-600 transition-colors;
}

.confidence-indicator {
  @apply text-xs text-gray-500 ml-2;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.field-value.incomplete {
  @apply text-yellow-600 italic;
}

.field-value.confident {
  @apply text-green-600 font-medium;
}
</style>
