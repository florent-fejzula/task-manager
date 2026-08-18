import {
  getTimerEndMs,
  isTimerMissed,
  getCompletionTimerOutcome,
} from "./timerStatus";

describe("timerStatus", () => {
  describe("getTimerEndMs", () => {
    test("returns null when no timer is set", () => {
      expect(getTimerEndMs({})).toBeNull();
      expect(getTimerEndMs({ timerStart: Date.now() })).toBeNull();
      expect(getTimerEndMs({ timerDuration: 1000 })).toBeNull();
    });

    test("sums a plain-number timerStart with the duration", () => {
      expect(getTimerEndMs({ timerStart: 1000, timerDuration: 500 })).toBe(1500);
    });

    test("handles a Firestore Timestamp-like timerStart", () => {
      const timerStart = { toMillis: () => 2000 };
      expect(getTimerEndMs({ timerStart, timerDuration: 300 })).toBe(2300);
    });
  });

  describe("isTimerMissed", () => {
    test("false when no timer is set", () => {
      expect(isTimerMissed({ status: "in-progress" })).toBe(false);
    });

    test("false when the deadline hasn't passed yet", () => {
      const task = {
        status: "in-progress",
        timerStart: Date.now(),
        timerDuration: 60_000,
      };
      expect(isTimerMissed(task)).toBe(false);
    });

    test("true when the deadline passed and the task is still open", () => {
      const task = {
        status: "in-progress",
        timerStart: Date.now() - 120_000,
        timerDuration: 60_000,
      };
      expect(isTimerMissed(task)).toBe(true);
    });

    test("false when the deadline passed but the task is done", () => {
      const task = {
        status: "done",
        timerStart: Date.now() - 120_000,
        timerDuration: 60_000,
      };
      expect(isTimerMissed(task)).toBe(false);
    });
  });

  describe("getCompletionTimerOutcome", () => {
    test("null when no timer was ever set", () => {
      expect(getCompletionTimerOutcome({})).toBeNull();
    });

    test("on-time when completed before the deadline", () => {
      const task = { timerStart: Date.now(), timerDuration: 60_000 };
      expect(getCompletionTimerOutcome(task)).toBe("on-time");
    });

    test("missed when completed after the deadline", () => {
      const task = { timerStart: Date.now() - 120_000, timerDuration: 60_000 };
      expect(getCompletionTimerOutcome(task)).toBe("missed");
    });
  });
});
