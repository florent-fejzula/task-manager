import { useEffect, useState } from "react";
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";

function TaskList({ triggerFetch }) {
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const grouped = {
    todo: [],
    "in-progress": [],
    "on-hold": [],
    done: [],
  };

  const statusLabels = {
    "todo": "To Do",
    "in-progress": "In Progress",
    "on-hold": "On Hold",
    "done": "Closed"
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

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        title: newTaskTitle,
        status: "todo",
        createdAt: serverTimestamp(),
        subTasks: [],
      });
      setNewTaskTitle("");
      setShowAddTask(false);
      setTasks((prev) => [
        {
          id: docRef.id,
          title: newTaskTitle,
          status: "todo",
          subTasks: [],
          createdAt: new Date(),
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Error adding task:", err);
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
      <div className="text-center mb-4">
        {!showAddTask && (
          <button
            onClick={() => setShowAddTask(true)}
            className="text-sm text-accent underline"
          >
            + Add New Task
          </button>
        )}
        {showAddTask && (
          <form
            onSubmit={handleAddTask}
            className="mt-4 space-y-3 max-w-md mx-auto"
          >
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New task title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-accent"
            />
            <button
              type="submit"
              className="w-full bg-accent text-white py-2 rounded-md hover:bg-accent-dark transition"
            >
              Add Task
            </button>
          </form>
        )}
      </div>

      {["in-progress", "todo", "on-hold", "done"].map((taskStatus) => {
        const group = grouped[taskStatus];
        const displayStatus = statusLabels[taskStatus] || taskStatus;

        return (
          <div key={taskStatus} className="mb-10">
            <h2 className="text-accent font-serif italic text-lg mb-2 border-b border-gray-200 pb-1">
              {displayStatus}
            </h2>

            <ul className="space-y-4">
              {group.map((task) => (
                <li
                  key={task.id}
                  className="bg-white shadow-md rounded-xl p-4"
                >
                  <div className="flex justify-between items-center mb-2">
                    <strong className="text-lg font-semibold">
                      {task.title}
                    </strong>
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(task, e.target.value)
                      }
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
                              onChange={() => toggleSubTask(task.id, index)}
                            />
                            <span
                              className={`${
                                sub.done ? "line-through text-gray-400" : "text-primary"
                              }`}
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
                            className="text-gray-300 hover:text-red-400 text-lg"
                          >
                            ×
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
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
