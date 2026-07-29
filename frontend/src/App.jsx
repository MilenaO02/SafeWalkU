import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth';

// Layouts
import AuthLayout from './layouts/AuthLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

// Lazy-loaded pages and components
const LoginEstudiante      = React.lazy(() => import('./components/LoginEstudiante.jsx'));
const Registro             = React.lazy(() => import('./components/Registro.jsx'));
const Unauthorized         = React.lazy(() => import('./components/Unauthorized.jsx'));
const StudentApp           = React.lazy(() => import('./pages/StudentApp.jsx'));
const ReportarIncidente    = React.lazy(() => import('./components/ReportarIncidente.jsx'));
const ResumenReporte       = React.lazy(() => import('./components/ResumenReporte.jsx'));
const EmergenciaSos        = React.lazy(() => import('./components/EmergenciaSos.jsx'));
const ListaContactosApoyo  = React.lazy(() => import('./components/ListaContactosApoyo.jsx'));
const PerfilEstudiante     = React.lazy(() => import('./components/PerfilEstudiante.jsx'));
const DetalleZonaRiesgo    = React.lazy(() => import('./components/DetalleZonaRiesgo.jsx'));
const AdminDashboard       = React.lazy(() => import('./pages/AdminDashboard.jsx'));
const GestionUsuarios      = React.lazy(() => import('./components/GestionUsuarios.jsx'));
const HistorialNotificaciones = React.lazy(() => import('./components/HistorialNotificaciones.jsx'));
const AdminSettings        = React.lazy(() => import('./components/AdminSettings.jsx'));
const EditorRutas          = React.lazy(() => import('./components/EditorRutas.jsx'));
const EditorUbicaciones    = React.lazy(() => import('./components/EditorUbicaciones.jsx'));

// ── Global toast ────────────────────────────────────────────────────────────
function ToastHost() {
  const { toast, clearToast } = useAuth();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => clearToast(), 3000);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const colorMap = {
    error: 'border-red-200 bg-red-50 text-red-900',
    success: 'border-green-200 bg-green-50 text-green-900',
    info: 'border-purple-200 bg-white text-purple-950',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed bottom-4 right-4 z-[120] rounded-2xl border px-4 py-3 shadow-xl text-sm font-semibold ${
        colorMap[toast.type] ?? colorMap.info
      }`}
    >
      {toast.message}
    </div>
  );
}

// ── Network status banner ───────────────────────────────────────────────────
function NetworkStatus() {
  const [online, setOnline] = React.useState(() => navigator.onLine);

  useEffect(() => {
    const setOn  = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online',  setOn);
    window.addEventListener('offline', setOff);
    return () => {
      window.removeEventListener('online',  setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed left-1/2 top-3 z-[200] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-amber-600 px-4 py-3 text-center text-xs font-bold text-white shadow-xl"
    >
      Sin conexión. Conserva esta página abierta y vuelve a intentar cuando se restablezca la
      red.
    </div>
  );
}

// ── Page-level suspense fallback ────────────────────────────────────────────
const PageFallback = (
  <div
    role="status"
    aria-label="Cargando página"
    className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-purple-950"
  >
    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
    Cargando SafeWalk U…
  </div>
);

// ── Route tree ───────────────────────────────────────────────────────────────
// The outer PrivateRoute on the MainLayout branch only checks authentication.
// Each child route then performs role-specific authorization, so the layout
// shell is shared but access is enforced at the page level — no double wrap.
function AppRoutes() {
  return (
    <>
      <Router>
        <React.Suspense fallback={PageFallback}>
          <Routes>
            {/* Public routes */}
            <Route element={<AuthLayout />}>
              <Route path="/"        element={<LoginEstudiante />} />
              <Route path="/login"   element={<LoginEstudiante />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/403"     element={<Unauthorized />} />
            </Route>

            {/* Protected routes — single PrivateRoute wraps the layout shell */}
            <Route
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              {/* Student routes */}
              <Route path="/app"            element={<PrivateRoute requiredRole="ESTUDIANTE"><StudentApp /></PrivateRoute>} />
              <Route path="/reportar"       element={<PrivateRoute requiredRole="ESTUDIANTE"><ReportarIncidente /></PrivateRoute>} />
              <Route path="/resumen-reporte" element={<PrivateRoute requiredRole="ESTUDIANTE"><ResumenReporte /></PrivateRoute>} />
              <Route path="/sos"            element={<PrivateRoute requiredRole="ESTUDIANTE"><EmergenciaSos /></PrivateRoute>} />
              <Route path="/contactos"      element={<PrivateRoute requiredRole="ESTUDIANTE"><ListaContactosApoyo /></PrivateRoute>} />
              <Route path="/perfil"         element={<PrivateRoute requiredRole="ESTUDIANTE"><PerfilEstudiante /></PrivateRoute>} />
              <Route path="/detalle-zona"   element={<PrivateRoute requiredRole="ESTUDIANTE"><DetalleZonaRiesgo /></PrivateRoute>} />

              {/* Admin routes */}
              <Route path="/admin"                   element={<PrivateRoute requiredRole="ADMINISTRADOR"><AdminDashboard /></PrivateRoute>} />
              <Route path="/admin/usuarios"          element={<PrivateRoute requiredRole="ADMINISTRADOR"><GestionUsuarios /></PrivateRoute>} />
              <Route path="/admin/notificaciones"    element={<PrivateRoute requiredRole="ADMINISTRADOR"><HistorialNotificaciones /></PrivateRoute>} />
              <Route path="/admin/configuracion"     element={<PrivateRoute requiredRole="ADMINISTRADOR"><AdminSettings /></PrivateRoute>} />
              <Route path="/admin/rutas"             element={<PrivateRoute requiredRole="ADMINISTRADOR"><EditorRutas /></PrivateRoute>} />
              <Route path="/admin/ubicaciones"       element={<PrivateRoute requiredRole="ADMINISTRADOR"><EditorUbicaciones /></PrivateRoute>} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </Router>
      <ToastHost />
      <NetworkStatus />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
