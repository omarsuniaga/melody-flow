export const notificationConfig = {
  icon: '/notification-icon.png', // Asegúrate de añadir este ícono en la carpeta public
  sound: '/notification-sound.mp3', // Asegúrate de añadir este sonido en la carpeta public
  defaultSettings: {
    timeThreshold: 30, // minutos antes del evento
    enableSound: true,
    enableVibration: true,
    enableNotifications: true
  }
}
