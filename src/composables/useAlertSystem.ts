import { ref, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '../stores/notificationStore'
import { NotificationService } from '../services/notificationService'  // Actualizada la importación

export function useAlertSystem() {
  const checkInterval = ref<number | null>(null)
  const notificationStore = useNotificationStore()

  function checkTime() {
    const now = new Date()
    const currentTime = now.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    })

    const shouldNotify = notificationStore.settings.alertTimes.some(
      alert => alert.time === currentTime
    )

    if (shouldNotify) {
      NotificationService.notifyUpcomingEvents(notificationStore.settings.soundEnabled)
    }
  }

  onMounted(() => {
    // Solicitar permisos al montar
    NotificationService.requestPermission()

    // Revisar cada minuto
    checkInterval.value = window.setInterval(checkTime, 60000)
  })

  onUnmounted(() => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
    }
  })

  return {
    requestNotificationPermission: NotificationService.requestPermission
  }
}
