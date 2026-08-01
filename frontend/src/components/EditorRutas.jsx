import React, { useEffect, useMemo, useRef, useState } from 'react';
import { request } from '../services/api';
import { useAuth } from '../context/auth';
import MapaInteractivo from './MapaInteractivo';
import ConfirmDialog from './ConfirmDialog';

const emptyForm = { nombre_ruta: '', descripcion: '', nivel_seguridad: 'ALTO' };
const isCoordinate = (endpoint) => Number.isFinite(Number(endpoint?.latitud)) && Number.isFinite(Number(endpoint?.longitud));
const newSessionToken = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function EndpointPicker({ label, endpoint, onChange, active, onActivate, tone }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const sessionRef = useRef(newSessionToken());

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) { setSuggestions([]); return undefined; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await request('/maps/places/autocomplete', {
          method: 'POST', body: JSON.stringify({ input: text, includedRegionCodes: ['ec'], languageCode: 'es', regionCode: 'EC', sessionToken: sessionRef.current })
        });
        setSuggestions((response.data?.suggestions || []).map((item) => item.placePrediction).filter(Boolean));
      } catch { setSuggestions([]); } finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const pickPlace = async (prediction) => {
    setSearching(true);
    try {
      const response = await request('/maps/places/details', { method: 'POST', body: JSON.stringify({ place: prediction.place, sessionToken: sessionRef.current, languageCode: 'es' }) });
      const place = response.data;
      if (!place?.location || !Number.isFinite(place.location.latitude) || !Number.isFinite(place.location.longitude)) throw new Error();
      onChange({ nombre: place.displayName?.text || prediction.text?.text || 'Lugar seleccionado', direccion: place.formattedAddress || '', latitud: place.location.latitude, longitud: place.location.longitude, place_id: prediction.placeId, fuente: 'GOOGLE_PLACES' });
      setQuery(place.displayName?.text || prediction.text?.text || ''); setSuggestions([]); sessionRef.current = newSessionToken();
    } catch { onChange(null); } finally { setSearching(false); }
  };

  const useGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => onChange({ nombre: label === 'Origen' ? 'Ubicación GPS de origen' : 'Ubicación GPS de destino', direccion: '', latitud: coords.latitude, longitud: coords.longitude, fuente: 'GPS' }), undefined, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };

  return <section className={`rounded-xl border p-3 ${tone}`}>
    <div className="flex items-center justify-between gap-2"><strong className="text-xs">{label}</strong>{endpoint && <span className="text-[10px] font-bold text-slate-500">{endpoint.fuente === 'GOOGLE_PLACES' ? 'Google Places' : endpoint.fuente === 'GPS' ? 'GPS' : 'Mapa'}</span>}</div>
    {endpoint && <p className="mt-1 truncate text-xs text-slate-700"><b>{endpoint.nombre}</b>{endpoint.direccion ? ` · ${endpoint.direccion}` : ''}</p>}
    <div className="relative mt-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${label.toLowerCase()}…`} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs" />{searching && <span className="absolute right-3 top-3 text-[10px] font-bold">Buscando…</span>}
      {suggestions.length > 0 && <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg">{suggestions.map((item) => <li key={item.placeId}><button type="button" onClick={() => pickPlace(item)} className="w-full border-b px-3 py-2 text-left text-xs hover:bg-purple-50"><b>{item.structuredFormat?.mainText?.text || item.text?.text}</b><span className="block text-slate-500">{item.structuredFormat?.secondaryText?.text || ''}</span></button></li>)}</ul>}
    </div>
    <div className="mt-2 grid grid-cols-2 gap-2"><button type="button" onClick={useGps} className="min-h-9 rounded-lg border bg-white text-xs font-bold">Usar GPS</button><button type="button" onClick={onActivate} className={`min-h-9 rounded-lg text-xs font-bold ${active ? 'bg-purple-900 text-white' : 'border bg-white'}`}>{active ? 'Haz clic en el mapa' : 'Elegir en mapa'}</button></div>
  </section>;
}

