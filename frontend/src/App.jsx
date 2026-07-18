import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import AuthLayout from './layouts/AuthLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';

// Auth
import LoginEstudiante from './components/LoginEstudiante.jsx';
import Registro from './components/Registro.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import Unauthorized from './components/Unauthorized.jsx';

// Componentes Estudiante
import StudentApp from './pages/StudentApp.jsx';
import ReportarIncidente from './components/ReportarIncidente.jsx';
import ResumenReporte from './components/ResumenReporte.jsx';
import EmergenciaSos from './components/EmergenciaSos.jsx';
import ListaContactosApoyo from './components/ListaContactosApoyo.jsx';
import PerfilEstudiante from './components/PerfilEstudiante.jsx';
import DetalleZonaRiesgo from './components/DetalleZonaRiesgo.jsx';

// Componentes Administración
import AdminDashboard from './pages/AdminDashboard.jsx';
import GestionUsuarios from './components/GestionUsuarios.jsx';
import HistorialNotificaciones from './components/HistorialNotificaciones.jsx';
import AdminSettings from './components/AdminSettings.jsx';

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

function AppRoutes() {
  return (
    <>
      <Router>
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
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <ToastHost />
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