export interface MusicEvent {
  id: string; // ID único del evento
  userId: string; // ID del usuario autenticado
  activityType: 'Fija' | 'Eventual';
  amount: number;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  date: string;
  description: string;
  location: string;
  paymentStatus: 'Pendiente' | 'Pagado';
  provider: string;
  time: string;
  userIP: string;
  coord?: {
    lat: number;
    lng: number;
  } | null;
}
export type DeleteEvent = MusicEvent & { deleteMode: "single" | "all" };
export type EventFormData = Omit<MusicEvent, 'createdAt' | 'createdBy' | 'userIP' | 'updatedAt'>;

export interface ParsedEventData {
  provider: string | null;
  description: string | null;
  location: string | null;
  date: string | null;
  time: string | null;
  amount: number | null;
  error?: boolean;
  message?: string;
  isRecurring?: boolean;
  confidence?: number;
  
}
