// Firebase Messaging Service Worker for OperatSI Platform
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyD5lJpiUE6BkUGsKr5aAy0IbC-9ClzJHZg",
  authDomain: "operat-si.firebaseapp.com",
  projectId: "operat-si",
  storageBucket: "operat-si.firebasestorage.app",
  messagingSenderId: "635415731628",
  appId: "1:635415731628:web:2c69c8ffcb2ff2ea7d2e09",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || '[OperatSI] New Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New enterprise event occurred in your workspace.',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: payload.data?.category ? `operatsi_${payload.data.category}` : 'operatsi_general',
    data: payload.data || {},
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.actionUrl || '/inbox';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url && 'focus' in client) {
          client.navigate(actionUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});
