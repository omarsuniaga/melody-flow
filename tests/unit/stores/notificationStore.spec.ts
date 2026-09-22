import { describe, it, expect, beforeEach } from 'vitest'
import { useNotificationStore } from '../../../src/stores/notificationStore'

describe('notificationStore.ts', () => {
  describe('estado inicial', () => {
    it('soundEnabled es true', () => {
      const store = useNotificationStore()
      expect(store.settings.soundEnabled).toBe(true)
    })

    it('pushEnabled es true', () => {
      const store = useNotificationStore()
      expect(store.settings.pushEnabled).toBe(true)
    })

    it('tiene 3 alertTimes por defecto', () => {
      const store = useNotificationStore()
      expect(store.settings.alertTimes).toHaveLength(3)
    })

    it('finalAlertTime por defecto es 60', () => {
      const store = useNotificationStore()
      expect(store.settings.finalAlertTime).toBe(60)
    })

    it('todos los toggles (led, screen, vibration) son true', () => {
      const store = useNotificationStore()
      expect(store.settings.led).toBe(true)
      expect(store.settings.screen).toBe(true)
      expect(store.settings.vibration).toBe(true)
    })
  })

  describe('updateSettings', () => {
    it('actualiza la configuración correctamente', () => {
      const store = useNotificationStore()
      store.updateSettings({ ...store.settings, soundEnabled: false })
      expect(store.settings.soundEnabled).toBe(false)
    })

    it('persiste la configuración en localStorage', () => {
      const store = useNotificationStore()
      store.updateSettings({ ...store.settings, led: false })
      const saved = JSON.parse(localStorage.getItem('notificationSettings')!)
      expect(saved.led).toBe(false)
    })

    it('actualiza múltiples propiedades a la vez', () => {
      const store = useNotificationStore()
      store.updateSettings({
        ...store.settings,
        soundEnabled: false,
        pushEnabled: false,
        screen: false,
      })
      expect(store.settings.soundEnabled).toBe(false)
      expect(store.settings.pushEnabled).toBe(false)
      expect(store.settings.screen).toBe(false)
    })
  })

  describe('addCustomAlertTime', () => {
    it('añade una nueva alerta convirtiendo horas a minutos', () => {
      const store = useNotificationStore()
      const initialLength = store.settings.alertTimes.length
      store.addCustomAlertTime(2)
      expect(store.settings.alertTimes).toHaveLength(initialLength + 1)
      expect(store.settings.alertTimes.at(-1)?.time).toBe('120')
    })

    it('persiste la nueva alerta en localStorage', () => {
      const store = useNotificationStore()
      store.addCustomAlertTime(1)
      const saved = JSON.parse(localStorage.getItem('notificationSettings')!)
      const added = saved.alertTimes.find((a: { time: string }) => a.time === '60')
      expect(added).toBeDefined()
    })

    it('añade 0 horas como "0" minutos', () => {
      const store = useNotificationStore()
      store.addCustomAlertTime(0)
      expect(store.settings.alertTimes.at(-1)?.time).toBe('0')
    })
  })

  describe('removeCustomAlertTime', () => {
    it('elimina la alerta del índice indicado', () => {
      const store = useNotificationStore()
      const initialLength = store.settings.alertTimes.length
      store.removeCustomAlertTime(0)
      expect(store.settings.alertTimes).toHaveLength(initialLength - 1)
    })

    it('no hace nada con un índice fuera de rango', () => {
      const store = useNotificationStore()
      const initialLength = store.settings.alertTimes.length
      store.removeCustomAlertTime(999)
      expect(store.settings.alertTimes).toHaveLength(initialLength)
    })

    it('no hace nada con índice negativo', () => {
      const store = useNotificationStore()
      const initialLength = store.settings.alertTimes.length
      store.removeCustomAlertTime(-1)
      expect(store.settings.alertTimes).toHaveLength(initialLength)
    })

    it('persiste la eliminación en localStorage', () => {
      const store = useNotificationStore()
      store.removeCustomAlertTime(0)
      const saved = JSON.parse(localStorage.getItem('notificationSettings')!)
      expect(saved.alertTimes).toHaveLength(store.settings.alertTimes.length)
    })
  })

  describe('loadSettings (desde localStorage)', () => {
    it('carga la configuración guardada al inicializar', () => {
      const custom = {
        soundEnabled: false,
        pushEnabled: false,
        alertTimes: [],
        finalAlertTime: 30,
        enabled: false,
        sound: false,
        vibration: false,
        screen: false,
        led: false,
      }
      localStorage.setItem('notificationSettings', JSON.stringify(custom))

      // Nuevo store que cargará desde localStorage
      const store = useNotificationStore()
      expect(store.settings.soundEnabled).toBe(false)
      expect(store.settings.finalAlertTime).toBe(30)
    })
  })
})
