import { ref, computed } from 'vue';
import { usePreferredDark } from '@vueuse/core';
export function useCalendar() {
    const currentDate = ref(new Date());
    const isDark = usePreferredDark();
    const isLoading = ref(false);
    const error = ref(null);
    const calendarDays = computed(() => {
        // Implementation will use Cally for calendar calculations
        const days = [];
        // ... calendar logic
        return days;
    });
    const currentMonth = computed(() => {
        return currentDate.value.toLocaleString('default', { month: 'long', year: 'numeric' });
    });
    async function fetchEvents(month) {
        isLoading.value = true;
        error.value = null;
        try {
            // Implement Firebase fetch logic here
        }
        catch (e) {
            error.value = 'Failed to load events';
        }
        finally {
            isLoading.value = false;
        }
    }
    function nextMonth() {
        currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
    }
    function previousMonth() {
        currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
    }
    return {
        currentDate,
        calendarDays,
        currentMonth,
        isDark,
        isLoading,
        error,
        nextMonth,
        previousMonth,
        fetchEvents
    };
}
