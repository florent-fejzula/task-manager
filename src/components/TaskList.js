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

  const addTask = async (e) => {
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

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "text-gray-500";
      case "in-progress":
        return "text-yellow-500";
      case "done":
        return "text-green-600";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        {!showAddTask ? (
          <button
            onClick={() => setShowAddTask(true)}
            className="text-sm text-accent hover:underline"
          >
            + Add New Task
          </button>
        ) : (
          <form onSubmit={addTask} className="space-y-2 sm:space-y-3">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="New task title..."
              className="w-full p-2 sm:p-3 border rounded text-sm"
            />
            <button
              type="submit"
              className="w-full bg-accent text-white py-2 rounded hover:opacity-90 text-sm"
            >
              Add Task
            </button>
          </form>
        )}
      </div>

      {["in-progress", "todo", "done"].map((taskStatus) => {
        const group = grouped[taskStatus];
        return (
          <div key={taskStatus} className="space-y-3">
            <h2 className="text-lg font-semibold capitalize">
              {taskStatus === "done" ? "Closed" : taskStatus.replace("-", " ")}
            </h2>
            {group.map((task) => (
              <div
                key={task.id}
                className="bg-white p-4 rounded-lg shadow-sm border"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-base">{task.title}</span>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task, e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Closed</option>
                  </select>
                </div>

                <div className="space-y-2 mb-2">
                  {task.subTasks?.map((sub, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <label className="flex items-center gap-2 text-sm flex-grow">
                        <input
                          type="checkbox"
                          checked={sub.done}
                          onChange={() => toggleSubTask(task.id, index)}
                          className="accent-accent"
                        />
                        <span
                          className={
                            sub.done ? "line-through text-gray-400" : ""
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
                              t.id === task.id ? { ...t, subTasks: updated } : t
                            )
                          );
                        }}
                        className="text-gray-300 hover:text-red-400 text-lg"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.target.elements[`sub-${task.id}`];
                    addSubTask(task.id, input.value);
                    input.value = "";
                  }}
                  className="flex gap-2 items-center"
                >
                  <input
                    type="text"
                    name={`sub-${task.id}`}
                    placeholder="Add sub-task..."
                    className="flex-grow border rounded px-2 py-1 text-sm"
                  />
                  <button
                    type="submit"
                    className="bg-accent text-white px-4 py-1 rounded text-sm"
                  >
                    Add
                  </button>
                </form>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
