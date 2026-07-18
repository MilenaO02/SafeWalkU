import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfig } from '../layouts/MainLayout';

export default function DetalleZonaRiesgo() {
  const navigate = useNavigate();
  const { setMapConfig } = useMapConfig();

  // Coordenadas específicas de la zona Bellavista - Av. 6 de Diciembre
  const posicionBellavista = [-3.9835, -79.2028];

  useEffect(() => {
    setMapConfig({
      centro: posicionBellavista,
      zoom: 17,
      markers: [
        {
          position: posicionBellavista,
          title: '⚠️ Punto Crítico – Bellavista',
          desc: 'Zona de alto riesgo. 12 reportes en los últimos 30 días.',
        },
      ],
      circle: {
        center: posicionBellavista,
        radius: 120,
        color: '#ba1a1a',
      },
    });
  }, [setMapConfig]);

  const handleReportar = () => navigate('/reportar');
  const handleEvitar   = () => {
    alert('Zona Bellavista marcada como "Evitar" en tu configuración de rutas.');
  };

  const stats = [
    { icon: 'warning',   color: 'text-red-600 bg-red-50 border-red-100',    label: 'Tipo de Incidente', value: 'Robo a transeúntes' },
    { icon: 'analytics', color: 'text-blue-700 bg-blue-50 border-blue-100',  label: 'Actividad Reciente', value: '12 reportes / 30 días' },
    { icon: 'schedule',  color: 'text-amber-700 bg-amber-50 border-amber-100', label: 'Horario Crítico',  value: 'Después de las 18:00' },
    { icon: 'visibility_off', color: 'text-slate-600 bg-slate-50 border-slate-200', label: 'Iluminación', value: 'Deficiente – callejones oscuros' },
  ];

  return (
    <div className="space-y-5 flex flex-col h-full">

      {/* Volver */}
      <button
        onClick={() => navigate('/app')}
        className="text-xs font-bold text-purple-900 hover:text-purple-950 flex items-center gap-1.5 cursor-pointer self-start"
      >
        <span className="material-symbols-outlined text-[16px] font-bold">arrow_back</span>
        Volver al Inicio
      </button>

      {/* Encabezado de Zona */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-[11px] border border-red-200/60">
          <span className="material-symbols-outlined text-[14px]">report</span>
          Alto Riesgo
        </span>
        <h2 className="text-xl font-black text-purple-950 tracking-tight">Zona Bellavista</h2>
        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
          <span className="material-symbols-outlined text-purple-900 text-[15px]">location_on</span>
          Av. 6 de Diciembre y Granados, Quito
        </p>
      </div>

      {/* Métricas de Riesgo */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Diagnóstico</h3>
        <div className="space-y-2">
          {stats.map((s, i) => (
            <div key={i} className={`flex items-start gap-3 p-3.5 rounded-2xl border ${s.color}`}>
              <span className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0`}>{s.icon}</span>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{s.label}</p>
                <p className="text-xs font-bold mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Descripción */}
      <section className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Zona con baja iluminación y presencia de callejones estrechos. 
          Los incidentes ocurren principalmente entre las 18:00 y las 22:00.
          <span className="text-red-600 font-bold"> Se recomienda evitar circular solo después de las 18:00.</span>
        </p>
      </section>

      {/* Evidencia visual */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Evidencia Reciente</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt="Calle oscura zona Bellavista"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcjae4VIDf9cm_TuN7rhHy1lfGkWfvY_nzFYtxMTLY4WXZVInzuNs3VKW0Vgs8aRIgcKeHYRu4ADXPsBlNo4K94ctuID9rMY5LH42U_nSEeMfVXMFOj6nxFQXP-aUOEtlPlEhnD4kLvhV6ssDMUG0KjlXxXQgt2KMWNiEroHpXBUBsQ2Shq7PrLw-x0Nax9iSuuFb5J_A-aLA227u6hfGqX47okaYnF-JJ2caw1v_YrijEB7lxOwLxYztzjyxIsPvUG3Q2rX1VXGM"
            />
          </div>
          <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative group">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              alt="Pasaje estrecho zona universitaria"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqrmThnV-ka57GZpzZ36zPVEEO0h6Qe-F-pvy1EupCm2EQg8VH5oxniaeGa5QylPwdgoD1negqP29g0w238CYhHg2iZYczR7Z9la7RwHlmlXBQf9hUFKQY2mxz1IwD9AcTqZPx0WLEtTWvG5Ih1A3rNOb-IaKwVundUdkooIfR_PAw77DpNF1rbMBBz0gd6OMS6QP73eXVZa0o8psWA9m4JJk9KRL2L2RxVR8J4Pnv98TVstQvfo400aa6aOiMnB5Q2tv99mTw"
            />
          </div>
        </div>
      </section>

      {/* Acciones */}
      <div className="mt-auto space-y-2 pt-3 border-t border-slate-100">
        <button
          onClick={handleReportar}
          className="w-full bg-purple-900 hover:bg-purple-950 text-white font-bold py-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px]">report_problem</span>
          Reportar nuevo incidente
        </button>
        <button
          onClick={handleEvitar}
          className="w-full border-2 border-purple-900 text-purple-900 font-bold py-3 rounded-2xl transition-all hover:bg-purple-50 active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
        >
          Evitar esta zona
        </button>
      </div>

    </div>
  );
}