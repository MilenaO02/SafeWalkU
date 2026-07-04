import React, { useState } from 'react';

// Sólo alertas del Botón de Pánico (emergencias externas)
const PANIC_ALERTS = [
  {
    id: 1,
    user:  'María José Andrade',
    zone:  'Facultad de Ingeniería – Edificio A',
    time:  'Hace 2 min',
    coords: 'Lat: -3.982, Lng: -79.201',
    status: 'ACTIVA',
  },
  {
    id: 2,
    user:  'Carlos Ramírez',
    zone:  'Parqueadero Norte – Zona B',
    time:  'Hace 11 min',
    coords: 'Lat: -3.984, Lng: -79.203',
    status: 'ACTIVA',
  },
  {
    id: 3,
    user:  'Luisa Fernanda Mora',
    zone:  'Biblioteca Central – Salida lateral',
    time:  'Hace 28 min',
    coords: 'Lat: -3.981, Lng: -79.200',
    status: 'ATENDIDA',
  },
];

const METRICS = [
  { icon: 'description',  bg: 'bg-purple-50 text-purple-900', label: 'Reportes Totales',     value: 128,  trend: '+12%', up: true  },
  { icon: 'emergency',    bg: 'bg-red-50   text-red-700',     label: 'Botones SOS Activos',  value: 15,   trend: 'Hoy',  up: false },
  { icon: 'route',        bg: 'bg-amber-50 text-amber-800',   label: 'Rutas de Riesgo',      value: 24,   trend: '+5%',  up: false },
  { icon: 'group',        bg: 'bg-blue-50  text-blue-800',    label: 'Usuarios Registrados', value: 342,  trend: '+28',  up: true  },
];

export default function AdminDashboardContent() {
  const [dispatchedIds, setDispatchedIds] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleDispatch = (id, user) => {
    setDispatchedIds((prev) => [...prev, id]);
    alert(`✅ Patrulla despachada para: ${user}`);
  };

  const unread = PANIC_ALERTS.filter((a) => a.status === 'ACTIVA' && !dispatchedIds.includes(a.id)).length;

  return (
    <div className="space-y-8 relative">

      {/* Header con notificaciones */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-purple-950 tracking-tight">Dashboard General</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Bienvenido de nuevo, <span className="text-purple-950 font-bold">Administrador Central</span>.
          </p>
        </div>

        {/* Campana de notificaciones */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-slate-600 text-[22px]">notifications</span>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow">
                {unread}
              </span>
            )}
          </button>

          {/* Dropdown de notificaciones */}
          {notifOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Alertas SOS Activas</span>
                <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {PANIC_ALERTS.filter((a) => a.status === 'ACTIVA').map((a) => (
                  <div key={a.id} className="px-4 py-3 hover:bg-red-50/30 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-red-600 text-[16px] mt-0.5 shrink-0">emergency</span>
                      <div>
                        <p className="text-xs font-bold text-red-700">{a.user}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{a.zone} · {a.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {PANIC_ALERTS.filter((a) => a.status === 'ACTIVA').length === 0 && (
                  <div className="px-4 py-4 text-center text-xs text-slate-400 font-medium">Sin alertas SOS activas</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Métricas */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`material-symbols-outlined p-2 rounded-xl text-[20px] ${m.bg}`}>{m.icon}</span>
              <span className={`text-[10px] font-black flex items-center gap-0.5 ${m.up ? 'text-green-600' : m.label.includes('SOS') ? 'text-slate-500' : 'text-red-500'}`}>
                {m.up && <span className="material-symbols-outlined text-[12px]">trending_up</span>}
                {m.trend}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold">{m.label}</p>
            <p className="text-2xl font-black text-purple-950 mt-1">{m.value}</p>
          </div>
        ))}
      </section>

      {/* Alertas SOS – solo Botón de Pánico */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-[20px]">emergency</span>
            <h4 className="text-sm font-black text-slate-900">Alertas de Botón de Pánico (SOS)</h4>
          </div>
          <span className="text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200/60 px-2.5 py-0.5 rounded-full">
            {PANIC_ALERTS.filter((a) => a.status === 'ACTIVA').length} ACTIVAS
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {PANIC_ALERTS.map((alert) => {
            const dispatched = dispatchedIds.includes(alert.id);
            const isActive   = alert.status === 'ACTIVA';

            return (
              <div
                key={alert.id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  isActive && !dispatched ? 'bg-red-50/30 hover:bg-red-50/60' : 'bg-slate-50/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isActive && !dispatched ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  <span className="material-symbols-outlined text-[18px]">emergency</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h5 className="text-xs font-bold text-slate-900 truncate">{alert.user}</h5>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-2">{alert.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{alert.zone}</p>
                  <p className="text-[9px] text-slate-400 font-medium">{alert.coords}</p>
                </div>

                {isActive ? (
                  <button
                    disabled={dispatched}
                    onClick={() => handleDispatch(alert.id, alert.user)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                      dispatched
                        ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {dispatched ? '✓ Despachado' : 'Despachar'}
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 shrink-0">
                    Atendida
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Gráfico Pie CSS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h4 className="text-sm font-black text-purple-950 w-full mb-5">Reportes por Estado</h4>
          <div className="relative w-40 h-40 mb-6">
            <div
              className="w-full h-full rounded-full"
              style={{
                background: 'conic-gradient(#4a208c 0% 35%, #94b2fe 35% 62%, #dae2ff 62% 100%)',
                transition: 'all 1s ease-out',
              }}
            />
            <div className="absolute inset-4 bg-white rounded-full flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl font-black text-purple-950">128</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
            </div>
          </div>
          <div className="w-full space-y-2">
            {[['#4a208c','Resueltos','35%'],['#94b2fe','Pendientes','37%'],['#dae2ff','En revisión','27%']].map(([c,l,v]) => (
              <div key={l} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                  <span className="text-slate-500">{l}</span>
                </div>
                <span className="font-bold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mini mapa estático */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative group min-h-[200px]">
          <img
            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-300 absolute inset-0"
            alt="Mapa del campus universitario"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKYtZqgFTkKMAKW_kRTK5RytjJpjGGK4PIOcJEr0dKlHwvpFbRx5ceK0YIu0hwkRg9jgoLKE2xTAlTjlB9R-I_y3iZYCwuLN2pHzP-JaWSxlV3OhIdkzoKTACYCwagf_1lvw3LJkNa7AbppkpQ69LkNEnvOfpb7-l4qcqeEIhLkPn1WdGOoG0LhaNI_u2z3F5VhgPL7S5UR4JmgnR5rDqYnZ-_kdQRQh4fEA6OPDCKdfTLkPPrJSVrvofG_TiDOBivWURFxWv0af0"
          />
          <div className="relative z-10 flex flex-col justify-end h-full p-5">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl border border-slate-200 inline-block self-start max-w-xs shadow-lg">
              <h5 className="text-sm font-black text-purple-950 mb-1">Mapa en Tiempo Real</h5>
              <p className="text-[11px] text-slate-500 font-medium">
                12 SafeWalks activos en el campus principal.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}