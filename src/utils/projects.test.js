import {
  compareProjects,
  getDueLabel,
  getFocusItems,
  getNextAction,
  getProgress,
  getProjectState,
  isOverdue,
  needsAction,
  summarizeProjects,
} from "./projects";

const TODAY = "2026-09-17";

const project = (overrides = {}) => ({
  id: "p1",
  title: "Project",
  category: "work",
  status: "in-progress",
  subTasks: [],
  ...overrides,
});

describe("getProjectState", () => {
  it("prefers the stored state", () => {
    expect(getProjectState(project({ projectState: "blocked" }))).toBe("blocked");
  });

  it("treats a closed task as done regardless of stored state", () => {
    expect(
      getProjectState(project({ projectState: "active", status: "done" }))
    ).toBe("done");
  });

  it("falls back to the classic status for projects predating this view", () => {
    expect(getProjectState(project({ status: "on-hold" }))).toBe("waiting");
    expect(getProjectState(project({ status: "todo" }))).toBe("active");
  });

  it("ignores an unrecognised stored state", () => {
    expect(getProjectState(project({ projectState: "nonsense" }))).toBe("active");
  });
});

describe("getNextAction", () => {
  it("picks the started subtask over an earlier untouched one", () => {
    const task = project({
      subTasks: [
        { title: "Gradezhna add", done: false, inProgress: false },
        { title: "UJP final test", done: false, inProgress: true },
      ],
    });
    expect(getNextAction(task)).toMatchObject({ title: "UJP final test", index: 1 });
  });

  it("otherwise picks the first unfinished subtask", () => {
    const task = project({
      subTasks: [
        { title: "done thing", done: true },
        { title: "Record Belodore demo", done: false },
        { title: "Present Schatze", done: false },
      ],
    });
    expect(getNextAction(task)).toMatchObject({
      title: "Record Belodore demo",
      index: 1,
    });
  });

  it("returns null when nothing is left", () => {
    expect(getNextAction(project({ subTasks: [{ title: "x", done: true }] }))).toBeNull();
    expect(getNextAction(project())).toBeNull();
  });
});

describe("getProgress", () => {
  it("counts finished subtasks", () => {
    const task = project({
      subTasks: [{ done: true }, { done: true }, { done: false }, { done: false }],
    });
    expect(getProgress(task)).toMatchObject({ done: 2, total: 4, percent: 50 });
  });

  it("handles a project with no subtasks", () => {
    expect(getProgress(project())).toMatchObject({ done: 0, total: 0, percent: 0 });
  });
});

describe("needsAction", () => {
  it("flags an active project that has run out of steps", () => {
    expect(needsAction(project({ subTasks: [{ title: "x", done: true }] }))).toBe(true);
  });

  it("flags a blocked project", () => {
    const task = project({
      projectState: "blocked",
      subTasks: [{ title: "x", done: false }],
    });
    expect(needsAction(task)).toBe(true);
  });

  it("does not flag an active project with a clear next step", () => {
    expect(needsAction(project({ subTasks: [{ title: "x", done: false }] }))).toBe(false);
  });

  it("does not flag waiting projects — that's someone else's move", () => {
    expect(needsAction(project({ projectState: "waiting" }))).toBe(false);
  });
});

describe("due dates", () => {
  it("treats a past date as overdue while the project is open", () => {
    expect(isOverdue(project({ dueDate: "2026-09-12" }), TODAY)).toBe(true);
  });

  it("never reports a finished project as overdue", () => {
    expect(isOverdue(project({ dueDate: "2026-09-12", status: "done" }), TODAY)).toBe(
      false
    );
  });

  it("labels today, tomorrow and later dates", () => {
    expect(getDueLabel(project({ dueDate: TODAY }), TODAY)).toBe("Today");
    expect(getDueLabel(project({ dueDate: "2026-09-18" }), TODAY)).toBe("Tomorrow");
    expect(getDueLabel(project({ dueDate: "2026-09-20" }), TODAY)).toBe("Sep 20");
    expect(getDueLabel(project({ dueDate: "2027-01-04" }), TODAY)).toBe("Jan 4 2027");
  });

  it("labels a waiting project's date as a follow-up", () => {
    const waiting = project({ projectState: "waiting", dueDate: "2026-09-20" });
    expect(getDueLabel(waiting, TODAY)).toBe("Follow up Sep 20");
  });

  it("calls out overdue explicitly", () => {
    expect(getDueLabel(project({ dueDate: "2026-09-12" }), TODAY)).toBe(
      "Overdue · Sep 12"
    );
  });

  it("returns nothing when no date is set", () => {
    expect(getDueLabel(project(), TODAY)).toBeNull();
  });
});

describe("summarizeProjects", () => {
  it("counts each state, plus what needs action and what is late", () => {
    const tasks = [
      project({ id: "a", subTasks: [{ title: "x", done: false }] }), // active, fine
      project({ id: "b", subTasks: [] }), // active, out of steps
      project({ id: "c", projectState: "waiting" }),
      project({ id: "d", projectState: "blocked" }),
      project({ id: "e", dueDate: "2026-09-12", subTasks: [{ done: false }] }), // overdue
      project({ id: "f", status: "done" }),
    ];

    expect(summarizeProjects(tasks, TODAY)).toEqual({
      active: 3, // a, b and e — e is active *and* overdue
      waiting: 1,
      blocked: 1,
      done: 1,
      needAction: 2, // the one out of steps + the blocked one
      overdue: 1,
    });
  });
});

describe("compareProjects / getFocusItems", () => {
  const overdue = project({ id: "overdue", title: "Overdue", dueDate: "2026-09-10" });
  const blocked = project({ id: "blocked", title: "Blocked", projectState: "blocked" });
  const stalled = project({ id: "stalled", title: "Stalled", subTasks: [] });
  const dated = project({
    id: "dated",
    title: "Dated",
    dueDate: "2026-09-18",
    subTasks: [{ title: "x", done: false }],
  });
  const undated = project({
    id: "undated",
    title: "Undated",
    subTasks: [{ title: "x", done: false }],
  });
  const waiting = project({
    id: "waiting",
    title: "Waiting",
    projectState: "waiting",
    dueDate: "2026-09-20",
  });
  const finished = project({ id: "done", title: "Done", status: "done" });

  it("orders by how loudly a project needs attention", () => {
    const shuffled = [finished, waiting, undated, dated, stalled, blocked, overdue];
    const order = [...shuffled]
      .sort((a, b) => compareProjects(a, b, TODAY))
      .map((t) => t.id);

    expect(order).toEqual([
      "overdue",
      "blocked",
      "stalled",
      "dated",
      "undated",
      "waiting",
      "done",
    ]);
  });

  it("puts the sooner deadline first within the same rank", () => {
    const soon = project({
      id: "soon",
      dueDate: "2026-09-18",
      subTasks: [{ done: false }],
    });
    const later = project({
      id: "later",
      dueDate: "2026-09-25",
      subTasks: [{ done: false }],
    });
    expect([later, soon].sort((a, b) => compareProjects(a, b, TODAY)).map((t) => t.id)).toEqual(
      ["soon", "later"]
    );
  });

  it("focuses on the top few open projects only", () => {
    const items = getFocusItems([finished, waiting, dated, blocked, overdue], {
      limit: 3,
      today: TODAY,
    });
    expect(items.map((t) => t.id)).toEqual(["overdue", "blocked", "dated"]);
  });
});
