import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BuscadorPrincipal from '../components/BuscadorPrincipal';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';
import { getGeolocationError, requestCurrentPosition, withUserLocationMarker } from '../utils/geolocation';

export default function StudentApp() {
  const navigate = useNavigate();
  const { setMapConfig } = useMapConfig();
  const [zonasRiesgo, setZonasRiesgo] = useState([]);
  const [permanentRiskZones, setPermanentRiskZones] = useState([]);
  const [visibleRiskLevels, setVisibleRiskLevels] = useState(['BAJO', 'MEDIO', 'ALTO', 'CRITICO']);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [geoError, setGeoError] = useState(null);
  const [manualLocation, setManualLocation] = useState({ lat: '', lng: '' });
  const [routeSummary, setRouteSummary] = useState(null);
  const [routeStatus, setRouteStatus] = useState('idle');
  const [selectedAlt, setSelectedAlt] = useState(0);
  const gpsRequestInFlightRef = useRef(false);
  const requestGps = () => {
    if (gpsRequestInFlightRef.current) return;
    if (!navigator.geolocation) {
      setGeoStatus('unavailable');
      setGeoError('Este navegador no permite acceder a la ubicación del dispositivo.');
      return;
    }
    if (!window.isSecureContext) {
      setGeoStatus('unavailable');
      setGeoError('La ubicación requiere una conexión segura HTTPS.');
      return;
    }
    gpsRequestInFlightRef.current = true;
    setGeoStatus('requesting');
    setGeoError(null);

    const applyPosition = (position) => {
      const next = [position.coords.latitude, position.coords.longitude];
      gpsRequestInFlightRef.current = false;
      setUserPos(next);
      setGeoStatus('gps');
      setGeoError(null);
      setMapConfig((previous) => withUserLocationMarker(previous, next));
    };

    const showError = (error) => {
      gpsRequestInFlightRef.current = false;
      const { status, message } = getGeolocationError(error);
      setGeoStatus(status);
      setGeoError(message);
    };

    // Esta llamada ocurre síncronamente dentro del clic. No se consulta
    // Permissions API antes: Safari/iOS puede perder el gesto de usuario.
    requestCurrentPosition({
      geolocation: navigator.geolocation,
      onPosition: applyPosition,
      onError: showError,
      onDiagnostic: (diagnostic) => {
        if (import.meta.env.DEV) console.info('[GPS]', diagnostic);
      }
    });
  };

  const applyManualLocation = () => {
    const lat = Number(manualLocation.lat);
    const lng = Number(manualLocation.lng);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      setGeoError('Ingresa una latitud entre -90 y 90 y una longitud entre -180 y 180.');
      return;
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
        const [json, permanent, heatmap] = await Promise.all([
          request('/reports/zonas/riesgo?ciudad=Loja'),
          request('/risk-zones?active=true'),
          request('/risk-zones/heatmap')
        ]);
        if (json.success && json.data) setZonasRiesgo(json.data);
        if (permanent.success && permanent.data) setPermanentRiskZones(permanent.data);
        if (heatmap.success && heatmap.data) setHeatmapPoints(heatmap.data);
      } catch (e) {
        setGeoError(e instanceof Error ? e.message : 'No fue posible cargar las zonas de riesgo.');
      }
    };
    fetchZonas();
  }, []);

  useEffect(() => {
    setMapConfig((previous) => ({
      ...previous,
      polygons: permanentRiskZones
        .filter((zone) => visibleRiskLevels.includes(zone.nivel_riesgo))
        .map((zone) => ({ ...zone })),
      heatmapPoints: showHeatmap ? heatmapPoints : []
    }));
  }, [permanentRiskZones, visibleRiskLevels, heatmapPoints, showHeatmap, setMapConfig]);

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
      const [originLat, originLng] = userPos;

      const params = new URLSearchParams({
        origen_lat: String(originLat),
        origen_lng: String(originLng),
      });

      if (destino.id_ubicacion != null) {
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
        if (destino.direccion) {
          params.set('destino_direccion', destino.direccion);
        }
        if (destino.place_id) {
          params.set('place_id', destino.place_id);
        }
      }

      const json = await request(`/routes/trazar?${params.toString()}`);

      if (!json?.success || !json?.data) {
        throw new Error(json?.message || 'No fue posible calcular la ruta peatonal.');
      }

      const routeData = json.data;
      setRouteSummary(routeData);
      setSelectedAlt(0);

      const polyline = json.data.coordenadas || json.data.coordinates || [];
      const destLat = Number(destino.latitud);
      const destLng = Number(destino.longitud);
      setMapConfig((prev) => ({
        ...prev,
        polyline,
        centro: polyline[Math.floor(polyline.length / 2)] || [originLat, originLng],
        zoom: 16,
        markers: [
          ...prev.markers.filter((m) => m.kind !== 'user' && m.kind !== 'destination'),
          { position: [originLat, originLng], kind: 'user', title: 'Tu ubicación', desc: 'Punto de inicio del recorrido' },
          { position: [destLat, destLng], kind: 'destination', title: destino.nombre, desc: destino.direccion }
        ]
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No fue posible obtener la ruta peatonal.';
      setGeoError(msg);
      setRouteSummary(null);
      setMapConfig((prev) => ({
        ...prev,
        polyline: null
      }));
    } finally {
      setRouteStatus('idle');
    }
  };

  const handleLimpiarRuta = () => {
    setRouteSummary(null);
    setSelectedAlt(0);
    setMapConfig((prev) => ({
      ...prev,
      polyline: null
    }));
  };

  const handleIniciarRuta = () => {
    if (!routeSummary || !userPos) return;
    const currentAlt = routeSummary.alternatives ? routeSummary.alternatives[selectedAlt] : routeSummary;

    const [originLat, originLng] = userPos;
    let destParams = '';
    
    if (currentAlt.destino?.place_id) {
      destParams = `&destination_place_id=${currentAlt.destino.place_id}&destination=${currentAlt.destino.latitud},${currentAlt.destino.longitud}`;
    } else if (currentAlt.destino) {
      destParams = `&destination=${currentAlt.destino.latitud},${currentAlt.destino.longitud}`;
    } else {
      // Fallback
      destParams = `&destination=${currentAlt.coordinates[currentAlt.coordinates.length - 1][0]},${currentAlt.coordinates[currentAlt.coordinates.length - 1][1]}`;
    }

    const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}${destParams}&travelmode=walking`;
    
    // Attempt native intent on mobile if we have navigator properties
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const summaryText = `Resumen de la ruta:\n\n` +
      `📍 Destino: ${currentAlt.destino?.nombre || currentAlt.nombre_ruta}\n` +
      `📏 Distancia: ${currentAlt.distance_m || currentAlt.distancia_m} m\n` +
      `⏱️ Duración: ${currentAlt.duration_min || currentAlt.tiempo_estimado} min\n` +
      `🛡️ Tipo de ruta: ${currentAlt.safety?.classification || 'Desconocido'}\n\n` +
      `Advertencias:\n` +
      (currentAlt.safety?.reasons?.map(r => `- ${r}`).join('\n') || '- Ruta trazada');

    if (window.confirm(summaryText + '\n\n¿Abrir navegación en Google Maps?')) {
      if (isMobile) {
        window.location.href = mapUrl;
      } else {
        window.open(mapUrl, '_blank');
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Buscador de Destinos */}
      <div className="bg-slate-50 dark:bg-[#2B2B2F] p-5 rounded-2xl border border-slate-100 dark:border-[#4A4A50] shadow-inner transition-colors duration-500">
        {/* Panel de Configuración de Ubicación del Usuario */}
        <div className="mb-4 rounded-2xl border border-purple-100 dark:border-[#4A4A50] bg-white dark:bg-[#242428] p-4 space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
            SafeWalk U necesita tu ubicación para calcular el recorrido desde tu posición actual. Acepta el permiso de ubicación del navegador.
          </p>
          <button
            type="button"
            onClick={requestGps}
            disabled={geoStatus === 'requesting'}
            className="min-h-11 w-full rounded-xl bg-purple-900 px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60 hover:bg-purple-950 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">my_location</span>
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

          {geoStatus === 'gps' && (
            <p className="rounded-lg bg-emerald-50 p-2 text-[11px] font-bold text-emerald-700">
              Ubicación GPS actualizada.
            </p>
          )}

          {geoError && (
            <p role="alert" className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
              {geoError}
            </p>
          )}
        </div>

        <BuscadorPrincipal
          onDestinoSelect={handleDestinoSelect}
          onTrazar={handleTrazarRuta}
          tracing={routeStatus === 'loading'}
          originLabel={
            userPos
              ? `${geoStatus === 'manual' ? 'Ubicación manual' : 'Ubicación GPS'}: ${userPos[0].toFixed(
                  5
                )}, ${userPos[1].toFixed(5)}`
              : 'Ubicación pendiente'
          }
        />

        {(permanentRiskZones.length > 0 || heatmapPoints.length > 0) && (
          <div className="mt-3 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900">
            <p className="font-black">Zonas de riesgo visibles en el mapa</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['BAJO', 'MEDIO', 'ALTO', 'CRITICO'].map((level) => (
                <label key={level} className="flex items-center gap-1 rounded-lg bg-white px-2 py-1 font-bold">
                  <input type="checkbox" checked={visibleRiskLevels.includes(level)} onChange={() => setVisibleRiskLevels((current) => current.includes(level) ? current.filter((item) => item !== level) : [...current, level])} />
                  {level}
                </label>
              ))}
            </div>
            <label className="mt-2 flex items-center gap-1 font-bold"><input type="checkbox" checked={showHeatmap} onChange={(event) => setShowHeatmap(event.target.checked)} />Mostrar capa de intensidad de reportes y SOS</label>
          </div>
        )}

        {/* Panel de Resumen de Ruta Peatonal y Evaluación de Seguridad */}
        {routeSummary && (
          <div className="mt-4 space-y-4">
            {/* Opciones de Rutas Alternativas */}
            {routeSummary.alternatives && routeSummary.alternatives.length > 1 && (
              <div className="flex flex-col sm:flex-row gap-3">
                {routeSummary.alternatives.map((alt, idx) => {
                  const isSelected = selectedAlt === idx;
                  const isRecommended = alt.label === 'RECOMENDADA';
                  return (
                    <button
                      key={`alt-${idx}`}
                      onClick={() => {
                        setSelectedAlt(idx);
                        // Actualizar mapa con la nueva polilínea
                        const polyline = alt.coordinates || [];
                        setMapConfig(prev => ({
                          ...prev,
                          polyline,
                          centro: polyline[Math.floor(polyline.length / 2)] || prev.centro
                        }));
                      }}
                      className={`flex-1 p-3 rounded-2xl border text-left transition-all ${isSelected ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 shadow-md ring-2 ring-purple-600/20' : 'border-slate-200 bg-white dark:bg-[#2B2B2F] dark:border-[#4A4A50] hover:border-purple-300'}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md ${isRecommended ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                          {isRecommended ? 'RECOMENDADA' : 'MÁS RÁPIDA'}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-500'}`}>
                          {alt.safety.score}/100 pts
                        </span>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-slate-100">{alt.duration_min} min</p>
                          <p className="text-[10px] font-semibold text-slate-500">{alt.distance_m} m</p>
                        </div>
                        {alt.walking_not_recommended && <span className="material-symbols-outlined text-amber-500 text-lg" title="Considera transporte">directions_bus</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-purple-200 bg-white shadow-lg transition-all dark:border-[#4A4A50] dark:bg-[#242428]">
              {(() => {
                const currentAlt = routeSummary.alternatives ? routeSummary.alternatives[selectedAlt] : routeSummary;
                
                return (
                  <>
                    <div className="bg-purple-950 p-4 text-white">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-amber-400 text-xl font-black">directions_walk</span>
                          <span className="text-xs font-black tracking-wider uppercase text-purple-200">
                            Modo: Caminando (A pie)
                          </span>
                        </div>
                        <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] font-black tracking-wide text-white backdrop-blur-sm">
                          {currentAlt.source === 'GOOGLE_ROUTES' || currentAlt.fuente_trazado === 'GOOGLE_ROUTES'
                            ? 'GOOGLE ROUTES'
                            : 'REFERENCIAL'}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-black leading-snug">
                        {currentAlt.destino?.nombre || currentAlt.destination?.name || currentAlt.nombre_ruta || 'Ruta Peatonal'}
                      </h3>
                      <p className="text-[11px] text-purple-200 line-clamp-1">
                        {currentAlt.destino?.direccion || currentAlt.destination?.address || 'Loja, Ecuador'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50 p-3 text-center dark:divide-[#4A4A50] dark:border-[#4A4A50] dark:bg-[#2B2B2F]">
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Distancia total
                        </span>
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {currentAlt.distance_m || currentAlt.distancia_m} m
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Tiempo estimado
                        </span>
                        <span className="text-sm font-black text-purple-700 dark:text-purple-300">
                          {currentAlt.duration_min || currentAlt.tiempo_estimado} min a pie
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {currentAlt.walking_not_recommended && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 items-start">
                          <span className="material-symbols-outlined text-amber-600">info</span>
                          <div>
                            <h4 className="text-xs font-bold text-amber-900">Distancia/Tiempo Considerable</h4>
                            <p className="text-[11px] text-amber-800 mt-1">{currentAlt.walking_advisory?.join(' ')}</p>
                          </div>
                        </div>
                      )}

                      {currentAlt.intermediate_point && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-3 items-start">
                          <span className="material-symbols-outlined text-blue-600">location_city</span>
                          <div>
                            <h4 className="text-xs font-bold text-blue-900">Punto Intermedio Recomendado</h4>
                            <p className="text-[11px] font-bold text-blue-800 mt-0.5">{currentAlt.intermediate_point.nombre}</p>
                            <p className="text-[10px] text-blue-700 mt-1">{currentAlt.intermediate_point.motivo}</p>
                          </div>
                        </div>
                      )}

                      {(() => {
                        const isReferencial = currentAlt.source === 'REFERENCIAL' || currentAlt.fuente_trazado === 'REFERENCIAL';
                        const safety = currentAlt.safety || {};
                        const classification = isReferencial
                          ? 'PRECAUCION'
                          : safety.classification || (currentAlt.nivel_seguridad === 'ALTO' ? 'NO_RECOMENDADA' : currentAlt.nivel_seguridad === 'MEDIO' ? 'PRECAUCION' : 'SEGURA');
                        const score = isReferencial ? 40 : (safety.score ?? (classification === 'SEGURA' ? 85 : classification === 'PRECAUCION' ? 60 : 30));
                        const reasons = isReferencial
                          ? ['No fue posible calcular una ruta peatonal real. La referencia directa no debe utilizarse como navegación. Por favor intenta nuevamente.']
                          : (safety.reasons || [currentAlt.aviso || 'Ruta calculada']);
                        
                        const mainSafetyText = isReferencial
                          ? 'No fue posible calcular la ruta peatonal real con Google Routes.'
                          : classification === 'SEGURA'
                          ? 'Esta ruta es considerada segura para ir caminando según los reportes y datos disponibles.'
                          : classification === 'PRECAUCION'
                          ? 'Esta ruta presenta condiciones que requieren precaución.'
                          : 'Esta ruta atraviesa o se acerca a zonas de riesgo y no se recomienda en este momento.';

                        const disclaimerText = 'Esta recomendación no garantiza la ausencia de riesgos. Mantente alerta a las condiciones reales del entorno.';

                        const config = {
                          SEGURA: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-200', badge: 'bg-emerald-600 text-white', label: 'RUTA SEGURA', icon: 'verified_user' },
                          PRECAUCION: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-200', badge: 'bg-amber-600 text-white', label: isReferencial ? 'REFERENCIAL (VOLVER A INTENTAR)' : 'PRECAUCIÓN', icon: 'warning' },
                          NO_RECOMENDADA: { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-900 dark:text-rose-200', badge: 'bg-rose-600 text-white', label: 'RUTA NO RECOMENDADA', icon: 'gpp_bad' }
                        };

                        const currentStyle = isReferencial ? config.PRECAUCION : (config[classification] || config.PRECAUCION);

                        return (
                          <div className={`rounded-xl border p-3.5 ${currentStyle.bg} ${currentStyle.border}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined text-xl ${currentStyle.text}`}>{currentStyle.icon}</span>
                                <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black tracking-wide ${currentStyle.badge}`}>{currentStyle.label}</span>
                              </div>
                              <span className="text-xs font-black text-slate-700 dark:text-slate-300">{score} / 100 pts</span>
                            </div>
                            <p className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-200">{mainSafetyText}</p>
                            <div className="mt-2 space-y-1">
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Detalles de la evaluación:</p>
                              <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-slate-600 dark:text-slate-400">
                                {reasons.map((r, idx) => <li key={`reason-${idx}`}>{r}</li>)}
                              </ul>
                            </div>
                            <p className="mt-2.5 text-[10px] italic leading-tight text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-2">⚠️ {disclaimerText}</p>
                          </div>
                        );
                      })()}

                      {((currentAlt.steps && currentAlt.steps.length > 0) || (currentAlt.instrucciones && currentAlt.instrucciones.length > 0)) && (
                        <details className="group rounded-xl border border-slate-200 dark:border-[#4A4A50] bg-slate-50 dark:bg-[#2B2B2F] p-3 text-xs">
                          <summary className="flex cursor-pointer items-center justify-between font-bold text-purple-900 dark:text-purple-300">
                            <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base">format_list_bulleted</span>Indicaciones paso a paso ({currentAlt.steps?.length || currentAlt.instrucciones?.length})</span>
                            <span className="material-symbols-outlined text-base transition-transform group-open:rotate-180">expand_more</span>
                          </summary>
                          <ol className="mt-3 max-h-48 list-decimal space-y-1.5 overflow-y-auto pl-5 text-[11px] text-slate-700 dark:text-slate-300">
                            {(currentAlt.steps || currentAlt.instrucciones).map((step, index) => (
                              <li key={`step-${index}`} className="leading-snug">
                                <span className="font-medium">{step.instruction}</span>{' '}
                                {step.distance_m > 0 && <span className="font-bold text-slate-400">({step.distance_m} m)</span>}
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 mt-3">
                        <button type="button" onClick={handleIniciarRuta} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-purple-900 py-3 text-xs font-bold text-white shadow-md hover:bg-purple-950 transition-colors">
                          <span className="material-symbols-outlined text-[18px]">explore</span>
                          Iniciar Ruta (Google Maps)
                        </button>
                        <button type="button" onClick={handleLimpiarRuta} className="sm:w-1/3 rounded-xl border border-slate-200 dark:border-[#4A4A50] bg-white dark:bg-[#2B2B2F] py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#3C3C40] transition-colors">
                          Limpiar mapa
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

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
