import React, { useState } from 'react';

const ALL_ALERTS = [
  { id: 1, type: 'SOS',     icon: 'emergency',     color: 'bg-red-50 border-red-200 text-red-700',      title: 'Botón de Pánico – María José Andrade',    detail: 'Facultad de Ingeniería',       time: 'Hace 2 min',  status: 'ACTIVA'   },
  { id: 2, type: 'SOS',     icon: 'emergency',     color: 'bg-red-50 border-red-200 text-red-700',      title: 'Botón de Pánico – Carlos Ramírez',        detail: 'Parqueadero Norte',            time: 'Hace 11 min', status: 'ATENDIDA' },
  { id: 3, type: 'REPORTE', icon: 'report_problem',color: 'bg-amber-50 border-amber-200 text-amber-700',title: 'Iluminación deficiente – Bellavista',      detail: 'Av. 6 de Diciembre',          time: 'Hace 1h',     status: 'PENDIENTE'},
  { id: 4, type: 'REPORTE', icon: 'report_problem',color: 'bg-amber-50 border-amber-200 text-amber-700',title: 'Actividad sospechosa – Biblioteca',        detail: 'Sector Biblioteca Central',    time: 'Hace 2h',     status: 'REVISIÓN' },
  { id: 5, type: 'SISTEMA', icon: 'info',           color: 'bg-blue-50 border-blue-200 text-blue-700',  title: 'Nuevo usuario registrado',                detail: 'martin@uide.edu.ec',          time: 'Hace 3h',     status: 'INFO'     },
  { id: 6, type: 'SISTEMA', icon: 'update',         color: 'bg-slate-50 border-slate-200 text-slate-600',title: 'Actualización de zona de riesgo',         detail: 'La Concepción – Loja',        time: 'Hace 5h',     status: 'INFO'     },
];

const TABS = ['Todas', 'SOS', 'REPORTE', 'SISTEMA'];

const STATUS_BADGE = {
  ACTIVA:    'bg-red-100 text-red-700 border-red-200',
  ATENDIDA:  'bg-green-100 text-green-700 border-green-200',
  PENDIENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  REVISIÓN:  'bg-blue-100 text-blue-700 border-blue-200',
  INFO:      'bg-slate-100 text-slate-600 border-slate-200',
};

export default function NotificationHistory() {
  const [activeTab, setActiveTab] = useState('Todas');
  const [search,    setSearch]    = useState('');

  const filtered = ALL_ALERTS.filter((a) => {
    const matchTab    = activeTab === 'Todas' || a.type === activeTab;
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                        a.detail.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-purple-950 tracking-tight">Reportes y Alertas</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Historial completo de notificaciones del campus.</p>
        </div>

        {/* Buscador */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 gap-2 shadow-sm w-full sm:w-60">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alerta..."
            className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none w-full placeholder-slate-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            No hay notificaciones para este filtro.
          </div>
        )}
        {filtered.map((a) => (
          <div
            key={a.id}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm ${a.color}`}
          >
            <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center shrink-0 shadow-sm border border-white/80">
              <span className="material-symbols-outlined text-[20px]">{a.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h5 className="text-xs font-bold truncate">{a.title}</h5>
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70 shrink-0">{a.time}</span>
              </div>
              <p className="text-[10px] font-medium mt-0.5 opacity-70">{a.detail}</p>
            </div>
            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${STATUS_BADGE[a.status]}`}>
              {a.status}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}