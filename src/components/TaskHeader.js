import { useState } from "react";
import { Pencil } from "lucide-react";
import { updateDoc } from "firebase/firestore";

function TaskHeader({ task, taskRef, onUpdate }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(task.title);

  const handleTitleSave = async () => {
    if (!newTitle.trim()) return;
    await updateDoc(taskRef, { title: newTitle });
    onUpdate({ title: newTitle });
    setEditingTitle(false);
  };

  return (
    <div className="mb-6 flex items-center justify-between">
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
