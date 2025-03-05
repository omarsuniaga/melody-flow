<template>
  <div class="border rounded-lg overflow-hidden mb-4 shadow">
    <!-- Encabezado del panel colapsable -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex justify-between items-center bg-blue-50 hover:bg-blue-100 transition-colors"
    >
      <h3 class="text-lg font-medium text-gray-800">Gestión de Datos Bancarios</h3>
      <ChevronDownIcon
        :class="['h-5 w-5 transition-transform', open ? 'transform rotate-180' : '']"
      />
    </button>

    <!-- Contenido del panel -->
    <div v-if="open" class="p-4">
      <!-- Listado de cuentas bancarias -->
      <div v-if="userStore.bankData && userStore.bankData.length">
        <div
          v-for="bank in userStore.bankData"
          :key="bank.id"
          class="p-4 border rounded-lg mb-3 flex flex-col md:flex-row md:items-center justify-between bg-white hover:shadow-md transition-shadow"
          :class="{ 'border-green-500': bank.active, 'border-gray-300': !bank.active }"
        >
          <div class="mb-3 md:mb-0">
            <p class="font-semibold text-gray-800">{{ bank.bankName }}</p>
            <p class="text-sm text-gray-600">Cuenta: {{ bank.accountNumber }}</p>
            <p class="text-sm text-gray-600">Documento: {{ bank.idNumber }}</p>
            <p class="text-sm text-gray-600">Nombre: {{ bank.fullName }}</p>
            <p class="text-sm text-gray-600">Correo: {{ bank.email }}</p>
            <p class="text-sm text-gray-600">Teléfono: {{ bank.phone }}</p>
          </div>
          <div class="flex items-center gap-3">
            <!-- Botón para activar/desactivar -->
            <button
              @click="handleToggleActive(bank)"
              class="btn-icon"
              :class="
                bank.active ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              "
              :title="bank.active ? 'Desactivar cuenta' : 'Activar cuenta'"
            >
              <template v-if="bank.active">
                <XMarkIcon class="h-5 w-5" />
              </template>
              <template v-else>
                <CheckIcon class="h-5 w-5" />
              </template>
            </button>
            <!-- Botones para editar y eliminar -->
            <button @click="editBank(bank)" class="btn-icon" title="Editar">
              <PencilIcon class="h-5 w-5 text-gray-600" />
            </button>
            <button @click="handleDeleteBank(bank.id)" class="btn-icon" title="Eliminar">
              <TrashIcon class="h-5 w-5 text-red-600" />
            </button>
          </div>
        </div>
        <!-- Botón para agregar nueva cuenta bancaria -->
        <button
          @click="openForm"
          class="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Agregar Cuenta Bancaria
        </button>
      </div>
      <!-- Mensaje si no hay cuentas registradas -->
      <div v-else class="flex flex-col items-center py-8">
        <p class="text-gray-600 mb-4">No se han registrado datos bancarios.</p>
        <button
          @click="openForm"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          Crear Datos Bancarios
        </button>
      </div>
      <!-- Formulario para crear/editar datos bancarios -->
      <transition name="collapse">
        <div v-if="showForm" class="mt-6 p-4 border rounded-lg bg-blue-50">
          <h4 class="text-lg font-medium mb-4">
            {{ isEditing ? "Editar Datos Bancarios" : "Nuevo Registro Bancario" }}
          </h4>
          <form @submit.prevent="handleSaveBankData" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="label">Nombre de Banco</label>
                <input v-model="form.bankName" type="text" class="input" />
                <p v-if="errors.bankName" class="text-xs text-red-500 mt-1">
                  {{ errors.bankName }}
                </p>
              </div>
              <div>
                <label class="label">N° Cuenta</label>
                <input v-model="form.accountNumber" type="text" class="input" />
                <p v-if="errors.accountNumber" class="text-xs text-red-500 mt-1">
                  {{ errors.accountNumber }}
                </p>
              </div>
              <div>
                <label class="label">N° Cédula / Pasaporte</label>
                <input v-model="form.idNumber" type="text" class="input" />
                <p v-if="errors.idNumber" class="text-xs text-red-500 mt-1">
                  {{ errors.idNumber }}
                </p>
              </div>
              <div>
                <label class="label">Nombre Completo</label>
                <input v-model="form.fullName" type="text" class="input" />
                <p v-if="errors.fullName" class="text-xs text-red-500 mt-1">
                  {{ errors.fullName }}
                </p>
              </div>
              <div>
                <label class="label">Correo</label>
                <input v-model="form.email" type="email" class="input" />
                <p v-if="errors.email" class="text-xs text-red-500 mt-1">
                  {{ errors.email }}
                </p>
              </div>
              <div>
                <label class="label">N° Teléfono</label>
                <input v-model="form.phone" type="text" class="input" />
                <p v-if="errors.phone" class="text-xs text-red-500 mt-1">
                  {{ errors.phone }}
                </p>
              </div>
            </div>
            <!-- Botones de acción del formulario -->
            <div class="flex justify-end gap-4">
              <button
                type="button"
                @click="cancelForm"
                class="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </transition>
    </div>
  </div>

  <!-- Agregar mensaje de error global -->
  <div v-if="globalError" class="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
    {{ globalError }}
  </div>

  <!-- Agregar indicador de carga -->
  <div
    v-if="isLoading"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
  >
    <div class="bg-white p-4 rounded-lg">Procesando...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  ChevronDownIcon,
  CheckIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "../utils/icons";
import { useUserStore, type BankData } from "../stores/userStore";
import { useAuthStore } from "../stores/authStore";
import userService from "../services/userService";

