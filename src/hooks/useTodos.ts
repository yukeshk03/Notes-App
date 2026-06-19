import { useEffect } from 'react';
import { useLocalStorageState } from './useLocalStorage';
import { Todo } from '../types';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'v1_aether_todos_data';
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function createStarterTodo(): Todo {
  const today = new Date().toISOString().split('T')[0];
  return {
    id: generateId(),
    title: 'Review weekly progress',
    description: 'Check analytics and note down insights for the week.',
    completed: false,
    date: today,
    createdAt: Date.now(),
    stage: 'To Do',
  };
}

export function useTodos() {
  const [todos, setTodos] = useLocalStorageState<Todo[]>(STORAGE_KEY, () => [createStarterTodo()]);

  // One-time sweep: permanently drop tasks that have sat in Trash past the retention window.
  useEffect(() => {
    const cutoff = Date.now() - TRASH_RETENTION_MS;
    setTodos((prev) => {
      const next = prev.filter((t) => !t.deletedAt || t.deletedAt > cutoff);
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { todos, setTodos, isLoaded: true };
}
