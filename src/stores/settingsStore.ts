import { defineStore } from 'pinia';

/**
 * Interfaz que define la estructura de un tiempo de alerta.
 */
export interface AlertTime {
  minutes: number;
  type: 'early' | 'standard' | 'final';
  enabled: boolean;
}

/**
 * Interfaz que define la configuración de notificaciones.
 */
export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  screen: boolean;
  led: boolean;
  customAudioUrl: string | null;
  finalAlarmSound: string; // Sonido específico para alarma final
  alertTimes: AlertTime[];
  customAlertTimes: AlertTime[];
  defaultFinalAlert: number; // Minutos para la alarma final
}

/**
 * Constante que contiene los tiempos de alerta predeterminados (excluyendo la alarma final).
 */
const DEFAULT_ALERT_TIMES: AlertTime[] = [
  { minutes: 360, type: 'early', enabled: true }, // 6 horas antes
  { minutes: 240, type: 'early', enabled: true }, // 4 horas antes
  { minutes: 120, type: 'early', enabled: true }, // 2 horas antes
];

/**
 * Store para la configuración de notificaciones.
 */
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    notificationSettings: {
      enabled: true,
      sound: true,
      vibration: true,
      screen: true,
      led: true,
      // Se recupera la URL personalizada del audio desde localStorage, si existe.
      customAudioUrl: localStorage.getItem('customAudioUrl') || null,
      finalAlarmSound: '/audios/final-alarm.mp3',
      // Inicialmente se utilizan los tiempos de alerta predeterminados.
      alertTimes: DEFAULT_ALERT_TIMES,
      customAlertTimes: [] as AlertTime[],
      defaultFinalAlert: 60, // Por defecto, 1 hora para la alarma final
    } as NotificationSettings,
  }),

  actions: {
    /**
     * Actualiza parcialmente la configuración de notificaciones.
     * @param settings - Objeto parcial con las propiedades a actualizar.
     */
    updateNotificationSettings(settings: Partial<NotificationSettings>) {
      this.notificationSettings = { ...this.notificationSettings, ...settings };
      // Opcional: Aquí se podría persistir toda la configuración en localStorage.
    },

    /**
     * Actualiza la URL personalizada para el audio y la persiste en localStorage.
     * @param url - URL del archivo de audio o null para eliminar la personalización.
     */
    setCustomAudioUrl(url: string | null) {
      this.notificationSettings.customAudioUrl = url;
      if (url) {
        localStorage.setItem('customAudioUrl', url);
      } else {
        localStorage.removeItem('customAudioUrl');
      }
    },

    /**
     * Establece el valor predeterminado para la alarma final y actualiza la lista de alertas.
     * @param minutes - Minutos para la alarma final.
     */
    setDefaultFinalAlert(minutes: number) {
      this.notificationSettings.defaultFinalAlert = minutes;
      this.updateAlertTimes();
    },

    /**
     * Agrega un tiempo de alerta personalizado (convertido de horas a minutos)
     * y actualiza la lista combinada de alertas.
     * @param hours - Número de horas antes del evento para la alerta.
     */
    addCustomAlertTime(hours: number) {
      const minutes = hours * 60;
      if (!this.notificationSettings.customAlertTimes.some(alert => alert.minutes === minutes)) {
        this.notificationSettings.customAlertTimes.push({
          minutes,
          type: 'early',
          enabled: true,
        });
        this.updateAlertTimes();
      }
    },

    /**
     * Elimina un tiempo de alerta personalizado dado en minutos y actualiza la lista de alertas.
     * @param minutes - Tiempo de alerta a eliminar (en minutos).
     */
    removeCustomAlertTime(minutes: number) {
      this.notificationSettings.customAlertTimes =
        this.notificationSettings.customAlertTimes.filter(alert => alert.minutes !== minutes);
      this.updateAlertTimes();
    },

    /**
     * Fusiona los tiempos de alerta predeterminados, los personalizados y la alarma final
     * en una única lista ordenada de forma descendente.
     */
    updateAlertTimes() {
      const finalAlert: AlertTime = {
        minutes: this.notificationSettings.defaultFinalAlert,
        type: 'final',
        enabled: true,
      };

      // Combina los tiempos de alerta predeterminados, las personalizadas y la alarma final.
      const mergedAlerts: AlertTime[] = [
        ...DEFAULT_ALERT_TIMES,
        ...this.notificationSettings.customAlertTimes,
        finalAlert,
      ];

      // Ordena de mayor a menor (por cantidad de minutos)
      this.notificationSettings.alertTimes = mergedAlerts.sort((a, b) => b.minutes - a.minutes);
    },
  },
});
