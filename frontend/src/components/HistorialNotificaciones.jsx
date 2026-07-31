import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { request, buildAssetUrl } from '../services/api';
import { useAuth } from '../context/auth';
import ConfirmDialog from './ConfirmDialog';

export default function NotificationHistory() {
  const { showToast } = useAuth();
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('TODOS');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [registryFilter, setRegistryFilter] = useState('ACTIVOS');
  const [pendingArchive, setPendingArchive] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading'); setError(null);
    try { const response = await request(`/reports?registro=${registryFilter}`); setReports(response.data || []); setStatus('ready'); }
    catch (loadError) { setError(loadError.message); setStatus('error'); }
  }, [registryFilter]);
  useEffect(() => { load(); }, [load]);
  const filtered = useMemo(() => reports.filter((report) => {
    const typeMatches = filter === 'TODOS' || report.tipo_reporte === filter;
    const text = `${report.descripcion} ${report.nombre} ${report.apellido} ${report.ubicacion}`.toLowerCase();
    return typeMatches && text.includes(search.trim().toLowerCase());
  }), [reports, filter, search]);

  const reviewReport = async (report, nextStatus) => {
    setBusyId(report.id_reporte);
    setError(null);
    try {
      const response = await request(`/reports/${report.id_reporte}`, {
        method: 'PUT',
        body: JSON.stringify({ estado: nextStatus })
      });
      setReports((items) => items.map((item) => item.id_reporte === report.id_reporte ? response.data : item));
      showToast(`Reporte marcado como ${nextStatus.toLowerCase()}.`);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId(null);
    }
  };

  const archiveReport = async () => {
    if (!pendingArchive) return;
    const report = pendingArchive;
    setBusyId(report.id_reporte);
    setError(null);
    try {
      const response = await request(`/reports/${report.id_reporte}`, { method: 'DELETE' });
      setReports((items) => items.filter((item) => item.id_reporte !== report.id_reporte));
      showToast(response.message || 'Reporte archivado correctamente.');
      setPendingArchive(null);
    } catch (actionError) {
      setError(actionError.message || 'No fue posible archivar el reporte.');
    } finally {
      setBusyId(null);
    }
  };

  const restoreReport = async (report) => {
    setBusyId(report.id_reporte);
    setError(null);
    try {
      const response = await request(`/reports/${report.id_reporte}/restaurar`, { method: 'PATCH' });
      setReports((items) => items.filter((item) => item.id_reporte !== report.id_reporte));
      showToast(response.message || 'Reporte restaurado correctamente.');
    } catch (actionError) {
      setError(actionError.message || 'No fue posible restaurar el reporte.');
    } finally {
      setBusyId(null);
    }
  };

  return <div className="space-y-5">
    <div><h2 className="text-xl md:text-2xl font-black text-purple-950 dark:text-purple-100">Reportes y alertas</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Historial real registrado en SafeWalk U.</p></div>
    <div className="flex flex-col gap-3 sm:flex-row"><input aria-label="Buscar reporte" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar reporte" className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 dark:border-[#4A4A50] dark:bg-[#242428] dark:text-slate-100 dark:placeholder:text-slate-400" /><select aria-label="Filtrar tipo" value={filter} onChange={(event) => setFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm dark:border-[#4A4A50] dark:bg-[#242428]"><option value="TODOS">Todos</option><option value="SOS_PANICO">SOS</option><option value="INCIDENTE">Incidentes</option></select><select aria-label="Filtrar registro" value={registryFilter} onChange={(event) => setRegistryFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm dark:border-[#4A4A50] dark:bg-[#242428]"><option value="ACTIVOS">Activos</option><option value="ARCHIVADOS">Archivados</option><option value="TODOS">Todos</option></select></div>
    {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500 dark:bg-[#2B2B2F] dark:text-slate-300">Cargando reportes…</p>}
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"><span>{error}</span><button onClick={load} className="min-h-11 rounded-xl border border-red-200 px-4 font-bold">Reintentar</button></div>}
    {status === 'ready' && <div className="space-y-3">{filtered.map((report) => <article key={report.id_reporte} className={`rounded-2xl border p-4 ${report.tipo_reporte === 'SOS_PANICO' ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/25' : 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/25'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-black">{report.tipo_reporte === 'SOS_PANICO' ? 'Alerta SOS' : 'Reporte de incidente'}</p><p className="mt-1 text-[11px] opacity-70">{report.nombre} {report.apellido} · {report.ubicacion}</p></div><span className="rounded-lg border border-current/20 bg-white/60 px-2 py-1 text-[10px] font-black">{report.estado}</span></div>
      <p className="mt-3 text-xs leading-relaxed text-slate-800 dark:text-slate-100">{report.descripcion}</p>
      
      {/* Sección de Evidencias */}
      {report.evidencias && report.evidencias.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Evidencia adjunta ({report.evidencias.length})</span>
          <div className="flex flex-wrap gap-2">
            {report.evidencias.map((ev) => {
              const fullUrl = buildAssetUrl(ev.url_archivo);
              return (
                <button
                  type="button"
                  key={ev.id_evidencia}
                  onClick={() => setSelectedMedia({ url: fullUrl, type: ev.tipo_archivo })}
                  className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-xl border border-slate-300/80 bg-black/5 shadow-sm transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  {ev.tipo_archivo === 'IMAGEN' ? (
                    <img src={fullUrl} alt="Evidencia" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-white">
                      <span className="material-symbols-outlined text-2xl">play_circle</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="material-symbols-outlined text-white text-base">zoom_in</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-2.5">
          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/60 px-2 py-1 text-[10px] font-semibold text-slate-500">
            <span className="material-symbols-outlined text-[14px]">hide_image</span>
            Sin evidencia adjunta
          </span>
        </div>
      )}

      <time className="mt-2 block text-[10px] opacity-60">{new Date(report.fecha_reporte).toLocaleString()}</time>
      {report.tipo_reporte === 'INCIDENTE' && report.estado === 'PENDIENTE' && <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button disabled={busyId === report.id_reporte} onClick={() => reviewReport(report, 'VALIDADO')} className="min-h-11 rounded-xl bg-green-700 px-3 text-xs font-bold text-white disabled:opacity-50">Validar</button>
        <button disabled={busyId === report.id_reporte} onClick={() => reviewReport(report, 'RECHAZADO')} className="min-h-11 rounded-xl bg-red-700 px-3 text-xs font-bold text-white disabled:opacity-50">Rechazar</button>
        <button disabled={busyId === report.id_reporte} onClick={() => reviewReport(report, 'DUPLICADO')} className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 text-xs font-bold text-amber-800 disabled:opacity-50">Duplicado</button>
      </div>}
      <div className="mt-3 flex justify-end gap-2">
        {report.estado_registro === 'INACTIVO' ? (
          <button disabled={busyId === report.id_reporte} onClick={() => restoreReport(report)} className="min-h-11 rounded-xl border border-emerald-300 bg-white px-4 text-xs font-bold text-emerald-800 disabled:opacity-50 dark:bg-[#242428] dark:text-emerald-300">{busyId === report.id_reporte ? 'Procesando…' : 'Restaurar'}</button>
        ) : (
          <button disabled={busyId === report.id_reporte} onClick={() => setPendingArchive(report)} className="min-h-11 rounded-xl border border-red-300 bg-white px-4 text-xs font-bold text-red-700 disabled:opacity-50 dark:bg-[#242428] dark:text-red-300">{busyId === report.id_reporte ? 'Procesando…' : 'Archivar'}</button>
        )}
      </div>
    </article>)}{!filtered.length && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No hay reportes para este filtro.</p>}</div>}

    {/* Lightbox / Modal para visualizar evidencia ampliada */}
    {selectedMedia && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedMedia(null)}>
        <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white hover:bg-slate-900 transition-colors shadow-md"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
          {selectedMedia.type === 'IMAGEN' ? (
            <img src={selectedMedia.url} alt="Evidencia en tamaño real" className="max-h-[80vh] max-w-full rounded-xl object-contain" />
          ) : (
            <video src={selectedMedia.url} controls autoPlay className="max-h-[80vh] max-w-full rounded-xl" />
          )}
        </div>
      </div>
    )}
    <ConfirmDialog open={Boolean(pendingArchive)} title="Archivar reporte" message={pendingArchive ? `El reporte #${pendingArchive.id_reporte} se ocultará de los listados activos. Sus evidencias y datos permanecerán guardados y podrá restaurarlo después.` : ''} confirmText="Archivar" busy={Boolean(pendingArchive && busyId === pendingArchive.id_reporte)} danger onClose={() => setPendingArchive(null)} onConfirm={archiveReport} />
  </div>;
}
