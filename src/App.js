import TaskList from "./components/TaskList";
import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TaskDetail from "./components/TaskDetail"; //

function App() {
  const [triggerFetch, setTriggerFetch] = useState(false);

  return (
    <Router>
      <div className="min-h-screen bg-soft text-primary font-sans px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <header className="mb-10 text-center">
                    <h1 className="text-4xl font-bold tracking-tight mb-3 sm:mb-2">
                      Task Manager
                    </h1>
                    <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
                    <p className="mt-2 text-sm text-gray-500">
                      Stay on top of your goals, one task at a time.
                    </p>
                  </header>

                  <div className="mt-10">
                    <TaskList
                      triggerFetch={triggerFetch}
                      setTriggerFetch={setTriggerFetch}
                    />
                  </div>
                </>
              }
            />
            <Route path="/task/:id" element={<TaskDetail />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
