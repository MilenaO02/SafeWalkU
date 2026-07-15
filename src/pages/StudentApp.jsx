import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuscadorPrincipal from '../components/BuscadorPrincipal';
import { useMapConfig } from '../layouts/MainLayout';

export default function StudentApp() {
  const navigate = useNavigate();
  const { mapConfig, setMapConfig, defaultMapConfig } = useMapConfig();
  const [zonasRiesgo, setZonasRiesgo] = useState([]);
  const [userPos, setUserPos] = useState(null);

  // GPS tracking
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(newPos);
        setMapConfig((prev) => ({
          ...prev,
          markers: [
            ...prev.markers.filter(m => m.title !== 'Mi ubicación actual'),
            { position: newPos, title: 'Mi ubicación actual', desc: 'Precisión GPS' }
          ]
        }));
      },
      (err) => console.warn("GPS no disponible:", err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [setMapConfig]);

  // Fetch zonas de riesgo
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch('http://localhost:3000/api/reportes/zonas/riesgo?ciudad=Loja', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) setZonasRiesgo(json.data);
      } catch (e) {
        console.error("Error cargando zonas de riesgo", e);
      }
    };
    fetchZonas();
  }, []);

  const handleTrazarRuta = async (destino) => {
    try {
      const lat = userPos ? userPos[0] : -4.0327;
      const lng = userPos ? userPos[1] : -79.2024;
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/api/rutas/trazar?origen_lat=${lat}&origen_lng=${lng}&destino_id=${destino.id_ubicacion}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        setMapConfig(prev => ({
          ...prev,
          polyline: json.data.coordenadas,
          centro: json.data.coordenadas[1] || lat,
          zoom: 16,
          markers: [
            ...prev.markers.filter(m => m.title !== destino.nombre),
            { position: [Number(destino.latitud), Number(destino.longitud)], title: destino.nombre, desc: destino.direccion }
          ]
        }));
      }
    } catch (e) {
      console.error("Error al trazar la ruta", e);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Buscador de Destinos */}
      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
        <BuscadorPrincipal onTrazar={handleTrazarRuta} />
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
          <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Zonas de Riesgo Activas (Loja)</h3>
          <span className="text-[9px] text-red-600 font-extrabold px-2.5 py-0.5 bg-red-100/80 rounded-full border border-red-200/50">{zonasRiesgo.length} ACTIVAS</span>
        </div>
        <div className="space-y-2">
          
          {zonasRiesgo.map(zona => (
            <div 
              key={zona.id_reporte}
              onClick={() => {
                setMapConfig(prev => ({
                    ...prev,
                    centro: [Number(zona.latitud), Number(zona.longitud)],
                    zoom: 18,
                    circle: { center: [Number(zona.latitud), Number(zona.longitud)], radius: zona.radio_metros, color: '#ef4444' }
                }));
                navigate('/detalle-zona');
              }}
              className="p-3.5 bg-white border border-slate-200 rounded-2xl flex gap-3 items-start shadow-sm hover:shadow-md cursor-pointer hover:border-purple-300 transition-all"
            >
              <span className={`material-symbols-outlined text-[22px] mt-0.5 p-1.5 rounded-xl border ${zona.nivel_riesgo === 'ALTO' ? 'text-red-500 bg-red-50 border-red-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
                {zona.nivel_riesgo === 'ALTO' ? 'warning' : 'visibility'}
              </span>
              <div>
                <h4 className="font-bold text-xs text-slate-900">{zona.ubicacion_nombre}</h4>
                <p className="text-[10px] text-slate-500 mt-1">{zona.descripcion}</p>
              </div>
            </div>
          ))}

          {zonasRiesgo.length === 0 && (
             <div className="p-3.5 bg-green-50 border border-green-100 rounded-2xl flex gap-3 items-center shadow-sm">
             <span className="material-symbols-outlined text-green-600">check_circle</span>
             <p className="text-xs text-green-800 font-medium">No hay zonas de riesgo activas en Loja en este momento.</p>
           </div>
          )}

        </div>
      </section>

    </div>
  );
}