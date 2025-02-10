/**
 * NotificationService.ts
 * Servicio de notificaciones que maneja alertas, sonidos y efectos.
 * Implementa el patrón Singleton para garantizar una única instancia.
 */

import { useEventStore } from '../stores/eventStore';
import { addMinutes, isWithinInterval, parseISO } from 'date-fns';
import { notificationConfig } from '../config/notification';
import { useSettingsStore } from '../stores/settingsStore'; // Asegúrate de que este store exista y contenga "notificationSettings"

// Interfaces para definir la estructura de datos usadas en el servicio
export interface EventNotification {
  title: string;
  body: string;
  icon: string;
  tag: string;
  data: {
    eventId: string;
    alertType: string;
  };
}

interface EventData {
  id: string;
  provider: string;
  description: string;
  location: string;
  date: string;
  time: string;
}

export interface AlertTime {
  minutes: number;
  type: 'early' | 'standard' | 'final';
  enabled: boolean;
}

interface NotificationOptions {
  title?: string;
  body: string;
  icon: string;
  tag: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: {
    eventId: string;
    alertType?: string;
  };
}

export class NotificationService {
  // Propiedad para implementar el patrón Singleton
  private static instance: NotificationService;

  // Propiedades privadas para manejo interno
  private customAudioUrl: string | null = null;
  private eventStore = useEventStore();
  private settingsStore = useSettingsStore(); // Se asume que este store tiene "notificationSettings"
  private checkInterval: number | null = null;
  private finalAlarm: HTMLAudioElement | null = null;
  private wakeLock: any = null;
  private readonly CHECK_INTERVAL = 60000; // 1 minuto en milisegundos

  /**
   * Constructor privado para evitar instanciaciones múltiples.
   */
  private constructor() {
    this.init();
  }

  /**
   * Inicializa el servicio solicitando permisos de notificación y configurando la limpieza de recursos.
   */
  private async init(): Promise<void> {
    await this.requestNotificationPermission();
    this.setupCleanup();
  }

