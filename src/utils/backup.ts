import { AppBackup, Note, Todo } from '../types';

export function buildBackup(data: {
  notes: Note[];
  todos: Todo[];
  customCategories: string[];
  todoStages: string[];
  defaultStage: string;
}): AppBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: data.notes,
    todos: data.todos,
    customCategories: data.customCategories,
    todoStages: data.todoStages,
    defaultStage: data.defaultStage,
  };
}

export function downloadBackup(backup: AppBackup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `notes-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Type guard + light validation for a parsed JSON backup file. */
export function isValidBackup(data: unknown): data is AppBackup {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.notes) && Array.isArray(obj.todos);
}

export function readBackupFile(file: File): Promise<AppBackup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isValidBackup(parsed)) {
          reject(new Error('This file does not look like a Notes backup.'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('Could not read that file as JSON.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsText(file);
  });
}
