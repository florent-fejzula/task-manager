// AddTaskForm.js
import { useState } from "react";

function AddTaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, status);
    setTitle("");
    setStatus("todo");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-3 max-w-md mx-auto"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
      >
        <option value="todo">To Do</option>
        <option value="in-progress">In Progress</option>
        <option value="on-hold">On Hold</option>
        <option value="done">Closed</option>
      </select>
      <button
        type="submit"
        className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-dark transition"
      >
        Add Task
      </button>
    </form>
  );
}

export default AddTaskForm;
