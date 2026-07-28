import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';
import { clearPendingEvidence, setPendingEvidence } from '../services/pendingReport';

/**
 * Mapping: category label → risk level sent to the backend.
 * Keeping this in one place makes it trivial to adjust severity later.
 */
const CATEGORY_RISK = {
  'Robo / Hurto':          'ALTO',
  'Acoso / Intimidación':  'ALTO',
  'Actividad sospechosa':  'MEDIO',
  'Accidente médico':      'MEDIO',
  'Iluminación deficiente':'BAJO',
  'Otro':                  'BAJO',
};

const CATEGORIES = Object.keys(CATEGORY_RISK);

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
const MAX_EVIDENCE_BYTES = 25 * 1024 * 1024;

export default function ReportarIncidente() {
  const navigate = useNavigate();
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const inputRef = useRef(null);

  const [locations, setLocations]       = useState([]);
  const [form, setForm]                 = useState({ category: '', description: '', locationId: '' });
  const [evidence, setEvidence]         = useState(null);
  const [evidenceError, setEvidenceError] = useState(null);
  const [status, setStatus]             = useState('loading');
  const [error, setError]               = useState(null);

  // ── Load registered locations ──────────────────────────────────────────
  useEffect(() => {
    let active = true;
    request('/ubicaciones')
      .then((response) => {
        if (active) { setLocations(response.data || []); setStatus('ready'); }
      })
      .catch((err) => {
        if (active) { setError(err.message); setStatus('error'); }
      });
    return () => {
      active = false;
      setMapConfig(defaultMapConfig);
    };
  }, [setMapConfig, defaultMapConfig]);

  // ── Update map when a location is selected ─────────────────────────────
  const selectLocation = (id) => {
    setForm((prev) => ({ ...prev, locationId: id }));
    const loc = locations.find((item) => String(item.id_ubicacion) === id);
    if (loc && Number.isFinite(Number(loc.latitud)) && Number.isFinite(Number(loc.longitud))) {
      const point = [Number(loc.latitud), Number(loc.longitud)];
      setMapConfig({
        centro: point,
        zoom: 17,
        markers: [{ position: point, title: loc.nombre, desc: loc.direccion }],
        circle: { center: point, radius: Number(loc.radio_metros) || 50, color: '#f59e0b' },
      });
    }
  };

  // ── Validate and persist draft before navigating to summary ────────────
  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    const loc = locations.find((item) => String(item.id_ubicacion) === form.locationId);
    if (!loc) { setError('Selecciona una ubicación registrada.'); return; }

    const description = form.description.trim();
    if (description.length < 10) {
      setError('La descripción debe contener al menos 10 caracteres.');
      return;
    }

    // Derive nivel_riesgo from the selected category using the explicit map.
    // This value is persisted in the draft and read by ResumenReporte so both
    // the preview and the backend payload use the same consistent risk level.
    const nivel_riesgo = CATEGORY_RISK[form.category] ?? 'BAJO';

    localStorage.setItem(
      'tempReport',
      JSON.stringify({
        categoria:    form.category,
        nivel_riesgo,
        descripcion:  description,
        fecha:        new Date().toLocaleString('es-EC'),
        ubicacion:    loc.nombre,
        id_ubicacion: loc.id_ubicacion,
        coordenadas:  [Number(loc.latitud), Number(loc.longitud)],
        evidencia:    evidence?.name ?? null,
      })
    );
    setPendingEvidence(evidence);
    navigate('/resumen-reporte');
  };

  // ── Evidence file validation ────────────────────────────────────────────
  const handleEvidenceChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setEvidenceError(null);
    if (!file) { setEvidence(null); return; }
    if (!ALLOWED_MIME.includes(file.type)) {
      setEvidenceError('Solo se permiten imágenes JPG, PNG, WEBP y videos MP4 o WEBM.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      setEvidenceError('La evidencia no puede superar 25 MB.');
      event.target.value = '';
      return;
    }
    setEvidence(file);
  };

  const removeEvidence = () => {
    setEvidence(null);
    clearPendingEvidence();
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="flex min-h-11 items-center gap-1 text-xs font-bold text-purple-900 hover:text-purple-950"
      >
        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
        Volver al inicio
      </button>

      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-purple-950 dark:text-slate-100">Reportar incidente</h2>
        <p className="mt-1 text-xs text-slate-500">
          Describe lo ocurrido y selecciona el punto registrado más cercano.
        </p>
      </div>

      {/* Loading / error feedback */}
      {status === 'loading' && (
        <p role="status" className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
          Cargando ubicaciones…
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Category */}
        <div className="space-y-1">
          <label htmlFor="category" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Tipo de incidente
          </label>
          <select
            id="category"
            required
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 dark:bg-[#2B2B2F] dark:border-[#4A4A50] dark:text-slate-100"
          >
            <option value="">Selecciona una categoría</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Show the derived risk level so the user knows what they're filing */}
          {form.category && (
            <p className="text-[10px] font-bold text-slate-400 mt-1">
              Nivel de riesgo asociado:{' '}
              <span
                className={
                  CATEGORY_RISK[form.category] === 'ALTO'
                    ? 'text-red-600'
                    : CATEGORY_RISK[form.category] === 'MEDIO'
                    ? 'text-amber-600'
                    : 'text-green-600'
                }
              >
                {CATEGORY_RISK[form.category]}
              </span>
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1">
          <label htmlFor="locationSelect" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Ubicación
          </label>
          <select
            id="locationSelect"
            required
            disabled={status !== 'ready'}
            value={form.locationId}
            onChange={(e) => selectLocation(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 disabled:opacity-60 dark:bg-[#2B2B2F] dark:border-[#4A4A50] dark:text-slate-100"
          >
            <option value="">Selecciona un punto</option>
            {locations.map((loc) => (
              <option key={loc.id_ubicacion} value={loc.id_ubicacion}>
                {loc.nombre} — {loc.direccion}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="space-y-1">
          <label htmlFor="description" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Descripción
          </label>
          <textarea
            id="description"
            required
            minLength={10}
            maxLength={300}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe qué ocurrió…"
            className="mt-1 h-28 w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 dark:bg-[#2B2B2F] dark:border-[#4A4A50] dark:text-slate-100"
          />
          <p className="text-right text-[10px] text-slate-400">
            {form.description.trim().length} / 300
          </p>
        </div>

        {/* Evidence upload */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
          className="hidden"
          onChange={handleEvidenceChange}
          aria-hidden="true"
        />
        {evidenceError && (
          <p role="alert" className="text-xs font-semibold text-red-700">{evidenceError}</p>
        )}
        <div className="rounded-xl border border-dashed border-slate-300 p-3 dark:border-[#4A4A50]">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-11 w-full rounded-xl bg-slate-100 px-4 text-xs font-bold hover:bg-slate-200 transition-colors dark:bg-[#3C3C40] dark:text-slate-100"
          >
            {evidence ? 'Cambiar evidencia' : 'Adjuntar evidencia opcional'}
          </button>
          {evidence && (
            <div className="mt-2 flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-600 dark:text-slate-300">{evidence.name}</span>
              <button
                type="button"
                onClick={removeEvidence}
                className="min-h-11 px-3 font-bold text-red-600 hover:text-red-700"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status !== 'ready'}
          className="min-h-11 w-full rounded-xl bg-purple-900 px-4 text-xs font-bold text-white hover:bg-purple-950 disabled:opacity-50 transition-colors"
        >
          Revisar reporte
        </button>
      </form>
    </div>
  );
}
