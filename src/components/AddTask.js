import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';

function AddTask({ onTaskAdded }) {
  const [title, setTitle] = useState('');

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        title,
        status: 'todo',
        createdAt: serverTimestamp(),
        subTasks: []
      });

      // Add to UI immediately
      if (onTaskAdded) {
        onTaskAdded({
          id: docRef.id,
          title,
          status: 'todo',
          subTasks: [],
          createdAt: new Date() // temporary, we won't sort until re-fetch
        });
      }

      setTitle('');
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  return (
    <form onSubmit={handleAddTask}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task title..."
      />
      <button type="submit">Add Task</button>
    </form>
  );
}

export default AddTask;
