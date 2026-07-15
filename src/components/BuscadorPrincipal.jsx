import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../services/api';

export default function BuscadorPrincipal({ onDestinoSelect, onTrazar }) {
  const [query, setQuery] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [destinoSeleccionado, setDestinoSeleccionado] = useState(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.length > 2) {
        try {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const res = await fetch(buildApiUrl(`/ubicaciones/buscar?q=${query}`), {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (Array.isArray(data)) setSugerencias(data);
        } catch (e) {
          console.error("Error buscando ubicaciones:", e);
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
        <h1 className="text-xl font-bold text-purple-900">¿A dónde vas?</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Encuentra la ruta más segura hacia tu destino dentro del campus.
        </p>
      </div>

      <form className="space-y-3 mt-2" onSubmit={handleTrazar}>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
            my_location
          </span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-900 transition-all shadow-sm cursor-not-allowed"
            value="Mi ubicación actual (UIDE Loja)"
            disabled
            type="text"
          />
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-slate-400">
            search
          </span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-900 transition-all shadow-sm"
            placeholder="Busca un edificio o zona..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {sugerencias.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
              {sugerencias.map((sug) => (
                <li 
                  key={sug.id_ubicacion} 
                  className="px-4 py-2 text-xs text-slate-700 hover:bg-purple-50 cursor-pointer border-b border-slate-50 last:border-0"
                  onClick={() => handleSelect(sug)}
                >
                  <div className="font-bold">{sug.nombre}</div>
                  <div className="text-[10px] text-slate-400">{sug.direccion}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button 
          type="submit" 
          disabled={!destinoSeleccionado}
          className="w-full bg-purple-900 hover:bg-purple-950 disabled:bg-slate-300 text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          Trazar Camino Seguro
        </button>
      </form>
    </div>
  );
}