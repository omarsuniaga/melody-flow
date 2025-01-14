export interface MusicEvent {
  id: string;
  activityType: 'Fija' | string;
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
  userId: string;
  isFixed: boolean;
  title: string;
  type: string;
}

export type EventFormData = Omit<MusicEvent, 'createdAt' | 'createdBy' | 'userIP'>;

// Agregar un tipo de guarda para verificar eventos
export function isMusicEvent(event: any): event is MusicEvent {
  return (
    event &&
    typeof event.id === 'string' &&
    typeof event.provider === 'string' &&
    typeof event.description === 'string' &&
    typeof event.location === 'string' &&
    typeof event.time === 'string' &&
    typeof event.amount === 'number' &&
    typeof event.date === 'string'
  );
}
