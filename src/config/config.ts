interface Config {
  GEMINI_API_KEY: string;
}

export const config: Config = {
  GEMINI_API_KEY: import.meta.env.VITE_GEMINI_API_KEY
};

// Validación de la API key
if (!config.GEMINI_API_KEY) {
  console.error('VITE_GEMINI_API_KEY no está definida en el archivo .env');
}
