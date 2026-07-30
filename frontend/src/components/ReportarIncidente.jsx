import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfig } from '../context/map';
import { clearPendingEvidence, setPendingEvidence } from '../services/pendingReport';
import { getGoogleMapsApiKey, loadGoogleMaps } from '../utils/googleMaps';

const CATEGORY_RISK = {
  'Robo / Hurto': 'ALTO', 'Acoso / Intimidación': 'ALTO', 'Actividad sospechosa': 'MEDIO',
  'Accidente médico': 'MEDIO', 'Iluminación deficiente': 'BAJO', Otro: 'BAJO'
};
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;

export default function ReportarIncidente() {
  const navigate = useNavigate();
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const inputRef = useRef(null);
  const requestSequence = useRef(0);
  const [form, setForm] = useState({ category: '', description: '' });
  const [gps, setGps] = useState(null);
  const [geoStatus, setGeoStatus] = useState('requesting');
  const [geoError, setGeoError] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [evidenceError, setEvidenceError] = useState(null);
  const [error, setError] = useState(null);

  const reverseGeocode = useCallback(async (lat, lng, sequence) => {
    try {
      const maps = await loadGoogleMaps(getGoogleMapsApiKey());
      const response = await new maps.Geocoder().geocode({ location: { lat, lng } });
      if (requestSequence.current !== sequence) return;
      const address = response.results?.[0]?.formatted_address || 'Dirección aproximada no disponible';
      setGps((current) => current ? { ...current, address } : current);
    } catch {
      if (requestSequence.current === sequence) {
        setGps((current) => current ? { ...current, address: 'Dirección aproximada no disponible' } : current);
      }
    }
  }, []);

  const captureLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoStatus('error');
      setGeoError('Este navegador no ofrece geolocalización. No se asignarán coordenadas inventadas.');
      return;
    }
    const sequence = ++requestSequence.current;
    setGeoStatus('requesting');
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords, timestamp }) => {
        if (requestSequence.current !== sequence) return;
        const capturedAt = new Date(timestamp || Date.now()).toISOString();
        const nextGps = {
          lat: coords.latitude, lng: coords.longitude,
          accuracy: Math.max(0.01, coords.accuracy || 1), capturedAt,
          address: 'Obteniendo dirección aproximada…'
        };
        setGps(nextGps);
        setGeoStatus('ready');
        setMapConfig({
          centro: [nextGps.lat, nextGps.lng], zoom: 18,
          markers: [{ id: 'report-gps', position: [nextGps.lat, nextGps.lng], title: 'Ubicación actual del reporte', kind: 'user' }],
          circle: { center: [nextGps.lat, nextGps.lng], radius: nextGps.accuracy, color: '#2563eb' }
        });
        reverseGeocode(nextGps.lat, nextGps.lng, sequence);
      },
      (positionError) => {
        if (requestSequence.current !== sequence) return;
        setGps(null);
        setGeoStatus('error');
        setGeoError(positionError.code === 1
          ? 'Permiso de ubicación denegado. Habilítalo desde el icono de permisos del navegador y pulsa “Actualizar mi ubicación”.'
          : 'No fue posible obtener tu ubicación. Activa el GPS, comprueba la señal e inténtalo otra vez.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [reverseGeocode, setMapConfig]);

  useEffect(() => {
    captureLocation();
    return () => {
      requestSequence.current += 1;
      setMapConfig(defaultMapConfig);
    };
  }, [captureLocation, defaultMapConfig, setMapConfig]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);
    if (!gps || geoStatus !== 'ready') { setError('Debes permitir y actualizar tu ubicación antes de continuar.'); return; }
    const description = form.description.trim();
    if (description.length < 10) { setError('La descripción debe contener al menos 10 caracteres.'); return; }
    localStorage.setItem('tempReport', JSON.stringify({
      categoria: form.category,
      nivel_riesgo: CATEGORY_RISK[form.category] ?? 'BAJO',
      descripcion: description,
      fecha: new Date(gps.capturedAt).toLocaleString('es-EC'),
      coordenadas: [gps.lat, gps.lng],
      precision_gps: gps.accuracy,
      fecha_captura_gps: gps.capturedAt,
      direccion_aproximada: gps.address,
      evidencia: evidence?.name ?? null
    }));
    setPendingEvidence(evidence);
    navigate('/resumen-reporte');
  };

  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setEvidenceError(null);
    if (!file) { setEvidence(null); return; }
    if (!ALLOWED_MIME.includes(file.type)) { setEvidenceError('Solo se permiten imágenes JPG, PNG, WEBP y videos MP4 o WEBM.'); event.target.value = ''; return; }
    if (file.size > MAX_EVIDENCE_BYTES) { setEvidenceError('La evidencia no puede superar 25 MB.'); event.target.value = ''; return; }
    setEvidence(file);
  };

  const removeEvidence = () => {
    setEvidence(null); clearPendingEvidence();
    if (inputRef.current) inputRef.current.value = '';
  };

  return <div className="space-y-5">
    <button type="button" onClick={() => navigate('/app')} className="flex min-h-11 items-center gap-1 text-xs font-bold text-purple-900"><span className="material-symbols-outlined text-[18px]">arrow_back</span>Volver al inicio</button>
    <div><h2 className="text-xl font-black text-purple-950 dark:text-slate-100">Reportar incidente</h2><p className="mt-1 text-xs text-slate-500">El reporte quedará vinculado exclusivamente a tu ubicación GPS actual.</p></div>

    <section className="space-y-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs text-blue-950 dark:bg-blue-950/20 dark:text-blue-100">
      <div className="flex items-center justify-between gap-3"><strong>Ubicación actual</strong><button type="button" onClick={captureLocation} disabled={geoStatus === 'requesting'} className="min-h-11 rounded-xl bg-purple-900 px-4 font-bold text-white disabled:opacity-60">{geoStatus === 'requesting' ? 'Localizando…' : 'Actualizar mi ubicación'}</button></div>
      {geoError && <p role="alert" className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-800">{geoError}</p>}
      {gps && <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2"><div><dt className="font-bold">Latitud</dt><dd>{gps.lat.toFixed(8)}</dd></div><div><dt className="font-bold">Longitud</dt><dd>{gps.lng.toFixed(8)}</dd></div><div><dt className="font-bold">Precisión</dt><dd>± {Math.round(gps.accuracy)} m</dd></div><div><dt className="font-bold">Capturada</dt><dd>{new Date(gps.capturedAt).toLocaleString('es-EC')}</dd></div><div className="sm:col-span-2"><dt className="font-bold">Dirección aproximada</dt><dd>{gps.address}</dd></div></dl>}
      {gps?.accuracy > 100 && <p role="status" className="rounded-xl bg-amber-100 p-3 font-semibold text-amber-900">La precisión GPS es baja (± {Math.round(gps.accuracy)} m). Muévete a un lugar abierto y actualiza antes de enviar.</p>}
    </section>

    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">{error}</p>}
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-xs font-bold">Tipo de incidente<select required value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border px-4 dark:bg-[#2B2B2F]"><option value="">Selecciona una categoría</option>{Object.keys(CATEGORY_RISK).map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="block text-xs font-bold">Descripción<textarea required minLength={10} maxLength={300} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe qué ocurrió…" className="mt-1 h-28 w-full rounded-xl border p-3 dark:bg-[#2B2B2F]" /><span className="block text-right text-[10px] text-slate-400">{form.description.trim().length} / 300</span></label>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" className="hidden" onChange={handleEvidenceChange} />
      {evidenceError && <p role="alert" className="text-xs font-semibold text-red-700">{evidenceError}</p>}
      <div className="rounded-xl border border-dashed p-3"><button type="button" onClick={() => inputRef.current?.click()} className="min-h-11 w-full rounded-xl bg-slate-100 px-4 text-xs font-bold">{evidence ? 'Cambiar evidencia' : 'Adjuntar evidencia opcional'}</button>{evidence && <div className="mt-2 flex items-center justify-between gap-2 text-xs"><span className="truncate">{evidence.name}</span><button type="button" onClick={removeEvidence} className="min-h-11 px-3 font-bold text-red-600">Quitar</button></div>}</div>
      <button type="submit" disabled={!gps || geoStatus !== 'ready'} className="min-h-11 w-full rounded-xl bg-purple-900 px-4 text-xs font-bold text-white disabled:opacity-50">Revisar reporte</button>
    </form>
  </div>;
}
