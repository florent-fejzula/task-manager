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

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "#666";
      case "in-progress":
        return "#d87c00";
      case "done":
        return "#2b8a3e";
      default:
        return "#999";
    }
  };

  return (
    <div>
      {["in-progress", "todo", "done"].map((taskStatus) => {
        const group = grouped[taskStatus];
        return (
          <div key={taskStatus} style={{ marginBottom: "32px" }}>
            <h2 style={{ textTransform: "capitalize" }}>
              {taskStatus === "done" ? "Closed" : taskStatus.replace("-", " ")}
            </h2>
            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
              {group.map((task) => (
                <li
                  key={task.id}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "12px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "1.1rem" }}>
                        {task.title}
                      </strong>{" "}
                      <span
                        style={{
                          fontSize: "0.9rem",
                          color: getStatusColor(task.status),
                        }}
                      >
                        ({task.status === "done" ? "closed" : task.status})
                      </span>
                    </div>
                    <div>
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task, e.target.value)
                        }
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                          marginRight: "6px",
                        }}
                      >
                        <option value="todo">To Do</option>
                        <option value="in-progress">In Progress</option>
                        <option value="done">Closed</option>
                      </select>
                      <button
                        onClick={() => deleteTask(task.id)}
                        style={{
                          backgroundColor: "#ff6666",
                          color: "white",
                          border: "none",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Sub-tasks */}
                  <div style={{ marginTop: "8px" }}>
                    {task.subTasks?.length > 0 && (
                      <ul style={{ paddingLeft: "20px" }}>
                        {task.subTasks.map((sub, index) => (
                          <li
                            key={index}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <label style={{ flexGrow: 1 }}>
                              <input
                                type="checkbox"
                                checked={sub.done}
                                onChange={() => toggleSubTask(task.id, index)}
                                style={{ marginRight: "6px" }}
                              />
                              <span
                                style={{
                                  textDecoration: sub.done
                                    ? "line-through"
                                    : "none",
                                  color: sub.done ? "#999" : "#333",
                                }}
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
                              style={{
                                backgroundColor: "#ddd",
                                border: "none",
                                borderRadius: "4px",
                                padding: "2px 6px",
                                cursor: "pointer",
                              }}
                            >
                              ❌
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Add sub-task */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.target.elements[`sub-${task.id}`];
                        addSubTask(task.id, input.value);
                        input.value = "";
                      }}
                      style={{
                        marginTop: "8px",
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      <input
                        type="text"
                        name={`sub-${task.id}`}
                        placeholder="Add sub-task..."
                        style={{
                          flex: 1,
                          padding: "4px 8px",
                          borderRadius: "4px",
                          border: "1px solid #ccc",
                        }}
                      />
                      <button
                        type="submit"
                        style={{
                          padding: "4px 12px",
                          border: "none",
                          borderRadius: "4px",
                          backgroundColor: "#388659",
                          color: "white",
                          cursor: "pointer",
                        }}
                      >
                        Add
                      </button>
                    </form>
                  </div>
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
