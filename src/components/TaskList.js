import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TaskCard from "./TaskCard";
import AddTaskForm from "./AddTaskForm";

function TaskList({ triggerFetch }) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userSettings, setUserSettings] = useState({});

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

  const handleAddTask = async (newTaskTitle, newTaskStatus) => {
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
      setShowAddTask(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const sortedStatuses = ["in-progress", "todo", "on-hold", "done"];

  useEffect(() => {
    const fetchTasksAndSettings = async () => {
      try {
        setLoading(true);

        // 🔹 Fetch tasks
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

        // 🔹 Fetch settings
        const settingsRef = doc(db, "users", currentUser.uid, "settings", "preferences");
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setUserSettings(settingsSnap.data());
        } else {
          setUserSettings({});
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching tasks or settings:", err);
        setLoading(false);
      }
    };

    if (currentUser?.uid) fetchTasksAndSettings();
  }, [triggerFetch, currentUser?.uid]);

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
        {showAddTask && <AddTaskForm onAdd={handleAddTask} />}
      </div>

      {sortedStatuses.map((taskStatus) => {
        let group = grouped[taskStatus];
        const displayStatus = statusLabels[taskStatus] || taskStatus;

        group = [...group].sort((a, b) => {
          const getWeight = (priority) =>
            priority === "high" ? 0 : priority === "medium" ? 1 : 2;
          return (
            getWeight(a.priority || "medium") - getWeight(b.priority || "medium")
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
                  <TaskCard
                    key={task.id}
                    task={task}
                    currentUser={currentUser}
                    collapseSubtasks={userSettings?.collapseCompletedSubtasks}
                    onStatusChange={(taskId, newStatus) =>
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === taskId ? { ...t, status: newStatus } : t
                        )
                      )
                    }
                    onSubTaskUpdate={(taskId, updatedSubTasks) =>
                      setTasks((prev) =>
                        prev.map((t) =>
                          t.id === taskId
                            ? { ...t, subTasks: updatedSubTasks }
                            : t
                        )
                      )
                    }
                  />
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
