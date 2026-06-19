import { useState } from 'react';
import { Todo } from '../types';
import { Columns, CalendarIcon, CheckCircle2, Circle } from 'lucide-react';
import { format, parseISO, isToday, startOfToday } from 'date-fns';
import { TodoItem } from './todo/TodoItem';
import { AddTaskInline } from './todo/AddTaskInline';
import { CalendarGrid } from './todo/CalendarGrid';
import { KanbanBoard } from './todo/KanbanBoard';

interface TodoViewProps {
  todos: Todo[];
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onDeleteTodo: (id: string) => void;
  stages: string[];
  defaultStage: string;
  onAddStage: (name: string) => void;
  onRemoveStage: (name: string) => void;
  onSetDefaultStage: (name: string) => void;
}

export function TodoView({ todos, onAddTodo, onUpdateTodo, onDeleteTodo, stages, defaultStage, onAddStage, onRemoveStage, onSetDefaultStage }: TodoViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(startOfToday());
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [todoViewMode, setTodoViewMode] = useState<'calendar' | 'kanban'>('calendar');

  const groupedTodos = todos.reduce<Record<string, Todo[]>>((acc, todo) => {
    (acc[todo.date] ||= []).push(todo);
    return acc;
  }, {});

  const handleAddTask = (date: string, title: string) => {
    onAddTodo({ title, description: '', completed: false, date, stage: defaultStage });
  };

  const toggleTaskExpand = (id: string) => {
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDropTodoOnDate = (todoId: string, date: string) => {
    onUpdateTodo(todoId, { date });
    setSelectedDate(date);
  };

  const selectedDateIsToday = isToday(parseISO(selectedDate));
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden min-w-0">
      <header className="min-h-16 bg-[var(--bg-panel)] border-b border-[var(--border-light)] flex flex-wrap items-center justify-between gap-3 px-4 sm:px-8 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">To-Do List</h1>
          <div className="flex bg-[var(--bg-card)] rounded-lg p-1">
            <button
              onClick={() => setTodoViewMode('calendar')}
              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                todoViewMode === 'calendar' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Calendar
            </button>
            <button
              onClick={() => setTodoViewMode('kanban')}
              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                todoViewMode === 'kanban' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" /> Kanban
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1.5 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--text-muted)]" />
            {todos.filter((t) => t.completed && t.date === todayStr).length} Done Today
          </div>
          <div className="px-3 py-1.5 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-2">
            <Circle className="w-4 h-4 text-[var(--text-muted)]" />
            {todos.filter((t) => !t.completed && t.date === todayStr).length} Pending Today
          </div>
        </div>
      </header>

      {todoViewMode === 'kanban' ? (
        <KanbanBoard
          todos={todos}
          stages={stages}
          defaultStage={defaultStage}
          expandedTasks={expandedTasks}
          onToggleExpand={toggleTaskExpand}
          onToggleComplete={(id) => onUpdateTodo(id, { completed: !todos.find((t) => t.id === id)?.completed })}
          onUpdateTodo={onUpdateTodo}
          onDeleteTodo={onDeleteTodo}
          onAddTodo={(title, stage) => onAddTodo({ title, description: '', completed: false, date: todayStr, stage })}
          onAddStage={onAddStage}
          onRemoveStage={onRemoveStage}
          onSetDefaultStage={onSetDefaultStage}
        />
      ) : (
        <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col md:flex-row gap-6 h-full overflow-y-auto md:overflow-hidden w-full max-w-7xl mx-auto">
          {/* Left Panel: Selected Date's List */}
          <div className="flex-1 bg-[var(--bg-panel)] rounded-3xl shadow-sm border border-[var(--border-light)] flex flex-col overflow-hidden max-w-full md:max-w-sm shrink-0">
            <div className="p-6 border-b border-[var(--border-light)] flex items-center justify-between bg-[var(--bg-panel)] shrink-0">
              <div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedDateIsToday ? 'Today' : format(parseISO(selectedDate), 'EEEE')}</h2>
                <p className="text-xs font-medium text-[var(--text-faint)] mt-0.5">{format(parseISO(selectedDate), 'MMMM d, yyyy')}</p>
              </div>
              <span className="bg-[var(--bg-card)] text-[var(--text-tertiary)] text-xs font-bold px-2 py-1 rounded-full">{(groupedTodos[selectedDate] || []).length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 scrollbar-hide">
              {(groupedTodos[selectedDate] || [])
                .slice()
                .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    isExpanded={Boolean(expandedTasks[todo.id])}
                    onToggleExpand={() => toggleTaskExpand(todo.id)}
                    onToggleComplete={() => onUpdateTodo(todo.id, { completed: !todo.completed })}
                    onUpdate={(updates) => onUpdateTodo(todo.id, updates)}
                    onDelete={() => onDeleteTodo(todo.id)}
                  />
                ))}
              {(groupedTodos[selectedDate] || []).length === 0 && (
                <p className="text-sm text-[var(--text-faint)] text-center py-6">Nothing scheduled. Add a task below.</p>
              )}
              <AddTaskInline onAdd={(title) => handleAddTask(selectedDate, title)} />
            </div>
          </div>

          {/* Right Panel: Month calendar */}
          <div className="flex-1 bg-[var(--bg-panel)] rounded-3xl shadow-sm border border-[var(--border-light)] flex flex-col overflow-hidden min-h-[420px]">
            <div className="p-4 sm:p-6 h-full w-full font-sans">
              <CalendarGrid
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                groupedTodos={groupedTodos}
                onDropTodoOnDate={handleDropTodoOnDate}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
