import { useState } from 'react';
import { Settings, Trash } from 'lucide-react';
import { Todo } from '../../types';
import { TodoItem } from './TodoItem';
import { AddTaskInline } from './AddTaskInline';

interface KanbanBoardProps {
  todos: Todo[];
  stages: string[];
  defaultStage: string;
  expandedTasks: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  onAddTodo: (title: string, stage: string) => void;
  onAddStage: (name: string) => void;
  onRemoveStage: (name: string) => void;
  onSetDefaultStage: (name: string) => void;
}

export function KanbanBoard({
  todos,
  stages,
  defaultStage,
  expandedTasks,
  onToggleExpand,
  onToggleComplete,
  onUpdateTodo,
  onDeleteTodo,
  onAddTodo,
  onAddStage,
  onRemoveStage,
  onSetDefaultStage,
}: KanbanBoardProps) {
  const [isManagingStages, setIsManagingStages] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  const handleAddStage = () => {
    if (newStageName.trim()) onAddStage(newStageName.trim());
    setNewStageName('');
  };

  return (
    <div className="flex-1 overflow-x-auto p-6 md:p-8 flex gap-6 items-start h-full scrollbar-hide">
      {stages.map((stage) => {
        const stageTodos = todos.filter((t) => (t.stage || defaultStage) === stage);
        return (
          <div
            key={stage}
            className="w-80 shrink-0 flex flex-col gap-4 bg-[var(--bg-panel)] p-5 rounded-3xl border border-[var(--border-light)] max-h-full"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              const todoId = e.dataTransfer.getData('text/plain');
              if (todoId) onUpdateTodo(todoId, { stage });
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[var(--text-primary)]">{stage}</h3>
              <span className="text-xs bg-[var(--bg-card)] text-[var(--text-tertiary)] px-2 py-0.5 rounded-full font-bold">{stageTodos.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-3">
              {stageTodos.length === 0 && (
                <p className="text-xs text-[var(--text-faint)] text-center py-4">Nothing here yet.</p>
              )}
              {stageTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isExpanded={Boolean(expandedTasks[todo.id])}
                  onToggleExpand={() => onToggleExpand(todo.id)}
                  onToggleComplete={() => onToggleComplete(todo.id)}
                  onUpdate={(updates) => onUpdateTodo(todo.id, updates)}
                  onDelete={() => onDeleteTodo(todo.id)}
                />
              ))}
              <AddTaskInline onAdd={(title) => onAddTodo(title, stage)} compact />
            </div>
          </div>
        );
      })}

      {isManagingStages ? (
        <div className="w-80 shrink-0 flex flex-col gap-4 bg-[var(--bg-panel)] p-5 rounded-3xl border border-[var(--border-light)]">
          <h3 className="font-bold text-[var(--text-primary)]">Manage Stages</h3>
          <div className="flex flex-col gap-2">
            {stages.map((s) => (
              <div key={s} className="flex items-center justify-between bg-[var(--bg-card)] p-2 rounded-lg text-sm text-[var(--text-secondary)]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={defaultStage === s} onChange={() => onSetDefaultStage(s)} title="Set as default stage" className="accent-[var(--text-primary)]" />
                  <span>{s}</span>
                </label>
                <button onClick={() => onRemoveStage(s)} disabled={stages.length <= 1} className="text-red-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed">
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
              placeholder="New stage…"
              className="flex-1 text-sm bg-[var(--bg-app)] border border-[var(--border-light)] rounded p-2 text-[var(--text-primary)] outline-none"
            />
            <button onClick={handleAddStage} className="bg-[var(--text-primary)] text-[var(--bg-panel)] px-3 py-2 rounded text-xs font-bold">
              +
            </button>
          </div>
          <button onClick={() => setIsManagingStages(false)} className="mt-2 text-xs text-[var(--text-faint)] hover:text-[var(--text-secondary)]">
            Done
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsManagingStages(true)}
          className="w-80 shrink-0 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-[var(--border-light)] hover:border-[var(--border-base)] rounded-3xl text-[var(--text-faint)] hover:text-[var(--text-secondary)] transition-all font-semibold"
        >
          <Settings className="w-4 h-4" /> Manage Stages
        </button>
      )}
    </div>
  );
}
