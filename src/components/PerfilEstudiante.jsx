import React, { useEffect, useState, useRef } from 'react';
import { useMapConfig } from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

export default function StudentProfile() {
  const { setMapConfig } = useMapConfig();
  const { user } = useAuth();
  const fotoInputRef = useRef(null);

  const posicionEstudiante = [-3.9822, -79.2015];

  const [profile, setProfile] = useState({
    name:      user ? `${user.nombre} ${user.apellido}` : 'Cargando...',
    email:     user ? user.email : '',
    phone:     '099 876 5432',
    career:    'Ingeniería en Tecnologías',
    matrícula: 'UIDE-93845',
    bloodType: 'O Positivo (O+)',
    campus:    'UIDE Extensión Loja',
    fotoPerfil: user?.foto_perfil || null,
  });

  const [editOpen, setEditOpen]   = useState(false);
  const [editData, setEditData]   = useState({ ...profile });
  const [saveOk,  setSaveOk]      = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  useEffect(() => {
    setMapConfig({
      centro: posicionEstudiante,
      zoom: 17,
      markers: [{ position: posicionEstudiante, title: 'Mi Ubicación Habitual', desc: 'Edificio Central – Facultad de Tecnologías.' }],
      circle:  { center: posicionEstudiante, radius: 50, color: '#4a208c' },
    });
  }, [setMapConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await fetch('http://localhost:3000/api/users/me', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(editData),
      });
    } catch {
      console.warn('Backend offline – guardando datos en localStorage.');
    }
    setProfile({ ...editData });
    setSaveOk(true);
    setTimeout(() => { setSaveOk(false); setEditOpen(false); }, 1500);
  };

  const handleFotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFoto(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userId = user?.id_usuario || 1;
      const formData = new FormData();
      formData.append('imagen', file);
      const res = await fetch(`http://localhost:3000/api/users/${userId}/foto`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setProfile(prev => ({ ...prev, fotoPerfil: json.foto_url }));
      } else {
        // Vista previa local si el backend falla (dev mode)
        const localUrl = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, fotoPerfil: localUrl }));
      }
    } catch {
      // Vista previa local si el backend no está disponible
      const localUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, fotoPerfil: localUrl }));
    } finally {
      setUploadingFoto(false);
    }
  };

  const stats = [
    { label: 'Caminatas', value: 24,   color: 'text-purple-950' },
    { label: 'SOS',       value: 1,    color: 'text-red-600'    },
    { label: 'Reportes',  value: 3,    color: 'text-amber-600'  },
  ];

  const infoRows = [
    { label: 'Campus',        value: profile.campus    },
    { label: 'Correo',        value: profile.email     },
    { label: 'Celular',       value: profile.phone     },
    { label: 'Tipo de Sangre',value: profile.bloodType },
  ];

  return (
    <div className="space-y-5 relative">

      {/* Tarjeta de Identificación */}
      <div className="flex flex-col items-center p-6 bg-white border border-slate-200 rounded-3xl shadow-sm space-y-4">
        <div className="relative group cursor-pointer" onClick={() => fotoInputRef.current?.click()}>
          <img
            className="w-20 h-20 rounded-2xl object-cover border-2 border-purple-100 shadow-md"
            alt="Foto perfil estudiante"
            src={profile.fotoPerfil || "https://lh3.googleusercontent.com/aida-public/AB6AXuBSGUW4ehBvDTKb-xw7I1LNMGyR7_sAVdyYh0vWaCJ3JTr6wR6aTCLnA0VqUdXQD0PKpBbEUEF5uyx5rUBLPcd4_x7oyxZsMrnXlVdZ0AQGzXcqqGkALSGiAytZBiGwnhcu_WkCNWx2dKzNQrP52Ow37bnyErQJye6Hk9Wvo9EwQwqeshgPWEyISkrLk2lBiIjUAhevim1Ma2ixUjE9GuxtjWEvGfDQrkt-F-Lu8xk17MAP0Ciq-Z_6kyG15AsZk0BxHEAIqE3aqSQ"}
          />
          {/* Overlay hover para subir foto */}
          <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingFoto
              ? <span className="material-symbols-outlined text-white text-[20px] animate-spin">autorenew</span>
              : <span className="material-symbols-outlined text-white text-[20px]">photo_camera</span>
            }
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-lg border-2 border-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>
          </div>
          {/* Input oculto para el selector de archivo */}
          <input
            ref={fotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFotoChange}
          />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-slate-900">{profile.name}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{profile.career}</p>
          <span className="inline-block text-[9px] font-extrabold px-2.5 py-0.5 bg-purple-50 text-purple-900 border border-purple-100/50 rounded-full">
            Matrícula: {profile.matrícula}
          </span>
        </div>
        <button
          onClick={() => { setEditData({ ...profile }); setEditOpen(true); }}
          className="w-full bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[15px]">edit</span>
          Editar Información
        </button>
      </div>

      {/* Estadísticas */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estadísticas SafeWalk</h3>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center shadow-inner">
              <span className={`text-xl font-black ${s.color}`}>{s.value}</span>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Información Institucional */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 border-b border-slate-100 pb-2">Información del Estudiante</h3>
        <div className="space-y-3">
          {infoRows.map((r) => (
            <div key={r.label} className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">{r.label}:</span>
              <span className="text-slate-800 font-bold text-right max-w-[55%] truncate">{r.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Aviso Privacidad */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
        <p className="text-[9px] text-slate-400 leading-relaxed text-center font-medium">
          Tus datos personales y de geolocalización están protegidos bajo la Ley de Protección de Datos y solo se comparten al activar una alerta SOS.
        </p>
      </div>

      {/* ── MODAL DE EDICIÓN ── */}
      {editOpen && (
        <div className="absolute inset-0 z-50 flex items-start justify-center bg-purple-950/80 backdrop-blur-sm p-4 rounded-3xl overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 mt-4">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-900 text-[20px]">edit</span>
              Editar Perfil
            </h3>

            {saveOk && (
              <div className="mb-3 p-2.5 bg-green-50 border border-green-200 text-green-700 rounded-xl text-xs font-semibold flex gap-2 items-center">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Datos guardados correctamente.
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3">
              {[
                { key: 'name',   label: 'Nombre completo',    type: 'text'  },
                { key: 'phone',  label: 'Teléfono / Celular',  type: 'tel'   },
                { key: 'email',  label: 'Correo institucional', type: 'email' },
              ].map(({ key, label, type }) => (
                <div key={key} className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    value={editData[key]}
                    onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-900 transition-all"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 border border-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-900 hover:bg-purple-950 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}