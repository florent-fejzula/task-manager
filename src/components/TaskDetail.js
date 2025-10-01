// src/components/TaskDetail.js
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext"; // ⬅️ read cached tasks/settings
import TaskHeader from "./TaskHeader";
import TaskMetaControls from "./TaskMetaControls";
import SubtaskList from "./SubtaskList";
import DeleteConfirmModal from "./DeleteConfirmModal";

function TaskDetail({ collapseSubtasks = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { taskMap } = useData();

  // If we have it in memory, render immediately; otherwise brief spinner.
  const [task, setTask] = useState(taskMap[id] || null);
  const [loading, setLoading] = useState(!task);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const taskRef = currentUser && doc(db, "users", currentUser.uid, "tasks", id);

  // Live subscribe to this task (cache-first thanks to Firestore persistence)
  useEffect(() => {
    if (!taskRef) return;
    // show spinner only if we don't already have it in memory
    setLoading(!taskMap[id]);

    const unsub = onSnapshot(taskRef, (snap) => {
      if (snap.exists()) {
        setTask({ id: snap.id, ...snap.data() });
      } else {
        setTask(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id, taskRef, taskMap]);

  const handleUpdateTask = (updates) => {
    // optimistic UI; Firestore listener will confirm/adjust
    setTask((prev) => ({ ...prev, ...updates }));
  };

  const handleDeleteTask = async () => {
    if (!taskRef) return;
    await deleteDoc(taskRef);
    navigate("/");
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
    <div
      className={`bg-white shadow-md rounded-lg p-6 sm:p-8 max-w-xl mx-auto mt-8 border ${priorityClass}`}
    >
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="text-sm text-blue-600 hover:underline">
          ← Back
        </Link>
        <span className="text-xs text-gray-400">Task Detail</span>
      </div>

      <TaskHeader task={task} taskRef={taskRef} onUpdate={handleUpdateTask} />
      <TaskMetaControls
        task={task}
        taskRef={taskRef}
        onUpdate={handleUpdateTask}
      />
      <SubtaskList
        task={task}
        taskRef={taskRef}
        onUpdate={handleUpdateTask}
        collapseSubtasks={collapseSubtasks}
      />

      <button
        onClick={() => setShowConfirmDelete(true)}
        className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 w-full"
      >
        Delete Task
      </button>

      {showConfirmDelete && (
        <DeleteConfirmModal
          onCancel={() => setShowConfirmDelete(false)}
          onConfirm={handleDeleteTask}
        />
      )}
    </div>
  );
}

export default TaskDetail;
