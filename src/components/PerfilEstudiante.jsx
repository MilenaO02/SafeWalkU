import React, { useEffect, useState, useRef } from 'react';
import { useMapConfig } from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl } from '../services/api';

export default function StudentProfile() {
  const { setMapConfig } = useMapConfig();
  const { user, updateUser } = useAuth();
  const fotoInputRef = useRef(null);

  const posicionEstudiante = [-3.9822, -79.2015];

  const [profile, setProfile] = useState({
    name:      user ? `${user.nombre} ${user.apellido}` : 'Cargando...',
    email:     user ? (user.correo || user.email) : '',
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
      const res = await fetch(buildApiUrl('/users/me'), {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify(editData),
      });
      if (!res.ok) {
        throw new Error('Error en el servidor al guardar');
      }
      const [nombre, ...apellidos] = editData.name.split(' ');
      updateUser({ nombre, apellido: apellidos.join(' '), correo: editData.email });
      setProfile({ ...editData });
      setSaveOk(true);
      setTimeout(() => { 
        setSaveOk(false); 
        setEditOpen(false); 
      }, 1500);
    } catch (err) {
      console.error('Error guardando los datos:', err);
      alert('Hubo un problema al guardar los cambios en el servidor. Revisa tu conexión o vuelve a intentar.');
    }
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
      const res = await fetch(buildApiUrl(`/users/${userId}/foto`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        setProfile(prev => ({ ...prev, fotoPerfil: json.foto_url }));
        updateUser({ foto_perfil: json.foto_url });
      } else {
        // Vista previa local si el backend falla (dev mode)
        const localUrl = URL.createObjectURL(file);
        setProfile(prev => ({ ...prev, fotoPerfil: localUrl }));
        updateUser({ foto_perfil: localUrl });
      }
    } catch {
      // Vista previa local si el backend no está disponible
      const localUrl = URL.createObjectURL(file);
      setProfile(prev => ({ ...prev, fotoPerfil: localUrl }));
      updateUser({ foto_perfil: localUrl });
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
    <div className="max-w-3xl mx-auto space-y-6 relative py-4">

      {/* Tarjeta de Identificación */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-6 md:p-8 bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-3xl shadow-sm transition-colors duration-500">
        
        {/* Foto de perfil */}
        <div className="relative group cursor-pointer flex-shrink-0" onClick={() => fotoInputRef.current?.click()}>
          <img
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-purple-50 dark:border-[#4A4A50] shadow-md"
            alt="Foto perfil estudiante"
            src={profile.fotoPerfil || "https://lh3.googleusercontent.com/aida-public/AB6AXuBSGUW4ehBvDTKb-xw7I1LNMGyR7_sAVdyYh0vWaCJ3JTr6wR6aTCLnA0VqUdXQD0PKpBbEUEF5uyx5rUBLPcd4_x7oyxZsMrnXlVdZ0AQGzXcqqGkALSGiAytZBiGwnhcu_WkCNWx2dKzNQrP52Ow37bnyErQJye6Hk9Wvo9EwQwqeshgPWEyISkrLk2lBiIjUAhevim1Ma2ixUjE9GuxtjWEvGfDQrkt-F-Lu8xk17MAP0Ciq-Z_6kyG15AsZk0BxHEAIqE3aqSQ"}
          />
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploadingFoto
              ? <span className="material-symbols-outlined text-white text-[24px] animate-spin">autorenew</span>
              : <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
            }
          </div>
          <div className="absolute bottom-0 right-0 md:bottom-2 md:right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white dark:border-[#222226] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-[14px] font-bold">check</span>
          </div>
          <input ref={fotoInputRef} type="file" accept="image/*" className="hidden" onChange={handleFotoChange} />
        </div>

        {/* Datos y Botón */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100">{profile.name}</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">{profile.career}</p>
          </div>
          <div className="inline-block">
            <span className="text-xs font-extrabold px-3 py-1 bg-purple-50 dark:bg-purple-900/40 text-purple-900 dark:text-purple-300 rounded-lg">
              Matrícula: {profile.matrícula}
            </span>
          </div>
          <div className="pt-2">
            <button
              onClick={() => { setEditData({ ...profile }); setEditOpen(true); }}
              className="w-full md:w-auto bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-bold py-2.5 px-6 rounded-xl transition-colors cursor-pointer flex items-center justify-center md:justify-start gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Editar Perfil
            </button>
          </div>
        </div>

      </div>

      {/* Estadísticas */}
      <section className="space-y-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estadísticas SafeWalk</h3>
        <div className="grid grid-cols-3 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-50 dark:bg-[#2B2B2F]/50 border border-slate-100 dark:border-[#4A4A50]/50 rounded-2xl p-3 text-center shadow-inner transition-colors">
              <span className={`text-xl font-black ${s.color.includes('purple') ? 'text-purple-950 dark:text-purple-400' : s.color.includes('red') ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>{s.value}</span>
              <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Información Institucional */}
      <section className="bg-white dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-3xl p-6 shadow-sm space-y-4 transition-colors duration-500">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-[#4A4A50] pb-3">Información Personal</h3>
        <div className="space-y-4">
          {infoRows.map((r) => (
            <div key={r.label} className="flex flex-col sm:flex-row sm:items-center justify-between text-sm">
              <span className="text-slate-500 font-medium mb-1 sm:mb-0">{r.label}</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold">{r.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Aviso Privacidad */}
      <div className="p-4 bg-slate-50 dark:bg-[#2B2B2F]/30 rounded-2xl border border-slate-100/50 dark:border-[#4A4A50]/30 transition-colors">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-relaxed text-center font-medium">
          Tus datos personales y de geolocalización están protegidos bajo la Ley de Protección de Datos y solo se comparten al activar una alerta SOS.
        </p>
      </div>

      {/* ── MODAL DE EDICIÓN ── */}
      {editOpen && (
        <div className="absolute inset-0 z-50 flex items-start justify-center bg-purple-950/80 dark:bg-black/80 backdrop-blur-sm p-4 rounded-3xl overflow-y-auto transition-all">
          <div className="bg-white dark:bg-[#3C3C40] rounded-3xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-[#222226] mt-4">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-purple-900 dark:text-purple-400 text-[20px]">edit</span>
              Editar Perfil
            </h3>

            {saveOk && (
              <div className="mb-3 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-700 dark:text-green-400 rounded-xl text-xs font-semibold flex gap-2 items-center">
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
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</label>
                  <input
                    type={type}
                    value={editData[key]}
                    onChange={(e) => setEditData((p) => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#2B2B2F] border border-slate-200 dark:border-[#4A4A50] rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-900 focus:border-purple-900 dark:focus:border-purple-500 transition-all"
                  />
                </div>
              ))}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 border border-slate-200 dark:border-[#4A4A50] text-slate-600 dark:text-slate-300 font-bold py-2.5 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-900 dark:bg-purple-600 hover:bg-purple-950 dark:hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-md"
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