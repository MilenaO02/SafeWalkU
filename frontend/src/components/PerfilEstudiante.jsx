import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/auth';
import { request, buildAssetUrl } from '../services/api';

const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

export default function PerfilEstudiante() {
  const { user, updateUser, showToast } = useAuth();
  const inputRef = useRef(null);

  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState({
    nombre: user?.nombre || '',
    apellido: user?.apellido || '',
    correo: user?.correo || '',
  });
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);

  // Load fresh profile data from the server on mount
  useEffect(() => {
    request('/users/me')
      .then((response) => {
        setProfile(response.data);
        setForm({
          nombre: response.data.nombre,
          apellido: response.data.apellido,
          correo: response.data.correo,
        });
        setStatus('ready');
      })
      .catch((err) => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setError(null);

    if (!NAME_PATTERN.test(form.nombre.trim())) {
      setError('El nombre solo debe contener letras, espacios, tildes, guiones o apóstrofes.');
      return;
    }
    if (!NAME_PATTERN.test(form.apellido.trim())) {
      setError('El apellido solo debe contener letras, espacios, tildes, guiones o apóstrofes.');
      return;
    }
    if (!form.correo.trim().toLowerCase().endsWith('@uide.edu.ec')) {
      setError('Solo se permiten correos institucionales @uide.edu.ec.');
      return;
    }

    setStatus('saving');
    try {
      const response = await request('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          correo: form.correo.trim().toLowerCase(),
        }),
      });
      setProfile(response.data);
      updateUser(response.data);
      setEditing(false);
      setStatus('ready');
      showToast('Perfil actualizado.', 'success');
    } catch (saveError) {
      setError(saveError.message);
      setStatus('error');
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Selecciona una imagen JPEG, PNG o WEBP.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La foto de perfil no puede superar 5 MB.');
      event.target.value = '';
      return;
    }

    setStatus('saving');
    setError(null);
    const body = new FormData();
    body.append('imagen', file);

    try {
      const response = await request(`/users/${user.id_usuario}/foto`, {
        method: 'PUT',
        body,
      });
      setProfile(response.data);
      updateUser(response.data);
      setStatus('ready');
      showToast('Foto actualizada.', 'success');
    } catch (uploadError) {
      setError(uploadError.message);
      setStatus('error');
    } finally {
      event.target.value = '';
    }
  };

  const photoSrc = profile?.foto_perfil ? buildAssetUrl(profile.foto_perfil) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5 py-4">

      {/* ── Profile card ─────────────────────────────────────────────────── */}
      <section
        aria-label="Foto y nombre de perfil"
        className="rounded-3xl border border-slate-200 bg-white p-5 md:p-8 dark:border-[#4A4A50] dark:bg-[#2B2B2F]"
      >
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">

          {/* Avatar / photo upload trigger */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Cambiar foto de perfil"
            disabled={status === 'saving'}
            className="relative min-h-11 min-w-11 rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-60"
          >
            {photoSrc ? (
              <img
                src={photoSrc}
                alt={`Foto de perfil de ${profile?.nombre}`}
                className="h-28 w-28 rounded-full border-4 border-purple-100 object-cover"
              />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-full bg-purple-100 text-3xl font-black text-purple-900 select-none">
                {profile?.nombre?.[0]}
                {profile?.apellido?.[0]}
              </span>
            )}
            <span
              aria-hidden="true"
              className="material-symbols-outlined absolute bottom-0 right-0 rounded-full bg-purple-900 p-2 text-white text-[18px]"
            >
              photo_camera
            </span>
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoUpload}
            aria-hidden="true"
          />

          {/* Name / role summary */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              {profile?.nombre} {profile?.apellido}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{profile?.correo}</p>
            <span className="mt-2 inline-block rounded-lg bg-purple-50 px-3 py-1 text-xs font-bold text-purple-900">
              {profile?.rol}
            </span>
            <div>
              <button
                type="button"
                onClick={() => { setEditing(true); setError(null); }}
                disabled={status === 'saving' || status === 'loading'}
                className="mt-5 min-h-11 rounded-xl bg-slate-100 px-5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Editar datos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Loading / error states ────────────────────────────────────────── */}
      {status === 'loading' && (
        <p role="status" className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
          Cargando perfil…
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* ── Account info ─────────────────────────────────────────────────── */}
      <section
        aria-label="Información de la cuenta"
        className="rounded-3xl border border-slate-200 bg-white p-5 text-sm dark:border-[#4A4A50] dark:bg-[#2B2B2F] dark:text-white"
      >
        <h3 className="font-black">Información de la cuenta</h3>
        <dl className="mt-4 space-y-3">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">ID</dt>
            <dd className="font-bold">{profile?.id_usuario}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Estado</dt>
            <dd className="font-bold">{profile?.estado || 'ACTIVO'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Registro</dt>
            <dd className="font-bold">
              {profile?.fecha_registro
                ? new Date(profile.fecha_registro).toLocaleDateString('es-EC')
                : '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Edit modal ───────────────────────────────────────────────────── */}
      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Editar perfil"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4"
        >
          <form
            onSubmit={handleSave}
            className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-[#2B2B2F]"
          >
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Editar perfil</h3>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
                {error}
              </p>
            )}

            {[
              { key: 'nombre',   label: 'Nombre',               type: 'text',  minLength: 2, maxLength: 100 },
              { key: 'apellido', label: 'Apellido',              type: 'text',  minLength: 2, maxLength: 100 },
              { key: 'correo',   label: 'Correo institucional',  type: 'email', maxLength: 254 },
            ].map(({ key, label, type, minLength, maxLength }) => (
              <label key={key} className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {label}
                <input
                  required
                  type={type}
                  minLength={minLength}
                  maxLength={maxLength}
                  value={form[key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-800 dark:bg-[#3C3C40] dark:border-[#4A4A50] dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </label>
            ))}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setEditing(false); setError(null); }}
                className="min-h-11 flex-1 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={status === 'saving'}
                className="min-h-11 flex-1 rounded-xl bg-purple-900 text-xs font-bold text-white hover:bg-purple-950 disabled:opacity-60 transition-colors"
              >
                {status === 'saving' ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
