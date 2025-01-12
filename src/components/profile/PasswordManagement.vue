<template>
  <div class="password-management">
    <h3>Cambiar Contraseña</h3>
    <form @submit.prevent="updatePassword">
      <!-- ...existing code... -->
    </form>
  </div>
</template>

<script>
export default {
  name: 'PasswordManagement',
  data() {
    return {
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
  },
  methods: {
    // ...existing code...
  }
}
</script>
