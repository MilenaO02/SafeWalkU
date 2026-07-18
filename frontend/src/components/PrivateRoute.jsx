import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, requiredRole = null }) {
  const { isAuthenticated, isAdmin, hasRole } = useAuth();
  const location = useLocation();

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
