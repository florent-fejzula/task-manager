import { serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

function AddTask() {
  const [title, setTitle] = useState('');

  const handleAddTask = async (e) => {
    console.log("DB instance:", db);
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        status: 'todo',
        createdAt: serverTimestamp()
      });
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
