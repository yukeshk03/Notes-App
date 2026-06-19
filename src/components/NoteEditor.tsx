import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, ChangeEvent, KeyboardEvent, InputHTMLAttributes } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import getCaretCoordinates from 'textarea-caret';
import { format, formatDistanceToNowStrict } from 'date-fns';
import {
  Download,
  Eye,
  PenLine,
  Trash2,
  X,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Table,
  Star,
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  SplitSquareHorizontal,
  ImageIcon,
  Plus,
} from 'lucide-react';
import { Note } from '../types';
import { useToast } from '../context/ToastContext';
import { downloadMarkdown } from '../utils/backup';
import { getReadingTime, getWordCount, toggleChecklistItem } from '../utils/text';

interface NoteEditorProps {
  allCategories?: string[];
  onCreateCategory?: (category: string) => void;
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

type Command = {
  icon: ReactNode;
  title: string;
  description: string;
  insertText: string;
  getSelection?: () => { start: number; end: number };
};

const COMMANDS: Command[] = [
  { icon: <Type className="w-4 h-4" />, title: 'Text', description: 'Just start writing with plain text.', insertText: '' },
  { icon: <Heading1 className="w-4 h-4" />, title: 'Heading 1', description: 'Big section heading.', insertText: '# ' },
  { icon: <Heading2 className="w-4 h-4" />, title: 'Heading 2', description: 'Medium section heading.', insertText: '## ' },
  { icon: <Heading3 className="w-4 h-4" />, title: 'Heading 3', description: 'Small section heading.', insertText: '### ' },
  { icon: <List className="w-4 h-4" />, title: 'Bulleted List', description: 'Create a simple bulleted list.', insertText: '- ' },
  { icon: <ListOrdered className="w-4 h-4" />, title: 'Numbered List', description: 'Create a list with numbering.', insertText: '1. ' },
  { icon: <CheckSquare className="w-4 h-4" />, title: 'Checklist', description: 'Track tasks with a to-do list.', insertText: '- [ ] ' },
  { icon: <Quote className="w-4 h-4" />, title: 'Quote', description: 'Capture a quote or callout.', insertText: '> ' },
  {
    icon: <Code className="w-4 h-4" />,
    title: 'Code',
    description: 'Capture a code snippet.',
    insertText: '```\n\n```',
    getSelection: () => ({ start: 4, end: 4 }),
  },
  {
    icon: <Table className="w-4 h-4" />,
    title: 'Table',
    description: 'Add a markdown table.',
    insertText: '| Col 1 | Col 2 |\n| --- | --- |\n| Val | Val |',
  },
  { icon: <SplitSquareHorizontal className="w-4 h-4" />, title: 'Divider', description: 'Add a horizontal line.', insertText: '\n---\n' },
  {
    icon: <LinkIcon className="w-4 h-4" />,
    title: 'Link',
    description: 'Insert a hyperlink.',
    insertText: '[link text](url)',
    getSelection: () => ({ start: 1, end: 10 }),
  },
  {
    icon: <ImageIcon className="w-4 h-4" />,
    title: 'Image',
    description: 'Embed an image by URL.',
    insertText: '![alt text](url)',
    getSelection: () => ({ start: 2, end: 10 }),
  },
];

const NEW_CATEGORY_VALUE = '__new__';

function ChecklistCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onToggle}
      className="mr-2 w-[15px] h-[15px] align-middle accent-[var(--text-primary)] cursor-pointer"
    />
  );
}

