import type { ReactNode } from 'react';
import { Plus, LayoutList, CheckSquare, Book, Trash2, Settings, Moon, Sun } from 'lucide-react';
import { ViewMode } from '../types';

interface NavRailProps {
  viewMode: ViewMode;
  hasActiveNote: boolean;
  onCreateNote: () => void;
  onNavigate: (view: ViewMode) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  trashCount: number;
}

export function NavRail({ viewMode, hasActiveNote, onCreateNote, onNavigate, isDarkMode, onToggleTheme, onOpenSettings, trashCount }: NavRailProps) {
  return (
    <nav className="w-[72px] sm:w-[84px] h-full bg-[var(--bg-sidebar)] flex flex-col items-center shrink-0 text-[var(--text-bright)] shadow-xl z-20">
      <div className="w-full py-4 text-center font-bold text-sm tracking-wider border-b border-[var(--nav-border)] mb-2">Notes</div>

      <div className="flex-1 w-full flex flex-col items-center gap-2 px-2 overflow-y-auto scrollbar-hide py-2">
        <button
          onClick={onCreateNote}
          className="w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-xl bg-[var(--nav-active-bg)] hover:bg-[var(--nav-hover-bg)] transition-all shadow-sm border border-[var(--nav-border)] mb-4 text-[var(--text-bright)]"
          title="Create new note (Ctrl+N)"
        >
          <Plus className="w-6 h-6" />
        </button>

        <NavButton active={viewMode === 'list' && !hasActiveNote} icon={<LayoutList className="w-5 h-5" />} label="All Notes" onClick={() => onNavigate('list')} />
        <NavButton active={viewMode === 'todo'} icon={<CheckSquare className="w-5 h-5" />} label="To-Do" onClick={() => onNavigate('todo')} />
        <NavButton active={['notebook', 'board'].includes(viewMode)} icon={<Book className="w-5 h-5" />} label="Notebooks" onClick={() => onNavigate('notebook')} />
        <NavButton active={viewMode === 'trash'} icon={<Trash2 className="w-5 h-5" />} label="Trash" badge={trashCount} onClick={() => onNavigate('trash')} />
      </div>

      <div className="w-full p-2 border-t border-[var(--nav-border)] mt-auto shrink-0 flex flex-col gap-2">
        <button
          onClick={onToggleTheme}
          className="w-full py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all text-[var(--text-very-faint)] hover:text-[var(--text-bright)] hover:bg-[var(--nav-hover-bg)]"
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={onOpenSettings}
          className="w-full py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all text-[var(--text-very-faint)] hover:text-[var(--text-bright)] hover:bg-[var(--nav-hover-bg)]"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}

function NavButton({ active, icon, label, badge, onClick }: { active: boolean; icon: ReactNode; label: string; badge?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full py-3 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all ${
        active ? 'bg-[var(--nav-active-bg)] text-[var(--text-bright)]' : 'text-[var(--text-very-faint)] hover:text-[var(--text-bright)] hover:bg-[var(--nav-hover-bg)]'
      }`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {Boolean(badge) && (
        <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-400 text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}
