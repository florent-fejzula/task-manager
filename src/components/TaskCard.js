// TaskCard.js
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";

function TaskCard({ task, currentUser, onStatusChange, onSubTaskUpdate }) {
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const taskRef = doc(db, "users", currentUser.uid, "tasks", task.id);
      await updateDoc(taskRef, { status: newStatus });
      onStatusChange(task.id, newStatus);
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleToggleSubTask = async (index) => {
    const updated = [...(task.subTasks || [])];
    updated[index].done = !updated[index].done;
    await updateDoc(doc(db, "users", currentUser.uid, "tasks", task.id), {
      subTasks: updated,
    });
    onSubTaskUpdate(task.id, updated);
  };

  const handleDeleteSubTask = async (index) => {
    const updated = [...(task.subTasks || [])];
    updated.splice(index, 1);
    await updateDoc(doc(db, "users", currentUser.uid, "tasks", task.id), {
      subTasks: updated,
    });
    onSubTaskUpdate(task.id, updated);
  };

  const handleAddSubTask = async (e) => {
    e.preventDefault();
    const input = e.target.elements[`sub-${task.id}`];
    const title = input.value.trim();
    if (!title) return;
    const updated = [...(task.subTasks || []), { title, done: false }];
    await updateDoc(doc(db, "users", currentUser.uid, "tasks", task.id), {
      subTasks: updated,
    });
    onSubTaskUpdate(task.id, updated);
    input.value = "";
  };

  return (
    <li
      className={`bg-white shadow-md rounded-xl p-4 border-2 ${
        task.priority === "high"
          ? "border-red-600 bg-red-50"
          : task.priority === "low"
          ? "border-green-500 bg-green-50"
          : "border-gray-200"
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <Link to={`/task/${task.id}`} className="hover:underline">
          <strong className="text-lg font-semibold">{task.title}</strong>
        </Link>
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="done">Closed</option>
        </select>
      </div>

      {task.subTasks?.length > 0 && (
        <ul className="space-y-1">
          {task.subTasks.map((sub, index) => (
            <li
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <label className="flex items-center gap-2 flex-grow">
                <input
                  type="checkbox"
                  checked={sub.done}
                  onChange={() => handleToggleSubTask(index)}
                />
                <span
                  className={
                    sub.done
                      ? "line-through text-gray-400"
                      : "text-primary"
                  }
                >
                  {sub.title}
                </span>
              </label>
              <button
                onClick={() => handleDeleteSubTask(index)}
                className="text-gray-300 hover:text-red-400 text-lg"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAddSubTask}
        className="mt-3 flex items-center gap-2"
      >
        <input
          type="text"
          name={`sub-${task.id}`}
          placeholder="Add sub-task..."
          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent text-sm"
        />
        <button
          type="submit"
          className="bg-accent text-white px-4 py-2 rounded-md text-sm hover:bg-accent-dark"
        >
          Add
        </button>
      </form>
    </li>
  );
}

export default TaskCard;
