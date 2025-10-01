import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "./AuthContext";

const DataCtx = createContext(null);

export function DataProvider({ children }) {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]); // array for easy mapping
  const [taskMap, setTaskMap] = useState({}); // id -> task for O(1) lookups
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setTaskMap({});
      setSettings(null);
      setLoading(false);
      return;
    }

    const uid = currentUser.uid;
    setLoading(true);

    // Subscribe to tasks once; Firestore will serve from local cache instantly,
    // then update if network returns fresher data.
    const tasksQ = query(
      collection(db, "users", uid, "tasks"),
      orderBy("createdAt", "desc") // adjust if you use another sort
    );
    const unsubTasks = onSnapshot(tasksQ, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const map = Object.fromEntries(arr.map((t) => [t.id, t]));
      setTasks(arr);
      setTaskMap(map);
      setLoading(false);
    });

    // Subscribe to settings doc
    const settingsRef = doc(db, "users", uid, "settings", "preferences");
    const unsubSettings = onSnapshot(settingsRef, (snap) => {
      setSettings(snap.exists() ? snap.data() : {});
    });

    return () => {
      unsubTasks();
      unsubSettings();
    };
  }, [currentUser]);

  const value = useMemo(
    () => ({
      tasks,
      taskMap,
      settings,
      loading,
    }),
    [tasks, taskMap, settings, loading]
  );

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}

export function useData() {
  return (
    useContext(DataCtx) || {
      tasks: [],
      taskMap: {},
      settings: null,
      loading: true,
    }
  );
}
