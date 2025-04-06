import TaskList from "./components/TaskList";
import TaskDetail from "./components/TaskDetail";
import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword"; // ✅ newly added
import { useAuth } from "./context/AuthContext";
import Logout from "./components/Logout";

function App() {
  const [triggerFetch, setTriggerFetch] = useState(false);
  const { currentUser } = useAuth();

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
                        Task Manager
                      </h1>
                      <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
                      <p className="mt-2 text-sm text-gray-500">
                        Stay on top of your goals, one task at a time.
                      </p>
                      <div className="text-right mt-4">
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
                  <TaskDetail userId={currentUser.uid} />
                ) : (
                  <Navigate to="/login" />
                )
              }
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
