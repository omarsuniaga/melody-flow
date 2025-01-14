export interface EventFormData {
  id: string;
  title: string;           // Añadido
  type: string;           // Añadido
  activityType: string;
  paymentStatus: "Pendiente" | "Pagado";
  provider: string;
  description: string;
  location: string;
  date: string;
  time: string;
  amount: number;
  userId: string;
  isFixed: boolean;
}

export interface MusicEvent {
  id: string;
  provider: string;
  description: string;
  location: string;
  date: string;
  time: string;
  amount: number;
  paymentStatus: "Pendiente" | "Pagado";
  activityType: string;
  isFixed: boolean;
  userId: string;
}
