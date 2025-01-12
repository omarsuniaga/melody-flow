import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    notificationSettings: {
      enabled: true,
      threshold: 30, // minutos antes del evento
      sound: true,
      vibration: true
    }
  }),

  actions: {
    updateNotificationSettings(settings: Partial<typeof this.notificationSettings>) {
      this.notificationSettings = {
        ...this.notificationSettings,
        ...settings
      }
    }
  },

  persist: true
})
