// TaskDetail.js (refactored)
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";
import TaskHeader from "./TaskHeader";
import TaskMetaControls from "./TaskMetaControls";
import SubtaskList from "./SubtaskList";
import DeleteConfirmModal from "./DeleteConfirmModal";

function TaskDetail({ collapseSubtasks = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const taskRef = doc(db, "users", currentUser.uid, "tasks", id);

  useEffect(() => {
    const fetchTask = async () => {
      const snapshot = await getDoc(taskRef);
      if (snapshot.exists()) {
        setTask({ id: snapshot.id, ...snapshot.data() });
      }
      setLoading(false);
    };
    fetchTask();
  }, [id, currentUser.uid, taskRef]);

  const handleUpdateTask = async (updates) => {
    setTask((prev) => ({ ...prev, ...updates }));
  };

  const handleDeleteTask = async () => {
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
      <TaskMetaControls task={task} taskRef={taskRef} onUpdate={handleUpdateTask} />
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
