import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '../../../src/stores/settingsStore'

describe('settingsStore.ts', () => {
  describe('estado inicial', () => {
    it('todos los toggles están activados', () => {
      const store = useSettingsStore()
      expect(store.notificationSettings.enabled).toBe(true)
      expect(store.notificationSettings.sound).toBe(true)
      expect(store.notificationSettings.vibration).toBe(true)
      expect(store.notificationSettings.screen).toBe(true)
      expect(store.notificationSettings.led).toBe(true)
    })

    it('tiene 3 alertTimes predeterminadas', () => {
      const store = useSettingsStore()
      expect(store.notificationSettings.alertTimes).toHaveLength(3)
    })

    it('defaultFinalAlert es 60 minutos', () => {
      const store = useSettingsStore()
      expect(store.notificationSettings.defaultFinalAlert).toBe(60)
    })

    it('customAlertTimes está vacío', () => {
      const store = useSettingsStore()
      expect(store.notificationSettings.customAlertTimes).toHaveLength(0)
    })

    it('customAudioUrl es null si no hay nada en localStorage', () => {
      const store = useSettingsStore()
      expect(store.notificationSettings.customAudioUrl).toBeNull()
    })
  })

  describe('updateNotificationSettings', () => {
    it('actualiza propiedades parcialmente', () => {
      const store = useSettingsStore()
      store.updateNotificationSettings({ sound: false, led: false })
      expect(store.notificationSettings.sound).toBe(false)
      expect(store.notificationSettings.led).toBe(false)
    })

    it('no sobrescribe propiedades no mencionadas', () => {
      const store = useSettingsStore()
      store.updateNotificationSettings({ sound: false })
      expect(store.notificationSettings.vibration).toBe(true)
    })
  })

  describe('setCustomAudioUrl', () => {
    it('asigna la URL y la persiste en localStorage', () => {
      const store = useSettingsStore()
      store.setCustomAudioUrl('https://example.com/alarm.mp3')
      expect(store.notificationSettings.customAudioUrl).toBe('https://example.com/alarm.mp3')
      expect(localStorage.getItem('customAudioUrl')).toBe('https://example.com/alarm.mp3')
    })

    it('elimina la URL y la borra de localStorage cuando se pasa null', () => {
      localStorage.setItem('customAudioUrl', 'https://example.com/alarm.mp3')
      const store = useSettingsStore()
      store.setCustomAudioUrl(null)
      expect(store.notificationSettings.customAudioUrl).toBeNull()
      expect(localStorage.getItem('customAudioUrl')).toBeNull()
    })
  })

  describe('setDefaultFinalAlert', () => {
    it('actualiza defaultFinalAlert', () => {
      const store = useSettingsStore()
      store.setDefaultFinalAlert(30)
      expect(store.notificationSettings.defaultFinalAlert).toBe(30)
    })

    it('incluye la alarma final en alertTimes como tipo "final"', () => {
      const store = useSettingsStore()
      store.setDefaultFinalAlert(45)
      const finalAlerts = store.notificationSettings.alertTimes.filter(a => a.type === 'final')
      expect(finalAlerts).toHaveLength(1)
      expect(finalAlerts[0].minutes).toBe(45)
    })
  })

  describe('addCustomAlertTime', () => {
    it('añade una alerta en minutos a partir de horas', () => {
      const store = useSettingsStore()
      store.addCustomAlertTime(3)
      const added = store.notificationSettings.customAlertTimes.find(a => a.minutes === 180)
      expect(added).toBeDefined()
      expect(added?.enabled).toBe(true)
      expect(added?.type).toBe('early')
    })

    it('no añade duplicados', () => {
      const store = useSettingsStore()
      store.addCustomAlertTime(3)
      store.addCustomAlertTime(3)
      const count = store.notificationSettings.customAlertTimes.filter(a => a.minutes === 180).length
      expect(count).toBe(1)
    })

    it('la lista alertTimes queda ordenada de mayor a menor', () => {
      const store = useSettingsStore()
      store.addCustomAlertTime(1) // 60 min
      store.addCustomAlertTime(5) // 300 min
      const minutes = store.notificationSettings.alertTimes.map(a => a.minutes)
      expect(minutes).toEqual([...minutes].sort((a, b) => b - a))
    })
  })

  describe('removeCustomAlertTime', () => {
    it('elimina la alerta personalizada con los minutos indicados', () => {
      const store = useSettingsStore()
      store.addCustomAlertTime(2) // 120 min
      store.removeCustomAlertTime(120)
      const found = store.notificationSettings.customAlertTimes.find(a => a.minutes === 120)
      expect(found).toBeUndefined()
    })

    it('no hace nada si los minutos no existen', () => {
      const store = useSettingsStore()
      const before = store.notificationSettings.customAlertTimes.length
      store.removeCustomAlertTime(9999)
      expect(store.notificationSettings.customAlertTimes).toHaveLength(before)
    })
  })

  describe('updateAlertTimes', () => {
    it('fusiona alertas predeterminadas, personalizadas y la final', () => {
      const store = useSettingsStore()
      store.addCustomAlertTime(1) // 60 min custom
      store.setDefaultFinalAlert(30)
      // DEFAULT_ALERT_TIMES tiene 3 + 1 custom + 1 final = 5
      expect(store.notificationSettings.alertTimes).toHaveLength(5)
    })

    it('la lista resultante está ordenada de mayor a menor', () => {
      const store = useSettingsStore()
      store.addCustomAlertTime(1)
      const minutes = store.notificationSettings.alertTimes.map(a => a.minutes)
      for (let i = 1; i < minutes.length; i++) {
        expect(minutes[i - 1]).toBeGreaterThanOrEqual(minutes[i])
      }
    })
  })
})
