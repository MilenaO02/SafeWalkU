import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

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
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const { user: storedUser, token: storedToken } = getStoredSession();
    if (storedUser) {
      setUser({ ...storedUser, rol: normalizeRole(storedUser.rol) });
      setToken(storedToken);
    }
  }, []);

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

  const isAuthenticated = Boolean(token || user);
  const isAdmin = normalizeRole(user?.rol) === 'ADMINISTRADOR';
  const hasRole = (role) => normalizeRole(user?.rol) === normalizeRole(role);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, toast, showToast, clearToast, isAuthenticated, isAdmin, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
