// SettingsPage.jsx
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

function Settings() {
  const { currentUser } = useAuth();
  const [collapseSubtasks, setCollapseSubtasks] = useState(false);
  const [loading, setLoading] = useState(true);

  const settingsRef = doc(db, "users", currentUser.uid, "settings", "preferences");

  useEffect(() => {
    const fetchSettings = async () => {
      const snap = await getDoc(settingsRef);
      if (snap.exists()) {
        const data = snap.data();
        setCollapseSubtasks(data.collapseCompletedSubtasks || false);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [currentUser.uid]);

  const handleToggle = async () => {
    const newValue = !collapseSubtasks;
    await setDoc(settingsRef, { collapseCompletedSubtasks: newValue }, { merge: true });
    setCollapseSubtasks(newValue);
  };

  if (loading) return <p className="text-center">Loading settings...</p>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Don't Collapse Completed Subtasks
        </label>
        <input
          type="checkbox"
          checked={collapseSubtasks}
          onChange={handleToggle}
          className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
      </div>
    </div>
  );
}

export default Settings;
