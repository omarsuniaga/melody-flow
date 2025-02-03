import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    updatePassword as firebaseUpdatePassword,
    sendPasswordResetEmail,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    browserLocalPersistence, // O la constante que prefieras
  } from 'firebase/auth';
  import { auth } from '../firebase/config';
  
  /**
   * Servicio de autenticación que encapsula las operaciones relacionadas con Firebase Auth.
   */
  export function useAuthService() {
    
    /**
     * Inicia sesión con email y contraseña.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<User>}
     */
    async function login(email, password) {
      try {
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        return user;
      } catch (error) {
        console.error('Error en login:', error);
        throw error;
      }
    }
  
    /**
     * Registra un nuevo usuario y actualiza su perfil con un displayName.
     * @param {string} email
     * @param {string} password
     * @param {string} displayName
     * @returns {Promise<User>}
     */
    async function register(email, password, displayName) {
      try {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName });
        return user;
      } catch (error) {
        console.error('Error en registro:', error);
        throw error;
      }
    }
  
    /**
     * Cierra la sesión del usuario actual.
     */
    async function logout() {
      try {
        await signOut(auth);
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        throw error;
      }
    }
  
    /**
     * Actualiza la contraseña del usuario actual, previa reautenticación.
     * @param {string} currentPassword - Contraseña actual para reautenticación.
     * @param {string} newPassword - Nueva contraseña.
     */
    async function updatePassword(currentPassword, newPassword) {
      const user = auth.currentUser;
      if (!user?.email)
        throw new Error('No authenticated user');
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
        await firebaseUpdatePassword(user, newPassword);
      } catch (error) {
        console.error('Error al actualizar la contraseña:', error);
        throw error;
      }
    }
  
    /**
     * Envía un correo para restablecer la contraseña.
     * @param {string} email
     */
    async function resetPassword(email) {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (error) {
        console.error('Error al enviar el email de restablecimiento:', error);
        throw error;
      }
    }
  
    /**
     * Permite suscribirse a cambios en el estado de autenticación.
     * @param {function} callback
     * @returns {function} Función para cancelar la suscripción.
     */
    function onAuthStateChanged(callback) {
      return firebaseOnAuthStateChanged(auth, callback);
    }
  
    /**
     * Configura la persistencia de la sesión.
     * @param {string|Persistence} type - Por defecto usa browserLocalPersistence.
     */
    function setPersistence(type = browserLocalPersistence) {
      return auth.setPersistence(type);
    }
  
    /**
     * Valida la contraseña según ciertos criterios.
     * @param {string} password
     * @returns {object} { isValid: boolean, errors: string[], strength: { score: number, label: string } }
     */
    function validatePassword(password) {
      const minLength = 8;
      const hasUpperCase = /[A-Z]/;
      const hasLowerCase = /[a-z]/;
      const hasNumbers = /\d/;
      const hasSpecialChar = /[!@#$%^&*]/;
      
      const errors = [];
      if (password.length < minLength) errors.push('La contraseña debe tener al menos 8 caracteres');
      if (!hasUpperCase.test(password)) errors.push('Debe incluir al menos una mayúscula');
      if (!hasLowerCase.test(password)) errors.push('Debe incluir al menos una minúscula');
      if (!hasNumbers.test(password)) errors.push('Debe incluir al menos un número');
      if (!hasSpecialChar.test(password)) errors.push('Debe incluir al menos un carácter especial');
      
      return {
        isValid: errors.length === 0,
        errors,
        strength: calculatePasswordStrength(password)
      };
    }
  
    /**
     * Calcula la fortaleza de la contraseña.
     * @param {string} password
     * @returns {object} { score: number, label: string }
     */
    function calculatePasswordStrength(password) {
      let strength = 0;
      if (password.length >= 8) strength++;
      if (password.length >= 12) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;
      
      return {
        score: strength,
        label: ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'][Math.min(strength - 1, 4)]
      };
    }
  
    /**
     * Valida el formato de un email.
     * @param {string} email
     * @returns {boolean}
     */
    function validateEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    return {
      login,
      register,
      logout,
      updatePassword,
      resetPassword,
      onAuthStateChanged,
      setPersistence,
      validatePassword,
      validateEmail
    };
  }
  