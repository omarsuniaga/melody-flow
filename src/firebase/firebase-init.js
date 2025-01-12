// Importa y configura Firebase
import { getToken, onMessage } from 'firebase/messaging';
import { messaging, auth } from './config.ts'; // Importa la configuración

// Función para solicitar permiso de notificaciones
async function requestNotificationPermission() {
    try {
        // Verificar si el usuario está autenticado
        if (!auth.currentUser) {
            throw new Error('Usuario no autenticado');
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            await getRegistrationToken();
        } else {
            console.log('Unable to get permission to notify.');
        }
    } catch (error) {
        console.error('Error al solicitar permiso:', error);
    }
}

// Función para obtener el token de registro
async function getRegistrationToken() {
    try {
        // Asegúrate de que la VAPID key esté correctamente formateada
        const vapidKey =  import.meta.env.VITE_FIREBASE_VAPIDKEY;
        if (!vapidKey) {
            throw new Error('VAPID key no encontrada en las variables de entorno');
        }

        const currentToken = await getToken(messaging, { vapidKey });
        if (currentToken) {
            console.log('Token:', currentToken);
            await sendTokenToServer(currentToken);
        } else {
            console.log('No registration token available.');
        }
    } catch (error) {
        console.error('Error al obtener el token:', error);
    }
}

// Función para enviar el token al servidor
async function sendTokenToServer(token) {
    // Implementa la lógica para enviar el token al servidor
    console.log('Sending token to server...', token);
    // Ejemplo:
    // fetch('/api/save-token', {
    //     method: 'POST',
    //     body: JSON.stringify({ token }),
    //     headers: {
    //         'Content-Type': 'application/json'
    //     }
    // });
}

// Maneja mensajes entrantes
onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    // Personaliza la notificación aquí
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/firebase-logo.png'
    };

    if (Notification.permission === 'granted') {
        new Notification(notificationTitle, notificationOptions);
    }
});

// Solo solicitar permiso cuando el usuario esté autenticado
auth.onAuthStateChanged((user) => {
    if (user) {
        requestNotificationPermission();
    }
});
