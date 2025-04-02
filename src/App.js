import AddTask from './components/AddTask';
import TaskList from './components/TaskList';
import { useState } from 'react';

function App() {
  const [triggerFetch, setTriggerFetch] = useState(false);

  return (
    <div className="min-h-screen bg-soft text-primary font-sans px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Task Manager</h1>
          <div className="w-16 h-1 mx-auto bg-accent rounded"></div>
        </header>

        <AddTask onTaskAdded={() => setTriggerFetch(prev => !prev)} />

        <div className="mt-8">
          <TaskList triggerFetch={triggerFetch} />
        </div>
      </div>
    </div>
  );
}

export default App;
