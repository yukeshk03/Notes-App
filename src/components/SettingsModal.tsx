import { useRef, useState } from 'react';
import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { Settings, Sun, Moon, Download, Upload, Trash2, Pencil, Check, X, FolderKanban, KeyRound, AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Note, Todo } from '../types';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';
import { buildBackup, downloadBackup, readBackupFile } from '../utils/backup';

interface SettingsModalProps {
  onClose: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  notes: Note[];
  setNotes: Dispatch<SetStateAction<Note[]>>;
  todos: Todo[];
  setTodos: Dispatch<SetStateAction<Todo[]>>;
  customCategories: string[];
  setCustomCategories: Dispatch<SetStateAction<string[]>>;
  todoStages: string[];
  setTodoStages: Dispatch<SetStateAction<string[]>>;
  defaultStage: string;
  onResetAll: () => void;
}

const SHORTCUTS: [string, string][] = [
  ['Ctrl / Cmd + K', 'Open quick search'],
  ['Ctrl / Cmd + N', 'New note'],
  ['Ctrl / Cmd + B', 'Bold selection'],
  ['Ctrl / Cmd + I', 'Italic selection'],
  ['Ctrl / Cmd + K (in editor)', 'Insert link'],
  ['/', 'Open block menu in editor'],
  ['Esc', 'Close panel or dialog'],
];

