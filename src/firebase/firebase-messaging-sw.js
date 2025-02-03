/* eslint-env serviceworker */
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
import { firebaseConfig } from './firebase/config.ts'; // Importa la configuración

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);


// Maneja mensajes en segundo plano
onBackgroundMessage(messaging, (payload) => {
    console.log('Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/firebase-logo.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
