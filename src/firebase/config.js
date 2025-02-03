import { initializeApp, getApps } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, getToken as getFirebaseToken } from 'firebase/messaging'
import { getAnalytics, logEvent } from 'firebase/analytics'

// Verificar que las variables de entorno requeridas estén definidas
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

requiredEnvVars.forEach(varName => {
  if (!import.meta.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Inicializar Firebase solo si no hay una instancia existente
const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Configurar auth con persistencia
const authInstance = getAuth(firebaseApp);
authInstance.useDeviceLanguage(); // Usar el idioma del dispositivo

// Asegurar que estamos usando la persistencia local
setPersistence(authInstance, browserLocalPersistence)
  .catch(error => console.error("Error de persistencia:", error));

// Exportaciones básicas
export const app = firebaseApp;  // Exportación nombrada principal
export const auth = authInstance;  // Asegurar que auth está exportado
export const db = getFirestore(firebaseApp);
export const messaging = getMessaging(firebaseApp);
export const analytics = import.meta.env.PROD && typeof window !== 'undefined' 
  ? getAnalytics(firebaseApp)
  : null;

// Función segura para logging de eventos
export const logAnalyticsEvent = (eventName, params) => {
  if (import.meta.env.DEV) {
    console.log('Analytics event (DEV):', eventName, params);
    return;
  }
  if (analytics) {
    try {
      logEvent(analytics, eventName, params);
    } catch (error) {
      console.warn('Analytics event logging failed:', error);
    }
  }
};

// Función para obtener el token de FCM
export async function getFCMToken() {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPIDKEY
    });
    return currentToken;
  } catch (error) {
    console.error('An error occurred while retrieving token.', error);
    return null;
  }
}

// Implementación de la función getToken
async function getToken(messaging, options) {
  try {
    const token = await getFirebaseToken(messaging, options);
    return token;
  } catch (error) {
    console.error('An error occurred while getting the token:', error);
    throw error;
  }
}

export default firebaseApp;  // Exportación por defecto al final

