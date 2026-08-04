import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { checkHealth, confirmPasswordReset, login as loginRequest, requestPasswordReset } from '../services/api';
import { useAuth } from '../context/auth';
import logoClaro from '../assets/icon_modoclaro.png';
import logoOscuro from '../assets/icon_modooscuro.png';

const institutionalEmail = (value) => /^[^\s@]+@uide\.edu\.ec$/i.test(value.trim());
const securePassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/.test(value);

function AuthHeader({ title, description }) {
  return <div className="mb-6 flex flex-col items-center justify-center text-center">
    <img src={logoClaro} alt="SafeWalk U" className="mx-auto mb-3 h-[110px] w-auto object-contain drop-shadow-sm dark:hidden" />
    <img src={logoOscuro} alt="SafeWalk U" className="mx-auto mb-3 hidden h-[110px] w-auto object-contain drop-shadow-sm dark:block" />
    {title && <h1 className="text-lg font-extrabold text-purple-950 dark:text-purple-200">{title}</h1>}
    <p className="mt-2 max-w-[340px] text-center text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
  </div>;
}

function AuthCard({ children }) {
  return <section className="rounded-3xl border border-white/40 bg-white/95 p-8 shadow-2xl shadow-black/30 backdrop-blur-md transition-colors duration-500 dark:border-white/10 dark:bg-[#242428]/95 md:p-10">{children}</section>;
}

function Alert({ children, type = 'error' }) {
  const style = type === 'success'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'
    : 'border-red-100 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300';
  return <div role="alert" className={`mb-4 rounded-xl border p-3.5 text-xs font-semibold ${style}`}>{children}</div>;
}

