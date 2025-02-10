export interface EventFormData {
  id: string;
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
  userIP: string;
  coord: { lat: number; lng: number };

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
  userId: string;
  userIP: string;
  coord: { lat: number; lng: number };
  
}
