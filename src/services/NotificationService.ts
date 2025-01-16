/**
 * Servicio de notificaciones que maneja alertas, sonidos y efectos
 * Implementa el patrón Singleton para garantizar una única instancia
 */

// Imports necesarios para el funcionamiento del servicio
import { useEventStore } from '../stores/eventStore'
import { format, addMinutes, isWithinInterval, parseISO } from 'date-fns'
import { notificationConfig } from '../config/notification'
import { useSettingsStore } from '../stores/settingsStore'

// Interfaces que definen la estructura de datos
export interface EventNotification {
  title: string
  body: string
  icon: string
  tag: string
  data: {
    eventId: string
    alertType: string
  }
}

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

interface NotificationOptions {
  title?: string
  body: string
  icon: string
  tag: string
  requireInteraction?: boolean
  silent?: boolean
  data?: {
    eventId: string
    alertType?: string
  }
}

export class NotificationService {
  // Propiedades privadas para el manejo del servicio
  private static instance: NotificationService
  private customAudioUrl: string | null = null
  private eventStore = useEventStore()
  private settingsStore = useSettingsStore()
  private checkInterval: number | null = null
  private finalAlarm: HTMLAudioElement | null = null
  private wakeLock: any = null
  private readonly CHECK_INTERVAL = 60000 // 1 minuto en ms

  /**
   * Constructor privado para implementar Singleton
   * Inicializa el servicio y configura los listeners
   */
  private constructor() {
    this.init()
  }

  /**
   * Inicialización asíncrona del servicio
   * Solicita permisos y configura limpieza
   */
  private async init() {
    await this.requestNotificationPermission()
    this.setupCleanup()
  }

  /**
   * Obtiene la instancia única del servicio
   * Implementa el patrón Singleton
   */
  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Solicita permisos para mostrar notificaciones
   * @returns Promise<boolean> - true si se otorgaron los permisos
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (Notification.permission === 'granted') return true
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  /**
   * Inicia el monitoreo de eventos
   * Configura un intervalo para verificar eventos próximos
   */
  public startMonitoring() {
    this.stopMonitoring()
    this.checkUpcomingEvents()
    this.checkInterval = window.setInterval(() => {
      this.checkUpcomingEvents()
    }, this.CHECK_INTERVAL)
    console.log('Sistema de notificaciones iniciado')
  }

