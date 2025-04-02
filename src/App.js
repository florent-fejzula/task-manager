import AddTask from './components/AddTask';
import TaskList from './components/TaskList';
import { useState } from 'react';

function App() {
  const [triggerFetch, setTriggerFetch] = useState(false);

  return (
    <div>
      <h1>Task Manager</h1>
      <AddTask onTaskAdded={() => setTriggerFetch(prev => !prev)} />
      <TaskList triggerFetch={triggerFetch} />
    </div>
  );
}

export default App;
