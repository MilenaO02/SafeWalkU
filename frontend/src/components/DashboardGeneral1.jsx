import React, { useState } from 'react';

export default function DashboardGeneral() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex bg-slate-50 min-h-screen w-screen overflow-x-hidden antialiased font-sans text-slate-800">
      
      {/* SideNavBar Component */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col py-6 z-30 transition-all duration-300 ease-out">
        <div className="px-6 mb-10 flex items-center gap-3">
          <img
            alt="SafeWalk U Logo"
            className="w-10 h-10 object-contain rounded-md"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKrAo-b4zmb2SMUxTG7Amwg3Wwhhz_7n6ZBS0ysZaEUhfplm7ny3sY5f0Zq8rIxVGUtrwrpdJDgZien_fuS_mqeDKWmwoQBej6m9Zdx7eHH4jwcCyDizk4y6R0RXO7_eH5q3FmA_vAvsthzuc0QNfMS_-yt_O1SfNMUrmw9yM9gUBY9sfskTzflfzfyB9N23n0YCPdbNYL4V50pAng96POYBYo2hVfUQmkJWchGGTjkYdMxVL4IIkrEKH4qn57lOYt1_IXO760IMg"
          />
          <div>
            <h1 className="text-lg font-black text-purple-950 tracking-tight">
              SafeWalk Admin
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Universidad Internacional Del Ecuador
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {/* Dashboard: Active Link */}
          <a
            className="flex items-center gap-4 px-4 py-3 rounded-xl bg-purple-100 text-purple-950 border-l-4 border-purple-900 transition-all font-bold text-sm"
            href="#"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              dashboard
            </span>
            <span>Dashboard</span>
          </a>
          
          <a
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
            href="#"
          >
            <span className="material-symbols-outlined text-[20px]">directions_walk</span>
            <span>Active Walks</span>
          </a>
          
          <a
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
            href="#"
          >
            <span className="material-symbols-outlined text-[20px]">report_problem</span>
            <span>Reports</span>
          </a>
          
          <a
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
            href="#"
          >
            <span className="material-symbols-outlined text-[20px]">analytics</span>
            <span>Analytics</span>
          </a>
          
          <a
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all font-bold text-sm"
            href="#"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </a>
        </nav>

        <div className="px-3 mt-auto">
          <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-bold text-sm transition-all">
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 p-8 max-w-7xl">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-purple-950 tracking-tight">
              Dashboard General
            </h2>
            <p className="text-slate-500 text-sm font-medium mt-0.5">
              Bienvenido de nuevo, Administrador Central.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                search
              </span>
              <input
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-200 outline-none transition-all w-64 text-xs font-medium"
                placeholder="Buscar reportes o usuarios..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 relative transition-colors">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-600 rounded-full" />
            </button>
            
            <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden shadow-sm">
              <img
                className="w-full h-full object-cover"
                alt="Admin Headshot"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1R6VWK6Xq_lIC_D1CCzSFZ5aNxxdaaA7dlWjbWM-NPmXIGeg3N4Czbtf1JgOX5yPu-cyJQp87KmihPx2VL7zhbiSqv7nmX3s_Ib32JQ96TZz6hIQFQ8g7lh2JjyeJ0PI41Bkf-i1HwLTY1u8_3h6H8IVWb5wLM2y8wvOHCg9dQulb49nbFJlub-GP0uVrBsLQgTaeWpu9PD4BFxuhxja02joMxnFsofi2Z-Xpw0O2JHcf6T3NX3ty48GSnsxW1spScQNK_kpMLgc"
              />
            </div>
          </div>
        </header>

        {/* Metrics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group">
            <div className="flex items-start justify-between mb-3">
              <span className="material-symbols-outlined text-purple-900 bg-purple-50 p-2.5 rounded-xl text-[22px]">
                description
              </span>
              <span className="text-emerald-600 text-xs font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-lg">
                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span> 
                +12%
              </span>
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Reportes Totales</p>
            <h3 className="font-black text-2xl text-purple-950 mt-1">128</h3>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group">
            <div className="flex items-start justify-between mb-3">
              <span className="material-symbols-outlined text-amber-600 bg-amber-50 p-2.5 rounded-xl text-[22px]">
                route
              </span>
              <span className="text-red-600 text-xs font-bold flex items-center bg-red-50 px-2 py-0.5 rounded-lg">
                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span> 
                +5%
              </span>
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Rutas de Riesgo</p>
            <h3 className="font-black text-2xl text-purple-950 mt-1">24</h3>
          </div>

          {/* Card 3 - Emergencias Activas */}
          <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ring-2 ring-red-600/10 group">
            <div className="flex items-start justify-between mb-3">
              <span className="material-symbols-outlined text-white bg-red-600 p-2.5 rounded-xl text-[22px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                emergency
              </span>
              <span className="text-red-700 bg-red-50 font-black text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-lg animate-pulse">
                Hoy
              </span>
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Emergencias Activas</p>
            <h3 className="font-black text-2xl text-red-600 mt-1">15</h3>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md group">
            <div className="flex items-start justify-between mb-3">
              <span className="material-symbols-outlined text-blue-600 bg-blue-50 p-2.5 rounded-xl text-[22px]">
                group
              </span>
              <span className="text-emerald-600 text-xs font-bold flex items-center bg-emerald-50 px-2 py-0.5 rounded-lg">
                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span> 
                +28
              </span>
            </div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-wider">Usuarios Registrados</p>
            <h3 className="font-black text-2xl text-purple-950 mt-1">342</h3>
          </div>
        </section>

        {/* Middle Section: Chart + Critical Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chart Widget */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-6">
              <h4 className="font-bold text-sm text-purple-950 uppercase tracking-wide">
                Reportes por Estado
              </h4>
              <span className="material-symbols-outlined text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                more_vert
              </span>
            </div>
            
            {/* Pie Chart Injected Container */}
            <div className="relative w-48 h-48 mb-6">
              <div 
                className="w-full h-full rounded-full" 
                style={{
                  background: 'conic-gradient(#4a208c 0% 35%, #94b2fe 35% 62%, #dae2ff 62% 100%)'
                }}
              />
              <div className="absolute inset-4 bg-white rounded-full flex flex-col justify-center items-center shadow-inner">
                <span className="text-2xl font-black text-purple-950">128</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
              </div>
            </div>

            {/* Chart Indicators */}
            <div className="w-full space-y-3 pt-2">
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-purple-900" />
                  <span className="text-xs font-medium text-slate-600">Resueltos</span>
                </div>
                <span className="text-xs font-bold text-slate-900">35%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-xs font-medium text-slate-600">Pendientes</span>
                </div>
                <span className="text-xs font-bold text-slate-900">37%</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-blue-100" />
                  <span className="text-xs font-medium text-slate-600">En revisión</span>
                </div>
                <span className="text-xs font-bold text-slate-900">27%</span>
              </div>
            </div>
          </div>

          {/* Critical Alerts List */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-bold text-sm text-purple-950 uppercase tracking-wide">
                Alertas Críticas Recientes
              </h4>
              <button className="text-purple-900 font-bold text-xs hover:underline transition-all">
                Ver todo
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Alert Item 1 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50/50 border border-red-100 transition-colors hover:bg-red-50">
                <div className="w-11 h-11 flex items-center justify-center bg-red-600 rounded-full text-white shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                    emergency
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs text-red-950 truncate">
                      Botón de Pánico Activado
                    </h5>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Hace 2 min
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Zona: Facultad de Ingeniería - Edificio B. Usuario: Juan Pérez.
                  </p>
                </div>
                <button className="px-3 py-2 bg-red-600 text-white font-bold text-xs rounded-xl hover:bg-red-700 transition-colors shrink-0 shadow-sm">
                  Despachar
                </button>
              </div>

              {/* Alert Item 2 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                <div className="w-11 h-11 flex items-center justify-center bg-amber-500 rounded-full text-white shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs text-slate-900 truncate">
                      Desvío de Ruta Detectado
                    </h5>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Hace 14 min
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Ruta: Residencia → Biblioteca. El usuario se ha alejado 200m.
                  </p>
                </div>
                <button className="px-3 py-2 border border-slate-200 text-slate-700 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shrink-0 shadow-sm">
                  Contactar
                </button>
              </div>

              {/* Alert Item 3 */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-slate-50">
                <div className="w-11 h-11 flex items-center justify-center bg-blue-600 rounded-full text-white shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h5 className="font-bold text-xs text-slate-900 truncate">
                      Reporte de Iluminación Deficiente
                    </h5>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Hace 45 min
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-normal">
                    Ubicación: Parqueadero Norte. Prioridad: Media.
                  </p>
                </div>
                <button className="px-3 py-2 border border-slate-200 text-slate-700 bg-white font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shrink-0 shadow-sm">
                  Revisar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Map Teaser */}
        <section className="mt-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm h-64 overflow-hidden relative group">
            <div className="absolute inset-0 opacity-40 group-hover:opacity-50 transition-opacity duration-300">
              <img
                className="w-full h-full object-cover"
                alt="Digital Map Canvas Teaser"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKYtZqgFTkKMAKW_kRTK5RytjJpjGGK4PIOcJEr0dKlHwvpFbRx5ceK0YIu0hwkRg9jgoLKE2xTAlTjlB9R-I_y3iZYCwuLN2pHzP-JaWSxlV3OhIdkzoKTACYCwagf_1lvw3LJkNa7AbppkpQ69LkNEnvOfpb7-l4qcqeEIhLkPn1WdGOoG0LhaNI_u2z3F5VhgPL7S5UR4JmgnR5rDqYnZ-_kdQRQh4fEA6OPDCKdfTLkPPrJSVrvofG_TiDOBivWURFxWv0af0"
              />
            </div>
            
            <div className="relative z-10 flex flex-col justify-end h-full p-6">
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl border border-slate-100 inline-block self-start max-w-sm shadow-md">
                <h5 className="font-black text-sm text-purple-950 uppercase tracking-wide mb-1">
                  Mapa en Tiempo Real
                </h5>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">
                  Hay 12 SafeWalks activos en este momento en el campus universitario.
                </p>
                <button className="mt-4 bg-purple-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-purple-950 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-sm">map</span>
                  Abrir Mapa de Seguridad
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}