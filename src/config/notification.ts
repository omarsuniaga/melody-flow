export const notificationConfig = {
  icon: '/favicon.ico',
  defaultSounds: [
    {
      name: 'Notificación Estándar',
      path: '/audios/notification-sound.mp3'
    },
    {
      name: 'Alarma de Alerta',
      path: '/audios/level-up-2-199574.mp3'
    },
    {
      name: 'Campana Suave',
      path: '/audios/level-up-3-199576.mp3'
    },
    {
      name: 'Alarma de Urgencia',
      path: '/audios/siren-alert-96052.mp3'
    }
  ],
  defaultSound: '/audios/notification-sound.mp3',
  sound: '/audios/notification-sound.mp3', // Agregamos esta línea para mantener compatibilidad
  defaultSettings: {
    timeThreshold: 30,
    enableSound: true,
    enableVibration: true,
    enableNotifications: true
  }
}