const userStore = useUserStore();
const authStore = useAuthStore();

// Estados locales
const open = ref(false);
const showForm = ref(false);
const isEditing = ref(false);
const editingId = ref<string | null>(null);

// Objeto reactivo para el formulario
const form = reactive({
  bankName: "",
  accountNumber: "",
  idNumber: "",
  fullName: "",
  email: "",
  phone: "",
});

// Objeto para errores de validación
const errors = reactive({
  bankName: "",
  accountNumber: "",
  idNumber: "",
  fullName: "",
  email: "",
  phone: "",
});

// Agregar estado para manejar errores globales
const globalError = ref("");
const isLoading = ref(false);

// Función para alternar el panel colapsable
const toggle = () => {
  open.value = !open.value;
};

// Función para abrir el formulario
const openForm = () => {
  showForm.value = true;
};

// Función para validar el formulario
const validateForm = (): boolean => {
  let valid = true;
  errors.bankName = "";
  errors.accountNumber = "";
  errors.idNumber = "";
  errors.fullName = "";
  errors.email = "";
  errors.phone = "";

  if (!form.bankName.trim()) {
    errors.bankName = "El nombre de banco es requerido";
    valid = false;
  }
  if (!form.accountNumber.trim()) {
    errors.accountNumber = "El número de cuenta es requerido";
    valid = false;
  }
  if (!form.idNumber.trim()) {
    errors.idNumber = "El número de cédula/pasaporte es requerido";
    valid = false;
  }
  if (!form.fullName.trim()) {
    errors.fullName = "El nombre completo es requerido";
    valid = false;
  }
  if (!form.email.trim()) {
    errors.email = "El correo es requerido";
    valid = false;
  }
  if (!form.phone.trim()) {
    errors.phone = "El teléfono es requerido";
    valid = false;
  }
  return valid;
};

// Función para cargar los datos bancarios del usuario
const fetchBankData = async () => {
  try {
    if (authStore.isAuthenticated) {
      userStore.setUserAuthData(authStore.user);
      await userStore.fetchUserBankData();
    }
  } catch (error) {
    console.error("Error al obtener los datos bancarios:", error);
  }
};

// Función para guardar (crear o actualizar) los datos bancarios
const handleSaveBankData = async () => {
  if (!validateForm()) return;

  isLoading.value = true;
  globalError.value = "";

  try {
    if (!authStore.user?.uid) {
      throw new Error("Usuario no autenticado");
    }

    const newRecord = {
      id: isEditing.value && editingId.value ? editingId.value : crypto.randomUUID(),
      uid: authStore.user.uid,
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      idNumber: form.idNumber.trim(),
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      active: userStore.bankData.filter((b) => b.active).length === 0,
    };

    // Solución alternativa si saveBankRecord no está disponible
    if (typeof userStore.saveBankRecord !== 'function') {
      // Implementación directa
      const index = userStore.bankData.findIndex(b => b.id === newRecord.id);
      if (index >= 0) {
        userStore.bankData[index] = newRecord as BankData;
      } else {
        userStore.bankData.push(newRecord as BankData);
      }
      await userService.updateUserBankData(authStore.user.uid, {
        bankData: userStore.bankData
      });
    } else {
      await userStore.saveBankRecord(newRecord);
    }

    await userStore.fetchUserBankData(); // Recargar datos
    cancelForm();
  } catch (error) {
    globalError.value = (error as Error).message;
    console.error("Error guardando datos bancarios:", error);
  } finally {
    isLoading.value = false;
  }
};

// Función para resetear el formulario
const resetForm = () => {
  form.bankName = "";
  form.accountNumber = "";
  form.idNumber = "";
  form.fullName = "";
  form.email = "";
  form.phone = "";
  isEditing.value = false;
  editingId.value = null;
  showForm.value = false;
};

// Función para cancelar el formulario
const cancelForm = () => {
  resetForm();
};

// Función para iniciar la edición de un registro
const editBank = (bank: any) => {
  form.bankName = bank.bankName;
  form.accountNumber = bank.accountNumber;
  form.idNumber = bank.idNumber;
  form.fullName = bank.fullName;
  form.email = bank.email;
  form.phone = bank.phone;
  isEditing.value = true;
  editingId.value = bank.id;
  showForm.value = true;
};

// Función para eliminar un registro bancario
const handleDeleteBank = async (bankId: string) => {
  if (!confirm("¿Está seguro de eliminar esta cuenta bancaria?")) return;

  isLoading.value = true;
  globalError.value = "";

  try {
    await userStore.deleteBankRecord(bankId);
  } catch (error) {
    globalError.value = (error as Error).message;
    console.error("Error eliminando datos bancarios:", error);
  } finally {
    isLoading.value = false;
  }
};

// Función para activar o desactivar una cuenta bancaria
const handleToggleActive = async (bank: BankData) => {
  isLoading.value = true;
  globalError.value = "";

  try {
    await userStore.toggleBankActive(bank.id);
    await userStore.fetchUserBankData(); // Recargar datos
  } catch (error) {
    globalError.value = (error as Error).message;
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  if (!authStore.initialized) {
    await authStore.initializeAuth();
  }
  if (authStore.isAuthenticated) {
    userStore.setUserAuthData(authStore.user);
    await fetchBankData();
  }
});
</script>

<style scoped lang="postcss">
.input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500;
}
.label {
  @apply block text-sm font-medium text-gray-700;
}
.btn-icon {
  @apply p-2 rounded-full hover:bg-gray-200 transition-colors;
}
/* Transición para el formulario */
.collapse-enter-active,
.collapse-leave-active {
  transition: max-height 0.3s ease;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
}
</style>
