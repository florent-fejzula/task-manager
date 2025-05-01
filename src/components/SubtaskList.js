import { useState, useEffect } from "react";
import { updateDoc } from "firebase/firestore";

function SubtaskList({ task, taskRef, onUpdate, collapseSubtasks }) {
  const [showDoneSubTasks, setShowDoneSubTasks] = useState(false);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (typeof collapseSubtasks === "boolean") {
      setShowDoneSubTasks(collapseSubtasks);
    }
  }, [collapseSubtasks]);

  const toggleSubTask = async (index) => {
    const updated = [...task.subTasks];
    const sub = updated[index];

    if (!sub.done && !sub.inProgress) {
      sub.inProgress = true;
    } else if (!sub.done && sub.inProgress) {
      sub.done = true;
      sub.inProgress = false;
    } else {
      sub.done = false;
      sub.inProgress = false;
    }

    await updateDoc(taskRef, { subTasks: updated });
    onUpdate({ subTasks: updated });
  };

  const deleteSubTask = async (index) => {
    const updated = [...task.subTasks];
    updated.splice(index, 1);
    await updateDoc(taskRef, { subTasks: updated });
    onUpdate({ subTasks: updated });
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    const title = newSubtask.trim();
    if (!title) return;

    const updated = [...(task.subTasks || []), { title, done: false, inProgress: false }];
    await updateDoc(taskRef, { subTasks: updated });
    onUpdate({ subTasks: updated });
    setNewSubtask("");
  };

  return (
    <div className="mb-6">
      <ul className="space-y-2">
        {task.subTasks?.map((sub, index) =>
          !sub.done ? (
            <li key={index} className="flex items-center justify-between">
              <label className="flex-grow cursor-pointer flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sub.done}
                  onChange={() => toggleSubTask(index)}
                />
                <span className={sub.inProgress ? "text-blue-600 italic" : "text-gray-800"}>
                  {sub.title}
                </span>
              </label>
              <button
                onClick={() => deleteSubTask(index)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ×
              </button>
            </li>
          ) : null
        )}

        {task.subTasks?.some((s) => s.done) && (
          <li
            className="flex justify-between items-center border-b border-gray-200 py-2 cursor-pointer select-none"
            onClick={() => setShowDoneSubTasks((prev) => !prev)}
          >
            <span className="text-sm font-medium italic text-gray-700 font-serif tracking-wide">
              Completed Subtasks ({task.subTasks.filter((s) => s.done).length})
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                showDoneSubTasks ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </li>
        )}

        {showDoneSubTasks &&
          task.subTasks.map((sub, index) =>
            sub.done ? (
              <li key={index} className="flex items-center justify-between">
                <label className="flex-grow flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sub.done}
                    onChange={() => toggleSubTask(index)}
                  />
                  <span className="line-through text-gray-400">{sub.title}</span>
                </label>
                <button
                  onClick={() => deleteSubTask(index)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  ×
                </button>
              </li>
            ) : null
          )}
      </ul>

      <form onSubmit={handleAddSubtask} className="flex gap-2 mt-4">
        <input
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          placeholder="Add sub-task..."
          className="flex-grow border border-gray-300 rounded px-3 py-1"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
          Add
        </button>
      </form>
    </div>
  );
}

export default SubtaskList;
