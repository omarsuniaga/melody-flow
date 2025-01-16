/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_GEMINI_API_KEY: string
  // Añade aquí otras variables de entorno que uses
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
