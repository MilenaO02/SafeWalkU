import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../services/api';
import MapaInteractivo from '../components/MapaInteractivo';
import { useAuth } from '../context/auth';
import { riskZoneColor, riskZoneLegend } from '../utils/riskZonePalette';
import { formatLabel } from '../utils/formatLabel';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = { nombre: '', descripcion: '', observaciones: '', nivel_riesgo: 'MEDIO', tipo_riesgo: 'OTRO', estado: 'ACTIVA', color: riskZoneColor('MEDIO'), opacidad: 0.35, radio_proximidad_metros: 80 };
const levels = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO'];
const types = ['ROBO', 'ASALTO', 'ACOSO', 'POCA_ILUMINACION', 'ACCIDENTES', 'ZONA_CONFLICTIVA', 'OTRO'];

export default function AdminRiskZones({ embedded = false }) {
  const { showToast } = useAuth();
  const [zones, setZones] = useState([]), [dynamic, setDynamic] = useState([]), [form, setForm] = useState(emptyForm);
  const [statistics, setStatistics] = useState(null);
  const [draft, setDraft] = useState([]), [editing, setEditing] = useState(null), [query, setQuery] = useState(''), [statusFilter, setStatusFilter] = useState('TODAS');
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null), [deleting, setDeleting] = useState(false), [deleteError, setDeleteError] = useState('');
  const load = async () => {
    setLoading(true); setError('');
    try {
      const [permanent, candidates, stats] = await Promise.all([request('/risk-zones'), request('/risk-zones/dynamic'), request('/risk-zones/statistics')]);
      setZones(permanent.data || []); setDynamic(candidates.data || []); setStatistics(stats.data || null);
    } catch (requestError) { setError(requestError.message || 'No se pudieron cargar las zonas de riesgo.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => zones.filter((zone) => (statusFilter === 'TODAS' || zone.estado === statusFilter) && `${zone.nombre} ${zone.descripcion} ${zone.tipo_riesgo}`.toLowerCase().includes(query.toLowerCase())), [zones, query, statusFilter]);
  // La vista del mapa no depende del filtro de la tabla: una zona recien
  // guardada siempre queda visible con el color elegido por administracion.
  const mapZones = zones.map((zone) => ({
    ...zone,
    previewInactive: zone.estado === 'INACTIVA',
    onClick: () => startEdit(zone)
  }));
  const reset = () => { setEditing(null); setForm(emptyForm); setDraft([]); setError(''); };
  const startEdit = (zone) => { setEditing(zone); setForm({ nombre: zone.nombre, descripcion: zone.descripcion, observaciones: zone.observaciones || '', nivel_riesgo: zone.nivel_riesgo, tipo_riesgo: zone.tipo_riesgo, estado: zone.estado, color: zone.color, opacidad: Number(zone.opacidad), radio_proximidad_metros: Number(zone.radio_proximidad_metros) }); setDraft(Array.isArray(zone.polygon_json) ? zone.polygon_json : []); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const save = async (event) => {
    event.preventDefault(); setError('');
    if (draft.length < 3) { setError('Marca al menos tres vertices sobre el mapa para definir la zona.'); return; }
    setSaving(true);
    try {
      const payload = { ...form, opacidad: Number(form.opacidad), radio_proximidad_metros: Number(form.radio_proximidad_metros), polygon_json: draft };
      await request(editing ? `/risk-zones/${editing.id_zona}` : '/risk-zones', { method: editing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      showToast(editing ? 'Zona de riesgo actualizada.' : 'Zona de riesgo creada.'); reset(); await load();
    } catch (saveError) { setError(saveError.message || 'No se pudo guardar la zona.'); }
    finally { setSaving(false); }
  };
  const toggle = async (zone) => {
    const nextStatus = zone.estado === 'ACTIVA' ? 'INACTIVA' : 'ACTIVA';
    try {
      await request(`/risk-zones/${zone.id_zona}`, { method: 'PUT', body: JSON.stringify({ estado: nextStatus }) });
      showToast(`Zona ${nextStatus === 'ACTIVA' ? 'activada y visible para estudiantes' : 'desactivada; ya no se mostrara a estudiantes'}.`);
      await load();
    } catch (requestError) { setError(requestError.message); }
  };
  const requestDelete = (zone) => { setDeleteTarget(zone); setDeleteError(''); };
  const remove = async (zone) => {
    if (zone) { requestDelete(zone); return; }
    if (!deleteTarget) return;
    setDeleting(true); setDeleteError('');
    try {
      await request(`/risk-zones/${deleteTarget.id_zona}`, { method: 'DELETE' });
      if (editing?.id_zona === deleteTarget.id_zona) reset();
      setZones((items) => items.filter((zone) => zone.id_zona !== deleteTarget.id_zona));
      setDeleteTarget(null);
      showToast('Zona de riesgo eliminada.');
      await load();
    } catch (requestError) { setDeleteError(requestError.message || 'No se pudo eliminar la zona de riesgo.'); }
    finally { setDeleting(false); }
  };
  const approve = async (candidate) => { setDraft(candidate.polygon_json); setForm({ ...emptyForm, nombre: candidate.nombre, descripcion: candidate.descripcion, nivel_riesgo: candidate.nivel_riesgo, tipo_riesgo: candidate.tipo_riesgo, color: riskZoneColor(candidate.nivel_riesgo), radio_proximidad_metros: candidate.radio_proximidad_metros }); setEditing({ candidate_key: candidate.candidate_key, dynamic: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const saveDynamic = async (event) => { if (!editing?.dynamic) return save(event); event.preventDefault(); setSaving(true); try { await request('/risk-zones/dynamic/approve', { method: 'POST', body: JSON.stringify({ candidate_key: editing.candidate_key, ...form, polygon_json: draft, opacidad: Number(form.opacidad), radio_proximidad_metros: Number(form.radio_proximidad_metros) }) }); showToast('Zona dinamica aprobada y persistida.'); reset(); await load(); } catch (requestError) { setError(requestError.message); } finally { setSaving(false); } };
  return <div className="space-y-5">
    {!embedded && <div><h2 className="text-2xl font-black text-purple-950 dark:text-purple-100">Zonas de riesgo</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Dibuja y administra poligonos reales para toda Loja. Haz clic sobre el mapa para agregar vertices; arrastralos para ajustarlos.</p></div>}
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <form onSubmit={saveDynamic} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-[#4A4A50] dark:bg-[#2B2B2F]">
        <div className="flex items-center justify-between"><h3 className="font-black text-purple-950 dark:text-purple-100">{editing ? (editing.dynamic ? 'Aprobar zona dinamica' : 'Editar zona') : 'Nueva zona'}</h3>{editing && <button type="button" onClick={reset} className="text-xs font-bold text-purple-800 dark:text-purple-300">Cancelar</button>}</div>
        <label className="block text-xs font-bold">Nombre<input required minLength="3" maxLength="150" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 dark:bg-[#242428]" /></label>
        <label className="block text-xs font-bold">Descripcion<textarea required minLength="3" maxLength="500" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3 dark:bg-[#242428]" /></label>
        <label className="block text-xs font-bold">Observaciones<textarea maxLength="500" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} className="mt-1 min-h-16 w-full rounded-xl border border-slate-200 p-3 dark:bg-[#242428]" /></label>
        <div className="grid grid-cols-3 gap-2"><label className="text-xs font-bold">Nivel<select value={form.nivel_riesgo} onChange={(e) => { const nivel_riesgo = e.target.value; setForm({ ...form, nivel_riesgo, color: riskZoneColor(nivel_riesgo) }); }} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 dark:bg-[#242428]">{levels.map((level) => <option key={level} value={level}>{formatLabel(level)}</option>)}</select></label><label className="text-xs font-bold">Tipo<select value={form.tipo_riesgo} onChange={(e) => setForm({ ...form, tipo_riesgo: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 dark:bg-[#242428]">{types.map((type) => <option key={type} value={type}>{formatLabel(type)}</option>)}</select></label><label className="text-xs font-bold">Estado<select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 dark:bg-[#242428]"><option value="ACTIVA">Activa</option><option value="INACTIVA">Inactiva</option></select></label></div>
        <div className="grid grid-cols-3 gap-2"><label className="text-xs font-bold">Color<input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 p-1" /></label><label className="text-xs font-bold">Opacidad<input type="number" min="0.2" max="0.35" step="0.05" value={form.opacidad} onChange={(e) => setForm({ ...form, opacidad: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 dark:bg-[#242428]" /></label><label className="text-xs font-bold">Radio (m)<input type="number" min="10" max="1000" value={form.radio_proximidad_metros} onChange={(e) => setForm({ ...form, radio_proximidad_metros: e.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 dark:bg-[#242428]" /></label></div>
        <button type="button" onClick={() => setForm({ ...form, color: riskZoneColor(form.nivel_riesgo) })} className="min-h-10 w-full rounded-xl border border-purple-200 px-3 text-xs font-bold text-purple-800 dark:border-purple-900 dark:text-purple-300">Restaurar color recomendado ({riskZoneColor(form.nivel_riesgo)})</button>
        <p className="rounded-xl bg-purple-50 p-3 text-xs text-purple-900 dark:bg-purple-900/20 dark:text-purple-200">Vertices: <strong>{draft.length}</strong>. Puedes insertar o quitar vertices desde el contorno editable del mapa. Las zonas <strong>activas</strong> se muestran a estudiantes; las inactivas quedan guardadas solo para administracion.</p>
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setDraft((points) => points.slice(0, -1))} disabled={!draft.length} className="min-h-11 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40">Deshacer vertice</button><button type="button" onClick={() => setDraft([])} disabled={!draft.length} className="min-h-11 rounded-xl border border-red-200 text-xs font-bold text-red-700 disabled:opacity-40">Limpiar</button></div>
        <button disabled={saving} className="min-h-11 w-full rounded-xl bg-purple-900 text-xs font-black text-white disabled:opacity-60">{saving ? 'Guardando...' : editing ? (editing.dynamic ? 'Aprobar y guardar' : 'Guardar cambios') : 'Guardar zona'}</button>
      </form>
      <div className="relative h-[520px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm"><MapaInteractivo centro={[-3.99313, -79.20422]} zoom={14} polygons={mapZones} editablePolygon={draft.length >= 3 ? draft : null} onPolygonChange={setDraft} onClick={(point) => setDraft((points) => [...points, point])} /><span className="absolute right-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[10px] font-bold text-slate-700 shadow">Activas: color original · Inactivas: atenuadas</span></div>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#4A4A50] dark:bg-[#2B2B2F]"><p className="text-xs font-black text-slate-700 dark:text-slate-200">Leyenda de niveles de riesgo</p><div className="mt-3 flex flex-wrap gap-3">{riskZoneLegend.map(({ level, color }) => <span key={level} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700 dark:border-[#4A4A50] dark:bg-[#242428] dark:text-slate-200"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{level}</span>)}</div></section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#4A4A50] dark:bg-[#2B2B2F]"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-black">Zonas permanentes</h3><div className="flex gap-2"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar zona" className="min-h-10 rounded-xl border border-slate-200 px-3 text-xs dark:bg-[#242428]" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-10 rounded-xl border border-slate-200 px-2 text-xs dark:bg-[#242428]"><option value="TODAS">Todas</option><option value="ACTIVA">Activas</option><option value="INACTIVA">Inactivas</option></select></div></div>
      {loading ? <p className="mt-4 text-sm text-slate-500">Cargando zonas...</p> : <div className="mt-4 space-y-2">{visible.map((zone) => <article key={zone.id_zona} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between dark:border-[#4A4A50]"><div><p className="font-bold">{zone.nombre} <span className="ml-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${zone.color}22`, color: zone.color }}>{formatLabel(zone.nivel_riesgo)}</span></p><p className="text-xs text-slate-500 dark:text-slate-300">{formatLabel(zone.tipo_riesgo)} · {formatLabel(zone.estado)} · {zone.polygon_json?.length || 0} vértices</p></div><div className="flex gap-2"><button onClick={() => startEdit(zone)} className="min-h-10 rounded-xl border border-purple-200 px-3 text-xs font-bold text-purple-800">Editar</button><button onClick={() => toggle(zone)} className="min-h-10 rounded-xl border border-amber-200 px-3 text-xs font-bold text-amber-800">{zone.estado === 'ACTIVA' ? 'Desactivar' : 'Activar'}</button><button onClick={() => remove(zone)} className="min-h-10 rounded-xl border border-red-200 px-3 text-xs font-bold text-red-700">Eliminar</button></div></article>)}{!visible.length && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-[#242428]">No hay zonas que coincidan con el filtro.</p>}</div>}</section>
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#4A4A50] dark:bg-[#2B2B2F]"><h3 className="font-black">Candidatos dinamicos</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Se calculan en memoria a partir de reportes recientes y alertas SOS; no se guardan hasta su aprobacion.</p><div className="mt-3 space-y-2">{dynamic.map((candidate) => <article key={candidate.candidate_key} className="flex items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50 p-3"><div><p className="text-sm font-bold">{candidate.nombre} · {candidate.nivel_riesgo}</p><p className="text-xs text-slate-600">{candidate.evidence.reportes} reportes y {candidate.evidence.sos} SOS</p></div><button onClick={() => approve(candidate)} className="min-h-10 rounded-xl bg-purple-900 px-3 text-xs font-bold text-white">Revisar / aprobar</button></article>)}{!dynamic.length && <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-[#242428]">No existen candidatos dinamicos vigentes.</p>}</div></section>
    {statistics && <section className="grid gap-3 md:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#4A4A50] dark:bg-[#2B2B2F]"><p className="text-xs font-bold text-slate-500">SOS registrados</p><p className="mt-2 text-3xl font-black text-red-600">{statistics.total_sos}</p></article><article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#4A4A50] dark:bg-[#2B2B2F]"><p className="text-xs font-bold text-slate-500">Sector con mas incidentes</p><p className="mt-2 text-sm font-black">{statistics.sectores_mas_peligrosos?.[0]?.sector || 'Sin datos'}</p><p className="text-xs text-slate-500">{statistics.sectores_mas_peligrosos?.[0]?.incidentes || 0} incidente(s)</p></article><article className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#4A4A50] dark:bg-[#2B2B2F]"><p className="text-xs font-bold text-slate-500">Ultimo periodo con datos</p><p className="mt-2 text-sm font-black">{statistics.incidentes_por_mes?.[0]?.periodo || 'Sin datos'}</p><p className="text-xs text-slate-500">{statistics.incidentes_por_mes?.[0]?.incidentes || 0} incidente(s)</p></article></section>}
    <ConfirmDialog
      open={Boolean(deleteTarget)}
      title="Eliminar zona de riesgo"
      message={deleteTarget ? <span>Eliminarás permanentemente <strong>{deleteTarget.nombre}</strong> ({formatLabel(deleteTarget.nivel_riesgo)}). Esta acción no se puede deshacer.</span> : ''}
      confirmText="Eliminar zona"
      busy={deleting}
      danger
      error={deleteError}
      onClose={() => { if (!deleting) { setDeleteTarget(null); setDeleteError(''); } }}
      onConfirm={() => remove()}
    />
  </div>;
}
