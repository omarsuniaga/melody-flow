import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging, Messaging, getToken as getFirebaseToken } from 'firebase/messaging'
// import { getAnalytics, logEvent } from 'firebase/analytics'

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
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Añadir si usas Analytics
}

// Inicializar Firebase solo si no hay una instancia existente
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

// Inicializar Analytics solo en producción
// export const analytics = import.meta.env.PROD && typeof window !== 'undefined' 
//   ? getAnalytics(app)
//   : null;

// // Función segura para logging de eventos logAnalyticsEvent
// export const logAnalyticsEvent = (eventName: string, params?: any) => {
//   if (import.meta.env.DEV) {
//     console.log('Analytics event (DEV):', eventName, params);
//     return;
//   }
//   if (analytics) {
//     try {
//       logEvent(analytics, eventName, params);
//     } catch (error) {
//       console.warn('Analytics event logging failed:', error);
//     }
//   }
// };

// Exportaciones básicas
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);
export default app;

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
async function getToken(messaging: Messaging, options: { vapidKey: string }) {
  try {
    const token = await getFirebaseToken(messaging, options);
    return token;
  } catch (error) {
    console.error('An error occurred while getting the token:', error);
    throw error;
  }
}

