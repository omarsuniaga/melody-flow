import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import type { MusicEvent, EventFormData } from '../types/event'

export const useEventStore = defineStore('events', () => {
  const events = ref<MusicEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getEventsByDate = computed(() => (date: string) => {
    return events.value.filter(event => event.date === date)
  })

  const addEvent = async (eventData: EventFormData) => {
    if (!auth.currentUser) throw new Error('User not authenticated')

    try {
      loading.value = true
      const newEvent: MusicEvent = {
        ...eventData,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.displayName || auth.currentUser.email || 'Unknown',
        userIP: '', // Add IP address here
        userId: auth.currentUser.uid

      }

      const docRef = await addDoc(collection(db, 'actividades'), newEvent)
      events.value.push({ ...newEvent, id: docRef.id })
    } catch (err) {
      error.value = 'Failed to add event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (id: string, eventData: Partial<EventFormData>) => {
    try {
      loading.value = true
      const eventRef = doc(db, 'actividades', id)
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: new Date().toISOString(),
        userId: auth.currentUser!.uid // Ensure userId is updated
      })

      const index = events.value.findIndex(e => e.id === id)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...eventData, userId: auth.currentUser!.uid }
      }
    } catch (err) {
      error.value = 'Failed to update event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id: string) => {
    try {
      loading.value = true
      await deleteDoc(doc(db, 'actividades', id))
      events.value = events.value.filter(e => e.id !== id)
    } catch (err) {
      error.value = 'Failed to delete event'
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchEvents = async () => {
    if (!auth.currentUser) return

    try {
      loading.value = true
      const q = query(
        collection(db, 'actividades'),
        where('userId', '==', auth.currentUser.uid)
      )
      const querySnapshot = await getDocs(q)
      events.value = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MusicEvent[]
    } catch (err) {
      error.value = 'Failed to fetch events'
      throw err
    } finally {
      loading.value = false
    }
  }

  const togglePaymentStatus = async (id: string) => {
    const event = events.value.find(e => e.id === id)
    if (!event) return

    const newPaymentStatus = event.paymentStatus === 'Pendiente' ? 'Pagado' : 'Pendiente'
    await updateEvent(id, { paymentStatus: newPaymentStatus })
  }

  return {
    events,
    loading,
    error,
    getEventsByDate,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
    togglePaymentStatus
  }
})

