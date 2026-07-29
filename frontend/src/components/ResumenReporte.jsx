import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfig } from '../context/map';
import { request } from '../services/api';
import { clearPendingEvidence, getPendingEvidence } from '../services/pendingReport';

export default function ResumenReporte() {
  const navigate = useNavigate();
  const { setMapConfig } = useMapConfig();
  
  // Estado para el modal de éxito e información
  const [isSent, setIsSent] = useState(false);
  const [report, setReport] = useState(null);
  const [draftStatus, setDraftStatus] = useState('loading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evidenceWarning, setEvidenceWarning] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Cargar datos reales guardados en el paso anterior
  useEffect(() => {
    const rawData = localStorage.getItem('tempReport');
    if (!rawData) {
      setDraftStatus('missing');
      return;
    }

    try {
      const parsed = JSON.parse(rawData);
      const coordinatesAreValid = Array.isArray(parsed?.coordenadas)
        && parsed.coordenadas.length === 2
        && parsed.coordenadas.every((value) => Number.isFinite(Number(value)));
      const draftIsValid = typeof parsed?.categoria === 'string'
        && parsed.categoria.trim().length > 0
        && typeof parsed?.descripcion === 'string'
        && parsed.descripcion.trim().length >= 10
        && Number.isFinite(Number(parsed?.precision_gps))
        && Number(parsed.precision_gps) > 0
        && typeof parsed?.fecha_captura_gps === 'string'
        && !Number.isNaN(Date.parse(parsed.fecha_captura_gps))
        && coordinatesAreValid;

      if (!draftIsValid) {
        localStorage.removeItem('tempReport');
        clearPendingEvidence();
        setDraftStatus('missing');
        return;
      }

      setReport(parsed);
      setDraftStatus('ready');

      // Centrar y marcar la ubicación en el mapa
      setMapConfig({
        centro: parsed.coordenadas,
        zoom: 17,
        markers: [
          {
            position: parsed.coordenadas,
            title: `Reporte: ${parsed.categoria}`,
            desc: parsed.descripcion
          }
        ],
        circle: {
          center: parsed.coordenadas,
          radius: 80,
          color: '#ba1a1a'
        }
      });
    } catch {
      localStorage.removeItem('tempReport');
      clearPendingEvidence();
      setDraftStatus('missing');
    }
  }, [setMapConfig]);

  // Enviar el reporte a la base de datos Express (backend)
  const handleSendReport = async () => {
    if (!report) {
      setSubmitError('No existe un reporte pendiente.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // nivel_riesgo is now derived from the category map in ReportarIncidente
      // and stored in the draft, so we read it directly instead of re-deriving here.
      const data = await request('/reports', {
        method: 'POST',
        body: JSON.stringify({
          descripcion:  `[Categoría: ${report.categoria}] - ${report.descripcion}`,
          nivel_riesgo: report.nivel_riesgo ?? 'MEDIO',
          latitud: Number(report.coordenadas[0]),
          longitud: Number(report.coordenadas[1]),
          precision_gps: Number(report.precision_gps),
          fecha_captura_gps: report.fecha_captura_gps,
          direccion_aproximada: report.direccion_aproximada || undefined,
        }),
      });

      const evidenceFile = getPendingEvidence();
      const reportId = data?.data?.id_reporte;
      if (evidenceFile && reportId) {
        const formData = new FormData();
        formData.append('archivo', evidenceFile);
        formData.append('id_reporte', String(reportId));
        try {
          await request('/evidencias', { method: 'POST', body: formData });
          clearPendingEvidence();
        } catch (evidenceError) {
          setEvidenceWarning(evidenceError instanceof Error ? evidenceError.message : 'No se pudo cargar la evidencia.');
        }
      }
      setIsSent(true);

    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No se pudo enviar el reporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    localStorage.removeItem('tempReport');
    clearPendingEvidence();
    navigate('/app');
  };

  if (draftStatus === 'loading') {
    return <p className="rounded-xl bg-slate-50 p-4 text-sm">Cargando borrador del reporte…</p>;
  }

  if (!report) {
    return <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 text-center">
      <h2 className="text-lg font-black text-slate-900">No existe un reporte pendiente.</h2>
      <p className="text-sm text-slate-500">Completa el formulario de incidente antes de abrir el resumen.</p>
      <button type="button" onClick={() => navigate('/reportar')} className="min-h-11 rounded-xl bg-purple-900 px-5 text-sm font-bold text-white">
        Crear reporte
      </button>
    </div>;
  }

  return (
    <div className="space-y-5 h-full flex flex-col justify-between">
      
      <div className="space-y-4">
        {/* Botón Volver */}
        <button 
          onClick={() => navigate('/reportar')} 
          className="text-xs font-bold text-purple-900 hover:text-purple-950 flex items-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px] font-bold">arrow_back</span>
          <span>Modificar Reporte</span>
        </button>

        <div>
          <h2 className="text-xl font-black text-purple-950 tracking-tight">Resumen del Reporte</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Verifica los datos de la alerta antes de enviarlos a la central de seguridad de la UIDE.
          </p>
        </div>

        {/* Tarjeta de Resumen */}
        <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 shadow-inner space-y-4">
          
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Categoría</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-slate-900 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl inline-block shadow-sm">
                {report.categoria}
              </span>
              {report.nivel_riesgo && (
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                    report.nivel_riesgo === 'ALTO'
                      ? 'bg-red-100 text-red-700'
                      : report.nivel_riesgo === 'MEDIO'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  Riesgo {report.nivel_riesgo}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ubicación GPS</span>
            <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{report.direccion_aproximada}</span>
            </div>
            <p className="mt-1 text-[10px] text-slate-500">
              {Number(report.coordenadas[0]).toFixed(8)}, {Number(report.coordenadas[1]).toFixed(8)} · precisión ± {Math.round(Number(report.precision_gps))} m
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fecha y Hora</span>
            <div className="text-xs font-semibold text-slate-650 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>{report.fecha}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Descripción del Suceso</span>
            <p className="text-xs text-slate-700 bg-white border border-slate-200/65 p-3 rounded-2xl leading-relaxed shadow-sm font-medium">
              "{report.descripcion}"
            </p>
          </div>

          {report.evidencia && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Archivo Adjunto</span>
              <div className="text-xs font-semibold text-slate-750 flex items-center gap-1">
                <span className="material-symbols-outlined text-purple-900 text-[18px]">attachment</span>
                <span>{report.evidencia}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Acciones del Reporte */}
      <div className="pt-4 border-t border-slate-100 space-y-2 mt-auto">
        {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{submitError}</p>}
        <button 
          onClick={handleSendReport}
          disabled={isSubmitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              <span>Enviando reporte...</span>
            </>
          ) : (
            <>
              <span>Enviar reporte urgente</span>
              <span className="material-symbols-outlined text-[16px] font-bold">send</span>
            </>
          )}
        </button>
        <p className="text-[10px] text-center text-slate-500 px-4 leading-relaxed font-semibold">
          Tu reporte quedará asociado a tu cuenta para mantener trazabilidad y será revisado por un administrador.
        </p>
      </div>

      {/* MODAL DE ÉXITO (Overlay dentro de la Sidebar) */}
      {isSent && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-purple-950/80 backdrop-blur-sm p-6 rounded-tr-3xl">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm text-center border border-slate-100 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-14 h-14 bg-green-50 border border-green-200 text-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[28px] font-bold">check</span>
            </div>
            
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Reporte Recibido</h2>
            <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed font-medium">
              El reporte quedó registrado para revisión dentro de SafeWalk U.
            </p>
            {evidenceWarning && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                Reporte creado, pero la evidencia no pudo cargarse: {evidenceWarning}
              </p>
            )}
            
            <button 
              onClick={handleFinish} 
              className="w-full bg-purple-900 hover:bg-purple-950 text-white py-3 rounded-xl text-xs uppercase tracking-wider font-bold shadow-md hover:shadow-lg transition-colors cursor-pointer"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
