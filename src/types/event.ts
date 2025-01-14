export interface MusicEvent {
  id: string;  // Cambiado de id?: string a id: string
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
