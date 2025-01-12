import { useEventStore } from '../stores/eventStore'
import { format, addMinutes, isWithinInterval, parseISO } from 'date-fns'
import { notificationConfig } from '../config/notification'
import { useSettingsStore } from '../stores/settingsStore'

export class NotificationService {
  private static instance: NotificationService
  private eventStore = useEventStore()
  private checkInterval: number | null = null
  private readonly NOTIFICATION_THRESHOLD = 30 // minutos antes del evento

  private constructor() {
    this.requestNotificationPermission()
  }

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  // Hacemos público el método de solicitud de permisos
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones de escritorio')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }

    return false
  }

  // Método estático para obtener el estado actual del permiso
  static getPermissionStatus(): NotificationPermission {
    return Notification.permission
  }

  startMonitoring() {
    // Verificar eventos cada minuto
    this.checkInterval = window.setInterval(() => {
      this.checkUpcomingEvents()
    }, 60000) // 60000ms = 1 minuto
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }

  private async checkUpcomingEvents() {
    const now = new Date()
    const events = this.eventStore.events

    events.forEach(event => {
      const eventDate = parseISO(`${event.date}T${event.time}`)
      const notificationTime = addMinutes(eventDate, -this.NOTIFICATION_THRESHOLD)

      // Verificar si estamos dentro del intervalo de notificación
      if (isWithinInterval(now, {
        start: notificationTime,
        end: addMinutes(notificationTime, 1)
      })) {
        this.sendNotification(event)
      }
    })
  }

  private async playNotificationSound() {
    const settingsStore = useSettingsStore()
    if (settingsStore.notificationSettings.sound) {
      try {
        const audio = new Audio(notificationConfig.sound)
        await audio.play()
      } catch (error) {
        console.warn('No se pudo reproducir el sonido de notificación:', error)
      }
    }
  }

  private async sendNotification(event: any) {
    const settingsStore = useSettingsStore()
    const hasPermission = await this.requestNotificationPermission()

    if (!hasPermission || !settingsStore.notificationSettings.enabled) {
      return
    }

    try {
      const notification = new Notification('Próximo Evento', {
        body: `${event.provider} - ${event.description}\nEn ${this.NOTIFICATION_THRESHOLD} minutos\nLugar: ${event.location}`,
        icon: notificationConfig.icon,
        tag: `event-${event.id}`,
        // vibrate: settingsStore.notificationSettings.vibration ? [200, 100, 200] : undefined,
        silent: !settingsStore.notificationSettings.sound
      })

      if (settingsStore.notificationSettings.sound) {
        await this.playNotificationSound()
      }

      notification.onclick = () => {
        window.focus()
        // Navegar al evento
        window.location.href = `/calendar?event=${event.id}`
      }
    } catch (error) {
      console.error('Error al enviar notificación:', error)
    }
  }

  // Método público para probar notificaciones
  async testNotification() {
    const testEvent = {
      id: 'test',
      provider: 'Test Provider',
      description: 'Notificación de prueba',
      location: 'Test Location',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    }

    await this.sendNotification(testEvent)
  }
}

export default NotificationService
