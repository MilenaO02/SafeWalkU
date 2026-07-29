import React, { useCallback, useEffect, useRef, useState } from 'react';
import { request } from '../services/api';
import { useAuth } from '../context/auth';
import MapaInteractivo from './MapaInteractivo';
import ConfirmDialog from './ConfirmDialog';

const sessionToken = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

export default function EditorUbicaciones() {
  const { showToast } = useAuth();
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ nombre: '', direccion: '', latitud: '', longitud: '' });
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const searchAbortRef = useRef(null);
  const tokenRef = useRef(sessionToken());

  const load = useCallback(async () => {
    const response = await request('/ubicaciones');
    setLocations(response.data || []);
  }, []);

  useEffect(() => {
    load().catch(() => showToast('No se pudieron cargar las ubicaciones.'));
  }, [load, showToast]);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) {
      searchAbortRef.current?.abort();
      setSuggestions([]);
      setSearching(false);
      return undefined;
    }
    const timer = setTimeout(async () => {
      searchAbortRef.current?.abort();
      const controller = new AbortController();
      searchAbortRef.current = controller;
      setSearching(true);
      try {
        const response = await request('/maps/places/autocomplete', {
          method: 'POST', signal: controller.signal,
          body: JSON.stringify({
            input: normalized, includedRegionCodes: ['ec'], languageCode: 'es', regionCode: 'EC',
            sessionToken: tokenRef.current,
            locationBias: { circle: { center: { latitude: -3.99324, longitude: -79.20422 }, radius: 20000 } }
          })
        });
        setSuggestions((response.data?.suggestions || []).map((item) => item.placePrediction).filter(Boolean));
      } catch (error) {
        if (error?.name !== 'AbortError') showToast(error instanceof Error ? error.message : 'No fue posible buscar la dirección.');
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, showToast]);

  useEffect(() => () => searchAbortRef.current?.abort(), []);

  const choose = (id) => {
    setSelectedId(String(id));
    if (id === 'new') {
      setForm({ nombre: '', direccion: '', latitud: '', longitud: '', tipo: 'GENERAL' });
      return;
    }
    const location = locations.find((item) => item.id_ubicacion === Number(id));
    if (!location) return;
    setForm({ nombre: location.nombre, direccion: location.direccion, latitud: String(location.latitud), longitud: String(location.longitud), tipo: location.tipo_zona || 'GENERAL' });
  };
  
  const handleMapClick = async (coords) => {
    if (!selectedId) return;
    setForm((prev) => ({ ...prev, latitud: coords.lat.toFixed(6), longitud: coords.lng.toFixed(6) }));
    
    // Reverse Geocoding attempt via Google Maps API
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: coords });
        if (response.results?.[0]) {
          setForm((prev) => ({ ...prev, direccion: response.results[0].formatted_address }));
        }
      } catch (err) {
        console.warn('Geocoding failed:', err);
      }
    }
  };

  const point = Number.isFinite(Number(form.latitud)) && Number.isFinite(Number(form.longitud)) ? [Number(form.latitud), Number(form.longitud)] : [-3.97245, -79.19933];

  const setPoint = useCallback(([lat, lng]) => {
    setForm((current) => ({ ...current, latitud: lat.toFixed(8), longitud: lng.toFixed(8) }));
  }, []);

  const selectSuggestion = async (prediction) => {
    setSearching(true);
    try {
      const response = await request('/maps/places/details', {
        method: 'POST',
        body: JSON.stringify({ place: prediction.place, languageCode: 'es', sessionToken: tokenRef.current })
      });
      const place = response.data;
      if (!place?.location) throw new Error('Google no devolvió coordenadas para ese lugar.');
      setForm((current) => ({
        ...current,
        direccion: place.formattedAddress || current.direccion,
        latitud: Number(place.location.latitude).toFixed(8),
        longitud: Number(place.location.longitude).toFixed(8)
      }));
      setQuery(place.displayName?.text || prediction.text?.text || '');
      setSuggestions([]);
      tokenRef.current = sessionToken();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No fue posible seleccionar ese lugar.');
    } finally { setSearching(false); }
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      showToast('Este navegador no permite obtener la ubicación GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPoint([coords.latitude, coords.longitude]),
      () => showToast('No se pudo obtener el GPS. Revisa el permiso de ubicación del navegador.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const validate = () => {
    const lat = Number(form.latitud);
    const lng = Number(form.longitud);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return 'La latitud debe estar entre -90 y 90.';
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return 'La longitud debe estar entre -180 y 180.';
    if (form.nombre.trim().length < 3 || form.direccion.trim().length < 3) return 'El nombre y la dirección deben tener al menos 3 caracteres.';
    return null;
  };

  const requestSave = (event) => {
    event.preventDefault();
    if (!selectedId) return;
    const error = validate();
    if (error) { showToast(error); return; }
    setConfirmOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (selectedId === 'new') {
        const payload = { ...form, latitud: lat, longitud: lng, radio_metros: 50 };
        await request(`/ubicaciones`, { method: 'POST', body: JSON.stringify(payload) });
        showToast('Nueva ubicación creada correctamente.');
      } else {
        await request(`/ubicaciones/${selectedId}/coordenadas`, { method: 'PUT', body: JSON.stringify({ ...form, latitud: lat, longitud: lng }) });
        showToast('Ubicación y coordenadas actualizadas.');
      }
      setSelectedId('');
      setForm({ nombre: '', direccion: '', latitud: '', longitud: '', tipo: 'GENERAL' });
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No fue posible guardar.');
    } finally { setSaving(false); }
  };

  const hasPoint = form.latitud !== '' && form.longitud !== '' && Number.isFinite(Number(form.latitud)) && Number.isFinite(Number(form.longitud));
  const point = hasPoint ? [Number(form.latitud), Number(form.longitud)] : [-3.97245, -79.19933];

  return <div className="space-y-5">
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      Corrige lugares seguros y servicios de emergencia con un clic, arrastrando el marcador, mediante búsqueda o GPS. Cada cambio queda auditado.
    </section>
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <form onSubmit={save} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-xs font-bold">Ubicación<select value={selectedId} onChange={(event) => choose(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border p-2"><option value="">Selecciona…</option><option value="new" className="font-bold text-purple-700">+ Crear nueva ubicación</option>{locations.map((item) => <option key={item.id_ubicacion} value={item.id_ubicacion}>{item.nombre}</option>)}</select></label>
        <label className="block text-xs font-bold">Nombre<input value={form.nombre} required onChange={(event) => setForm((value) => ({ ...value, nombre: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="block text-xs font-bold">Dirección<input value={form.direccion} required onChange={(event) => setForm((value) => ({ ...value, direccion: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="block text-xs font-bold">Tipo<select value={form.tipo} onChange={(event) => setForm((value) => ({ ...value, tipo: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3"><option value="GENERAL">General</option><option value="LUGAR_SEGURO">Lugar Seguro</option><option value="SERVICIO_EMERGENCIA">Servicio de Emergencia</option></select></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-bold">Latitud<input type="number" step="any" inputMode="decimal" value={form.latitud} onChange={(event) => setForm((value) => ({ ...value, latitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2" /></label>
          <label className="text-xs font-bold">Longitud<input type="number" step="any" inputMode="decimal" value={form.longitud} onChange={(event) => setForm((value) => ({ ...value, longitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2" /></label>
        </div>
        <label className="block text-xs font-bold">Dirección<input required minLength="3" maxLength="255" value={form.direccion} onChange={(event) => setForm((value) => ({ ...value, direccion: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3 dark:bg-[#2B2B2F]" /></label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-xs font-bold">Latitud<input required type="number" step="any" min="-90" max="90" inputMode="decimal" value={form.latitud} onChange={(event) => setForm((value) => ({ ...value, latitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2 dark:bg-[#2B2B2F]" /></label>
          <label className="text-xs font-bold">Longitud<input required type="number" step="any" min="-180" max="180" inputMode="decimal" value={form.longitud} onChange={(event) => setForm((value) => ({ ...value, longitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2 dark:bg-[#2B2B2F]" /></label>
        </div>
        <button type="button" onClick={useGps} disabled={!selectedId} className="min-h-11 w-full rounded-xl border border-purple-300 font-bold text-purple-900 disabled:opacity-50">Usar mi ubicación GPS</button>
        <button disabled={!selectedId || saving} className="min-h-11 w-full rounded-xl bg-purple-900 font-bold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Confirmar coordenadas'}</button>
      </form>
      <div className="h-[560px] overflow-hidden rounded-2xl border border-slate-200 relative group">
        <MapaInteractivo onClick={handleMapClick} centro={point} zoom={18} markers={selectedId ? [{ position: point, title: form.nombre || 'Ubicación seleccionada' }] : []} />
        {!selectedId && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center pointer-events-none"><span className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-xl">Selecciona o crea una ubicación para editar en el mapa</span></div>}
      </div>
    </div>
    <section className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-slate-100"><tr><th className="p-3">Lugar</th><th className="p-3">Tipo</th><th className="p-3">Estado</th><th className="p-3">Dirección</th><th className="p-3">Latitud</th><th className="p-3">Longitud</th><th className="p-3">Acción</th></tr></thead><tbody>{locations.map((item) => <tr key={item.id_ubicacion} className="border-t"><td className="p-3 font-bold">{item.nombre}</td><td className="p-3">{item.tipo || item.categoria}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[9px] font-black ${Number(item.verificada) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{item.estado || (Number(item.verificada) ? 'VERIFICADA' : 'POR REVISAR')}</span></td><td className="p-3">{item.direccion}</td><td className="p-3">{item.latitud ?? '—'}</td><td className="p-3">{item.longitud ?? '—'}</td><td className="p-3"><button type="button" onClick={() => choose(item.id_ubicacion)} className="min-h-11 rounded-xl border border-purple-300 px-3 font-bold text-purple-900">Editar ubicación</button></td></tr>)}</tbody></table></section>
    <ConfirmDialog open={confirmOpen} title="Guardar nueva ubicación" message={`Se actualizarán las coordenadas de ${form.nombre} a ${form.latitud}, ${form.longitud}. El cambio quedará auditado.`} confirmText="Guardar ubicación" busy={saving} onClose={() => setConfirmOpen(false)} onConfirm={save} />
  </div>;
}
