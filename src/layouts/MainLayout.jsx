import React, { createContext, useState, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import MapaInteractivo from '../components/MapaInteractivo';

import { useAuth } from '../context/AuthContext';

// Contexto para sincronizar el Mapa Interactivo en las vistas del estudiante
export const MapContext = createContext();
export const useMapConfig = () => useContext(MapContext);

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, logout, showToast } = useAuth();

  // Configuración por defecto para el mapa (UIDE Loja — coordenadas exactas)
  const defaultMapConfig = {
    centro: [-3.97245, -79.19933],
    zoom: 17,
    markers: [
      { 
        position: [-3.97245, -79.19933], 
        title: "UIDE - Extensión Loja", 
        desc: "Calle Agustín Carrión Palacios, entre Av. Salvador Bustamante Celi y Beethoven, Sector Jipiro" 
      }
    ],
    circle: null
  };

  const [mapConfig, setMapConfig] = useState(defaultMapConfig);

  const handleLogout = () => {
    logout();
    showToast('Sesión cerrada');
    navigate('/login');
  };

  // ----------------------------------------------------
  // VISTA ADMINISTRADOR
  // ----------------------------------------------------
  if (isAdminRoute) {
    const activeClass = "bg-purple-100 text-purple-950 border-l-4 border-purple-900 font-bold";
    const inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold";

    const getAdminTitle = () => {
      switch (location.pathname) {
        case '/admin/usuarios':
          return 'Gestión de Usuarios';
        case '/admin/notificaciones':
          return 'Historial de Notificaciones y Alertas';
        case '/admin/configuracion':
          return 'Ajustes del Sistema';
        default:
          return 'Dashboard de Seguridad';
      }
    };

    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
        
        {/* Barra lateral de Administración */}
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col py-6 z-30 shadow-sm transition-all duration-300">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="p-2 bg-purple-50 text-purple-900 rounded-xl border border-purple-100 shadow-sm">
              <span className="material-symbols-outlined text-[24px] block font-bold">shield</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-purple-950 tracking-tight">SafeWalk Admin</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UIDE Control</p>
            </div>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            <Link
              to="/admin"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/admin' ? activeClass : inactiveClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span>Dashboard</span>
            </Link>
            <Link
              to="/admin/usuarios"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/admin/usuarios' ? activeClass : inactiveClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
              <span>Usuarios</span>
            </Link>
            <Link
              to="/admin/notificaciones"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/admin/notificaciones' ? activeClass : inactiveClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">report_problem</span>
              <span>Reportes / SOS</span>
            </Link>
            <Link
              to="/admin/configuracion"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/admin/configuracion' ? activeClass : inactiveClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Configuración</span>
            </Link>
          </nav>

          <div className="px-3 pt-4 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-bold text-sm transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Contenedor de contenido de Administración */}
        <div className="ml-64 flex-1 flex flex-col min-h-screen">
          {/* Header Superior Administrativo */}
          <header className="flex justify-between items-center w-full px-8 h-16 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
            <h2 className="text-xl font-bold text-purple-950 tracking-tight">
              {getAdminTitle()}
            </h2>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">notifications</span>
              <span className="material-symbols-outlined text-slate-500 cursor-pointer hover:bg-slate-100 p-2 rounded-full transition-colors">help</span>
              <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-white text-xs font-black shadow-md">
                {user ? `${user.nombre?.charAt(0) || ''}${user.apellido?.charAt(0) || ''}` || 'US' : 'AD'}
              </div>
            </div>
          </header>

          {/* Área principal del Dashboard */}
          <main className="flex-1 p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VISTA ESTUDIANTE (CON MAPA COMPARTIDO)
  // ----------------------------------------------------
  const studentLinks = [
    { path: '/app',      label: 'Inicio',       icon: 'map'           },
    { path: '/reportar', label: 'Reportar',     icon: 'report_problem'},
    { path: '/sos',      label: 'SOS',          icon: 'emergency', highlight: true },
    { path: '/contactos',label: 'Apoyo',        icon: 'contact_phone' },
    { path: '/perfil',   label: 'Mi Perfil',    icon: 'person'        },
  ];

  // El mapa se oculta en la vista de perfil para que ocupe todo el ancho
  const isPerfilRoute = location.pathname === '/perfil';

  return (
    <MapContext.Provider value={{ mapConfig, setMapConfig, defaultMapConfig }}>
      <div className="flex flex-col h-screen w-screen bg-slate-50 overflow-hidden antialiased font-sans">
        
        {/* Cabecera Superior del Estudiante */}
        <header className="bg-white text-slate-800 border-b border-slate-200 shadow-sm flex justify-between items-center w-full px-6 h-16 z-50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Link to="/app" className="flex items-center gap-3 hover:opacity-90">
              <div className="p-2 bg-purple-50 text-purple-900 rounded-xl border border-purple-100 shadow-sm">
                <span className="material-symbols-outlined text-[22px] block font-bold">shield</span>
              </div>
              <span className="text-xl font-black text-purple-950 tracking-tight">SafeWalk U</span>
            </Link>
          </div>
          
          {/* Navegación central (Desktop) */}
          <nav className="hidden md:flex items-center gap-2">
            {studentLinks.map((link) => {
              const active = location.pathname === link.path || (link.path === '/app' && location.pathname === '/resumen-reporte');
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    link.highlight 
                      ? 'bg-red-50 text-red-600 hover:bg-red-100 shadow-sm' 
                      : active 
                        ? 'bg-purple-50 text-purple-900 border border-purple-200/50' 
                        : 'text-slate-600 hover:text-purple-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-slate-500 hover:bg-slate-100 p-2 rounded-full transition-all text-[22px]">notifications</button>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/80 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Área del Cuerpo: Panel lateral + Mapa */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 w-full relative pb-[60px] md:pb-0">
          
          {/* Panel Lateral Izquierdo */}
          <aside className={`
            bg-white border-r border-slate-200 overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0 z-20 shadow-md relative
            ${isPerfilRoute
              ? 'w-full h-full md:w-full'
              : 'w-full h-[55%] md:h-full md:w-[38%] lg:w-[420px] rounded-t-3xl md:rounded-t-none md:rounded-tr-3xl'
            }
          `}>
            <div className="flex-1 p-5 md:p-6">
              <Outlet />
            </div>
          </aside>

          {/* Panel Derecho: Mapa — oculto en /perfil */}
          {!isPerfilRoute && (
            <section className="w-full h-[45%] md:h-full flex-1 relative bg-slate-100 overflow-hidden z-10">
              <MapaInteractivo 
                centro={mapConfig.centro}
                zoom={mapConfig.zoom}
                markers={mapConfig.markers}
                circle={mapConfig.circle}
                polyline={mapConfig.polyline}
              />
            </section>
          )}
        </main>

        {/* Tabbar inferior para móviles */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-2.5 bg-white border-t border-slate-200 md:hidden shadow-lg">
          {studentLinks.slice(0, 5).map((link) => {
            const active = location.pathname === link.path;
            return (
              <Link 
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  link.highlight
                    ? 'bg-red-50 text-red-600'
                    : active 
                      ? 'bg-purple-50 text-purple-900 font-bold' 
                      : 'text-slate-500'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                <span className="text-[10px] font-semibold mt-0.5">{link.label}</span>
              </Link>
            );
          })}
        </nav>

      </div>
    </MapContext.Provider>
  );
}
