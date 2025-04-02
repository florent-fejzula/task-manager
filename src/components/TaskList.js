import { useEffect, useState } from "react";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

function TaskList({ triggerFetch }) {
  const [tasks, setTasks] = useState([]);

  const grouped = {
    todo: [],
    "in-progress": [],
    done: [],
  };

  tasks.forEach((task) => {
    grouped[task.status]?.push(task);
  });

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "tasks", taskId));
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, { status: newStatus });

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const addSubTask = async (taskId, title) => {
    if (!title.trim()) return;

    try {
      const taskRef = doc(db, "tasks", taskId);
      const task = tasks.find((t) => t.id === taskId);
      const updatedSubTasks = [
        ...(task.subTasks || []),
        { title, done: false },
      ];

      await updateDoc(taskRef, { subTasks: updatedSubTasks });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t
        )
      );
    } catch (err) {
      console.error("Error adding sub-task:", err);
    }
  };

  const toggleSubTask = async (taskId, index) => {
    const task = tasks.find((t) => t.id === taskId);
    const updatedSubTasks = [...(task.subTasks || [])];
    updatedSubTasks[index].done = !updatedSubTasks[index].done;

    try {
      const taskRef = doc(db, "tasks", taskId);
      await updateDoc(taskRef, { subTasks: updatedSubTasks });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, subTasks: updatedSubTasks } : t
        )
      );
    } catch (err) {
      console.error("Error toggling sub-task:", err);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(tasksData);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      }
    };

    fetchTasks();
  }, [triggerFetch]);

  return (
    <div>
      {["in-progress", "todo", "done"].map((taskStatus) => {
        const group = grouped[taskStatus];
        return (
          <div key={taskStatus} className="mb-8">
            <h2 className="text-xl font-semibold capitalize mb-4 text-primary">
              {taskStatus === "done" ? "Closed" : taskStatus.replace("-", " ")}
            </h2>
            <ul className="space-y-4">
              {group.map((task) => (
                <li
                  key={task.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-4 transition hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-primary">
                        {task.title}
                      </h3>
                      <span
                        className={`text-sm capitalize ${
                          task.status === "todo"
                            ? "text-gray-500"
                            : task.status === "in-progress"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        ({task.status === "done" ? "closed" : task.status})
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task, e.target.value)
                        }
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent"
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Closed</option>
                      </select>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-sm px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {task.subTasks?.length > 0 && (
                    <ul className="mt-4 pl-4 border-l border-gray-100 space-y-2">
                      {task.subTasks.map((sub, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input
                              type="checkbox"
                              checked={sub.done}
                              onChange={() => toggleSubTask(task.id, index)}
                              className="accent-accent"
                            />
                            <span
                              className={
                                sub.done
                                  ? "line-through text-gray-400"
                                  : "text-gray-800"
                              }
                            >
                              {sub.title}
                            </span>
                          </label>
                          <button
                            onClick={() => {
                              const updated = [...task.subTasks];
                              updated.splice(index, 1);
                              updateDoc(doc(db, "tasks", task.id), {
                                subTasks: updated,
                              });
                              setTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? { ...t, subTasks: updated }
                                    : t
                                )
                              );
                            }}
                            className="text-gray-400 hover:text-red-500 text-sm"
                          >
                            ❌
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.target.elements[`sub-${task.id}`];
                      addSubTask(task.id, input.value);
                      input.value = "";
                    }}
                    className="mt-4 flex gap-2"
                  >
                    <input
                      type="text"
                      name={`sub-${task.id}`}
                      placeholder="Add sub-task..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                    <button
                      type="submit"
                      className="bg-accent text-white px-4 py-1 rounded-md text-sm hover:bg-green-700 transition"
                    >
                      Add
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
