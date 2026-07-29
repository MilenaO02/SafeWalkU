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
    const location = locations.find((item) => item.id_ubicacion === Number(id));
    if (!location) return;
    setForm({
      nombre: location.nombre || '', direccion: location.direccion || '',
      latitud: location.latitud == null ? '' : String(location.latitud),
      longitud: location.longitud == null ? '' : String(location.longitud)
    });
    setQuery('');
    setSuggestions([]);
  };

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
      const response = await request(`/ubicaciones/${selectedId}/coordenadas`, {
        method: 'PUT',
        body: JSON.stringify({
          nombre: form.nombre.trim(), direccion: form.direccion.trim(),
          latitud: Number(form.latitud), longitud: Number(form.longitud)
        })
      });
      setLocations((items) => items.map((item) => item.id_ubicacion === Number(selectedId) ? response.data : item));
      showToast('Ubicación guardada y registrada en la auditoría.');
      setConfirmOpen(false);
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
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={requestSave} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:bg-[#242428] dark:border-[#4A4A50]">
        <label className="block text-xs font-bold">Ubicación<select required value={selectedId} onChange={(event) => choose(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border p-2 dark:bg-[#2B2B2F]"><option value="">Selecciona…</option>{locations.map((item) => <option key={item.id_ubicacion} value={item.id_ubicacion}>{item.nombre}</option>)}</select></label>
        <label className="block text-xs font-bold">Nombre<input required minLength="3" maxLength="100" value={form.nombre} onChange={(event) => setForm((value) => ({ ...value, nombre: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3 dark:bg-[#2B2B2F]" /></label>
        <div className="relative">
          <label htmlFor="admin-place-search" className="block text-xs font-bold">Buscar dirección</label>
          <input id="admin-place-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hospital, UPC, calle…" autoComplete="off" className="mt-1 min-h-11 w-full rounded-xl border px-3 dark:bg-[#2B2B2F]" />
          {searching && <span className="absolute right-3 top-9 text-[10px] font-bold text-purple-700">Buscando…</span>}
          {suggestions.length > 0 && <ul className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border bg-white shadow-xl dark:bg-[#2B2B2F]">{suggestions.map((prediction) => <li key={prediction.placeId}><button type="button" onClick={() => selectSuggestion(prediction)} className="min-h-11 w-full border-b px-3 py-2 text-left text-xs hover:bg-purple-50"><strong>{prediction.structuredFormat?.mainText?.text || prediction.text?.text}</strong><span className="block text-[10px] text-slate-500">{prediction.structuredFormat?.secondaryText?.text}</span></button></li>)}</ul>}
        </div>
        <label className="block text-xs font-bold">Dirección<input required minLength="3" maxLength="255" value={form.direccion} onChange={(event) => setForm((value) => ({ ...value, direccion: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3 dark:bg-[#2B2B2F]" /></label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className="text-xs font-bold">Latitud<input required type="number" step="any" min="-90" max="90" inputMode="decimal" value={form.latitud} onChange={(event) => setForm((value) => ({ ...value, latitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2 dark:bg-[#2B2B2F]" /></label>
          <label className="text-xs font-bold">Longitud<input required type="number" step="any" min="-180" max="180" inputMode="decimal" value={form.longitud} onChange={(event) => setForm((value) => ({ ...value, longitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2 dark:bg-[#2B2B2F]" /></label>
        </div>
        <button type="button" onClick={useGps} disabled={!selectedId} className="min-h-11 w-full rounded-xl border border-purple-300 font-bold text-purple-900 disabled:opacity-50">Usar mi ubicación GPS</button>
        <button disabled={!selectedId || saving} className="min-h-11 w-full rounded-xl bg-purple-900 font-bold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Confirmar coordenadas'}</button>
      </form>
      <div className="h-[420px] overflow-hidden rounded-2xl border border-slate-200 md:h-[560px]">
        <MapaInteractivo centro={point} zoom={hasPoint ? 18 : 14} onMapClick={selectedId ? setPoint : null} markers={selectedId && hasPoint ? [{ id: `editable-${selectedId}`, position: point, title: form.nombre || 'Ubicación seleccionada', kind: 'editable', draggable: true, onPositionChange: setPoint }] : []} />
      </div>
    </div>
    <section className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[860px] text-left text-xs"><thead className="bg-slate-100"><tr><th className="p-3">Lugar</th><th className="p-3">Tipo</th><th className="p-3">Estado</th><th className="p-3">Dirección</th><th className="p-3">Latitud</th><th className="p-3">Longitud</th><th className="p-3">Acción</th></tr></thead><tbody>{locations.map((item) => <tr key={item.id_ubicacion} className="border-t"><td className="p-3 font-bold">{item.nombre}</td><td className="p-3">{item.tipo || item.categoria}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[9px] font-black ${Number(item.verificada) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{item.estado || (Number(item.verificada) ? 'VERIFICADA' : 'POR REVISAR')}</span></td><td className="p-3">{item.direccion}</td><td className="p-3">{item.latitud ?? '—'}</td><td className="p-3">{item.longitud ?? '—'}</td><td className="p-3"><button type="button" onClick={() => choose(item.id_ubicacion)} className="min-h-11 rounded-xl border border-purple-300 px-3 font-bold text-purple-900">Editar ubicación</button></td></tr>)}</tbody></table></section>
    <ConfirmDialog open={confirmOpen} title="Guardar nueva ubicación" message={`Se actualizarán las coordenadas de ${form.nombre} a ${form.latitud}, ${form.longitud}. El cambio quedará auditado.`} confirmText="Guardar ubicación" busy={saving} onClose={() => setConfirmOpen(false)} onConfirm={save} />
  </div>;
}
