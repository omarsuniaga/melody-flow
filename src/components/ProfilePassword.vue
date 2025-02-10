<template>
  <div class="border rounded-lg overflow-hidden mb-4">
    <!-- Botón para alternar la visibilidad del panel de gestión de contraseña -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
    >
      <h3 class="text-lg font-medium text-gray-900">Gestión de Contraseña</h3>
      <ChevronDownIcon
        :class="['h-5 w-5 transition-transform', open ? 'transform rotate-180' : '']"
      />
    </button>

    <!-- Panel colapsable: muestra el formulario si el usuario utiliza email/contraseña;
         en caso de autenticación externa se muestra un mensaje informativo -->
    <div v-show="open" class="p-4">
      <template v-if="isEmailUser">
        <form @submit.prevent="updateUserPassword" class="space-y-4">
          <div>
            <label for="currentPassword" class="label">Contraseña Actual</label>
            <input
              type="password"
              id="currentPassword"
              v-model="form.currentPassword"
              class="input"
              required
            />
          </div>
          <div>
            <label for="newPassword" class="label">Nueva Contraseña</label>
            <input
              type="password"
              id="newPassword"
              v-model="form.newPassword"
              class="input"
              required
            />
          </div>
          <div>
            <label for="confirmPassword" class="label">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              v-model="form.confirmPassword"
              class="input"
              required
            />
          </div>
          <button type="submit" class="btn btn-primary">Actualizar Contraseña</button>
        </form>
      </template>
      <template v-else>
        <p class="text-gray-700">
          No se puede cambiar la contraseña porque iniciaste sesión con un proveedor
          externo (por ejemplo, Google). Para modificar la contraseña de tu cuenta de
          Google, utiliza la configuración de tu cuenta en Google.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { ChevronDownIcon } from "@heroicons/vue/24/outline";
import { auth } from "../firebase/config";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";

// Estado para controlar la visibilidad del panel
const open = ref(false);
// Modelo del formulario para cambiar la contraseña
const form = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});

// Obtiene el router para redirecciones
const router = useRouter();

/**
 * Computed: Determina si el usuario inició sesión mediante email/contraseña.
 * Los usuarios autenticados con proveedores externos (como Google) no tienen contraseña gestionada localmente.
 */
const isEmailUser = computed(() => {
  if (auth.currentUser) {
    return auth.currentUser.providerData.some(
      (provider) => provider.providerId === "password"
    );
  }
  return false;
});

/**
 * Alterna la visibilidad del panel de gestión de contraseña.
 */
function toggle() {
  open.value = !open.value;
}

/**
 * Actualiza la contraseña del usuario.
 * - Valida que la nueva contraseña y su confirmación coincidan.
 * - Reautentica al usuario con la contraseña actual.
 * - Actualiza la contraseña y, en caso de éxito, cierra la sesión para que el usuario
 *   inicie sesión nuevamente con la nueva contraseña.
 */
async function updateUserPassword() {
  if (!auth.currentUser?.email) return;

  // Validar que la nueva contraseña y la confirmación coincidan
  if (form.value.newPassword !== form.value.confirmPassword) {
    alert("Las nuevas contraseñas no coinciden");
    return;
  }

  try {
    // Crear las credenciales para reautenticación
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      form.value.currentPassword
    );
    // Reautenticar al usuario
    await reauthenticateWithCredential(auth.currentUser, credential);
    // Actualizar la contraseña
    await updatePassword(auth.currentUser, form.value.newPassword);

    // Reiniciar el formulario
    form.value = { currentPassword: "", newPassword: "", confirmPassword: "" };

    alert("Contraseña actualizada exitosamente. Por favor, inicie sesión nuevamente.");
    // Cerrar la sesión tras el cambio de contraseña
    await auth.signOut();
    // Redirigir al usuario a la página de inicio (o de login)
    router.push("/login");
  } catch (error) {
    console.error("Error al actualizar la contraseña:", error);
    alert(
      "No se pudo actualizar la contraseña. Por favor, verifique sus datos e intente nuevamente."
    );
  }
}
</script>

<script lang="ts">
// Exportar componente (opcional, para herramientas de depuración)
export default {
  name: "ProfilePassword",
};
</script>

<style scoped lang="postcss">
/* Estilos específicos para el componente ProfilePassword */
.input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500;
}

.label {
  @apply block text-sm font-medium text-gray-700;
}
</style>
