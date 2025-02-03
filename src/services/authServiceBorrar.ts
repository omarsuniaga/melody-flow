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
  browserLocalPersistence,
  type User
} from 'firebase/auth'
import { auth } from '../firebase/config'

/**
 * Servicio de autenticación que encapsula las operaciones relacionadas con Firebase Auth.
 */
export function useAuthService() {
  /**
   * Inicia sesión con email y contraseña.
   * @param {string} email - El correo electrónico del usuario.
   * @param {string} password - La contraseña del usuario.
   * @returns {Promise<User>} - Promesa que resuelve con el usuario autenticado.
   */
  async function login(email: string, password: string): Promise<User> {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      return user
    } catch (error) {
      console.error('Error en login:', error)
      throw error
    }
  }

  /**
   * Registra un nuevo usuario y actualiza su perfil con un displayName.
   * @param {string} email - Correo electrónico del usuario.
   * @param {string} password - Contraseña del usuario.
   * @param {string} displayName - Nombre para mostrar en el perfil.
   * @returns {Promise<User>} - Promesa que resuelve con el usuario registrado.
   */
  async function register(email: string, password: string, displayName: string): Promise<User> {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(user, { displayName })
      return user
    } catch (error) {
      console.error('Error en registro:', error)
      throw error
    }
  }

  /**
   * Cierra la sesión del usuario actual.
   * @returns {Promise<void>}
   */
  async function logout(): Promise<void> {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
      throw error
    }
  }

  /**
   * Actualiza la contraseña del usuario actual, previa reautenticación.
   * @param {string} currentPassword - Contraseña actual para reautenticación.
   * @param {string} newPassword - Nueva contraseña.
   * @returns {Promise<void>}
   */
  async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser
    if (!user?.email) {
      throw new Error('No authenticated user')
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    try {
      await reauthenticateWithCredential(user, credential)
      await firebaseUpdatePassword(user, newPassword)
    } catch (error) {
      console.error('Error al actualizar la contraseña:', error)
      throw error
    }
  }

  /**
   * Envía un correo de restablecimiento de contraseña.
   * @param {string} email - Correo electrónico del usuario.
   * @returns {Promise<void>}
   */
  async function resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Error al enviar email de restablecimiento:', error)
      throw error
    }
  }

  /**
   * Permite suscribirse a los cambios en el estado de autenticación.
   * @param {(user: User | null) => void} callback - Función a ejecutar cuando cambia el estado.
   * @returns {() => void} Función para cancelar la suscripción.
   */
  function onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback)
  }

  /**
   * Configura la persistencia de la sesión. Por defecto usa `browserLocalPersistence`.
   * @param persistence - La persistencia a utilizar.
   * @returns {Promise<void>}
   */
  function setPersistence(persistence = browserLocalPersistence): Promise<void> {
    return auth.setPersistence(persistence)
  }

  /**
   * Valida la contraseña según ciertos criterios.
   * @param {string} password - La contraseña a validar.
   * @returns {{ isValid: boolean; errors: string[] }} - Objeto con el resultado de la validación.
   */
  function validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Valida el formato de un correo electrónico.
   * @param {string} email - El email a validar.
   * @returns {boolean} - True si el formato es válido, false en caso contrario.
   */
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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
  }
}
