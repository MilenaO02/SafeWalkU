import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMapConfig } from '../context/map';

export default function DetalleZonaRiesgo() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const zone = state?.zona;

  useEffect(() => {
    if (!zone) return;
    const point = [Number(zone.latitud), Number(zone.longitud)];
    setMapConfig({ centro: point, zoom: 18, markers: [{ position: point, title: zone.ubicacion_nombre, desc: zone.descripcion }], circle: { center: point, radius: Number(zone.radio_metros) || 90, color: '#ef4444' } });
    return () => setMapConfig(defaultMapConfig);
  }, [zone, setMapConfig, defaultMapConfig]);

  if (!zone) return <div className="space-y-4"><p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">Selecciona una zona desde el inicio para consultar su detalle.</p><button onClick={() => navigate('/app')} className="min-h-11 rounded-xl bg-purple-900 px-5 text-xs font-bold text-white">Volver al mapa</button></div>;

  return <div className="space-y-5">
    <button onClick={() => navigate('/app')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-purple-900"><span className="material-symbols-outlined">arrow_back</span>Volver al inicio</button>
    <div><span className={`inline-block rounded-full px-3 py-1 text-[10px] font-black ${zone.nivel_riesgo === 'ALTO' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>RIESGO {zone.nivel_riesgo}</span><h2 className="mt-3 text-xl font-black text-purple-950">{zone.ubicacion_nombre}</h2><p className="mt-1 text-xs text-slate-500">{zone.direccion}</p></div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-xs font-black uppercase text-slate-400">Reporte validado</h3><p className="mt-3 text-sm leading-relaxed text-slate-700">{zone.descripcion}</p><time className="mt-3 block text-xs text-slate-400">Registrado: {new Date(zone.fecha_reporte).toLocaleString()}</time></section>
    <p className="rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-600">Esta información proviene de un reporte validado. Evalúa las condiciones actuales del entorno y utiliza una ruta alternativa si percibes peligro.</p>
    <button onClick={() => navigate('/reportar')} className="min-h-11 w-full rounded-xl bg-purple-900 px-4 text-xs font-bold text-white">Reportar otro incidente</button>
  </div>;
}
