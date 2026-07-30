import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';
import { getGoogleMapsApiKey, loadGoogleMaps } from '../utils/googleMaps';
import MapaInteractivo from './MapaInteractivo';

const geoMessages = {
  1: 'Permiso de ubicación denegado. Habilítalo desde el icono de permisos del navegador y vuelve a intentarlo.',
  2: 'La ubicación no está disponible. Activa el GPS y comprueba la señal.',
  3: 'La ubicación tardó demasiado. Vuelve a intentarlo desde un lugar abierto.',
};

export default function EmergenciaSos() {
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const sequenceRef = useRef(0);
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [gps, setGps] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');
  const [message, setMessage] = useState('Alerta SOS activada desde SafeWalk U');

  const showPoint = useCallback((point, accuracy, title = 'Ubicación de la alerta SOS') => {
    setMapConfig({
      centro: point,
      zoom: 18,
      markers: [{ id: 'sos-gps', position: point, title, kind: 'user', desc: 'Coordenadas GPS reales' }],
      circle: { center: point, radius: Math.max(5, Number(accuracy) || 30), color: '#ef4444' },
    });
  }, [setMapConfig]);

  const reverseGeocode = useCallback(async (lat, lng, sequence) => {
    try {
      const maps = await loadGoogleMaps(getGoogleMapsApiKey());
      const response = await new maps.Geocoder().geocode({ location: { lat, lng } });
      if (sequenceRef.current !== sequence) return;
      setGps((current) => current ? {
        ...current,
        address: response.results?.[0]?.formatted_address || 'Dirección aproximada no disponible',
      } : current);
    } catch {
      if (sequenceRef.current === sequence) {
        setGps((current) => current ? { ...current, address: 'Dirección aproximada no disponible' } : current);
      }
    }
  }, []);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setError('Este navegador no permite obtener la ubicación. No se enviarán coordenadas inventadas.');
      return;
    }
    const sequence = ++sequenceRef.current;
    setGeoStatus('requesting');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        if (sequenceRef.current !== sequence) return;
        const next = {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: Math.max(0.01, coords.accuracy || 1),
          capturedAt: new Date(timestamp || Date.now()).toISOString(),
          address: 'Obteniendo dirección aproximada…',
        };
        setGps(next);
        setGeoStatus('ready');
        showPoint([next.lat, next.lng], next.accuracy, 'Ubicación actual para SOS');
        reverseGeocode(next.lat, next.lng, sequence);
      },
      (positionError) => {
        if (sequenceRef.current !== sequence) return;
        setGps(null);
        setGeoStatus('error');
        setError(geoMessages[positionError.code] || 'No fue posible obtener tu ubicación actual.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [reverseGeocode, showPoint]);

  useEffect(() => {
    let active = true;
    Promise.all([request('/contacts'), request('/reports')])
      .then(([contactResponse, reportResponse]) => {
        if (!active) return;
        const pending = (reportResponse.data || []).find(
          (report) => report.tipo_reporte === 'SOS_PANICO' && report.estado === 'PENDIENTE',
        );
        setContacts(contactResponse.data || []);
        if (pending) {
          setActiveId(pending.id_reporte);
          setStatus('active');
          const lat = Number(pending.latitud);
          const lng = Number(pending.longitud);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const storedGps = {
              lat, lng,
              accuracy: Number(pending.precision_gps) || 1,
              capturedAt: pending.fecha_captura_gps || pending.fecha_reporte,
              address: pending.direccion || 'Dirección aproximada no disponible',
            };
            setGps(storedGps);
            showPoint([lat, lng], storedGps.accuracy);
          }
        } else {
          setStatus('ready');
        }
      })
      .catch((loadError) => { if (active) { setError(loadError.message); setStatus('error'); } });
    return () => {
      active = false;
      sequenceRef.current += 1;
      setMapConfig(defaultMapConfig);
    };
  }, [defaultMapConfig, setMapConfig, showPoint]);

  const openConfirmation = () => {
    setModalOpen(true);
    captureLocation();
  };

  const confirmActivate = async () => {
    if (!gps || geoStatus !== 'ready') {
      setError('Debes obtener una ubicación válida antes de enviar el SOS.');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const response = await request('/reports/sos', {
        method: 'POST',
        body: JSON.stringify({
          descripcion: message.trim() || 'Alerta SOS activada desde SafeWalk U',
          latitud: gps.lat,
          longitud: gps.lng,
          precision_gps: gps.accuracy,
          fecha_captura_gps: gps.capturedAt,
          direccion_aproximada: gps.address,
        }),
      });
      setActiveId(response.data.id_reporte);
      setStatus('active');
      setModalOpen(false);
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } catch (submitError) {
      setError(submitError.message);
      setStatus('ready');
    }
  };

  const handleCancel = async () => {
    if (!activeId) return;
    setStatus('submitting');
    try {
      await request(`/reports/sos/${activeId}/cancelar`, { method: 'PUT' });
      setActiveId(null);
      setGps(null);
      setStatus('ready');
      setMapConfig(defaultMapConfig);
    } catch (cancelError) {
      setError(cancelError.message);
      setStatus('active');
    }
  };

  const isSubmitting = status === 'submitting';
  const isActive = Boolean(activeId);

  return <div className="space-y-5 text-center">
    <div>
      <h1 className="text-xl font-black uppercase text-red-600">Botón SOS</h1>
      <p className="mt-1 text-xs text-slate-500">Registra una alerta con tu GPS actual. Ante peligro inmediato, llama también al ECU 911.</p>
    </div>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-200">{error}</p>}

    {!isActive ? <button type="button" disabled={status === 'loading' || isSubmitting} onClick={openConfirmation}
      className="mx-auto flex h-44 w-44 items-center justify-center rounded-full border-4 border-white bg-red-600 text-2xl font-black text-white shadow-xl ring-8 ring-red-100 transition-colors hover:bg-red-700 disabled:opacity-50">
      {isSubmitting ? 'Enviando…' : 'AUXILIO'}
    </button> : <div className="rounded-3xl bg-red-600 p-6 text-white">
      <h2 className="text-xl font-black">ALERTA REGISTRADA</h2>
      <p className="mt-2 text-xs">La alerta y sus coordenadas están pendientes de atención.</p>
      {gps && <p className="mt-2 text-[11px]">Precisión registrada: ± {Math.round(gps.accuracy)} m</p>}
      <button type="button" disabled={isSubmitting} onClick={handleCancel}
        className="mt-5 min-h-11 rounded-xl bg-white px-6 text-xs font-black text-red-700 hover:bg-red-50 disabled:opacity-60">
        {isSubmitting ? 'Cancelando…' : 'Cancelar alerta'}
      </button>
    </div>}

    <section className="space-y-2 text-left" aria-label="Contactos personales de emergencia">
      <h2 className="text-xs font-black uppercase text-slate-500">Contactos personales</h2>
      {contacts.map((contact) => <a key={contact.id_contacto} href={`tel:${String(contact.telefono).replace(/[^+\d]/g, '')}`}
        className="flex min-h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold dark:bg-[#2B2B2F]">
        <span>{contact.nombre} · {contact.parentesco}</span><span className="material-symbols-outlined">call</span>
      </a>)}
      {status !== 'loading' && contacts.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No tienes contactos registrados. Puedes agregarlos en Apoyo.</p>}
    </section>

    {modalOpen && <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="sos-location-title">
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 text-left shadow-2xl dark:bg-[#242428] sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3"><div><h2 id="sos-location-title" className="text-lg font-black text-red-700 dark:text-red-300">Tu alerta SOS se enviará desde esta ubicación</h2><p className="mt-1 text-xs text-slate-500">Verifica la posición antes de confirmar.</p></div><button type="button" onClick={() => setModalOpen(false)} className="min-h-11 min-w-11 rounded-full text-slate-500" aria-label="Cerrar">✕</button></div>

        <div className="mt-4 h-44 overflow-hidden rounded-2xl border border-slate-200">
          {gps ? <MapaInteractivo centro={[gps.lat, gps.lng]} zoom={18} markers={[{ id: 'sos-modal', position: [gps.lat, gps.lng], title: 'Tu ubicación actual', kind: 'user' }]} circle={{ center: [gps.lat, gps.lng], radius: gps.accuracy, color: '#ef4444' }} />
            : <div className="flex h-full items-center justify-center bg-slate-100 text-xs font-bold text-slate-500">{geoStatus === 'requesting' ? 'Obteniendo tu ubicación…' : 'Ubicación pendiente'}</div>}
        </div>

        {gps && <dl className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-4 text-xs dark:bg-[#2B2B2F]">
          <div><dt className="font-bold">Latitud</dt><dd>{gps.lat.toFixed(8)}</dd></div><div><dt className="font-bold">Longitud</dt><dd>{gps.lng.toFixed(8)}</dd></div>
          <div><dt className="font-bold">Precisión</dt><dd>± {Math.round(gps.accuracy)} m</dd></div><div><dt className="font-bold">Captura</dt><dd>{new Date(gps.capturedAt).toLocaleString('es-EC')}</dd></div>
          <div className="col-span-2"><dt className="font-bold">Dirección aproximada</dt><dd>{gps.address}</dd></div>
        </dl>}
        {gps?.accuracy > 100 && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">La precisión es baja. Si puedes hacerlo con seguridad, muévete a un lugar abierto y actualiza la ubicación.</p>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
        <label className="mt-4 block text-xs font-bold">Mensaje opcional<textarea minLength={5} maxLength={500} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-1 h-20 w-full rounded-xl border border-slate-200 p-3 dark:bg-[#2B2B2F]" /></label>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={captureLocation} disabled={geoStatus === 'requesting'} className="min-h-11 rounded-xl border border-purple-200 px-4 text-xs font-bold text-purple-900 disabled:opacity-60">{geoStatus === 'requesting' ? 'Localizando…' : 'Actualizar mi ubicación'}</button>
          <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold">Cancelar</button>
          <button type="button" onClick={confirmActivate} disabled={!gps || geoStatus !== 'ready' || isSubmitting} className="min-h-11 rounded-xl bg-red-600 px-4 text-xs font-black text-white disabled:opacity-50">{isSubmitting ? 'Enviando…' : 'Confirmar SOS'}</button>
        </div>
      </div>
    </div>}
  </div>;
}
