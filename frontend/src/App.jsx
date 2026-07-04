import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from './layouts/AuthLayout.jsx';
import MainLayout from './layouts/MainLayout.jsx';

// Auth
import LoginEstudiante from './components/LoginEstudiante.jsx';
import Registro from './components/Registro.jsx';

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

function App() {
  return (
    <Router>
      <Routes>
        {/* ── Autenticación (sin chrome de layout) ── */}
        <Route element={<AuthLayout />}>
          <Route path="/"         element={<LoginEstudiante />} />
          <Route path="/login"    element={<LoginEstudiante />} />
          <Route path="/registro" element={<Registro />} />
        </Route>

        {/* ── Aplicación principal (con MainLayout) ── */}
        <Route element={<MainLayout />}>
          {/* Estudiante */}
          <Route path="/app"              element={<StudentApp />} />
          <Route path="/reportar"         element={<ReportarIncidente />} />
          <Route path="/resumen-reporte"  element={<ResumenReporte />} />
          <Route path="/sos"              element={<EmergenciaSos />} />
          <Route path="/contactos"        element={<ListaContactosApoyo />} />
          <Route path="/perfil"           element={<PerfilEstudiante />} />
          <Route path="/detalle-zona"     element={<DetalleZonaRiesgo />} />

          {/* Administración */}
          <Route path="/admin"                    element={<AdminDashboard />} />
          <Route path="/admin/usuarios"           element={<GestionUsuarios />} />
          <Route path="/admin/notificaciones"     element={<HistorialNotificaciones />} />
          <Route path="/admin/configuracion"      element={<AdminSettings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;