// Helpers for the Projects view.
//
// A "project" is just a work-category task seen through a different lens:
// its subtasks are the what's-left-to-do list, and three extra fields
// describe where the project as a whole stands:
//
//   projectState  "active" | "waiting" | "blocked"  (done comes from status)
//   dueDate       "YYYY-MM-DD" — a deadline, or a follow-up date when waiting
//   waitingFor    what/who the project is waiting on, or what is blocking it
//
// The "next action" is deliberately NOT a stored field: it's whichever
// subtask is already started, otherwise the first unfinished one. That way
// it can never go stale, and re-prioritising is just moving a subtask up.

export const PROJECT_STATES = ["active", "waiting", "blocked", "done"];

export const PROJECT_STATE_LABELS = {
  active: "Active",
  waiting: "Waiting",
  blocked: "Blocked",
  done: "Done",
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Local YYYY-MM-DD, so due dates compare as plain calendar days with no
// timezone arithmetic anywhere.
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDaysISO(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + days);
  return todayISO(date);
}

export function formatDueDate(dueDate, today = todayISO()) {
  if (!dueDate) return "";
  const [y, m, d] = dueDate.split("-").map(Number);
  const sameYear = String(y) === today.slice(0, 4);
  return `${MONTHS[m - 1]} ${d}${sameYear ? "" : ` ${y}`}`;
}

// Projects created before this view existed have no projectState, so fall
// back to what their classic task status implies.
export function getProjectState(task) {
  if (task.status === "done") return "done";
  if (PROJECT_STATES.includes(task.projectState)) return task.projectState;
  return task.status === "on-hold" ? "waiting" : "active";
}

// The single thing to do next: whatever is already started, otherwise the
// first unfinished subtask. Everything after it is "upcoming".
export function getNextAction(task) {
  const subs = task.subTasks || [];
  const started = subs.findIndex((s) => !s.done && s.inProgress);
  const index = started !== -1 ? started : subs.findIndex((s) => !s.done);
  if (index === -1) return null;
  return { ...subs[index], index };
}

export function getProgress(task) {
  const subs = task.subTasks || [];
  const done = subs.filter((s) => s.done).length;
  return { done, total: subs.length, percent: subs.length ? (done / subs.length) * 100 : 0 };
}

// "Needs action" means it needs *you*, specifically: an active project with
// nothing left to do needs you to decide the next step (or close it), and a
// blocked one needs you to clear the blocker. Waiting is somebody else's move.
export function needsAction(task) {
  const state = getProjectState(task);
  if (state === "blocked") return true;
  return state === "active" && !getNextAction(task);
}

export function isOverdue(task, today = todayISO()) {
  if (!task.dueDate || getProjectState(task) === "done") return false;
  return task.dueDate < today;
}

export function isDueToday(task, today = todayISO()) {
  if (!task.dueDate || getProjectState(task) === "done") return false;
  return task.dueDate === today;
}

// Short human label for the "When" column. Waiting projects get a
// "Follow up" prefix, because that date isn't a deadline — it's a reminder
// to chase whoever you're waiting on.
export function getDueLabel(task, today = todayISO()) {
  if (!task.dueDate) return null;
  if (isOverdue(task, today)) return `Overdue · ${formatDueDate(task.dueDate, today)}`;

  const prefix = getProjectState(task) === "waiting" ? "Follow up " : "";
  if (task.dueDate === today) return `${prefix}Today`;
  if (task.dueDate === addDaysISO(today, 1)) return `${prefix}Tomorrow`;
  return `${prefix}${formatDueDate(task.dueDate, today)}`;
}

export function summarizeProjects(tasks, today = todayISO()) {
  const summary = {
    active: 0,
    waiting: 0,
    blocked: 0,
    done: 0,
    needAction: 0,
    overdue: 0,
  };

  tasks.forEach((task) => {
    summary[getProjectState(task)] += 1;
    if (needsAction(task)) summary.needAction += 1;
    if (isOverdue(task, today)) summary.overdue += 1;
  });

  return summary;
}

// Lower rank = louder: anything late or stuck comes before work that is
// simply in flight, and anything waiting on someone else sinks to the
// bottom because it isn't your move.
export function getUrgencyRank(task, today = todayISO()) {
  const state = getProjectState(task);
  if (state === "done") return 6;
  if (isOverdue(task, today)) return 0;
  if (state === "blocked") return 1;
  if (state === "waiting") return 5;
  if (!getNextAction(task)) return 2; // active but out of defined work
  if (task.dueDate) return 3;
  return 4;
}

export function compareProjects(a, b, today = todayISO()) {
  const byRank = getUrgencyRank(a, today) - getUrgencyRank(b, today);
  if (byRank !== 0) return byRank;

  // Within a rank: soonest date first, dated before undated.
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;

  return (a.title || "").localeCompare(b.title || "");
}

// The 2-3 things worth looking at the moment the app opens.
export function getFocusItems(tasks, { limit = 3, today = todayISO() } = {}) {
  return tasks
    .filter((task) => getProjectState(task) !== "done")
    .sort((a, b) => compareProjects(a, b, today))
    .slice(0, limit);
}
