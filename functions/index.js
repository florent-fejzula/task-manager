/* eslint-disable indent */
/* eslint-disable max-len */
const functions = require("firebase-functions"); // ✅ 1st-gen base import
const {onSchedule} = require("firebase-functions/v2/scheduler"); // ✅ v2 scheduler is okay
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ✅ Updated testPush function using sendEachForMulticast
exports.testPush = functions.https.onRequest(async (req, res) => {
  try {
    const testUserId = "J89IeSZy3nMy9J3adoGMv2eUr7S2";
    const tokenSnap = await db
      .collection("users")
      .doc(testUserId)
      .collection("tokens")
      .get();

    const tokens = tokenSnap.docs.map((t) => t.id);

    if (tokens.length === 0) {
      console.log("❌ No tokens found.");
      return res.status(404).send("❌ No FCM tokens found.");
    }

    const payload = {
      notification: {
        title: "🚀 Test Push",
        body: "This is a test push notification from Cloud Functions.",
      },
    };

    const message = {
      tokens,
      ...payload,
    };

    const response = await messaging.sendEachForMulticast(message);
    console.log("✅ Notification sent:", response);
    return res.status(200).send("✅ Notification sent!");
  } catch (error) {
    console.error("🔥 Error sending test notification:", error);
    return res.status(500).send(`🔥 Error: ${error.message}`);
  }
});

// ✅ Updated 15-minute timer notification
exports.send15MinuteNotification = onSchedule("every 1 minutes", async () => {
  const now = Date.now();
  const snapshot = await db.collectionGroup("tasks").get();

  const promises = [];

  snapshot.forEach((doc) => {
    const task = doc.data();
    const {timerStart, timerDuration, notified15min} = task;

    if (!timerStart || !timerDuration || notified15min) return;

    const timeLeft = timerStart + timerDuration - now;

    if (timeLeft < 15 * 60 * 1000 && timeLeft > 13 * 60 * 1000) {
      const parentPath = doc.ref.parent.parent;
      if (!parentPath) return;

      const userId = parentPath.id;

      console.log("⏰ MATCHED TASK:");
      console.log("Title:", task.title);
      console.log("User ID:", userId);
      console.log("Time left (ms):", timeLeft);

      promises.push(
        db
          .collection("users")
          .doc(userId)
          .collection("tokens")
          .get()
          .then((tokenSnap) => {
            const tokens = tokenSnap.docs.map((t) => t.id);
            if (tokens.length === 0) return;

            console.log("📬 Found tokens:", tokens);

            const payload = {
              notification: {
                title: "⏰ 15 Minutes Left!",
                body: `Your task "${task.title}" is running out of time.`,
              },
            };

            const message = {
              tokens,
              ...payload,
            };

            return messaging
              .sendEachForMulticast(message)
              .then(() => doc.ref.update({notified15min: true}));
          }),
      );
    }
  });

  await Promise.all(promises);
  return null;
});
