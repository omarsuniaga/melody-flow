<template>
  <!-- ...existing template code... -->
  <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
  <!-- ...existing template code... -->
</template>

<script>
export default {
  data() {
    return {
      errorMessage: "",
    };
  },
  methods: {
    async handleLogin() {
      try {
        // ...existing código de login...
      } catch (error) {
        if (error.code === "auth/wrong-password") {
          this.errorMessage = "La contraseña ingresada es incorrecta.";
        } else {
          this.errorMessage = "Error al iniciar sesión: " + error.message;
        }
        console.error(error);
      }
    },
    // ...existing methods...
  },
};
</script>
