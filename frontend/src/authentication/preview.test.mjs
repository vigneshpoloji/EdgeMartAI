import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewSession, previewEnabled, PREVIEW_KEY, PREVIEW_LIFETIME } from './preview.session.js';
function fixture() {
  const data = new Map();
  let time = 1000;
  const storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const options = { storage, now: () => time, createId: () => 'test-id' };
  return { store: createPreviewSession(options), storage, options, data, advance: value => { time += value; } };
}
test('preview defaults on only without a backend and can be disabled', () => {
  assert.equal(previewEnabled(), true);
  assert.equal(previewEnabled('  '), true);
  assert.equal(previewEnabled('', 'false'), false);
  for (const api of ['/api', 'https://api.example.com', 'invalid backend url']) assert.equal(previewEnabled(api), false);
});
test('preview stores only a profile and expiry; no password, token or verified identity', () => {
  const { store, data } = fixture();
  const user = store.start({ name: ' Reader ', email: ' READER@example.com ', password: 'never-store-me', token: 'private' });
  assert.equal('emailVerified' in user, false);
  assert.equal(user.email, 'reader@example.com');
  assert.equal(user.name, 'Reader');
  const saved = JSON.parse(data.get(PREVIEW_KEY));
  assert.deepEqual(Object.keys(saved).sort(), ['email', 'expiresAt', 'id', 'name']);
});
test('reload restores a valid tab profile and sign-out removes it', () => {
  const { store, options, data } = fixture();
  store.start({ email: 'sample@example.com' });
  const restored = createPreviewSession(options);
  assert.equal(restored.read().email, 'sample@example.com');
  restored.clear();
  assert.equal(data.has(PREVIEW_KEY), false);
  assert.equal(restored.read(), null);
});
test('preview expires after eight hours', () => {
  const { store, advance } = fixture();
  store.start({ email: 'sample@example.com' });
  advance(PREVIEW_LIFETIME - 1);
  assert.ok(store.read());
  advance(1);
  assert.equal(store.read(), null);
});
test('malformed or extended browser storage cannot supply a verified identity', () => {
  const { store, data } = fixture();
  for (const invalid of ['bad json', '{}', '{"expiresAt":999999999999999}']) {
    data.set(PREVIEW_KEY, invalid);
    assert.equal(store.read(), null);
  }
  store.start({ email: 'sample@example.com' });
  const saved = JSON.parse(data.get(PREVIEW_KEY));
  data.set(PREVIEW_KEY, JSON.stringify({ ...saved, emailVerified: true, token: 'untrusted' }));
  assert.equal('emailVerified' in store.read(), false);
  assert.equal(store.read().token, undefined);
});
test('blocked storage supports current visit in memory without crashing', () => {
  const blocked = () => { throw new Error('Storage denied'); };
  const store = createPreviewSession({ storage: { getItem: blocked, setItem: blocked, removeItem: blocked }, createId: () => 'memory' });
  store.start({ email: 'sample@example.com' });
  assert.equal(store.read().email, 'sample@example.com');
  store.clear();
  assert.equal(store.read(), null);
});
test('preview rejects invalid email input and bounds profile text', () => {
  const { store } = fixture();
  assert.throws(() => store.start({ email: 'invalid' }));
  assert.equal(store.start({ email: 'sample@example.com', name: 'x'.repeat(200) }).name.length, 100);
});
