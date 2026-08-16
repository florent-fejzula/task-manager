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

  const addSubTask = async (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const updated = [...list, { title: trimmed, done: false, inProgress: false }];
    await updateDoc(taskRef, { subTasks: updated });
    onUpdate(updated);
  };

  return { toggleSubTask, deleteSubTask, addSubTask };
}
