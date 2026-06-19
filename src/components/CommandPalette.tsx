import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { Search, FileText, CheckSquare, Plus, Moon, Sun, Settings, Trash2, Book, LayoutList } from 'lucide-react';
import { Note, Todo } from '../types';
import { stripMarkdownPreview } from '../utils/text';

interface CommandPaletteProps {
  notes: Note[];
  todos: Todo[];
  isDarkMode: boolean;
  onClose: () => void;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  onGoToAllNotes: () => void;
  onGoToTodo: () => void;
  onGoToNotebooks: () => void;
  onGoToTrash: () => void;
  onOpenSettings: () => void;
  onToggleTheme: () => void;
}

type ResultItem = {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  onSelect: () => void;
};

export function CommandPalette({
  notes,
  todos,
  isDarkMode,
  onClose,
  onSelectNote,
  onCreateNote,
  onGoToAllNotes,
  onGoToTodo,
  onGoToNotebooks,
  onGoToTrash,
  onOpenSettings,
  onToggleTheme,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const activeNotes = useMemo(() => notes.filter((n) => !n.deletedAt), [notes]);
  const activeTodos = useMemo(() => todos.filter((t) => !t.deletedAt), [todos]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    const items: ResultItem[] = [];

    const actions: ResultItem[] = [
      { id: 'act-new-note', icon: <Plus className="w-4 h-4" />, title: 'New note', onSelect: onCreateNote },
      { id: 'act-all-notes', icon: <LayoutList className="w-4 h-4" />, title: 'Go to All Notes', onSelect: onGoToAllNotes },
      { id: 'act-todo', icon: <CheckSquare className="w-4 h-4" />, title: 'Go to To-Do', onSelect: onGoToTodo },
      { id: 'act-notebooks', icon: <Book className="w-4 h-4" />, title: 'Go to Notebooks', onSelect: onGoToNotebooks },
      { id: 'act-trash', icon: <Trash2 className="w-4 h-4" />, title: 'Go to Trash', onSelect: onGoToTrash },
      {
        id: 'act-theme',
        icon: isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />,
        title: isDarkMode ? 'Switch to light mode' : 'Switch to dark mode',
        onSelect: onToggleTheme,
      },
      { id: 'act-settings', icon: <Settings className="w-4 h-4" />, title: 'Open settings', onSelect: onOpenSettings },
    ];

    if (!q) {
      items.push(...actions.slice(0, 3));
      activeNotes
        .slice()
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .forEach((n) =>
          items.push({
            id: `note-${n.id}`,
            icon: <FileText className="w-4 h-4" />,
            title: n.title || 'Untitled',
            subtitle: n.category || 'Uncategorized',
            onSelect: () => onSelectNote(n.id),
          })
        );
      return items;
    }

    actions.filter((a) => a.title.toLowerCase().includes(q)).forEach((a) => items.push(a));

    activeNotes
      .filter(
        (n) =>
          (n.title || '').toLowerCase().includes(q) ||
          stripMarkdownPreview(n.content).toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)) ||
          (n.category || '').toLowerCase().includes(q)
      )
      .slice(0, 8)
      .forEach((n) =>
        items.push({
          id: `note-${n.id}`,
          icon: <FileText className="w-4 h-4" />,
          title: n.title || 'Untitled',
          subtitle: n.category || 'Uncategorized',
          onSelect: () => onSelectNote(n.id),
        })
      );

    activeTodos
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 6)
      .forEach((t) =>
        items.push({
          id: `todo-${t.id}`,
          icon: <CheckSquare className="w-4 h-4" />,
          title: t.title,
          subtitle: t.date,
          onSelect: onGoToTodo,
        })
      );

    return items;
  }, [
    query,
    activeNotes,
    activeTodos,
    isDarkMode,
    onCreateNote,
    onGoToAllNotes,
    onGoToTodo,
    onGoToNotebooks,
    onGoToTrash,
    onOpenSettings,
    onToggleTheme,
    onSelectNote,
  ]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const choose = (item: ResultItem) => {
    item.onSelect();
    onClose();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) choose(results[activeIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[105] flex items-start justify-center bg-black/40 backdrop-blur-[2px] p-4 pt-[12vh] animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-2xl shadow-2xl overflow-hidden animate-pop-in"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-light)]">
          <Search className="w-4 h-4 text-[var(--text-faint)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, tasks, or jump to a view…"
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-faint)]"
          />
          <kbd className="text-[10px] font-bold text-[var(--text-faint)] bg-[var(--bg-card)] rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2 scrollbar-hide">
          {results.length === 0 ? (
            <p className="text-sm text-[var(--text-faint)] text-center py-8">No matches for "{query}"</p>
          ) : (
            results.map((item, i) => (
              <button
                key={item.id}
                onClick={() => choose(item)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  i === activeIndex ? 'bg-[var(--bg-card)]' : 'hover:bg-[var(--bg-card)]/60'
                }`}
              >
                <span className="text-[var(--text-faint)] shrink-0">{item.icon}</span>
                <span className="flex-1 min-w-0 text-sm font-semibold text-[var(--text-primary)] truncate">{item.title}</span>
                {item.subtitle && (
                  <span className="text-xs text-[var(--text-faint)] shrink-0 truncate max-w-[120px]">{item.subtitle}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
