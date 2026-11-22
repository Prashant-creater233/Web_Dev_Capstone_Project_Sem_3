import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokens } from '../api';

// Context API: any component can call useAuth() to get the logged-in user and login/logout functions
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load: if tokens exist, ask the server who we are
  useEffect(() => {
    const onLogout = () => setUser(null);
    window.addEventListener('auth:logout', onLogout);

    if (tokens.access || tokens.refresh) {
      api('/auth/me')
        .then((d) => setUser(d.user))
        .catch(() => tokens.clear())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => window.removeEventListener('auth:logout', onLogout);
  }, []);

  const login = async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    tokens.set(d.accessToken, d.refreshToken);
    setUser(d.user);
    return d.user;
  };

  const register = async (form) => {
    const d = await api('/auth/register', { method: 'POST', body: form });
    tokens.set(d.accessToken, d.refreshToken);
    setUser(d.user);
    return d.user;
  };

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    tokens.clear();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
