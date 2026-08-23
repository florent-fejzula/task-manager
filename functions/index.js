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

    // The Firestore doc ID IS the full FCM token (see requestPermission.js) —
    // it must be sent as-is, not split apart.
    const tokens = tokenSnap.docs.map((t) => t.id);
    if (tokens.length === 0) {
      console.log("❌ No tokens found.");
      return res.status(404).send("❌ No FCM tokens found.");
    }

    // data-only, not `notification` — a top-level `notification` field gets
    // auto-displayed by the browser/OS on top of our own showNotification()
    // call in sw.js, producing duplicate notifications. Data-only messages
    // give us the only call that ever displays anything.
    const payload = {
      data: {
        title: "🚀 Test Push",
        body: "This is a test push notification from Cloud Functions.",
      },
    };

    const result = await messaging.sendEachForMulticast({tokens, ...payload});
    const failures = result.responses
      .map((r, i) => ({r, token: tokens[i]}))
      .filter(({r}) => !r.success)
      .map(({r, token}) => `${token.slice(0, 12)}...: ${r.error?.code}`);

    console.log(`✅ ${result.successCount}/${tokens.length} sent.`, failures);
    return res
      .status(200)
      .send(
        `✅ Sent to ${result.successCount}/${tokens.length} tokens.` +
          (failures.length ? ` Failures: ${failures.join("; ")}` : ""),
      );
  } catch (error) {
    console.error("🔥 Error sending test notification:", error);
    return res.status(500).send(`🔥 Error: ${error.message}`);
  }
});

// ✅ 15-minute timer notifications
exports.send15MinuteNotification = onSchedule("every 1 minutes", async () => {
  const now = Date.now();
  // Only scan tasks that actually have a timer running, instead of every
  // task document for every user (requires the timerStart field-override
  // index in firestore.indexes.json).
  const snapshot = await db.collectionGroup("tasks").where("timerStart", ">", 0).get();

  const promises = [];

  snapshot.forEach((doc) => {
    const task = doc.data();
    const {timerStart, timerDuration, notified15min} = task;
    // Marking a task done doesn't clear its timer fields, so a task closed
    // well before its deadline can still sit there with a stale
    // timerStart/timerDuration — without this check, this function would
    // fire a "15 minutes left" notification hours later once real time
    // catches up to that window, for a task that's long since closed.
    if (!timerStart || !timerDuration || notified15min || task.status === "done") return;

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
            // Doc ID IS the full FCM token — send as-is.
            const tokens = tokenSnap.docs.map((t) => t.id);
            if (tokens.length === 0) return;

            // data-only — see note in testPush about why.
            const message = {
              tokens,
              data: {
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

// If this many previously-spawned occurrences of a recurring task are still
// sitting untouched (status still "in-progress" — never closed, never
// changed), the task auto-pauses instead of continuing to spawn more. This
// is what should have caught a daily task that ran unnoticed for ~10
// months: nobody was responding to the spawned copies, but it kept
// generating new ones anyway. The user gets a push notification when it
// pauses and can re-enable it from the task to keep going.
const MAX_UNADDRESSED_RECUR_BACKLOG = 5;

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

      if (now >= targetMs && daysSince >= intervalDays) {
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
          // Links this spawned copy back to the recurring template, so we
          // can tell how big its unaddressed backlog is.
          recurringSourceId: docSnap.id,
        };

        const parent = docSnap.ref.parent;
        await parent.add(newDoc);

        const occurrenceCount = (Number(task.recurringOccurrenceCount) || 0) + 1;
        const templateUpdate = {
          lastOccurrence: now,
          recurringOccurrenceCount: occurrenceCount,
        };

        // Count spawned copies (including the one we just created) that
        // are still sitting at their default status — i.e. nobody has
        // closed them, reopened them, or otherwise touched them at all.
        const backlogSnap = await parent
          .where("recurringSourceId", "==", docSnap.id)
          .where("status", "==", "in-progress")
          .get();
        const unaddressedCount = backlogSnap.size;

        const shouldAutoPause = unaddressedCount >= MAX_UNADDRESSED_RECUR_BACKLOG;
        if (shouldAutoPause) {
          templateUpdate.recurring = false;
          templateUpdate.recurringPausedAt = now;
          templateUpdate.recurringPausedReason =
            `Auto-paused: ${unaddressedCount} spawned occurrences in a row are still ` +
            "untouched. Catch up on them, then reopen this task and re-enable Recurring.";
          console.log(
            `⏸️ Auto-pausing recurring task "${task.title}" — ${unaddressedCount} untouched occurrences`,
          );
        }

        await docSnap.ref.update(templateUpdate);

        if (shouldAutoPause) {
          const userId = docSnap.ref.parent.parent?.id;
          if (userId) {
            try {
              const tokenSnap = await db
                .collection("users")
                .doc(userId)
                .collection("tokens")
                .get();
              // Doc ID IS the full FCM token — send as-is.
              const tokens = tokenSnap.docs.map((t) => t.id);
              if (tokens.length > 0) {
                // data-only — see note in testPush about why.
                await messaging.sendEachForMulticast({
                  tokens,
                  data: {
                    title: "🔁 Recurring task paused",
                    body: `"${task.title}" auto-paused: ${unaddressedCount} spawned occurrences in a row are untouched. Catch up, then reopen it to resume.`,
                  },
                });
              }
            } catch (notifyErr) {
              console.error("🔥 Error sending recurring-pause notification:", notifyErr);
            }
          }
        }
      } else {
        console.log(
          `⏭️ Skipping ${task.title} (daysSince=${daysSince.toFixed(
            2,
          )}, now<target=${now < targetMs})`,
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
