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

export interface EventFormData extends Required<BaseEventData> {
  id?: string;
  activityType: 'Eventual' | 'Fija';
  paymentStatus: 'Pendiente' | 'Pagado';
  amount: number;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MusicEvent extends EventFormData {
  id: string;
  createdAt: string;
  createdBy?: string;
  userIP?: string;
  coord?: { lat: number; lng: number };
}

export type DeleteEvent = MusicEvent & { deleteMode: "single" | "all" };

export interface AppEvent {
  id: string;
  createdAt: string;
  createdBy?: string;
  userIP?: string;
  coord?: { lat: number; lng: number };
  activityType: "Eventual" | "Fija";
  paymentStatus: "Pendiente" | "Pagado";
  date: string | null;
  description: string | null;
  location: string | null;
  provider: string | null;
  amount: number;
  time: string | null;
  userId: string;
  isFixed?: boolean;
}
