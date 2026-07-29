import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { checkHealth, login as loginRequest } from '../services/api';
import { useAuth } from '../context/auth';
import logoClaro from '../assets/icon_modoclaro.png';
import logoOscuro from '../assets/icon_modooscuro.png';

export default function LoginEstudiante() {
  const navigate = useNavigate();
  const { login: saveSession, showToast } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '', remember: true });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);
  const [healthStatus, setHealthStatus] = useState('connecting');

  useEffect(() => {
    let active = true;
    checkHealth().then((response) => {
      if (!active) return;
      setHealthStatus(response?.success && response?.api === 'online' && response?.database === 'connected' ? 'operational' : 'unavailable');
    }).catch(() => active && setHealthStatus('unavailable'));
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorAlert(null);
    const correo = formData.email.trim().toLowerCase();
    if (!/^[^\s@]+@uide\.edu\.ec$/i.test(correo)) { setErrorAlert('Ingresa un correo institucional @uide.edu.ec válido.'); return; }
    setLoading(true);
    try {
      const data = await loginRequest({ correo, contrasena: formData.password });
      const usuario = data.usuario ?? {};
      saveSession({ id_usuario: usuario.id_usuario, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo ?? correo, rol: usuario.rol ?? 'ESTUDIANTE', roles: usuario.roles ?? [usuario.rol ?? 'ESTUDIANTE'], foto_perfil: usuario.foto_perfil ?? null }, data.token, formData.remember ? 'localStorage' : 'sessionStorage');
      showToast('Sesión iniciada correctamente', 'success');
      navigate(usuario.rol === 'ADMINISTRADOR' ? '/admin' : '/app');
    } catch (error) { setErrorAlert(error.message || 'No fue posible iniciar sesión.'); }
    finally { setLoading(false); }
  };

  return <div className="space-y-4">
    <section className="rounded-3xl border border-white/40 bg-white/95 p-8 shadow-2xl shadow-black/30 backdrop-blur-md transition-colors duration-500 dark:border-white/10 dark:bg-[#242428]/95 md:p-10">
      <div className="mb-8 flex flex-col items-center"><img src={logoClaro} alt="SafeWalk U" className="mb-2 h-[130px] w-auto object-contain drop-shadow-sm dark:hidden" /><img src={logoOscuro} alt="SafeWalk U" className="mb-2 hidden h-[130px] w-auto object-contain drop-shadow-sm dark:block" /><p className="mt-2 text-center text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">Inicia sesión con tu cuenta institucional de la UIDE para acompañamiento preventivo.</p></div>
      {errorAlert && <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs font-semibold text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"><span className="material-symbols-outlined text-[18px]">error</span>{errorAlert}</div>}
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block space-y-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Correo institucional<div className="relative"><span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">alternate_email</span><input id="email" name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="usuario@uide.edu.ec" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /></div></label>
        <div className="space-y-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="password">Contraseña</label><a className="text-xs font-semibold text-purple-900 hover:underline dark:text-purple-300" href="mailto:soporte@uide.edu.ec?subject=Recuperación%20de%20cuenta%20SafeWalk%20U">Recuperar con Soporte TI</a></div><div className="relative"><span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">lock</span><input id="password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-12 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /><button type="button" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShowPassword((value) => !value)} className="absolute inset-y-0 right-0 px-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span></button></div></div>
        <label className="flex min-h-11 items-center gap-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300"><input id="remember" name="remember" type="checkbox" checked={formData.remember} onChange={handleChange} className="h-5 w-5 rounded border-slate-300 text-purple-900 focus:ring-purple-900" />Mantener sesión iniciada</label>
        <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-purple-950 hover:shadow-lg active:scale-[0.98] disabled:opacity-70 dark:bg-purple-600 dark:hover:bg-purple-700">{loading ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Validando…</> : <>Iniciar sesión<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}</button>
      </form>
      <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-center dark:border-[#4A4A50]"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">¿No tienes cuenta? <Link to="/registro" className="font-bold text-purple-900 transition hover:underline dark:text-purple-300">Regístrate aquí</Link></p><p className="text-xs font-medium text-slate-400 dark:text-slate-500">¿Problemas para acceder? <a className="font-semibold hover:underline" href="mailto:soporte@uide.edu.ec?subject=Soporte%20SafeWalk%20U">Soporte TI</a></p></div>
    </section>
    <div className="flex items-center justify-center gap-2 text-white/90" role="status" aria-live="polite"><span className={`h-2 w-2 rounded-full ${healthStatus === 'operational' ? 'bg-green-400' : healthStatus === 'unavailable' ? 'bg-red-400' : 'animate-pulse bg-amber-300'}`} /><span className="text-[10px] font-bold uppercase tracking-widest">{healthStatus === 'operational' ? 'Sistema operativo' : healthStatus === 'unavailable' ? 'Servicio temporalmente no disponible' : 'Conectando…'}</span></div>
  </div>;
}
