export interface BaseEventData {
  provider: string | null;
  description: string | null;
  location: string | null;
  date: string | null;
  time: string | null;
}

export interface ParsedEventData extends BaseEventData {
  amount: number | null;
  error?: boolean;
  message?: string;
  confidence?: number;
}

/**
 * Modelo canónico de un evento en la aplicación.
 * Fuente única de verdad para Firestore, stores, vistas, componentes y utilidades.
 */
export interface AppEvent {
  id: string;
  userId: string;
  date: string | null;
  time: string | null;
  activityType: 'Eventual' | 'Fija';
  paymentStatus: 'Pendiente' | 'Pagado';
  provider: string | null;
  description: string | null;
  location: string | null;
  amount: number;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  userIP?: string;
  coord?: { lat: number; lng: number };
  isFixed?: boolean;
}

/**
 * Alias de compatibilidad para evitar roturas inmediatas mientras se completa la migración.
 */
export type MusicEvent = AppEvent;

/**
 * Datos requeridos para el formulario de creación / edición de eventos.
 */
export interface EventFormData {
  id?: string;
  userId?: string;
  date: string | null;
  time: string | null;
  activityType: 'Eventual' | 'Fija';
  paymentStatus: 'Pendiente' | 'Pagado';
  provider: string | null;
  description: string | null;
  location: string | null;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  userIP?: string;
  coord?: { lat: number; lng: number };
}

export type DeleteEvent = AppEvent & { deleteMode: 'single' | 'all' };
