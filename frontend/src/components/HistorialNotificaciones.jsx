import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../services/api';

export default function NotificationHistory() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = async () => {
    setStatus('loading'); setError(null);
    try { const response = await request('/reports'); setReports(response.data || []); setStatus('ready'); }
    catch (loadError) { setError(loadError.message); setStatus('error'); }
  };
  useEffect(() => { load(); }, []);
  const filtered = useMemo(() => reports.filter((report) => {
    const typeMatches = filter === 'TODOS' || report.tipo_reporte === filter;
    const text = `${report.descripcion} ${report.nombre} ${report.apellido} ${report.ubicacion}`.toLowerCase();
    return typeMatches && text.includes(search.trim().toLowerCase());
  }), [reports, filter, search]);

  return <div className="space-y-5">
    <div><h2 className="text-xl md:text-2xl font-black text-purple-950">Reportes y alertas</h2><p className="mt-1 text-xs text-slate-500">Historial real registrado en SafeWalk U.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row"><input aria-label="Buscar reporte" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar reporte" className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm" /><select aria-label="Filtrar tipo" value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm"><option value="TODOS">Todos</option><option value="SOS_PANICO">SOS</option><option value="INCIDENTE">Incidentes</option></select></div>
    {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Cargando reportes…</p>}
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button onClick={load} className="min-h-11 rounded-xl border border-red-200 px-4 font-bold">Reintentar</button></div>}
    {status === 'ready' && <div className="space-y-3">{filtered.map((report) => <article key={report.id_reporte} className={`rounded-2xl border p-4 ${report.tipo_reporte === 'SOS_PANICO' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-black">{report.tipo_reporte === 'SOS_PANICO' ? 'Alerta SOS' : 'Reporte de incidente'}</p><p className="mt-1 text-[11px] opacity-70">{report.nombre} {report.apellido} · {report.ubicacion}</p></div><span className="rounded-lg border border-current/20 bg-white/60 px-2 py-1 text-[10px] font-black">{report.estado}</span></div>
      <p className="mt-3 text-xs leading-relaxed">{report.descripcion}</p><time className="mt-2 block text-[10px] opacity-60">{new Date(report.fecha_reporte).toLocaleString()}</time>
    </article>)}{!filtered.length && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No hay reportes para este filtro.</p>}</div>}
  </div>;
}
