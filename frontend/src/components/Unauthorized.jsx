import React from 'react';
import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <span className="material-symbols-outlined text-[28px]">lock</span>
        </div>
        <h1 className="text-2xl font-black text-purple-950">Acceso no autorizado</h1>
        <p className="mt-3 text-sm text-slate-600">No tienes permisos para ver esta sección.</p>
        <Link to="/login" className="mt-6 inline-flex rounded-xl bg-purple-900 px-4 py-2 text-sm font-semibold text-white">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