export function NoteEditor({ note, onUpdate, onDelete, onClose, allCategories, onCreateCategory }: NoteEditorProps) {
  const toast = useToast();
  const [tagInput, setTagInput] = useState('');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryDraft, setNewCategoryDraft] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  const [slashMenu, setSlashMenu] = useState({ isOpen: false, top: 0, left: 0, query: '', startIndex: -1 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Switch back to Edit mode whenever a different note is opened.
  useEffect(() => {
    setMode('edit');
    setIsCreatingCategory(false);
  }, [note.id]);

  // Lightweight "Saving… / Saved" indicator — purely perceptual, since writes are already synchronous.
  useEffect(() => {
    setSaveStatus('saving');
    saveTimer.current = setTimeout(() => setSaveStatus('saved'), 450);
    return () => clearTimeout(saveTimer.current);
  }, [note.content, note.title, note.tags, note.category]);

  const filteredCommands = COMMANDS.filter((cmd) => cmd.title.toLowerCase().includes(slashMenu.query.toLowerCase()));

  const wordCount = useMemo(() => getWordCount(note.content), [note.content]);

  const handleCommandSelect = (cmd: Command) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const before = note.content.slice(0, slashMenu.startIndex - 1); // drop the leading "/"
    const after = note.content.slice(ta.selectionEnd);
    const newContent = before + cmd.insertText + after;
    onUpdate({ content: newContent });
    setSlashMenu((s) => ({ ...s, isOpen: false }));

    const sel = cmd.getSelection ? cmd.getSelection() : { start: cmd.insertText.length, end: cmd.insertText.length };
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(before.length + sel.start, before.length + sel.end);
    });
  };

  const applyFormat = (prefix: string, suffix?: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = note.content.slice(start, end);
    const suf = suffix ?? prefix;
    const before = note.content.slice(0, start);
    const after = note.content.slice(end);

    let newContent: string;
    let selStart: number;
    let selEnd: number;

    if (selected && before.endsWith(prefix) && after.startsWith(suf)) {
      newContent = before.slice(0, -prefix.length) + selected + after.slice(suf.length);
      selStart = start - prefix.length;
      selEnd = selStart + selected.length;
    } else {
      newContent = before + prefix + selected + suf + after;
      selStart = start + prefix.length;
      selEnd = selStart + selected.length;
    }

    onUpdate({ content: newContent });
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selEnd);
    });
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const selectionEnd = e.target.selectionEnd;

    if (slashMenu.isOpen) {
      const query = val.slice(slashMenu.startIndex, selectionEnd);
      if (query.includes(' ') || query.includes('\n')) {
        setSlashMenu((s) => ({ ...s, isOpen: false }));
      } else {
        setSlashMenu((s) => ({ ...s, query }));
        setSelectedIndex(0);
      }
    } else if (val[selectionEnd - 1] === '/') {
      const charBefore = val[selectionEnd - 2];
      const isLineStart = selectionEnd === 1 || charBefore === '\n';
      if (isLineStart) {
        const caret = getCaretCoordinates(e.target, selectionEnd);
        setSlashMenu({ isOpen: true, top: caret.top + 24, left: caret.left, query: '', startIndex: selectionEnd });
        setSelectedIndex(0);
      }
    }

    onUpdate({ content: val });
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!slashMenu.isOpen) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        e.stopPropagation();
        applyFormat('**');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        e.stopPropagation();
        applyFormat('_');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        e.stopPropagation();
        applyFormat('<u>', '</u>');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        applyFormat('[', '](url)');
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredCommands.length ? (prev + 1) % filteredCommands.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filteredCommands.length ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) handleCommandSelect(filteredCommands[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSlashMenu((s) => ({ ...s, isOpen: false }));
    }
  };

  const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
      if (!note.tags.includes(newTag)) {
        onUpdate({ tags: [...note.tags, newTag] });
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && note.tags.length > 0) {
      onUpdate({ tags: note.tags.slice(0, -1) });
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate({ tags: note.tags.filter((t) => t !== tagToRemove) });
  };

  const handleCategoryChange = (value: string) => {
    if (value === NEW_CATEGORY_VALUE) {
      setIsCreatingCategory(true);
      setNewCategoryDraft('');
      return;
    }
    onUpdate({ category: value });
  };

  const commitNewCategory = () => {
    const name = newCategoryDraft.trim();
    setIsCreatingCategory(false);
    if (!name) return;
    onUpdate({ category: name });
    onCreateCategory?.(name);
  };

  const exportNote = () => {
    const markdownContent = `# ${note.title || 'Untitled'}\n\n**Category**: ${note.category}\n**Tags**: ${note.tags.join(', ')}\n\n---\n\n${note.content}`;
    downloadMarkdown(`${(note.title || 'note').replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'note'}.md`, markdownContent);
    toast.success('Note exported');
  };

  const handleDeleteClick = () => {
    onDelete(note.id);
  };

  const handleChecklistToggle = (index: number) => {
    onUpdate({ content: toggleChecklistItem(note.content, index) });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-panel)] overflow-hidden selection:bg-[var(--bg-card-active)] selection:text-[var(--text-inverted)] min-w-0">
      {/* Header Toolbar */}
      <header className="h-14 border-b border-[var(--border-light)] flex items-center justify-between px-4 sm:px-8 flex-shrink-0 bg-[var(--bg-panel)] gap-3">
        <div className="flex items-center gap-3 text-[var(--text-faint)] min-w-0">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
            <span className="text-xs font-medium uppercase tracking-wider">{saveStatus === 'saved' ? 'Saved' : 'Saving…'}</span>
          </div>
          <div className="flex bg-[var(--bg-card)] p-1 rounded-lg shrink-0">
            <button
              onClick={() => setMode('edit')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                mode === 'edit' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all ${
                mode === 'preview' ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => onUpdate({ pinned: !note.pinned })}
            className={`p-2 transition-colors rounded-lg ${note.pinned ? 'text-amber-500' : 'text-[var(--text-faint)] hover:text-amber-500'}`}
            title={note.pinned ? 'Unpin note' : 'Pin note'}
          >
            <Star className={`w-4 h-4 ${note.pinned ? 'fill-amber-500' : ''}`} />
          </button>
          <button onClick={handleDeleteClick} className="p-2 text-[var(--text-faint)] hover:text-red-500 transition-colors" title="Move to Trash">
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={exportNote}
            className="px-3 sm:px-4 py-1.5 bg-[var(--text-primary)] text-[var(--bg-panel)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-faint)] hover:text-[var(--text-tertiary)] transition-colors bg-[var(--bg-card)] rounded-lg hover:bg-[var(--bg-card-hover)]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Editor/Preview body */}
      <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto p-6 sm:p-16 selection:bg-[var(--bg-card-active)] scrollbar-hide">
        <div className="mb-8">
          <input
            type="text"
            value={note.title}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full text-3xl sm:text-4xl font-bold text-[var(--text-bright)] border-none p-0 focus:ring-0 outline-none placeholder:text-[var(--text-very-faint)] bg-transparent"
            placeholder="Untitled Note"
          />
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {isCreatingCategory ? (
              <div className="flex items-center gap-1.5 bg-[var(--bg-card)] rounded px-2 py-1">
                <input
                  autoFocus
                  value={newCategoryDraft}
                  onChange={(e) => setNewCategoryDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitNewCategory();
                    if (e.key === 'Escape') setIsCreatingCategory(false);
                  }}
                  onBlur={commitNewCategory}
                  placeholder="Notebook name…"
                  className="bg-transparent border-none outline-none text-xs font-medium w-28 text-[var(--text-primary)] placeholder:text-[var(--text-faint)]"
                />
              </div>
            ) : (
              <select
                value={note.category || 'Uncategorized'}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-2.5 py-1 text-xs font-medium bg-[var(--bg-card)] text-[var(--text-primary)] rounded border-none outline-none focus:ring-1 focus:ring-[var(--border-base)] min-w-[80px]"
              >
                {allCategories?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                {!allCategories?.includes(note.category) && note.category && <option value={note.category}>{note.category}</option>}
                <option value={NEW_CATEGORY_VALUE}>+ New notebook…</option>
              </select>
            )}
            {note.tags.map((tag) => (
              <div
                key={tag}
                className="px-2 py-1 bg-[var(--bg-card)] text-[var(--text-muted)] rounded text-xs font-medium flex items-center gap-1 group cursor-pointer"
                onClick={() => removeTag(tag)}
              >
                #{tag} <span className="text-[var(--text-faint)] hidden group-hover:inline hover:text-[var(--text-secondary)]">&times;</span>
              </div>
            ))}
            <div className="flex items-center gap-1 text-[var(--text-faint)]">
              <Plus className="w-3 h-3" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tag"
                className="text-[var(--text-primary)] text-xs font-semibold bg-transparent border-none outline-none w-20 placeholder:text-[var(--text-faint)] focus:ring-0 p-0"
              />
            </div>
          </div>
        </div>

        {mode === 'edit' ? (
          <div className="relative w-full">
            <div className="flex items-center gap-1 mb-4 p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-light)] sticky top-0 z-10 w-max flex-wrap">
              <button onClick={() => applyFormat('**')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Bold (Ctrl+B)">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('_')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Italic (Ctrl+I)">
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('<u>', '</u>')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Underline (Ctrl+U)">
                <Underline className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('~~')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Strikethrough">
                <Strikethrough className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-[var(--border-light)] mx-2"></div>
              <button onClick={() => applyFormat('<div align="left">\n', '\n</div>')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Align left">
                <AlignLeft className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('<div align="center">\n', '\n</div>')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Align center">
                <AlignCenter className="w-4 h-4" />
              </button>
              <button onClick={() => applyFormat('<div align="right">\n', '\n</div>')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Align right">
                <AlignRight className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-[var(--border-light)] mx-2"></div>
              <button onClick={() => applyFormat('[', '](url)')} className="p-1.5 hover:bg-[var(--bg-app)] text-[var(--text-secondary)] rounded transition-colors" title="Link (Ctrl+K)">
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="relative w-full">
              <textarea
                ref={textareaRef}
                value={note.content}
                onChange={handleTextareaChange}
                onKeyDown={handleTextareaKeyDown}
                placeholder={'Type "/" at the start of a line for commands…\n\n# Pro tip\nYou can use Markdown for formatting.'}
                className="w-full min-h-[500px] bg-transparent border-none outline-none resize-none font-mono text-[var(--text-secondary)] text-[15px] leading-relaxed p-0 focus:ring-0"
              />
              {slashMenu.isOpen && (
                <div
                  className="absolute z-50 w-72 max-h-80 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-light)] shadow-xl rounded-xl p-1"
                  style={{ top: slashMenu.top, left: slashMenu.left }}
                >
                  <div className="px-2 py-1.5 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Commands</div>
                  {filteredCommands.length === 0 ? (
                    <div className="p-3 text-sm text-[var(--text-faint)]">No results</div>
                  ) : (
                    filteredCommands.map((cmd, i) => (
                      <button
                        key={cmd.title}
                        onClick={() => handleCommandSelect(cmd)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full text-left flex items-start gap-3 p-2 rounded-lg transition-colors ${i === selectedIndex ? 'bg-[var(--bg-app)]' : 'hover:bg-[var(--bg-app)]'}`}
                      >
                        <div className="w-8 h-8 rounded border border-[var(--border-light)] bg-[var(--bg-panel)] flex items-center justify-center shrink-0 text-[var(--text-primary)]">
                          {cmd.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{cmd.title}</span>
                          <span className="text-xs text-[var(--text-faint)]">{cmd.description}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="note-prose prose prose-sm sm:prose-base dark:prose-invert max-w-none min-h-[500px]">
            {note.content.trim() ? (
              <ReactMarkdownPreview content={note.content} onToggleChecklist={handleChecklistToggle} />
            ) : (
              <p className="text-[var(--text-faint)] italic">Nothing to preview yet — switch to Edit and start writing.</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-10 pt-4 border-t border-[var(--border-light)] text-xs font-medium text-[var(--text-faint)]">
          <span>
            {wordCount} word{wordCount === 1 ? '' : 's'} · {getReadingTime(wordCount)}
          </span>
          <span title={format(note.updatedAt, 'MMM d, yyyy · h:mm a')}>Edited {formatDistanceToNowStrict(note.updatedAt, { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}

function ReactMarkdownPreview({ content, onToggleChecklist }: { content: string; onToggleChecklist: (index: number) => void }) {
  const checkboxIndex = useRef(0);
  checkboxIndex.current = 0;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node: _node, ...rest }) => <a {...rest} target="_blank" rel="noopener noreferrer" />,
        input: (props) => {
          const { checked, type } = props as InputHTMLAttributes<HTMLInputElement>;
          if (type !== 'checkbox') return null;
          const index = checkboxIndex.current++;
          return <ChecklistCheckbox checked={Boolean(checked)} onToggle={() => onToggleChecklist(index)} />;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
