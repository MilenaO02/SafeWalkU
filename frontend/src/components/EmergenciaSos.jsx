import React, { useEffect, useState } from 'react';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';

export default function SafeWalkSOS() {
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    Promise.all([request('/contacts'), request('/ubicaciones')]).then(([contactResponse, locationResponse]) => {
      if (!active) return;
      setContacts(contactResponse.data || []); setLocations(locationResponse.data || []); setStatus('ready');
    }).catch((loadError) => { if (active) { setError(loadError.message); setStatus('error'); } });
    return () => { active = false; setMapConfig(defaultMapConfig); };
  }, [setMapConfig, defaultMapConfig]);

  const changeLocation = (value) => {
    setLocationId(value);
    const location = locations.find((item) => String(item.id_ubicacion) === value);
    if (location && Number.isFinite(Number(location.latitud)) && Number.isFinite(Number(location.longitud))) {
      const point = [Number(location.latitud), Number(location.longitud)];
      setMapConfig({ centro: point, zoom: 18, markers: [{ position: point, title: location.nombre, desc: 'Ubicación seleccionada para la alerta' }], circle: { center: point, radius: 60, color: '#ef4444' } });
    }
  };

  const activate = async () => {
    if (!locationId) { setError('Selecciona tu ubicación aproximada antes de activar el SOS.'); return; }
    if (!window.confirm('¿Activar la alerta SOS? La acción quedará registrada.')) return;
    setStatus('submitting'); setError(null);
    try {
      const response = await request('/reports/sos', { method: 'POST', body: JSON.stringify({ descripcion: 'Alerta SOS activada desde la web móvil', id_ubicacion: Number(locationId) }) });
      setActiveId(response.data.id_reporte); setStatus('active');
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } catch (actionError) { setError(actionError.message); setStatus('ready'); }
  };

  const cancel = async () => {
    if (!activeId) return;
    setStatus('submitting');
    try { await request(`/reports/sos/${activeId}/cancelar`, { method: 'PUT' }); setActiveId(null); setStatus('ready'); }
    catch (actionError) { setError(actionError.message); setStatus('active'); }
  };

  return <div className="space-y-5 text-center">
    <div><h1 className="text-xl font-black uppercase text-red-600">Botón SOS</h1><p className="mt-1 text-xs text-slate-500">Registra una alerta en SafeWalk U. Ante peligro inmediato, llama también al ECU 911.</p></div>
    <label className="block text-left text-xs font-bold">Ubicación aproximada<select value={locationId} disabled={status === 'loading' || status === 'active'} onChange={(event) => changeLocation(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4"><option value="">Selecciona un punto cercano</option>{locations.map((location) => <option key={location.id_ubicacion} value={location.id_ubicacion}>{location.nombre}</option>)}</select></label>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
    {!activeId ? <button disabled={status === 'loading' || status === 'submitting'} onClick={activate} className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border-4 border-white bg-red-600 text-2xl font-black text-white shadow-xl ring-8 ring-red-100 disabled:opacity-50">{status === 'submitting' ? 'Enviando…' : 'AUXILIO'}</button> : <div className="rounded-3xl bg-red-600 p-6 text-white"><h2 className="text-xl font-black">ALERTA REGISTRADA</h2><p className="mt-2 text-xs">La alerta está pendiente de atención en el sistema.</p><button disabled={status === 'submitting'} onClick={cancel} className="mt-5 min-h-11 rounded-xl bg-white px-6 text-xs font-black text-red-700">Cancelar alerta</button></div>}
    <section className="space-y-2 text-left"><h2 className="text-xs font-black uppercase text-slate-500">Contactos personales</h2>{contacts.map((contact) => <a key={contact.id_contacto} href={`tel:${String(contact.telefono).replace(/[^+\d]/g, '')}`} className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold"><span>{contact.nombre} · {contact.parentesco}</span><span className="material-symbols-outlined">call</span></a>)}{status !== 'loading' && !contacts.length && <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No tienes contactos registrados. Puedes usar la sección Apoyo.</p>}</section>
  </div>;
}
