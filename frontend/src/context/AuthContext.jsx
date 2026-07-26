import React, { useState, useEffect } from 'react';
import { AuthContext } from './auth';
import { buildApiUrl, request } from '../services/api';

const normalizeRole = (role) => {
  const value = role?.toString().toUpperCase() ?? '';

  if (value === 'ADMIN' || value === 'ADMINISTRADOR') {
    return 'ADMINISTRADOR';
  }

  if (value === 'ESTUDIANTE' || value === 'STUDENT') {
    return 'ESTUDIANTE';
  }

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
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
};

const getStoredSession = () => {
  try {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!storedUser || !storedToken || isTokenInvalidOrExpired(storedToken)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
      return { user: null, token: null };
    }

    return {
      user: JSON.parse(storedUser),
      token: storedToken,
    };
  } catch (error) {
    console.error('Error reading stored auth session', error);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  // Initialize state synchronously so PrivateRoute and components have data on first render
  const [initialSession] = useState(getStoredSession);
  const [user, setUser] = useState(normalizeUser(initialSession.user));
  const [token, setToken] = useState(initialSession.token);
  const [toast, setToast] = useState(null);
  const [sessionReady, setSessionReady] = useState(!initialSession.token);

  const login = (userData, authToken, storagePreference = 'localStorage') => {
    const normalizedUser = normalizeUser(userData);
    const targetStorage = storagePreference === 'localStorage' ? localStorage : sessionStorage;
    const otherStorage = storagePreference === 'localStorage' ? sessionStorage : localStorage;

    targetStorage.setItem('user', JSON.stringify(normalizedUser));
    targetStorage.setItem('token', authToken);
    otherStorage.removeItem('user');
    otherStorage.removeItem('token');

    setUser(normalizedUser);
    setToken(authToken);
    setSessionReady(true);
  };

  const switchRole = async (role) => {
    const normalizedRole = normalizeRole(role);
    const payload = await request('/auth/switch-role', {
      method: 'POST',
      body: JSON.stringify({ rol: normalizedRole }),
    });
    const storagePreference = localStorage.getItem('token') ? 'localStorage' : 'sessionStorage';
    login(payload.usuario, payload.token, storagePreference);
    return normalizeUser(payload.usuario);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setSessionReady(true);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const clearToast = () => setToast(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      showToast('Tu sesión expiró. Inicia sesión nuevamente.', 'error');
    };
    window.addEventListener('safewalk:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('safewalk:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    if (!initialSession.token) return;
    let active = true;
    fetch(buildApiUrl('/users/me'), { headers: { Authorization: `Bearer ${initialSession.token}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid_session');
        const payload = await response.json();
        if (active && payload?.data) {
          const validatedUser = normalizeUser(payload.data);
          setUser(validatedUser);
          const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(validatedUser));
        }
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => { if (active) setSessionReady(true); });
    return () => { active = false; };
  }, [initialSession.token]);

  const updateUser = (updatedData) => {
    const targetStorage = localStorage.getItem('user') ? localStorage : (sessionStorage.getItem('user') ? sessionStorage : null);
    if (!targetStorage) return;
    const currentUser = JSON.parse(targetStorage.getItem('user'));
    const newUser = normalizeUser({ ...currentUser, ...updatedData });
    targetStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const isAuthenticated = Boolean(token && user && !isTokenInvalidOrExpired(token));
  const isAdmin = normalizeRole(user?.rol) === 'ADMINISTRADOR';
  const hasRole = (role) => normalizeRole(user?.rol) === normalizeRole(role);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchRole, updateUser, toast, showToast, clearToast, sessionReady, isAuthenticated, isAdmin, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
