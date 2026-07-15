import React, { useState } from 'react';

const NOTIFICATION_DEFAULTS = {
  panicAlerts:   true,
  reportAlerts:  true,
  systemUpdates: false,
  emailDigest:   true,
};

const ZONE_DEFAULTS = [
  { id: 'bellavista', label: 'Zona Bellavista', active: true },
  { id: 'concepcion', label: 'La Concepción',   active: true },
  { id: 'centro',     label: 'Centro Histórico', active: false },
];

export default function AdminSettings() {
  const [notif,      setNotif]      = useState(NOTIFICATION_DEFAULTS);
  const [zones,      setZones]      = useState(ZONE_DEFAULTS);
  const [savedOk,    setSavedOk]    = useState(false);
  const [adminEmail, setAdminEmail] = useState('admin@uide.edu.ec');

  const toggleNotif = (key)  => setNotif((p)  => ({ ...p, [key]: !p[key] }));
  const toggleZone  = (id)   => setZones((z)  => z.map((zi) => zi.id === id ? { ...zi, active: !zi.active } : zi));

  const handleSave = () => {
    console.info('Configuración guardada:', { notif, zones, adminEmail });
    setSavedOk(true);
    setTimeout(() => setSavedOk(false), 2500);
  };

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-purple-950 tracking-tight">Configuración</h2>
        <p className="text-sm text-slate-500 font-medium mt-0.5">Ajusta el comportamiento del sistema SafeWalk.</p>
      </div>

      {savedOk && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex gap-2 items-center">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          Configuración guardada correctamente.
        </div>
      )}

      {/* Datos del Admin */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900">Cuenta de Administrador</h3>
        <div className="space-y-3">
          {[
            { label: 'Nombre completo',    type: 'text',     placeholder: 'Administrador Central', readOnly: true, value: 'Admin UIDE' },
            { label: 'Correo institucional', type: 'email',  placeholder: 'admin@uide.edu.ec',     readOnly: false, value: adminEmail, onChange: setAdminEmail },
          ].map(({ label, type, placeholder, readOnly, value, onChange }) => (
            <div key={label} className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
              <input
                type={type}
                value={value}
                readOnly={readOnly}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                placeholder={placeholder}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                  readOnly
                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-default'
                    : 'bg-white border-slate-200 text-slate-800 focus:ring-2 focus:ring-purple-200 focus:border-purple-900'
                }`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Notificaciones */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900">Notificaciones</h3>
        <div className="space-y-3">
          {[
            { key: 'panicAlerts',   label: 'Alertas de Pánico SOS',       desc: 'Recibir alerta inmediata al activar un botón SOS.' },
            { key: 'reportAlerts',  label: 'Nuevos Reportes de Incidente', desc: 'Notificación al crear un reporte de incidente.' },
            { key: 'systemUpdates', label: 'Actualizaciones del Sistema',  desc: 'Notificaciones de mantenimiento y actualizaciones.' },
            { key: 'emailDigest',   label: 'Resumen Diario por Email',     desc: 'Resumen de actividad diaria al correo institucional.' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-none">
              <div>
                <p className="text-xs font-bold text-slate-800">{label}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => toggleNotif(key)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer shrink-0 ${
                  notif[key] ? 'bg-purple-900' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  notif[key] ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Zonas de Riesgo */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900">Zonas de Riesgo Activas</h3>
        <div className="space-y-3">
          {zones.map(({ id, label, active }) => (
            <div key={id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-none">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[18px] ${active ? 'text-red-500' : 'text-slate-400'}`}>location_on</span>
                <p className="text-xs font-bold text-slate-800">{label}</p>
              </div>
              <button
                onClick={() => toggleZone(id)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer shrink-0 ${
                  active ? 'bg-red-500' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  active ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
          <button
            onClick={() => alert('Agregar nueva zona de riesgo (próximamente)')}
            className="flex items-center gap-2 text-xs text-purple-900 font-bold hover:underline cursor-pointer mt-1"
          >
            <span className="material-symbols-outlined text-[16px]">add_location</span>
            Agregar zona de riesgo
          </button>
        </div>
      </section>

      {/* Guardar */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          className="bg-purple-900 hover:bg-purple-950 text-white font-bold px-8 py-3 rounded-xl shadow-md hover:shadow-lg active:scale-95 transition-all text-xs cursor-pointer flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">save</span>
          Guardar Configuración
        </button>
      </div>

    </div>
  );
}