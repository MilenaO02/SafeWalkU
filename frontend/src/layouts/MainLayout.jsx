import React, { createContext, useState, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import MapaInteractivo from '../components/MapaInteractivo';

import { useAuth } from '../context/AuthContext';
import logoClaro from '../assets/icon_modoclaro.png';
import logoOscuro from '../assets/icon_modooscuro.png';

// Contexto para sincronizar el Mapa Interactivo en las vistas del estudiante
export const MapContext = createContext();
export const useMapConfig = () => useContext(MapContext);

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
  const { user, logout, showToast } = useAuth();

  const [mapConfig, setMapConfig] = useState(defaultMapConfig);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

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
  const handleCenterUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setMapConfig(prev => ({ ...prev, centro: [pos.coords.latitude, pos.coords.longitude], zoom: 17 }))
      );
    }
  };

  const handleCenterUni = () => {
    setMapConfig(prev => ({ ...prev, centro: defaultMapConfig.centro, zoom: 17 }));
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
              const className = `flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
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
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleDarkMode}
              className="material-symbols-outlined text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 p-1.5 md:p-2 rounded-full transition-all text-[20px] md:text-[22px]"
            >
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </button>
            <button className="material-symbols-outlined text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-white/10 p-1.5 md:p-2 rounded-full transition-all text-[20px] md:text-[22px]">notifications</button>
            <button 
              onClick={handleLogout}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 hover:bg-red-100/80 dark:hover:bg-red-500/20 px-2 md:px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
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
