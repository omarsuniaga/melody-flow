export interface MusicEvent {
  id?: string;
  activityType: 'Fija' | string;
  amount: number;
  createdAt: string;
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


}

export type EventFormData = Omit<MusicEvent, 'id' | 'createdAt' | 'createdBy' | 'userIP'>;
