import { renderHook, act } from "@testing-library/react";
import { updateDoc } from "firebase/firestore";
import { useSubtasks } from "./useSubtasks";

jest.mock("firebase/firestore", () => ({
  updateDoc: jest.fn().mockResolvedValue(undefined),
}));

const fakeTaskRef = { id: "task-1" };

beforeEach(() => {
  updateDoc.mockClear();
});

describe("useSubtasks", () => {
  test("toggleSubTask cycles pending -> in-progress -> done -> pending", async () => {
    const subTasks = [{ title: "Wash dishes", done: false, inProgress: false }];
    const onUpdate = jest.fn();
    const { result } = renderHook(() => useSubtasks(fakeTaskRef, subTasks, onUpdate));

    await act(async () => {
      await result.current.toggleSubTask(0);
    });
    expect(onUpdate).toHaveBeenLastCalledWith([
      { title: "Wash dishes", done: false, inProgress: true },
    ]);

    const afterFirstToggle = onUpdate.mock.calls[0][0];
    onUpdate.mockClear();
    const { result: result2 } = renderHook(() =>
      useSubtasks(fakeTaskRef, afterFirstToggle, onUpdate)
    );
    await act(async () => {
      await result2.current.toggleSubTask(0);
    });
    expect(onUpdate).toHaveBeenLastCalledWith([
      { title: "Wash dishes", done: true, inProgress: false },
    ]);

    const afterSecondToggle = onUpdate.mock.calls[0][0];
    onUpdate.mockClear();
    const { result: result3 } = renderHook(() =>
      useSubtasks(fakeTaskRef, afterSecondToggle, onUpdate)
    );
    await act(async () => {
      await result3.current.toggleSubTask(0);
    });
    expect(onUpdate).toHaveBeenLastCalledWith([
      { title: "Wash dishes", done: false, inProgress: false },
    ]);
  });

  test("toggleSubTask does not mutate the array/objects passed in", async () => {
    const original = [{ title: "Read", done: false, inProgress: false }];
    const onUpdate = jest.fn();
    const { result } = renderHook(() => useSubtasks(fakeTaskRef, original, onUpdate));

    await act(async () => {
      await result.current.toggleSubTask(0);
    });

    expect(original).toEqual([{ title: "Read", done: false, inProgress: false }]);
  });

  test("deleteSubTask removes the item at the given index and persists via updateDoc", async () => {
    const subTasks = [
      { title: "A", done: false, inProgress: false },
      { title: "B", done: false, inProgress: false },
    ];
    const onUpdate = jest.fn();
    const { result } = renderHook(() => useSubtasks(fakeTaskRef, subTasks, onUpdate));

    await act(async () => {
      await result.current.deleteSubTask(0);
    });

    expect(updateDoc).toHaveBeenCalledWith(fakeTaskRef, {
      subTasks: [{ title: "B", done: false, inProgress: false }],
    });
    expect(onUpdate).toHaveBeenCalledWith([{ title: "B", done: false, inProgress: false }]);
  });

  test("addSubTask appends a new pending subtask with trimmed title", async () => {
    const onUpdate = jest.fn();
    const { result } = renderHook(() => useSubtasks(fakeTaskRef, [], onUpdate));

    await act(async () => {
      await result.current.addSubTask("  Buy milk  ");
    });

    expect(onUpdate).toHaveBeenCalledWith([
      { title: "Buy milk", done: false, inProgress: false },
    ]);
  });

  test("addSubTask ignores blank/whitespace-only titles", async () => {
    const onUpdate = jest.fn();
    const { result } = renderHook(() => useSubtasks(fakeTaskRef, [], onUpdate));

    await act(async () => {
      await result.current.addSubTask("   ");
    });

    expect(updateDoc).not.toHaveBeenCalled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  test("handles an undefined subTasks array", async () => {
    const onUpdate = jest.fn();
    const { result } = renderHook(() => useSubtasks(fakeTaskRef, undefined, onUpdate));

    await act(async () => {
      await result.current.addSubTask("First task");
    });

    expect(onUpdate).toHaveBeenCalledWith([
      { title: "First task", done: false, inProgress: false },
    ]);
  });
});
