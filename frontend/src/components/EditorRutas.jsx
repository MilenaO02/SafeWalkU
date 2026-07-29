import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../services/api';
import { useAuth } from '../context/auth';
import MapaInteractivo from './MapaInteractivo';

const fallbackCenter = [-3.97245, -79.19933];
const emptyForm = { nombre_ruta: '', descripcion: '', nivel_seguridad: 'ALTO', tiempo_estimado: 5, origen: '', destino: '' };

function distanceMeters(points) {
  const radians = (degrees) => degrees * Math.PI / 180;
  return points.slice(1).reduce((total, point, index) => {
    const previous = points[index];
    const deltaLat = radians(point[0] - previous[0]);
    const deltaLng = radians(point[1] - previous[1]);
    const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(previous[0])) * Math.cos(radians(point[0])) * Math.sin(deltaLng / 2) ** 2;
    return total + 12742000 * Math.asin(Math.sqrt(value));
  }, 0);
}

export default function EditorRutas() {
  const { showToast } = useAuth();
  const [locations, setLocations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [points, setPoints] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [drawing, setDrawing] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  const load = async () => {
    setStatus('loading'); setError(null);
    try {
      const [locationResponse, routeResponse] = await Promise.all([request('/ubicaciones'), request('/routes')]);
      setLocations((locationResponse.data || []).filter((item) => Number.isFinite(Number(item.latitud)) && Number.isFinite(Number(item.longitud))));
      setRoutes(routeResponse.data || []); setStatus('ready');
    } catch (loadError) { setError(loadError.message); setStatus('error'); }
  };
  useEffect(() => { load(); }, []);

  const selectedOrigin = locations.find((item) => item.id_ubicacion === Number(form.origen));
  const selectedDestination = locations.find((item) => item.id_ubicacion === Number(form.destino));
  const mapCenter = points[0] || (selectedOrigin ? [Number(selectedOrigin.latitud), Number(selectedOrigin.longitud)] : fallbackCenter);
  const totalDistance = useMemo(() => Math.round(distanceMeters(points)), [points]);

  const reset = () => { setForm(emptyForm); setPoints([]); setEditingId(null); setDrawing(false); setError(null); };
  const addLocationPoint = (location, mode) => {
    if (!location) { setError(`Selecciona ${mode === 'origin' ? 'el origen' : 'el destino'}.`); return; }
    const point = [Number(location.latitud), Number(location.longitud)];
    setPoints((current) => mode === 'origin' ? [point] : [...current, point]);
    setDrawing(mode === 'origin'); setError(null);
  };
  const save = async (event) => {
    event.preventDefault(); setError(null);
    if (!form.origen || !form.destino || form.origen === form.destino) { setError('Selecciona un origen y destino diferentes.'); return; }
    if (points.length < 2) { setError('Agrega al menos dos puntos al trazado.'); return; }
    setStatus('saving');
    const payload = {
      nombre_ruta: form.nombre_ruta.trim(), descripcion: form.descripcion.trim() || undefined,
      nivel_seguridad: form.nivel_seguridad, tiempo_estimado: Number(form.tiempo_estimado),
      ubicaciones: [Number(form.origen), Number(form.destino)],
      puntos: points.map(([latitud, longitud], index) => ({ latitud, longitud, tipo: index === 0 ? 'INICIO' : index === points.length - 1 ? 'DESTINO' : 'INTERMEDIO' }))
    };
    try {
      await request(editingId ? `/routes/${editingId}` : '/routes', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      showToast(editingId ? 'Ruta actualizada.' : 'Ruta guardada.'); reset(); await load();
    } catch (saveError) { setError(saveError.message); setStatus('error'); }
  };

  const edit = async (route) => {
    setStatus('loading'); setError(null);
    try {
      const response = await request(`/routes/${route.id_ruta}`); const detail = response.data;
      setEditingId(detail.id_ruta);
      const legacyPoints = detail.puntos || [];
      setForm({ nombre_ruta: detail.nombre_ruta, descripcion: detail.descripcion || '', nivel_seguridad: detail.nivel_seguridad, tiempo_estimado: detail.tiempo_estimado, origen: String(legacyPoints[0]?.id_ubicacion || ''), destino: String(legacyPoints[legacyPoints.length - 1]?.id_ubicacion || '') });
      setPoints((detail.trazado || []).map((point) => [Number(point.latitud), Number(point.longitud)]));
      setDrawing(false); setStatus('ready');
    } catch (editError) { setError(editError.message); setStatus('error'); }
  };

  const remove = async (route) => {
    if (!window.confirm(`¿Eliminar la ruta "${route.nombre_ruta}"?`)) return;
    try { await request(`/routes/${route.id_ruta}`, { method: 'DELETE' }); showToast('Ruta eliminada.'); await load(); }
    catch (removeError) { setError(removeError.message); }
  };

  return <div className="space-y-5">
    <header><h2 className="text-xl font-black text-purple-950 md:text-2xl">Editor de rutas seguras</h2><p className="mt-1 text-sm text-slate-500">Selecciona los extremos y haz clic sobre el mapa siguiendo aceras, curvas y cruces.</p></header>
    {error && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h3 className="font-black">{editingId ? `Editar ruta #${editingId}` : 'Nueva ruta'}</h3>
        <label className="block text-xs font-bold">Nombre<input required minLength="3" maxLength="100" value={form.nombre_ruta} onChange={(e) => setForm((v) => ({ ...v, nombre_ruta: e.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" /></label>
        <label className="block text-xs font-bold">Descripcion<textarea maxLength="255" value={form.descripcion} onChange={(e) => setForm((v) => ({ ...v, descripcion: e.target.value }))} className="mt-1 min-h-20 w-full rounded-xl border border-slate-200 p-3" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Seguridad<select value={form.nivel_seguridad} onChange={(e) => setForm((v) => ({ ...v, nivel_seguridad: e.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"><option>ALTO</option><option>MEDIO</option><option>BAJO</option></select></label><label className="text-xs font-bold">Minutos<input required type="number" min="1" max="1440" value={form.tiempo_estimado} onChange={(e) => setForm((v) => ({ ...v, tiempo_estimado: e.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3" /></label></div>
        <label className="block text-xs font-bold">Origen<select required value={form.origen} onChange={(e) => setForm((v) => ({ ...v, origen: e.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"><option value="">Seleccionar</option>{locations.map((item) => <option key={item.id_ubicacion} value={item.id_ubicacion}>{item.nombre}</option>)}</select></label>
        <button type="button" onClick={() => addLocationPoint(selectedOrigin, 'origin')} className="min-h-11 w-full rounded-xl bg-blue-50 px-4 text-xs font-bold text-blue-800">1. Iniciar en el origen</button>
        <label className="block text-xs font-bold">Destino<select required value={form.destino} onChange={(e) => setForm((v) => ({ ...v, destino: e.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3"><option value="">Seleccionar</option>{locations.map((item) => <option key={item.id_ubicacion} value={item.id_ubicacion}>{item.nombre}</option>)}</select></label>
        <button type="button" disabled={!points.length} onClick={() => addLocationPoint(selectedDestination, 'destination')} className="min-h-11 w-full rounded-xl bg-green-50 px-4 text-xs font-bold text-green-800 disabled:opacity-40">3. Finalizar en el destino</button>
        <div className="grid grid-cols-2 gap-2"><button type="button" disabled={!points.length} onClick={() => { setPoints((p) => p.slice(0, -1)); setDrawing(true); }} className="min-h-11 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40">Deshacer</button><button type="button" onClick={() => { setPoints([]); setDrawing(false); }} className="min-h-11 rounded-xl border border-red-200 text-xs font-bold text-red-700">Limpiar</button></div>
        <div className="rounded-xl bg-slate-50 p-3 text-xs"><b>{points.length}</b> puntos · <b>{totalDistance} m</b>{drawing && <p className="mt-1 text-purple-700">2. Haz clic en el mapa para agregar puntos intermedios.</p>}</div>
        <div className="grid grid-cols-2 gap-2"><button type="button" onClick={reset} className="min-h-11 rounded-xl border border-slate-200 text-xs font-bold">Cancelar</button><button disabled={status === 'saving'} className="min-h-11 rounded-xl bg-purple-900 text-xs font-bold text-white disabled:opacity-50">{status === 'saving' ? 'Guardando…' : 'Guardar ruta'}</button></div>
      </form>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
        <div className="h-[520px] min-h-[360px]">
          <MapaInteractivo
            key={`${mapCenter[0]}-${mapCenter[1]}-${editingId || 'new'}`}
            centro={mapCenter}
            zoom={17}
            polyline={points}
            markers={points.map((point, index) => ({
              position: point,
              title: `Punto ${index + 1}`,
              desc: `${point[0].toFixed(6)}, ${point[1].toFixed(6)}`
            }))}
          />
        </div>
      </section>
    </div>
    <section className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-black">Rutas registradas</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{routes.map((route) => <article key={route.id_ruta} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><div><p className="font-bold">{route.nombre_ruta}</p><p className="mt-1 text-xs text-slate-500">{route.nivel_seguridad} · {route.tiempo_estimado} min · {route.total_puntos} puntos manuales</p></div><span className={`h-fit rounded-lg px-2 py-1 text-[10px] font-black ${Number(route.total_puntos) >= 2 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{Number(route.total_puntos) >= 2 ? 'TRAZADA' : 'REFERENCIAL'}</span></div><div className="mt-3 flex gap-2"><button onClick={() => edit(route)} className="min-h-11 flex-1 rounded-xl bg-purple-50 text-xs font-bold text-purple-900">Editar</button><button onClick={() => remove(route)} className="min-h-11 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-700">Eliminar</button></div></article>)}{status === 'ready' && !routes.length && <p className="text-sm text-slate-500">No hay rutas registradas.</p>}</div></section>
  </div>;
}
