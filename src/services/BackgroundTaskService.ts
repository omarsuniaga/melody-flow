import { useEventStore } from '../stores/eventStore';
import { useSettingsStore } from '../stores/settingsStore';
import { NotificationService } from './NotificationService';
import { addMinutes, isWithinInterval, compareAsc } from 'date-fns';
export class BackgroundTaskService {
  private static instance: BackgroundTaskService;
  private checkInterval: number | undefined;
  private readonly CHECK_FREQUENCY = 60000; // Revisar cada minuto
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
    this.checkEvents(); // Revisar inmediatamente al iniciar
    this.checkInterval = window.setInterval(() => this.checkEvents(), this.CHECK_FREQUENCY);
    console.log('Monitoreo de eventos iniciado');
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
      const eventDate = new Date(event.start);

      // Verificar cada tiempo de alerta configurado
      for (const alertTime of settingsStore.notificationSettings.alertTimes) {
        const alertDate = addMinutes(eventDate, -alertTime.minutes);

        // Si estamos dentro del minuto de la alerta
        if (this.isWithinMinute(now, alertDate)) {
          const timeRemaining = alertTime.minutes;
          const message = this.createAlertMessage(event.title, timeRemaining);

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

          console.log(`Notificación enviada para evento: ${event.title}`);
        }
      }
    }
  }

  private isWithinMinute(date1: Date, date2: Date): boolean {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return diff < 60000; // Diferencia menor a un minuto
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
