
export type PaymentStatus = 'Pendiente' | 'Pagado'

export interface EventFormData {
  id?: string
  activityType: 'Fija' | 'Eventual'
  paymentStatus: PaymentStatus
  provider: string
  description: string
  location: string
  date: string
  time: string
  amount: number
  userId: string
  isFixed: boolean
  fixedAmount?: number
  fixedFrequency?: 'Diaria' | 'Semanal' | 'Mensual' | 'Anual'
  fixedStartDate?: string

}

// Ajustar si MusicEvent y/o updatedAt son requeridos
export interface MusicEvent {
  id: string
  // ...existing code...
  updatedAt?: string
}
