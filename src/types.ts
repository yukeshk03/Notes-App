export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  updatedAt: number;
  createdAt: number;
  pinned?: boolean;
  /** Timestamp the note was moved to Trash, or null/undefined if active. */
  deletedAt?: number | null;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
  reminder?: string;
  createdAt: number;
  stage?: string;
  /** Timestamp the task was moved to Trash, or null/undefined if active. */
  deletedAt?: number | null;
}

export type ViewMode = 'list' | 'board' | 'todo' | 'notebook' | 'trash';

export type ThemeMode = 'light' | 'dark';

export interface AppBackup {
  version: 1;
  exportedAt: string;
  notes: Note[];
  todos: Todo[];
  customCategories: string[];
  todoStages: string[];
  defaultStage: string;
}
