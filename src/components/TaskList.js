import { useEffect, useState } from "react";
import {
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function TaskList({ triggerFetch }) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTaskStatus, setNewTaskStatus] = useState("todo");
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [loading, setLoading] = useState(true);

  const grouped = {
    todo: [],
    "in-progress": [],
    "on-hold": [],
    done: [],
  };

  const statusLabels = {
    todo: "To Do",
    "in-progress": "In Progress",
    "on-hold": "On Hold",
    done: "Closed",
  };

  tasks.forEach((task) => {
    grouped[task.status]?.push(task);
  });

  const handleStatusChange = async (task, newStatus) => {
    try {
      const taskRef = doc(db, "users", currentUser.uid, "tasks", task.id);
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
      const taskRef = doc(db, "users", currentUser.uid, "tasks", taskId);
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
      const taskRef = doc(db, "users", currentUser.uid, "tasks", taskId);
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
      const docRef = await addDoc(
        collection(db, "users", currentUser.uid, "tasks"),
        {
          title: newTaskTitle,
          status: newTaskStatus,
          priority: "medium",
          createdAt: serverTimestamp(),
          subTasks: [],
        }
      );
      setNewTaskTitle("");
      setShowAddTask(false);
      setTasks((prev) => [
        {
          id: docRef.id,
          title: newTaskTitle,
          status: newTaskStatus,
          priority: "medium",
          subTasks: [],
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setNewTaskStatus("todo");
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, "users", currentUser.uid, "tasks"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(tasksData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setLoading(false);
      }
    };
    if (currentUser?.uid) fetchTasks();
  }, [triggerFetch, currentUser?.uid]);

  const sortedStatuses = ["in-progress", "todo", "on-hold", "done"];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
            <select
              value={newTaskStatus}
              onChange={(e) => setNewTaskStatus(e.target.value)}
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
        )}
      </div>

      {/* Status sections */}
      {sortedStatuses.map((taskStatus) => {
        let group = grouped[taskStatus];
        const displayStatus = statusLabels[taskStatus] || taskStatus;

        group = [...group].sort((a, b) => {
          const getWeight = (priority) =>
            priority === "high" ? 0 : priority === "medium" ? 1 : 2;
          return (
            getWeight(a.priority || "medium") -
            getWeight(b.priority || "medium")
          );
        });

        const isClosed = taskStatus === "done";

        return (
          <div key={taskStatus} className="mb-10">
            <div
              className={`text-accent font-serif italic text-lg mb-2 border-b border-gray-200 pb-1 flex justify-between items-center cursor-pointer ${
                isClosed ? "hover:opacity-80" : ""
              }`}
              onClick={() => isClosed && setShowClosed((prev) => !prev)}
            >
              <span>
                {displayStatus}
                {isClosed && ` (${group.length})`}
              </span>
              {isClosed &&
                (showClosed ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ))}
            </div>

            {(!isClosed || showClosed) && (
              <ul className="space-y-4">
                {group.map((task) => (
                  <li
                    key={task.id}
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
                        <strong className="text-lg font-semibold">
                          {task.title}
                        </strong>
                      </Link>
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
                                className={`$${
                                  sub.done
                                    ? "line-through text-gray-400"
                                    : "text-primary"
                                }`}
                              >
                                {sub.title}
                              </span>
                            </label>
                            <button
                              onClick={() => {
                                const updated = [...task.subTasks];
                                updated.splice(index, 1);
                                updateDoc(
                                  doc(
                                    db,
                                    "users",
                                    currentUser.uid,
                                    "tasks",
                                    task.id
                                  ),
                                  { subTasks: updated }
                                );
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
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TaskList;
