import { useEffect, useRef } from 'react';
import { MoreHorizontal, Trash, Copy, Star } from 'lucide-react';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { Note } from '../types';
import { stripMarkdownPreview } from '../utils/text';

interface NoteCardProps {
  note: Note;
  variant: 'row' | 'grid';
  allCategories: string[];
  isMenuOpen: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onMoveCategory: (category: string) => void;
  onClone: () => void;
  onDelete: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

export function NoteCard({
  note,
  variant,
  allCategories,
  isMenuOpen,
  onOpen,
  onTogglePin,
  onMoveCategory,
  onClone,
  onDelete,
  onToggleMenu,
  onCloseMenu,
}: NoteCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onCloseMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isMenuOpen, onCloseMenu]);

  const preview = stripMarkdownPreview(note.content) || 'Empty note';
  const relativeTime = formatDistanceToNowStrict(note.updatedAt, { addSuffix: true });
  const absoluteTime = format(note.updatedAt, 'MMM d, yyyy · h:mm a');

  const outerClass =
    variant === 'grid'
      ? 'w-[200px] h-[220px] p-6 rounded-3xl shrink-0'
      : 'p-5 rounded-2xl';

  return (
    <div
      className={`${outerClass} shadow-sm hover:shadow-md transition-all relative group bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:-translate-y-0.5 border border-transparent hover:border-[var(--border-base)] flex flex-col cursor-pointer`}
      onClick={onOpen}
    >
      {note.pinned && (
        <div className="absolute top-4 right-4 text-amber-500" title="Pinned">
          <Star className="w-3.5 h-3.5 fill-amber-500" />
        </div>
      )}
      <h4 className={`font-bold mb-2 leading-tight pr-6 line-clamp-2 ${variant === 'grid' ? 'text-[17px]' : 'text-[15px]'}`}>
        {note.title || 'Untitled'}
      </h4>
      <p className="text-sm opacity-80 mb-4 line-clamp-4 leading-relaxed font-medium flex-1">{preview}</p>

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--bg-app)] text-[var(--text-muted)]">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs font-semibold opacity-60 mt-auto pt-4 border-t border-[var(--border-light)]">
        <span title={absoluteTime}>{relativeTime}</span>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onTogglePin}
            className={`p-1 rounded transition-colors ${
              note.pinned ? 'text-amber-500 bg-amber-500/10' : 'text-[var(--text-faint)] hover:bg-[var(--bg-app)]'
            }`}
            title={note.pinned ? 'Unpin' : 'Pin'}
          >
            <Star className={`w-3.5 h-3.5 ${note.pinned ? 'fill-amber-500' : ''}`} />
          </button>
          <div className="relative opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity" ref={menuRef}>
            <button
              onClick={onToggleMenu}
              className="p-1 hover:bg-[var(--bg-app)] rounded text-[var(--text-faint)] transition-colors"
              aria-label="Note options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 bottom-full mb-1 w-44 bg-[var(--bg-panel)] shadow-xl rounded-xl border border-[var(--border-light)] overflow-hidden z-20 flex flex-col p-1">
                <div className="px-2 py-1.5 text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider">Move to</div>
                <div className="max-h-32 overflow-y-auto">
                  {allCategories.map((c) => (
                    <button
                      key={c}
                      onClick={() => onMoveCategory(c)}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded-md ${
                        note.category === c
                          ? 'bg-[var(--bg-app)] text-[var(--text-primary)] font-bold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="h-px bg-[var(--border-light)] my-1" />
                <button
                  onClick={onClone}
                  className="w-full text-left px-2 py-1.5 text-xs rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] flex items-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Clone note
                </button>
                <button
                  onClick={onDelete}
                  className="w-full text-left px-2 py-1.5 text-xs rounded-md text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash className="w-3.5 h-3.5" /> Move to Trash
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