  /**
   * Detiene el monitoreo de eventos
   * Limpia el intervalo de verificación
   */
  public stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log('Sistema de notificaciones detenido')
    }
  }

  /**
   * Configura un audio personalizado para las notificaciones
   * @param url - URL del archivo de audio o null para usar el predeterminado
   */
  public async setCustomAudioUrl(url: string | null): Promise<void> {
    try {
      if (!url) {
        this.customAudioUrl = notificationConfig.defaultSound
        return
      }

      if (!this.isValidAudioFormat(url)) {
        throw new Error('Formato de audio no soportado. Use MP3, WAV u OGG.')
      }

      const audio = new Audio(url)
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve)
        audio.addEventListener('error', () => reject(new Error('Error al cargar el audio')))
        audio.load()
      })

      this.customAudioUrl = url
    } catch (error) {
      console.error('Error configurando audio:', error)
      this.customAudioUrl = notificationConfig.defaultSound
      throw error
    }
  }

  /**
   * Valida el formato del archivo de audio
   * @param url - URL del archivo a validar
   */
  private isValidAudioFormat(url: string): boolean {
    return /\.(mp3|wav|ogg)$/i.test(url)
  }

  /**
   * Configura la limpieza de recursos
   * Se ejecuta antes de cerrar la página
   */
  private setupCleanup() {
    window.addEventListener('beforeunload', () => {
      this.cleanup()
    })
  }

  /**
   * Libera el WakeLock si está activo
   */
  private async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLock !== null) {
        await this.wakeLock.release()
        this.wakeLock = null
      }
    } catch (error) {
      console.error('Error al liberar wakeLock:', error)
    }
  }

  /**
   * Limpia recursos y detiene servicios
   */
  private cleanup() {
    this.stopMonitoring()
    this.stopFinalAlarm()
    void this.releaseWakeLock()
  }

  /**
   * Reproduce el sonido de notificación normal
   */
  private async playNotificationSound() {
    try {
      const audio = new Audio(this.customAudioUrl || notificationConfig.defaultSound)
      await audio.play()
    } catch (error) {
      console.error('Error reproduciendo sonido:', error)
    }
  }

  /**
   * Inicia la alarma final en bucle
   */
  private async startFinalAlarm() {
    try {
      if (!this.finalAlarm) {
        this.finalAlarm = new Audio(notificationConfig.sound)
        this.finalAlarm.loop = true
      }
      await this.finalAlarm.play()
    } catch (error) {
      console.error('Error iniciando alarma final:', error)
    }
  }

  /**
   * Detiene y reinicia la alarma final
   */
  private stopFinalAlarm() {
    if (this.finalAlarm) {
      this.finalAlarm.pause()
      this.finalAlarm.currentTime = 0
    }
  }

  /**
   * Maneja el clic en una notificación
   * @param eventId - ID del evento asociado
   * @param isFinalAlert - Indica si es una alerta final
   */
  private handleNotificationClick(eventId: string, isFinalAlert: boolean) {
    if (isFinalAlert) {
      this.stopFinalAlarm()
    }
    console.log(`Notificación clickeada para evento ${eventId}`)
  }

  /**
   * Verifica eventos próximos para notificar
   */
  private async checkUpcomingEvents() {
    if (!this.settingsStore.notificationSettings.enabled) return

    try {
      const now = new Date()
      const events = this.eventStore.events

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

  private getNotificationBody(event: EventData, minutes: number, isFinalAlert: boolean): string {
    const timeText = minutes > 0 ? `en ${minutes} minutos` : 'AHORA'
    return `${event.description} ${timeText}\nLugar: ${event.location}`
  }

  private async sendNotification(event: EventData, alert: AlertTime) {
    const isFinalAlert = alert.type === 'final'

    try {
      const notificationTitle = isFinalAlert ? '🚨 ¡ALERTA FINAL!' : 'Recordatorio de Evento'

      const notificationOptions: NotificationOptions = {
        title: notificationTitle,
        body: this.getNotificationBody(event, alert.minutes, isFinalAlert),
        icon: notificationConfig.icon,
        tag: `event-${event.id}-${alert.minutes}`,
        requireInteraction: true,
        silent: true,
        data: {
          eventId: event.id,
          alertType: alert.type
        }
      }

      const notification = new Notification(notificationOptions.title!, notificationOptions)

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

  public async wakeScreen() {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen')
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.wakeLock === null) {
            this.wakeScreen()
          }
        })
      }
    } catch (error) {
      console.error('Error al intentar mantener la pantalla encendida:', error)
    }
  }

  public async flashLED(isFinalAlert: boolean): Promise<void> {
    try {
      if (!('Notification' in window)) {
        console.warn('Este dispositivo no soporta notificaciones')
        return
      }

      if (!('vibrate' in navigator)) {
        console.warn('Este dispositivo no soporta vibración/LED')
        return
      }

      const pattern = isFinalAlert
        ? [200, 100, 200, 100, 200]
        : [100, 100, 100]

      await navigator.vibrate(pattern)
    } catch (error) {
      console.error('Error al intentar usar el LED:', error)
    }
  }
  public async testNotification(): Promise<void> {
    try {
      // Crear evento de prueba
      const testEvent: EventData = {
        id: 'test-' + Date.now(),
        provider: 'Sistema',
        description: 'Prueba de notificación',
        location: 'Local',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      };

      // Enviar notificación de prueba
      await this.sendNotification(testEvent, {
        minutes: 0,
        type: 'standard',
        enabled: true
      });

      // Esperar 2 segundos y probar alarma final
      setTimeout(() => {
        void this.sendNotification(testEvent, {
          minutes: 0,
          type: 'final',
          enabled: true
        });
      }, 2000);

      // Esperar a que terminen las pruebas
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error('Error en prueba de notificación:', error);
      throw error;
    }
  }
  /**
 * Envía una notificación de prueba programada
 * @param delayMinutes - Minutos de retraso para la notificación
 * @returns Promise<void>
 */
public async sendScheduledTestNotification(delayMinutes: number = 1): Promise<void> {
  try {
    // Crear evento de prueba
    const testEvent: EventData = {
      id: 'scheduled-test-' + Date.now(),
      provider: 'Sistema',
      description: 'Prueba programada de notificación',
      location: 'Local',
      date: new Date().toISOString().split('T')[0],
      time: new Date(Date.now() + delayMinutes * 60000).toTimeString().split(' ')[0]
    }

    console.log(`Programando notificación de prueba para ${delayMinutes} minutos...`)

    // Programar notificación
    setTimeout(async () => {
      try {
        await this.sendNotification(testEvent, {
          minutes: 0,
          type: 'standard',
          enabled: true
        })
        console.log('Notificación de prueba programada enviada exitosamente')
      } catch (error) {
        console.error('Error enviando notificación programada:', error)
      }
    }, delayMinutes * 60000)

    return Promise.resolve()
  } catch (error) {
    console.error('Error configurando notificación programada:', error)
    throw error
  }
}
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
      await this.sendNotification(testEvent, {
        minutes: 30,
        type: 'standard',
        enabled: true
      })

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
