import React, { useState, useEffect, useRef } from 'react';
import { request } from '../services/api';
import { loadGoogleMaps } from '../utils/googleMaps';

const newSessionToken = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function BuscadorPrincipal({
  onDestinoSelect,
  onTrazar,
  originLabel = 'Selecciona tu ubicación',
  tracing = false
}) {
  const [query, setQuery] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searching, setSearching] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const wrapperRef = useRef(null);
  const sessionTokenRef = useRef(newSessionToken());

  const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (typeof window !== 'undefined' && window.VITE_GOOGLE_MAPS_API_KEY);

  // Cargar Google Maps JS API de forma segura y asíncrona
  useEffect(() => {
    if (googleApiKey) {
      loadGoogleMaps(googleApiKey)
        .then((maps) => {
          if (maps) setGoogleLoaded(true);
        })
        .catch(() => {
          setGoogleLoaded(false);
        });
    }
  }, [googleApiKey]);

  // Cerrar lista desplegable al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSugerencias([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda autocompletada con debounce (300ms)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setSugerencias([]);
        setNoResults(false);
        setSearching(false);
        return;
      }

      setSearching(true);
      setSearchError(null);
      setNoResults(false);

      if (googleLoaded && googleApiKey) {
        try {
          const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': googleApiKey,
              'X-Goog-FieldMask':
                'suggestions.placePrediction.place,suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat'
            },
            body: JSON.stringify({
              input: trimmed,
              includedRegionCodes: ['ec'],
              languageCode: 'es',
              regionCode: 'EC',
              sessionToken: sessionTokenRef.current,
              locationBias: {
                circle: {
                  center: { latitude: -3.99324, longitude: -79.20422 },
                  radius: 15000
                }
              }
            })
          });

          if (!response.ok) throw new Error(`Places API respondió HTTP ${response.status}`);

          const payload = await response.json();
          const formatted = (payload.suggestions || [])
            .map((item) => item.placePrediction)
            .filter(Boolean)
            .map((prediction) => ({
              id_ubicacion: null,
              place_id: prediction.placeId,
              nombre: prediction.structuredFormat?.mainText?.text || prediction.text?.text || 'Lugar en Loja',
              direccion: prediction.structuredFormat?.secondaryText?.text || prediction.text?.text || 'Loja, Ecuador',
              place_resource: prediction.place,
              fuente: 'GOOGLE_PLACES'
            }));

          setSearching(false);
          setSugerencias(formatted);
          setNoResults(formatted.length === 0);
        } catch {
          // Si falla la Places API REST, recurrir a la búsqueda local de ubicaciones en MySQL
          fetchLocalSearch(trimmed);
        }
      } else {
        fetchLocalSearch(trimmed);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, googleLoaded, googleApiKey]);

  const fetchLocalSearch = async (searchTerm) => {
    try {
      const response = await request(`/ubicaciones/buscar?q=${encodeURIComponent(searchTerm)}`);
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        setSugerencias(response.data);
        setNoResults(false);
      } else {
        setSugerencias([]);
        setNoResults(true);
      }
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : 'No fue posible buscar ubicaciones.');
      setSugerencias([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (sug) => {
    if (sug.fuente === 'GOOGLE_PLACES' && googleApiKey && sug.place_resource) {
      setSearching(true);
      fetch(
        `https://places.googleapis.com/v1/${sug.place_resource}?languageCode=es&sessionToken=${encodeURIComponent(
          sessionTokenRef.current
        )}`,
        {
          headers: {
            'X-Goog-Api-Key': googleApiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location'
          }
        }
      )
        .then(async (response) => {
          if (!response.ok) throw new Error(`Place Details respondió HTTP ${response.status}`);
          return response.json();
        })
        .then((place) => {
          if (!place.location) throw new Error('El lugar seleccionado no proporcionó coordenadas válidas.');

          const selectedLocation = {
            id_ubicacion: null,
            place_id: place.id || sug.place_id,
            nombre: place.displayName?.text || sug.nombre,
            direccion: place.formattedAddress || sug.direccion,
            latitud: place.location.latitude,
            longitud: place.location.longitude,
            fuente: 'GOOGLE_PLACES'
          };

          sessionTokenRef.current = newSessionToken();
          setQuery(selectedLocation.nombre);
          setDestinoSeleccionado(selectedLocation);
          setSugerencias([]);
          if (onDestinoSelect) onDestinoSelect(selectedLocation);
        })
        .catch((error) =>
          setSearchError(error instanceof Error ? error.message : 'No se pudieron obtener las coordenadas del lugar.')
        )
        .finally(() => setSearching(false));
    } else {
      setQuery(sug.nombre);
      setDestinoSeleccionado(sug);
      setSugerencias([]);
      if (onDestinoSelect) onDestinoSelect(sug);
    }
  };

  const handleTrazar = (e) => {
    e.preventDefault();
    if (destinoSeleccionado && onTrazar) {
      onTrazar(destinoSeleccionado);
    }
  };

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <div>
        <h2 className="text-lg font-black text-purple-950 dark:text-slate-100 tracking-tight leading-tight mb-1">
          ¿A dónde vas caminando?
        </h2>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          Busca cualquier comercio, hospital, parque o lugar en Loja para evaluar su ruta peatonal.
        </p>
      </div>

      <form className="space-y-2.5" onSubmit={handleTrazar}>
        {searchError && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {searchError}
          </p>
        )}

        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-500 group-focus-within:text-purple-600 transition-colors">
            my_location
          </span>
          <input
            className="min-h-11 w-full bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 shadow-sm focus:outline-none opacity-85 cursor-not-allowed transition-colors"
            value={originLabel}
            disabled
            type="text"
          />
        </div>

        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-500 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors">
            search
          </span>
          <input
            className="min-h-11 w-full bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 focus:border-purple-600 dark:focus:border-purple-500/50 transition-colors"
            placeholder="Busca un lugar (ej. Hospital Isidro Ayora, Parque Jipiro, UIDE)..."
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDestinoSeleccionado(null);
            }}
            autoComplete="off"
            role="combobox"
            aria-expanded={sugerencias.length > 0 || noResults}
            aria-autocomplete="list"
          />
          {searching && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-700 dark:text-purple-400 animate-pulse">
              Buscando…
            </span>
          )}

          {/* Desplegable de Sugerencias */}
          {sugerencias.length > 0 && (
            <ul className="absolute z-30 w-full bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-xl mt-1 shadow-xl max-h-52 overflow-y-auto">
              {sugerencias.map((sug, idx) => (
                <li
                  key={sug.place_id || sug.id_ubicacion || `sug-${idx}`}
                  className="px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer border-b border-slate-50 dark:border-[#4A4A50] last:border-0 transition-colors"
                  onClick={() => handleSelect(sug)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-purple-950 dark:text-slate-100">{sug.nombre}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[8px] font-black ${
                        sug.fuente === 'GOOGLE_PLACES'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                          : sug.categoria_segura === 'LUGAR_SEGURO'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {sug.fuente === 'GOOGLE_PLACES'
                        ? 'GOOGLE PLACES'
                        : sug.categoria_segura === 'LUGAR_SEGURO'
                        ? 'LUGAR SEGURO'
                        : 'SERVICIO'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{sug.direccion}</div>
                </li>
              ))}
            </ul>
          )}

          {/* Mensaje Sin Resultados */}
          {noResults && !searching && query.trim().length >= 2 && (
            <div className="absolute z-30 w-full bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-xl mt-1 p-3 shadow-xl text-center text-xs text-slate-500">
              Sin resultados en Loja para "{query}". Intenta con otro nombre o dirección.
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!destinoSeleccionado || tracing}
          className="w-full bg-purple-900 hover:bg-purple-950 disabled:bg-slate-300 dark:disabled:bg-[#3C3C40] disabled:text-white/60 dark:disabled:text-[#808085] text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[16px]">directions_walk</span>
          {tracing ? 'Calculando ruta peatonal segura…' : 'Trazar ruta a pie'}
        </button>
      </form>
    </div>
  );
}
