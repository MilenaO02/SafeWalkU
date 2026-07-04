import React from 'react';

export default function BuscadorPrincipal() {
  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold text-primary">¿A dónde vas?</h1>
        <p className="text-xs text-on-surface-variant mt-0.5">
          Encuentra la ruta más segura hacia tu destino dentro del campus.
        </p>
      </div>

      <form className="space-y-3 mt-2" onSubmit={(e) => e.preventDefault()}>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
            my_location
          </span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-surface-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            placeholder="Mi ubicación actual..."
            type="text"
          />
        </div>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
            search
          </span>
          <input
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-surface-border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            placeholder="Busca un edificio o zona..."
            type="text"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-primary hover:bg-purple-800 text-white text-xs font-semibold py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">map</span>
          Trazar Camino Seguro
        </button>
      </form>
    </div>
  );
}