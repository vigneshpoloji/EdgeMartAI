import { safeReturnTo } from './auth.utils.js';

// Base backend URL without '/api' suffix so routes map to /auth/* properly
const BACKEND_BASE = (import.meta.env?.VITE_AUTH_API_URL || import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8081').trim().replace(/\/+$/, '').replace(/\/api$/, '');

let activeCsrfToken = null;

async function getCsrfToken() {
  if (activeCsrfToken) return activeCsrfToken;
  try {
    const res = await fetch(`${BACKEND_BASE}/auth/session`, {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
      const data = await res.json();
      activeCsrfToken = data.csrfToken || null;
    }
  } catch {
    activeCsrfToken = null;
  }
  return activeCsrfToken;
}

// 1. User Login
export async function loginUser(email, password) {
  const csrf = await getCsrfToken();
  const response = await fetch(`${BACKEND_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {})
    },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Login failed. Please check your credentials.');
  }

  const result = await response.json();
  // Refresh CSRF token on successful login
  activeCsrfToken = null;
  await getCsrfToken();
  return result.user || result;
}

// 2. User Registration / Signup
export async function registerUser(userData) {
  const csrf = await getCsrfToken();
  const response = await fetch(`${BACKEND_BASE}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {})
    },
    credentials: 'include',
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Registration failed.');
  }
  return response.json();
}

// 3. Current User Profile / Session Check
export async function fetchCurrentSession() {
  const response = await fetch(`${BACKEND_BASE}/auth/session`, {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) return null;
  const data = await response.json();
  if (data?.csrfToken) {
    activeCsrfToken = data.csrfToken;
  }
  return data?.user || null;
}

// 4. Logout
export async function logoutUser() {
  const csrf = await getCsrfToken();
  await fetch(`${BACKEND_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrf ? { 'X-CSRF-Token': csrf } : {})
    },
    credentials: 'include'
  }).catch(() => {});
  activeCsrfToken = null;
}

export class AuthError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
    this.name = 'AuthError';
  }
}

function userFrom(value) {
  if (value === null) return null;
  if (!value || typeof value.id !== 'string' || !value.id || typeof value.email !== 'string') {
    throw new AuthError('SERVICE_UNAVAILABLE');
  }
  return {
    id: value.id,
    email: value.email,
    name: typeof value.name === 'string' ? value.name.slice(0, 100) : '',
    role: value.role === 'driver' ? 'driver' : 'buyer'
  };
}

export function createAuthClient({
  baseUrl = '',
  origin,
  fetcher = (...args) => fetch(...args),
  authPrefix = '/auth',
  oauthOrigins = []
}) {
  if (!['/auth','/auth/driver'].includes(authPrefix)) throw new AuthError('SERVICE_UNAVAILABLE');
  let api = null;
  let csrfToken = null;
  try {
    if (baseUrl.trim()) {
      const url = new URL(baseUrl.trim(), origin);
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
      if ((url.protocol === 'https:' || (url.protocol === 'http:' && local)) && !url.username && !url.password && !url.search && !url.hash) {
        api = url.href.replace(/\/$/, '');
      }
    }
  } catch {
    /* Invalid configuration keeps authentication closed. */
  }

  const oauthAllowed = new Set([
    'https://accounts.google.com',
    'https://github.com',
    ...oauthOrigins.filter(value => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.origin === value;
      } catch {
        return false;
      }
    })
  ]);

  async function request(path, { method = 'GET', body, timeoutMs = 12000 } = {}) {
    if (!api) throw new AuthError('NOT_CONFIGURED');
    const controller = new AbortController();
    const timeout=Number.isFinite(timeoutMs)?Math.min(30000,Math.max(1000,timeoutMs)):12000;
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetcher(`${api}${path}`, {
        method,
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(method !== 'GET'
            ? {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            : {})
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });
      let result;
      try {
        result = await response.json();
      } catch {
        throw new AuthError('SERVICE_UNAVAILABLE');
      }
      if (!response.ok) {
        const error = new AuthError(
          response.status === 429
            ? 'RATE_LIMITED'
            : typeof result?.code === 'string'
            ? result.code
            : response.status === 401
            ? 'INVALID_CREDENTIALS'
            : 'SERVICE_UNAVAILABLE'
        );
        error.status = response.status;
        if (typeof result?.message === 'string') error.message = result.message;
        throw error;
      }
      if (!result || typeof result !== 'object' || Array.isArray(result)) {
        throw new AuthError('SERVICE_UNAVAILABLE');
      }
      return result;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError('NETWORK_ERROR');
    } finally {
      clearTimeout(timer);
    }
  }

  async function session() {
    const result = await request(`${authPrefix}/session`);
    const user = userFrom(result.user);
    if (typeof result.csrfToken !== 'string' || !result.csrfToken) {
      csrfToken = null;
      throw new AuthError('SERVICE_UNAVAILABLE');
    }
    csrfToken = result.csrfToken;
    return user;
  }

  async function mutate(path, body) {
    if (!csrfToken) await session();
    return mutation(path, { method: 'POST', body });
  }

  async function mutation(path, options) {
    try {
      return await request(path, options);
    } catch (error) {
      // The CSRF filter rejects these requests before the controller runs.
      // A restarted backend or expired cookie needs a new session token.
      if (error.status !== 403 || !['CSRF_EXPIRED', 'ACCESS_DENIED'].includes(error.code)) throw error;
      csrfToken = null;
      await session();
      return request(path, options);
    }
  }

  return {
    configured: Boolean(api),
    session,
    config: () => request('/auth/config'),
    api: async (path, options = {}) => {
      if (!path.startsWith('/api/')) throw new AuthError('SERVICE_UNAVAILABLE');
      if (options.method && options.method !== 'GET' && !csrfToken) await session();
      return options.method && options.method !== 'GET'
        ? mutation(path, options)
        : request(path, options);
    },
    login: values => mutate(`${authPrefix}/login`, values),
    signup: values => mutate(`${authPrefix}/signup`, values),
    logout: async () => {
      await mutate(`${authPrefix}/logout`, {});
      csrfToken = null;
    },
    oauth: async (provider, returnTo, mode='login') => {
      if(!['login','signup','link'].includes(mode))throw new AuthError('SERVICE_UNAVAILABLE');
      if (!['google', 'github'].includes(provider)) {
        throw new AuthError('SERVICE_UNAVAILABLE');
      }
      const result = await mutate('/auth/oauth/start', {
        provider,
        ...(mode==='login'?{}:{mode}),
        returnTo: new URL(safeReturnTo(returnTo, origin), origin).href
      });
      let destination;
      try {
        destination = new URL(result.url);
      } catch {
        throw new AuthError('SERVICE_UNAVAILABLE');
      }
      const serverStart =
        destination.origin === new URL(api).origin &&
        destination.pathname === `/oauth2/authorization/${provider}` &&
        !destination.search &&
        !destination.hash;
      if (
        (!oauthAllowed.has(destination.origin) && !serverStart) ||
        destination.username ||
        destination.password
      ) {
        throw new AuthError('SERVICE_UNAVAILABLE');
      }
      return destination.href;
    }
  };
}
