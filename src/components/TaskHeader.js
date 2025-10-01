import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateDoc } from "firebase/firestore";

/**
 * onOpenMenu is optional; when provided, a hamburger button
 * appears on the left to open the Side Menu.
 */
function TaskHeader({ task, taskRef, onUpdate, onOpenMenu }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);

  const handleTitleSave = async () => {
    if (!newTitle.trim()) return;
    await updateDoc(taskRef, { title: newTitle });
    onUpdate({ title: newTitle });
    setEditingTitle(false);
  };

  return (
    <div className="mb-6 flex items-center justify-between gap-2">
      {/* Hamburger (optional) */}
      {onOpenMenu && (
        <button
          onClick={onOpenMenu}
          className="p-2 rounded hover:bg-neutral-100"
          aria-label="Open menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}

      {editingTitle ? (
        <div className="flex-grow flex gap-2">
          <input
            className="border border-gray-300 rounded px-2 py-1 w-full"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <button
            className="text-sm text-green-600 hover:underline"
            onClick={handleTitleSave}
          >
            Save
          </button>
        </div>
      ) : (
        <div className="flex-grow flex items-center justify-between">
          <h2 className="text-xl font-semibold mr-2">{task.title}</h2>
          <button onClick={() => setEditingTitle(true)}>
            <Pencil size={18} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>
      )}
    </div>
  );
}

export default TaskHeader;
