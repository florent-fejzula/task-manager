// TaskDetail.js
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { Pencil } from "lucide-react";

function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSubtask, setNewSubtask] = useState("");

  const taskRef = doc(db, "users", currentUser.uid, "tasks", id);

  useEffect(() => {
    const fetchTask = async () => {
      const snapshot = await getDoc(taskRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        setTask({ id: snapshot.id, ...data });
  
        // Set the new title only once — if no editing is in progress
        setNewTitle((prev) => prev || data.title);
      }
      setLoading(false);
    };
    fetchTask();
  }, [taskRef]);

  const toggleSubTask = async (index) => {
    const updated = [...task.subTasks];
    updated[index].done = !updated[index].done;
    await updateDoc(taskRef, { subTasks: updated });
    setTask({ ...task, subTasks: updated });
  };

  const deleteSubTask = async (index) => {
    const updated = [...task.subTasks];
    updated.splice(index, 1);
    await updateDoc(taskRef, { subTasks: updated });
    setTask({ ...task, subTasks: updated });
  };

  const handleDeleteTask = async () => {
    const confirmed = window.confirm("Are you sure you want to delete this task?");
    if (confirmed) {
      await deleteDoc(taskRef);
      navigate("/");
    }
  };

  const handleTitleSave = async () => {
    await updateDoc(taskRef, { title: newTitle });
    setTask({ ...task, title: newTitle });
    setEditingTitle(false);
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const updated = [...(task.subTasks || []), { title: newSubtask, done: false }];
    await updateDoc(taskRef, { subTasks: updated });
    setTask({ ...task, subTasks: updated });
    setNewSubtask("");
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    await updateDoc(taskRef, { status: newStatus });
    setTask({ ...task, status: newStatus });
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    await updateDoc(taskRef, { priority: newPriority });
    setTask({ ...task, priority: newPriority });
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (!task) return <p className="text-center">Task not found.</p>;

  const priorityClass =
    task.priority === "high"
      ? "border-red-500"
      : task.priority === "low"
      ? "border-green-500"
      : "border-gray-200";

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 sm:p-8 max-w-xl mx-auto mt-8 border ${priorityClass}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
        <span className="text-xs text-gray-400">Task Detail</span>
      </div>

      {/* Title */}
      <div className="mb-6 flex items-center justify-between">
        {editingTitle ? (
          <div className="flex-grow flex gap-2">
            <input
              className="border border-gray-300 rounded px-2 py-1 w-full"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
            />
            <button
              className="text-sm text-green-600 hover:underline"
              onClick={handleTitleSave}
            >
              Save
            </button>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-between">
            <h2 className="text-xl font-semibold mr-2">{task.title}</h2>
            <button onClick={() => setEditingTitle(true)}>
              <Pencil size={18} className="text-gray-500 hover:text-gray-700" />
            </button>
          </div>
        )}
      </div>

      {/* Status and Priority Dropdowns */}
      <div className="flex gap-4 mb-6">
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="done">Closed</option>
        </select>

        <select
          value={task.priority || "medium"}
          onChange={handlePriorityChange}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {/* Subtasks */}
      <ul className="space-y-2 mb-6">
        {task.subTasks?.map((sub, index) => (
          <li key={index} className="flex items-center justify-between">
            <label className="flex-grow cursor-pointer">
              <input
                type="checkbox"
                checked={sub.done}
                onChange={() => toggleSubTask(index)}
                className="mr-2"
              />
              <span
                className={
                  sub.done ? "line-through text-gray-400" : "text-gray-800"
                }
              >
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
        ))}
      </ul>

      {/* Add Subtask */}
      <form
        onSubmit={handleAddSubtask}
        className="flex gap-2 mb-6"
      >
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

      {/* Delete Button */}
      <button
        onClick={handleDeleteTask}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 w-full"
      >
        Delete Task
      </button>
    </div>
  );
}

export default TaskDetail;
