import React, { useCallback, useEffect, useState } from 'react';
import { request } from '../services/api';
import { useAuth } from '../context/auth';
import MapaInteractivo from './MapaInteractivo';
import ConfirmDialog from './ConfirmDialog';
import { formatLabel } from '../utils/formatLabel';

const fallbackCenter = [-3.97245, -79.19933];
const parseCoordinate = (value) => Number(String(value ?? '').trim().replace(',', '.'));
const newSessionToken = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function EditorUbicaciones() {
  const { showToast } = useAuth();
  const [locations, setLocations] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ nombre: '', direccion: '', latitud: '', longitud: '', tipo: 'GENERAL' });
  const [searchQuery, setSearchQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState([]);
  const [placeSearching, setPlaceSearching] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [placeSessionToken, setPlaceSessionToken] = useState(newSessionToken);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteImpact, setDeleteImpact] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await request('/ubicaciones');
      setLocations(response.data || []);
    } catch {
      showToast('No se pudieron cargar las ubicaciones.');
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setSelectedId('new');
    setForm({ nombre: '', direccion: '', latitud: '-3.97245000', longitud: '-79.19933000', tipo: 'CALLE' });
    setSearchQuery('');
    setPlaceSuggestions([]);
    setPlaceError('');
    setIsModalOpen(true);
  };

  const openEdit = (location) => {
    setSelectedId(String(location.id_ubicacion));
    setForm({
      nombre: location.nombre || '',
      direccion: location.direccion || '',
      latitud: String(location.latitud ?? -3.97245),
      longitud: String(location.longitud ?? -79.19933),
      tipo: location.tipo_zona || location.tipo || 'GENERAL'
    });
    setSearchQuery('');
    setPlaceSuggestions([]);
    setPlaceError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId('');
  };

  const reverseGeocode = useCallback(async (lat, lng) => {
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ location: { lat, lng } });
        if (response.results?.[0]?.formatted_address) {
          setForm((prev) => ({ ...prev, direccion: response.results[0].formatted_address }));
        }
      } catch (err) {
        console.warn('Geocoding inverso falló:', err);
      }
    }
  }, []);

  const handleMapClick = (coords) => {
    const latStr = coords.lat.toFixed(8);
    const lngStr = coords.lng.toFixed(8);
    setForm((prev) => ({ ...prev, latitud: latStr, longitud: lngStr }));
    reverseGeocode(coords.lat, coords.lng);
  };

  const handleMarkerDrag = ([lat, lng]) => {
    const latStr = Number(lat).toFixed(8);
    const lngStr = Number(lng).toFixed(8);
    setForm((prev) => ({ ...prev, latitud: latStr, longitud: lngStr }));
    reverseGeocode(lat, lng);
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      showToast('Este navegador no soporta la ubicación GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const latStr = coords.latitude.toFixed(8);
        const lngStr = coords.longitude.toFixed(8);
        setForm((prev) => ({ ...prev, latitud: latStr, longitud: lngStr }));
        reverseGeocode(coords.latitude, coords.longitude);
        showToast('Ubicación GPS obtenida.');
      },
      () => showToast('No se pudo obtener el GPS. Revisa los permisos del navegador.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const input = searchQuery.trim();
    if (input.length < 2) {
      setPlaceSuggestions([]);
      setPlaceError('');
      return undefined;
    }
    const timer = setTimeout(async () => {
      setPlaceSearching(true);
      setPlaceError('');
      try {
        const response = await request('/maps/places/autocomplete', {
          method: 'POST',
          body: JSON.stringify({
            input,
            includedRegionCodes: ['ec'],
            languageCode: 'es',
            regionCode: 'EC',
            sessionToken: placeSessionToken,
            locationBias: { circle: { center: { latitude: fallbackCenter[0], longitude: fallbackCenter[1] }, radius: 30000 } }
          })
        });
        setPlaceSuggestions((response.data?.suggestions || []).map((item) => item.placePrediction).filter(Boolean));
      } catch {
        setPlaceSuggestions([]);
        setPlaceError('No fue posible consultar lugares en este momento. Inténtalo nuevamente.');
      } finally {
        setPlaceSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, placeSessionToken]);

  const selectPlace = async (prediction) => {
    setPlaceSearching(true);
    setPlaceError('');
    try {
      const response = await request('/maps/places/details', {
        method: 'POST',
        body: JSON.stringify({ place: prediction.place, sessionToken: placeSessionToken, languageCode: 'es' })
      });
      const place = response.data;
      const lat = Number(place?.location?.latitude);
      const lng = Number(place?.location?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('invalid_location');
      const name = place.displayName?.text || prediction.structuredFormat?.mainText?.text || prediction.text?.text || '';
      setForm((current) => ({ ...current, nombre: current.nombre || name, direccion: place.formattedAddress || current.direccion, latitud: lat.toFixed(8), longitud: lng.toFixed(8) }));
      setSearchQuery(name);
      setPlaceSuggestions([]);
      setPlaceSessionToken(newSessionToken());
      showToast('Ubicación encontrada en Google Places.');
    } catch {
      setPlaceError('No fue posible consultar lugares en este momento. Inténtalo nuevamente.');
    } finally {
      setPlaceSearching(false);
    }
  };

  const handleSearchAddress = (event) => {
    event.preventDefault();
    if (placeSuggestions[0]) selectPlace(placeSuggestions[0]);
  };

  const validate = () => {
    const lat = parseCoordinate(form.latitud);
    const lng = parseCoordinate(form.longitud);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return 'La latitud debe estar entre -90 y 90.';
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return 'La longitud debe estar entre -180 y 180.';
    if (form.nombre.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres.';
    if (form.direccion.trim().length < 3) return 'La dirección debe tener al menos 3 caracteres.';
    return null;
  };

  const requestSave = (event) => {
    event.preventDefault();
    const err = validate();
    if (err) {
      showToast(err);
      return;
    }
    setConfirmOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const latNum = parseCoordinate(form.latitud);
    const lngNum = parseCoordinate(form.longitud);

    try {
      if (selectedId === 'new') {
        const payload = {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
          latitud: latNum,
          longitud: lngNum,
          tipo: form.tipo,
          radio_metros: 50
        };
        await request('/ubicaciones', { method: 'POST', body: JSON.stringify(payload) });
        showToast('Nueva ubicación creada correctamente.');
      } else {
        const payload = {
          nombre: form.nombre.trim(),
          direccion: form.direccion.trim(),
          latitud: latNum,
          longitud: lngNum,
          tipo: form.tipo
        };
        await request(`/ubicaciones/${selectedId}/coordenadas`, { method: 'PUT', body: JSON.stringify(payload) });
        showToast('Ubicación actualizada correctamente.');
      }
      setConfirmOpen(false);
      closeModal();
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No fue posible guardar la ubicación.');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = async (location) => {
    setDeleteTarget(location);
    setDeleteImpact(null);
    setDeleteError('');
    try {
      const response = await request(`/ubicaciones/${location.id_ubicacion}/dependencias`);
      setDeleteImpact(response.data || null);
    } catch {
      setDeleteError('No se pudo comprobar si esta ubicación puede eliminarse. Inténtalo nuevamente.');
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await request(`/ubicaciones/${deleteTarget.id_ubicacion}`, { method: 'DELETE' });
      setLocations((items) => items.filter((item) => item.id_ubicacion !== deleteTarget.id_ubicacion));
      setDeleteTarget(null);
      setDeleteImpact(null);
      showToast('Ubicación desactivada. Se conserva su historial relacionado.');
    } catch {
      setDeleteError('No se puede eliminar esta ubicación en este momento. Inténtalo nuevamente.');
    } finally {
      setDeleting(false);
    }
  };

  const currentLat = Number(form.latitud);
  const currentLng = Number(form.longitud);
  const hasValidPoint = Number.isFinite(currentLat) && Number.isFinite(currentLng);
  const currentPoint = hasValidPoint ? [currentLat, currentLng] : fallbackCenter;
  const deleteMessage = deleteTarget ? (
    <span>
      La ubicación <strong>{deleteTarget.nombre}</strong> dejará de mostrarse en los listados activos.
      <span className="mt-2 block">Los datos relacionados se conservarán para mantener el historial del sistema.</span>
    </span>
  ) : '';

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-purple-950 md:text-2xl">Editor de ubicaciones</h2>
          <p className="mt-1 text-sm text-slate-500">Administra lugares seguros, servicios de emergencia y puntos clave del mapa.</p>
        </div>
        <button
          onClick={openNew}
          className="whitespace-nowrap rounded-xl bg-purple-900 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-purple-950"
        >
          + Nueva ubicación
        </button>
      </header>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-lg font-black text-purple-950">
                {selectedId === 'new' ? 'Crear nueva ubicación' : `Editar ubicación #${selectedId}`}
              </h3>
              <button onClick={closeModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
                <div className="flex flex-col gap-4">
                  {/* Google Places Search */}
                  <form onSubmit={handleSearchAddress} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <label className="block text-xs font-bold text-slate-700">Buscar dirección (Google Places)</label>
                    <div className="relative mt-1.5 flex gap-2">
                      <input
                        type="text"
                        placeholder="Ej. Av. Universitaria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="min-h-10 w-full rounded-xl border border-slate-200 px-3 text-xs"
                      />
                      <button type="submit" disabled={placeSearching || placeSuggestions.length === 0} className="rounded-xl bg-purple-900 px-3 text-xs font-bold text-white disabled:opacity-50">
                        {placeSearching ? 'Buscando…' : 'Usar'}
                      </button>
                      {placeSuggestions.length > 0 && <ul className="absolute left-0 top-full z-30 mt-1 max-h-48 w-[calc(100%-4.5rem)] overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl">{placeSuggestions.map((item) => <li key={item.placeId}><button type="button" onClick={() => selectPlace(item)} className="w-full border-b border-slate-100 px-3 py-2 text-left text-xs hover:bg-purple-50"><strong>{item.structuredFormat?.mainText?.text || item.text?.text}</strong><span className="block text-slate-500">{item.structuredFormat?.secondaryText?.text || ''}</span></button></li>)}</ul>}
                    </div>
                    {placeError && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{placeError}</p>}
                  </form>

                  <form onSubmit={requestSave} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nombre
                      <input
                        required
                        minLength={3}
                        value={form.nombre}
                        onChange={(e) => setForm((v) => ({ ...v, nombre: e.target.value }))}
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </label>

                    <label className="block text-xs font-bold text-slate-700">
                      Dirección
                      <input
                        required
                        minLength={3}
                        value={form.direccion}
                        onChange={(e) => setForm((v) => ({ ...v, direccion: e.target.value }))}
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      />
                    </label>

                    <label className="block text-xs font-bold text-slate-700">
                      Tipo de Ubicación
                      <select
                        value={form.tipo}
                        onChange={(e) => setForm((v) => ({ ...v, tipo: e.target.value }))}
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                      >
                        <option value="CALLE">General / Calle</option>
                        <option value="UNIVERSIDAD">Universidad</option>
                        <option value="PARQUE">Parque</option>
                        <option value="BARRIO">Barrio</option>
                        <option value="PARADERO">Paradero</option>
                        <option value="LUGAR_SEGURO">Lugar Seguro</option>
                        <option value="SERVICIO_EMERGENCIA">Servicio de Emergencia</option>
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs font-bold text-slate-700">
                        Latitud
                        <input
                          required
                          type="text"
                          inputMode="decimal"
                          value={form.latitud}
                          onChange={(e) => { const value = e.target.value.replace(',', '.'); if (/^-?\d*(\.\d*)?$/.test(value)) setForm((v) => ({ ...v, latitud: value })); }}
                          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 text-xs"
                        />
                      </label>
                      <label className="text-xs font-bold text-slate-700">
                        Longitud
                        <input
                          required
                          type="text"
                          inputMode="decimal"
                          value={form.longitud}
                          onChange={(e) => { const value = e.target.value.replace(',', '.'); if (/^-?\d*(\.\d*)?$/.test(value)) setForm((v) => ({ ...v, longitud: value })); }}
                          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-2 text-xs"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={useGps}
                      className="min-h-11 w-full rounded-xl border border-purple-300 bg-purple-50 text-xs font-bold text-purple-900 hover:bg-purple-100"
                    >
                      📍 Usar mi ubicación GPS
                    </button>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="min-h-11 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100"
                      >
                        Cancelar
                      </button>
                      <button
                        disabled={saving}
                        className="min-h-11 rounded-xl bg-purple-900 text-xs font-bold text-white shadow disabled:opacity-50 hover:bg-purple-950"
                      >
                        {saving ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="h-[480px] overflow-hidden rounded-2xl border border-slate-200 bg-white relative">
                  <MapaInteractivo
                    key={`${currentPoint[0]}-${currentPoint[1]}-${selectedId}`}
                    centro={currentPoint}
                    zoom={17}
                    onClick={handleMapClick}
                    markers={[
                      {
                        position: currentPoint,
                        title: form.nombre || 'Ubicación',
                        kind: 'editable',
                        draggable: true,
                        onPositionChange: handleMarkerDrag
                      }
                    ]}
                  />
                  <div className="absolute top-3 left-3 z-10 rounded-xl bg-slate-900/80 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
                    💡 Haz clic en el mapa o arrastra el marcador morado para mover las coordenadas
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-xs">
          <thead className="bg-slate-100 font-bold text-slate-700">
            <tr>
              <th className="p-3">Lugar</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Dirección</th>
              <th className="p-3">Latitud</th>
              <th className="p-3">Longitud</th>
              <th className="p-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {locations.map((item) => (
              <tr key={item.id_ubicacion} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 font-bold text-purple-950">{item.nombre}</td>
                <td className="p-3">{formatLabel(item.tipo_zona || item.tipo || item.categoria || 'GENERAL')}</td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[9px] font-black ${
                      Number(item.verificada) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {Number(item.verificada) ? 'VERIFICADA' : 'POR REVISAR'}
                  </span>
                </td>
                <td className="p-3 text-slate-600">{item.direccion}</td>
                <td className="p-3 font-mono text-slate-500">{item.latitud ?? '—'}</td>
                <td className="p-3 font-mono text-slate-500">{item.longitud ?? '—'}</td>
                <td className="p-3 text-right"><div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-xl border border-purple-300 px-3 py-1.5 text-xs font-bold text-purple-900 hover:bg-purple-50"
                  >
                    Editar ubicación
                  </button>
                  <button type="button" onClick={() => requestDelete(item)} className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">Eliminar</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Guardar ubicación"
        message={`¿Confirmas guardar la ubicación "${form.nombre}" en (${form.latitud}, ${form.longitud})?`}
        confirmText="Guardar"
        busy={saving}
        onClose={() => setConfirmOpen(false)}
        onConfirm={save}
      />
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar ubicación"
        message={deleteMessage}
        confirmText="Eliminar ubicación"
        busy={deleting}
        confirmDisabled={!deleteImpact || Boolean(deleteError)}
        danger
        error={deleteError}
        onClose={() => { if (!deleting) { setDeleteTarget(null); setDeleteImpact(null); setDeleteError(''); } }}
        onConfirm={remove}
      />
    </div>
  );
}