export default function LoginEstudiante() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: saveSession, showToast } = useAuth();
  const resetToken = new URLSearchParams(window.location.search).get('reset_token');
  const [mode, setMode] = useState(() => resetToken ? 'confirm' : 'login');
  const [formData, setFormData] = useState({ email: '', password: '', remember: true });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);
  const [successAlert, setSuccessAlert] = useState(null);
  const [healthStatus, setHealthStatus] = useState('connecting');

  useEffect(() => {
    let active = true;
    checkHealth().then((response) => {
      if (active) setHealthStatus(response?.success && response?.api === 'online' && response?.database === 'connected' ? 'operational' : 'unavailable');
    }).catch(() => active && setHealthStatus('unavailable'));
    return () => { active = false; };
  }, []);

  const returnToLogin = () => {
    window.history.replaceState({}, '', '/login');
    setErrorAlert(null);
    setSuccessAlert(null);
    setMode('login');
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorAlert(null);
    const correo = formData.email.trim().toLowerCase();
    if (!institutionalEmail(correo)) {
      setErrorAlert('Ingresa un correo institucional @uide.edu.ec valido.');
      return;
    }
    setLoading(true);
    try {
      const data = await loginRequest({ correo, contrasena: formData.password });
      const usuario = data.usuario ?? {};
      saveSession({ id_usuario: usuario.id_usuario, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo ?? correo, rol: usuario.rol ?? 'ESTUDIANTE', roles: usuario.roles ?? [usuario.rol ?? 'ESTUDIANTE'], foto_perfil: usuario.foto_perfil ?? null }, data.token, formData.remember ? 'localStorage' : 'sessionStorage');
      showToast('Sesion iniciada correctamente', 'success');
      navigate(location.state?.from?.pathname || (usuario.rol === 'ADMINISTRADOR' ? '/admin' : '/app'), { replace: true });
    } catch (error) {
      setErrorAlert(error.message || 'No fue posible iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoveryRequest = async (event) => {
    event.preventDefault();
    setErrorAlert(null);
    setSuccessAlert(null);
    const correo = recoveryEmail.trim().toLowerCase();
    if (!institutionalEmail(correo)) {
      setErrorAlert('Ingresa un correo institucional @uide.edu.ec valido.');
      return;
    }
    setLoading(true);
    try {
      const data = await requestPasswordReset({ correo });
      setSuccessAlert(data.message);
    } catch (error) {
      setErrorAlert(error.message || 'No fue posible solicitar la recuperacion.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setErrorAlert(null);
    if (!resetToken) {
      setErrorAlert('El enlace de recuperacion no es valido. Solicita uno nuevo.');
      return;
    }
    if (!securePassword(newPassword)) {
      setErrorAlert('La contrasena debe tener 8 a 72 caracteres e incluir mayuscula, minuscula y numero.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorAlert('Las contrasenas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const data = await confirmPasswordReset({ token: resetToken, contrasena: newPassword });
      showToast(data.message || 'Contrasena actualizada correctamente.', 'success');
      returnToLogin();
    } catch (error) {
      setErrorAlert(error.message || 'No fue posible actualizar la contrasena.');
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'request') {
    return <div className="space-y-4"><AuthCard>
      <AuthHeader title="Recuperar contrasena" description="Te enviaremos un enlace de un solo uso a tu correo institucional." />
      {errorAlert && <Alert>{errorAlert}</Alert>}
      {successAlert ? <><Alert type="success">{successAlert}</Alert><button type="button" onClick={returnToLogin} className="min-h-12 w-full rounded-xl bg-purple-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-purple-950 dark:bg-purple-600">Volver a iniciar sesion</button></> : <form className="space-y-4" onSubmit={handleRecoveryRequest} noValidate>
        <label className="block space-y-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Correo institucional<div className="relative"><span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-slate-400">alternate_email</span><input type="email" required autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} placeholder="usuario@uide.edu.ec" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /></div></label>
        <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-purple-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-purple-950 disabled:opacity-70 dark:bg-purple-600">{loading ? 'Enviando...' : 'Enviar enlace de recuperacion'}</button>
        <button type="button" onClick={returnToLogin} className="min-h-11 w-full text-sm font-bold text-purple-900 hover:underline dark:text-purple-300">Cancelar</button>
      </form>}
    </AuthCard></div>;
  }

  if (mode === 'confirm') {
    return <div className="space-y-4"><AuthCard>
      <AuthHeader title="Crea una nueva contrasena" description="Usa una contrasena segura que no hayas utilizado antes." />
      {errorAlert && <Alert>{errorAlert}</Alert>}
      <form className="space-y-4" onSubmit={handlePasswordReset} noValidate>
        <label className="block space-y-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Nueva contrasena<input type="password" required autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /></label>
        <p className="text-xs text-slate-500 dark:text-slate-400">Minimo 8 caracteres, con mayuscula, minuscula y numero.</p>
        <label className="block space-y-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Confirmar contrasena<input type="password" required autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /></label>
        <button type="submit" disabled={loading} className="min-h-12 w-full rounded-xl bg-purple-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-purple-950 disabled:opacity-70 dark:bg-purple-600">{loading ? 'Actualizando...' : 'Actualizar contrasena'}</button>
        <button type="button" onClick={returnToLogin} className="min-h-11 w-full text-sm font-bold text-purple-900 hover:underline dark:text-purple-300">Volver al inicio</button>
      </form>
    </AuthCard></div>;
  }

  return <div className="space-y-4">
    <AuthCard>
      <AuthHeader description="Inicia sesion con tu cuenta institucional de la UIDE para acompanamiento preventivo." />
      {errorAlert && <Alert>{errorAlert}</Alert>}
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="block space-y-1 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Correo institucional<div className="relative"><span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] leading-none text-slate-400">alternate_email</span><input id="email" name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange} placeholder="usuario@uide.edu.ec" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /></div></label>
        <div className="space-y-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="password">Contrasena</label><button type="button" onClick={() => { setErrorAlert(null); setSuccessAlert(null); setMode('request'); }} className="text-left text-xs font-semibold text-purple-900 hover:underline dark:text-purple-300">Recuperar contrasena</button></div><div className="relative"><span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] leading-none text-slate-400">lock</span><input id="password" name="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={formData.password} onChange={handleChange} placeholder="********" className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-12 text-sm font-medium text-slate-800 transition focus:border-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-[#4A4A50] dark:bg-black/20 dark:text-slate-100" /><button type="button" aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'} onClick={() => setShowPassword((value) => !value)} className="absolute right-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><span className="material-symbols-outlined text-[18px] leading-none">{showPassword ? 'visibility_off' : 'visibility'}</span></button></div></div>
        <label className="flex min-h-11 items-center gap-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300"><input id="remember" name="remember" type="checkbox" checked={formData.remember} onChange={handleChange} className="h-5 w-5 rounded border-slate-300 text-purple-900 focus:ring-purple-900" />Mantener sesion iniciada</label>
        <button type="submit" disabled={loading} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-900 px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-purple-950 hover:shadow-lg active:scale-[0.98] disabled:opacity-70 dark:bg-purple-600 dark:hover:bg-purple-700">{loading ? 'Validando...' : <>Iniciar sesion<span className="material-symbols-outlined text-[18px]">arrow_forward</span></>}</button>
      </form>
      <div className="mt-6 space-y-3 border-t border-slate-100 pt-4 text-center dark:border-[#4A4A50]"><p className="text-xs font-medium text-slate-500 dark:text-slate-400">No tienes cuenta? <Link to="/registro" className="font-bold text-purple-900 transition hover:underline dark:text-purple-300">Registrate aqui</Link></p><p className="text-xs font-medium text-slate-400 dark:text-slate-500">Problemas para acceder? <a className="font-semibold hover:underline" href="mailto:soporte@uide.edu.ec?subject=Soporte%20SafeWalk%20U">Soporte TI</a></p></div>
    </AuthCard>
    <div className="flex items-center justify-center gap-2 text-white/90" role="status" aria-live="polite"><span className={`h-2 w-2 rounded-full ${healthStatus === 'operational' ? 'bg-green-400' : healthStatus === 'unavailable' ? 'bg-red-400' : 'animate-pulse bg-amber-300'}`} /><span className="text-[10px] font-bold uppercase tracking-widest">{healthStatus === 'operational' ? 'Sistema operativo' : healthStatus === 'unavailable' ? 'Servicio temporalmente no disponible' : 'Conectando...'}</span></div>
  </div>;
}
