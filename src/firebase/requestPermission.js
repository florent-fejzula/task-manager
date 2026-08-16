import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { messaging, db } from "./firebase";

export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("🚫 Notification permission not granted.");
      return;
    }

    console.log("✅ Notification permission granted.");

    const token = await getToken(messaging, {
      vapidKey:
        "BE0-osB5nIY4eFpOFNOdACGPHa-xc51R13V5jGILrdMbO3rIc-I-XZTYd0W7qjRwGtDswhP9jO9YKoDXne6-Ego", // already replaced
    });

    if (!token) {
      console.log("❌ No FCM token received.");
      return;
    }

    console.log("✅ FCM Token:", token);

    const tokensRef = collection(db, "users", userId, "tokens");
    const tokenRef = doc(tokensRef, token);
    const existingSnap = await getDoc(tokenRef);

    if (existingSnap.exists()) {
      console.log("ℹ️ This exact token is already registered.");
      return;
    }

    // No doc for this exact token — either first time on this device, or
    // FCM rotated the token since we last saved one. Either way, save it.
    console.log("🟡 Saving new token with userAgent:", navigator.userAgent);
    await setDoc(tokenRef, {
      createdAt: Date.now(),
      userAgent: navigator.userAgent,
    });
    console.log("✅ Token saved to Firestore with userAgent.");

    // Clean up any older, now-superseded tokens for this same device so
    // dead tokens don't pile up and get sent to on every notification.
    const staleQuery = query(tokensRef, where("userAgent", "==", navigator.userAgent));
    const staleSnap = await getDocs(staleQuery);
    const stale = staleSnap.docs.filter((d) => d.id !== token);
    if (stale.length > 0) {
      await Promise.all(stale.map((d) => deleteDoc(d.ref)));
      console.log(`🧹 Removed ${stale.length} stale token(s) for this device.`);
    }
  } catch (err) {
    console.error("🔥 Error getting FCM token:", err);
  }
};
