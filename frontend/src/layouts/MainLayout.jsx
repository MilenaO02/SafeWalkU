import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import MapaInteractivo from '../components/MapaInteractivo';

import { useAuth } from '../context/auth';
import { MapContext } from '../context/map';
import logoClaro from '../assets/icon_modoclaro.png';
import logoOscuro from '../assets/icon_modooscuro.png';
import { request } from '../services/api';

// Contexto para sincronizar el Mapa Interactivo en las vistas del estudiante

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

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { user, logout, switchRole, showToast } = useAuth();

  const [mapConfig, setMapConfig] = useState(defaultMapConfig);
  const [campusPoint, setCampusPoint] = useState(defaultMapConfig.centro);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const availableRoles = user?.roles || [user?.rol].filter(Boolean);
  const canSwitchRole = availableRoles.includes('ESTUDIANTE') && availableRoles.includes('ADMINISTRADOR');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (isAdminRoute) return;
    request('/ubicaciones').then((response) => {
      const campus = (response.data || []).find((item) => item.tipo_zona === 'UNIVERSIDAD' && Number.isFinite(Number(item.latitud)) && Number.isFinite(Number(item.longitud)));
      if (!campus) return;
      const point = [Number(campus.latitud), Number(campus.longitud)];
      setCampusPoint(point);
      setMapConfig((current) => ({ ...current, centro: point, markers: [{ position: point, title: campus.nombre, desc: campus.direccion }] }));
    }).catch(() => {});
  }, [isAdminRoute]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const handleLogout = () => {
    logout();
    showToast('Sesión cerrada');
    navigate('/login');
  };

  const handleSwitchRole = async () => {
    if (!canSwitchRole || isSwitchingRole) return;

    const targetRole = user?.rol === 'ADMINISTRADOR' ? 'ESTUDIANTE' : 'ADMINISTRADOR';
    setIsSwitchingRole(true);
    try {
      await switchRole(targetRole);
      // La recarga inicia AuthContext desde el JWT recién almacenado y evita
      // que las guardas evalúen el rol nuevo contra la ruta anterior.
      window.location.replace(targetRole === 'ADMINISTRADOR' ? '/admin' : '/app');
    } catch (error) {
      showToast(error.message || 'No fue posible cambiar el modo de acceso', 'error');
    } finally {
      setIsSwitchingRole(false);
    }
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
        case '/admin/rutas':
          return 'Editor de Rutas Seguras';
        case '/admin/ubicaciones':
          return 'Coordenadas de Ubicaciones';
        default:
          return 'Dashboard de Seguridad';
      }
    };

    return (
      <div className="flex min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
        
        {/* Barra lateral de Administración */}
        <aside className="fixed left-0 top-0 hidden h-full w-64 bg-white border-r border-slate-200 md:flex flex-col py-6 z-30 shadow-sm transition-all duration-300">
          <div className="px-6 mb-8 flex items-center justify-center">
            <img 
              src={logoClaro} 
              alt="SafeWalk Admin Logo" 
              className="h-24 w-auto object-contain scale-125 drop-shadow-sm transition-all duration-300 mt-4"
            />
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
              to="/admin/rutas"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/admin/rutas' ? activeClass : inactiveClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">route</span>
              <span>Rutas seguras</span>
            </Link>
            <Link
              to="/admin/configuracion"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/admin/configuracion' ? activeClass : inactiveClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Configuración</span>
            </Link>
            <Link
              to="/admin/ubicaciones"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm ${location.pathname === '/admin/ubicaciones' ? activeClass : inactiveClass}`}
            >
              <span className="material-symbols-outlined text-[20px]">location_on</span>
              <span>Ubicaciones</span>
            </Link>
          </nav>

          <div className="px-3 pt-4 border-t border-slate-100">
            {canSwitchRole && (
              <button
                onClick={handleSwitchRole}
                disabled={isSwitchingRole}
                className="mb-2 w-full flex items-center gap-4 px-4 py-3 rounded-xl text-purple-900 hover:bg-purple-50 font-bold text-sm transition-all disabled:opacity-60"
              >
                <span className={`material-symbols-outlined text-[20px] ${isSwitchingRole ? 'animate-spin' : ''}`}>
                  {isSwitchingRole ? 'progress_activity' : 'school'}
                </span>
                <span>Modo estudiante</span>
              </button>
            )}
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
        <div className="md:ml-64 flex-1 flex flex-col min-h-screen min-w-0">
          {/* Header Superior Administrativo */}
          <header className="flex justify-between items-center w-full px-4 md:px-8 min-h-16 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
            <h2 className="text-base md:text-xl font-bold text-purple-950 tracking-tight">
              {getAdminTitle()}
            </h2>
            <div className="flex items-center gap-4">
              {canSwitchRole && (
                <button
                  onClick={handleSwitchRole}
                  disabled={isSwitchingRole}
                  aria-label="Cambiar a modo estudiante"
                  className="flex min-h-11 items-center gap-2 rounded-xl bg-purple-50 px-3 text-xs font-bold text-purple-900 transition-colors hover:bg-purple-100 disabled:opacity-60"
                >
                  <span className={`material-symbols-outlined text-[20px] ${isSwitchingRole ? 'animate-spin' : ''}`}>
                    {isSwitchingRole ? 'progress_activity' : 'school'}
                  </span>
                  <span className="hidden lg:inline">Modo estudiante</span>
                </button>
              )}
              <button onClick={handleLogout} aria-label="Cerrar sesión" className="md:hidden material-symbols-outlined flex h-11 w-11 items-center justify-center text-red-600">logout</button>
              <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-white text-xs font-black shadow-md">
                {user ? `${user.nombre?.charAt(0) || ''}${user.apellido?.charAt(0) || ''}` || 'US' : 'AD'}
              </div>
            </div>
          </header>

          {/* Área principal del Dashboard */}
          <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
            <Outlet />
          </main>
          <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-slate-200 bg-white px-1 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 md:hidden">
            {[
              ['/admin', 'dashboard', 'Inicio'],
              ['/admin/usuarios', 'group', 'Usuarios'],
              ['/admin/notificaciones', 'report_problem', 'Alertas'],
              ['/admin/rutas', 'route', 'Rutas'],
              ['/admin/ubicaciones', 'location_on', 'Lugares'],
              ['/admin/configuracion', 'settings', 'Ajustes']
            ].map(([path, icon, label]) => <Link key={path} to={path} className={`flex min-h-11 flex-col items-center justify-center rounded-xl text-[10px] font-bold ${location.pathname === path ? 'bg-purple-50 text-purple-900' : 'text-slate-500'}`}><span className="material-symbols-outlined text-[20px]">{icon}</span>{label}</Link>)}
          </nav>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VISTA ESTUDIANTE (CON MAPA COMPARTIDO)
  // ----------------------------------------------------
  const handleCenterUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapConfig(prev => ({ ...prev, centro: [pos.coords.latitude, pos.coords.longitude], zoom: 17 }))
      );
    }
  };

  const handleCenterUni = () => {
    setMapConfig(prev => ({ ...prev, centro: campusPoint, zoom: 17 }));
  };

  const studentLinks = [
    { path: '/app',      label: 'Inicio',       icon: 'my_location',   onClick: handleCenterUser },
    { isAction: true,    label: 'Uni',          icon: 'school',        onClick: handleCenterUni },
    { path: '/reportar', label: 'Reportar',     icon: 'report_problem'},
    { path: '/sos',      label: 'SOS',          icon: 'emergency',     highlight: true },
    { path: '/contactos',label: 'Apoyo',        icon: 'contact_phone' },
    { path: '/perfil',   label: 'Mi Perfil',    icon: 'person'        },
  ];

  // El mapa se oculta en la vista de perfil para que ocupe todo el ancho
  const isPerfilRoute = location.pathname === '/perfil';

  return (
    <MapContext.Provider value={{ mapConfig, setMapConfig, defaultMapConfig, isDarkMode }}>
      <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-[#3C3C40] overflow-hidden antialiased font-sans transition-colors duration-500">
        
        {/* Cabecera Superior del Estudiante */}
        <header className="bg-white dark:bg-[#3C3C40] text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-[#222226] shadow-sm flex justify-between items-center w-full px-4 md:px-6 h-16 md:h-20 z-50 flex-shrink-0 transition-colors duration-500">
          <div className="flex items-center">
            <Link to="/app" className="flex items-center hover:opacity-90 mt-1 md:mt-2 ml-1 md:ml-2">
              <img 
                src={isDarkMode ? logoOscuro : logoClaro} 
                alt="SafeWalk U Logo" 
                className="h-[50px] md:h-[75px] w-auto object-contain scale-110 md:scale-150 origin-left drop-shadow-sm transition-all duration-300"
              />
            </Link>
          </div>
          
          {/* Navegación central (Desktop) */}
          <nav className="hidden md:flex items-center bg-slate-100/80 dark:bg-[#2B2B2F]/50 p-1 rounded-2xl border border-slate-200/50 dark:border-[#4A4A50]/50 backdrop-blur-md">
            {studentLinks.map((link) => {
              const active = !link.isAction && (location.pathname === link.path || (link.path === '/app' && location.pathname === '/resumen-reporte'));
              const className = `flex min-h-11 items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                link.highlight 
                  ? 'bg-red-500 text-white shadow-sm hover:bg-red-600' 
                  : active 
                    ? 'bg-white dark:bg-slate-700 text-purple-900 dark:text-purple-300 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`;

              const innerContent = (
                <>
                  <span className={`material-symbols-outlined text-[16px] ${link.highlight && 'animate-pulse'}`}>{link.icon}</span>
                  <span>{link.label}</span>
                </>
              );

              if (link.isAction) {
                return (
                  <button 
                    key={link.label} 
                    onClick={(e) => { 
                      if (location.pathname !== '/app') navigate('/app'); 
                      if (link.onClick) link.onClick(e); 
                    }} 
                    className={className}
                  >
                    {innerContent}
                  </button>
                );
              }

              return (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={link.onClick}
                  className={className}
                >
                  {innerContent}
                </Link>
              );
            })}
          </nav>
          
          <div className="flex items-center gap-2 md:gap-3">
            {canSwitchRole && (
              <button
                onClick={handleSwitchRole}
                disabled={isSwitchingRole}
                aria-label="Cambiar a modo administrador"
                className="flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg bg-purple-50 px-2 text-xs font-bold text-purple-900 transition-colors hover:bg-purple-100 disabled:opacity-60 dark:bg-purple-500/10 dark:text-purple-300"
              >
                <span className={`material-symbols-outlined text-[19px] ${isSwitchingRole ? 'animate-spin' : ''}`}>
                  {isSwitchingRole ? 'progress_activity' : 'admin_panel_settings'}
                </span>
                <span className="hidden lg:inline">Administrar</span>
              </button>
            )}
            <button 
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
              className="material-symbols-outlined flex h-11 w-11 items-center justify-center text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-all text-[20px] md:text-[22px]"
            >
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </button>
            <button 
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="min-h-11 min-w-11 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/20 px-2 md:px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Área del Cuerpo: Panel lateral + Mapa */}
        <main className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden min-h-0 w-full relative">
          
          {/* Panel Lateral Izquierdo */}
          <aside className={`
            bg-white dark:bg-[#3C3C40] border-r border-slate-200 dark:border-[#222226] overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0 z-20 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.1)] relative transition-colors duration-500
            ${isPerfilRoute
              ? 'w-full h-full md:w-full'
              : 'w-full h-[60%] md:h-full md:w-[38%] lg:w-[420px] rounded-t-3xl md:rounded-t-none md:rounded-tr-3xl'
            }
          `}>
            <div className="flex-1 p-5 md:p-6 pb-[100px] md:pb-6">
              <Outlet />
            </div>
          </aside>

          {/* Panel Derecho: Mapa — oculto en /perfil */}
          {!isPerfilRoute && (
            <section className="w-full h-[40%] md:h-full flex-1 relative bg-slate-100 dark:bg-[#3C3C40] overflow-hidden z-10 transition-colors duration-500">
              <MapaInteractivo 
                centro={mapConfig.centro}
                zoom={mapConfig.zoom}
                markers={mapConfig.markers}
                circle={mapConfig.circle}
                polyline={mapConfig.polyline}
                isDarkMode={isDarkMode}
              />
            </section>
          )}
        </main>

        {/* Tabbar inferior para móviles con soporte para Safe Area (iPhone) */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] bg-white dark:bg-[#2B2B2F] border-t border-slate-200 dark:border-[#4A4A50] md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors">
          {studentLinks.map((link) => {
            const active = !link.isAction && location.pathname === link.path;
            
            const innerContent = (
              <>
                <span className="material-symbols-outlined text-[18px] sm:text-[20px]">{link.icon}</span>
                <span className="text-[9px] sm:text-[10px] font-semibold mt-0.5 truncate w-full text-center">{link.label}</span>
              </>
            );

            const className = `flex flex-col items-center justify-center py-1.5 px-0.5 flex-1 max-w-[65px] rounded-xl transition-all ${
              link.highlight
                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                : active 
                  ? 'bg-purple-50 dark:bg-[#3C3C40] text-purple-900 dark:text-[#E0E0E5] font-bold' 
                  : 'text-slate-500 dark:text-[#808085]'
            }`;

            if (link.isAction) {
              return (
                <button 
                  key={link.label}
                  onClick={(e) => { 
                    if (location.pathname !== '/app') navigate('/app'); 
                    if (link.onClick) link.onClick(e); 
                  }} 
                  className={className}
                >
                  {innerContent}
                </button>
              );
            }

            return (
              <Link 
                key={link.label}
                to={link.path}
                onClick={link.onClick}
                className={className}
              >
                {innerContent}
              </Link>
            );
          })}
        </nav>

      </div>
    </MapContext.Provider>
  );
}
