import { useEffect, useState } from "react";
import { updateDoc } from "firebase/firestore";

function TaskMetaControls({ task, taskRef, onUpdate }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!task.timerStart || !task.timerDuration) {
      setTimeLeft(null);
      return;
    }

    const start = task.timerStart.toMillis?.() || new Date(task.timerStart).getTime();
    const duration = task.timerDuration;

    const updateRemaining = () => {
      const now = Date.now();
      const remaining = start + duration - now;
      setTimeLeft(remaining > 0 ? remaining : null);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 60000);
    return () => clearInterval(interval);
  }, [task.timerStart, task.timerDuration]);

  const formatTimeLeft = (ms) => {
    const totalMins = Math.floor(ms / 60000);
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return `${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}`;
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    await updateDoc(taskRef, { status: newStatus });
    onUpdate({ status: newStatus });
  };

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    await updateDoc(taskRef, { priority: newPriority });
    onUpdate({ priority: newPriority });
  };

  const handleSetTimer = async (durationMs) => {
    const now = Date.now();
    await updateDoc(taskRef, {
      timerStart: now,
      timerDuration: durationMs,
      notified15min: false,
    });
    onUpdate({ timerStart: now, timerDuration: durationMs });
  };

  const handleCancelTimer = async () => {
    await updateDoc(taskRef, {
      timerStart: null,
      timerDuration: null,
    });
    onUpdate({ timerStart: null, timerDuration: null });
    setTimeLeft(null);
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex gap-4">
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="on-hold">On Hold</option>
          <option value="done">Closed</option>
        </select>

        <select
          value={task.priority || "medium"}
          onChange={handlePriorityChange}
          className="border border-gray-300 rounded px-3 py-1"
        >
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>
      </div>

      {timeLeft && (
        <div className="text-sm text-orange-600 font-medium italic">
          ⏳ {formatTimeLeft(timeLeft)} left
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Set Timer:</label>
        <select
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (val) handleSetTimer(val);
          }}
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          defaultValue=""
        >
          <option value="">-- Choose --</option>
          <option value="1020000">17 min (test)</option>
          <option value="1800000">30 min</option>
          <option value="3600000">1 hour</option>
          <option value="7200000">2 hours</option>
          <option value="18000000">5 hours</option>
          <option value="28800000">8 hours</option>
        </select>
        {task.timerStart && task.timerDuration && (
          <button
            onClick={handleCancelTimer}
            className="text-xs text-red-600 underline"
          >
            Cancel Timer
          </button>
        )}
      </div>
    </div>
  );
}

export default TaskMetaControls;
