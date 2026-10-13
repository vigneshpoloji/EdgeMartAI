import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('production root API configuration boots shopping and driver clients on the public origin', async () => {
  const originalWindow = globalThis.window, originalFetch = globalThis.fetch;
  const origin = 'https://edgemartai.onrender.com';
  const calls = [];
  globalThis.window = {location: {origin}};
  globalThis.fetch = async (url, options) => {
    calls.push({url, options});
    return {ok: true, json: async () => url.endsWith('/session')
      ? {user: null, csrfToken: 'production-session-token'} : {ok: true}};
  };
  let server;
  try {
    server = await createServer({configFile: false, envFile: false,
      cacheDir: '.dashboard-render-cache/auth', optimizeDeps: {noDiscovery: true, include: []},
      define: {'import.meta.env.VITE_AUTH_API_URL': JSON.stringify('/'),
        'import.meta.env.VITE_AUTH_OAUTH_ORIGINS': JSON.stringify('')},
      server: {middlewareMode: true, hmr: {port: 0}, watch: null}, appType: 'custom'});
    const {backend, liveBackend, backendUrl} = await server.ssrLoadModule('/src/integrations/api.client.js');
    assert.equal(backendUrl, '/');
    assert.equal(liveBackend, true);
    assert.equal(backend.configured, true);
    const credentials = {email: 'buyer@example.test', password: 'Example!2026'};
    await backend.login(credentials);
    await backend.api('/api/catalogue');
    const {driverClient} = await server.ssrLoadModule('/src/delivery/DriverAuthProvider.jsx');
    assert.equal(driverClient.configured, true);
    await driverClient.login(credentials);
    assert.deepEqual(calls.map(call => call.url), [origin+'/auth/session', origin+'/auth/login',
      origin+'/api/catalogue', origin+'/auth/driver/session', origin+'/auth/driver/login']);
    for (const {options} of calls) assert.equal(options.credentials, 'include');
    for (const {options} of calls.filter(call => call.options.method === 'POST')) {
      assert.equal(options.headers['X-CSRF-Token'], 'production-session-token');
      assert.deepEqual(JSON.parse(options.body), credentials);
    }
  } finally {
    await server?.close();
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
    globalThis.fetch = originalFetch;
  }
});
