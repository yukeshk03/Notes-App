import { Book, Columns, LayoutGrid, Plus, Check, X } from 'lucide-react';
import { Note, ViewMode } from '../types';
import { NoteCard } from './NoteCard';
import { NoteEditor } from './NoteEditor';

interface NotebooksViewProps {
  notes: Note[];
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  activeNotebook: string | null;
  setActiveNotebook: (c: string | null) => void;
  allCategories: string[];
  activeNoteId: string | null;
  activeNote: Note | undefined;
  setActiveNoteId: (id: string | null) => void;
  onCreateNote: (category?: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onCloneNote: (note: Note) => void;
  onCreateCategory: (name: string) => void;
  openMenuNoteId: string | null;
  setOpenMenuNoteId: (id: string | null) => void;
  isAddingCategory: boolean;
  setIsAddingCategory: (v: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (v: string) => void;
  onAddCategory: () => void;
}

export function NotebooksView({
  notes,
  viewMode,
  setViewMode,
  activeNotebook,
  setActiveNotebook,
  allCategories,
  activeNoteId,
  activeNote,
  setActiveNoteId,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onCloneNote,
  onCreateCategory,
  openMenuNoteId,
  setOpenMenuNoteId,
  isAddingCategory,
  setIsAddingCategory,
  newCategoryName,
  setNewCategoryName,
  onAddCategory,
}: NotebooksViewProps) {
  const currentTab = activeNotebook || allCategories[0] || 'Uncategorized';

  const renderCard = (n: Note, variant: 'row' | 'grid') => (
    <NoteCard
      key={n.id}
      note={n}
      variant={variant}
      allCategories={allCategories}
      isMenuOpen={openMenuNoteId === n.id}
      onOpen={() => setActiveNoteId(n.id)}
      onTogglePin={() => onUpdateNote(n.id, { pinned: !n.pinned })}
      onMoveCategory={(c) => {
        onUpdateNote(n.id, { category: c });
        setOpenMenuNoteId(null);
      }}
      onClone={() => {
        onCloneNote(n);
        setOpenMenuNoteId(null);
      }}
      onDelete={() => {
        onDeleteNote(n.id);
        setOpenMenuNoteId(null);
      }}
      onToggleMenu={() => setOpenMenuNoteId(openMenuNoteId === n.id ? null : n.id)}
      onCloseMenu={() => setOpenMenuNoteId(null)}
    />
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden p-4 sm:p-6 md:p-8 min-w-0">
      <div className="flex items-center gap-2 shrink-0 overflow-x-auto scrollbar-hide px-2 border-b border-[var(--border-light)] mb-4 pb-1">
        <div className="flex items-center gap-4 mr-6 shrink-0">
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Book className="w-5 h-5" /> Notebooks
          </h2>
          <div className="flex bg-[var(--bg-panel)] p-1 rounded-lg border border-[var(--border-light)]">
            <button
              onClick={() => {
                setViewMode('notebook');
                setActiveNoteId(null);
              }}
              className={`p-1.5 rounded-md ${viewMode === 'notebook' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-faint)] hover:text-[var(--text-secondary)]'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('board');
                setActiveNoteId(null);
              }}
              className={`p-1.5 rounded-md ${viewMode === 'board' ? 'bg-[var(--bg-card)] shadow-sm text-[var(--text-primary)]' : 'text-[var(--text-faint)] hover:text-[var(--text-secondary)]'}`}
              title="Board View"
            >
              <Columns className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === 'notebook' &&
          allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveNotebook(cat);
                setActiveNoteId(null);
              }}
              className={`shrink-0 px-4 py-2.5 font-bold text-sm transition-all border-b-2 rounded-t-lg ${
                currentTab === cat
                  ? 'border-[var(--text-primary)] text-[var(--text-primary)] bg-[var(--bg-panel)]'
                  : 'border-transparent text-[var(--text-faint)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-panel)]/50'
              }`}
            >
              {cat}
            </button>
          ))}

        {viewMode === 'notebook' && (
          <div className="ml-4 shrink-0 flex items-center">
            {isAddingCategory ? (
              <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-light)] rounded-lg px-2 py-1 shadow-sm h-[36px]">
                <input
                  autoFocus
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onAddCategory();
                    if (e.key === 'Escape') setIsAddingCategory(false);
                  }}
                  className="bg-transparent border-none outline-none text-sm w-32 font-medium text-[var(--text-primary)] placeholder:text-[var(--text-faint)]"
                  placeholder="New notebook…"
                />
                <button onClick={onAddCategory} className="p-1 hover:bg-[var(--bg-panel)] rounded">
                  <Check className="w-3 h-3 text-[var(--text-primary)]" />
                </button>
                <button onClick={() => setIsAddingCategory(false)} className="p-1 hover:bg-[var(--bg-panel)] rounded">
                  <X className="w-3 h-3 text-[var(--text-muted)]" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingCategory(true)}
                className="px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] bg-[var(--bg-card)] hover:bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg flex items-center gap-1.5 transition-colors h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" /> New notebook
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto pb-8">
        {activeNoteId && activeNote ? (
          <div className="h-full bg-[var(--bg-panel)] rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-[var(--border-light)] overflow-hidden max-w-5xl mx-auto mt-4">
            <NoteEditor
              allCategories={allCategories}
              note={activeNote}
              onUpdate={(updates) => onUpdateNote(activeNote.id, updates)}
              onDelete={onDeleteNote}
              onClose={() => setActiveNoteId(null)}
              onCreateCategory={onCreateCategory}
            />
          </div>
        ) : viewMode === 'notebook' ? (
          <div className="flex flex-wrap gap-6 px-2 mt-4 content-start">
            <button
              onClick={() => onCreateNote(currentTab)}
              className="w-[200px] h-[220px] rounded-3xl bg-[var(--bg-app)] border-2 border-dashed border-[var(--border-light)] hover:border-[var(--border-base)] hover:bg-[var(--bg-panel)] transition-all flex flex-col items-center justify-center text-[var(--text-faint)] hover:text-[var(--text-secondary)] shrink-0"
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] flex items-center justify-center shadow-sm mb-4 border border-[var(--border-light)]">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm text-center px-4">New note in {currentTab}</span>
            </button>
            {notes
              .filter((n) => (n.category || 'Uncategorized') === currentTab)
              .sort((a, b) => (a.pinned && !b.pinned ? -1 : !a.pinned && b.pinned ? 1 : b.updatedAt - a.updatedAt))
              .map((n) => renderCard(n, 'grid'))}
          </div>
        ) : (
          <div className="flex gap-6 items-start h-full px-2 mt-4">
            {allCategories.map((category) => (
              <div key={category} className="w-72 shrink-0 flex flex-col gap-4">
                <h3 className="font-semibold text-[var(--text-secondary)] flex items-center justify-between px-1">
                  {category}
                  <span className="text-xs font-medium bg-[var(--bg-card-hover)] text-[var(--text-tertiary)] px-2 rounded-full py-0.5">
                    {notes.filter((n) => (n.category || 'Uncategorized') === category).length}
                  </span>
                </h3>
                <div className="flex flex-col gap-4">
                  {notes
                    .filter((n) => (n.category || 'Uncategorized') === category)
                    .sort((a, b) => (a.pinned && !b.pinned ? -1 : !a.pinned && b.pinned ? 1 : b.updatedAt - a.updatedAt))
                    .map((n) => renderCard(n, 'row'))}
                  <button
                    onClick={() => onCreateNote(category)}
                    className="w-full py-3 border-2 border-dashed border-[var(--border-light)] rounded-xl text-sm font-medium text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:border-[var(--border-base)] hover:bg-[var(--bg-panel)] transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Note
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
