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

function TaskList() {
  const [tasks, setTasks] = useState([]);
  const statuses = ["todo", "in-progress", "done"];
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

  const handleStatusChange = async (task) => {
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];

    try {
      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, { status: nextStatus });

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
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
  }, []);

  return (
    <div>
      {Object.entries(grouped).map(([status, group]) => (
        <div key={status} style={{ marginBottom: "32px" }}>
          <h2 style={{ textTransform: "capitalize" }}>
            {status.replace("-", " ")}
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
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <strong style={{ fontSize: "1.1rem" }}>{task.title}</strong>{" "}
                    <span
                      style={{
                        fontSize: "0.9rem",
                        color:
                          task.status === "todo"
                            ? "#666"
                            : task.status === "in-progress"
                            ? "#d87c00"
                            : "#2b8a3e",
                      }}
                    >
                      ({task.status})
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => handleStatusChange(task)}
                      style={{
                        backgroundColor: "#eee",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        marginRight: "6px",
                      }}
                    >
                      Next
                    </button>
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

                {/* Sub-tasks and Add Form wrapped in a <div> */}
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

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.target.elements[`sub-${task.id}`];
                      addSubTask(task.id, input.value);
                      input.value = "";
                    }}
                    style={{ marginTop: "8px", display: "flex", gap: "6px" }}
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
      ))}
    </div>
  );
}

export default TaskList;
