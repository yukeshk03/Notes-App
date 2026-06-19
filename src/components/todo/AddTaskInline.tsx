import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddTaskInlineProps {
  onAdd: (title: string) => void;
  compact?: boolean;
}

export function AddTaskInline({ onAdd, compact = false }: AddTaskInlineProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');

  const submit = () => {
    if (title.trim()) onAdd(title.trim());
    setTitle('');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className={`flex items-center gap-2 text-sm font-medium text-[var(--text-faint)] hover:text-[var(--text-bright)] p-3 rounded-xl border border-transparent hover:border-[var(--border-light)] hover:bg-[var(--bg-panel)] transition-all ${
          compact ? 'py-2 px-3' : ''
        }`}
      >
        <Plus className="w-4 h-4" />
        <span>Add Task</span>
      </button>
    );
  }

  return (
    <div className="bg-[var(--bg-panel)] rounded-2xl shadow-lg border border-[var(--border-base)] p-4 relative w-full animate-pop-in">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') {
            setTitle('');
            setIsAdding(false);
          }
        }}
        placeholder="Task title…"
        className="w-full text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 text-[var(--text-secondary)] placeholder:text-[var(--text-very-faint)] mb-3"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            setTitle('');
            setIsAdding(false);
          }}
          className="text-xs font-medium text-[var(--text-faint)] hover:text-[var(--text-tertiary)] px-3 py-1.5 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          className="text-xs font-semibold bg-[var(--text-primary)] text-[var(--bg-panel)] rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity shadow-sm focus:ring-2 focus:ring-[var(--border-base)] focus:ring-offset-1"
        >
          Add
        </button>
      </div>
    </div>
  );
}
