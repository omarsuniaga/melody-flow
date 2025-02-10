<template>
  <!-- Vista de inicio de sesión:
       Muestra la sección de bienvenida y el formulario de login dentro de un contenedor centrado -->
  <div class="min-h-screen p-2 sm:p-4 bg-gray-50">
    <div class="max-w-lg w-full mx-auto">
      <div class="bg-white rounded-lg shadow p-3 sm:p-6">
        <!-- Sección de bienvenida o descripción -->
        <HeroSection />
        <!-- Formulario de inicio de sesión -->
        <LoginForm />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Componente LoginView
 * Esta vista se encarga de renderizar la sección de héroe y el formulario de login.
 * Se utiliza defineOptions para asignar un nombre al componente, lo que facilita la depuración.
 */
defineOptions({ name: "LoginView" });

import HeroSection from "../components/HeroSection.vue";
import LoginForm from "../components/LoginForm.vue";
</script>

<style scoped>
/* 
  Estilos personalizados para LoginView.
  Se incluyen estilos para campos de entrada (inputs) y botones.
  Nota: Si estos estilos se utilizan en varios componentes, considera extraerlos a un archivo CSS global o a un módulo compartido.
*/

/* Estilos para campos de entrada */
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

/* Estilos base para botones */
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

/* Botón primario */
.btn-primary {
  color: #fff;
  background-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.btn-primary:hover {
  background-color: #1d4ed8;
}

/* Botón secundario */
.btn-secondary {
  color: #fff;
  background-color: #6b7280;
  box-shadow: 0 0 0 2px rgba(107, 114, 128, 0.5);
}

.btn-secondary:hover {
  background-color: #4b5563;
}
</style>
