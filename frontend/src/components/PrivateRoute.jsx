import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';

export default function PrivateRoute({ children, requiredRole = null }) {
  const { isAuthenticated, isAdmin, hasRole, sessionReady } = useAuth();
  const location = useLocation();

  if (!sessionReady) {
    return <div role="status" className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-purple-950">Validando sesión…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return children;
}
