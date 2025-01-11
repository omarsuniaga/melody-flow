import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics"
import { getAuth } from "firebase/auth"

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

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(
    /*settings=*/{
      tabManager: persistentSingleTabManager()
    }
  )
});

export const auth = getAuth(app);

// Initialize Analytics only if we have all required configuration
const canInitializeAnalytics = () => {
  return import.meta.env.PROD &&
         firebaseConfig.projectId &&
         firebaseConfig.measurementId;
};

export const analytics = canInitializeAnalytics()
  ? getAnalytics(app)
  : null;

