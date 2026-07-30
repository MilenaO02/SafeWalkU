import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../services/api';
import { useAuth } from '../context/auth';
import MapaInteractivo from './MapaInteractivo';
import ConfirmDialog from './ConfirmDialog';

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
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Search queries for Google Places
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      const [locationResponse, routeResponse] = await Promise.all([request('/ubicaciones'), request('/routes')]);
      setLocations((locationResponse.data || []).filter((item) => Number.isFinite(Number(item.latitud)) && Number.isFinite(Number(item.longitud))));
      setRoutes(routeResponse.data || []);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Error al cargar datos');
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const selectedOriginLoc = locations.find((item) => item.id_ubicacion === Number(form.origen));

  const mapCenter = points[0] || (selectedOriginLoc ? [Number(selectedOriginLoc.latitud), Number(selectedOriginLoc.longitud)] : fallbackCenter);
  const totalDistance = useMemo(() => Math.round(distanceMeters(points)), [points]);

  const reset = () => {
    setForm(emptyForm);
    setPoints([]);
    setEditingId(null);
    setError(null);
    setOriginSearch('');
    setDestSearch('');
    setIsModalOpen(false);
  };

  // 1. Set Origin / Destination from Registered DB Location
  const handleSelectOriginDb = (idStr) => {
    setForm((v) => ({ ...v, origen: idStr }));
    const loc = locations.find((item) => item.id_ubicacion === Number(idStr));
    if (loc) {
      const p = [Number(loc.latitud), Number(loc.longitud)];
      setPoints((curr) => {
        if (curr.length === 0) return [p];
        const copy = [...curr];
        copy[0] = p;
        return copy;
      });
    }
  };

  const handleSelectDestDb = (idStr) => {
    setForm((v) => ({ ...v, destino: idStr }));
    const loc = locations.find((item) => item.id_ubicacion === Number(idStr));
    if (loc) {
      const p = [Number(loc.latitud), Number(loc.longitud)];
      setPoints((curr) => {
        if (curr.length === 0) return [fallbackCenter, p];
        if (curr.length === 1) return [curr[0], p];
        const copy = [...curr];
        copy[copy.length - 1] = p;
        return copy;
      });
    }
  };

  // 2. Set Origin / Destination via GPS
  const handleGpsForPoint = (target) => {
    if (!navigator.geolocation) {
      showToast('Este navegador no permite obtener la ubicación GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const p = [coords.latitude, coords.longitude];
        if (target === 'origin') {
          setPoints((curr) => {
            if (curr.length === 0) return [p];
            const copy = [...curr];
            copy[0] = p;
            return copy;
          });
          showToast('Origen establecido por GPS.');
        } else {
          setPoints((curr) => {
            if (curr.length === 0) return [fallbackCenter, p];
            if (curr.length === 1) return [curr[0], p];
            const copy = [...curr];
            copy[copy.length - 1] = p;
            return copy;
          });
          showToast('Destino establecido por GPS.');
        }
      },
      () => showToast('No se pudo obtener el GPS. Revisa el permiso de ubicación del navegador.'),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // 3. Set Origin / Destination via Google Places Search
  const searchPlaceForPoint = async (target, query) => {
    if (!query.trim()) return;
    if (window.google?.maps?.Geocoder) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        const response = await geocoder.geocode({ address: query.trim() + ', Loja, Ecuador' });
        if (response.results?.[0]) {
          const loc = response.results[0].geometry.location;
          const p = [loc.lat(), loc.lng()];
          if (target === 'origin') {
            setPoints((curr) => {
              if (curr.length === 0) return [p];
              const copy = [...curr];
              copy[0] = p;
              return copy;
            });
            showToast('Origen actualizado con Google Places.');
          } else {
            setPoints((curr) => {
              if (curr.length === 0) return [fallbackCenter, p];
              if (curr.length === 1) return [curr[0], p];
              const copy = [...curr];
              copy[copy.length - 1] = p;
              return copy;
            });
            showToast('Destino actualizado con Google Places.');
          }
        } else {
          showToast('No se encontraron resultados para esa dirección.');
        }
      } catch {
        showToast('Error al buscar el lugar.');
      }
    } else {
      showToast('API de Google Maps no disponible.');
    }
  };

  // 4. Map Clicks: 1st click = Origin, 2nd click = Destination, subsequent = intermediate/extend
  const handleMapClick = (coords) => {
    const newPoint = [coords.lat, coords.lng];
    setPoints((curr) => [...curr, newPoint]);
  };

  // 5. Drag marker update
  const handleMarkerDrag = (index, newLat, newLng) => {
    setPoints((curr) => {
      const copy = [...curr];
      if (copy[index]) {
        copy[index] = [newLat, newLng];
      }
      return copy;
    });
  };

  const save = async (event) => {
    event.preventDefault();
    setError(null);

    if (points.length < 2) {
      setError('Fija al menos un punto de Origen y un punto de Destino haciendo clic en el mapa o mediante GPS/Búsqueda.');
      return;
    }

    setStatus('saving');
    const originLocId = form.origen ? Number(form.origen) : locations[0]?.id_ubicacion;
    const destLocId = form.destino ? Number(form.destino) : locations[1]?.id_ubicacion || locations[0]?.id_ubicacion;

    const payload = {
      nombre_ruta: form.nombre_ruta.trim(),
      descripcion: form.descripcion.trim() || undefined,
      nivel_seguridad: form.nivel_seguridad,
      tiempo_estimado: Number(form.tiempo_estimado),
      ubicaciones: [originLocId, destLocId].filter(Boolean),
      puntos: points.map(([latitud, longitud], index) => ({
        latitud,
        longitud,
        tipo: index === 0 ? 'INICIO' : index === points.length - 1 ? 'DESTINO' : 'INTERMEDIO'
      }))
    };

    try {
      await request(editingId ? `/routes/${editingId}` : '/routes', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      showToast(editingId ? 'Ruta actualizada correctamente.' : 'Ruta guardada correctamente.');
      reset();
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Error al guardar la ruta.');
      setStatus('ready');
    }
  };

  const edit = async (route) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await request(`/routes/${route.id_ruta}`);
      const detail = response.data;
      setEditingId(detail.id_ruta);
      const legacyPoints = detail.puntos || [];
      setForm({
        nombre_ruta: detail.nombre_ruta,
        descripcion: detail.descripcion || '',
        nivel_seguridad: detail.nivel_seguridad,
        tiempo_estimado: detail.tiempo_estimado,
        origen: String(legacyPoints[0]?.id_ubicacion || ''),
        destino: String(legacyPoints[legacyPoints.length - 1]?.id_ubicacion || '')
      });
      setPoints((detail.trazado || []).map((point) => [Number(point.latitud), Number(point.longitud)]));
      setStatus('ready');
      setIsModalOpen(true);
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'Error al cargar detalles');
      setStatus('ready');
    }
  };

  const remove = async (route) => {
    setPendingDelete(route);
  };

  const confirmRemove = async () => {
    const route = pendingDelete;
    if (!route) return;
    try {
      await request(`/routes/${route.id_ruta}`, { method: 'DELETE' });
      showToast('Ruta eliminada correctamente.');
      setPendingDelete(null);
      await load();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'No fue posible eliminar la ruta.');
      setPendingDelete(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-purple-950 md:text-2xl">Editor de rutas seguras</h2>
          <p className="mt-1 text-sm text-slate-500">Selecciona Origen y Destino mediante GPS, Google Places o haciendo clic directo en el mapa.</p>
        </div>
        <button
          onClick={() => {
            reset();
            setIsModalOpen(true);
          }}
          className="whitespace-nowrap rounded-xl bg-purple-900 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-purple-950"
        >
          + Nueva ruta
        </button>
      </header>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <h3 className="text-lg font-black text-purple-950">{editingId ? `Editar ruta #${editingId}` : 'Nueva ruta segura'}</h3>
              <button onClick={reset} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-5">
              {error && <div className="mb-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

              <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
                <form onSubmit={save} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                  <label className="block text-xs font-bold text-slate-700">
                    Nombre de la Ruta
                    <input
                      required
                      minLength={3}
                      maxLength={100}
                      value={form.nombre_ruta}
                      onChange={(e) => setForm((v) => ({ ...v, nombre_ruta: e.target.value }))}
                      className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </label>

                  <label className="block text-xs font-bold text-slate-700">
                    Descripción
                    <textarea
                      maxLength={255}
                      value={form.descripcion}
                      onChange={(e) => setForm((v) => ({ ...v, descripcion: e.target.value }))}
                      className="mt-1 min-h-16 w-full rounded-xl border border-slate-200 p-3 text-xs"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold text-slate-700">
                      Nivel Seguridad
                      <select
                        value={form.nivel_seguridad}
                        onChange={(e) => setForm((v) => ({ ...v, nivel_seguridad: e.target.value }))}
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-xs"
                      >
                        <option value="ALTO">ALTO</option>
                        <option value="MEDIO">MEDIO</option>
                        <option value="BAJO">BAJO</option>
                      </select>
                    </label>
                    <label className="text-xs font-bold text-slate-700">
                      Tiempo Est. (Min)
                      <input
                        required
                        type="number"
                        min="1"
                        max="1440"
                        value={form.tiempo_estimado}
                        onChange={(e) => setForm((v) => ({ ...v, tiempo_estimado: Number(e.target.value) }))}
                        className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-xs"
                      />
                    </label>
                  </div>

                  {/* ORIGEN selection block */}
                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs">
                    <span className="font-bold text-blue-900">📍 Origen (3 opciones):</span>
                    <div className="mt-2 flex flex-col gap-2">
                      <select
                        value={form.origen}
                        onChange={(e) => handleSelectOriginDb(e.target.value)}
                        className="min-h-9 w-full rounded-lg border border-slate-200 px-2 bg-white text-xs"
                      >
                        <option value="">A) Ubicación registrada en BD...</option>
                        {locations.map((item) => (
                          <option key={item.id_ubicacion} value={item.id_ubicacion}>
                            {item.nombre}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="C) Google Places..."
                          value={originSearch}
                          onChange={(e) => setOriginSearch(e.target.value)}
                          className="min-h-9 w-full rounded-lg border border-slate-200 px-2 bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => searchPlaceForPoint('origin', originSearch)}
                          className="rounded-lg bg-blue-900 px-2.5 text-white font-bold text-[11px]"
                        >
                          Buscar
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGpsForPoint('origin')}
                        className="min-h-9 w-full rounded-lg border border-blue-300 bg-white font-bold text-blue-900 hover:bg-blue-100"
                      >
                        B) 📍 Usar mi GPS como Origen
                      </button>
                    </div>
                  </div>

                  {/* DESTINO selection block */}
                  <div className="rounded-xl border border-green-100 bg-green-50/50 p-3 text-xs">
                    <span className="font-bold text-green-900">🏁 Destino (3 opciones):</span>
                    <div className="mt-2 flex flex-col gap-2">
                      <select
                        value={form.destino}
                        onChange={(e) => handleSelectDestDb(e.target.value)}
                        className="min-h-9 w-full rounded-lg border border-slate-200 px-2 bg-white text-xs"
                      >
                        <option value="">A) Ubicación registrada en BD...</option>
                        {locations.map((item) => (
                          <option key={item.id_ubicacion} value={item.id_ubicacion}>
                            {item.nombre}
                          </option>
                        ))}
                      </select>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="C) Google Places..."
                          value={destSearch}
                          onChange={(e) => setDestSearch(e.target.value)}
                          className="min-h-9 w-full rounded-lg border border-slate-200 px-2 bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => searchPlaceForPoint('destination', destSearch)}
                          className="rounded-lg bg-green-900 px-2.5 text-white font-bold text-[11px]"
                        >
                          Buscar
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGpsForPoint('destination')}
                        className="min-h-9 w-full rounded-lg border border-green-300 bg-white font-bold text-green-900 hover:bg-green-100"
                      >
                        B) 📍 Usar mi GPS como Destino
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!points.length}
                      onClick={() => setPoints((p) => p.slice(0, -1))}
                      className="min-h-10 rounded-xl border border-slate-200 text-xs font-bold disabled:opacity-40"
                    >
                      Deshacer punto
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoints([])}
                      className="min-h-10 rounded-xl border border-red-200 text-xs font-bold text-red-700"
                    >
                      Limpiar trazado
                    </button>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                    <b>{points.length}</b> puntos fijados · <b>{totalDistance} m</b>
                    <p className="mt-1 text-[11px] text-purple-700">
                      👉 1er clic en mapa = Origen, 2do clic = Destino. Arrastra los marcadores para corregirlos.
                    </p>
                  </div>

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="min-h-11 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={status === 'saving'}
                      className="min-h-11 rounded-xl bg-purple-900 text-xs font-bold text-white shadow disabled:opacity-50 hover:bg-purple-950"
                    >
                      {status === 'saving' ? 'Guardando…' : 'Guardar ruta'}
                    </button>
                  </div>
                </form>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 relative">
                  <div className="h-[520px] min-h-[360px] xl:h-full">
                    <MapaInteractivo
                      key={`${mapCenter[0]}-${mapCenter[1]}-${editingId || 'new'}`}
                      centro={mapCenter}
                      zoom={17}
                      polyline={points}
                      onClick={handleMapClick}
                      markers={points.map((pt, idx) => ({
                        position: pt,
                        title: idx === 0 ? '📍 ORIGEN' : idx === points.length - 1 ? '🏁 DESTINO' : `Punto ${idx + 1}`,
                        kind: idx === 0 ? 'user' : idx === points.length - 1 ? 'destination' : 'editable',
                        draggable: true,
                        onPositionChange: ([lat, lng]) => handleMarkerDrag(idx, lat, lng)
                      }))}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-black text-purple-950">Rutas registradas</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {routes.map((route) => (
            <article key={route.id_ruta} className="rounded-xl border border-slate-200 p-4 hover:border-purple-200">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800">{route.nombre_ruta}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {route.nivel_seguridad} · {route.tiempo_estimado} min · {route.total_puntos} puntos
                  </p>
                </div>
                <span
                  className={`h-fit rounded-lg px-2 py-1 text-[10px] font-black ${
                    Number(route.total_puntos) >= 2 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {Number(route.total_puntos) >= 2 ? 'TRAZADA' : 'REFERENCIAL'}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => edit(route)}
                  className="min-h-10 flex-1 rounded-xl bg-purple-50 text-xs font-bold text-purple-900 hover:bg-purple-100"
                >
                  Editar ruta
                </button>
                <button
                  onClick={() => remove(route)}
                  className="min-h-10 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))}
          {status === 'ready' && !routes.length && <p className="text-sm text-slate-500">No hay rutas registradas.</p>}
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar ruta"
        message={pendingDelete ? `¿Deseas eliminar la ruta "${pendingDelete.nombre_ruta}"?` : ''}
        confirmText="Eliminar"
        danger
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmRemove}
      />
    </div>
  );
}
