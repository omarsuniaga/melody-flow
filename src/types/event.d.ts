
export type PaymentStatus = 'Pendiente' | 'Pagado'

export interface EventFormData {
  id: string
  activityType: 'Fija' | 'Eventual'
  paymentStatus: PaymentStatus
  provider: string
  description: string
  location: string
  date: string
  amount: number
  userId: string
  userIP: string
  time: string

}

// Ajustar si MusicEvent y/o updatedAt son requeridos
export interface MusicEvent {
  id: string
  updatedAt?: string
  activityType: 'Fija' | 'Eventual'
  amount: number
  createdAt: string
  paymentStatus: PaymentStatus
  provider: string
  description: string
  location: string
  date: string
  time: string
  userIP: string
  userId: string
  coord?: { lat: number; lng: number }

}
