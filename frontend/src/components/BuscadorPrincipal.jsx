import React, { useEffect, useRef, useState } from 'react';
import { request } from '../services/api';

const newSessionToken = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function distanceKm(origin, destination) {
  if (!origin || !Number.isFinite(Number(destination?.latitud)) || !Number.isFinite(Number(destination?.longitud))) return null;
  const toRad = (value) => Number(value) * Math.PI / 180;
  const lat1 = toRad(origin[0]);
  const lat2 = toRad(destination.latitud);
  const deltaLat = lat2 - lat1;
  const deltaLng = toRad(destination.longitud) - toRad(origin[1]);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function normalize(value = '') {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export default function BuscadorPrincipal({ onDestinoSelect, onDestinationClear, onTrazar, origin = null, originLabel = 'Selecciona tu ubicación', tracing = false, selectedDestination = null }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const wrapperRef = useRef(null);
  const abortRef = useRef(null);
  const sessionTokenRef = useRef(newSessionToken());

  useEffect(() => {
    const close = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      abortRef.current?.abort();
      setSuggestions([]);
      setNoResults(false);
      setSearching(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      setSearchError(null);
      setNoResults(false);
      const center = origin && Number.isFinite(origin[0]) && Number.isFinite(origin[1]) ? origin : [-3.99324, -79.20422];

      const [localResult, googleResult] = await Promise.allSettled([
        request(`/ubicaciones/buscar?q=${encodeURIComponent(text)}`, { signal: controller.signal }),
        request('/maps/places/autocomplete', {
          method: 'POST', signal: controller.signal,
          body: JSON.stringify({
            input: text, includedRegionCodes: ['ec'], languageCode: 'es', regionCode: 'EC',
            sessionToken: sessionTokenRef.current,
            locationBias: { circle: { center: { latitude: Number(center[0]), longitude: Number(center[1]) }, radius: 30000 } }
          })
        })
      ]);

      if (controller.signal.aborted) return;
      const local = localResult.status === 'fulfilled'
        ? (localResult.value.data || []).map((item) => ({ ...item, fuente_resultado: 'SAFEWALK', distancia_km: distanceKm(origin, item) }))
        : [];
      const google = googleResult.status === 'fulfilled'
        ? (googleResult.value.data?.suggestions || []).map((item) => item.placePrediction).filter(Boolean).map((prediction) => ({
            id_ubicacion: null,
            place_id: prediction.placeId,
            place_resource: prediction.place,
            nombre: prediction.structuredFormat?.mainText?.text || prediction.text?.text || 'Lugar',
            direccion: prediction.structuredFormat?.secondaryText?.text || prediction.text?.text || '',
            categoria: prediction.types?.[0] || 'LUGAR',
            fuente_resultado: 'GOOGLE_PLACES',
            distancia_km: null
          }))
        : [];

      const deduplicated = [];
      const seen = new Set();
      [...local, ...google].forEach((item) => {
        const key = normalize(`${item.nombre}|${item.direccion}`);
        if (!key || seen.has(key)) return;
        seen.add(key);
        deduplicated.push(item);
      });
      deduplicated.sort((a, b) => {
        if (a.distancia_km != null && b.distancia_km != null) return a.distancia_km - b.distancia_km;
        if (a.distancia_km != null) return -1;
        if (b.distancia_km != null) return 1;
        return a.fuente_resultado === 'SAFEWALK' ? -1 : 1;
      });
      setSuggestions(deduplicated.slice(0, 15));
      setNoResults(deduplicated.length === 0);
      if (localResult.status === 'rejected' && googleResult.status === 'rejected') {
        setSearchError('No fue posible consultar las ubicaciones en este momento.');
      }
      setSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, origin]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!selectedDestination) return;
    setSelected(selectedDestination);
    setQuery(selectedDestination.nombre || 'Destino seleccionado');
  }, [selectedDestination]);

  const selectSuggestion = async (item) => {
    // Caso 1: Ubicación local de SafeWalk U - selección inmediata
    if (item.fuente_resultado !== 'GOOGLE_PLACES') {
      setQuery(item.nombre);
      setSelected(item);
      setSuggestions([]);
      onDestinoSelect?.(item);
      return;
    }

    // Caso 2: Google Places - requiere consultar detalles
    setSearching(true);
    setSearchError(null);

    try {
      const response = await request('/maps/places/details', {
        method: 'POST',
        body: JSON.stringify({
          place: item.place_resource,
          sessionToken: sessionTokenRef.current,
          languageCode: 'es'
        })
      });

      if (response.success && response.data && response.data.location) {
        const placeData = response.data;
        const destination = {
          id_ubicacion: null,
          place_id: item.place_id,
          nombre: placeData.displayName?.text || item.nombre,
          direccion: placeData.formattedAddress || item.direccion,
          latitud: placeData.location.latitude,
          longitud: placeData.location.longitude,
          categoria: placeData.primaryType || item.categoria,
          fuente_resultado: 'GOOGLE_PLACES',
          distancia_km: null
        };

        setQuery(destination.nombre);
        setSelected(destination);
        setSuggestions([]);
        setSearchError(null);
        onDestinoSelect?.(destination);
        sessionTokenRef.current = newSessionToken();
      } else {
        // Sin coordenadas válidas - no permitir trazado
        setQuery(item.nombre);
        setSelected(null);
        setSuggestions([]);
        setSearchError('No se pudieron obtener las coordenadas exactas de este lugar. Selecciona otro resultado o vuelve a intentarlo.');
        sessionTokenRef.current = newSessionToken();
      }
    } catch (e) {
      console.error('Error obteniendo detalles de Google Places:', e);
      setQuery(item.nombre);
      setSelected(null);
      setSuggestions([]);
      setSearchError('No se pudieron obtener las coordenadas exactas de este lugar. Selecciona otro resultado o vuelve a intentarlo.');
      sessionTokenRef.current = newSessionToken();
    } finally {
      setSearching(false);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    if (selected && Number.isFinite(selected.latitud) && Number.isFinite(selected.longitud)) {
      onTrazar?.(selected);
    }
  };

  const canTrace = selected && Number.isFinite(selected.latitud) && Number.isFinite(selected.longitud);

  return <div className="space-y-3" ref={wrapperRef}>
    <div><h2 className="mb-1 text-lg font-black leading-tight tracking-tight text-purple-950 dark:text-slate-100">¿A dónde vas?</h2><p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Busca lugares de SafeWalk U y Google Places cerca de ti.</p></div>
    <form className="space-y-2.5" onSubmit={submit}>
      {searchError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{searchError}</p>}
      <div className="relative"><span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">my_location</span><input className="min-h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs font-semibold text-slate-700 opacity-80 shadow-sm dark:border-[#4A4A50] dark:bg-[#2B2B2F] dark:text-slate-300" value={originLabel} disabled readOnly /></div>
      <div className="relative"><span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">search</span><input className="min-h-11 w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-20 text-xs font-semibold text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-[#2B2B2F] dark:text-slate-100 dark:placeholder:text-slate-400" placeholder="Hospital, parque, UIDE…" value={query} onChange={(event) => { setQuery(event.target.value); if (selected) onDestinationClear?.(); setSelected(null); }} autoComplete="off" role="combobox" aria-expanded={suggestions.length > 0 || noResults} aria-autocomplete="list" />{searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-700 dark:text-purple-300">Buscando…</span>}
        {suggestions.length > 0 && <ul role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl dark:border-[#4A4A50] dark:bg-[#2B2B2F]">{suggestions.map((item) => <li key={item.id_ubicacion ? `db-${item.id_ubicacion}` : `google-${item.place_id}`}><button type="button" onClick={() => selectSuggestion(item)} className="min-h-11 w-full border-b border-slate-100 px-4 py-2.5 text-left text-xs hover:bg-purple-50 dark:border-[#4A4A50] dark:hover:bg-purple-900/25"><span className="flex items-center justify-between gap-2"><strong className="text-purple-950 dark:text-purple-200">{item.nombre}</strong><span className="rounded-full bg-purple-100 px-2 py-0.5 text-[8px] font-black text-purple-800 dark:bg-purple-900/50 dark:text-purple-200">{item.fuente_resultado === 'GOOGLE_PLACES' ? 'GOOGLE' : item.categoria || item.categoria_segura}</span></span><span className="mt-0.5 block text-[10px] text-slate-500 dark:text-slate-300">{item.direccion}</span>{item.distancia_km != null && <span className="text-[9px] font-bold text-slate-400">Aprox. {item.distancia_km < 1 ? `${Math.round(item.distancia_km * 1000)} m` : `${item.distancia_km.toFixed(1)} km`}</span>}</button></li>)}</ul>}
        {noResults && !searching && <div className="absolute z-30 mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-center text-xs text-slate-500 shadow-xl dark:border-[#4A4A50] dark:bg-[#2B2B2F] dark:text-slate-300">Sin resultados para "{query}".</div>}
      </div>
      <button type="submit" disabled={!canTrace || tracing} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-purple-900 px-4 text-xs font-bold text-white disabled:bg-slate-300"><span className="material-symbols-outlined text-[16px]">map</span>{tracing ? 'Calculando ruta a pie…' : 'Trazar camino seguro'}</button>
    </form>
  </div>;
}
