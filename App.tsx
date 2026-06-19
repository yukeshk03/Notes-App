import { useEffect, useMemo, useRef, useState } from 'react';
import { Menu, FileText } from 'lucide-react';
import { useNotes } from './hooks/useNotes';
import { useTodos } from './hooks/useTodos';
import { NavRail } from './components/NavRail';
import { Sidebar, SortMode } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { TodoView } from './components/TodoView';
import { NotebooksView } from './components/NotebooksView';
import { TrashView } from './components/TrashView';
import { SettingsModal } from './components/SettingsModal';
import { CommandPalette } from './components/CommandPalette';
import { Note, Todo, ViewMode } from './types';
import { generateId } from './utils/id';
import { useToast } from './context/ToastContext';
import { useConfirm } from './context/ConfirmContext';
import { useLocalStorageState } from './hooks/useLocalStorage';

export default function App() {
  const { notes, setNotes } = useNotes();
  const { todos, setTodos } = useTodos();
  const toast = useToast();
  const confirm = useConfirm();

  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('updated');

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeNotebook, setActiveNotebook] = useState<string | null>(null);
  const [openMenuNoteId, setOpenMenuNoteId] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isDarkMode, setIsDarkMode] = useLocalStorageState<boolean>('v1_aether_theme_v2', () => {
    try {
      const legacy = localStorage.getItem('v1_aether_theme');
      if (legacy) return legacy === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const [customCategories, setCustomCategories] = useLocalStorageState<string[]>('v1_aether_custom_cats', []);

  const [todoStages, setTodoStages] = useLocalStorageState<string[]>('v1_todo_stages', ['To Do', 'In Progress', 'Done']);
  const [defaultStage, setDefaultStage] = useLocalStorageState<string>('v1_todo_default_stage_v2', () => {
    try {
      return localStorage.getItem('v1_todo_default_stage') || 'To Do';
    } catch {
      return 'To Do';
    }
  });

  const handleAddStage = (name: string) => {
    setTodoStages((prev) => (prev.includes(name) ? prev : [...prev, name]));
  };

  const handleRemoveStage = (name: string) => {
    setTodoStages((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((s) => s !== name);
      if (defaultStage === name) setDefaultStage(next[0] || 'To Do');
      return next;
    });
  };

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- Derived data -------------------------------------------------------

  const activeNotes = useMemo(() => notes.filter((n) => !n.deletedAt), [notes]);
  const activeTodos = useMemo(() => todos.filter((t) => !t.deletedAt), [todos]);
  const activeNote = activeNotes.find((n) => n.id === activeNoteId);

  const allCategories = useMemo(
    () => Array.from(new Set([...activeNotes.map((n) => n.category || 'Uncategorized'), ...customCategories])).sort(),
    [activeNotes, customCategories]
  );

  const trashCount = useMemo(() => notes.filter((n) => n.deletedAt).length + todos.filter((t) => t.deletedAt).length, [notes, todos]);

  // Keep the selected notebook tab valid as notebooks are added/removed.
  useEffect(() => {
    if (allCategories.length === 0) {
      if (activeNotebook !== null) setActiveNotebook(null);
    } else if (!activeNotebook || !allCategories.includes(activeNotebook)) {
      setActiveNotebook(allCategories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCategories]);

  // --- Note handlers --------------------------------------------------------

  const handleCreateNote = (defaultCategory?: string) => {
    const newNote: Note = {
      id: generateId(),
      title: '',
      content: '',
      tags: [],
      category: defaultCategory || 'Uncategorized',
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setViewMode((prev) => (prev === 'todo' || prev === 'trash' ? 'list' : prev));
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
    setIsMobileSidebarOpen(false);
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n)));
  };

  const handleDeleteNote = async (id: string) => {
    const ok = await confirm({
      title: 'Move this note to Trash?',
      description: "You can restore it from Trash within 30 days.",
      confirmLabel: 'Move to Trash',
      danger: true,
    });
    if (!ok) return;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deletedAt: Date.now() } : n)));
    if (activeNoteId === id) setActiveNoteId(null);
    toast.success('Note moved to Trash');
  };

  const handleCloneNote = (note: Note) => {
    const clone: Note = {
      ...note,
      id: generateId(),
      title: note.title ? `${note.title} (copy)` : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pinned: false,
    };
    setNotes((prev) => [clone, ...prev]);
    toast.success('Note cloned');
  };

  const handleRestoreNote = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, deletedAt: null } : n)));
    toast.success('Note restored');
  };

  const handlePermanentlyDeleteNote = async (id: string) => {
    const ok = await confirm({ title: 'Delete this note forever?', description: 'This cannot be undone.', confirmLabel: 'Delete forever', danger: true });
    if (!ok) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success('Note permanently deleted');
  };

  const handleCreateCategory = (name: string) => {
    setCustomCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
  };

  const handleAddCategory = () => {
    const name = newCategoryName.trim();
    if (name && !customCategories.includes(name)) {
      setCustomCategories((prev) => [...prev, name]);
    }
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  // --- Todo handlers ----------------------------------------------------

  const handleAddTodo = (todoData: Omit<Todo, 'id' | 'createdAt'>) => {
    setTodos((prev) => [...prev, { ...todoData, id: generateId(), createdAt: Date.now() }]);
  };

  const handleUpdateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, deletedAt: Date.now() } : t)));
  };

  const handleRestoreTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, deletedAt: null } : t)));
    toast.success('Task restored');
  };

  const handlePermanentlyDeleteTodo = async (id: string) => {
    const ok = await confirm({ title: 'Delete this task forever?', description: 'This cannot be undone.', confirmLabel: 'Delete forever', danger: true });
    if (!ok) return;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    toast.success('Task permanently deleted');
  };

  const handleEmptyTrash = () => {
    setNotes((prev) => prev.filter((n) => !n.deletedAt));
    setTodos((prev) => prev.filter((t) => !t.deletedAt));
    toast.success('Trash emptied');
  };

  // --- Settings -------------------------------------------------------------

  const handleResetAll = () => {
    setNotes([]);
    setTodos([]);
    setCustomCategories([]);
    setTodoStages(['To Do', 'In Progress', 'Done']);
    setDefaultStage('To Do');
    setActiveNoteId(null);
  };

  // --- Navigation -------------------------------------------------------------

  const handleNavigate = (view: ViewMode) => {
    setActiveNoteId(null);
    setViewMode(view);
    setIsMobileSidebarOpen(false);
  };

  // --- Global keyboard shortcuts ----------------------------------------------

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      } else if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateNote();
      } else if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setViewMode('list');
        setActiveNoteId(null);
        requestAnimationFrame(() => searchInputRef.current?.focus());
      } else if (e.key === 'Escape') {
        if (isCommandPaletteOpen || isSettingsOpen) return;
        const target = e.target as HTMLElement | null;
        const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
        if (isTyping) return;
        setActiveNoteId((prev) => (prev ? null : prev));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommandPaletteOpen, isSettingsOpen]);

  // --- Render -----------------------------------------------------------------

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[var(--bg-app)] text-[var(--text-primary)] font-sans antialiased">
      <NavRail
        viewMode={viewMode}
        hasActiveNote={Boolean(activeNoteId)}
        onCreateNote={() => handleCreateNote()}
        onNavigate={handleNavigate}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        trashCount={trashCount}
      />

      {viewMode === 'todo' ? (
        <TodoView
          todos={activeTodos}
          onAddTodo={handleAddTodo}
          onUpdateTodo={handleUpdateTodo}
          onDeleteTodo={handleDeleteTodo}
          stages={todoStages}
          defaultStage={defaultStage}
          onAddStage={handleAddStage}
          onRemoveStage={handleRemoveStage}
          onSetDefaultStage={setDefaultStage}
        />
      ) : viewMode === 'trash' ? (
        <TrashView
          notes={notes}
          todos={todos}
          onRestoreNote={handleRestoreNote}
          onPermanentlyDeleteNote={handlePermanentlyDeleteNote}
          onRestoreTodo={handleRestoreTodo}
          onPermanentlyDeleteTodo={handlePermanentlyDeleteTodo}
          onEmptyTrash={handleEmptyTrash}
        />
      ) : viewMode === 'notebook' || viewMode === 'board' ? (
        <NotebooksView
          notes={activeNotes}
          viewMode={viewMode}
          setViewMode={setViewMode}
          activeNotebook={activeNotebook}
          setActiveNotebook={setActiveNotebook}
          allCategories={allCategories}
          activeNoteId={activeNoteId}
          activeNote={activeNote}
          setActiveNoteId={setActiveNoteId}
          onCreateNote={handleCreateNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onCloneNote={handleCloneNote}
          onCreateCategory={handleCreateCategory}
          openMenuNoteId={openMenuNoteId}
          setOpenMenuNoteId={setOpenMenuNoteId}
          isAddingCategory={isAddingCategory}
          setIsAddingCategory={setIsAddingCategory}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          onAddCategory={handleAddCategory}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full min-w-0">
          <div className="lg:hidden flex items-center justify-between p-3 border-b border-[var(--border-light)] bg-[var(--bg-panel)] shrink-0">
            <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-secondary)]" aria-label="Open notes list">
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold text-[var(--text-primary)] truncate px-2">{activeNote ? activeNote.title || 'Untitled' : 'All Notes'}</span>
            <div className="w-9" />
          </div>
          <div className="flex-1 flex overflow-hidden min-h-0">
            <Sidebar
              ref={searchInputRef}
              notes={activeNotes}
              activeNoteId={activeNoteId}
              onSelectNote={setActiveNoteId}
              onCreateNote={() => handleCreateNote()}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              sortMode={sortMode}
              setSortMode={setSortMode}
              isOpenOnMobile={isMobileSidebarOpen}
              onCloseMobile={() => setIsMobileSidebarOpen(false)}
            />
            {activeNote ? (
              <NoteEditor
                allCategories={allCategories}
                note={activeNote}
                onUpdate={(updates) => handleUpdateNote(activeNote.id, updates)}
                onDelete={handleDeleteNote}
                onClose={() => setActiveNoteId(null)}
                onCreateCategory={handleCreateCategory}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-faint)] bg-[var(--bg-panel)] px-6">
                <div className="w-20 h-20 bg-[var(--bg-app)] shadow-sm rounded-2xl border border-[var(--border-light)] flex items-center justify-center mb-6">
                  <FileText className="w-8 h-8 text-[var(--text-very-faint)]" />
                </div>
                <h2 className="text-xl font-semibold text-[var(--text-tertiary)] mb-2">Select a note</h2>
                <p className="text-[15px] max-w-[280px] text-center mb-2 text-[var(--text-faint)]">
                  Choose a note from the list, or create a new one to get started.
                </p>
                <p className="text-xs text-[var(--text-very-faint)]">Tip: press Ctrl/Cmd+N anytime to start a new note.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          notes={notes}
          setNotes={setNotes}
          todos={todos}
          setTodos={setTodos}
          customCategories={customCategories}
          setCustomCategories={setCustomCategories}
          todoStages={todoStages}
          setTodoStages={setTodoStages}
          defaultStage={defaultStage}
          onResetAll={handleResetAll}
        />
      )}

      {isCommandPaletteOpen && (
        <CommandPalette
          notes={notes}
          todos={todos}
          isDarkMode={isDarkMode}
          onClose={() => setIsCommandPaletteOpen(false)}
          onSelectNote={(id) => {
            setActiveNoteId(id);
            setViewMode('list');
          }}
          onCreateNote={() => handleCreateNote()}
          onGoToAllNotes={() => handleNavigate('list')}
          onGoToTodo={() => handleNavigate('todo')}
          onGoToNotebooks={() => handleNavigate('notebook')}
          onGoToTrash={() => handleNavigate('trash')}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />
      )}
    </div>
  );
}
