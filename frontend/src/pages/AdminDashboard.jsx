import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../services/api';
import { useAuth } from '../context/auth';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminDashboardContent() {
  const { user, showToast } = useAuth();
  const [metrics, setMetrics] = useState({ totalReportes: 0, sosActivos: 0, usuariosRegistrados: 0, rutasRiesgo: 0 });
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingSos, setPendingSos] = useState(null);

  const load = async () => {
    setStatus('loading'); setError(null);
    try {
      const [metricResponse, reportResponse] = await Promise.all([request('/dashboard/metricas'), request('/reports')]);
      setMetrics(metricResponse.data); setReports(reportResponse.data || []); setStatus('ready');
    } catch (loadError) { setError(loadError.message); setStatus('error'); }
  };
  useEffect(() => { load(); }, []);

  const activeSos = reports.filter((report) => report.tipo_reporte === 'SOS_PANICO' && report.estado === 'PENDIENTE');
  const statusCounts = useMemo(() => reports.reduce((result, report) => ({ ...result, [report.estado]: (result[report.estado] || 0) + 1 }), {}), [reports]);

  const resolveSos = async (report) => {
    setPendingSos(report);
  };

  const confirmResolveSos = async () => {
    const report = pendingSos;
    if (!report) return;
    setBusyId(report.id_reporte);
    try {
      await request(`/reports/sos/${report.id_reporte}/atender`, { method: 'PUT' });
      setReports((items) => items.map((item) => item.id_reporte === report.id_reporte ? { ...item, estado: 'VALIDADO' } : item));
      setMetrics((value) => ({ ...value, sosActivos: Math.max(0, value.sosActivos - 1) }));
      showToast('Alerta SOS marcada como atendida.');
    } catch (actionError) { setError(actionError.message); }
    finally { setBusyId(null); setPendingSos(null); }
  };

  const cards = [
    ['description', 'Reportes activos', metrics.totalReportes, 'bg-purple-50 text-purple-900'],
    ['emergency', 'SOS pendientes', metrics.sosActivos, 'bg-red-50 text-red-700'],
    ['route', 'Rutas de riesgo', metrics.rutasRiesgo, 'bg-amber-50 text-amber-800'],
    ['group', 'Usuarios activos', metrics.usuariosRegistrados, 'bg-blue-50 text-blue-800']
  ];

  return <div className="space-y-6">
    <div><h2 className="text-xl font-black text-purple-950 md:text-2xl">Dashboard de seguridad</h2><p className="mt-1 text-sm text-slate-500">Sesión de {user?.nombre} {user?.apellido}. Datos actuales de SafeWalk U.</p></div>
    {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Cargando indicadores…</p>}
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button onClick={load} className="min-h-11 rounded-xl border border-red-200 px-4 font-bold">Reintentar</button></div>}
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([icon, label, value, color]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className={`material-symbols-outlined rounded-xl p-2 ${color}`}>{icon}</span><p className="mt-3 text-2xl font-black text-slate-900">{value}</p><p className="text-[10px] font-bold uppercase text-slate-500">{label}</p></article>)}</section>
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-900">Alertas SOS pendientes ({activeSos.length})</h3><div className="mt-4 space-y-3">{activeSos.map((report) => <article key={report.id_reporte} className="rounded-xl border border-red-200 bg-red-50 p-4"><p className="text-xs font-black text-red-800">{report.nombre} {report.apellido}</p><p className="mt-1 text-[11px] text-red-700">{report.ubicacion} · {new Date(report.fecha_reporte).toLocaleString()}</p><p className="mt-2 text-xs text-slate-700">{report.descripcion}</p><button disabled={busyId === report.id_reporte} onClick={() => resolveSos(report)} className="mt-3 min-h-11 w-full rounded-xl bg-red-600 px-4 text-xs font-bold text-white disabled:opacity-50">{busyId === report.id_reporte ? 'Procesando…' : 'Marcar atendida'}</button></article>)}{status === 'ready' && !activeSos.length && <p className="rounded-xl bg-green-50 p-4 text-xs font-semibold text-green-700">No hay alertas SOS pendientes.</p>}</div></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-black text-slate-900">Estados de reportes</h3><dl className="mt-4 space-y-3">{['PENDIENTE', 'VALIDADO', 'RECHAZADO', 'DUPLICADO', 'CANCELADO'].map((state) => <div key={state} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><dt className="text-xs font-bold text-slate-600">{state}</dt><dd className="text-lg font-black text-purple-950">{statusCounts[state] || 0}</dd></div>)}</dl></div>
    </section>
    <ConfirmDialog
      open={Boolean(pendingSos)}
      title="Atender alerta SOS"
      message={pendingSos ? `¿Marcar como atendida la alerta de ${pendingSos.nombre} ${pendingSos.apellido}?` : ''}
      confirmText="Marcar atendida"
      busy={Boolean(pendingSos && busyId === pendingSos.id_reporte)}
      onClose={() => setPendingSos(null)}
      onConfirm={confirmResolveSos}
    />
  </div>;
}
