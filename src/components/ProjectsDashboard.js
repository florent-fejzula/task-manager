import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import ProjectRow from "./ProjectRow";
import {
  compareProjects,
  getDueLabel,
  getFocusGroups,
  getNextAction,
  getProjectState,
  isFollowUpDue,
  isOverdue,
  summarizeProjects,
  todayISO,
} from "../utils/projects";

function StatTile({ label, value, tone }) {
  const toned = value > 0 && tone;
  const styles =
    toned === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : toned === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-gray-200 bg-white text-primary";

  return (
    <div className={`rounded-xl border px-3 py-2 ${styles}`}>
      <div className="text-xl font-semibold tabular-nums leading-tight">{value}</div>
      <div className="text-[11px] uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

// What to do right now, in three lines or fewer. Everything else on this
// screen is context; this is the answer to "I just opened the app".
function DoNextList({ projects, today }) {
  if (projects.length === 0) {
    return (
      <p className="py-2 text-sm text-gray-500">
        Nothing needs you right now — everything is waiting on someone else.
      </p>
    );
  }

  return (
    <ol className="divide-y divide-black/5">
      {projects.map((task, i) => {
        const state = getProjectState(task);
        const next = getNextAction(task);
        const dueLabel = getDueLabel(task, today);
        const late = isOverdue(task, today);

        let action;
        if (isFollowUpDue(task, today)) {
          action = `Chase: ${task.waitingFor || "follow up"}`;
        } else if (state === "blocked") {
          action = `Unblock${task.waitingFor ? `: ${task.waitingFor}` : ""}`;
        } else if (next) {
          action = next.title;
        } else {
          action = "Decide the next step";
        }

        return (
          <li key={task.id}>
            <Link
              to={`/project/${task.id}`}
              className="flex items-baseline gap-3 py-2 hover:opacity-80"
            >
              <span className="w-3 shrink-0 text-xs text-gray-400 tabular-nums">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] uppercase tracking-wide text-gray-400">
                  {task.title}
                </span>
                <span className="block truncate text-sm font-medium">
                  {action}
                </span>
              </span>
              {dueLabel && (
                <span
                  className={`shrink-0 text-xs ${
                    late ? "font-semibold text-red-600" : "text-gray-500"
                  }`}
                >
                  {dueLabel}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

// Not your move. Kept visibly separate so it reads as "safe to ignore"
// rather than as work you're failing to do.
function WaitingList({ projects, today }) {
  return (
    <ul className="divide-y divide-black/5">
      {projects.map((task) => (
        <li key={task.id}>
          <Link
            to={`/project/${task.id}`}
            className="flex items-baseline gap-3 py-2 hover:opacity-80"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] uppercase tracking-wide text-gray-400">
                {task.title}
              </span>
              <span className="block truncate text-sm text-gray-600">
                {task.waitingFor || "Waiting — what for?"}
              </span>
            </span>
            <span className="shrink-0 text-xs text-gray-500">
              {getDueLabel(task, today) || "No follow-up date"}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ProjectsDashboard({ projects }) {
  const [showDone, setShowDone] = useState(false);
  const today = todayISO();

  const open = projects
    .filter((task) => getProjectState(task) !== "done")
    .sort((a, b) => compareProjects(a, b, today));
  const done = projects.filter((task) => getProjectState(task) === "done");
  const summary = summarizeProjects(projects, today);
  const focus = getFocusGroups(projects, { limit: 3, today });

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
        No projects yet. Add a task in the Work category and it shows up here.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {open.length > 0 && (
        <section className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <h2 className="mb-1 font-serif text-lg italic text-accent">Do next</h2>
          <DoNextList projects={focus.doNext} today={today} />

          {focus.waiting.length > 0 && (
            <div className="mt-3 border-t border-black/5 pt-2">
              <h3 className="mb-1 text-[11px] uppercase tracking-wide text-gray-400">
                Waiting ({focus.waiting.length})
              </h3>
              <WaitingList projects={focus.waiting} today={today} />
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Active" value={summary.active} />
        <StatTile label="Waiting" value={summary.waiting} />
        <StatTile label="Blocked" value={summary.blocked} tone="red" />
        <StatTile label="Overdue" value={summary.overdue} tone="red" />
      </section>

      <section className="space-y-2">
        <h2 className="border-b border-black/5 pb-1 font-serif text-lg italic text-accent">
          Projects{" "}
          <span className="text-sm not-italic text-gray-400">({open.length})</span>
        </h2>
        {open.map((task) => (
          <ProjectRow key={task.id} task={task} today={today} />
        ))}
      </section>

      {done.length > 0 && (
        <section className="space-y-2">
          <div
            className="flex cursor-pointer items-center justify-between border-b border-black/5 pb-1 font-serif text-lg italic text-accent hover:opacity-80"
            onClick={() => setShowDone((prev) => !prev)}
          >
            <span>
              Done{" "}
              <span className="text-sm not-italic text-gray-400">({done.length})</span>
            </span>
            {showDone ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
          {showDone &&
            done.map((task) => <ProjectRow key={task.id} task={task} today={today} />)}
        </section>
      )}
    </div>
  );
}

export default ProjectsDashboard;
