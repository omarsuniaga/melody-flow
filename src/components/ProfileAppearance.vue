<template>
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
    <!-- Botón para alternar la visibilidad del panel -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex justify-between items-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">Apariencia</h3>
      <ChevronDownIcon
        :class="['h-5 w-5 transition-transform text-gray-500 dark:text-gray-400', open ? 'transform rotate-180' : '']"
      />
    </button>

    <!-- Contenido del panel -->
    <div v-if="open" class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <SunIcon v-if="isDark" class="h-6 w-6 text-yellow-500" />
          <MoonIcon v-else class="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <div>
            <p class="font-medium text-gray-900 dark:text-gray-100">
              {{ isDark ? 'Modo Oscuro' : 'Modo Claro' }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Cambia el tema visual de la aplicación
            </p>
          </div>
        </div>
        <button
          @click="toggleTheme"
          type="button"
          role="switch"
          :aria-checked="isDark"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          :class="isDark ? 'bg-blue-600' : 'bg-gray-300'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            :class="isDark ? 'translate-x-6' : 'translate-x-1'"
          />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ChevronDownIcon } from "../utils/icons";
import { SunIcon, MoonIcon } from "@heroicons/vue/24/outline";
import { useTheme } from "../composables/useTheme";

const open = ref(false);
function toggle() {
  open.value = !open.value;
}

const { isDark, toggleTheme } = useTheme();
</script>

<script lang="ts">
export default {
  name: "ProfileAppearance",
};
</script>
