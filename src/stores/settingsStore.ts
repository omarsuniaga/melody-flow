import { defineStore } from 'pinia'

interface AlertTime {
  minutes: number;
  type: 'early' | 'standard' | 'final';
  enabled: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  screen: boolean;
  led: boolean;
  customAudioUrl: string | null;
  finalAlarmSound: string; // Sonido específico para alarma final
  alertTimes: AlertTime[];
  customAlertTimes: AlertTime[];
  defaultFinalAlert: number; // minutos para la alarma final
}

interface NotificationConfig {
  // ...existing properties...
  sound: string;
}

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    notificationSettings: {
      enabled: true,
      sound: true,
      vibration: true,
      screen: true,
      led: true,
      customAudioUrl: localStorage.getItem('customAudioUrl') || null,
      finalAlarmSound: '/audios/final-alarm.mp3',
      alertTimes: [
        { minutes: 360, type: 'early' as const, enabled: true },    // 6 horas antes
        { minutes: 240, type: 'early' as const, enabled: true },    // 4 horas antes
        { minutes: 120, type: 'early' as const, enabled: true },    // 2 horas antes
        { minutes: 60, type: 'final' as const, enabled: true }      // 1 hora antes (alarma final)
      ],
      customAlertTimes: [],
      defaultFinalAlert: 60, // por defecto 1 hora
    } as NotificationSettings
  }),

  actions: {
    updateNotificationSettings(settings: Partial<NotificationSettings>) {
      this.notificationSettings = { ...this.notificationSettings, ...settings }
    },

    setCustomAudioUrl(url: string | null) {
      this.notificationSettings.customAudioUrl = url
      if (url) {
        localStorage.setItem('customAudioUrl', url)
      } else {
        localStorage.removeItem('customAudioUrl')
      }
    },

    addAlertTime(minutes: number) {
      if (!this.notificationSettings.alertTimes.some(alert => alert.minutes === minutes)) {
        this.notificationSettings.alertTimes.push({ minutes, type: 'standard' as const, enabled: true })
        this.notificationSettings.alertTimes.sort((a, b) => b.minutes - a.minutes)
      }
    },

    removeAlertTime(minutes: number) {
      this.notificationSettings.alertTimes = this.notificationSettings.alertTimes
        .filter(alert => alert.minutes !== minutes)
    },

    setDefaultFinalAlert(minutes: number) {
      this.notificationSettings.defaultFinalAlert = minutes;
      this.updateAlertTimes();
    },

    addCustomAlertTime(hours: number) {
      const minutes = hours * 60;
      if (!this.notificationSettings.customAlertTimes.some(alert => alert.minutes === minutes)) {
        this.notificationSettings.customAlertTimes.push({
          minutes,
          type: 'early' as const,
          enabled: true
        });
        this.updateAlertTimes();
      }
    },

    removeCustomAlertTime(minutes: number) {
      this.notificationSettings.customAlertTimes =
        this.notificationSettings.customAlertTimes.filter(alert => alert.minutes !== minutes);
      this.updateAlertTimes();
    },

    updateAlertTimes() {
      const allAlerts: AlertTime[] = [
        ...this.notificationSettings.customAlertTimes,
        {
          minutes: this.notificationSettings.defaultFinalAlert,
          type: 'final',
          enabled: true
        }
      ];

      this.notificationSettings.alertTimes = allAlerts.sort((a, b) => b.minutes - a.minutes);
    }
  }
})
