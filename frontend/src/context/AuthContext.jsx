import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './auth';
import { buildApiUrl, request } from '../services/api';

// ── Pure helpers (defined outside the component so they are never recreated) ──

const normalizeRole = (role) => {
  const value = role?.toString().toUpperCase() ?? '';
  if (value === 'ADMIN' || value === 'ADMINISTRADOR') return 'ADMINISTRADOR';
  if (value === 'ESTUDIANTE' || value === 'STUDENT')   return 'ESTUDIANTE';
  return value;
};

const normalizeUser = (userData) => {
  if (!userData) return null;
  const rol = normalizeRole(userData.rol);
  const receivedRoles = Array.isArray(userData.roles) ? userData.roles : [rol];
  const roles = [...new Set(receivedRoles.map(normalizeRole).filter(Boolean))];
  return { ...userData, rol, roles };
};

const isTokenInvalidOrExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 < Date.now()) return true;
    return false;
  } catch {
    return true;
  }
};

const clearStorage = () => {
  ['user', 'token'].forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

const getStoredSession = () => {
  try {
    const storedUser  = localStorage.getItem('user')  || sessionStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!storedUser || !storedToken || isTokenInvalidOrExpired(storedToken)) {
      clearStorage();
      return { user: null, token: null };
    }
    return { user: JSON.parse(storedUser), token: storedToken };
  } catch (err) {
    console.error('Error reading stored auth session', err);
    clearStorage();
    return { user: null, token: null };
  }
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [initialSession] = useState(getStoredSession);
  const [user,         setUser]         = useState(() => normalizeUser(initialSession.user));
  const [token,        setToken]        = useState(initialSession.token);
  const [toast,        setToast]        = useState(null);
  // sessionReady starts false only when we need to revalidate an existing token
  const [sessionReady, setSessionReady] = useState(!initialSession.token);

  // ── Stable callbacks (will not change between renders) ──────────────────

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessionReady(true);
    clearStorage();
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const login = useCallback((userData, authToken, storagePreference = 'localStorage') => {
    const normalized   = normalizeUser(userData);
    const target = storagePreference === 'localStorage' ? localStorage : sessionStorage;
    const other  = storagePreference === 'localStorage' ? sessionStorage : localStorage;
    target.setItem('user',  JSON.stringify(normalized));
    target.setItem('token', authToken);
    other.removeItem('user');
    other.removeItem('token');
    setUser(normalized);
    setToken(authToken);
    setSessionReady(true);
  }, []);

  const switchRole = useCallback(async (role) => {
    const normalizedRole = normalizeRole(role);
    const payload = await request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ rol: normalizedRole }),
    });
    const storagePreference = localStorage.getItem('token') ? 'localStorage' : 'sessionStorage';
    const normalized = normalizeUser(payload.usuario);
    const target = storagePreference === 'localStorage' ? localStorage : sessionStorage;
    const other  = storagePreference === 'localStorage' ? sessionStorage : localStorage;
    // Persist before React state update to avoid PrivateRoute race condition
    target.setItem('user',  JSON.stringify(normalized));
    target.setItem('token', payload.token);
    other.removeItem('user');
    other.removeItem('token');
    return normalized;
  }, []);

  const updateUser = useCallback((updatedData) => {
    const targetStorage = localStorage.getItem('user')
      ? localStorage
      : sessionStorage.getItem('user')
      ? sessionStorage
      : null;
    if (!targetStorage) return;
    const current = JSON.parse(targetStorage.getItem('user'));
    const next    = normalizeUser({ ...current, ...updatedData });
    targetStorage.setItem('user', JSON.stringify(next));
    setUser(next);
  }, []);

  // ── Session revalidation on mount ────────────────────────────────────────
  useEffect(() => {
    if (!initialSession.token) return;
    let active = true;

    fetch(buildApiUrl('/users/me'), {
      headers: { Authorization: `Bearer ${initialSession.token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('invalid_session');
        const payload = await res.json();
        if (active && payload?.data) {
          const validated = normalizeUser(payload.data);
          setUser(validated);
          const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(validated));
        }
      })
      .catch(() => { if (active) logout(); })
      .finally(() => { if (active) setSessionReady(true); });

    return () => { active = false; };
  }, [initialSession.token, logout]);

  // ── Global 401 listener ──────────────────────────────────────────────────
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      showToast('Tu sesión expiró. Inicia sesión nuevamente.', 'error');
    };
    window.addEventListener('safewalk:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('safewalk:unauthorized', handleUnauthorized);
  }, [logout, showToast]);

  // ── Derived values — memoized so downstream consumers only re-render when
  //    the actual values change, not on every parent render ─────────────────
  const isAuthenticated = useMemo(
    () => Boolean(token && user && !isTokenInvalidOrExpired(token)),
    [token, user]
  );

  const isAdmin = useMemo(() => normalizeRole(user?.rol) === 'ADMINISTRADOR', [user]);

  const hasRole = useCallback(
    (role) => normalizeRole(user?.rol) === normalizeRole(role),
    [user]
  );

  // ── Context value — stable object reference when nothing changed ─────────
  const contextValue = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      switchRole,
      updateUser,
      toast,
      showToast,
      clearToast,
      sessionReady,
      isAuthenticated,
      isAdmin,
      hasRole,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, token, toast, sessionReady, isAuthenticated, isAdmin]
    // Stable callbacks (login, logout, switchRole, updateUser, showToast,
    // clearToast, hasRole) are intentionally omitted — they never change.
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
