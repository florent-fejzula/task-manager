import { collection, getDocs, doc, setDoc } from "firebase/firestore";
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

    const tokenRef = doc(db, "users", userId, "tokens", token);
    const tokensRef = collection(db, "users", userId, "tokens");
    const existing = await getDocs(tokensRef);

    const alreadyExists = existing.docs.some(
      (docSnap) =>
        docSnap.id === token ||
        docSnap.data()?.userAgent === navigator.userAgent
    );

    if (!alreadyExists) {
      console.log("🟡 Saving new token with userAgent:", navigator.userAgent);
      await setDoc(tokenRef, {
        createdAt: Date.now(),
        userAgent: navigator.userAgent,
      });
      console.log("✅ Token saved to Firestore with userAgent.");
    } else {
      console.log("ℹ️ Token or device already registered.");
    }
  } catch (err) {
    console.error("🔥 Error getting FCM token:", err);
  }
};
