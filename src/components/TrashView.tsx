import { useState } from 'react';
import type { ReactNode } from 'react';
import { FileText, CheckSquare, RotateCcw, Trash2, Trash } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Note, Todo } from '../types';
import { useConfirm } from '../context/ConfirmContext';
import { stripMarkdownPreview } from '../utils/text';

interface TrashViewProps {
  notes: Note[];
  todos: Todo[];
  onRestoreNote: (id: string) => void;
  onPermanentlyDeleteNote: (id: string) => void;
  onRestoreTodo: (id: string) => void;
  onPermanentlyDeleteTodo: (id: string) => void;
  onEmptyTrash: () => void;
}

export function TrashView({
  notes,
  todos,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onRestoreTodo,
  onPermanentlyDeleteTodo,
  onEmptyTrash,
}: TrashViewProps) {
  const confirm = useConfirm();
  const [tab, setTab] = useState<'notes' | 'tasks'>('notes');

  const trashedNotes = notes.filter((n) => n.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  const trashedTodos = todos.filter((t) => t.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  const isEmpty = trashedNotes.length === 0 && trashedTodos.length === 0;

  const handleEmptyTrash = async () => {
    const ok = await confirm({
      title: 'Empty Trash?',
      description: `This permanently deletes ${trashedNotes.length} note(s) and ${trashedTodos.length} task(s). This cannot be undone.`,
      confirmLabel: 'Empty Trash',
      danger: true,
    });
    if (ok) onEmptyTrash();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
      <header className="h-16 bg-[var(--bg-panel)] border-b border-[var(--border-light)] flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Trash2 className="w-5 h-5" /> Trash
          </h1>
          <div className="flex bg-[var(--bg-card)] rounded-lg p-1">
            <button
              onClick={() => setTab('notes')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                tab === 'notes' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Notes ({trashedNotes.length})
            </button>
            <button
              onClick={() => setTab('tasks')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                tab === 'tasks' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              Tasks ({trashedTodos.length})
            </button>
          </div>
        </div>
        {!isEmpty && (
          <button onClick={handleEmptyTrash} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
            <Trash className="w-3.5 h-3.5" /> Empty Trash
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <p className="text-xs text-[var(--text-faint)] mb-6 max-w-prose">
          Items are kept here for 30 days before being permanently removed automatically.
        </p>

        {tab === 'notes' &&
          (trashedNotes.length === 0 ? (
            <EmptyState icon={<FileText className="w-8 h-8" />} label="No notes in Trash" />
          ) : (
            <div className="flex flex-col gap-2 max-w-2xl">
              {trashedNotes.map((n) => (
                <div key={n.id} className="flex items-center gap-3 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl p-4">
                  <FileText className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{n.title || 'Untitled'}</p>
                    <p className="text-xs text-[var(--text-faint)] truncate">{stripMarkdownPreview(n.content) || 'Empty note'}</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-faint)] shrink-0 hidden sm:block">
                    Deleted {formatDistanceToNowStrict(n.deletedAt || Date.now(), { addSuffix: true })}
                  </span>
                  <button onClick={() => onRestoreNote(n.id)} className="p-2 text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg transition-colors" title="Restore">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={() => onPermanentlyDeleteNote(n.id)} className="p-2 text-[var(--text-faint)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete forever">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}

        {tab === 'tasks' &&
          (trashedTodos.length === 0 ? (
            <EmptyState icon={<CheckSquare className="w-8 h-8" />} label="No tasks in Trash" />
          ) : (
            <div className="flex flex-col gap-2 max-w-2xl">
              {trashedTodos.map((t) => (
                <div key={t.id} className="flex items-center gap-3 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-xl p-4">
                  <CheckSquare className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold text-[var(--text-primary)] truncate ${t.completed ? 'line-through opacity-60' : ''}`}>{t.title}</p>
                    <p className="text-xs text-[var(--text-faint)] truncate">{t.date}</p>
                  </div>
                  <span className="text-[10px] text-[var(--text-faint)] shrink-0 hidden sm:block">
                    Deleted {formatDistanceToNowStrict(t.deletedAt || Date.now(), { addSuffix: true })}
                  </span>
                  <button onClick={() => onRestoreTodo(t.id)} className="p-2 text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)] rounded-lg transition-colors" title="Restore">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={() => onPermanentlyDeleteTodo(t.id)} className="p-2 text-[var(--text-faint)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete forever">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

function EmptyState({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-[var(--text-very-faint)] py-24">
      <div className="w-16 h-16 bg-[var(--bg-panel)] shadow-sm rounded-2xl border border-[var(--border-light)] flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-sm font-medium text-[var(--text-faint)]">{label}</p>
    </div>
  );
}
