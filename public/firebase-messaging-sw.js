/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
/* global importScripts, firebase, self */

// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Your Firebase config (same as in firebase.js)
firebase.initializeApp({
  apiKey: "AIzaSyBKrcqWPUsIYlqnJRz3QnvBVhRKbgN4StE",
  authDomain: "task-manager-3cc13.firebaseapp.com",
  projectId: "task-manager-3cc13",
  storageBucket: "task-manager-3cc13.appspot.com",
  messagingSenderId: "839409395329",
  appId: "1:839409395329:web:5ca643850ab9c6edbbcf80"
});

// Initialize messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/icon-192x192.png" // Optional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
