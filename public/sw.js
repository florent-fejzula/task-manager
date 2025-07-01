/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

// ✅ Firebase imports for background messaging
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

// ✅ Handle background FCM messages
messaging.onBackgroundMessage(function (payload) {
  console.log("[sw.js] Background message received:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192.png",
  };

  console.log("🎉 Showing notification popup");
  console.log("🔥 ACTIVE SERVICE WORKER: sw.js loaded");
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Handle service worker lifecycle events
self.addEventListener("install", (event) => {
  console.log("✅ SW installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ SW activated");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("⏭ SKIP_WAITING received");
    self.skipWaiting();
  }
});
