import { defineStore } from 'pinia';
import { ref } from 'vue';

export interface AlertTime {
  time: string;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  pushEnabled: boolean;
  alertTimes: AlertTime[];
  finalAlertTime: number;
  customAudioUrl?: string;
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  screen: boolean;
  led: boolean;
}

export const useNotificationStore = defineStore('notification', () => {
  // Estado inicial del store
  const settings = ref<NotificationSettings>({
    soundEnabled: true,
    pushEnabled: true,
    alertTimes: [{ time: '10:00' }, { time: '12:00' }, { time: '17:00' }],
    finalAlertTime: 60,
    enabled: true,
    sound: true,
    vibration: true,
    screen: true,
    led: true,
  });

  /**
   * Actualiza la configuración de notificaciones y la persiste en localStorage.
   * @param newSettings - La nueva configuración de notificaciones.
   */
  function updateSettings(newSettings: NotificationSettings) {
    settings.value = newSettings;
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error al guardar la configuración de notificaciones en localStorage:', error);
    }
  }

  /**
   * Agrega una nueva alerta personalizada. Convierte las horas a minutos y lo añade al arreglo.
   * @param hours - La cantidad de horas antes del evento para la alerta.
   */
  function addCustomAlertTime(hours: number) {
    const minutes = hours * 60;
    settings.value.alertTimes.push({ time: minutes.toString() });
    // Actualizamos la configuración en localStorage
    updateSettings(settings.value);
  }

  /**
   * Remueve una alerta personalizada según el índice del arreglo.
   * @param index - El índice de la alerta a remover.
   */
  function removeCustomAlertTime(index: number) {
    if (index < 0 || index >= settings.value.alertTimes.length) {
      console.warn('Índice de alerta inválido:', index);
      return;
    }
    settings.value.alertTimes.splice(index, 1);
    updateSettings(settings.value);
  }

  /**
   * Carga la configuración guardada desde localStorage, si existe.
   */
  function loadSettings() {
    try {
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        settings.value = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error al cargar la configuración de notificaciones desde localStorage:', error);
    }
  }

  // Cargar configuración al inicializar el store
  loadSettings();

  return {
    settings,
    updateSettings,
    addCustomAlertTime,
    removeCustomAlertTime,
  };
});
