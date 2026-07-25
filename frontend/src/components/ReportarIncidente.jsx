import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';
import { clearPendingEvidence, setPendingEvidence } from '../services/pendingReport';

const categories = ['Actividad sospechosa', 'Acoso / Intimidación', 'Accidente médico', 'Robo / Hurto', 'Iluminación deficiente', 'Otro'];

export default function ReportarIncidente() {
  const navigate = useNavigate();
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const inputRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ category: '', description: '', locationId: '' });
  const [evidence, setEvidence] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    request('/ubicaciones').then((response) => { if (active) { setLocations(response.data || []); setStatus('ready'); } }).catch((loadError) => { if (active) { setError(loadError.message); setStatus('error'); } });
    return () => { active = false; setMapConfig(defaultMapConfig); };
  }, [setMapConfig, defaultMapConfig]);

  const selectLocation = (id) => {
    setForm((current) => ({ ...current, locationId: id }));
    const location = locations.find((item) => String(item.id_ubicacion) === id);
    if (location && Number.isFinite(Number(location.latitud)) && Number.isFinite(Number(location.longitud))) {
      const point = [Number(location.latitud), Number(location.longitud)];
      setMapConfig({ centro: point, zoom: 17, markers: [{ position: point, title: location.nombre, desc: location.direccion }], circle: { center: point, radius: Number(location.radio_metros) || 50, color: '#f59e0b' } });
    }
  };

  const submit = (event) => {
    event.preventDefault();
    const location = locations.find((item) => String(item.id_ubicacion) === form.locationId);
    if (!location) { setError('Selecciona una ubicación registrada.'); return; }
    const description = form.description.trim();
    if (description.length < 10) { setError('La descripción debe contener al menos 10 caracteres.'); return; }
    localStorage.setItem('tempReport', JSON.stringify({ categoria: form.category, descripcion: description, fecha: new Date().toLocaleString('es-EC'), ubicacion: location.nombre, id_ubicacion: location.id_ubicacion, coordenadas: [Number(location.latitud), Number(location.longitud)], evidencia: evidence?.name || null }));
    setPendingEvidence(evidence);
    navigate('/resumen-reporte');
  };

  return <div className="space-y-5">
    <button onClick={() => navigate('/app')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-purple-900"><span className="material-symbols-outlined">arrow_back</span>Volver al inicio</button>
    <div><h2 className="text-xl font-black text-purple-950">Reportar incidente</h2><p className="mt-1 text-xs text-slate-500">Describe lo ocurrido y selecciona el punto registrado más cercano.</p></div>
    {status === 'loading' && <p className="rounded-xl bg-slate-50 p-4 text-xs">Cargando ubicaciones…</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-xs font-bold">Tipo de incidente<select required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4"><option value="">Selecciona una categoría</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="block text-xs font-bold">Ubicación<select required disabled={status !== 'ready'} value={form.locationId} onChange={(event) => selectLocation(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4"><option value="">Selecciona un punto</option>{locations.map((location) => <option key={location.id_ubicacion} value={location.id_ubicacion}>{location.nombre} — {location.direccion}</option>)}</select></label>
      <label className="block text-xs font-bold">Descripción<textarea required minLength={10} maxLength={300} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe qué ocurrió…" className="mt-1 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm" /></label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" className="hidden" onChange={(event) => setEvidence(event.target.files?.[0] || null)} />
      <div className="rounded-xl border border-dashed border-slate-300 p-3"><button type="button" onClick={() => inputRef.current?.click()} className="min-h-11 w-full rounded-xl bg-slate-100 px-4 text-xs font-bold">{evidence ? 'Cambiar evidencia' : 'Adjuntar evidencia opcional'}</button>{evidence && <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="truncate">{evidence.name}</span><button type="button" onClick={() => { setEvidence(null); clearPendingEvidence(); if (inputRef.current) inputRef.current.value = ''; }} className="min-h-11 px-3 font-bold text-red-600">Quitar</button></div>}</div>
      <button disabled={status !== 'ready'} className="min-h-11 w-full rounded-xl bg-purple-900 px-4 text-xs font-bold text-white disabled:opacity-50">Revisar reporte</button>
    </form>
  </div>;
}
