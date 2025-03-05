// Nuevo sistema centralizado de manejo de errores
export enum ErrorType {
  AUTHENTICATION = 'auth',
  DATABASE = 'database',
  VALIDATION = 'validation',
  NETWORK = 'network',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: unknown;
  code?: string;
}

export function handleError(error: unknown, type = ErrorType.UNKNOWN): AppError {
  console.error('Error capturado:', error);
  
  // Crear objeto de error estandarizado
  const appError: AppError = {
    type,
    message: 'Ha ocurrido un error inesperado',
    originalError: error
  };
  
  // Personalizar mensaje según el tipo de error
  if (error instanceof Error) {
    appError.message = error.message;
  }
  
  // Enviar error a servicio de monitoreo (implementación futura)
  // reportErrorToMonitoring(appError);
  
  return appError;
}

// Función para usar en componentes
export function useErrorHandler() {
  const handleComponentError = (error: unknown, type = ErrorType.UNKNOWN) => {
    const appError = handleError(error, type);
    // Aquí podrías integrar con un store de notificaciones
    return appError;
  };
  
  return { handleComponentError };
} 