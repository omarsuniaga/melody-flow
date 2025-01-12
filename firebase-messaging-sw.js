importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAeuLu0NjTq9BQHpWsct-wTeVorw-Kj284",
  projectId: "apptividades-5b66f",
  messagingSenderId: "92553077594",
  appId: "1:92553077594:web:aedbc59c7dbff37ed00963"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
