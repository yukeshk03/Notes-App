/** Generates a unique id, with a fallback for contexts where crypto.randomUUID is unavailable (e.g. non-HTTPS). */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
