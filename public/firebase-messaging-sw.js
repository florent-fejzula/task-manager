/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
/* global importScripts, firebase, self */

// Import Firebase scripts
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// ✅ Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyBKrcqWPUsIYlqnJRz3QnvBVhRKbgN4StE",
  authDomain: "task-manager-3cc13.firebaseapp.com",
  projectId: "task-manager-3cc13",
  storageBucket: "task-manager-3cc13.appspot.com",
  messagingSenderId: "839409395329",
  appId: "1:839409395329:web:5ca643850ab9c6edbbcf80",
});

// ✅ Initialize messaging
const messaging = firebase.messaging();

// ✅ Handle background messages
messaging.onBackgroundMessage(function (payload) {
  console.log(
    "[firebase-messaging-sw.js] Background message received:",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icons/icon-192x192.png", // optional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Handle SKIP_WAITING message
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("📢 SKIP_WAITING received. Activating new service worker...");
    self.skipWaiting();
  }
});

self.addEventListener("install", () => {
  console.log("✅ Service Worker installed.");
});

self.addEventListener("activate", () => {
  console.log("✅ Service Worker activated.");
});
