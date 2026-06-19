import { ChevronDown, Circle, CheckCircle2, Trash, Bell, CalendarClock } from 'lucide-react';
import { Todo } from '../../types';

interface TodoItemProps {
  todo: Todo;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleComplete: () => void;
  onUpdate: (updates: Partial<Todo>) => void;
  onDelete: () => void;
  draggable?: boolean;
}

export function TodoItem({ todo, isExpanded, onToggleExpand, onToggleComplete, onUpdate, onDelete, draggable = true }: TodoItemProps) {
  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', todo.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group bg-[var(--bg-panel)] rounded-2xl shadow-sm border transition-all hover:shadow-md overflow-hidden relative ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${todo.completed ? 'border-[var(--border-light)] bg-[var(--bg-app)]/50' : 'border-[var(--border-light)]'}`}
    >
      <div className="p-4 flex items-start gap-3 w-full">
        <button onClick={onToggleComplete} className="mt-0.5 shrink-0 text-[var(--text-very-faint)] hover:text-[var(--text-primary)] transition-colors">
          {todo.completed ? <CheckCircle2 className="w-5 h-5 text-[var(--text-secondary)]" /> : <Circle className="w-5 h-5" />}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggleExpand}>
          <div className="flex justify-between items-start gap-2 w-full">
            <h4 className={`text-base font-semibold transition-all break-words ${todo.completed ? 'text-[var(--text-faint)] line-through' : 'text-[var(--text-secondary)]'}`}>
              {todo.title}
            </h4>
            {todo.reminder && !isExpanded && (
              <span className="text-xs shrink-0 text-[var(--text-muted)] flex items-center gap-1.5 mt-1">
                <Bell className="w-3 h-3 text-amber-500" /> {todo.reminder}
              </span>
            )}
          </div>
          {!isExpanded && todo.description && <p className="text-xs text-[var(--text-faint)] line-clamp-1 mt-1">{todo.description}</p>}
        </div>
        <button onClick={onToggleExpand} className="text-[var(--text-very-faint)] hover:text-[var(--text-muted)] transition-colors p-1 rounded hover:bg-[var(--bg-app)] shrink-0">
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 w-full">
          <textarea
            value={todo.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Add details…"
            className="w-full text-[13px] text-[var(--text-secondary)] bg-[var(--bg-app)] p-3 rounded-xl border border-[var(--border-light)] outline-none focus:border-[var(--border-base)] min-h-[80px] resize-y"
          />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <div className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-light)] px-3 py-1.5 rounded-lg">
              <CalendarClock className="w-3.5 h-3.5 text-[var(--text-faint)]" />
              <input
                type="date"
                value={todo.date}
                onChange={(e) => e.target.value && onUpdate({ date: e.target.value })}
                className="bg-transparent border-none outline-none text-xs text-[var(--text-secondary)] font-medium p-0 focus:ring-0 cursor-text"
                aria-label="Due date"
              />
            </div>
            <div className="flex items-center gap-2 bg-[var(--bg-app)] border border-[var(--border-light)] px-3 py-1.5 rounded-lg">
              <Bell className={`w-3.5 h-3.5 ${todo.reminder ? 'text-amber-500' : 'text-[var(--text-faint)]'}`} />
              <input
                type="time"
                value={todo.reminder || ''}
                onChange={(e) => onUpdate({ reminder: e.target.value })}
                className="bg-transparent border-none outline-none text-xs text-[var(--text-secondary)] font-medium p-0 focus:ring-0 w-[4.5rem] cursor-text"
                aria-label="Set reminder time"
              />
              {todo.reminder && (
                <button onClick={() => onUpdate({ reminder: undefined })} className="text-[var(--text-faint)] hover:text-red-500 ml-1">
                  <Trash className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={onDelete}
              title="Delete task"
              className="ml-auto text-red-500 hover:text-red-600 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {todo.completed && <div className="absolute inset-y-0 left-0 w-1 bg-[var(--text-muted)] opacity-50 rounded-l-2xl"></div>}
    </div>
  );
}
