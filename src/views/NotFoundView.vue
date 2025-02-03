<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">404</h1>
      <!-- agregar logo de la app -->
      <img :src="icon192" alt="Icono 192x192" class="w-20 mx-auto mb-8" />
      <p class="text-lg text-gray-600 mb-8">Página no encontrada</p>
      <router-link to="/" class="btn btn-primary flex items-center justify-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8V6a1 1 0 112 0v4h3a1 1 0 110 2h-3v4a1 1 0 11-2 0v-4H6a1 1 0 110-2h3z"
            clip-rule="evenodd"
          />
        </svg>
        Volver a la página de inicio
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// Cambiar la ruta de importación del icono
import icon192 from "@/assets/icons/icon-192x192.png";
</script>

<style scoped>
.btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.375rem;
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  transition: background-color 0.2s, transform 0.2s;
}

.btn-primary {
  color: #fff;
  background-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.btn-primary:hover {
  background-color: #1d4ed8;
  transform: translateY(-2px);
}
</style>
