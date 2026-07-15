import React, { useState, useEffect } from 'react';
import { useMapConfig } from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../services/api';

export default function SafeWalkSOS() {
  const { setMapConfig, defaultMapConfig } = useMapConfig();
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [activeSosId, setActiveSosId] = useState(null);
  const { user } = useAuth();

  const posicionUsuario = [-3.9822, -79.2015]; // UIDE Loja Central

  // Inicializar mapa mostrando la ubicación del estudiante en modo SOS
  useEffect(() => {
    setMapConfig({
      centro: posicionUsuario,
      zoom: 17,
      markers: [
        { 
          position: posicionUsuario, 
          title: "Tu ubicación", 
          desc: "Dispositivo móvil activo." 
        }
      ],
      circle: {
        center: posicionUsuario,
        radius: 40,
        color: '#330071'
      }
    });
  }, [setMapConfig]);

  const handleSOS = async () => {
    setIsAlertVisible(true);
    
    // Cambiar configuración del mapa para denotar una alerta activa
    setMapConfig({
      centro: posicionUsuario,
      zoom: 18,
      markers: [
        { 
          position: posicionUsuario, 
          title: "🚨 SOS ACTIVADO 🚨", 
          desc: "Señal de auxilio en progreso. El personal de seguridad está en camino." 
        }
      ],
      circle: {
        center: posicionUsuario,
        radius: 80,
        color: '#ef4444' // Círculo rojo de alerta
      }
    });

    if ("vibrate" in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(buildApiUrl('/reportes/sos'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          descripcion: "ALERTA SOS ACTIVADA DESDE DISPOSITIVO MÓVIL",
          id_usuario: user?.id_usuario || 1,
          id_ubicacion: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSosId(data.data);
      }
    } catch (e) {
      console.error("Error al activar SOS:", e);
    }
  };

  const handleCancelSOS = async () => {
    setIsAlertVisible(false);
    
    // Revertir mapa a estado normal del estudiante
    setMapConfig({
      centro: posicionUsuario,
      zoom: 17,
      markers: [
        { 
          position: posicionUsuario, 
          title: "Tu ubicación", 
          desc: "Alerta cancelada. Ubicación segura." 
        }
      ],
      circle: {
        center: posicionUsuario,
        radius: 40,
        color: '#330071'
      }
    });

    if (activeSosId) {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        await fetch(buildApiUrl(`/reportes/sos/${activeSosId}/cancelar`), {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        });
        setActiveSosId(null);
      } catch (e) {
        console.error("Error al cancelar SOS:", e);
      }
    }
  };

  const handleCall = (contacto) => {
    alert(`Iniciando llamada de auxilio a: ${contacto}...`);
  };

  return (
    <div className="space-y-6">
      
      {/* Encabezado */}
      <div className="text-center bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
        <h1 className="text-lg font-black text-red-600 tracking-tight flex items-center justify-center gap-1.5 uppercase">
          <span className="material-symbols-outlined text-[22px] font-bold animate-pulse">emergency</span>
          Botón SOS de Pánico
        </h1>
        <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
          Acciona una señal de socorro a la central UIDE
        </p>
      </div>

      {/* Botón SOS de Pánico */}
      <div className="flex flex-col items-center justify-center py-4">
        <button 
          onClick={handleSOS}
          className="group relative flex items-center justify-center w-52 h-52 rounded-full bg-red-600 transition-all hover:bg-red-700 active:scale-95 cursor-pointer shadow-xl border-4 border-white ring-8 ring-red-150"
        >
          <div className="absolute inset-0 rounded-full border-4 border-white/20 group-hover:border-white/40 transition-colors animate-ping duration-1000" />
          <div className="flex flex-col items-center text-white">
            <span className="material-symbols-outlined text-5xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className="text-3xl tracking-tighter uppercase font-extrabold">🚨 AUXILIO</span>
          </div>
        </button>
        <p className="mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
          Mantén presionado o presiona una vez
        </p>
      </div>

      {/* Lista de Contactos de Confianza */}
      <section className="space-y-3">
        <h3 className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Contactos de Confianza</h3>
        
        <div className="space-y-2">
          {[
            { name: "Mamá (Familia)", phone: "099 111 2222", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDC9uUxppCVoGKLz45qiYVOvqpTpnKC-sCO0zcciKvGESz1P6GwA7BGncBUsT5YvoAFBuSGxOZstTUHT8FjVCiM4FXMrVmXsHvPIMWugsqbXEHozjuVSKPM0Jdne-tOmqZTesk4pP-1K0HFrzxICdUq_4MEUlt5Gdhocbme2trjMb6Fg4JFcQ7wJaLtzcBoboLaxnP8-7NMkzfwxtqvZxw-4vCFc2lDZoc3etHvVgpaSKl91KOb-L0PfID4RmMnzO19SU0YCDTRPnA" },
            { name: "Papá (Familia)", phone: "098 333 4444", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBj9GspCs1dZIM-zJWvN01quuczuLBXR1-_uEQ6mVXdZmj-nMVgtxOB1DntCglNch7pv5cQtXdguW7q41OxIP0aWCZ4B7JP40A5T-a6Lqp0Wc8dbvXUL1uNDO43I_UbdzflaGp19wcZUVLknMnGiQVUFHs6fRBYL6RsP16rh8Hqp7UxDHXxOEIbqR9iKG2qJHoK8Vfdp4_mx9d3_liPI_ZMJPgmPG9ydWNTIShtminmq0A42-nhfMaPFCpJCp_NuTi2PxDY-5XBUTk" }
          ].map((contact, i) => (
            <div 
              key={i} 
              onClick={() => handleCall(contact.name)}
              className="flex items-center justify-between p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <img src={contact.img} alt={contact.name} className="w-10 h-10 rounded-xl object-cover border border-purple-100 shadow-sm" />
                <div>
                  <p className="text-xs font-bold text-slate-800">{contact.name}</p>
                  <p className="text-[10px] font-semibold text-slate-400">{contact.phone}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-purple-900 group-hover:bg-purple-900 group-hover:text-white transition-all shadow-sm">
                <span className="material-symbols-outlined text-[16px]">call</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL DE EMERGENCIA ACTIVO (Overlay sobre el sidebar) */}
      {isAlertVisible && (
        <div className="absolute inset-0 z-50 bg-red-650/95 flex flex-col items-center justify-center text-white p-6 text-center rounded-tr-3xl animate-[fadeIn_0.2s_ease-out]">
          <div className="animate-bounce mb-6">
            <span className="material-symbols-outlined text-7xl font-bold bg-white/10 p-4 rounded-3xl border border-white/20">broadcast_on_personal</span>
          </div>
          <h2 className="text-2xl font-black mb-2 uppercase tracking-wide">SEÑAL ENVIADA</h2>
          <p className="text-xs text-red-100 mb-8 max-w-xs leading-relaxed font-semibold">
            Tus familiares han sido alertados y la central de seguridad de la UIDE ha recibido tus coordenadas en tiempo real.
          </p>
          <button 
            onClick={handleCancelSOS}
            className="bg-white text-red-650 px-8 py-3.5 rounded-xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-wider font-extrabold cursor-pointer hover:bg-red-50"
          >
            CANCELAR SEÑAL
          </button>
        </div>
      )}

    </div>
  );
}