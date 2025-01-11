import { ref } from 'vue'

const translations = {
  es: {
    login: {
      title: 'Iniciar sesión',
      email: 'Correo electrónico',
      emailPlaceholder: 'tu@email.com',
      password: 'Contraseña',
      passwordPlaceholder: '********',
      rememberMe: 'Recordarme',
      forgotPassword: '¿Olvidaste tu contraseña?',
      signIn: 'Iniciar sesión',
      signingIn: 'Iniciando sesión...',
      orContinueWith: 'O continuar con',
      noAccount: '¿No tienes una cuenta?',
      register: 'Regístrate',
      errors: {
        invalidEmail: 'Correo electrónico inválido',
        userNotFound: 'Usuario no encontrado',
        wrongPassword: 'Contraseña incorrecta',
        generic: 'Error al iniciar sesión',
        emailRequired: 'Ingresa tu correo electrónico',
        passwordResetFailed: 'Error al restablecer la contraseña'
      },
      passwordResetSent: 'Se ha enviado un enlace para restablecer tu contraseña'
    },
    register: {
      title: 'Crear cuenta',
      fullName: 'Nombre completo',
      fullNamePlaceholder: 'Juan Pérez',
      email: 'Correo electrónico',
      emailPlaceholder: 'tu@email.com',
      password: 'Contraseña',
      passwordPlaceholder: '********',
      confirmPassword: 'Confirmar contraseña',
      confirmPasswordPlaceholder: '********',
      acceptTerms: 'Acepto los términos y condiciones',
      termsLink: 'Ver términos',
      acceptPrivacy: 'Acepto la política de privacidad',
      privacyLink: 'Ver política',
      acceptMarketing: 'Deseo recibir comunicaciones de marketing',
      create: 'Crear cuenta',
      creating: 'Creando cuenta...',
      haveAccount: '¿Ya tienes una cuenta?',
      login: 'Inicia sesión',
      passwordRequirements: {
        length: 'Mínimo 8 caracteres',
        uppercase: 'Al menos una mayúscula',
        lowercase: 'Al menos una minúscula',
        number: 'Al menos un número',
        special: 'Al menos un carácter especial'
      },
      errors: {
        emailInUse: 'Este correo electrónico ya está en uso',
        invalidEmail: 'Correo electrónico inválido',
        weakPassword: 'La contraseña es muy débil',
        generic: 'Error al crear la cuenta',
        passwordMismatch: 'Las contraseñas no coinciden'
      }
    }
  },
  en: {
    login: {
      title: 'Sign in',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '********',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot your password?',
      signIn: 'Sign in',
      signingIn: 'Signing in...',
      orContinueWith: 'Or continue with',
      noAccount: "Don't have an account?",
      register: 'Register',
      errors: {
        invalidEmail: 'Invalid email address',
        userNotFound: 'User not found',
        wrongPassword: 'Incorrect password',
        generic: 'Error signing in',
        emailRequired: 'Please enter your email',
        passwordResetFailed: 'Failed to reset password'
      },
      passwordResetSent: 'Password reset link has been sent'
    },
    register: {
      title: 'Create account',
      fullName: 'Full name',
      fullNamePlaceholder: 'John Doe',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: '********',
      confirmPassword: 'Confirm password',
      confirmPasswordPlaceholder: '********',
      acceptTerms: 'I agree to the terms and conditions',
      termsLink: 'View terms',
      acceptPrivacy: 'I agree to the privacy policy',
      privacyLink: 'View policy',
      acceptMarketing: 'I want to receive marketing communications',
      create: 'Create account',
      creating: 'Creating account...',
      haveAccount: 'Already have an account?',
      login: 'Sign in',
      passwordRequirements: {
        length: 'Minimum 8 characters',
        uppercase: 'At least one uppercase letter',
        lowercase: 'At least one lowercase letter',
        number: 'At least one number',
        special: 'At least one special character'
      },
      errors: {
        emailInUse: 'This email is already in use',
        invalidEmail: 'Invalid email address',
        weakPassword: 'Password is too weak',
        generic: 'Error creating account',
        passwordMismatch: 'Passwords do not match'
      }
    }
  }
} as const

type Languages = 'es' | 'en'
const currentLanguage = ref<Languages>('en')

export function useI18n() {
  function setLanguage(lang: Languages) {
    currentLanguage.value = lang
  }

  function t(key: string): string {
    const keys = key.split('.')
    let value: any = translations[currentLanguage.value]
    
    for (const k of keys) {
      value = value[k]
      if (!value) return key
    }
    
    return value as string
  }

  return {
    t,
    setLanguage,
    currentLanguage
  }
}