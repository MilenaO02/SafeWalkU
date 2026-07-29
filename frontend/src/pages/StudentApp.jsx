import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuscadorPrincipal from '../components/BuscadorPrincipal';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';

export default function StudentApp() {
  const navigate = useNavigate();
  const { setMapConfig } = useMapConfig();
  const [zonasRiesgo, setZonasRiesgo] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoError, setGeoError] = useState(null);
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [routeSummary, setRouteSummary] = useState(null);
  const [routeStatus, setRouteStatus] = useState('idle');
  const watchIdRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const requestGps = () => {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      setGeoError('Este navegador no ofrece geolocalización. Ingresa las coordenadas manualmente.');
      return;
    }
    setGeoStatus('requesting');
    setGeoError(null);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const next = [position.coords.latitude, position.coords.longitude];
        setUserPos(next);
        setGeoStatus('gps');
        setMapConfig((previous) => ({
          ...previous,
          centro: next,
          zoom: 16,
          markers: [
            ...previous.markers.filter((marker) => marker.kind !== 'user'),
            { position: next, kind: 'user', title: 'Tu ubicación', desc: 'Ubicación GPS actual' }
          ]
        }));
      },
      (error) => {
        setGeoStatus('denied');
        setGeoError(error.code === error.PERMISSION_DENIED
          ? 'Permiso de ubicación rechazado. Puedes ingresar las coordenadas manualmente.'
          : 'No fue posible obtener una ubicación precisa. Intenta nuevamente o usa el modo manual.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  };

  const applyManualLocation = () => {
    const lat = Number(manualLocation.lat);
    const lng = Number(manualLocation.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setGeoError('Ingresa una latitud entre -90 y 90 y una longitud entre -180 y 180.');
      return;
    }
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserPos([lat, lng]);
    setGeoStatus('manual');
    setGeoError(null);
    setMapConfig((previous) => ({
      ...previous,
      centro: [lat, lng],
      zoom: 16,
      markers: [
        ...previous.markers.filter((marker) => marker.kind !== 'user'),
        { position: [lat, lng], kind: 'user', title: 'Tu ubicación', desc: 'Ubicación manual seleccionada' }
      ]
    }));
  };

  // Fetch zonas de riesgo
  useEffect(() => {
    const fetchZonas = async () => {
      try {
        const json = await request('/reports/zonas/riesgo?ciudad=Loja');
        if (json.success && json.data) setZonasRiesgo(json.data);
      } catch (e) {
        setGeoError(e instanceof Error ? e.message : 'No fue posible cargar las zonas de riesgo.');
      }
    };
    fetchZonas();
  }, []);

  const handleDestinoSelect = (destino) => {
    if (!destino) return;
    const lat = Number(destino.latitud);
    const lng = Number(destino.longitud);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    setMapConfig((prev) => ({
      ...prev,
      centro: [lat, lng],
      zoom: 17,
      markers: [
        ...prev.markers.filter((m) => m.title !== destino.nombre && m.title !== 'Tu ubicación'),
        { position: [lat, lng], title: destino.nombre, desc: destino.direccion }
      ]
    }));
  };

  const handleTrazarRuta = async (destino) => {
    if (!userPos) {
      setGeoError('Selecciona tu ubicación mediante GPS o coordenadas manuales antes de trazar.');
      return;
    }
    try {
      setRouteStatus('loading');
      setGeoError(null);
      const [lat, lng] = userPos;
      const isRegisteredDestination = Number.isInteger(Number(destino.id_ubicacion))
        && Number(destino.id_ubicacion) > 0
        && !destino.place_id;

      const params = new URLSearchParams({
        origen_lat: String(lat),
        origen_lng: String(lng)
      });

      if (isRegisteredDestination) {
        params.set('destino_id', String(destino.id_ubicacion));
      } else {
        const destLat = Number(destino.latitud);
        const destLng = Number(destino.longitud);
        if (!Number.isFinite(destLat) || destLat < -90 || destLat > 90
          || !Number.isFinite(destLng) || destLng < -180 || destLng > 180) {
          throw new Error('El destino no tiene coordenadas válidas.');
        }
        params.set('destino_lat', String(destLat));
        params.set('destino_lng', String(destLng));
        params.set('destino_nombre', destino.nombre || 'Destino');
        params.set('destino_direccion', destino.direccion || '');
        if (destino.place_id) params.set('place_id', destino.place_id);
      }

      const json = await request("/routes/trazar?" + params.toString());
      if (!json.success) throw new Error(json.message || 'No fue posible calcular la ruta.');
      const coordinates = Array.isArray(json.data.coordenadas)
        ? json.data.coordenadas.filter((point) => Array.isArray(point)
          && point.length >= 2
          && Number.isFinite(Number(point[0]))
          && Number.isFinite(Number(point[1])))
        : [];
      if (coordinates.length < 2) throw new Error('La API no devolvió una geometría de ruta válida.');

      setRouteSummary(json.data);
      const destLat = Number(destino.latitud);
      const destLng = Number(destino.longitud);
      setMapConfig((prev) => ({
        ...prev,
        polyline: coordinates,
        centro: coordinates[Math.floor(coordinates.length / 2)] || [lat, lng],
        zoom: 16,
        markers: [
          ...prev.markers.filter((m) => m.title !== destino.nombre && m.kind !== 'user'),
          { position: [lat, lng], kind: 'user', title: 'Tu ubicación', desc: 'Punto desde el que solicitaste la ruta' },
          ...(Number.isFinite(destLat) && Number.isFinite(destLng)
            ? [{ position: [destLat, destLng], title: destino.nombre, desc: destino.direccion }]
            : [])
        ]
      }));
    } catch (e) {
      setGeoError(e instanceof Error ? e.message : 'No fue posible trazar la ruta.');
    } finally {
      setRouteStatus('idle');
    }
  };

  const selectRouteOption = (option) => {
    const coordinates = Array.isArray(option?.coordenadas) ? option.coordenadas : [];
    if (coordinates.length < 2) return;
    setRouteSummary((current) => current ? { ...current, ...option, alternativas: current.alternativas } : current);
    setMapConfig((current) => ({ ...current, polyline: coordinates }));
  };

  return (
    <div className="space-y-6">

      {/* Buscador de Destinos */}
      <div className="bg-slate-50 dark:bg-[#2B2B2F] p-5 rounded-2xl border border-slate-100 dark:border-[#4A4A50] shadow-inner transition-colors duration-500">
        <BuscadorPrincipal
          onDestinoSelect={handleDestinoSelect}
          onTrazar={handleTrazarRuta}
          origin={userPos}
          tracing={routeStatus === 'loading'}
          originLabel={userPos
            ? `${geoStatus === 'manual' ? 'Ubicación manual' : 'Ubicación GPS'}: ${userPos[0].toFixed(5)}, ${userPos[1].toFixed(5)}`
            : 'Ubicación pendiente'}
        />
        {routeSummary && <section className="mt-3 space-y-3" aria-label="Comparación de rutas">
          <p className="rounded-xl bg-purple-50 p-3 text-xs font-semibold text-purple-950 dark:bg-purple-950/30 dark:text-purple-100">{routeSummary.mensaje_alternativas}</p>
          <div className="grid gap-3 xl:grid-cols-2">{(routeSummary.alternativas?.length ? routeSummary.alternativas : [routeSummary]).map((option, index) => {
            const selected = option.id_alternativa === routeSummary.id_alternativa;
            return <article key={option.id_alternativa || `route-${index}`} className={`rounded-2xl border p-4 text-xs ${selected ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30' : 'border-slate-200 bg-white dark:border-[#4A4A50] dark:bg-[#242428]'}`}>
              <div className="flex items-start justify-between gap-2"><div><h3 className="font-black text-purple-950 dark:text-purple-100">{option.etiqueta || (index === 0 ? 'Ruta recomendada' : 'Ruta alternativa')}</h3><p className="mt-1 text-slate-600 dark:text-slate-300">{option.distancia_m} m · {option.tiempo_estimado} min a pie</p></div><span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-purple-900">{option.puntuacion_seguridad ?? '—'} / 100</span></div>
              <p className="mt-2 font-bold">Nivel estimado: {option.nivel_seguridad_estimado || 'Sin clasificación'}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-slate-600 dark:text-slate-300">{(option.razones || []).slice(0, 3).map((reason) => <li key={reason}>{reason}</li>)}</ul>
              <button type="button" onClick={() => selectRouteOption(option)} disabled={selected} className="mt-3 min-h-11 w-full rounded-xl bg-purple-900 px-4 font-bold text-white disabled:bg-purple-200 disabled:text-purple-900">{selected ? 'Ruta visible' : 'Ver esta ruta'}</button>
              {selected && option.instrucciones?.length > 0 && <details className="mt-2"><summary className="cursor-pointer font-bold">Ver indicaciones ({option.instrucciones.length})</summary><ol className="mt-2 max-h-40 list-decimal space-y-1 overflow-y-auto pl-5">{option.instrucciones.map((step, stepIndex) => <li key={`${step.instruction}-${stepIndex}`}>{step.instruction} {step.distance_m > 0 ? `(${step.distance_m} m)` : ''}</li>)}</ol></details>}
              <p className="mt-2 text-[10px] text-slate-500">{option.aviso}</p>
            </article>;
          })}</div>
        </section>}
        <div className="mt-4 rounded-2xl border border-purple-100 dark:border-[#4A4A50] bg-white dark:bg-[#242428] p-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Tu ubicación se usa para calcular el trayecto mientras esta página está abierta. No se rastrea en segundo plano.
          </p>
          <button
            type="button"
            onClick={requestGps}
            disabled={geoStatus === 'requesting'}
            className="min-h-11 w-full rounded-xl bg-purple-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {geoStatus === 'requesting' ? 'Solicitando ubicación…' : 'Usar mi ubicación GPS'}
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              inputMode="decimal"
              aria-label="Latitud manual"
              placeholder="Latitud"
              value={manualLocation.lat}
              onChange={(event) => setManualLocation((current) => ({ ...current, lat: event.target.value }))}
              className="min-h-11 rounded-xl border border-slate-200 px-3 text-xs dark:bg-[#2B2B2F]"
            />
            <input
              inputMode="decimal"
              aria-label="Longitud manual"
              placeholder="Longitud"
              value={manualLocation.lng}
              onChange={(event) => setManualLocation((current) => ({ ...current, lng: event.target.value }))}
              className="min-h-11 rounded-xl border border-slate-200 px-3 text-xs dark:bg-[#2B2B2F]"
            />
            <button type="button" onClick={applyManualLocation} className="min-h-11 rounded-xl border border-purple-300 px-3 text-xs font-bold text-purple-900 dark:text-purple-300">
              Usar manual
            </button>
          </div>
          {geoError && <p role="alert" className="text-xs font-semibold text-amber-700 dark:text-amber-300">{geoError}</p>}
        </div>
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
                <p className="text-[10px] leading-tight text-slate-500 dark:text-[#A0A0A5] mt-0.5">Registra una alerta de emergencia para su seguimiento.</p>
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
                navigate('/detalle-zona', { state: { zona } });
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
