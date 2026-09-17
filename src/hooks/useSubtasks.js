import { updateDoc } from "firebase/firestore";

// Shared Firestore mutation logic for a task's subTasks array.
// `taskRef` is the Firestore doc ref for the parent task.
// `subTasks` is the current subTasks array (may be undefined).
// `onUpdate(updatedSubTasks)` is called after a successful write so the
// caller can update whatever local/optimistic state it keeps.
export function useSubtasks(taskRef, subTasks, onUpdate) {
  const list = subTasks || [];

  const toggleSubTask = async (index) => {
    const updated = [...list];
    const sub = { ...updated[index] };

    if (!sub.done && !sub.inProgress) {
      sub.inProgress = true;
    } else if (!sub.done && sub.inProgress) {
      sub.done = true;
      sub.inProgress = false;
    } else {
      sub.done = false;
      sub.inProgress = false;
    }
    updated[index] = sub;

    await updateDoc(taskRef, { subTasks: updated });
    onUpdate(updated);
  };

  const deleteSubTask = async (index) => {
    const updated = [...list];
    updated.splice(index, 1);
    await updateDoc(taskRef, { subTasks: updated });
    onUpdate(updated);
  };

  // Makes a subtask the project's next action: moves it to the front and
  // clears "in progress" on every other unfinished subtask, so exactly one
  // thing reads as next (getNextAction prefers a started subtask over
  // position, so leaving another one started would quietly outrank this).
  const promoteSubTask = async (index) => {
    const target = list[index];
    if (!target) return;

    const updated = [
      { ...target },
      ...list
        .filter((_, i) => i !== index)
        .map((sub) => (sub.done ? sub : { ...sub, inProgress: false })),
    ];

    await updateDoc(taskRef, { subTasks: updated });
    onUpdate(updated);
  };

  const addSubTask = async (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const updated = [...list, { title: trimmed, done: false, inProgress: false }];
    await updateDoc(taskRef, { subTasks: updated });
    onUpdate(updated);
  };

  return { toggleSubTask, deleteSubTask, addSubTask, promoteSubTask };
}
