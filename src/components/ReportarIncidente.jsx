import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMapConfig } from '../layouts/MainLayout';

const ReportarIncidente = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { setMapConfig, defaultMapConfig } = useMapConfig();

  // Estados locales para el formulario
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [evidenceName, setEvidenceName] = useState('');

  // Posición del incidente
  const posicionIncidente = [-3.9835, -79.2022];

  // Actualizar mapa al entrar en la vista de reportar
  useEffect(() => {
    setMapConfig({
      centro: posicionIncidente,
      zoom: 17,
      markers: [
        { 
          position: posicionIncidente, 
          title: "Ubicación del Reporte", 
          desc: "Marca el punto exacto del incidente." 
        }
      ],
      circle: {
        center: posicionIncidente,
        radius: 60,
        color: '#f59e0b'
      }
    });

    return () => setMapConfig(defaultMapConfig);
  }, [setMapConfig, defaultMapConfig]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEvidenceName(file.name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category) {
      alert("Por favor selecciona una categoría de incidente.");
      return;
    }

    // Almacenamos temporalmente en localStorage para que ResumenReporte lo pueda leer
    const reportData = {
      categoria: category,
      descripcion: description || "Sin descripción adicional.",
      fecha: new Date().toLocaleString('es-EC', { timeZone: 'America/Guayaquil' }),
      ubicacion: "Campus UIDE - Sector Biblioteca",
      coordenadas: posicionIncidente,
      evidencia: evidenceName || null
    };

    localStorage.setItem('tempReport', JSON.stringify(reportData));
    navigate('/resumen-reporte');
  };

  return (
    <div className="space-y-5">
      
      {/* Botón Volver */}
      <button 
        onClick={() => navigate('/app')} 
        className="text-xs font-bold text-purple-900 hover:text-purple-950 flex items-center gap-1.5 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px] font-bold">arrow_back</span>
        <span>Volver al Inicio</span>
      </button>

      <div>
        <h2 className="text-xl font-black text-purple-950 tracking-tight">Reportar Incidente</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Tu reporte alerta a seguridad del campus en tiempo real. Rellena los detalles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        
        {/* Tipo de incidente */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Tipo de incidente</label>
          <div className="relative">
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 appearance-none focus:ring-2 focus:ring-purple-200 focus:border-purple-900 transition-all outline-none text-xs font-semibold text-slate-800"
              required
            >
              <option value="">Selecciona una categoría</option>
              <option value="Actividad Sospechosa">🕵️ Actividad Sospechosa</option>
              <option value="Acoso / Intimidación">⚠️ Acoso / Intimidación</option>
              <option value="Accidente Médico">🚑 Accidente Médico</option>
              <option value="Robo / Hurto">🚨 Robo / Hurto</option>
              <option value="Iluminación Deficiente">💡 Iluminación Deficiente</option>
              <option value="Otro">❓ Otro Incidente</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
          </div>
        </div>

        {/* Descripción */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Descripción del suceso</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-purple-200 focus:border-purple-900 transition-all outline-none text-xs font-medium text-slate-700 resize-none h-24" 
            placeholder="Describe brevemente qué ocurre y si necesitas auxilio inmediato..." 
            maxLength={300}
          />
        </div>

        {/* Ubicación detectada */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Ubicación detectada</label>
          <div className="flex items-center gap-3 bg-purple-50/50 p-3.5 rounded-xl border border-purple-100/50">
            <span className="material-symbols-outlined text-purple-900 bg-white p-1.5 rounded-lg border border-purple-100 shadow-sm text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-purple-950">Campus UIDE - Sector Biblioteca</span>
              <span className="text-[9px] text-slate-500 font-medium">Ubicación asistida por GPS (Bellavista)</span>
            </div>
          </div>
        </div>

        {/* Input Oculto para Evidencia */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange} 
          accept="image/*,video/*"
        />

        {/* Evidencia (Opcional) */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Evidencia adjunta (Opcional)</label>
          {evidenceName ? (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="material-symbols-outlined text-green-700 text-[18px]">check_circle</span>
                <span className="text-xs font-semibold text-green-950 truncate">{evidenceName}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEvidenceName('')} 
                className="text-red-650 text-xs font-bold hover:underline"
              >
                Remover
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px] mb-1">photo_camera</span>
                <span className="text-[10px] font-bold text-slate-500">Tomar foto</span>
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current.click()} 
                className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-slate-400 text-[20px] mb-1">upload_file</span>
                <span className="text-[10px] font-bold text-slate-500">Subir archivo</span>
              </button>
            </div>
          )}
        </div>

        {/* Botón Continuar */}
        <button 
          type="submit"
          className="w-full bg-purple-900 hover:bg-purple-950 text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
        >
          <span>Continuar reporte</span>
          <span className="material-symbols-outlined text-[16px] font-bold">arrow_forward</span>
        </button>

      </form>
    </div>
  );
};

export default ReportarIncidente;