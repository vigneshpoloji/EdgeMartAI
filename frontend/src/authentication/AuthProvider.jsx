import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AuthError } from './auth.client.js';
import { backend as client } from '../integrations/api.client.js';
import { createPreviewSession, previewEnabled } from './preview.session.js';
const Context = createContext(null);
const apiUrl = import.meta.env.VITE_AUTH_API_URL || '';
const previewMode = previewEnabled(apiUrl, import.meta.env.VITE_AUTH_PREVIEW_ENABLED);
let previewStorage;
try { previewStorage = window.sessionStorage; } catch { /* Browser may block storage. */ }
const preview = createPreviewSession({ storage: previewStorage });
if (!previewMode) preview.clear();
export function AuthProvider({
  children
}) {
  const [capabilities,setCapabilities] = useState({providers:[]});
  useEffect(()=>{if(client.configured)client.config().then(setCapabilities).catch(()=>{});},[]);
  const [session, setSession] = useState(() => ({
    user: previewMode ? preview.read() : null,
    loading: client.configured
  }));
  const revision = useRef(0);
  const channel = useRef(null);
  const refreshSession = useCallback(async () => {
    const current = ++revision.current;
    try {
      const user = previewMode ? preview.read() : await client.session();
      if (current === revision.current) setSession({
        user,
        loading: false
      });
      return user;
    } catch (error) {
      if (current === revision.current) setSession({
        user: null,
        loading: false
      });
      throw error;
    }
  }, []);
  useEffect(() => {
    let live = true;
    if (client.configured || previewMode) refreshSession().catch(() => {});
    const recheck = () => {
      if (live && (client.configured || previewMode) && document.visibilityState === 'visible') refreshSession().catch(() => {});
    };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', recheck);
    const timer = setInterval(recheck, 60000);
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('edgemart-auth-session');
      channel.current.onmessage = () => {
        if (previewMode) preview.clear();
        setSession({
          user: null,
          loading: client.configured
        });
        recheck();
      };
    }
    return () => {
      live = false;
      ++revision.current;
      clearInterval(timer);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', recheck);
      channel.current?.close();
      channel.current = null;
    };
  }, [refreshSession]);
  const value = useMemo(() => ({
    ...session,
    capabilities,
    previewMode,
    canAccessDashboards: Boolean(session.user),
    configured: client.configured,
    refreshSession,
    login: async values => {
      if (previewMode) {
        const user = preview.start(values);
        setSession({ user, loading: false });
        return user;
      }
      await client.login(values);
      const user = await refreshSession();
      if (!user) throw new AuthError('SERVICE_UNAVAILABLE');
      return user;
    },
    signup: async values => {
      if (!previewMode) {
        const result = await client.signup(values);
        const user = result.user;
        if (!user) throw new AuthError('SERVICE_UNAVAILABLE');
        return user;
      }
      const user = preview.start(values);
      preview.clear();
      setSession({ user:null, loading: false });
      return user;
    },
    logout: async () => {
      if (previewMode) preview.clear(); else await client.logout();
      ++revision.current;
      setSession({
        user: null,
        loading: false
      });
      channel.current?.postMessage('recheck');
    },
    oauth: async (provider,returnTo,mode='login') => {
      if(!client.configured || !capabilities.providers.includes(provider)) throw new AuthError('OAUTH_NOT_CONFIGURED');
      return client.oauth(provider,returnTo,mode);
    }
  }), [session, refreshSession, capabilities]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('useAuth requires AuthProvider');
  return value;
}
