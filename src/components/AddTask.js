import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";

function AddTask({ onTaskAdded }) {
  const [title, setTitle] = useState("");

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const docRef = await addDoc(collection(db, "tasks"), {
        title,
        status: "todo",
        createdAt: serverTimestamp(),
        subTasks: [],
      });

      if (onTaskAdded) {
        onTaskAdded({
          id: docRef.id,
          title,
          status: "todo",
          subTasks: [],
          createdAt: new Date(),
        });
      }

      setTitle("");
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  return (
    <form
      onSubmit={handleAddTask}
      className="flex flex-col sm:flex-row gap-2 mb-6"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title..."
        className="w-full sm:flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-base text-gray-800"
      />
      <button
        type="submit"
        className="w-full sm:w-auto px-4 py-2 bg-accent text-white rounded-md text-base hover:bg-green-700 transition"
      >
        Add Task
      </button>
    </form>
  );
}

export default AddTask;
