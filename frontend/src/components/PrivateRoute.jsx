import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth';

/**
 * Route guard for authenticated and role-restricted pages.
 *
 * - No requiredRole → any authenticated user passes.
 * - requiredRole set → user must have that exact role.
 * - Admin path check ensures /admin/* never renders for non-admins
 *   even if requiredRole is omitted on a nested route.
 */
export default function PrivateRoute({ children, requiredRole = null }) {
  const { isAuthenticated, isAdmin, hasRole, sessionReady } = useAuth();
  const location = useLocation();

  // Wait for the async session revalidation before making routing decisions
  if (!sessionReady) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Validando sesión"
        className="flex min-h-screen items-center justify-center bg-slate-50 gap-2 text-sm font-bold text-purple-950"
      >
        <span className="material-symbols-outlined animate-spin text-[22px]" aria-hidden="true">
          progress_activity
        </span>
        Validando sesión…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Administrators may use the student-facing views without changing their
  // session or JWT. Administrative paths keep their separate guard below.
  const hasRequiredRole = requiredRole === 'ESTUDIANTE'
    ? hasRole('ESTUDIANTE') || isAdmin
    : !requiredRole || hasRole(requiredRole);

  if (!hasRequiredRole) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return <Navigate to="/403" replace state={{ from: location }} />;
  }

  return children;
}
