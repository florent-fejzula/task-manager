import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { ChevronDown, ChevronUp, ArrowUp } from "lucide-react";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useSubtasks } from "../hooks/useSubtasks";
import TaskHeader from "../components/TaskHeader";
import { getCompletionTimerOutcome } from "../utils/timerStatus";
import {
  PROJECT_STATES,
  PROJECT_STATE_LABELS,
  getDueLabel,
  getNextAction,
  getProgress,
  getProjectState,
  isOverdue,
  todayISO,
} from "../utils/projects";

// The classic task statuses still back the project states, so the rest of
// the app (task list, recurring spawner, notifications) keeps working
// unchanged for these documents.
const STATE_TO_STATUS = {
  active: "in-progress",
  waiting: "on-hold",
  blocked: "on-hold",
  done: "done",
};

const STATE_BUTTON_STYLES = {
  active: "bg-green-600 border-green-600 text-white",
  waiting: "bg-amber-500 border-amber-500 text-white",
  blocked: "bg-red-600 border-red-600 text-white",
  done: "bg-gray-700 border-gray-700 text-white",
};

function ProjectDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { taskMap } = useData();

  const [task, setTask] = useState(taskMap[id] || null);
  const [loading, setLoading] = useState(!taskMap[id]);
  const [showDone, setShowDone] = useState(false);
  const [waitingDraft, setWaitingDraft] = useState("");

  const taskRef = useMemo(
    () => (currentUser ? doc(db, "users", currentUser.uid, "tasks", id) : null),
    [currentUser, id]
  );

  useEffect(() => {
    if (!taskRef) return;
    const unsub = onSnapshot(taskRef, (snap) => {
      setTask(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    });
    return () => unsub();
  }, [taskRef]);

  const waitingFor = task?.waitingFor;
  useEffect(() => setWaitingDraft(waitingFor || ""), [waitingFor]);

  const { toggleSubTask, deleteSubTask, addSubTask, promoteSubTask } = useSubtasks(
    taskRef,
    task?.subTasks,
    (updated) => setTask((prev) => (prev ? { ...prev, subTasks: updated } : prev))
  );

  if (loading) return <p className="mt-8 text-center text-sm text-gray-500">Loading…</p>;
  if (!task) return <p className="mt-8 text-center text-sm text-gray-500">Project not found.</p>;

  const today = todayISO();
  const state = getProjectState(task);
  const next = getNextAction(task);
  const { done, total, percent } = getProgress(task);
  const dueLabel = getDueLabel(task, today);
  const late = isOverdue(task, today);

  const subs = task.subTasks || [];
  const withIndex = subs.map((sub, index) => ({ ...sub, index }));
  const upcoming = withIndex.filter((sub) => !sub.done && sub.index !== next?.index);
  const completed = withIndex.filter((sub) => sub.done);

  const patch = async (updates) => {
    await updateDoc(taskRef, updates);
    setTask((prev) => ({ ...prev, ...updates }));
  };

  const handleStateChange = async (nextState) => {
    if (nextState === state) return;
    const updates = { status: STATE_TO_STATUS[nextState] };

    if (nextState === "done") {
      // Mirrors the classic status change: record the timer outcome and
      // clear the timer so a closed project can't fire a stale reminder.
      const outcome = getCompletionTimerOutcome(task);
      if (outcome) {
        updates.timerOutcome = outcome;
        updates.timerStart = null;
        updates.timerDuration = null;
        updates.notified15min = null;
      }
    } else {
      updates.projectState = nextState;
      // Whatever it was waiting on is stale once it's your move again.
      if (nextState === "active") updates.waitingFor = null;
    }

    await patch(updates);
  };

  const handleAddSubTask = async (e) => {
    e.preventDefault();
    const input = e.target.elements.newStep;
    const title = input.value.trim();
    if (!title) return;
    await addSubTask(title);
    input.value = "";
  };

  return (
    <div className="mx-auto mt-6 max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Projects
        </Link>
        <span className="text-xs text-gray-400">Project</span>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        {/* TaskHeader writes the title itself — this only mirrors it locally. */}
        <TaskHeader
          task={task}
          taskRef={taskRef}
          onUpdate={(updates) => setTask((prev) => ({ ...prev, ...updates }))}
        />

        {/* State */}
        <div className="mb-5 flex flex-wrap gap-2">
          {PROJECT_STATES.map((option) => (
            <button
              key={option}
              onClick={() => handleStateChange(option)}
              className={`rounded-full border px-3 py-1 text-sm transition ${
                state === option
                  ? STATE_BUTTON_STYLES[option]
                  : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
              }`}
            >
              {PROJECT_STATE_LABELS[option]}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-5">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span className="tabular-nums">
              {done}/{total}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-accent/60"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* When */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">
            {state === "waiting" ? "Follow up" : "Deadline"}
          </label>
          <input
            type="date"
            value={task.dueDate || ""}
            onChange={(e) => patch({ dueDate: e.target.value || null })}
            className="flex-1 min-w-[150px] rounded border border-gray-300 px-2 py-1 text-sm"
          />
          {task.dueDate && (
            <button
              onClick={() => patch({ dueDate: null })}
              className="text-xs text-gray-500 underline hover:text-gray-700"
            >
              Clear
            </button>
          )}
          {dueLabel && (
            <span
              className={`text-xs ${late ? "font-semibold text-red-600" : "text-gray-500"}`}
            >
              {dueLabel}
            </span>
          )}
        </div>

        {/* Waiting on / blocked by */}
        {(state === "waiting" || state === "blocked") && (
          <div className="mb-5">
            <label className="mb-1 block text-sm font-medium">
              {state === "waiting" ? "Waiting for" : "Blocked by"}
            </label>
            <input
              type="text"
              value={waitingDraft}
              onChange={(e) => setWaitingDraft(e.target.value)}
              onBlur={() => patch({ waitingFor: waitingDraft.trim() || null })}
              placeholder={
                state === "waiting" ? "Contract signature" : "What's in the way?"
              }
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-accent"
            />
          </div>
        )}

        {/* Next */}
        <div className="mb-5">
          <h3 className="mb-2 text-[11px] uppercase tracking-wide text-gray-400">
            Next
          </h3>
          {next ? (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
              <input
                type="checkbox"
                checked={false}
                onChange={() => toggleSubTask(next.index)}
                className="h-4 w-4"
              />
              <span
                className={`flex-grow font-medium ${
                  next.inProgress ? "italic text-blue-700" : ""
                }`}
              >
                {next.title}
              </span>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800">
              ⚠ Nothing left to do — add the next step, or mark this project Done.
            </div>
          )}
        </div>

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <div className="mb-5">
            <h3 className="mb-2 text-[11px] uppercase tracking-wide text-gray-400">
              Upcoming ({upcoming.length})
            </h3>
            <ul className="space-y-1">
              {upcoming.map((sub) => (
                <li key={sub.index} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => toggleSubTask(sub.index)}
                  />
                  <span
                    className={`flex-grow ${
                      sub.inProgress ? "italic text-blue-600" : "text-primary"
                    }`}
                  >
                    {sub.title}
                  </span>
                  <button
                    onClick={() => promoteSubTask(sub.index)}
                    title="Make this the next action"
                    className="text-gray-300 hover:text-accent"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    onClick={() => deleteSubTask(sub.index)}
                    className="text-lg text-gray-300 hover:text-red-400"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleAddSubTask} className="mb-5 flex items-center gap-2">
          <input
            type="text"
            name="newStep"
            placeholder="Add next step..."
            className="flex-grow rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-accent"
          />
          <button
            type="submit"
            className="rounded-md bg-accent px-4 py-2 text-sm text-white hover:bg-accent-dark"
          >
            Add
          </button>
        </form>

        {/* Done */}
        {completed.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <div
              className="flex cursor-pointer select-none items-center justify-between"
              onClick={() => setShowDone((prev) => !prev)}
            >
              <span className="font-serif text-sm italic tracking-wide text-gray-700">
                Done ({completed.length})
              </span>
              {showDone ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {showDone && (
              <ul className="mt-2 space-y-1">
                {completed.map((sub) => (
                  <li key={sub.index} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked
                      onChange={() => toggleSubTask(sub.index)}
                    />
                    <span className="flex-grow text-gray-400 line-through">
                      {sub.title}
                    </span>
                    <button
                      onClick={() => deleteSubTask(sub.index)}
                      className="text-lg text-gray-300 hover:text-red-400"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link to={`/task/${task.id}`} className="text-xs text-gray-500 underline">
          Timers, priority, recurring & delete → classic view
        </Link>
      </div>
    </div>
  );
}

export default ProjectDetail;
