// Run against the local backend without creating or modifying an account.
import assert from 'node:assert/strict';
import { createAuthClient } from '../src/authentication/auth.client.js';

const baseUrl = 'http://localhost:8081';
let cookie = '';
let token = '';
const loginStatuses = [];
const fetcher = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { ...options.headers, ...(cookie ? { Cookie: cookie } : {}) }
  });
  const sessionCookie = response.headers.getSetCookie().find(value => value.startsWith('JSESSIONID='));
  if (sessionCookie) cookie = sessionCookie.split(';')[0];
  if (url.endsWith('/session')) token = (await response.clone().json()).csrfToken;
  if (url.endsWith('/login')) loginStatuses.push(response.status);
  return response;
};
const client = createAuthClient({ baseUrl, origin: 'http://localhost:5173', fetcher });
await client.session();
// Invalidate only this diagnostic's anonymous session, keeping the client's cached token.
const logout = await fetcher(`${baseUrl}/auth/logout`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: '{}'
});
assert.equal(logout.status, 200);
await assert.rejects(client.login({
  email: `signin-diagnostic-${crypto.randomUUID()}@example.test`, password: 'Diagnostic!2026'
}), { code: 'INVALID_CREDENTIALS' });
assert.deepEqual(loginStatuses, [403, 401]);
console.log('PASS: expired session rejected once, refreshed automatically, then reached password validation.');
await client.logout();
