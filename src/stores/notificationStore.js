import { defineStore } from 'pinia';
import { ref } from 'vue';
export const useNotificationStore = defineStore('notification', () => {
    const settings = ref({
        soundEnabled: true,
        pushEnabled: true,
        alertTimes: [{ time: '10:00' }, { time: '12:00' }, { time: '17:00' }]
    });
    function updateSettings(newSettings) {
        settings.value = newSettings;
        localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    }
    // Cargar configuraciones guardadas
    function loadSettings() {
        const saved = localStorage.getItem('notificationSettings');
        if (saved) {
            settings.value = JSON.parse(saved);
        }
    }
    // Inicializar
    loadSettings();
    return {
        settings,
        updateSettings
    };
});
