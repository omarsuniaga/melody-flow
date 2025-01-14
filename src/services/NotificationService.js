import { useEventStore } from '../stores/eventStore';
import { addMinutes, isWithinInterval, parseISO } from 'date-fns';
import { notificationConfig } from '../config/notification';
import { useSettingsStore } from '../stores/settingsStore';
export class NotificationService {
    static instance;
    customAudioUrl = null;
    eventStore = useEventStore();
    checkInterval = null;
    NOTIFICATION_THRESHOLD = 30; // minutos antes del evento
    finalAlarm = null;
    constructor() {
        this.requestNotificationPermission();
    }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    // Hacemos público el método de solicitud de permisos
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.warn('Este navegador no soporta notificaciones de escritorio');
            return false;
        }
        if (Notification.permission === 'granted') {
            return true;
        }
        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }
    // Método estático para obtener el estado actual del permiso
    static getPermissionStatus() {
        return Notification.permission;
    }
    setCustomAudioUrl(url) {
        this.customAudioUrl = url;
    }
    startMonitoring() {
        // Verificar eventos cada minuto
        this.checkInterval = window.setInterval(() => {
            this.checkUpcomingEvents();
        }, 60000); // 60000ms = 1 minuto
    }
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }
    async checkUpcomingEvents() {
        const now = new Date();
        const events = this.eventStore.events;
        const settingsStore = useSettingsStore();
        const alertTimes = settingsStore.notificationSettings.alertTimes;
        events.forEach(event => {
            const eventDate = parseISO(`${event.date}T${event.time}`);
            // Verificar cada tiempo de alerta configurado
            alertTimes.forEach(minutes => {
                const notificationTime = addMinutes(eventDate, -minutes);
                // Verificar si estamos dentro del intervalo de notificación
                if (isWithinInterval(now, {
                    start: notificationTime,
                    end: addMinutes(notificationTime, 1)
                })) {
                    this.sendNotification(event, minutes.minutes);
                }
            });
        });
    }
    async playNotificationSound() {
        const settingsStore = useSettingsStore();
        if (!settingsStore.notificationSettings.sound)
            return;
        try {
            // Intentar primero con el audio personalizado si existe
            if (this.customAudioUrl) {
                const customAudio = new Audio(this.customAudioUrl);
                try {
                    await customAudio.play();
                    return;
                }
                catch (error) {
                    console.warn('Error reproduciendo audio personalizado, usando audio por defecto:', error);
                }
            }
            // Si no hay audio personalizado o falló, usar el audio por defecto
            const defaultAudio = new Audio(notificationConfig.defaultSound); // Cambiamos a defaultSound
            await defaultAudio.play();
        }
        catch (error) {
            console.warn('Error reproduciendo sonido:', error);
            this.playSystemBeep(); // Último recurso: beep del sistema
        }
    }
    playSystemBeep() {
        try {
            // Crear un oscillator para generar un beep
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            oscillator.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Frecuencia del beep
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1); // Duración del beep: 100ms
        }
        catch (error) {
            console.warn('No se pudo reproducir el beep del sistema:', error);
        }
    }
    async sendNotification(event, minutesBefore) {
        const settingsStore = useSettingsStore();
        const alertTime = settingsStore.notificationSettings.alertTimes
            .find(alert => alert.minutes === minutesBefore);
        if (!alertTime || !alertTime.enabled)
            return;
        const hasPermission = await this.requestNotificationPermission();
        if (!hasPermission)
            return;
        try {
            const isFinalAlert = alertTime.type === 'final';
            // Configurar notificación
            const notificationOptions = {
                body: this.getNotificationBody(event, minutesBefore, isFinalAlert),
                icon: notificationConfig.icon,
                tag: `event-${event.id}-${minutesBefore}`,
                requireInteraction: true,
                silent: false
            };
            if (settingsStore.notificationSettings.vibration) {
                notificationOptions.vibrate = isFinalAlert ?
                    [200, 100, 200, 100, 200] : // Vibración más intensa para alarma final
                    [200, 100, 200];
            }
            const notification = new Notification(isFinalAlert ? '¡ALERTA FINAL!' : 'Recordatorio de Evento', notificationOptions);
            // Manejar audio según tipo de alerta
            if (isFinalAlert) {
                await this.startFinalAlarm();
            }
            else {
                await this.playNotificationSound();
            }
            // Activar pantalla y LED
            if (settingsStore.notificationSettings.screen) {
                await this.wakeScreen();
            }
            if (settingsStore.notificationSettings.led) {
                this.flashLED(isFinalAlert);
            }
            notification.onclick = () => {
                if (isFinalAlert) {
                    this.stopFinalAlarm();
                }
                window.focus();
                window.location.href = `/calendar?event=${event.id}`;
            };
        }
        catch (error) {
            console.error('Error al enviar notificación:', error);
        }
    }
    getNotificationBody(event, minutesBefore, isFinalAlert) {
        if (isFinalAlert) {
            return `🚨 ¡ÚLTIMA ALARMA! 🚨\n${event.provider} - ${event.description}\n¡El evento comienza en ${minutesBefore} minutos!\nLugar: ${event.location}`;
        }
        const hours = Math.floor(minutesBefore / 60);
        const minutes = minutesBefore % 60;
        const timeText = hours > 0 ?
            `${hours} horas${minutes > 0 ? ` y ${minutes} minutos` : ''}` :
            `${minutes} minutos`;
        return `Faltan ${timeText} para el evento:\n${event.provider} - ${event.description}\nLugar: ${event.location}`;
    }
    async startFinalAlarm() {
        try {
            if (this.finalAlarm) {
                this.finalAlarm.pause();
            }
            this.finalAlarm = new Audio(useSettingsStore().notificationSettings.finalAlarmSound);
            this.finalAlarm.loop = true;
            await this.finalAlarm.play();
        }
        catch (error) {
            console.error('Error iniciando alarma final:', error);
        }
    }
    stopFinalAlarm() {
        if (this.finalAlarm) {
            this.finalAlarm.pause();
            this.finalAlarm = null;
        }
    }
    async wakeScreen() {
        try {
            if ('wakeLock' in navigator) {
                const wakeLock = await navigator.wakeLock.request('screen');
                wakeLock.addEventListener('release', () => {
                    console.log('Screen Wake Lock released:', wakeLock.released);
                });
            }
        }
        catch (error) {
            console.error('Error waking screen:', error);
        }
    }
    async flashLED(isFinalAlert = false) {
        if ('setAppBadge' in navigator) {
            if (isFinalAlert) {
                // Para la alarma final, hacer parpadear el LED
                const flashInterval = setInterval(() => {
                    navigator.setAppBadge(1);
                    setTimeout(() => navigator.clearAppBadge(), 500);
                }, 1000);
                // Detener el parpadeo después de 30 segundos
                setTimeout(() => clearInterval(flashInterval), 30000);
            }
            else {
                // Para notificaciones normales, solo encender una vez
                navigator.setAppBadge(1);
                setTimeout(() => navigator.clearAppBadge(), 3000);
            }
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
        };
        await this.sendNotification(testEvent, 0);
    }
    // Método para probar notificación programada
    async sendScheduledTestNotification() {
        const testEvent = {
            id: 'scheduled-test',
            provider: 'Test Provider',
            description: 'Esta es una notificación de prueba programada',
            location: 'Ubicación de Prueba',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0]
        };
        try {
            // Forzar todas las opciones de notificación para la prueba
            const settingsStore = useSettingsStore();
            const originalSettings = { ...settingsStore.notificationSettings };
            settingsStore.updateNotificationSettings({
                enabled: true,
                sound: true,
                vibration: true,
                screen: true,
                led: true
            });
            await this.sendNotification(testEvent, 0);
            // Restaurar configuración original
            settingsStore.updateNotificationSettings(originalSettings);
        }
        catch (error) {
            console.error('Error en notificación programada:', error);
            throw error;
        }
    }
}
