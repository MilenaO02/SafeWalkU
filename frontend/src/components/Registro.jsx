import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';
import logoClaro from '../assets/icon_modoclaro.png';
import logoOscuro from '../assets/icon_modooscuro.png';

const namePattern = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u;

export default function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ nombre: '', apellido: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    const nombre = formData.nombre.trim();
    const apellido = formData.apellido.trim();
    const correo = formData.email.trim().toLowerCase();
    if (!namePattern.test(nombre)) return setError('El nombre solo debe contener letras, espacios y tildes.');
    if (!namePattern.test(apellido)) return setError('El apellido solo debe contener letras, espacios y tildes.');
    if (!/^[^\s@]+@uide\.edu\.ec$/i.test(correo)) return setError('Solo se permiten correos institucionales @uide.edu.ec.');
    if (formData.password !== formData.confirmPassword) return setError('Las contraseñas no coinciden.');
    if (formData.password.length < 8 || !/[a-z]/.test(formData.password) || !/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) return setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.');
    setLoading(true);
    try {
      await register({ nombre, apellido, correo, contrasena: formData.password });
      setSuccess(true);
      window.setTimeout(() => navigate('/'), 2000);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible crear la cuenta.');
    } finally { setLoading(false); }
  };

  const field = (label, name, icon, type, placeholder, autoComplete) => <label className="block space-y-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor={name}>{label}<div className="relative"><span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">{icon}</span><input id={name} name={name} type={type} required autoComplete={autoComplete} value={formData[name]} onChange={handleChange} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /></div></label>;

  return <section className="rounded-3xl border border-white/40 bg-white/95 p-8 shadow-2xl shadow-black/30 backdrop-blur-md transition-colors duration-500 dark:border-white/10 dark:bg-[#242428]/95 md:p-10">
    <div className="mb-6 flex flex-col items-center justify-center text-center">
      <img src={logoClaro} alt="SafeWalk U" className="mx-auto mb-3 h-[110px] w-auto object-contain drop-shadow-sm dark:hidden" />
      <img src={logoOscuro} alt="SafeWalk U" className="mx-auto mb-3 hidden h-[110px] w-auto object-contain drop-shadow-sm dark:block" />
      <h1 className="text-2xl font-black tracking-tight text-purple-950 dark:text-white">Crear cuenta</h1>
      <p className="mt-1 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
        Regístrate con tu correo institucional UIDE.
      </p>
    </div>
    {error && <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"><span className="material-symbols-outlined text-[18px]">error</span>{error}</div>}
    {success && <div role="status" className="mb-4 flex gap-2 rounded-xl border border-green-100 bg-green-50 p-3.5 text-xs font-semibold text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300"><span className="material-symbols-outlined text-[18px]">check_circle</span>¡Cuenta creada! Redirigiendo al inicio de sesión…</div>}
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {field('Nombre', 'nombre', 'person', 'text', 'Ej.: Martina', 'given-name')}
      {field('Apellido', 'apellido', 'badge', 'text', 'Ej.: García', 'family-name')}
      {field('Correo institucional', 'email', 'alternate_email', 'email', 'usuario@uide.edu.ec', 'email')}
      {field('Contraseña', 'password', 'lock', 'password', '8+ caracteres, mayúscula, minúscula y número', 'new-password')}
      {field('Confirmar contraseña', 'confirmPassword', 'lock_reset', 'password', 'Repite tu contraseña', 'new-password')}
      <button type="submit" disabled={loading || success} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-purple-950 hover:shadow-lg active:scale-[0.98] disabled:opacity-70 dark:bg-purple-600 dark:hover:bg-purple-700">{loading ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Registrando…</> : <>Crear mi cuenta<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}</button>
    </form>
    <div className="mt-6 border-t border-slate-100 pt-4 text-center dark:border-[#4A4A50]"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">¿Ya tienes cuenta? <Link to="/" className="font-bold text-purple-900 transition hover:underline dark:text-purple-300">Inicia sesión</Link></p></div>
  </section>;
}
