<template>
  <div class="mt-8 mb-8 text-center">
    <!-- Selector de modalidad de inicio de sesión -->
    <div class="flex justify-center gap-4 mb-4">
      <button
        type="button"
        @click="loginMethod = 'email'"
        :class="loginMethod === 'email' ? 'btn-primary' : 'btn-secondary'"
      >
        Con Correo
      </button>
      <button
        type="button"
        @click="loginMethod = 'google'"
        :class="loginMethod === 'google' ? 'btn-primary' : 'btn-secondary'"
      >
        Con Google
      </button>
    </div>

    <!-- Modalidad: Inicio de sesión por correo -->
    <form v-if="loginMethod === 'email'" @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Campo Email -->
      <div class="space-y-2">
        <div class="relative">
          <input
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Correo electrónico"
            :disabled="loading"
          />
          <span v-if="emailError" class="text-red-500 text-sm block mt-1">
            {{ emailError }}
          </span>
        </div>
      </div>

      <!-- Campo Contraseña -->
      <div class="space-y-2">
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Contraseña"
            :disabled="loading"
          />
          <!-- Botón para alternar la visibilidad de la contraseña -->
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <EyeIcon v-if="!showPassword" class="h-5 w-5" />
            <EyeSlashIcon v-else class="h-5 w-5" />
          </button>
          <span v-if="passwordError" class="text-red-500 text-sm block mt-1">
            {{ passwordError }}
          </span>
        </div>
      </div>

      <!-- Botón de inicio de sesión por correo -->
      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        :disabled="loading"
      >
        <span v-if="loading">Iniciando sesión...</span>
        <span v-else>Iniciar sesión</span>
      </button>
      <!-- Error general de login (si existiera) -->
      <p v-if="loginError" class="text-red-500 text-sm mt-2">
        {{ loginError }}
      </p>
    </form>

    <!-- Modalidad: Inicio de sesión con Google -->
    <div v-else class="space-y-4">
      <button
        type="button"
        @click="onGoogleLogin"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        :disabled="loading"
      >
        <img src="../assets/google-icon.svg" alt="Google" class="w-5 h-5" />
        <span>Continuar con Google</span>
      </button>
      <p v-if="loginError" class="text-red-500 text-sm mt-2">
        {{ loginError }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { EyeIcon } from "../utils/icons";
import { EyeSlashIcon } from "../utils/icons";
import { useToast } from "vue-toastification";

// Estado local
const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const loginMethod = ref<"email" | "google">("email");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);

// Errores específicos de email y contraseña
const emailError = ref("");
const passwordError = ref("");

// Error general de login
const loginError = ref<string | null>(null);

// Función para iniciar sesión con correo y contraseña
const handleSubmit = async () => {
  emailError.value = "";
  passwordError.value = "";
  loginError.value = null;

  try {
    loading.value = true;
    await authStore.login(email.value, password.value);
    toast.success("¡Bienvenido!");
    router.push("/calendar");
  } catch (error: any) {
    console.error("Error de inicio de sesión:", error);
    handleAuthError(error.code);
  } finally {
    loading.value = false;
  }
};

// Función para manejar el inicio de sesión con Google
async function onGoogleLogin() {
  loginError.value = null;
  try {
    const result = await authStore.handleGoogleLogin();
    // Se asume que el store devuelve un objeto con { success, user?, reason?, error? }
    if (result.success) {
      toast.success("¡Bienvenido con Google!");
      router.push("/calendar");
    } else {
      // Manejo de errores específicos
      if (result.reason === "popup-closed-by-user") {
        toast.warning("El usuario cerró el popup de Google");
      } else if (result.error) {
        loginError.value = result.error.message || "Error desconocido en Google Login";
      }
    }
  } catch (error: any) {
    loginError.value = error.message;
    console.error("Unexpected error en Google login:", error);
  } finally {
    loading.value = false;
  }
}

// Función para traducir los códigos de error de Firebase
const handleAuthError = (errorCode: string) => {
  switch (errorCode) {
    case "auth/invalid-email":
      emailError.value = "Correo electrónico inválido";
      break;
    case "auth/user-not-found":
      emailError.value = "No existe una cuenta con este correo";
      break;
    case "auth/wrong-password":
      passwordError.value = "Contraseña incorrecta";
      break;
    case "auth/too-many-requests":
      toast.error("Demasiados intentos. Intente más tarde");
      break;
    default:
      toast.error("Error al iniciar sesión");
  }
};
</script>

<script lang="ts">
export default {
  name: "LoginForm",
};
</script>

<style scoped>
/* Estilos específicos para el componente de login */
</style>
