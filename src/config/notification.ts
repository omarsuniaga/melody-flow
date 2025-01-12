export const notificationConfig = {
  icon: '/favicon.ico',
  sound: '/audios/notification-sound.mp3', // Actualizada la ruta al audio existente
  defaultSound: '/audios/notification-sound.mp3', // Usamos el mismo como respaldo
  defaultSettings: {
    timeThreshold: 30,
    enableSound: true,
    enableVibration: true,
    enableNotifications: true
  }
}
