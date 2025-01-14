import { ref, onMounted, onUnmounted } from 'vue';
import { useNotificationStore } from '../stores/notificationStore';
import { NotificationService } from '../services/NotificationService';
export function useAlertSystem() {
    const checkInterval = ref(null);
    const notificationStore = useNotificationStore();
    const notificationService = NotificationService.getInstance();
    onMounted(async () => {
        await notificationService.requestNotificationPermission();
        notificationService.startMonitoring();
        checkInterval.value = window.setInterval(() => {
            const now = new Date();
            const currentTime = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            });
            const shouldNotify = notificationStore.settings.alertTimes.some(alert => alert.time === currentTime);
            if (shouldNotify) {
                notificationService.testNotification();
            }
        }, 60000);
    });
    onUnmounted(() => {
        if (checkInterval.value) {
            clearInterval(checkInterval.value);
        }
        notificationService.stopMonitoring();
    });
    return {
        requestNotificationPermission: () => notificationService.requestNotificationPermission(),
        getPermissionStatus: () => Notification.permission
    };
}
