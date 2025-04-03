import AddTask from "./components/AddTask";
import TaskList from "./components/TaskList";
import { useState } from "react";

function App() {
  const [triggerFetch, setTriggerFetch] = useState(false);

  return (
    <div className="min-h-screen bg-soft text-primary font-sans px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3 sm:mb-2">
            Task Manager
          </h1>
          <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
          <p className="mt-2 text-sm text-gray-500">
            Stay on top of your goals, one task at a time.
          </p>
        </header>

        <AddTask onTaskAdded={() => setTriggerFetch((prev) => !prev)} />

        <div className="mt-10">
          <TaskList triggerFetch={triggerFetch} />
        </div>
      </div>
    </div>
  );
}

export default App;
