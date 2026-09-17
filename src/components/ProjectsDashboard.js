import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import ProjectRow from "./ProjectRow";
import {
  compareProjects,
  getDueLabel,
  getFocusItems,
  getNextAction,
  getProjectState,
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
function FocusList({ projects, today }) {
  const focus = getFocusItems(projects, { limit: 3, today });
  if (focus.length === 0) return null;

  return (
    <ol className="divide-y divide-black/5">
      {focus.map((task, i) => {
        const state = getProjectState(task);
        const next = getNextAction(task);
        const dueLabel = getDueLabel(task, today);
        const late = isOverdue(task, today);

        let action;
        if (state === "blocked") {
          action = `Unblock${task.waitingFor ? `: ${task.waitingFor}` : ""}`;
        } else if (state === "waiting") {
          action = `Waiting — ${task.waitingFor || "no reason set"}`;
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
                <span
                  className={`block truncate text-sm font-medium ${
                    state === "waiting" ? "text-amber-700" : ""
                  }`}
                >
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

function ProjectsDashboard({ projects }) {
  const [showDone, setShowDone] = useState(false);
  const today = todayISO();

  const open = projects
    .filter((task) => getProjectState(task) !== "done")
    .sort((a, b) => compareProjects(a, b, today));
  const done = projects.filter((task) => getProjectState(task) === "done");
  const summary = summarizeProjects(projects, today);

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
          <h2 className="mb-1 font-serif text-lg italic text-accent">Today / Next</h2>
          <FocusList projects={projects} today={today} />
        </section>
      )}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Active" value={summary.active} />
        <StatTile label="Need action" value={summary.needAction} tone="amber" />
        <StatTile label="Waiting" value={summary.waiting} />
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
