<template>
  <div class="min-h-screen p-2 sm:p-4">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <!-- Encabezado con ícono y título de la vista -->
        <div class="flex items-center gap-2 mb-6">
          <UserCircleIcon class="h-8 w-8 text-blue-600" />
          <h2 class="text-2xl font-bold text-gray-800">Configuración de Perfil</h2>
        </div>

        <!-- Secciones de configuración de perfil -->
        <ProfilePassword />
        <ProfileCurrency />
        <ProfileNotifications />
        <ProfileDistance />
        <!-- Acción: Cerrar Sesión -->
        <div class="mt-6">
          <button
            @click="logout"
            class="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ProfileView Component
 * Esta vista permite al usuario configurar su perfil (contraseña, moneda, notificaciones y distancia)
 * y ejecutar acciones adicionales como cerrar sesión o calcular una ruta (funcionalidad en desarrollo).
 */
defineOptions({ name: "ProfileView" });

import { useRouter } from "vue-router";
import { auth } from "../firebase/config";

// Importación de íconos de Heroicons
import { UserCircleIcon } from "../utils/icons";
import { ArrowRightOnRectangleIcon } from "../utils/icons";

// Importación de los componentes de configuración de perfil
import ProfilePassword from "../components/ProfilePassword.vue";
import ProfileCurrency from "../components/ProfileCurrency.vue";
import ProfileNotifications from "../components/ProfileNotifications.vue";
import ProfileDistance from "../components/ProfileDistance.vue";

const router = useRouter();

/**
 * Función para cerrar sesión.
 * Utiliza Firebase Auth para finalizar la sesión y redirige al usuario a la página principal.
 */
async function logout() {
  try {
    await auth.signOut();
    router.push("/");
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    // Considera utilizar un sistema de notificaciones en lugar de alert para una mejor UX
    alert("Error al cerrar sesión. Por favor, intente nuevamente.");
  }
}
</script>

<style lang="postcss">
/* Estilos personalizados para ProfileView */

/* Ejemplo de estilos para inputs (útil si se reutilizan en los componentes hijos) */
.input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500;
  text-transform: uppercase;
}

.label {
  @apply block text-sm font-medium text-gray-700;
}

/* Animación suave para el colapso de secciones (si se usa en componentes internos) */
.v-enter-active,
.v-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.v-enter-from,
.v-leave-to {
  max-height: 0;
}
</style>
