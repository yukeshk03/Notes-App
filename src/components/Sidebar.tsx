import { forwardRef } from 'react';
import { Plus, Search, FolderOpen, X, ArrowDownAZ, Clock } from 'lucide-react';
import { Note } from '../types';
import { formatDistanceToNowStrict } from 'date-fns';
import { stripMarkdownPreview } from '../utils/text';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export type SortMode = 'updated' | 'title';

interface SidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onCreateNote: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (c: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (t: string | null) => void;
  sortMode: SortMode;
  setSortMode: (m: SortMode) => void;
  isOpenOnMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar = forwardRef<HTMLInputElement, SidebarProps>(function Sidebar(
  {
    notes,
    activeNoteId,
    onSelectNote,
    onCreateNote,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    sortMode,
    setSortMode,
    isOpenOnMobile,
    onCloseMobile,
  },
  searchRef
) {
  const categories = Array.from(new Set(notes.map((n) => n.category).filter(Boolean))).sort();
  const tags = Array.from(new Set(notes.flatMap((n) => n.tags).filter(Boolean))).sort();
  const debouncedQuery = useDebouncedValue(searchQuery, 150);

  const filteredNotes = notes
    .filter((n) => {
      const query = debouncedQuery.toLowerCase();
      const matchesSearch =
        !query ||
        (n.title || '').toLowerCase().includes(query) ||
        n.content.toLowerCase().includes(query) ||
        n.tags.some((t) => t.toLowerCase().includes(query)) ||
        (n.category && n.category.toLowerCase().includes(query));
      const matchesCat = selectedCategory ? n.category === selectedCategory : true;
      const matchesTag = selectedTag ? n.tags.includes(selectedTag) : true;
      return matchesSearch && matchesCat && matchesTag;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (sortMode === 'title') return (a.title || 'Untitled').localeCompare(b.title || 'Untitled');
      return b.updatedAt - a.updatedAt;
    });

  const hasActiveFilters = Boolean(searchQuery || selectedCategory || selectedTag);
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setSelectedTag(null);
  };

  return (
    <>
      {isOpenOnMobile && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`w-[85vw] max-w-72 lg:w-72 h-full bg-[var(--bg-panel)] flex flex-col border-r border-[var(--border-light)] z-40 shrink-0 fixed lg:static inset-y-0 left-0 transition-transform duration-200 ${
          isOpenOnMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-[var(--border-light)] space-y-3">
          <div className="flex items-center justify-between lg:hidden mb-1">
            <span className="text-sm font-bold text-[var(--text-primary)]">All Notes</span>
            <button onClick={onCloseMobile} className="p-1.5 rounded-lg hover:bg-[var(--bg-card)] text-[var(--text-faint)]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--text-faint)]" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes…"
              className="w-full bg-[var(--bg-card)] border-none rounded-lg py-2 pl-9 pr-8 text-sm outline-none focus:ring-1 focus:ring-[var(--border-base)] transition-all placeholder:text-[var(--text-faint)] text-[var(--text-bright)]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[var(--text-faint)] hover:text-[var(--text-primary)]"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="flex-1 bg-[var(--bg-card)] border-none text-[var(--text-tertiary)] text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[var(--border-base)] truncate"
            >
              <option value="">All Notebooks</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedTag || ''}
              onChange={(e) => setSelectedTag(e.target.value || null)}
              className="flex-1 bg-[var(--bg-card)] border-none text-[var(--text-tertiary)] text-xs rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-[var(--border-base)] truncate"
            >
              <option value="">All Tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>

            <button
              onClick={() => setSortMode(sortMode === 'updated' ? 'title' : 'updated')}
              title={sortMode === 'updated' ? 'Sorted by last updated' : 'Sorted by title'}
              className="shrink-0 bg-[var(--bg-card)] text-[var(--text-tertiary)] rounded-lg px-2 py-1.5 hover:text-[var(--text-primary)] transition-colors"
            >
              {sortMode === 'updated' ? <Clock className="w-3.5 h-3.5" /> : <ArrowDownAZ className="w-3.5 h-3.5" />}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-[var(--text-faint)] hover:text-[var(--text-primary)] flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-3 space-y-1 scrollbar-hide">
            {filteredNotes.length === 0 ? (
              <div className="text-center text-[var(--text-faint)] text-sm mt-12 px-6">
                <FolderOpen className="w-10 h-10 mx-auto text-[var(--text-very-faint)] mb-3" />
                {hasActiveFilters ? 'No notes match your filters.' : 'No notes yet. Create your first one.'}
              </div>
            ) : (
              filteredNotes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    onSelectNote(n.id);
                    onCloseMobile();
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border-l-4 ${
                    activeNoteId === n.id
                      ? 'bg-[var(--bg-card-hover)] border-[var(--text-primary)]'
                      : 'bg-transparent border-transparent hover:bg-[var(--bg-app)]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {n.pinned && <span className="text-amber-500 text-[10px]">★</span>}
                    <h3
                      className={`text-sm font-semibold truncate ${
                        activeNoteId === n.id ? 'text-[var(--text-bright)]' : 'text-[var(--text-secondary)] font-medium'
                      }`}
                    >
                      {n.title || 'Untitled Note'}
                    </h3>
                  </div>
                  <p className="text-xs text-[var(--text-faint)] mt-1 line-clamp-1">
                    {stripMarkdownPreview(n.content) || 'No content…'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded truncate max-w-[120px] ${
                        activeNoteId === n.id ? 'bg-[var(--bg-app)] text-[var(--text-primary)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'
                      }`}
                    >
                      {n.category || 'Uncategorized'}
                    </span>
                    <span className="text-[10px] text-[var(--text-faint)]">{formatDistanceToNowStrict(n.updatedAt, { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 bg-[var(--bg-app)] border-t border-[var(--border-light)] text-center flex-shrink-0">
          <button
            onClick={onCreateNote}
            className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--bg-panel)] border border-[var(--border-light)] rounded-lg text-sm font-medium hover:bg-[var(--bg-card)] shadow-sm transition-all text-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-[var(--border-base)] focus:ring-offset-1"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>
      </aside>
    </>
  );
});
