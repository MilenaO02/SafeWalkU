import React, { useState, useEffect } from 'react';
import { request } from '../services/api';

export default function BuscadorPrincipal({ onDestinoSelect, onTrazar, originLabel = 'Selecciona tu ubicación', tracing = false }) {
  const [query, setQuery] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        try {
          setSearching(true);
          setSearchError(null);
          const response = await request(`/ubicaciones/buscar?q=${encodeURIComponent(query)}`);
          if (response.success && Array.isArray(response.data)) setSugerencias(response.data);
        } catch (e) {
          setSearchError(e instanceof Error ? e.message : 'No fue posible buscar ubicaciones.');
        } finally {
          setSearching(false);
        }
      } else {
        setSugerencias([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (ubicacion) => {
    setQuery(ubicacion.nombre);
    setDestinoSeleccionado(ubicacion);
    setSugerencias([]);
    if (onDestinoSelect) onDestinoSelect(ubicacion);
  };

  const handleTrazar = (e) => {
    e.preventDefault();
    if (destinoSeleccionado && onTrazar) {
      onTrazar(destinoSeleccionado);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-black text-purple-950 dark:text-slate-100 tracking-tight leading-tight mb-1">
          ¿A dónde vas?
        </h2>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
          Elige un lugar seguro o servicio de emergencia registrado.
        </p>
      </div>

      <form className="space-y-2.5" onSubmit={handleTrazar}>
        {searchError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{searchError}</p>}
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 dark:text-slate-500 group-focus-within:text-purple-600 transition-colors">
            my_location
          </span>
          <input
            className="w-full bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 shadow-sm focus:outline-none opacity-80 cursor-not-allowed transition-colors"
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
            className="w-full bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-500/30 focus:border-purple-600 dark:focus:border-purple-500/50 transition-colors"
            placeholder="Busca un edificio o zona..."
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDestinoSeleccionado(null);
            }}
            autoComplete="off"
            role="combobox"
            aria-expanded={sugerencias.length > 0}
            aria-autocomplete="list"
          />
          {searching && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-700">Buscando…</span>}
          {sugerencias.length > 0 && (
            <ul className="absolute z-10 w-full bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
              {sugerencias.map((sug) => (
                <li 
                  key={sug.id_ubicacion} 
                  className="px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer border-b border-slate-50 dark:border-[#4A4A50] last:border-0"
                  onClick={() => handleSelect(sug)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">{sug.nombre}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-black ${sug.categoria_segura === 'LUGAR_SEGURO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {sug.categoria_segura === 'LUGAR_SEGURO' ? 'LUGAR SEGURO' : 'EMERGENCIA'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{sug.direccion}</div>
                  {sug.detalle_seguridad && <div className="mt-0.5 text-[9px] text-slate-500">{sug.detalle_seguridad}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button 
          type="submit" 
          disabled={!destinoSeleccionado || tracing}
          className="w-full bg-purple-900 hover:bg-purple-950 disabled:bg-slate-300 dark:disabled:bg-[#3C3C40] disabled:text-white/60 dark:disabled:text-[#808085] text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          {tracing ? 'Calculando ruta a pie…' : 'Trazar camino seguro'}
        </button>
      </form>
    </div>
  );
}
