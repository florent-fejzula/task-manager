import { Link } from "react-router-dom";
import {
  getDueLabel,
  getNextAction,
  getProgress,
  getProjectState,
  isOverdue,
} from "../utils/projects";

// One compact line per project: where it stands, what's next, when, and how
// far along. Deliberately small — the point of this screen is seeing the
// whole landscape at once, not reading any single project's contents.
function ProjectRow({ task, today }) {
  const state = getProjectState(task);
  const next = getNextAction(task);
  const { done, total, percent } = getProgress(task);
  const dueLabel = getDueLabel(task, today);
  const late = isOverdue(task, today);

  // Colour is reserved for exceptions, so a calm project stays quiet.
  const accent =
    late || state === "blocked"
      ? "border-l-red-500"
      : state === "waiting"
      ? "border-l-amber-400"
      : state === "done"
      ? "border-l-gray-200"
      : "border-l-green-500";

  let line = null;
  if (state === "done") {
    line = <span className="text-gray-400">✓ Completed</span>;
  } else if (state === "blocked") {
    line = (
      <span className="text-red-600">
        ⛔ Blocked{task.waitingFor ? `: ${task.waitingFor}` : ""}
      </span>
    );
  } else if (state === "waiting") {
    line = (
      <span className="text-amber-700">
        ⏳ Waiting for: {task.waitingFor || "—"}
      </span>
    );
  } else if (next) {
    line = (
      <span className="text-gray-700">
        <span className="text-gray-400">→ </span>
        {next.title}
      </span>
    );
  } else {
    line = <span className="text-amber-700">⚠ No next step — decide what's next</span>;
  }

  return (
    <Link
      to={`/project/${task.id}`}
      className={`block rounded-lg border border-gray-200 border-l-4 ${accent} bg-white px-3 py-2.5 shadow-sm transition hover:shadow`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`truncate font-semibold ${
            state === "done" ? "text-gray-400" : ""
          }`}
        >
          {task.title}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-gray-400">
          {total > 0 ? `${done}/${total}` : ""}
        </span>
      </div>

      <div className="mt-0.5 flex items-center justify-between gap-3 text-xs">
        <span className="truncate">{line}</span>
        {dueLabel && (
          <span
            className={`shrink-0 ${
              late ? "font-semibold text-red-600" : "text-gray-500"
            }`}
          >
            {dueLabel}
          </span>
        )}
      </div>

      {total > 0 && state !== "done" && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-accent/50"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </Link>
  );
}

export default ProjectRow;
