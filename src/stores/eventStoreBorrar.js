import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
export const useEventStore = defineStore('events', () => {
    const events = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const getEventsByDate = computed(() => (date) => {
        return events.value.filter(event => event.date === date);
    });

    const getUserIP = async () => {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (err) {
            console.error('Error al obtener IP:', err);
            return 'Unknown IP';
        }
    };

    const addEvent = async (eventData) => {
        if (!auth.currentUser)
            throw new Error('User not authenticated');
        try {
            loading.value = true;
            const userIP = await getUserIP();
            const userEmail = auth.currentUser.email;
            const newEvent = {
                ...eventData,
                createdAt: new Date().toISOString(),
                createdBy: userEmail, // Usar directamente el email
                userIP: userIP,
                userId: auth.currentUser.uid
            };
            const docRef = await addDoc(collection(db, 'actividades'), newEvent);
            events.value.push({ ...newEvent, id: docRef.id });
        }
        catch (err) {
            error.value = 'Failed to add event';
            throw err;
        }
        finally {
            loading.value = false;
        }
    };
    const updateEvent = async (id, eventData) => {
        try {
            loading.value = true;
            const eventRef = doc(db, 'actividades', id);
            await updateDoc(eventRef, {
                ...eventData,
                updatedAt: new Date().toISOString(),
                userId: auth.currentUser.uid // Ensure userId is updated
            });
            const index = events.value.findIndex(e => e.id === id);
            if (index !== -1) {
                events.value[index] = { ...events.value[index], ...eventData, userId: auth.currentUser.uid };
            }
        }
        catch (err) {
            error.value = 'Failed to update event';
            throw err;
        }
        finally {
            loading.value = false;
        }
    };
    const deleteEvent = async (id) => {
      console.log("Estoy aqui")
        if (!id) throw new Error('ID is required to delete event');
        try {
            loading.value = true;
            const eventRef = doc(db, 'actividades', id); // Aseguramos que la referencia sea correcta
            await deleteDoc(eventRef);
            events.value = events.value.filter(e => e.id !== id);
        } catch (err) {
            error.value = 'Failed to delete event';
            console.error('Error deleting event:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const fetchEvents = async () => {
        if (!auth.currentUser)
            return;
        try {
            loading.value = true;
            const userEmail = auth.currentUser.email;
            const q = query(
                collection(db, 'actividades'),
                where('createdBy', '==', userEmail)
            );
            const querySnapshot = await getDocs(q);
            events.value = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (err) {
            error.value = 'Failed to fetch events';
            throw err;
        }
        finally {
            loading.value = false;
        }
    };
    const togglePaymentStatus = async (id) => {
        const event = events.value.find(e => e.id === id);
        if (!event) return;

        try {
            loading.value = true;
            const newPaymentStatus = event.paymentStatus === 'Pendiente' ? 'Pagado' : 'Pendiente';

            // Actualizar en Firestore
            const eventRef = doc(db, 'actividades', id);
            await updateDoc(eventRef, {
                paymentStatus: newPaymentStatus,
                updatedAt: new Date().toISOString()
            });

            // Actualizar en el estado local
            const index = events.value.findIndex(e => e.id === id);
            if (index !== -1) {
                events.value[index] = {
                    ...events.value[index],
                    paymentStatus: newPaymentStatus,
                    updatedAt: new Date().toISOString()
                };
            }
        } catch (err) {
            error.value = 'Failed to update payment status';
            throw err;
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
        togglePaymentStatus
    };
});
