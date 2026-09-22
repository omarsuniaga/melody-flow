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
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence as firebaseSetPersistence,
  type User,
  type Persistence,
  type NextOrObserver
} from 'firebase/auth';
import { auth } from '../firebase/config';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: {
    score: number;
    label: string;
  };
}

export interface PasswordStrength {
  score: number;
  label: string;
}

export interface GoogleLoginResult {
  success: boolean;
  user?: User;
  reason?: string;
}

/**
 * Servicio de autenticación que encapsula las operaciones relacionadas con Firebase Auth.
 */
export function useAuthService() {
  
  /**
   * Inicia sesión con email y contraseña.
   */
  async function login(email: string, password: string): Promise<User> {
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
   */
  async function register(email: string, password: string, displayName: string): Promise<User> {
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
  async function logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * Actualiza la contraseña del usuario actual, previa reautenticación.
   */
  async function updatePassword(currentPassword: string, newPassword: string): Promise<void> {
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
   */
  async function resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error al enviar el email de restablecimiento:', error);
      throw error;
    }
  }

  /**
   * Permite suscribirse a cambios en el estado de autenticación.
   */
  function onAuthStateChanged(callback: NextOrObserver<User>) {
    return firebaseOnAuthStateChanged(auth, callback);
  }

  /**
   * Configura la persistencia de la sesión.
   */
  function setPersistence(type: Persistence = browserLocalPersistence) {
    if (typeof (auth as any).setPersistence === 'function') {
      return (auth as any).setPersistence(type);
    }
    return firebaseSetPersistence(auth, type);
  }

  /**
   * Valida la contraseña según ciertos criterios.
   */
  function validatePassword(password: string): PasswordValidationResult {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasNumbers = /\d/;
    const hasSpecialChar = /[!@#$%^&*]/;
    
    const errors: string[] = [];
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
   */
  function calculatePasswordStrength(password: string): PasswordStrength {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return {
      score: strength,
      label: ['Muy débil', 'Débil', 'Media', 'Fuerte', 'Muy fuerte'][Math.min(Math.max(strength - 1, 0), 4)]
    };
  }

  /**
   * Valida el formato de un email.
   */
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Maneja el inicio de sesión con Google.
   */
  const handleGoogleLogin = async (): Promise<GoogleLoginResult> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account',
        auth_type: 'rerequest'
      });
      const result = await signInWithPopup(auth, provider);
      return { success: true, user: result.user };
    } catch (error: any) {
      console.error('Error en login con Google (popup):', error);
      if (error?.code === "auth/popup-closed-by-user") {
        return { success: false, reason: "popup-closed-by-user" };
      }
      throw error;
    }
  };

  return {
    login,
    register,
    logout,
    updatePassword,
    resetPassword,
    onAuthStateChanged,
    setPersistence,
    validatePassword,
    validateEmail,
    handleGoogleLogin
  };
}
