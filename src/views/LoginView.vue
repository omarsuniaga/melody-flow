<template>
  <div class="min-h-screen p-2 sm:p-4 bg-gray-50">
    <div class="max-w-lg mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <HeroSection />
        <LoginForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HeroSection from "../components/HeroSection.vue";
import LoginForm from "../components/LoginForm.vue";
</script>

<style scoped>
/* Estilos para inputs */
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

/* Estilos para botones */
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

.btn-secondary {
  color: #fff;
  background-color: #6b7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.5);
}

.btn-secondary:hover {
  background-color: #4b5563;
}
</style>
