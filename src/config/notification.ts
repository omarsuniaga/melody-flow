export const notificationConfig = {
  icon: '/favicon.ico',
  defaultSounds: [
    {
      name: 'Notificación Estándar',
      path: '/audios/notification-sound.mp3'
    },
    {
      name: 'Alarma de Alerta',
      path: '/audios/alert-sound.mp3'
    },
    {
      name: 'Campana Suave',
      path: '/audios/soft-bell.mp3'
    },
    {
      name: 'Alarma de Urgencia',
      path: '/audios/urgent-alarm.mp3'
    }
  ],
  defaultSound: '/audios/notification-sound.mp3',
  defaultSettings: {
    timeThreshold: 30,
    enableSound: true,
    enableVibration: true,
    enableNotifications: true
  }
}