export default function EditorRutas() {
  const { showToast } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [preview, setPreview] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTarget, setActiveTarget] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const load = async () => { setStatus('loading'); try { const result = await request('/routes'); setRoutes(result.data || []); setStatus('ready'); } catch (err) { setError(err.message); setStatus('error'); } };
  useEffect(() => { load(); }, []);

  const trace = async (nextOrigin = origin, nextDestination = destination) => {
    if (!isCoordinate(nextOrigin) || !isCoordinate(nextDestination)) { setPreview(null); return; }
    setStatus('tracing'); setError(null);
    try {
      const params = new URLSearchParams({ origen_lat: String(nextOrigin.latitud), origen_lng: String(nextOrigin.longitud), destino_lat: String(nextDestination.latitud), destino_lng: String(nextDestination.longitud), destino_nombre: nextDestination.nombre || '', destino_direccion: nextDestination.direccion || '', place_id: nextDestination.place_id || '' });
      const result = await request(`/routes/trazar?${params}`);
      const alternatives = result.data?.alternatives || [];
      const valid = alternatives.filter((route) => Array.isArray(route.coordinates) && route.coordinates.length >= 2 && Number(route.duration_seconds) > 0);
      if (!valid.length) throw new Error('Google Routes no devolvió una ruta peatonal válida.');
      const fastest = valid.reduce((best, route) => Number(route.duration_seconds) < Number(best.duration_seconds) ? route : best);
      setPreview(fastest); setStatus('ready');
    } catch (err) { setPreview(null); setError(err.message || 'No fue posible calcular la ruta.'); setStatus('ready'); }
  };

  const updateEndpoint = (target, endpoint) => { const update = target === 'origen' ? setOrigin : setDestination; update(endpoint); setActiveTarget(null); setPreview(null); };
  useEffect(() => { if (isCoordinate(origin) && isCoordinate(destination)) trace(); }, [origin, destination]);

  const reset = () => { setForm(emptyForm); setOrigin(null); setDestination(null); setPreview(null); setEditingId(null); setActiveTarget(null); setError(null); setModalOpen(false); };
  const mapClick = ({ lat, lng }) => { if (!activeTarget) return; updateEndpoint(activeTarget, { nombre: activeTarget === 'origen' ? 'Origen seleccionado en el mapa' : 'Destino seleccionado en el mapa', direccion: '', latitud: lat, longitud: lng, fuente: 'MAP_CLICK' }); };
  const markers = [origin && { position: [origin.latitud, origin.longitud], title: 'Origen', kind: 'user', draggable: true, onPositionChange: ([latitud, longitud]) => setOrigin({ ...origin, latitud, longitud, fuente: 'MAP_CLICK' }) }, destination && { position: [destination.latitud, destination.longitud], title: 'Destino', kind: 'destination', draggable: true, onPositionChange: ([latitud, longitud]) => setDestination({ ...destination, latitud, longitud, fuente: 'MAP_CLICK' }) }].filter(Boolean);
  const center = isCoordinate(origin) ? [origin.latitud, origin.longitud] : isCoordinate(destination) ? [destination.latitud, destination.longitud] : [-3.97245, -79.19933];

  const save = async (event) => { event.preventDefault(); if (!preview || !isCoordinate(origin) || !isCoordinate(destination)) { setError('Selecciona origen y destino y espera el trazado de Google Routes.'); return; } setStatus('saving'); try { const payload = { ...form, origen: origin, destino: destination, tiempo_estimado: Number(preview.duration_min), distancia_m: Math.round(Number(preview.distance_m)), duracion_segundos: Math.round(Number(preview.duration_seconds)), fuente_trazado: 'GOOGLE_ROUTES', puntos: preview.coordinates.map(([latitud, longitud], index) => ({ latitud, longitud, tipo: index === 0 ? 'INICIO' : index === preview.coordinates.length - 1 ? 'DESTINO' : 'INTERMEDIO' })) }; await request(editingId ? `/routes/${editingId}` : '/routes', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }); showToast(editingId ? 'Ruta actualizada con Google Routes.' : 'Ruta guardada con Google Routes.'); reset(); await load(); } catch (err) { setError(err.message); setStatus('ready'); } };
  const edit = async (route) => { setStatus('loading'); try { const response = await request(`/routes/${route.id_ruta}`); const detail = response.data; const endpoints = detail.puntos || []; setEditingId(detail.id_ruta); setForm({ nombre_ruta: detail.nombre_ruta, descripcion: detail.descripcion || '', nivel_seguridad: detail.nivel_seguridad }); setOrigin(endpoints[0] ? { nombre: detail.origen_nombre || endpoints[0].nombre, direccion: detail.origen_direccion || endpoints[0].direccion || '', latitud: Number(endpoints[0].latitud), longitud: Number(endpoints[0].longitud), place_id: detail.origen_place_id || undefined, fuente: detail.origen_place_id ? 'GOOGLE_PLACES' : 'MAP_CLICK' } : null); setDestination(endpoints.at(-1) ? { nombre: detail.destino_nombre || endpoints.at(-1).nombre, direccion: detail.destino_direccion || endpoints.at(-1).direccion || '', latitud: Number(endpoints.at(-1).latitud), longitud: Number(endpoints.at(-1).longitud), place_id: detail.destino_place_id || undefined, fuente: detail.destino_place_id ? 'GOOGLE_PLACES' : 'MAP_CLICK' } : null); setPreview(null); setModalOpen(true); setStatus('ready'); } catch (err) { setError(err.message); setStatus('ready'); } };
  const remove = async () => { if (!pendingDelete) return; try { await request(`/routes/${pendingDelete.id_ruta}`, { method: 'DELETE' }); setPendingDelete(null); await load(); showToast('Ruta eliminada correctamente.'); } catch (err) { setError(err.message); } };
  const summary = useMemo(() => preview ? `${Math.round(Number(preview.distance_m))} m · ${Math.ceil(Number(preview.duration_seconds) / 60)} min` : 'Selecciona los dos extremos para calcular la ruta', [preview]);

  return <div className="space-y-5"><header className="flex items-center justify-between gap-4"><div><h2 className="text-xl font-black text-purple-950">Editor de rutas seguras</h2><p className="text-sm text-slate-500">Las rutas se calculan y guardan únicamente con Google Routes.</p></div><button onClick={() => { reset(); setModalOpen(true); }} className="rounded-xl bg-purple-900 px-5 py-2.5 text-sm font-bold text-white">+ Nueva ruta</button></header>
    {modalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-auto rounded-2xl bg-slate-50 p-5 shadow-2xl"><div className="mb-4 flex justify-between"><h3 className="font-black text-purple-950">{editingId ? 'Editar ruta' : 'Nueva ruta segura'}</h3><button onClick={reset}>✕</button></div>{error && <p className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}<div className="grid gap-5 xl:grid-cols-[390px_1fr]"><form onSubmit={save} className="space-y-3 rounded-2xl border bg-white p-4"><label className="block text-xs font-bold">Nombre de la ruta<input required minLength="3" maxLength="100" value={form.nombre_ruta} onChange={(event) => setForm({ ...form, nombre_ruta: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label><label className="block text-xs font-bold">Descripción<textarea maxLength="255" value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} className="mt-1 min-h-16 w-full rounded-xl border p-3" /></label><label className="block text-xs font-bold">Nivel de seguridad<select value={form.nivel_seguridad} onChange={(event) => setForm({ ...form, nivel_seguridad: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border px-3"><option value="ALTO">Alto</option><option value="MEDIO">Medio</option><option value="BAJO">Bajo</option></select></label><EndpointPicker label="Origen" endpoint={origin} onChange={(value) => updateEndpoint('origen', value)} active={activeTarget === 'origen'} onActivate={() => setActiveTarget(activeTarget === 'origen' ? null : 'origen')} tone="border-blue-100 bg-blue-50" /><EndpointPicker label="Destino" endpoint={destination} onChange={(value) => updateEndpoint('destino', value)} active={activeTarget === 'destino'} onActivate={() => setActiveTarget(activeTarget === 'destino' ? null : 'destino')} tone="border-emerald-100 bg-emerald-50" /><div className="rounded-xl bg-purple-50 p-3 text-xs"><b>Ruta Google:</b> {summary}</div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={reset} className="min-h-11 rounded-xl border text-xs font-bold">Cancelar</button><button disabled={status === 'saving' || !preview} className="min-h-11 rounded-xl bg-purple-900 text-xs font-bold text-white disabled:bg-slate-300">{status === 'saving' ? 'Guardando…' : 'Guardar ruta'}</button></div></form><div className="h-[520px] overflow-hidden rounded-2xl border bg-white"><MapaInteractivo centro={center} zoom={16} markers={markers} polyline={preview?.coordinates || null} onClick={mapClick} /></div></div></div></div>}
    <section className="rounded-2xl border bg-white p-5"><h3 className="font-black text-purple-950">Rutas registradas</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{routes.map((route) => <article key={route.id_ruta} className="rounded-xl border p-4"><p className="font-bold">{route.nombre_ruta}</p><p className="mt-1 text-xs text-slate-500">{route.nivel_seguridad} · {route.duracion_segundos ? `${Math.ceil(Number(route.duracion_segundos) / 60)} min reales` : `${route.tiempo_estimado} min`} · {route.distancia_m ? `${route.distancia_m} m` : 'Pendiente de recalcular'}</p><span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-black ${route.fuente_trazado === 'GOOGLE_ROUTES' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{route.fuente_trazado === 'GOOGLE_ROUTES' ? 'GOOGLE ROUTES' : 'RECALCULAR'}</span><div className="mt-3 flex gap-2"><button onClick={() => edit(route)} className="flex-1 rounded-xl bg-purple-50 py-2 text-xs font-bold text-purple-900">Editar</button><button onClick={() => setPendingDelete(route)} className="rounded-xl border border-red-200 px-4 text-xs font-bold text-red-700">Eliminar</button></div></article>)}{status === 'ready' && !routes.length && <p className="text-sm text-slate-500">No hay rutas registradas.</p>}</div></section>
    <ConfirmDialog open={Boolean(pendingDelete)} title="Eliminar ruta" message={pendingDelete ? `¿Deseas eliminar la ruta "${pendingDelete.nombre_ruta}"?` : ''} confirmText="Eliminar" danger onClose={() => setPendingDelete(null)} onConfirm={remove} />
  </div>;
}