  /**
   * Obtiene la instancia única del servicio.
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Solicita permisos para mostrar notificaciones.
   * @returns true si se otorgan los permisos, false en caso contrario.
   */
  public async requestNotificationPermission(): Promise<boolean> {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Inicia el monitoreo de eventos próximos para enviar notificaciones.
   */
  public startMonitoring(): void {
    this.stopMonitoring(); // Asegurarse de limpiar intervalos previos
    this.checkUpcomingEvents();
    this.checkInterval = window.setInterval(() => {
      this.checkUpcomingEvents();
    }, this.CHECK_INTERVAL);
    console.log('Sistema de notificaciones iniciado');
  }

  /**
   * Detiene el monitoreo de eventos.
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Sistema de notificaciones detenido');
    }
  }

  /**
   * Configura un audio personalizado para las notificaciones.
   * @param url URL del archivo de audio o null para usar el sonido predeterminado.
   */
  public async setCustomAudioUrl(url: string | null): Promise<void> {
    try {
      if (!url) {
        this.customAudioUrl = notificationConfig.defaultSound;
        return;
      }
      if (!this.isValidAudioFormat(url)) {
        throw new Error('Formato de audio no soportado. Use MP3, WAV u OGG.');
      }
      const audio = new Audio(url);
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve());
        audio.addEventListener('error', () => reject(new Error('Error al cargar el audio')));
        audio.load();
      });
      this.customAudioUrl = url;
    } catch (error) {
      console.error('Error configurando audio:', error);
      this.customAudioUrl = notificationConfig.defaultSound;
      throw error;
    }
  }

  /**
   * Valida que la URL del audio tenga un formato soportado (mp3, wav, ogg).
   * @param url URL del archivo de audio.
   * @returns true si el formato es válido.
   */
  private isValidAudioFormat(url: string): boolean {
    return /\.(mp3|wav|ogg)$/i.test(url);
  }

  /**
   * Configura la limpieza de recursos al cerrar la página.
   */
  private setupCleanup(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  /**
   * Libera el WakeLock si está activo.
   */
  private async releaseWakeLock(): Promise<void> {
    try {
      if (this.wakeLock !== null) {
        await this.wakeLock.release();
        this.wakeLock = null;
      }
    } catch (error) {
      console.error('Error al liberar wakeLock:', error);
    }
  }

  /**
   * Limpia recursos y detiene servicios.
   */
  private cleanup(): void {
    this.stopMonitoring();
    this.stopFinalAlarm();
    void this.releaseWakeLock();
  }

  /**
   * Reproduce el sonido de notificación normal.
   */
  private async playNotificationSound(): Promise<void> {
    try {
      const audio = new Audio(this.customAudioUrl || notificationConfig.defaultSound);
      await audio.play();
    } catch (error) {
      console.error('Error reproduciendo sonido:', error);
    }
  }

  /**
   * Inicia la alarma final en bucle.
   */
  private async startFinalAlarm(): Promise<void> {
    try {
      if (!this.finalAlarm) {
        this.finalAlarm = new Audio(notificationConfig.sound);
        this.finalAlarm.loop = true;
      }
      await this.finalAlarm.play();
    } catch (error) {
      console.error('Error iniciando alarma final:', error);
    }
  }

  /**
   * Detiene y reinicia la alarma final.
   */
  private stopFinalAlarm(): void {
    if (this.finalAlarm) {
      this.finalAlarm.pause();
      this.finalAlarm.currentTime = 0;
    }
  }

  /**
   * Maneja el clic en una notificación.
   * @param eventId ID del evento asociado.
   * @param isFinalAlert Indica si es una alerta final.
   */
  private handleNotificationClick(eventId: string, isFinalAlert: boolean): void {
    if (isFinalAlert) {
      this.stopFinalAlarm();
    }
    console.log(`Notificación clickeada para evento ${eventId}`);
  }

  /**
   * Verifica eventos próximos y envía notificaciones según alertas configuradas.
   */
  private async checkUpcomingEvents(): Promise<void> {
    // Se asume que "notificationSettings" está dentro del store de settings
    if (!this.settingsStore.notificationSettings.enabled) return;

    try {
      const now = new Date();
      const events = this.eventStore.events;

      // Filtrar eventos que ocurran en las próximas 24 horas
      const upcomingEvents = events.filter(event => {
        const eventDate = parseISO(`${event.date}T${event.time}`);
        const tomorrow = addMinutes(now, 24 * 60);
        return isWithinInterval(eventDate, { start: now, end: tomorrow });
      });

      for (const event of upcomingEvents) {
        await this.checkEventAlerts(event, now);
      }
    } catch (error) {
      console.error('Error verificando eventos:', error);
    }
  }

  /**
   * Para un evento dado, verifica cada alerta configurada y envía notificaciones si es el momento.
   * @param event Evento a evaluar.
   * @param now Fecha y hora actuales.
   */
  private async checkEventAlerts(event: EventData, now: Date): Promise<void> {
    const eventDate = parseISO(`${event.date}T${event.time}`);
    // Se filtran las alertas habilitadas
    const alertTimes = this.settingsStore.notificationSettings.alertTimes.filter(alert => alert.enabled);

    for (const alert of alertTimes) {
      const notificationTime = addMinutes(eventDate, -alert.minutes);
      if (this.isWithinNotificationWindow(now, notificationTime)) {
        await this.sendNotification(event, alert);
      }
    }
  }

  /**
   * Determina si el momento actual se encuentra dentro de una ventana (±0.5 minutos) del tiempo objetivo.
   * @param now Fecha y hora actuales.
   * @param targetTime Tiempo objetivo para la notificación.
   * @returns true si está dentro de la ventana.
   */
  private isWithinNotificationWindow(now: Date, targetTime: Date): boolean {
    return isWithinInterval(now, {
      start: addMinutes(targetTime, -0.5),
      end: addMinutes(targetTime, 0.5)
    });
  }

  /**
   * Construye el cuerpo del mensaje de notificación.
   * @param event Evento asociado.
   * @param minutes Cantidad de minutos antes del evento.
   * @param isFinalAlert Indica si es una alerta final.
   * @returns El texto para el cuerpo de la notificación.
   */
  private getNotificationBody(event: EventData, minutes: number): string {
    const timeText = minutes > 0 ? `en ${minutes} minutos` : 'AHORA';
    return `${event.description} ${timeText}\nLugar: ${event.location}`;
  }

  /**
   * Envía una notificación para un evento específico usando la alerta configurada.
   * @param event Evento a notificar.
   * @param alert Alerta configurada para el evento.
   */
  private async sendNotification(event: EventData, alert: AlertTime): Promise<void> {
    const isFinalAlert = alert.type === 'final';
    try {
      const notificationTitle = isFinalAlert ? '🚨 ¡ALERTA FINAL!' : 'Recordatorio de Evento';
      const notificationOptions: NotificationOptions = {
        title: notificationTitle,
        body: this.getNotificationBody(event, alert.minutes),
        icon: notificationConfig.icon,
        tag: `event-${event.id}-${alert.minutes}`,
        requireInteraction: true,
        silent: true,
        data: {
          eventId: event.id,
          alertType: alert.type
        }
      };

      // Crear la notificación
      const notification = new Notification(notificationOptions.title!, notificationOptions);
      // Aplicar efectos (sonido, vibración, etc.)
      await this.handleNotificationEffects(isFinalAlert);

      // Manejar clic en la notificación
      notification.onclick = () => this.handleNotificationClick(event.id, isFinalAlert);
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  }

  /**
   * Maneja los efectos asociados a la notificación (sonido, vibración, mantener pantalla encendida, LED).
   * @param isFinalAlert Indica si es una alerta final.
   */
  private async handleNotificationEffects(isFinalAlert: boolean): Promise<void> {
    const settings = this.settingsStore.notificationSettings;

    if (settings.sound) {
      isFinalAlert ? await this.startFinalAlarm() : await this.playNotificationSound();
    }

    if (settings.vibration && navigator.vibrate) {
      navigator.vibrate(isFinalAlert ? [200, 100, 200, 100, 200] : [200, 100, 200]);
    }

    if (settings.screen) {
      await this.wakeScreen();
    }

    if (settings.led) {
      await this.flashLED(isFinalAlert);
    }
  }

  /**
   * Solicita mantener la pantalla encendida usando WakeLock (si es soportado).
   */
  public async wakeScreen(): Promise<void> {
    try {
      if ('wakeLock' in navigator) {
        this.wakeLock = await navigator.wakeLock.request('screen');
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && this.wakeLock === null) {
            this.wakeScreen();
          }
        });
      }
    } catch (error) {
      console.error('Error al intentar mantener la pantalla encendida:', error);
    }
  }

  /**
   * Intenta simular el parpadeo de un LED usando la vibración.
   * Nota: Funcionalidades como encender el LED requieren integración nativa.
   * @param isFinalAlert Indica si es una alerta final.
   */
  public async flashLED(isFinalAlert: boolean): Promise<void> {
    try {
      if (!('Notification' in window)) {
        console.warn('Este dispositivo no soporta notificaciones');
        return;
      }
      if (!('vibrate' in navigator)) {
        console.warn('Este dispositivo no soporta vibración/LED');
        return;
      }
      const pattern = isFinalAlert ? [200, 100, 200, 100, 200] : [100, 100, 100];
      await navigator.vibrate(pattern);
    } catch (error) {
      console.error('Error al intentar usar el LED:', error);
    }
  }

  /**
   * Envía una notificación de prueba.
   * Crea un evento de prueba, envía una notificación estándar y luego una final.
   */
  public async testNotification(): Promise<void> {
    try {
      const testEvent: EventData = {
        id: 'test-' + Date.now(),
        provider: 'Sistema',
        description: 'Prueba de notificación',
        location: 'Local',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0]
      };

      await this.sendNotification(testEvent, { minutes: 0, type: 'standard', enabled: true });
      setTimeout(() => {
        void this.sendNotification(testEvent, { minutes: 0, type: 'final', enabled: true });
      }, 2000);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error en prueba de notificación:', error);
      throw error;
    }
  }

  /**
   * Programa y envía una notificación de prueba con retraso.
   * @param delayMinutes Minutos de retraso para la notificación.
   */
  public async sendScheduledTestNotification(delayMinutes: number = 1): Promise<void> {
    try {
      const testEvent: EventData = {
        id: 'scheduled-test-' + Date.now(),
        provider: 'Sistema',
        description: 'Prueba programada de notificación',
        location: 'Local',
        date: new Date().toISOString().split('T')[0],
        time: new Date(Date.now() + delayMinutes * 60000).toTimeString().split(' ')[0]
      };

      console.log(`Programando notificación de prueba para ${delayMinutes} minutos...`);
      setTimeout(async () => {
        try {
          await this.sendNotification(testEvent, { minutes: 0, type: 'standard', enabled: true });
          console.log('Notificación de prueba programada enviada exitosamente');
        } catch (error) {
          console.error('Error enviando notificación programada:', error);
        }
      }, delayMinutes * 60000);
      return Promise.resolve();
    } catch (error) {
      console.error('Error configurando notificación programada:', error);
      throw error;
    }
  }

  /**
   * Realiza una prueba completa del sistema de notificaciones enviando primero una alerta estándar y luego una final.
   */
  public async testFullNotification(): Promise<void> {
    const testEvent: EventData = {
      id: 'test-' + Date.now(),
      provider: 'Sistema',
      description: 'Prueba completa del sistema de notificaciones',
      location: 'Local',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0]
    };

    try {
      await this.sendNotification(testEvent, { minutes: 30, type: 'standard', enabled: true });
      setTimeout(() => {
        this.sendNotification(testEvent, { minutes: 0, type: 'final', enabled: true });
      }, 2000);
      return new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error en prueba completa:', error);
      throw error;
    }
  }

  /**
   * Verifica el soporte del dispositivo para notificaciones, vibración, WakeLock y sonido.
   * @returns Un objeto con las capacidades soportadas.
   */
  public checkDeviceSupport(): {
    notifications: boolean;
    vibration: boolean;
    wakeLock: boolean;
    sound: boolean;
  } {
    return {
      notifications: 'Notification' in window,
      vibration: 'vibrate' in navigator,
      wakeLock: 'wakeLock' in navigator,
      sound: typeof Audio !== 'undefined'
    };
  }

  /**
   * Envía una notificación de evento usando datos proporcionados.
   * @param event Objeto de notificación con título, cuerpo, icono, etc.
   */
  public async sendEventNotification(event: EventNotification): Promise<void> {
    try {
      if (!('Notification' in window)) {
        console.warn('Este dispositivo no soporta notificaciones');
        return;
      }
      const notification = new Notification(event.title, {
        body: event.body,
        icon: event.icon,
        tag: event.tag,
        data: event.data
      });
      notification.onclick = () => {
        console.log(`Notificación clickeada para evento ${event.data.eventId}`);
      };
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  }
}
