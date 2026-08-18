import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import TaskCard from "./TaskCard";
import AddTaskForm from "./AddTaskForm";

function TaskList() {
  const { currentUser } = useAuth();
  const { tasks, settings, loading } = useData();
  const [showAddTask, setShowAddTask] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

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

  // Subtle per-section tint + dot so scrolling past a long list still
  // reads as distinct groups instead of one continuous list.
  const statusStyles = {
    "in-progress": { bg: "bg-green-50/60", dot: "bg-green-500" },
    todo: { bg: "bg-blue-50/60", dot: "bg-blue-500" },
    "on-hold": { bg: "bg-amber-50/60", dot: "bg-amber-500" },
    // Kept distinct from the new green In Progress so Closed doesn't blend
    // into it — gray also matches Closed already being the de-emphasized,
    // collapsed-by-default section.
    done: { bg: "bg-slate-50/70", dot: "bg-slate-400" },
  };

  tasks.forEach((task) => {
    grouped[task.status]?.push(task);
  });

  const handleAddTask = async (newTask) => {
    try {
      // No local state to update here: DataContext's live listener will
      // pick up the new task as soon as Firestore echoes the write.
      await addDoc(collection(db, "users", currentUser.uid, "tasks"), {
        title: newTask.title,
        status: newTask.status,
        priority: "medium",
        createdAt: serverTimestamp(),
        subTasks: [],
        // 🔁 Recurring fields
        recurring: newTask.recurring || false,
        recurringInterval: newTask.recurring
          ? newTask.recurringInterval
          : null,
        lastOccurrence: newTask.recurring ? newTask.lastOccurrence : null,
        recurringOccurrenceCount: newTask.recurring ? 0 : null,
      });

      setShowAddTask(false);
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

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
        {showAddTask && <AddTaskForm onAdd={handleAddTask} />}
      </div>

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
        const style = statusStyles[taskStatus];

        return (
          <div
            key={taskStatus}
            className={`mb-8 rounded-2xl p-4 ${style.bg}`}
          >
            <div
              className={`text-accent font-serif italic text-lg mb-2 border-b border-black/5 pb-1 flex justify-between items-center cursor-pointer ${
                isClosed ? "hover:opacity-80" : ""
              }`}
              onClick={() => isClosed && setShowClosed((prev) => !prev)}
            >
              <span className="flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} />
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
                    collapseSubtasks={settings?.collapseCompletedSubtasks}
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
