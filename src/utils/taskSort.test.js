import { compareTasks } from "./taskSort";

describe("compareTasks", () => {
  test("matches the requested ordering: overdue, then soonest timer, then recurring, then the rest", () => {
    const now = Date.now();

    const overdue = {
      id: "overdue",
      status: "in-progress",
      timerStart: now - 60_000,
      timerDuration: 30_000, // ended 30s ago
    };
    const task1 = {
      id: "task1",
      status: "in-progress",
      timerStart: now,
      timerDuration: 35 * 60_000, // 35 min remaining
    };
    const task2 = {
      id: "task2",
      status: "in-progress",
      timerStart: now,
      timerDuration: (5 * 60 + 13) * 60_000, // 5h13m remaining
    };
    const task3 = {
      id: "task3",
      status: "in-progress",
      recurring: true,
      recurringInterval: 2,
    };
    const task4 = {
      id: "task4",
      status: "in-progress",
    };

    const shuffled = [task4, task2, task3, overdue, task1];
    const sorted = [...shuffled].sort(compareTasks);

    expect(sorted.map((t) => t.id)).toEqual([
      "overdue",
      "task1",
      "task2",
      "task3",
      "task4",
    ]);
  });

  test("within the same tier, falls back to priority (high < medium < low)", () => {
    const low = { id: "low", status: "todo", priority: "low" };
    const high = { id: "high", status: "todo", priority: "high" };
    const medium = { id: "medium", status: "todo", priority: "medium" };

    const sorted = [low, high, medium].sort(compareTasks);

    expect(sorted.map((t) => t.id)).toEqual(["high", "medium", "low"]);
  });

  test("a done task's timer doesn't count as overdue or active", () => {
    const now = Date.now();
    const doneButExpired = {
      id: "done",
      status: "done",
      timerStart: now - 60_000,
      timerDuration: 30_000,
      priority: "low",
    };
    const openNoTimer = { id: "open", status: "todo", priority: "high" };

    const sorted = [doneButExpired, openNoTimer].sort(compareTasks);

    // Neither has an overdue/active bucket, so priority decides.
    expect(sorted.map((t) => t.id)).toEqual(["open", "done"]);
  });
});
