import { useEventStore } from '../stores/eventStore'
import { format, addMinutes, isWithinInterval, parseISO } from 'date-fns'
import { notificationConfig } from '../config/notification'
import { useSettingsStore } from '../stores/settingsStore'

// Definir interfaces para mejor tipado
interface EventData {
  id: string
  provider: string
  description: string
  location: string
  date: string
  time: string
}

interface AlertTime {
  minutes: number
  type: 'early' | 'standard' | 'final'
  enabled: boolean
}

interface NotificationOptions extends NotificationOptions {
  data?: {
    eventId: string
    alertType?: string
  }
}

export class NotificationService {
  private static instance: NotificationService
  private customAudioUrl: string | null = null
  private eventStore = useEventStore()
  private settingsStore = useSettingsStore()
  private checkInterval: number | null = null
  private finalAlarm: HTMLAudioElement | null = null
  private wakeLock: any = null
  private readonly CHECK_INTERVAL = 60000 // 1 minuto en ms

  private constructor() {
    this.init()
  }

  private async init() {
    await this.requestNotificationPermission()
    this.setupCleanup()
  }

  private setupCleanup() {
    window.addEventListener('beforeunload', () => {
      this.cleanup()
    })
  }

  private cleanup() {
    this.stopMonitoring()
    this.stopFinalAlarm()
    this.releaseWakeLock()
  }

  private async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release()
        this.wakeLock = null
      } catch (error) {
        console.error('Error liberando wakeLock:', error)
      }
    }
  }

  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  public startMonitoring() {
    this.stopMonitoring() // Asegurar que no haya duplicados
    this.checkUpcomingEvents() // Verificar inmediatamente

    this.checkInterval = window.setInterval(() => {
      this.checkUpcomingEvents()
    }, this.CHECK_INTERVAL)

    console.log('Sistema de notificaciones iniciado')
  }

  private async checkUpcomingEvents() {
    if (!this.settingsStore.notificationSettings.enabled) return

    try {
      const now = new Date()
      const events = this.eventStore.events

      // Filtrar eventos próximas 24 horas
      const upcomingEvents = events.filter(event => {
        const eventDate = parseISO(`${event.date}T${event.time}`)
        const tomorrow = addMinutes(now, 24 * 60)
        return isWithinInterval(eventDate, { start: now, end: tomorrow })
      })

      for (const event of upcomingEvents) {
        await this.checkEventAlerts(event, now)
      }
    } catch (error) {
      console.error('Error verificando eventos:', error)
    }
  }

  public stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('Sistema de notificaciones detenido')
    }
  }

  private async checkEventAlerts(event: EventData, now: Date) {
    const eventDate = parseISO(`${event.date}T${event.time}`)
    const alertTimes = this.settingsStore.notificationSettings.alertTimes
      .filter(alert => alert.enabled)

    for (const alert of alertTimes) {
      const notificationTime = addMinutes(eventDate, -alert.minutes)

      if (this.isWithinNotificationWindow(now, notificationTime)) {
        await this.sendNotification(event, alert)
      }
    }
  }

  private isWithinNotificationWindow(now: Date, targetTime: Date): boolean {
    return isWithinInterval(now, {
      start: addMinutes(targetTime, -0.5),
      end: addMinutes(targetTime, 0.5)
    })
  }

  private async sendNotification(event: EventData, alert: AlertTime) {
    const isFinalAlert = alert.type === 'final'

    try {
      const notificationOptions: NotificationOptions = {
        title: isFinalAlert ? '🚨 ¡ALERTA FINAL!' : 'Recordatorio de Evento',
        body: this.getNotificationBody(event, alert.minutes, isFinalAlert),
        icon: notificationConfig.icon,
        tag: `event-${event.id}-${alert.minutes}`,
        requireInteraction: true,
        silent: true, // Silenciar notificación nativa
        data: {
          eventId: event.id,
          alertType: alert.type
        }
      }

      const notification = new Notification(notificationOptions.title, notificationOptions)

      // Activar funcionalidades según configuración
      await this.handleNotificationEffects(isFinalAlert)

      notification.onclick = () => this.handleNotificationClick(event.id, isFinalAlert)
    } catch (error) {
      console.error('Error enviando notificación:', error)
    }
  }

  private async handleNotificationEffects(isFinalAlert: boolean) {
    const settings = this.settingsStore.notificationSettings

    if (settings.sound) {
      isFinalAlert ? await this.startFinalAlarm() : await this.playNotificationSound()
    }

    if (settings.vibration && navigator.vibrate) {
      navigator.vibrate(isFinalAlert ? [200, 100, 200, 100, 200] : [200, 100, 200])
    }

    if (settings.screen) {
      await this.wakeScreen()
    }

    if (settings.led) {
      await this.flashLED(isFinalAlert)
    }
  }

  // ...existing code...
  public async requestNotificationPermission(): Promise<boolean> {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  export interface EventNotification {
    title: string;
    body: string;
    icon: string;
    tag: string;
    data: {
      eventId: string;
      alertType: string;
    }
  }

  // Método mejorado para pruebas
  public async testFullNotification() {
    const testEvent: EventData = {
      id: 'test-' + Date.now(),
      provider: 'Sistema',
      description: 'Prueba completa del sistema de notificaciones',
      location: 'Local',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    }

    try {
      // Probar notificación normal
      await this.sendNotification(testEvent, {
        minutes: 30,
        type: 'standard',
        enabled: true
      })

      // Probar alarma final después de 2 segundos
      setTimeout(() => {
        this.sendNotification(testEvent, {
          minutes: 0,
          type: 'final',
          enabled: true
        })
      }, 2000)

      return new Promise(resolve => setTimeout(resolve, 5000))
    } catch (error) {
      console.error('Error en prueba completa:', error)
      throw error
    }
  }
}
