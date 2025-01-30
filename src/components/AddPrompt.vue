<template>
  <div>
    <!-- Botón flotante -->
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

        <!-- Sección de Interpretación -->
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
              <!-- Campo editable -->
              <template v-if="isEditing">
                <input
                  v-if="['provider', 'description', 'location'].includes(key)"
                  v-model="parsedResult[key]"
                  :type="'text'"
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
                <input
                  v-else-if="key === 'amount'"
                  v-model.number="parsedResult[key]"
                  type="number"
                  min="0"
                  step="0.01"
                  class="field-input"
                />
              </template>
              <!-- Campo de solo lectura -->
              <div v-else class="field-value" :class="getFieldClass(value, key)">
                <span>{{ formatFieldValue(value, key) }}</span>
              </div>
            </div>

            <div class="interpretation-actions">
              <ButtonComponent
                variant="secondary"
                class="edit-button"
                @click="toggleEditMode"
              >
                <PencilIcon class="w-4 h-4 mr-2" />
                {{ isEditing ? "Guardar cambios" : "Editar" }}
              </ButtonComponent>

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

        <!-- Mensaje de error -->
        <div v-if="error" class="mt-2 text-red-600 text-sm">
          {{ error }}
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <ButtonComponent variant="secondary" @click="closeModal">
            Cancelar
          </ButtonComponent>
          <ButtonComponent
            variant="primary"
            @click="processPrompt"
            :loading="isProcessing"
          >
            Procesar
          </ButtonComponent>
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
import ModalComponent from "./ModalComponent.vue";
import ButtonComponent from "./ButtonComponent.vue";
import { MessageParserService } from "../services/MessageParserService";
import { LocalNLPService } from "../services/LocalNLPService";

const emit = defineEmits(["eventProcessed"]);
const isOpen = ref(false);
const promptText = ref("");
const isProcessing = ref(false);
const error = ref("");

const fieldLabels = {
  provider: "Proveedor",
  description: "Descripción",
  location: "Ubicación",
  date: "Fecha",
  time: "Hora",
  amount: "Monto",
};

const isEditing = ref(false);

const toggleEditMode = async () => {
  if (isEditing.value) {
    // Si estamos guardando los cambios
    try {
      await handleCorrect();
      isEditing.value = false;
      error.value = "Cambios guardados correctamente";
    } catch (err) {
      error.value = "Error al guardar los cambios";
      console.error(err);
    }
  } else {
    // Activar modo edición
    isEditing.value = true;
  }
};

// Mostrar en la sección de interpretación
const displayFields = computed(() => ({
  provider: parsedResult.value?.provider,
  description: parsedResult.value?.description,
  location: parsedResult.value?.location,
  date: parsedResult.value?.date,
  time: parsedResult.value?.time,
  amount: parsedResult.value?.amount,
}));

const isValid = computed(() => {
  return parsedResult.value && Object.values(displayFields.value).some((value) => value);
});

interface ParsedResult {
  provider: string | null;
  description: string | null;
  location: string | null;
  date: string | null;
  time: string | null;
  amount: number | null;
  confidence?: number; // Agregar campo confidence opcional
}

const parsedResult = ref<ParsedResult | null>(null);
const showCorrection = ref(false);

const openModal = () => {
  isOpen.value = true;
};

const closeModal = () => {
  isOpen.value = false;
  promptText.value = "";
};

const confidence = computed(() => {
  if (!parsedResult.value) return 0;
  return parsedResult.value.confidence || 0;
});

const getPlaceholder = (key: string) => {
  const placeholders = {
    provider: "Nombre del proveedor",
    description: "Descripción del evento",
    location: "Ubicación del evento",
    date: "Fecha del evento",
    time: "Hora del evento",
    amount: "Monto a cobrar",
  };
  return placeholders[key as keyof typeof placeholders];
};

/**
 * Aquí la mejora: si el valor es formato dd/mm/yyyy, lo mostramos tal cual.
 * Si no, intentamos convertir con new Date(...) y mostrar con toLocaleDateString().
 */
