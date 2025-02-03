<template>
  <div class="mt-8 mb-8 text-center">
    <!-- Separador visual para iniciar sesión -->
    <div class="relative my-4">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-gray-300"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-gray-500">Iniciar sesión</span>
      </div>
    </div>
    <form class="space-y-4" @submit.prevent="handleLogin">
      <div class="space-y-4">
        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <AtSymbolIcon class="h-5 w-5 inline-block mr-1 text-gray-500" />
            Correo electrónico
          </label>
          <div class="relative">
            <input
              v-model="email"
              type="email"
              required
              class="input pl-10"
              placeholder="tu@email.com"
            />
            <span v-if="emailError" class="text-red-500 text-sm">
              {{ emailError }}
            </span>
          </div>
        </div>
        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <LockClosedIcon class="h-5 w-5 inline-block mr-1 text-gray-500" />
            Contraseña
          </label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              class="input pl-10"
              placeholder="••••••••"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <EyeIcon v-if="!showPassword" class="h-5 w-5" />
              <EyeSlashIcon v-else class="h-5 w-5" />
            </button>
            <span v-if="passwordError" class="text-red-500 text-sm">
              {{ passwordError }}
            </span>
          </div>
        </div>
      </div>
      <button
        type="submit"
        class="btn btn-primary w-full flex items-center justify-center gap-2"
        :disabled="loading"
      >
        <ArrowRightOnRectangleIcon class="h-5 w-5" />
        <span v-if="loading">Cargando...</span>
        <span v-else>Iniciar sesión</span>
      </button>
      <!-- Separador para login alternativo -->
      <div class="relative my-4">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-gray-500">O continuar con</span>
        </div>
      </div>
      <button
        type="button"
        @click="handleGoogleLogin"
        class="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <GoogleIcon class="w-5 h-5" />
        Continuar con Google
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { auth } from "@/firebase/config";

import AtSymbolIcon from "@heroicons/vue/24/outline/AtSymbolIcon";
import LockClosedIcon from "@heroicons/vue/24/outline/LockClosedIcon";
import EyeIcon from "@heroicons/vue/24/outline/EyeIcon";
import EyeSlashIcon from "@heroicons/vue/24/outline/EyeSlashIcon";
import ArrowRightOnRectangleIcon from "@heroicons/vue/24/outline/ArrowRightOnRectangleIcon";
import GoogleIcon from "@/components/icons/GoogleIcon.vue";

const router = useRouter();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const emailError = ref("");
const passwordError = ref("");

const validateForm = () => {
  let valid = true;
  emailError.value = "";
  passwordError.value = "";

  if (!email.value) {
    emailError.value = "El correo electrónico es obligatorio.";
    valid = false;
  }

  if (!password.value) {
    passwordError.value = "La contraseña es obligatoria.";
    valid = false;
  }
  return valid;
};

const handleLogin = async () => {
  if (!validateForm()) return;
  loading.value = true;

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push("/");
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    let errorMessage = "Error al iniciar sesión";
    if ((error as { code: string }).code === "auth/wrong-password") {
      errorMessage = "Contraseña incorrecta. Por favor, intenta de nuevo.";
    } else if ((error as { code: string }).code === "auth/user-not-found") {
      errorMessage = "Usuario no encontrado. Por favor, verifica tu correo.";
    }
    alert(errorMessage);
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = async () => {
  try {
    loading.value = true;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      const result = await signInWithPopup(auth, provider);
      if (result?.user) {
        router.push("/calendar");
      }
    } catch (popupError: any) {
      console.log("Error con popup:", popupError);
      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/popup-closed-by-user" ||
        popupError.code === "auth/cancelled-popup-request"
      ) {
        console.log("Cambiando a método redirect...");
        await signInWithRedirect(auth, provider);
        return;
      }
      throw popupError;
    }
  } catch (error: any) {
    console.error("Error en login con Google:", error);
    if (error.code === "auth/popup-closed-by-user") {
      return;
    }
    alert("Error al iniciar sesión con Google. Por favor, intente nuevamente.");
  } finally {
    loading.value = false;
  }
};

// Opcional: manejar el resultado del redirect de Google
// onMounted(async () => { ... });
</script>
<script lang="ts">
// exportar componente
export default {
  name: "LoginForm",
};
</script>
