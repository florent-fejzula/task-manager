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
import SideMenu from "./components/SideMenu"; // ⬅️ add this

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

  // side menu state
  const [menuOpen, setMenuOpen] = useState(false);

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
        {/* Top header with hamburger */}
        <button
          onClick={() => setMenuOpen(true)}
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

        <div className="max-w-2xl mx-auto">
          {/* Global Side Menu (Settings + Logout) */}
          <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)}>
            {/* We’ll inject your two items here via children */}
            <nav className="p-2 space-y-1">
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-base hover:bg-neutral-100"
              >
                ⚙️ Settings
              </Link>
              <div className="px-2 pt-1">
                <Logout />
              </div>
            </nav>
          </SideMenu>

          <Routes>
            <Route
              path="/"
              element={
                currentUser ? (
                  <>
                    <header className="mb-10 text-center">
                      <h1 className="text-4xl font-bold tracking-tight">
                        Task Manager 9.1
                      </h1>
                      <div className="w-16 h-1 mx-auto mt-2 bg-accent rounded"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        Stay on top of your goals, one task at a time.
                      </p>
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
