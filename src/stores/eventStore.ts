import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { collection, getDoc, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase/config'
import type { MusicEvent, EventFormData } from '../types/event'
import { IPService } from '../services/IPService';
import { format, addWeeks, isSameMonth } from 'date-fns';

export const useEventStore = defineStore('events', () => {
  const events = ref<MusicEvent[]>([]);
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getEventsByDate = computed(() => (date: string) => {
    return events.value.filter(event => event.date === date)
  })

  const addEvent = async (eventData: EventFormData) => {
    if (!auth.currentUser) throw new Error('User not authenticated');

    try {
      loading.value = true;
      const ipService = IPService.getInstance();
      const deviceIP = await ipService.getDeviceIP();

      // Datos base del evento
      const baseEvent = {
        ...eventData,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser.email || '',
        userId: auth.currentUser.uid,
        userIP: deviceIP,

      };

      if (eventData.activityType === 'Fija') {
        // Para eventos fijos, crear instancias para todas las semanas del mes
        const eventDate = new Date(eventData.date);
        let currentDate = eventDate;

        while (isSameMonth(currentDate, eventDate)) {
          try {
            const docRef = await addDoc(collection(db, 'actividades'), {
              ...baseEvent,
              date: format(currentDate, 'yyyy-MM-dd'),
            });

            events.value.push({
              ...baseEvent,
              id: docRef.id,
              date: format(currentDate, 'yyyy-MM-dd'),
            });

            currentDate = addWeeks(currentDate, 1);
          } catch (err) {
            console.error('Error al crear evento recurrente:', err);
            throw err;
          }
        }
      } else {
        // Para eventos eventuales, crear una única instancia
        const docRef = await addDoc(collection(db, 'actividades'), baseEvent);
        events.value.push({ ...baseEvent, id: docRef.id });
      }

      return true;
    } catch (err) {
      console.error('Error al añadir evento:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateEvent = async (eventId: string, eventData: Partial<EventFormData>) => {
    try {
      loading.value = true;
      console.log('Actualizando evento:', { eventId, eventData }); // Debug

      const eventRef = doc(db, 'actividades', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        console.error('Documento no encontrado:', eventId);
        throw new Error('Documento no encontrado');
      }

      const ipService = IPService.getInstance();
      const deviceIP = await ipService.getDeviceIP();

      const updateData = {
        ...eventData,
        date: eventData.date ? formatDateToISO(eventData.date) : undefined,
        updatedAt: new Date().toISOString(),
        userIP: deviceIP,
      };

      console.log('Datos a actualizar:', updateData); // Debug

      await updateDoc(eventRef, updateData);

      // Actualizar estado local
      const index = events.value.findIndex(e => e.id === eventId);
      if (index !== -1) {
        events.value[index] = {
          ...events.value[index],
          ...eventData,
          date: eventData.date ? formatDateToISO(eventData.date) : events.value[index].date,
          updatedAt: new Date().toISOString()
        };
      }
    } catch (err) {
      console.error('Error al actualizar evento:', err);
      error.value = 'Failed to update event';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Función auxiliar para formatear fechas
  const formatDateToISO = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
      const [_, day, month, year] = match;
      return `${year}-${month}-${day}`;
    }

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }

    return dateStr;
  };

  const deleteEvent = async (eventId: string) => {
    try {
      if (!eventId) {
        throw new Error('ID de evento inválido');
      }

      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado');
      }

      loading.value = true;
      console.log('Intentando eliminar documento:', eventId);

      // Verificar que el documento existe
      const eventRef = doc(db, 'actividades', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error('El documento no existe en Firestore');
      }

      // Verificar propiedad del evento
      const eventData = eventDoc.data();
      if (eventData.userId !== auth.currentUser.uid) {
        throw new Error('No tienes permiso para eliminar este evento');
      }

      // Eliminar el documento
      console.log('Eliminando documento:', eventRef.path);
      await deleteDoc(eventRef);

      // Actualizar estado local
      events.value = events.value.filter(e => e.id !== eventId);
      console.log('Evento eliminado exitosamente');

      return true;
    } catch (err) {
      console.error(`Error eliminando evento ${eventId}:`, err);
      error.value = err instanceof Error ? err.message : 'Error desconocido al eliminar el evento';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteRecurringEvents = async (baseEvent: MusicEvent) => {
    try {
      loading.value = true;
      const eventDate = new Date(baseEvent.date);
      const eventsToDelete = events.value.filter(e =>
        e.activityType === 'Fija' &&
        e.provider === baseEvent.provider &&
        e.description === baseEvent.description &&
        new Date(e.date).getDay() === eventDate.getDay()
      );

      await Promise.all(eventsToDelete.map(async e => {
        if (e.id) {
          const eventRef = doc(db, 'actividades', e.id);
          await deleteDoc(eventRef);
        }
      }));
      // Solo actualizamos el estado local
      events.value = events.value.filter(e => !eventsToDelete.some(d => d.id === e.id));
    } catch (error) {
      console.error('Error eliminando eventos recurrentes:', error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchEvents = async () => {
    if (!auth.currentUser) return;
    try {
      loading.value = true;
      const userEmail = auth.currentUser.email;
      const q = query(
        collection(db, 'actividades'),
        where('createdBy', '==', userEmail)
      );
      const querySnapshot = await getDocs(q);
      events.value = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          activityType: data.activityType,
          amount: data.amount,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          date: data.date,
          description: data.description,
          location: data.location,
          time: data.time,
          provider: data.provider,
          paymentStatus: data.paymentStatus,
          userIP: data.userIP
        } as MusicEvent;
      });
    } catch (err) {
      error.value = 'Failed to fetch events';
      throw err;
    } finally {
      loading.value = false;
    }
  };  // Añadir punto y coma aquí

  const togglePaymentStatus = async (eventId: string, newPaymentStatus: 'Pendiente' | 'Pagado') => {
    if (!eventId || !auth.currentUser) {
      throw new Error('ID de evento inválido o usuario no autenticado');
    }

    try {
      loading.value = true;
      const eventRef = doc(db, 'actividades', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error('Documento no encontrado');
      }

      await updateDoc(eventRef, {
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString()
      });

      const index = events.value.findIndex(e => e.id === eventId);
      if (index !== -1) {
        events.value[index] = {
          ...events.value[index],
          paymentStatus: newPaymentStatus,
          updatedAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  return {
    events,
    loading,
    error,
    getEventsByDate,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchEvents,
    togglePaymentStatus,
    deleteRecurringEvents,
  };
}); // Cierre del defineStore

