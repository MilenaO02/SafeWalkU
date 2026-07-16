import React, { useEffect } from 'react';
import { useMapConfig } from '../layouts/MainLayout';

export default function ContactosEmergencia() {
  const { setMapConfig, defaultMapConfig } = useMapConfig();

  const posicionUIDELoja = [-3.9822, -79.2015];
  const posicionUPC = [-3.9840, -79.2045];
  const posicionBomberos = [-3.9805, -79.1990];

  // Configurar el mapa con puntos de asistencia cercanos
  useEffect(() => {
    setMapConfig({
      centro: posicionUIDELoja,
      zoom: 16,
      markers: [
        { position: posicionUPC, title: "Policía Nacional UPC", desc: "Unidad de Policía Comunitaria a 300 metros." },
        { position: posicionBomberos, title: "Estación de Auxilio Bomberos", desc: "Centro de rescate y emergencias." }
      ],
      circle: {
        center: posicionUIDELoja,
        radius: 300, // Círculo azul de área de cobertura
        color: '#3b82f6'
      }
    });
    
    return () => setMapConfig(defaultMapConfig);
  }, [setMapConfig, defaultMapConfig]);

  const handleCall = (contacto, numero) => {
    alert(`Llamando a ${contacto} (${numero})... En caso de estar en un dispositivo móvil, se abrirá el dialer.`);
  };

  const contactos = [
    {
      nombre: "Policía Nacional (UPC)",
      tipo: "Externo",
      descripcion: "Respuesta ante delitos de asalto, robos o incidentes violentos graves en la zona exterior.",
      numero: "911 / 101",
      color: "bg-blue-50 text-blue-900 border-blue-100",
      icon: "local_police"
    },
    {
      nombre: "Bomberos Loja",
      tipo: "Externo",
      descripcion: "Soporte ante incendios, accidentes de tránsito graves, fugas o rescate técnico.",
      numero: "102",
      color: "bg-red-50 text-red-900 border-red-100",
      icon: "fire_truck"
    },
    {
      nombre: "Cruz Roja / Hospital UTPL",
      tipo: "Médico",
      descripcion: "Red de asistencia médica y despacho de ambulancias en caso de accidente o emergencia de salud.",
      numero: "099-222-3333",
      color: "bg-green-50 text-green-900 border-green-100",
      icon: "medical_services"
    }
  ];

  return (
    <div className="space-y-5">

      <div>
        <h2 className="text-xl font-black text-purple-950 tracking-tight">Contactos de Apoyo</h2>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
          Accede de manera directa a los números de emergencia externos de Loja.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {contactos.map((contact, idx) => (
          <div
            key={idx}
            className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border shadow-sm ${contact.color}`}>
                <span className="material-symbols-outlined text-[20px] block font-bold">{contact.icon}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">{contact.tipo}</span>
                <h3 className="text-xs font-bold text-slate-900">{contact.nombre}</h3>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
              {contact.descripcion}
            </p>

            <button
              onClick={() => handleCall(contact.nombre, contact.numero)}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xs"
            >
              <span className="material-symbols-outlined text-[16px]">call</span>
              <span>Llamar {contact.numero}</span>
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}