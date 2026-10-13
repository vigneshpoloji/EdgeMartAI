// Local preview access only. Never use this profile as proof of identity.
export const PREVIEW_KEY = 'edgemart-preview-session-v1';
export const PREVIEW_LIFETIME = 8 * 60 * 60 * 1000;
export function previewEnabled(apiUrl = '', flag = '') {
  return !apiUrl.trim() && flag !== 'false';
}
export function createPreviewSession({ storage, now = () => Date.now(), createId = () => crypto.randomUUID() }) {
  let memory = null;
  const clear = () => {
    memory = null;
    try { storage?.removeItem(PREVIEW_KEY); } catch { /* Storage can be blocked. */ }
  };
  const read = () => {
    let saved = memory;
    let raw = null;
    try { raw = storage?.getItem(PREVIEW_KEY); } catch { /* Fall back to this visit's memory. */ }
    if (raw) {
      try { saved = JSON.parse(raw); } catch { clear(); return null; }
    }
    if (!saved || typeof saved.expiresAt !== 'number' || saved.expiresAt <= now() || saved.expiresAt > now() + PREVIEW_LIFETIME ||
      typeof saved.id !== 'string' || !saved.id.startsWith('preview-') ||
      typeof saved.name !== 'string' || saved.name.length > 100 ||
      typeof saved.email !== 'string' || saved.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(saved.email)) {
      clear(); return null;
    }
    // Whitelist fields so edited browser storage cannot add account privileges.
    memory = { id: saved.id, name: saved.name, email: saved.email, expiresAt: saved.expiresAt };
    return { id: memory.id, name: memory.name, email: memory.email };
  };
  const start = ({ name = '', email = '' } = {}) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid preview email.');
    memory = { id: `preview-${createId()}`, name: name.trim().slice(0, 100), email: cleanEmail, expiresAt: now() + PREVIEW_LIFETIME };
    try { storage?.setItem(PREVIEW_KEY, JSON.stringify(memory)); } catch { /* In-memory access still works. */ }
    return read();
  };
  return { read, start, clear };
}
