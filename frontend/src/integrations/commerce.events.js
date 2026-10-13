const EVENT = 'edgemart-commerce-change';
const KEY = 'edgemart-commerce-revision';

export function announceCommerceChange() {
  window.dispatchEvent(new Event(EVENT));
  try { window.localStorage.setItem(KEY, `${Date.now()}-${Math.random()}`); } catch {}
}

export function subscribeCommerceChanges(refresh) {
  const onStorage = event => { if (event.key === KEY) refresh(); };
  window.addEventListener(EVENT, refresh);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, refresh);
    window.removeEventListener('storage', onStorage);
  };
}
