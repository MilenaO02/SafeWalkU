import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BuscadorPrincipal from '../components/BuscadorPrincipal';
import { useMapConfig } from '../layouts/MainLayout';

export default function StudentApp() {
  const navigate = useNavigate();
  const { setMapConfig, defaultMapConfig } = useMapConfig();

  // Resetear el mapa a la vista por defecto (UIDE Loja) al cargar la página de inicio
  useEffect(() => {
    setMapConfig(defaultMapConfig);
  }, [setMapConfig]);

  return (
    <div className="space-y-6">
      
      {/* Buscador de Destinos */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
        <BuscadorPrincipal />
      </div>

      {/* Herramientas de Acompañamiento */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Herramientas de Seguridad</h3>
        <div className="grid grid-cols-2 gap-3">
          
          <button 
            onClick={() => navigate('/reportar')} 
            className="group p-4 rounded-2xl border border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col gap-3"
          >
            <div className="p-2.5 rounded-xl shadow-sm bg-amber-50 text-amber-800 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px] block font-bold">report_problem</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 tracking-wide">Reportar Incidente</h3>
              <p className="text-[10px] leading-tight text-slate-500 mt-1">Informa alertas en vivo.</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/contactos')} 
            className="group p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col gap-3"
          >
            <div className="p-2.5 rounded-xl shadow-sm bg-blue-50 text-blue-800 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px] block font-bold">contact_phone</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 tracking-wide">Contactos de Apoyo</h3>
              <p className="text-[10px] leading-tight text-slate-500 mt-1">Policía, bomberos y más.</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/sos')} 
            className="col-span-2 group p-4 rounded-2xl border border-red-100 bg-red-50/40 hover:bg-red-50 hover:border-red-300 transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 text-white rounded-xl shadow-md animate-pulse">
                <span className="material-symbols-outlined text-[20px] block font-bold">emergency</span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-red-650 tracking-wide">SOS Emergencia</h3>
                <p className="text-[10px] leading-tight text-slate-500 mt-0.5">Alerta al centro UIDE y familiares.</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>

        </div>
      </section>

      {/* Zonas de Riesgo Críticas */}
      <section className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Zonas de Riesgo Activas</h3>
          <span className="text-[9px] text-red-600 font-extrabold px-2.5 py-0.5 bg-red-100/80 rounded-full border border-red-200/50">2 ACTIVAS</span>
        </div>
        <div className="space-y-2">
          
          <div 
            onClick={() => navigate('/detalle-zona')}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl flex gap-3 items-start shadow-sm hover:shadow-md cursor-pointer hover:border-purple-300 transition-all"
          >
            <span className="material-symbols-outlined text-red-500 text-[22px] mt-0.5 bg-red-50 p-1.5 rounded-xl border border-red-100">warning</span>
            <div>
              <h4 className="font-bold text-xs text-slate-900">Bellavista</h4>
              <p className="text-[10px] text-slate-500 mt-1">Robos reportados hace 20 min. Evitar pasajes oscuros.</p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/detalle-zona')}
            className="p-3.5 bg-white border border-slate-200 rounded-2xl flex gap-3 items-start shadow-sm hover:shadow-md cursor-pointer hover:border-purple-300 transition-all"
          >
            <span className="material-symbols-outlined text-amber-500 text-[22px] mt-0.5 bg-amber-50 p-1.5 rounded-xl border border-amber-100">visibility</span>
            <div>
              <h4 className="font-bold text-xs text-slate-900">La Concepción</h4>
              <p className="text-[10px] text-slate-500 mt-1">Baja iluminación en paradero norte. Patrullaje solicitado.</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}