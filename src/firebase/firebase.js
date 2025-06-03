// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { getMessaging } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBKrcqWPUsIYlqnJRz3QnvBVhRKbgN4StE",
  authDomain: "task-manager-3cc13.firebaseapp.com",
  projectId: "task-manager-3cc13",
  storageBucket: "task-manager-3cc13.firebasestorage.app",
  messagingSenderId: "839409395329",
  appId: "1:839409395329:web:5ca643850ab9c6edbbcf80"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
const db = getFirestore(app);
const auth = getAuth(app);
const messaging = getMessaging(app);

// Export
export { db, auth, messaging };
