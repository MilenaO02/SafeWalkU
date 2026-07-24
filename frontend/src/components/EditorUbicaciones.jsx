import React, { useCallback, useEffect, useState } from 'react';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { request } from '../services/api';
import { useAuth } from '../context/auth';

function ClickToLocate({ onPoint }) {
  useMapEvents({ click: ({ latlng }) => onPoint([latlng.lat, latlng.lng]) });
  return null;
}

function CenterMap({ point }) {
  const map = useMap();
  useEffect(() => { if (point) map.setView(point, 18); }, [map, point]);
  return null;
}

export default function EditorUbicaciones() {
  const { showToast } = useAuth();
  const [locations, setLocations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [form, setForm] = useState({ nombre: '', direccion: '', latitud: '', longitud: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await request('/ubicaciones');
    setLocations(response.data || []);
  }, []);
  useEffect(() => { load().catch(() => showToast('No se pudieron cargar las ubicaciones.')); }, [load, showToast]);

  const choose = (id) => {
    setSelectedId(String(id));
    const location = locations.find((item) => item.id_ubicacion === Number(id));
    if (!location) return;
    setForm({ nombre: location.nombre, direccion: location.direccion, latitud: String(location.latitud), longitud: String(location.longitud) });
  };
  const point = Number.isFinite(Number(form.latitud)) && Number.isFinite(Number(form.longitud)) ? [Number(form.latitud), Number(form.longitud)] : [-3.97245, -79.19933];

  const save = async (event) => {
    event.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      await request(`/ubicaciones/${selectedId}/coordenadas`, { method: 'PUT', body: JSON.stringify({ ...form, latitud: Number(form.latitud), longitud: Number(form.longitud) }) });
      showToast('Ubicación y coordenadas guardadas en MySQL.');
      await load();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'No fue posible guardar.');
    } finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      Selecciona un lugar y haz clic exactamente sobre su posición en el mapa. La corrección se guarda en la base de datos y se usará en búsquedas, marcadores y rutas.
    </section>
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <form onSubmit={save} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
        <label className="block text-xs font-bold">Ubicación<select value={selectedId} onChange={(event) => choose(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border p-2"><option value="">Selecciona…</option>{locations.map((item) => <option key={item.id_ubicacion} value={item.id_ubicacion}>{item.nombre}</option>)}</select></label>
        <label className="block text-xs font-bold">Nombre<input value={form.nombre} onChange={(event) => setForm((value) => ({ ...value, nombre: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <label className="block text-xs font-bold">Dirección<input value={form.direccion} onChange={(event) => setForm((value) => ({ ...value, direccion: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-3" /></label>
        <div className="grid grid-cols-2 gap-2"><label className="text-xs font-bold">Latitud<input value={form.latitud} onChange={(event) => setForm((value) => ({ ...value, latitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2" /></label><label className="text-xs font-bold">Longitud<input value={form.longitud} onChange={(event) => setForm((value) => ({ ...value, longitud: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-2" /></label></div>
        <button disabled={!selectedId || saving} className="min-h-11 w-full rounded-xl bg-purple-900 font-bold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar coordenadas'}</button>
      </form>
      <div className="h-[560px] overflow-hidden rounded-2xl border border-slate-200">
        <MapContainer center={point} zoom={18} className="h-full w-full"><CenterMap point={point} /><ClickToLocate onPoint={([lat, lng]) => setForm((value) => ({ ...value, latitud: lat.toFixed(7), longitud: lng.toFixed(7) }))} /><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />{selectedId && <CircleMarker center={point} radius={9} pathOptions={{ color: '#4a208c', fillOpacity: 1 }}><Popup>{form.nombre || 'Ubicación seleccionada'}</Popup></CircleMarker>}</MapContainer>
      </div>
    </div>
    <section className="overflow-x-auto rounded-2xl border bg-white"><table className="w-full text-left text-xs"><thead className="bg-slate-100"><tr><th className="p-3">Lugar</th><th className="p-3">Estado</th><th className="p-3">Dirección</th><th className="p-3">Latitud</th><th className="p-3">Longitud</th></tr></thead><tbody>{locations.map((item) => <tr key={item.id_ubicacion} onClick={() => choose(item.id_ubicacion)} className="cursor-pointer border-t hover:bg-purple-50"><td className="p-3 font-bold">{item.nombre}</td><td className="p-3"><span className={`rounded-full px-2 py-1 text-[9px] font-black ${Number(item.verificada) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{Number(item.verificada) ? 'VERIFICADA' : 'POR REVISAR'}</span></td><td className="p-3">{item.direccion}</td><td className="p-3">{item.latitud}</td><td className="p-3">{item.longitud}</td></tr>)}</tbody></table></section>
  </div>;
}
