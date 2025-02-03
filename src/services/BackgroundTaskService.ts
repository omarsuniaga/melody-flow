import { useEventStore } from '../stores/eventStore';
import { useSettingsStore } from '../stores/settingsStore';
import { NotificationService } from './NotificationService';
import { addMinutes, isWithinInterval, compareAsc } from 'date-fns';
export class BackgroundTaskService {
  private static instance: BackgroundTaskService;
  private checkInterval: number | undefined;
  private CHECK_FREQUENCY = 60000; // Revisar cada minuto
  private notificationService: NotificationService;

  private constructor() {
    this.notificationService = NotificationService.getInstance();
  }

  public static getInstance(): BackgroundTaskService {
    if (!BackgroundTaskService.instance) {
      BackgroundTaskService.instance = new BackgroundTaskService();
    }
    return BackgroundTaskService.instance;
  }

  public startMonitoring(): void {
    this.stopMonitoring(); // Asegurarse de que no haya intervalos duplicados
    this.safeCheckEvents(); // Revisar inmediatamente al iniciar
    this.checkInterval = window.setInterval(() => this.safeCheckEvents(), this.CHECK_FREQUENCY);
  }

  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      console.log('Monitoreo de eventos detenido');
    }
  }

  private async checkEvents(): Promise<void> {
    const eventStore = useEventStore();
    const settingsStore = useSettingsStore();
    const now = new Date();

    // Obtener eventos futuros dentro de las próximas 24 horas
    const upcomingEvents = eventStore.events.filter(event => {
      const eventDate = new Date(event.date);
      const tomorrow = addMinutes(now, 24 * 60);
      return isWithinInterval(eventDate, { start: now, end: tomorrow });
    });

    // Ordenar eventos por fecha más cercana
    upcomingEvents.sort((a, b) =>
      compareAsc(new Date(a.date), new Date(b.date))
    );

    for (const event of upcomingEvents) {
      const eventDate = new Date(event.date);

      // Verificar cada tiempo de alerta configurado
      for (const alertTime of settingsStore.notificationSettings.alertTimes) {
        const alertDate = addMinutes(eventDate, -alertTime.minutes);

        // Si estamos dentro del minuto de la alerta
        if (this.isWithinMinute(now, alertDate)) {
          const timeRemaining = alertTime.minutes;
          const message = this.createAlertMessage(event.description, timeRemaining);

          await this.notificationService.sendEventNotification({
            title: 'Recordatorio de Evento',
            body: message,
            icon: '/icons/icon-192x192.png',
            tag: `event-${event.id}-${alertTime.minutes}`,
            data: {
              eventId: event.id,
              alertType: alertTime.type
            }
          });

          console.log(`Notificación enviada para evento: ${event.description}`);
        }
      }
    }
  }

  // Agregar control de errores y reintentos
  private async safeCheckEvents(): Promise<void> {
    try {
      await this.checkEvents();
    } catch (error) {
      console.error('Error checking events:', error);
      // Reintentar en 30 segundos si hay error
      setTimeout(() => this.safeCheckEvents(), 30000);
    }
  }

  private isWithinMinute(date1: Date, date2: Date): boolean {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return diff < 60000; // Diferencia menor a un minuto
  }

  public async sendEventNotification(eventId: string, alertType: string): Promise<void> {
    const eventStore = useEventStore();
    const event = eventStore.events.find(event => event.id === eventId);
    const settingsStore = useSettingsStore();
    const alertTime = settingsStore.notificationSettings.alertTimes.find(alert => alert.type === alertType);

    if (event && alertTime) {
      const timeRemaining = alertTime.minutes;
      const message = this.createAlertMessage(event.description, timeRemaining);

      await this.notificationService.sendEventNotification({
        title: 'Recordatorio de Evento',
        body: message,
        icon: '/icons/icon-192x192.png',
        tag: `event-${event.id}-${alertTime.minutes}`,
        data: {
          eventId: event.id,
          alertType: alertTime.type
        }
      });

      console.log(`Notificación enviada para evento: ${event.location}`);
    }
  }

  // Agregar método para pausar/reanudar monitoreo
  public pauseMonitoring(duration: number): void {
    this.stopMonitoring();
    setTimeout(() => this.startMonitoring(), duration);
  }

  // Agregar método para cambiar frecuencia de chequeo
  public setCheckFrequency(milliseconds: number): void {
    this.CHECK_FREQUENCY = milliseconds;
    if (this.checkInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  private createAlertMessage(eventTitle: string, minutesRemaining: number): string {
    if (minutesRemaining < 60) {
      return `"${eventTitle}" comenzará en ${minutesRemaining} minutos`;
    } else {
      const hours = Math.floor(minutesRemaining / 60);
      return `"${eventTitle}" comenzará en ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
  }
}
