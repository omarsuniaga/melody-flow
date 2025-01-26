<template>
  <div class="min-h-screen p-2 sm:p-4 bg-gray-50">
    <div class="max-w-md mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <div class="text-center">
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            <UserIcon class="h-8 w-8 mx-auto mb-2 text-blue-600" />
            Iniciar sesión
          </h2>
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
              </div>
            </div>
          </div>

          <button
            type="submit"
            class="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowRightOnRectangleIcon class="h-5 w-5" />
            Iniciar sesión
          </button>

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
            <img src="https://www.google.com/favicon.ico" alt="Google" class="w-5 h-5" />
            Continuar con Google
          </button>
        </form>

        <div class="mt-6 text-center text-sm">
          <router-link
            to="/register"
            class="text-blue-600 hover:text-blue-500 flex items-center justify-center gap-1"
          >
            <UserPlusIcon class="h-5 w-5" />
            Crear una cuenta
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/firebase/config"; // Asegúrate de usar @/ para la ruta
import UserIcon from "@heroicons/vue/24/outline/UserIcon";
import AtSymbolIcon from "@heroicons/vue/24/outline/AtSymbolIcon";
import LockClosedIcon from "@heroicons/vue/24/outline/LockClosedIcon";
import EyeIcon from "@heroicons/vue/24/outline/EyeIcon";
import EyeSlashIcon from "@heroicons/vue/24/outline/EyeSlashIcon";
import ArrowRightOnRectangleIcon from "@heroicons/vue/24/outline/ArrowRightOnRectangleIcon";
import UserPlusIcon from "@heroicons/vue/24/outline/UserPlusIcon";

const router = useRouter();
const email = ref("");
const password = ref("");
const showPassword = ref(false);
const googleProvider = new GoogleAuthProvider();

const handleLogin = async () => {
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

    // Aquí puedes mostrar el error al usuario usando tu sistema de notificaciones
    alert(errorMessage);
  }
};

const isFirebaseError = (error: unknown): boolean => {
  return typeof error === "object" && error !== null && "code" in error;
};

const handleGoogleLogin = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    router.push("/");
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    let errorMessage = "Error al iniciar sesión con Google";

    if ((error as { code: string }).code === "auth/operation-not-allowed") {
      errorMessage =
        "La autenticación con Google no está habilitada. Por favor, contacta al administrador.";
    } else if ((error as { code: string }).code === "auth/popup-blocked") {
      errorMessage =
        "El popup fue bloqueado por el navegador. Por favor, permite ventanas emergentes.";
    } else if ((error as { code: string }).code === "auth/unauthorized-domain") {
      errorMessage =
        "El dominio no está autorizado para operaciones de OAuth. Agrega tu dominio en la consola de Firebase.";
    }

    // Aquí puedes mostrar el error al usuario usando tu sistema de notificaciones
    alert(errorMessage);
  }
};
</script>

<style scoped>
.input {
  appearance: none;
  position: relative;
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  color: #1f2937;
  border-radius: 0.375rem;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  font-size: 0.875rem;
}

.input::placeholder {
  color: #6b7280;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  transition: background-color 0.2s;
}

.btn-primary {
  color: #fff;
  background-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.btn-primary:hover {
  background-color: #1d4ed8;
}
</style>
