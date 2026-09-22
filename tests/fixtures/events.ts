import type { MusicEvent } from '../../src/types/event'

export const mockEvent: MusicEvent = {
  id: 'evt-001',
  activityType: 'Eventual',
  paymentStatus: 'Pendiente',
  provider: 'Club Jazz',
  description: 'Concierto de jazz en vivo',
  location: 'Av. 27 de Febrero, Santo Domingo',
  date: '2026-04-15',
  time: '20:00',
  amount: 5000,
  userId: 'user-123',
  userIP: '192.168.1.1',
  createdAt: '2026-03-01T10:00:00.000Z',
  coord: { lat: 18.4861, lng: -69.9312 },
}

export const mockFixedEvent: MusicEvent = {
  ...mockEvent,
  id: 'evt-002',
  activityType: 'Fija',
  paymentStatus: 'Pagado',
  provider: 'Teatro Nacional',
  date: '2026-04-20',
  amount: 8000,
  coord: undefined,
}

export const mockEventList: MusicEvent[] = [
  mockEvent,
  mockFixedEvent,
  {
    ...mockEvent,
    id: 'evt-003',
    date: '2026-04-15',
    provider: 'Bar El Conde',
    amount: 3000,
  },
]

export const validEventFormData = {
  activityType: 'Eventual' as const,
  paymentStatus: 'Pendiente' as const,
  provider: 'Club Jazz',
  description: 'Concierto',
  location: 'Santo Domingo',
  date: '2026-04-15',
  time: '20:00',
  amount: 5000,
  userId: 'user-123',
}
