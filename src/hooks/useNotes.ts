import { useEffect } from 'react';
import { useLocalStorageState } from './useLocalStorage';
import { Note } from '../types';
import { generateId } from '../utils/id';

const STORAGE_KEY = 'v1_aether_notes_data';
const TRASH_RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function createWelcomeNote(): Note {
  return {
    id: generateId(),
    title: 'Welcome to Notes',
    content: `# Personal Notes App

Welcome to your private, minimal workspace. Everything you write is saved automatically in this browser — nothing is sent anywhere.

## Rich text, written in Markdown
Use **bold**, _italics_, ~~strikethrough~~, or \`inline code\`. Click the Preview tab above the editor any time to see it rendered.

### Checklists
- [x] Create app
- [x] Design layout
- [ ] Explore ideas — click a checkbox in Preview to check it off

### Code blocks
\`\`\`javascript
function hello() {
  return "World";
}
\`\`\`

### Tables

| Feature | Status |
| - | - |
| Local storage | Active |
| Search | Active |
| Markdown preview | Active |

> Tip: type "/" on a new line in the editor to insert headings, lists, tables, and more.`,
    tags: ['welcome', 'guide'],
    category: 'General',
    updatedAt: Date.now(),
    createdAt: Date.now(),
    pinned: true,
  };
}

export function useNotes() {
  const [notes, setNotes] = useLocalStorageState<Note[]>(STORAGE_KEY, () => [createWelcomeNote()]);

  // One-time sweep: permanently drop notes that have sat in Trash past the retention window.
  useEffect(() => {
    const cutoff = Date.now() - TRASH_RETENTION_MS;
    setNotes((prev) => {
      const next = prev.filter((n) => !n.deletedAt || n.deletedAt > cutoff);
      return next.length === prev.length ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { notes, setNotes, isLoaded: true };
}
