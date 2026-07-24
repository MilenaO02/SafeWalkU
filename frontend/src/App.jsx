import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth';

// Layouts
import AuthLayout from './layouts/AuthLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';

import PrivateRoute from './components/PrivateRoute.jsx';

const LoginEstudiante = React.lazy(() => import('./components/LoginEstudiante.jsx'));
const Registro = React.lazy(() => import('./components/Registro.jsx'));
const Unauthorized = React.lazy(() => import('./components/Unauthorized.jsx'));
const StudentApp = React.lazy(() => import('./pages/StudentApp.jsx'));
const ReportarIncidente = React.lazy(() => import('./components/ReportarIncidente.jsx'));
const ResumenReporte = React.lazy(() => import('./components/ResumenReporte.jsx'));
const EmergenciaSos = React.lazy(() => import('./components/EmergenciaSos.jsx'));
const ListaContactosApoyo = React.lazy(() => import('./components/ListaContactosApoyo.jsx'));
const PerfilEstudiante = React.lazy(() => import('./components/PerfilEstudiante.jsx'));
const DetalleZonaRiesgo = React.lazy(() => import('./components/DetalleZonaRiesgo.jsx'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard.jsx'));
const GestionUsuarios = React.lazy(() => import('./components/GestionUsuarios.jsx'));
const HistorialNotificaciones = React.lazy(() => import('./components/HistorialNotificaciones.jsx'));
const AdminSettings = React.lazy(() => import('./components/AdminSettings.jsx'));
const EditorRutas = React.lazy(() => import('./components/EditorRutas.jsx'));
const EditorUbicaciones = React.lazy(() => import('./components/EditorUbicaciones.jsx'));

function ToastHost() {
  const { toast, clearToast } = useAuth();

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => clearToast(), 3000);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[120] rounded-2xl border border-purple-200 bg-white px-4 py-3 shadow-xl text-sm font-semibold text-purple-950">
      {toast.message}
    </div>
  );
}

function NetworkStatus() {
  const [online, setOnline] = React.useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (online) return null;
  return <div role="status" className="fixed left-1/2 top-3 z-[200] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl bg-amber-600 px-4 py-3 text-center text-xs font-bold text-white shadow-xl">Sin conexión. Conserva esta página abierta y vuelve a intentar cuando se restablezca la red.</div>;
}

function AppRoutes() {
  return (
    <>
      <Router>
        <React.Suspense fallback={<div role="status" className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-bold text-purple-950">Cargando SafeWalk U…</div>}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<LoginEstudiante />} />
            <Route path="/login" element={<LoginEstudiante />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/403" element={<Unauthorized />} />
          </Route>

          <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
            <Route path="/app" element={<StudentApp />} />
            <Route path="/reportar" element={<ReportarIncidente />} />
            <Route path="/resumen-reporte" element={<ResumenReporte />} />
            <Route path="/sos" element={<EmergenciaSos />} />
            <Route path="/contactos" element={<ListaContactosApoyo />} />
            <Route path="/perfil" element={<PerfilEstudiante />} />
            <Route path="/detalle-zona" element={<DetalleZonaRiesgo />} />
            <Route path="/admin" element={<PrivateRoute requiredRole="ADMINISTRADOR"><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/usuarios" element={<PrivateRoute requiredRole="ADMINISTRADOR"><GestionUsuarios /></PrivateRoute>} />
            <Route path="/admin/notificaciones" element={<PrivateRoute requiredRole="ADMINISTRADOR"><HistorialNotificaciones /></PrivateRoute>} />
            <Route path="/admin/configuracion" element={<PrivateRoute requiredRole="ADMINISTRADOR"><AdminSettings /></PrivateRoute>} />
            <Route path="/admin/rutas" element={<PrivateRoute requiredRole="ADMINISTRADOR"><EditorRutas /></PrivateRoute>} />
            <Route path="/admin/ubicaciones" element={<PrivateRoute requiredRole="ADMINISTRADOR"><EditorUbicaciones /></PrivateRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </React.Suspense>
      </Router>
      <ToastHost />
      <NetworkStatus />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
