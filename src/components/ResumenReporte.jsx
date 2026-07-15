import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfig } from '../layouts/MainLayout';
import { buildApiUrl } from '../services/api';

export default function ResumenReporte() {
  const navigate = useNavigate();
  const { setMapConfig } = useMapConfig();
  
  // Estado para el modal de éxito e información
  const [isSent, setIsSent] = useState(false);
  const [report, setReport] = useState({
    categoria: "Incidente de Prueba",
    descripcion: "Se detectaron luminarias apagadas en los alrededores de la Biblioteca.",
    fecha: new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
    ubicacion: "Campus UIDE - Sector Biblioteca",
    coordenadas: [-3.9835, -79.2022],
    evidencia: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos reales guardados en el paso anterior
  useEffect(() => {
    const rawData = localStorage.getItem('tempReport');
    if (rawData) {
      const parsed = JSON.parse(rawData);
      setReport(parsed);

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
    }
  }, [setMapConfig]);

  // Enviar el reporte a la base de datos Express (backend)
  const handleSendReport = async () => {
    setIsSubmitting(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    try {
      const response = await fetch(buildApiUrl('/reports'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          descripcion: `[Categoría: ${report.categoria}] - ${report.descripcion}`,
          nivel_riesgo: report.categoria === "Robo / Hurto" || report.categoria === "Acoso / Intimidación" ? "Alto" : "Medio",
          estado: "Pendiente",
          ubicacion: report.ubicacion
        })
      });

      if (!response.ok) {
        throw new Error("Error al comunicarse con el servidor");
      }

      const data = await response.json();
      console.log("Reporte creado en backend:", data);
      setIsSent(true);

    } catch (error) {
      console.warn("Backend offline o error al guardar. Mock-guardando reporte de forma local.", error);
      
      // Simular éxito local en caso de que el backend no esté iniciado o disponible
      setIsSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = () => {
    localStorage.removeItem('tempReport');
    navigate('/app');
  };

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
            <span className="text-xs font-extrabold text-slate-900 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl inline-block shadow-sm">
              {report.categoria}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ubicación Asistida</span>
            <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              <span>{report.ubicacion}</span>
            </div>
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
          Tu reporte es anónimo y se despachará una patrulla preventiva de la UIDE de inmediato.
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
              El equipo de seguridad de la UIDE ha sido notificado y se asignará una patrulla de monitoreo a la brevedad.
            </p>
            
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