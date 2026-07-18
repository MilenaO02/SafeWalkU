import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuscadorPrincipal from '../components/BuscadorPrincipal';
import { useMapConfig } from '../layouts/MainLayout';
import { buildApiUrl } from '../services/api';

export default function StudentApp() {
  const navigate = useNavigate();
  const { mapConfig, setMapConfig, defaultMapConfig } = useMapConfig();
  const [zonasRiesgo, setZonasRiesgo] = useState([]);
  const [userPos, setUserPos] = useState(null);

  // GPS tracking
  useEffect(() => {
    let watchId;
    let initialCenterSet = false;

    const startWatching = () => {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setUserPos(newPos);
          setMapConfig((prev) => {
            const newConfig = {
              ...prev
            };
            
            // Centrar el mapa en la ubicación del usuario la primera vez
            if (!initialCenterSet) {
              newConfig.centro = newPos;
              newConfig.zoom = 16;
              initialCenterSet = true;
            }
            
            return newConfig;
          });
        },
        (err) => console.warn("GPS no disponible:", err),
        { enableHighAccuracy: true }
      );
    };

    // Solicitar permiso e iniciar seguimiento inmediatamente
    startWatching();
    
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [setMapConfig]);

  // Fetch zonas de riesgo
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(buildApiUrl('/reports/zonas/riesgo?ciudad=Loja'), {
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
      const res = await fetch(buildApiUrl(`/rutas/trazar?origen_lat=${lat}&origen_lng=${lng}&destino_id=${destino.id_ubicacion}`), {
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
      <div className="bg-slate-50 dark:bg-[#2B2B2F] p-5 rounded-2xl border border-slate-100 dark:border-[#4A4A50] shadow-inner transition-colors duration-500">
        <BuscadorPrincipal onTrazar={handleTrazarRuta} />
      </div>

      {/* Herramientas de Acompañamiento */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 dark:text-[#A0A0A5] tracking-wider uppercase">Herramientas de Seguridad</h3>
        <div className="grid grid-cols-2 gap-3">
          
          <button 
            onClick={() => navigate('/reportar')} 
            className="group p-4 rounded-2xl border border-slate-200 dark:border-[#4A4A50] bg-white dark:bg-[#2B2B2F] hover:border-amber-300 dark:hover:border-[#5C5C60] hover:bg-amber-50/40 dark:hover:bg-[#3C3C40] transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col gap-3"
          >
            <div className="p-2.5 rounded-xl shadow-sm bg-amber-50 dark:bg-[#3C3C40] text-amber-800 dark:text-[#E0E0E5] group-hover:bg-amber-500 dark:group-hover:bg-[#4A4A50] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px] block font-bold">report_problem</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 tracking-wide">Reportar Incidente</h3>
              <p className="text-[10px] leading-tight text-slate-500 dark:text-[#A0A0A5] mt-1">Informa alertas en vivo.</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/contactos')} 
            className="group p-4 rounded-2xl border border-slate-200 dark:border-[#4A4A50] bg-white dark:bg-[#2B2B2F] hover:border-blue-300 dark:hover:border-[#5C5C60] hover:bg-blue-50/40 dark:hover:bg-[#3C3C40] transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex flex-col gap-3"
          >
            <div className="p-2.5 rounded-xl shadow-sm bg-blue-50 dark:bg-[#3C3C40] text-blue-800 dark:text-[#E0E0E5] group-hover:bg-blue-600 dark:group-hover:bg-[#4A4A50] group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-[20px] block font-bold">contact_phone</span>
            </div>
            <div>
              <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 tracking-wide">Contactos de Apoyo</h3>
              <p className="text-[10px] leading-tight text-slate-500 dark:text-[#A0A0A5] mt-1">Policía, bomberos y más.</p>
            </div>
          </button>

          <button 
            onClick={() => navigate('/sos')} 
            className="col-span-2 group p-4 rounded-2xl border border-red-100 dark:border-[#4A4A50] bg-red-50/40 dark:bg-[#2B2B2F] hover:bg-red-50 dark:hover:bg-[#3C3C40] hover:border-red-300 dark:hover:border-[#5C5C60] transition-all text-left shadow-sm hover:shadow-md cursor-pointer flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-600 dark:bg-red-600/90 text-white rounded-xl shadow-md animate-pulse">
                <span className="material-symbols-outlined text-[20px] block font-bold">emergency</span>
              </div>
              <div>
                <h3 className="font-bold text-xs text-red-650 dark:text-red-400 tracking-wide">SOS Emergencia</h3>
                <p className="text-[10px] leading-tight text-slate-500 dark:text-[#A0A0A5] mt-0.5">Alerta al centro UIDE y familiares.</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-slate-400 dark:text-[#A0A0A5] group-hover:translate-x-1 transition-transform">chevron_right</span>
          </button>

        </div>
      </section>

      {/* Zonas de Riesgo Críticas */}
      <section className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-[11px] font-bold text-slate-700 dark:text-[#A0A0A5] uppercase tracking-wider">Zonas de Riesgo Activas (Loja)</h3>
          <span className="text-[9px] text-red-600 dark:text-red-400 font-extrabold px-2.5 py-0.5 bg-red-100/80 dark:bg-red-500/10 rounded-full border border-red-200/50 dark:border-red-500/20">{zonasRiesgo.length} ACTIVAS</span>
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
              className="p-3.5 bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-2xl flex gap-3 items-start shadow-sm hover:shadow-md cursor-pointer hover:border-purple-300 dark:hover:border-[#5C5C60] transition-all"
            >
              <span className={`material-symbols-outlined text-[22px] mt-0.5 p-1.5 rounded-xl border ${zona.nivel_riesgo === 'ALTO' ? 'text-red-500 dark:text-red-400 bg-red-50 dark:bg-[#3C3C40] border-red-100 dark:border-red-500/20' : 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-[#3C3C40] border-amber-100 dark:border-amber-500/20'}`}>
                {zona.nivel_riesgo === 'ALTO' ? 'warning' : 'visibility'}
              </span>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-[#E0E0E5]">{zona.ubicacion_nombre}</h4>
                <p className="text-[10px] text-slate-500 dark:text-[#A0A0A5] mt-1">{zona.descripcion}</p>
              </div>
            </div>
          ))}

          {zonasRiesgo.length === 0 && (
             <div className="p-3.5 bg-green-50 dark:bg-[#2B2B2F] border border-green-100 dark:border-[#4A4A50] rounded-2xl flex gap-3 items-center shadow-sm">
             <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
             <p className="text-xs text-green-800 dark:text-[#E0E0E5] font-medium">No hay zonas de riesgo activas en Loja en este momento.</p>
           </div>
          )}

        </div>
      </section>

    </div>
  );
}