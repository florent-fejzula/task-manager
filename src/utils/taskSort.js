import { isTimerMissed, getTimerEndMs } from "./timerStatus";

const getPriorityWeight = (priority) =>
  priority === "high" ? 0 : priority === "medium" ? 1 : 2;

// Ordering within a status group: already-overdue tasks first, then tasks
// with an active timer soonest-remaining-first, then recurring tasks, then
// everything else — falling back to priority within a tier.
export function getSortBucket(task) {
  if (isTimerMissed(task)) return 0;
  const endMs = getTimerEndMs(task);
  if (endMs != null && endMs > Date.now()) return 1;
  if (task.recurring) return 2;
  return 3;
}

export function compareTasks(a, b) {
  const bucketA = getSortBucket(a);
  const bucketB = getSortBucket(b);
  if (bucketA !== bucketB) return bucketA - bucketB;

  if (bucketA === 1) {
    return getTimerEndMs(a) - getTimerEndMs(b);
  }

  return (
    getPriorityWeight(a.priority || "medium") -
    getPriorityWeight(b.priority || "medium")
  );
}
