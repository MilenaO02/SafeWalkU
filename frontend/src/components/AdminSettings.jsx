import React, { useEffect, useState } from 'react';
import { checkHealth } from '../services/api';
import { useAuth } from '../context/auth';

export default function AdminSettings() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);

  const verify = async () => {
    setError(null);
    setVerifying(true);
    try {
      const result = await checkHealth();
      setHealth(result);
      setLastVerifiedAt(result.checkedAt || new Date().toISOString());
      if (!result.success) setError(result.message || 'No fue posible verificar todos los servicios.');
    } catch (healthError) {
      setHealth({ api: 'offline', database: 'disconnected' });
      setLastVerifiedAt(new Date().toISOString());
      setError(healthError.message || 'No fue posible verificar los servicios.');
    } finally {
      setVerifying(false);
    }
  };
  useEffect(() => { verify(); }, []);

  return <div className="max-w-2xl space-y-6">
    <div><h2 className="text-xl font-black text-purple-950 md:text-2xl">Estado y configuración</h2><p className="mt-1 text-sm text-slate-500">Esta versión solo muestra opciones implementadas y verificables.</p></div>
    {error && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black">Cuenta administradora</h3><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-slate-500">Nombre</dt><dd className="text-right font-bold">{user?.nombre} {user?.apellido}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Correo</dt><dd className="truncate font-bold">{user?.correo}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Rol</dt><dd className="font-bold">{user?.rol}</dd></div></dl></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-black">Servicios</h3><p className="mt-1 text-xs text-slate-500">Consulta el estado real de la API y MySQL.</p></div><button type="button" onClick={verify} disabled={verifying} className="min-h-11 rounded-xl bg-purple-900 px-4 text-xs font-bold text-white transition hover:bg-purple-800 disabled:cursor-wait disabled:opacity-60">{verifying ? 'Verificando…' : 'Verificar servicios'}</button></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt>API</dt><dd className={`font-black ${health?.api === 'online' ? 'text-green-600' : health?.api === 'offline' ? 'text-red-600' : 'text-slate-400'}`}>{health?.api || 'Sin verificar'}</dd></div><div className="flex justify-between gap-4"><dt>Base de datos</dt><dd className={`font-black ${health?.database === 'connected' ? 'text-green-600' : health?.database === 'disconnected' ? 'text-red-600' : 'text-slate-400'}`}>{health?.database || 'Sin verificar'}</dd></div></dl><p className="mt-4 text-xs text-slate-500">Última verificación: {lastVerifiedAt ? new Date(lastVerifiedAt).toLocaleString('es-EC') : 'Sin verificar'}</p></section>
    <p className="rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-800">Las preferencias de notificaciones, correo y zonas administrables requieren persistencia y endpoints propios. No se muestran como editables hasta implementarlos.</p>
  </div>;
}
