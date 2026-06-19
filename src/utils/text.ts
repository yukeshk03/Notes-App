/**
 * Strips common Markdown syntax so a note's content can be shown as a plain-text
 * preview snippet in cards and list rows.
 */
export function stripMarkdownPreview(markdown: string): string {
  if (!markdown) return '';
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?\[![A-Z]+\]\s?/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^[-*+]\s+\[[ xX]]\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\|/g, ' ')
    .replace(/^-{3,}$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Counts whitespace-separated words in a block of text. */
export function getWordCount(text: string): number {
  const trimmed = (text || '').trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Rough reading-time estimate, assuming ~200 words per minute. */
export function getReadingTime(wordCount: number): string {
  if (wordCount === 0) return '0 min read';
  const minutes = Math.max(1, Math.round(wordCount / 200));
  return `${minutes} min read`;
}

const TASK_ITEM_RE = /^(\s*(?:[-*+]|\d+[.)])\s+)\[([ xX])]/gm;

/** Counts the number of Markdown task-list checkboxes (`- [ ]` / `- [x]`) in content. */
export function countChecklistItems(content: string): number {
  const matches = content.match(TASK_ITEM_RE);
  return matches ? matches.length : 0;
}

/**
 * Flips the checked state of the Nth task-list checkbox (in document order) found
 * in a block of Markdown, returning the updated content. Used to make checklists
 * clickable directly from the rendered preview.
 */
export function toggleChecklistItem(content: string, targetIndex: number): string {
  let count = -1;
  return content.replace(TASK_ITEM_RE, (match, prefix: string, state: string) => {
    count += 1;
    if (count !== targetIndex) return match;
    const next = state.trim() === '' ? 'x' : ' ';
    return `${prefix}[${next}]`;
  });
}
