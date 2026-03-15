import { ref, computed, onMounted, onUnmounted } from "vue";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  getDay,
} from "date-fns";
import { useEventStore } from "../stores/eventStore";
import { MusicEvent, DeleteEvent } from "../types/event"; // Asegúrate de tener el tipo DeleteEvent

export function useCalendarLogic() {

  // Estados reactivos
  const currentDate = ref(new Date());
  const selectedDate = ref(new Date());
  const isEventListModalOpen = ref(false);
  const isDeleteModalOpen = ref(false);
  const isEventFormOpen = ref(false);
  const isViewModalOpen = ref(false);
  const isEditModalOpen = ref(false);
  const selectedEvent = ref<MusicEvent | null>(null);
  const isDeleting = ref(false);
  const isMobile = ref(window.innerWidth < 640);
  const sharedMessage = ref<string | undefined>(undefined);
  const weekDays = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"]; // Definir weekDays
  const eventStore = useEventStore();



  // Computed
  const calendarDays = computed(() => {
    const start = startOfWeek(startOfMonth(currentDate.value));
    const end = endOfWeek(endOfMonth(currentDate.value));
    return eachDayOfInterval({ start, end }).map((date) => ({
      date,
      isCurrentMonth: isSameMonth(date, currentDate.value),
    }));
  });



  const selectedDateEvents = computed(() => {
    return eventStore.getEventsByDate(format(selectedDate.value, "yyyy-MM-dd"));
  });

  // Handlers
  const selectDate = (date: Date) => {
    selectedDate.value = date;
    const eventsOnDate = eventStore.getEventsByDate(format(date, "yyyy-MM-dd"));

    if (eventsOnDate.length > 0) {
      // Si hay eventos, mostrar el modal de lista de eventos
      isEventListModalOpen.value = true;
      isEventFormOpen.value = false;
    } else {
      // Si no hay eventos, mostrar el formulario de nuevo evento
      isEventListModalOpen.value = false;
      isEventFormOpen.value = true;
    }
  };

  const handleDeleteEvent = async (deleteEvent: DeleteEvent) => {
    console.log("Evento a eliminar:", deleteEvent);

    if (!deleteEvent?.id) {
      console.error("Error: Intento de eliminar un evento sin ID");
      return;
    }

    try {

      isDeleting.value = true;

      if (deleteEvent.activityType === "Fija" && deleteEvent.deleteMode === "all") {
        // Lógica para eliminar eventos recurrentes
        await eventStore.deleteRecurringEvents(deleteEvent);
      }
      if (deleteEvent.activityType === "Eventual") {
        // Eliminar evento individual
        await eventStore.deleteEvent(deleteEvent.id);
      }

      // Cerrar modales y resetear estados
      isDeleteModalOpen.value = false;
      isEventListModalOpen.value = false;
      selectedEvent.value = null;

      // Actualizar eventos
      await eventStore.fetchEvents();


    } catch (error) {
      console.error("Error al eliminar el evento:", error);
      throw new Error("No se pudo eliminar el evento");
    } finally {
      isDeleting.value = false;
    }
  };

  const confirmDelete = (event: MusicEvent) => {
    console.log("Evento a eliminar:", event);
    if (!event?.id) {
      console.error("Error: Intento de confirmar eliminación de evento sin Id");
      return;
    }
    selectedEvent.value = event; // Asegurarse de actualizar selectedEvent
    isDeleteModalOpen.value = true;
  };

  const closeDeleteModal = () => {
    isDeleteModalOpen.value = false;
    selectedEvent.value = null;
  };

  // Resto de funciones (togglePaymentStatus, viewEvent, editEvent, etc...)
  const togglePaymentStatus = async (event: MusicEvent) => {
    if (!event?.id) return;

    try {
      await eventStore.togglePaymentStatus(event.id, event.paymentStatus);
      // await eventStore.fetchEvents();
    } catch (error) {
      console.error("Error al actualizar el estado de pago:", error);
    }
  };

  const viewEvent = (event: MusicEvent) => {
    selectedEvent.value = event;
    isViewModalOpen.value = true;
  };

  const editEvent = (event: MusicEvent) => {
    selectedEvent.value = event;
    isEditModalOpen.value = true;
  };

  // Ciclo de vida
  onMounted(() => {
    eventStore.fetchEvents();
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });

  const handleResize = () => {
    isMobile.value = window.innerWidth < 640;
  };

  return {
    // Estados
    currentDate,
    selectedDate,
    isEventListModalOpen,
    isDeleteModalOpen,
    isEventFormOpen,
    isViewModalOpen,
    isEditModalOpen,
    selectedEvent,
    isDeleting,
    isMobile,
    sharedMessage,
    weekDays,

    // Computed
    calendarDays,
    selectedDateEvents,

    // Métodos
    getDateEvents: (date: Date) => eventStore.getEventsByDate(format(date, "yyyy-MM-dd")),
    selectDate,
    handleDeleteEvent,
    confirmDelete,
    closeDeleteModal,
    togglePaymentStatus,
    viewEvent,
    editEvent,
    handleEditEvent: () => {
      isViewModalOpen.value = false;
      isEditModalOpen.value = true;
    },
    handleEventSaved: async () => {
      try {
        isEventFormOpen.value = false;
        isEditModalOpen.value = false;
        await eventStore.fetchEvents(); // Refrescar eventos después de guardar
      } catch (error) {
        console.error('Error al manejar evento guardado:', error);
        sharedMessage.value = 'Error al guardar el evento';
      }
    },



  };
}
