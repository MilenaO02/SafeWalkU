import React, { useState, useEffect } from 'react';
import { AuthContext } from './auth';

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

const getStoredSession = () => {
  try {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const storedToken = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (!storedUser) {
      return { user: null, token: null };
    }

    return {
      user: JSON.parse(storedUser),
      token: storedToken,
    };
  } catch (error) {
    console.error('Error reading stored auth session', error);
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }) => {
  // Initialize state synchronously so PrivateRoute and components have data on first render
  const initialSession = getStoredSession();
  const [user, setUser] = useState(initialSession.user ? { ...initialSession.user, rol: normalizeRole(initialSession.user.rol) } : null);
  const [token, setToken] = useState(initialSession.token);
  const [toast, setToast] = useState(null);

  // We no longer need the useEffect that overwrites state asynchronously


  const login = (userData, authToken, storagePreference = 'localStorage') => {
    const normalizedUser = { ...userData, rol: normalizeRole(userData?.rol) };
    const targetStorage = storagePreference === 'localStorage' ? localStorage : sessionStorage;
    const otherStorage = storagePreference === 'localStorage' ? sessionStorage : localStorage;

    targetStorage.setItem('user', JSON.stringify(normalizedUser));
    targetStorage.setItem('token', authToken);
    otherStorage.removeItem('user');
    otherStorage.removeItem('token');

    setUser(normalizedUser);
    setToken(authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
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

  const updateUser = (updatedData) => {
    const targetStorage = localStorage.getItem('user') ? localStorage : (sessionStorage.getItem('user') ? sessionStorage : null);
    if (!targetStorage) return;
    const currentUser = JSON.parse(targetStorage.getItem('user'));
    const newUser = { ...currentUser, ...updatedData };
    targetStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const isAuthenticated = Boolean(token && user);
  const isAdmin = normalizeRole(user?.rol) === 'ADMINISTRADOR';
  const hasRole = (role) => normalizeRole(user?.rol) === normalizeRole(role);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, toast, showToast, clearToast, isAuthenticated, isAdmin, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

