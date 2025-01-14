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
                <EnvelopeIcon
                  class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
                <KeyIcon
                  class="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  UserIcon,
  AtSymbolIcon,
  EnvelopeIcon,
  LockClosedIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from "@heroicons/vue/24/outline";

const router = useRouter();
const email = ref("");
const password = ref("");
const showPassword = ref(false);

const handleLogin = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push("/");
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
  }
};
</script>

<style scoped>
.input {
  @apply appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm;
}

.btn {
  @apply py-2 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors;
}

.btn-primary {
  @apply text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}
</style>
