import React, { useState } from 'react';

export default function ReportarIncidente() {
  // Estados para controlar el formulario e interacciones dinámicas
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  // Manejador del cambio de texto con límite de caracteres
  const handleDescriptionChange = (e) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setDescription(text);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Enviando reporte: Categoría [${category}], Descripción: ${description.substring(0, 30)}...`);
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen overflow-hidden font-sans relative">
      
      {/* Inyección de fuentes y estilos para Material Symbols y barra de scroll personalizada */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          vertical-align: middle;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
      `}} />

      {/* Top Navigation Bar */}
      <header className="bg-[#f7f9fb] border-b border-[#E2E8F0] shadow-sm flex justify-between items-center w-full px-8 h-16 fixed top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-[#4a4452]">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <span className="text-[24px] leading-[32px] font-bold text-[#330071]">SafeWalk U</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-[#eceef0] px-4 py-2 rounded-full w-64 border border-transparent focus-within:ring-2 focus-within:ring-[#330071]/20">
            <span className="material-symbols-outlined text-[#7b7483]">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full ml-2 outline-none" 
              placeholder="Buscar ayuda..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4a4452] hover:bg-[#f2f4f6] p-2 rounded-full cursor-pointer transition-colors">notifications</span>
            <span className="material-symbols-outlined text-[#4a4452] hover:bg-[#f2f4f6] p-2 rounded-full cursor-pointer transition-colors">help</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#330071] ml-2">
              <img 
                className="w-full h-full object-cover" 
                alt="Retrato de estudio de un estudiante universitario" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUI-NHUdjhqc04grdiEE_ihd6RGNAgFHDOJFO4egnPUPu4m5_oGkcMiIYA0a4rdMxCeVGPX9-7BnNVdssQAvCGvP6ul8dSidJETaNo9UF7AWzwEfXy94PNlsw_v2r_amla7hbjOr8qsM9Skyu9Jh8Q3MMV_N7ht7P99F9Z7bFNBVuzIIPChm0dMMkY-RemqbSCob0h5cmJbmagIv7CGA8ScjpIQXBdvf_MVg1OJx_bFnNCRUwiMv1frIIQEDHFzbJYwdmRqiUpidE"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex flex-col md:flex-row h-screen pt-16">
        
        {/* Left Panel: Incident Form Container */}
        <aside className="w-full md:w-[30%] bg-white border-r border-[#E2E8F0] z-10 overflow-y-auto custom-scrollbar flex flex-col">
          <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6 flex-grow">
            
            {/* Back Action */}
            <div className="flex items-center gap-2 text-[#330071] cursor-pointer hover:underline self-start">
              <span className="material-symbols-outlined font-bold">arrow_back</span>
              <span className="text-[14px] leading-[20px] font-medium">Volver al Dashboard</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-[24px] leading-[32px] font-bold text-[#330071]">Reportar incidente</h1>
              <p className="text-[14px] leading-[20px] text-[#4a4452]">Tu seguridad es nuestra prioridad. Por favor, describe la situación con el mayor detalle posible.</p>
            </div>

            {/* Input Fields Stack */}
            <div className="flex flex-col gap-4">
              
              {/* Incident Type Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-[14px] leading-[20px] font-medium text-[#191c1e]">Tipo de incidente</label>
                <div className="relative">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-[#E2E8F0] rounded-lg py-3 px-4 appearance-none focus:ring-2 focus:ring-[#330071]/20 focus:border-[#330071] transition-all outline-none text-[14px]"
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="sospechosa">Actividad Sospechosa</option>
                    <option value="acoso">Acoso / Intimidación</option>
                    <option value="medico">Accidente Médico</option>
                    <option value="robo">Robo / Hurto</option>
                    <option value="infraestructura">Falla de Infraestructura</option>
                    <option value="otro">Otro</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#7b7483]">expand_more</span>
                </div>
              </div>

              {/* Description Textarea */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[14px] leading-[20px] font-medium text-[#191c1e]">Descripción</label>
                  <span className={`text-[10px] font-medium transition-colors ${description.length > 450 ? 'text-[#E11D48]' : 'text-[#7b7483]'}`}>
                    {description.length}/500
                  </span>
                </div>
                <textarea 
                  value={description}
                  onChange={handleDescriptionChange}
                  className="w-full bg-white border border-[#E2E8F0] rounded-lg py-3 px-4 focus:ring-2 focus:ring-[#330071]/20 focus:border-[#330071] transition-all outline-none text-[14px] resize-none" 
                  placeholder="Describe lo que está ocurriendo..." 
                  rows="4"
                />
              </div>

              {/* Detected Location Info Box */}
              <div className="flex flex-col gap-1">
                <label className="text-[14px] leading-[20px] font-medium text-[#191c1e]">Ubicación detectada</label>
                <div className="flex items-center gap-3 bg-[#f2f4f6] p-3 rounded-lg border border-[#E2E8F0]">
                  <div className="w-10 h-10 bg-[#330071]/10 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#330071]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[14px] leading-[20px] font-medium text-[#191c1e] truncate">Campus UIDE - Sector Biblioteca</span>
                    <span className="text-[11px] text-[#4a4452]">Precisión: 5 metros</span>
                  </div>
                </div>
              </div>

              {/* Evidence Drag-Drop Buttons */}
              <div className="flex flex-col gap-1">
                <label className="text-[14px] leading-[20px] font-medium text-[#191c1e]">Evidencia (Opcional)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#ccc3d3] rounded-lg py-4 hover:bg-[#eceef0] hover:border-[#330071]/40 transition-all group">
                    <span className="material-symbols-outlined text-[#7b7483] group-hover:text-[#330071]">photo_camera</span>
                    <span className="text-[11px] text-[#7b7483] group-hover:text-[#330071]">Tomar foto</span>
                  </button>
                  <button type="button" className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#ccc3d3] rounded-lg py-4 hover:bg-[#eceef0] hover:border-[#330071]/40 transition-all group">
                    <span className="material-symbols-outlined text-[#7b7483] group-hover:text-[#330071]">upload_file</span>
                    <span className="text-[11px] text-[#7b7483] group-hover:text-[#330071]">Subir archivo</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Actions Frame */}
            <div className="mt-auto pt-4 flex flex-col gap-3">
              <button 
                type="submit"
                className="w-full bg-[#330071] text-white text-[14px] leading-[20px] font-medium py-4 rounded-lg hover:bg-[#4a208c] transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>Continuar</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <p className="text-[10px] text-center text-[#4a4452] px-4">
                Al reportar, se enviará una señal inmediata al centro de monitoreo UIDE.
              </p>
            </div>

          </form>
        </aside>

        {/* Right Panel: Campus Map Canvas */}
        <section className="flex-grow relative bg-[#eceef0] overflow-hidden">
          {/* Main Map Background Layer */}
          <div className="absolute inset-0 z-0">
            <img 
              className="w-full h-full object-cover" 
              alt="Mapa digital interactivo del campus de la universidad en alta resolución" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtdZIFIID8ZazVc0RbEUBX-8CzhSX4yLXblHB0eFOJuCExonjBVtTJ_BFtUsgx0RAHehAMThEugr8Va1m7HikgUw9G9glYHb5puqzdE7td7ZiSqfLZgJhTjqKFB6H0uWIgyEe2q5ozlF6x6q7pAwHdVfG5k9WvKLoScajSHxplJL1nq81W-V-3Gn_sQsx12DptHS_rBZV8jV_wpFjkbwYdnzyPpCLu7UcyUGI7m9asfVziJ563Y0Ro0PDT8HIdIQpQm7sCMqnhHhY"
            />
          </div>

          {/* Floating UI Maps Controls overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            <button type="button" className="bg-white p-3 rounded-lg shadow-lg hover:bg-[#f2f4f6] text-[#191c1e] transition-all">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button type="button" className="bg-white p-3 rounded-lg shadow-lg hover:bg-[#f2f4f6] text-[#191c1e] transition-all">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button type="button" className="bg-white p-3 rounded-lg shadow-lg hover:bg-[#f2f4f6] text-[#330071] transition-all mt-4">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
            </button>
          </div>

          {/* Bottom Floating Safe Zones HUD info status bar */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-full px-4 max-w-lg">
            <div className="bg-white/90 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#E11D48]/10 rounded-full flex items-center justify-center shrink-0">
                  <div className="w-3 h-3 bg-[#E11D48] rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-[14px] leading-[20px] font-medium text-[#191c1e]">Zonas Seguras Activas</h3>
                  <p className="text-xs text-[#4a4452]">3 puntos de guardia cercanos</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => alert('¡Señal SOS de Emergencia enviada!')}
                className="bg-[#E11D48] text-white px-4 py-2 rounded-lg font-medium text-sm hover:brightness-90 transition-all flex items-center gap-2 shadow"
              >
                <span className="material-symbols-outlined text-sm">emergency</span>
                SOS
              </button>
            </div>
          </div>

          {/* Decorative Subtle Shadow Mask */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#f7f9fb]/20 to-transparent"></div>
        </section>

      </main>

      {/* Bottom Navigation Bar (Mobile Tab Bar Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-[#f7f9fb] border-t border-[#E2E8F0] md:hidden">
        <div className="flex flex-col items-center justify-center text-[#4a4452] py-1 cursor-pointer">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[11px]">Home</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-[#4a208c] text-[#ebdcff] rounded-2xl px-4 py-1 cursor-pointer">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
          <span className="text-[11px]">SafeWalk</span>
        </div>
        <div className="flex flex-col items-center justify-center text-[#E11D48] py-1 cursor-pointer">
          <span className="material-symbols-outlined">emergency</span>
          <span className="text-[11px]">Emergency</span>
        </div>
        <div className="flex flex-col items-center justify-center text-[#4a4452] py-1 cursor-pointer">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[11px]">Profile</span>
        </div>
      </nav>

    </div>
  );
}