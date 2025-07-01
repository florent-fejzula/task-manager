import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import { onMessage } from "firebase/messaging";
import { messaging } from "./firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/firebase";
import { useAuth } from "./context/AuthContext";
import { requestNotificationPermission } from "./firebase/requestPermission";

import TaskList from "./components/TaskList";
import TaskDetail from "./components/TaskDetail";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Settings from "./pages/Settings";
import Logout from "./components/Logout";

function TaskDetailWithSettings({ userId }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const ref = doc(db, "users", userId, "settings", "preferences");
      const snap = await getDoc(ref);
      setSettings(snap.exists() ? snap.data() : {});
      setLoading(false);
    };
    fetchSettings();
  }, [userId]);

  if (loading) {
    return (
      <p className="text-center mt-8 text-sm text-gray-500">
        Loading task settings...
      </p>
    );
  }

  return <TaskDetail collapseSubtasks={settings?.collapseCompletedSubtasks} />;
}

function App() {
  const [triggerFetch, setTriggerFetch] = useState(false);
  const { currentUser } = useAuth();

  // ✅ Notifications
  useEffect(() => {
    if (!currentUser) return;

    requestNotificationPermission(currentUser.uid);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 Foreground message received:", payload);

      if (Notification.permission === "granted") {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: "/icons/icon-192x192.png",
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <Router>
      <div className="min-h-screen bg-soft text-primary font-sans px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                currentUser ? (
                  <>
                    <header className="mb-10 text-center">
                      <h1 className="text-4xl font-bold tracking-tight mb-3 sm:mb-2">
                        Task Manager 9
                      </h1>
                      <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        Stay on top of your goals, one task at a time.
                      </p>
                      <div className="text-right mt-4 flex justify-end items-center gap-4">
                        <Link
                          to="/settings"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          ⚙️ Settings
                        </Link>
                        <Logout />
                      </div>
                    </header>

                    <div className="mt-10">
                      <TaskList
                        triggerFetch={triggerFetch}
                        setTriggerFetch={setTriggerFetch}
                        userId={currentUser.uid}
                      />
                    </div>
                  </>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/task/:id"
              element={
                currentUser ? (
                  <TaskDetailWithSettings userId={currentUser.uid} />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/settings"
              element={currentUser ? <Settings /> : <Navigate to="/login" />}
            />
            <Route
              path="/login"
              element={!currentUser ? <Login /> : <Navigate to="/" />}
            />
            <Route
              path="/signup"
              element={!currentUser ? <SignUp /> : <Navigate to="/" />}
            />
            <Route
              path="/forgot-password"
              element={!currentUser ? <ForgotPassword /> : <Navigate to="/" />}
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