const formatFieldValue = (value: any, key: string) => {
  if (!value) return "No detectado";

  switch (key) {
    case "amount":
      return `$${value}`;
    case "date":
      try {
        // Para mostrar, convertimos de ISO a formato local
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [year, month, day] = value.split("-");
          return `${day}/${month}/${year}`;
        }
        // Si ya está en formato dd/mm/yyyy, lo mostramos así
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          return value;
        }
        // Último recurso: intentar parsear como fecha
        const date = new Date(value);
        return date.toLocaleDateString();
      } catch {
        return value;
      }
    case "time":
      return value;
    default:
      return value;
  }
};

const processPrompt = async () => {
  if (!promptText.value.trim()) return;

  try {
    isProcessing.value = true;
    error.value = "";
    parsedResult.value = null;

    // Procesar con el servicio local
    const result = await MessageParserService.parseSharedMessage(promptText.value);

    console.log("Resultado del procesamiento:", result); // Para debugging

    if (!result || result.error) {
      error.value = result?.message || "Error al procesar el texto";
      return;
    }

    // Validar campos requeridos
    const requiredFields = ["provider", "date", "time"];
    const missingFields = requiredFields.filter((field) => !result[field]);

    if (missingFields.length > 0) {
      error.value = `Falta información: ${missingFields
        .map((f) => fieldLabels[f])
        .join(", ")}`;
      parsedResult.value = result; // Mostrar lo que se pudo extraer
      return;
    }

    parsedResult.value = result;
  } catch (err) {
    error.value = "Error al procesar el texto";
    console.error("Error en processPrompt:", err);
  } finally {
    isProcessing.value = false;
  }
};

// 3. Cuando el usuario confirma
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
      amount: parsedResult.value.amount || 0,
      activityType: "Eventual",
      paymentStatus: "Pendiente",
    };

    console.log("Datos del evento formateados:", eventData); // Debug
    emit("eventProcessed", eventData);
    closeModal();

    // Resetear estados
    parsedResult.value = null;
    showCorrection.value = false;
    promptText.value = "";
  } catch (err) {
    console.error("Error al procesar el evento:", err);
    error.value = "No se pudo crear el evento";
  }
};

const handleCorrect = async () => {
  if (!parsedResult.value) return;

  try {
    isProcessing.value = true;
    const originalText = promptText.value;
    const correctedData = { ...parsedResult.value };

    // Obtener la predicción original
    const originalPrediction = await MessageParserService.parseMessage(originalText);

    // Enviar el texto original, datos corregidos y predicción original
    await LocalNLPService.learn(originalText, correctedData, originalPrediction);

    showCorrection.value = true;
    error.value = "¡Gracias! El sistema usará esta corrección para mejorar.";
  } catch (err) {
    console.error("Error al procesar la corrección:", err);
    error.value = "No se pudo procesar la corrección";
  } finally {
    isProcessing.value = false;
  }
};

const getFieldClass = (value: any, key: string) => ({
  "text-yellow-600": !value,
  "text-green-600": value?.confidence > 0.8,
  "text-blue-600": value?.confidence > 0.5 && value?.confidence <= 0.8,
  "text-gray-600": value?.confidence <= 0.5,
});

const getDisplayValue = (value: any) => {
  if (!value) return "No detectado";
  return typeof value === "object" ? value.value : value;
};

const formatDateToISO = (dateStr: string): string => {
  // Si ya está en formato ISO, devolverlo
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Si está en formato dd/mm/yyyy, convertirlo a yyyy-MM-dd
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }

  // 2) Si cumple "yyyy/mm/dd", convertir a "yyyy-mm-dd"
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(dateStr)) {
    const [yyyy, mm, dd] = dateStr.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  // Si es una fecha válida en cualquier otro formato
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }

  return dateStr;
};

const handleDateInvalid = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.validity.badInput) {
    error.value = `El valor "${target.value}" no cumple el formato requerido: yyyy-MM-dd`;
  }
};
</script>

<style lang="postcss" scoped>
.prompt-modal :deep(.modal-content) {
  @apply shadow-xl;
  max-width: 500px;
}

.form-input {
  @apply rounded-md border-gray-300 shadow-sm
  focus:border-blue-500 focus:ring-1 focus:ring-blue-500;
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
