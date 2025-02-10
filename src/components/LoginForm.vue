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
    </form>

    <!-- Modalidad: Inicio de sesión con Google -->
    <div v-else class="space-y-4">
      <button
        type="button"
        @click="handleGoogleLogin"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        :disabled="loading"
      >
        <img src="../assets/google-icon.svg" alt="Google" class="w-5 h-5" />
        <span>Continuar con Google</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { EyeIcon, EyeSlashIcon } from "../utils/icons";
import { useToast } from "vue-toastification";

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const loginMethod = ref("email");
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const emailError = ref("");
const passwordError = ref("");

const handleSubmit = async () => {
  // Limpiar errores previos
  emailError.value = "";
  passwordError.value = "";

  try {
    loading.value = true;
    // Await the login call
    await authStore.login(email.value, password.value);
    toast.success("¡Bienvenido!");
    // Navigate to /calendar *after* successful login
    router.push("/calendar");
  } catch (error: any) {
    console.error("Error de inicio de sesión:", error);
    handleAuthError(error.code);
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  try {
    loading.value = true;
    // Await the Google login call
    await authStore.handleGoogleLogin();
    toast.success("¡Bienvenido!");
    // Navigate to /calendar *after* successful login
    router.push("/calendar");
  } catch (error: any) {
    console.error("Error al iniciar sesión con Google:", error);
    if (error.code === "auth/popup-closed-by-user") {
      toast.info("Inicio de sesión cancelado");
    } else if (error.code === "auth/popup-blocked") {
      toast.error(
        "El navegador bloqueó la ventana emergente. Permite ventanas emergentes."
      );
    } else {
      toast.error("Error al iniciar sesión con Google");
    }
  } finally {
    loading.value = false;
  }
};

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
// exportar componente
export default {
  name: "LoginForm",
};
</script>
