// Shared helpers for reasoning about a task's timer deadline.

export function getTimerEndMs(task) {
  if (!task.timerStart || !task.timerDuration) return null;
  const start =
    task.timerStart?.toMillis?.() || new Date(task.timerStart).getTime();
  return start + task.timerDuration;
}

// True while a task's timer has run out and it's still open — i.e. an
// unaddressed, currently-overdue task.
export function isTimerMissed(task) {
  const endMs = getTimerEndMs(task);
  if (endMs == null) return false;
  return task.status !== "done" && Date.now() > endMs;
}

// Call this when a task's status is about to become "done". Returns
// "on-time" / "missed" to persist as task.timerOutcome, or null if the
// task never had a timer (don't touch the field).
export function getCompletionTimerOutcome(task) {
  const endMs = getTimerEndMs(task);
  if (endMs == null) return null;
  return Date.now() > endMs ? "missed" : "on-time";
}
