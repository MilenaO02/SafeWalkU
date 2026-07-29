import React, { useEffect, useState } from 'react';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';

export default function EmergenciaSos() {
  const { setMapConfig, defaultMapConfig } = useMapConfig();

  const [contacts, setContacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  // ── Load contacts, locations and check for an existing active SOS ──────
  useEffect(() => {
    let active = true;

    Promise.all([
      request('/contacts'),
      request('/ubicaciones'),
      request('/reports'),
    ])
      .then(([contactRes, locationRes, reportRes]) => {
        if (!active) return;

        const loadedLocations = locationRes.data || [];
        const pendingSOS = (reportRes.data || []).find(
          (r) => r.tipo_reporte === 'SOS_PANICO' && r.estado === 'PENDIENTE'
        );

        setContacts(contactRes.data || []);
        setLocations(loadedLocations);

        if (pendingSOS) {
          const pendingLocId = String(pendingSOS.id_ubicacion);
          const pendingLoc = loadedLocations.find(
            (item) => String(item.id_ubicacion) === pendingLocId
          );
          setActiveId(pendingSOS.id_reporte);
          setLocationId(pendingLocId);
          setStatus('active');

          if (
            pendingLoc &&
            Number.isFinite(Number(pendingLoc.latitud)) &&
            Number.isFinite(Number(pendingLoc.longitud))
          ) {
            const point = [Number(pendingLoc.latitud), Number(pendingLoc.longitud)];
            setMapConfig({
              centro: point,
              zoom: 18,
              markers: [{ position: point, title: pendingLoc.nombre, desc: 'Ubicación de la alerta' }],
              circle: { center: point, radius: 60, color: '#ef4444' },
            });
          }
        } else {
          setStatus('ready');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
          setStatus('error');
        }
      });

    return () => {
      active = false;
      setMapConfig(defaultMapConfig);
    };
  }, [setMapConfig, defaultMapConfig]);

  // ── Update map when the user selects a different location ───────────────
  const handleLocationChange = (value) => {
    setLocationId(value);
    const loc = locations.find((item) => String(item.id_ubicacion) === value);
    if (loc && Number.isFinite(Number(loc.latitud)) && Number.isFinite(Number(loc.longitud))) {
      const point = [Number(loc.latitud), Number(loc.longitud)];
      setMapConfig({
        centro: point,
        zoom: 18,
        markers: [{ position: point, title: loc.nombre, desc: 'Ubicación seleccionada para la alerta' }],
        circle: { center: point, radius: 60, color: '#ef4444' },
      });
    }
  };

  // ── Activate SOS ────────────────────────────────────────────────────────
  const handleActivate = async () => {
    if (!locationId) {
      setError('Selecciona tu ubicación aproximada antes de activar el SOS.');
      return;
    }
    if (!window.confirm('¿Activar la alerta SOS? La acción quedará registrada.')) return;

    setStatus('submitting');
    setError(null);
    try {
      const response = await request('/reports/sos', {
        method: 'POST',
        body: JSON.stringify({
          descripcion: 'Alerta SOS activada desde la web móvil',
          id_ubicacion: Number(locationId),
        }),
      });
      setActiveId(response.data.id_reporte);
      setStatus('active');
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } catch (err) {
      setError(err.message);
      setStatus('ready');
    }
  };

  // ── Cancel SOS ──────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!activeId) return;
    setStatus('submitting');
    try {
      await request(`/reports/sos/${activeId}/cancelar`, { method: 'PUT' });
      setActiveId(null);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('active');
    }
  };

  const isLoading   = status === 'loading';
  const isSubmitting = status === 'submitting';
  const isActive    = !!activeId;

  return (
    <div className="space-y-5 text-center">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-black uppercase text-red-600">Botón SOS</h1>
        <p className="mt-1 text-xs text-slate-500">
          Registra una alerta en SafeWalk U. Ante peligro inmediato, llama también al ECU 911.
        </p>
      </div>

      {/* ── Location selector ─────────────────────────────────────────────── */}
      <label className="block text-left text-xs font-bold text-slate-700">
        Ubicación aproximada
        <select
          value={locationId}
          disabled={isLoading || isActive}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-60"
          aria-label="Selecciona un punto cercano a tu ubicación"
        >
          <option value="">Selecciona un punto cercano</option>
          {locations.map((loc) => (
            <option key={loc.id_ubicacion} value={loc.id_ubicacion}>
              {loc.nombre}
            </option>
          ))}
        </select>
      </label>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      {/* ── SOS Button / Active state ─────────────────────────────────────── */}
      {!isActive ? (
        <button
          type="button"
          disabled={isLoading || isSubmitting}
          onClick={handleActivate}
          aria-label="Activar alerta de emergencia SOS"
          className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border-4 border-white bg-red-600 text-2xl font-black text-white shadow-xl ring-8 ring-red-100 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando…' : 'AUXILIO'}
        </button>
      ) : (
        <div className="rounded-3xl bg-red-600 p-6 text-white">
          <h2 className="text-xl font-black">ALERTA REGISTRADA</h2>
          <p className="mt-2 text-xs">La alerta está pendiente de atención en el sistema.</p>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="mt-5 min-h-11 rounded-xl bg-white px-6 text-xs font-black text-red-700 hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Cancelando…' : 'Cancelar alerta'}
          </button>
        </div>
      )}

      {/* ── Emergency contacts ───────────────────────────────────────────── */}
      <section className="space-y-2 text-left" aria-label="Contactos personales de emergencia">
        <h2 className="text-xs font-black uppercase text-slate-500">Contactos personales</h2>

        {contacts.map((contact) => (
          <a
            key={contact.id_contacto}
            href={`tel:${String(contact.telefono).replace(/[^+\d]/g, '')}`}
            className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold hover:bg-slate-50 transition-colors"
            aria-label={`Llamar a ${contact.nombre}`}
          >
            <span>
              {contact.nombre} · {contact.parentesco}
            </span>
            <span className="material-symbols-outlined" aria-hidden="true">call</span>
          </a>
        ))}

        {status !== 'loading' && contacts.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
            No tienes contactos registrados. Puedes agregarlos en la sección Apoyo.
          </p>
        )}
      </section>
    </div>
  );
}
