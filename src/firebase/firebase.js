// src/firebase/firebase.js

// Core
import { initializeApp } from "firebase/app";

// Firestore
import {
  getFirestore,
  enableIndexedDbPersistence, // or enableMultiTabIndexedDbPersistence
} from "firebase/firestore";

// Auth
import { getAuth } from "firebase/auth";

// Messaging (PWA push)
import { getMessaging } from "firebase/messaging";

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBKrcqWPUsIYlqnJRz3QnvBVhRKbgN4StE",
  authDomain: "task-manager-3cc13.firebaseapp.com",
  projectId: "task-manager-3cc13",
  storageBucket: "task-manager-3cc13.firebasestorage.app",
  messagingSenderId: "839409395329",
  appId: "1:839409395329:web:5ca643850ab9c6edbbcf80",
};

// --- Initialize ---
const app = initializeApp(firebaseConfig);

// Services
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// --- Firestore Offline Persistence (cache) ---
// This makes reads instant from local cache and syncs in background.
enableIndexedDbPersistence(db).catch((e) => {
  // Ignore common cases: another tab already enabled it, or the browser doesn't support it.
  if (e?.code === "failed-precondition") {
    console.warn("Firestore persistence not enabled: another tab is open.");
  } else if (e?.code === "unimplemented") {
    console.warn("Firestore persistence not supported in this browser.");
  } else {
    console.warn("Firestore persistence error:", e);
  }
});

// Export
export { app, db, auth, messaging };
