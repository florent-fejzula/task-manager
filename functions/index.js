/* eslint-disable require-jsdoc */
/* eslint-disable indent */
/* eslint-disable max-len */
const functions = require("firebase-functions");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");

// ✅ Initialize admin only once
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const messaging = admin.messaging();

// ✅ Manual test push
exports.testPush = functions.https.onRequest(async (req, res) => {
  try {
    const testUserId = "J89IeSZy3nMy9J3adoGMv2eUr7S2"; // your UID
    const tokenSnap = await db
      .collection("users")
      .doc(testUserId)
      .collection("tokens")
      .get();

    const tokens = tokenSnap.docs.map((t) => t.id.split(":")[1] || t.id);
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

    await messaging.sendEachForMulticast({tokens, ...payload});
    return res.status(200).send("✅ Notification sent!");
  } catch (error) {
    console.error("🔥 Error sending test notification:", error);
    return res.status(500).send(`🔥 Error: ${error.message}`);
  }
});

// ✅ 15-minute timer notifications
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

      promises.push(
        db
          .collection("users")
          .doc(userId)
          .collection("tokens")
          .get()
          .then((tokenSnap) => {
            const tokens = tokenSnap.docs.map(
              (t) => t.id.split(":")[1] || t.id,
            );
            if (tokens.length === 0) return;

            const message = {
              tokens,
              notification: {
                title: "⏰ 15 Minutes Left!",
                body: `Your task "${task.title}" is running out of time.`,
              },
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

exports.handleRecurringTasks = onSchedule("every 5 minutes", async () => {
  console.log("▶️ handleRecurringTasks triggered");

  const TZ = "Europe/Skopje";
  const TARGET_HOUR = 14; // Change to 19 for testing
  const TARGET_MIN = 0;

  // Return Skopje-local timestamp for today’s target (e.g., 08:00)
  function todayTargetMs() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const get = (t) => parts.find((p) => p.type === t).value;
    const y = +get("year");
    const m = +get("month");
    const d = +get("day");

    const probe = new Date(Date.UTC(y, m - 1, d, TARGET_HOUR, TARGET_MIN));
    const localProbe = new Date(probe.toLocaleString("en-US", {timeZone: TZ}));
    const offset = localProbe.getTime() - probe.getTime();
    const utcMs = Date.UTC(y, m - 1, d, TARGET_HOUR, TARGET_MIN) - offset;

    return utcMs;
  }

  const now = Date.now();
  const targetMs = todayTargetMs();
  console.log(
    `🕗 Skopje target today = ${new Date(targetMs).toLocaleString("en-GB", {
      timeZone: TZ,
    })} | UTC = ${new Date(targetMs).toISOString()}`,
  );

  try {
    const snap = await db
      .collectionGroup("tasks")
      .where("recurring", "==", true)
      .get();

    console.log("📦 Found recurring tasks:", snap.size);

    for (const docSnap of snap.docs) {
      const task = docSnap.data();
      if (!["done", "closed"].includes(task.status)) continue;

      const intervalDays = Number(task.recurringInterval) || 0;
      if (intervalDays <= 0) continue;

      const lastRaw =
        task.lastOccurrence ||
        (task.createdAt?.toMillis ? task.createdAt.toMillis() : task.createdAt);
      const lastMs = typeof lastRaw === "number" ? lastRaw : null;
      if (!lastMs) continue;

      const daysSince = (now - lastMs) / (1000 * 60 * 60 * 24);
      const closedBeforeTodayTarget = lastMs < targetMs;

      if (now >= targetMs && (daysSince >= intervalDays || closedBeforeTodayTarget)) {
        console.log("✅ Spawning new occurrence for:", task.title);

        const skDateLabel = new Intl.DateTimeFormat("en-US", {
          timeZone: TZ,
          month: "short",
          day: "numeric",
          year: "numeric",
        }).format(new Date());

        const newDoc = {
          title: `${task.title} (${skDateLabel})`,
          status: "in-progress",
          priority: task.priority || "medium",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          subTasks: Array.isArray(task.subTasks) ?
            task.subTasks.map((s) => ({
                title: s.title,
                done: false,
                inProgress: false,
              })) :
            [],
          comment: task.comment || "",
          recurring: false,
          recurringInterval: null,
          lastOccurrence: null,
        };

        const parent = docSnap.ref.parent;
        await parent.add(newDoc);
        await docSnap.ref.update({lastOccurrence: now});
      } else {
        console.log(
          `⏭️ Skipping ${task.title} (daysSince=${daysSince.toFixed(
            2,
          )}, now<target=${now < targetMs}, closedBeforeTarget=${closedBeforeTodayTarget})`,
        );
      }
    }

    console.log("✅ handleRecurringTasks completed");
    return null;
  } catch (err) {
    console.error("🔥 Error in handleRecurringTasks:", err);
    throw err;
  }
});

// ✅ Test scheduler
exports.testScheduler = onSchedule("every 5 minutes", async () => {
  const now = new Date().toLocaleString("en-GB", {timeZone: "Europe/Skopje"});
  console.log("🕐 testScheduler fired at:", now);
  return null;
});
