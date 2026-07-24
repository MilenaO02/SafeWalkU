import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/auth';
import { request } from '../services/api';

export default function StudentProfile() {
  const { user, updateUser, showToast } = useAuth();
  const inputRef = useRef(null);
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({ nombre: user?.nombre || '', apellido: user?.apellido || '', correo: user?.correo || '' });
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  useEffect(() => {
    request('/users/me').then((response) => { setProfile(response.data); setForm({ nombre: response.data.nombre, apellido: response.data.apellido, correo: response.data.correo }); setStatus('ready'); }).catch((loadError) => { setError(loadError.message); setStatus('error'); });
  }, []);

  const save = async (event) => {
    event.preventDefault(); setStatus('saving'); setError(null);
    try {
      const response = await request('/users/me', { method: 'PUT', body: JSON.stringify({ nombre: form.nombre.trim(), apellido: form.apellido.trim(), correo: form.correo.trim().toLowerCase() }) });
      setProfile(response.data); updateUser(response.data); setEditing(false); setStatus('ready'); showToast('Perfil actualizado.');
    } catch (saveError) { setError(saveError.message); setStatus('error'); }
  };

  const uploadPhoto = async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    setStatus('saving'); setError(null);
    const body = new FormData(); body.append('imagen', file);
    try {
      const response = await request(`/users/${user.id_usuario}/foto`, { method: 'PUT', body });
      setProfile(response.data); updateUser(response.data); setStatus('ready'); showToast('Foto actualizada.');
    } catch (uploadError) { setError(uploadError.message); setStatus('error'); }
  };

  return <div className="mx-auto max-w-2xl space-y-5 py-4">
    <section className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 dark:border-[#4A4A50] dark:bg-[#2B2B2F]">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <button type="button" onClick={() => inputRef.current?.click()} aria-label="Cambiar foto de perfil" className="relative min-h-11 min-w-11 rounded-full">
          {profile?.foto_perfil ? <img src={profile.foto_perfil} alt="Foto de perfil" className="h-28 w-28 rounded-full border-4 border-purple-100 object-cover" /> : <span className="flex h-28 w-28 items-center justify-center rounded-full bg-purple-100 text-3xl font-black text-purple-900">{profile?.nombre?.[0]}{profile?.apellido?.[0]}</span>}
          <span className="material-symbols-outlined absolute bottom-0 right-0 rounded-full bg-purple-900 p-2 text-white">photo_camera</span>
        </button>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={uploadPhoto} />
        <div className="flex-1 text-center sm:text-left"><h2 className="text-xl font-black text-slate-900 dark:text-white">{profile?.nombre} {profile?.apellido}</h2><p className="mt-1 text-sm text-slate-500">{profile?.correo}</p><span className="mt-2 inline-block rounded-lg bg-purple-50 px-3 py-1 text-xs font-bold text-purple-900">{profile?.rol}</span><div><button onClick={() => setEditing(true)} className="mt-5 min-h-11 rounded-xl bg-slate-100 px-5 text-xs font-bold text-slate-800">Editar datos</button></div></div>
      </div>
    </section>
    {status === 'loading' && <p className="rounded-xl bg-slate-50 p-4 text-sm">Cargando perfil…</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
    <section className="rounded-3xl border border-slate-200 bg-white p-5 text-sm dark:border-[#4A4A50] dark:bg-[#2B2B2F] dark:text-white"><h3 className="font-black">Información de la cuenta</h3><dl className="mt-4 space-y-3"><div className="flex justify-between gap-4"><dt className="text-slate-500">ID</dt><dd className="font-bold">{profile?.id_usuario}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Estado</dt><dd className="font-bold">{profile?.estado || 'ACTIVO'}</dd></div><div className="flex justify-between gap-4"><dt className="text-slate-500">Registro</dt><dd className="font-bold">{profile?.fecha_registro ? new Date(profile.fecha_registro).toLocaleDateString() : '—'}</dd></div></dl></section>
    {editing && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"><form onSubmit={save} className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6"><h3 className="text-lg font-black">Editar perfil</h3>{[['nombre', 'Nombre'], ['apellido', 'Apellido'], ['correo', 'Correo institucional']].map(([key, label]) => <label key={key} className="block text-xs font-bold">{label}<input required type={key === 'correo' ? 'email' : 'text'} value={form[key]} onChange={(event) => setForm((value) => ({ ...value, [key]: event.target.value }))} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm" /></label>)}<div className="flex gap-2"><button type="button" onClick={() => setEditing(false)} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-xs font-bold">Cancelar</button><button disabled={status === 'saving'} className="min-h-11 flex-1 rounded-xl bg-purple-900 text-xs font-bold text-white">Guardar</button></div></form></div>}
  </div>;
}