export function SettingsModal({
  onClose,
  isDarkMode,
  setIsDarkMode,
  notes,
  setNotes,
  todos,
  setTodos,
  customCategories,
  setCustomCategories,
  todoStages,
  setTodoStages,
  defaultStage,
  onResetAll,
}: SettingsModalProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [tab, setTab] = useState<'general' | 'notebooks' | 'data' | 'shortcuts'>('general');

  const liveCategories = Array.from(
    new Set([...notes.filter((n) => !n.deletedAt).map((n) => n.category || 'Uncategorized'), ...customCategories])
  ).sort((a, b) => a.localeCompare(b));

  const countFor = (cat: string) => notes.filter((n) => !n.deletedAt && (n.category || 'Uncategorized') === cat).length;

  const startRename = (cat: string) => {
    setEditingCategory(cat);
    setRenameValue(cat);
  };

  const commitRename = (oldName: string) => {
    const next = renameValue.trim();
    setEditingCategory(null);
    if (!next || next === oldName) return;
    setNotes((prev) => prev.map((n) => ((n.category || 'Uncategorized') === oldName ? { ...n, category: next } : n)));
    setCustomCategories((prev) => Array.from(new Set(prev.map((c) => (c === oldName ? next : c)))));
    toast.success(`Renamed "${oldName}" to "${next}"`);
  };

  const deleteNotebook = async (cat: string) => {
    const count = countFor(cat);
    const ok = await confirm({
      title: `Delete "${cat}"?`,
      description:
        count > 0
          ? `${count} note${count === 1 ? '' : 's'} will be moved to Uncategorized. This won't delete the notes themselves.`
          : 'This notebook has no notes in it.',
      confirmLabel: 'Delete notebook',
      danger: true,
    });
    if (!ok) return;
    setNotes((prev) =>
      prev.map((n) => ((n.category || 'Uncategorized') === cat ? { ...n, category: 'Uncategorized' } : n))
    );
    setCustomCategories((prev) => prev.filter((c) => c !== cat));
    toast.success(`Deleted notebook "${cat}"`);
  };

  const handleExport = () => {
    const backup = buildBackup({
      notes,
      todos,
      customCategories,
      todoStages,
      defaultStage,
    });
    downloadBackup(backup);
    toast.success('Backup downloaded');
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const backup = await readBackupFile(file);
      const ok = await confirm({
        title: 'Import backup?',
        description: `This will add ${backup.notes.length} note(s) and ${backup.todos.length} task(s) from the file, alongside what you already have. Items with matching IDs will be skipped.`,
        confirmLabel: 'Import',
      });
      if (!ok) return;

      setNotes((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const incoming = backup.notes.filter((n) => !existingIds.has(n.id));
        return [...incoming, ...prev];
      });
      setTodos((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const incoming = backup.todos.filter((t) => !existingIds.has(t.id));
        return [...incoming, ...prev];
      });
      setCustomCategories((prev) => Array.from(new Set([...prev, ...(backup.customCategories || [])])));
      setTodoStages((prev) => Array.from(new Set([...prev, ...(backup.todoStages || [])])));
      toast.success('Backup imported');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    }
  };

  const handleResetAll = async () => {
    const ok = await confirm({
      title: 'Erase all data?',
      description: 'This permanently deletes every note and task in this browser. Consider exporting a backup first. This cannot be undone.',
      confirmLabel: 'Erase everything',
      danger: true,
    });
    if (!ok) return;
    onResetAll();
    toast.success('All data cleared');
    onClose();
  };

  return (
    <Modal title="Settings" icon={<Settings className="w-4 h-4" />} onClose={onClose} widthClassName="max-w-xl">
      <div className="flex gap-1 mb-6 bg-[var(--bg-card)] p-1 rounded-lg w-max">
        {(
          [
            ['general', 'General'],
            ['notebooks', 'Notebooks'],
            ['data', 'Data'],
            ['shortcuts', 'Shortcuts'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              tab === key ? 'bg-[var(--bg-panel)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-faint)] mb-2">Appearance</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDarkMode(false)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  !isDarkMode ? 'border-[var(--text-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]' : 'border-[var(--border-light)] text-[var(--text-faint)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => setIsDarkMode(true)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                  isDarkMode ? 'border-[var(--text-primary)] bg-[var(--bg-card)] text-[var(--text-primary)]' : 'border-[var(--border-light)] text-[var(--text-faint)] hover:bg-[var(--bg-card)]'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
            </div>
          </div>
          <div className="text-xs text-[var(--text-faint)] bg-[var(--bg-card)] rounded-xl p-4 leading-relaxed">
            Notes and tasks are stored only in this browser's local storage. Nothing is uploaded — clearing your
            browser data or switching devices means your notes won't follow you, so export a backup from the{' '}
            <button onClick={() => setTab('data')} className="underline font-semibold text-[var(--text-secondary)]">
              Data
            </button>{' '}
            tab if that matters to you.
          </div>
        </div>
      )}

      {tab === 'notebooks' && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-faint)] mb-2 flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5" /> Notebooks
          </h3>
          {liveCategories.length === 0 && <p className="text-sm text-[var(--text-faint)]">No notebooks yet.</p>}
          {liveCategories.map((cat) => (
            <div key={cat} className="flex items-center gap-2 bg-[var(--bg-card)] rounded-lg px-3 py-2">
              {editingCategory === cat ? (
                <>
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(cat);
                      if (e.key === 'Escape') setEditingCategory(null);
                    }}
                    className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-base)] rounded-md px-2 py-1 text-sm outline-none text-[var(--text-primary)]"
                  />
                  <button onClick={() => commitRename(cat)} className="p-1.5 text-emerald-600 hover:bg-[var(--bg-panel)] rounded">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditingCategory(null)} className="p-1.5 text-[var(--text-faint)] hover:bg-[var(--bg-panel)] rounded">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-semibold text-[var(--text-secondary)] truncate">{cat}</span>
                  <span className="text-xs text-[var(--text-faint)] font-medium">{countFor(cat)}</span>
                  <button onClick={() => startRename(cat)} className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-panel)] rounded">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => deleteNotebook(cat)} className="p-1.5 text-[var(--text-faint)] hover:text-red-500 hover:bg-[var(--bg-panel)] rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'data' && (
        <div className="space-y-3">
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-[var(--border-light)] hover:bg-[var(--bg-card)] transition-colors text-left"
          >
            <Download className="w-5 h-5 text-[var(--text-secondary)]" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Export backup</p>
              <p className="text-xs text-[var(--text-faint)]">Download every note and task as a JSON file.</p>
            </div>
          </button>
          <button
            onClick={handleImportClick}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-[var(--border-light)] hover:bg-[var(--bg-card)] transition-colors text-left"
          >
            <Upload className="w-5 h-5 text-[var(--text-secondary)]" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Import backup</p>
              <p className="text-xs text-[var(--text-faint)]">Restore from a previously exported JSON file.</p>
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChosen} />

          <div className="pt-3 mt-3 border-t border-[var(--border-light)]">
            <button
              onClick={handleResetAll}
              className="w-full flex items-center gap-3 p-4 rounded-xl border border-red-500/20 hover:bg-red-500/5 transition-colors text-left"
            >
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-500">Erase all data</p>
                <p className="text-xs text-[var(--text-faint)]">Permanently delete every note and task on this device.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {tab === 'shortcuts' && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-faint)] mb-2 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5" /> Keyboard shortcuts
          </h3>
          {SHORTCUTS.map(([keys, desc]) => (
            <div key={keys} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[var(--text-secondary)]">{desc}</span>
              <kbd className="text-[11px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-card)] border border-[var(--border-light)] rounded-md px-2 py-1">
                {keys}
              </kbd>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
