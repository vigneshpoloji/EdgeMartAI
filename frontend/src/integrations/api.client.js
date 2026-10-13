import { createAuthClient } from '../authentication/auth.client.js';
// Keep '/' intact: production serves authentication and shopping on this origin.
export const backendUrl = (import.meta.env.VITE_AUTH_API_URL || '').trim();
export const backend = createAuthClient({baseUrl:backendUrl,origin:window.location.origin,oauthOrigins:(import.meta.env.VITE_AUTH_OAUTH_ORIGINS||'').split(',').map(s=>s.trim()).filter(Boolean)});
export const liveBackend = backend.configured;
