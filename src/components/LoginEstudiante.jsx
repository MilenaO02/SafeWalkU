import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login: saveSession, showToast } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorAlert(null);

    const correo = formData.email.trim().toLowerCase();

    if (!/^[^\s@]+@uide\.edu\.ec$/i.test(correo)) {
      setErrorAlert('Solo se permiten correos institucionales con dominio @uide.edu.ec');
      setLoading(false);
      return;
    }

    try {
      const data = await loginRequest({ correo, contrasena: formData.password });
      const usuario = data.usuario ?? {};
      const storagePreference = formData.remember ? 'localStorage' : 'sessionStorage';

      saveSession(
        {
          id_usuario: usuario.id_usuario,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          correo: usuario.correo ?? correo,
          rol: usuario.rol ?? 'ESTUDIANTE',
          foto_perfil: usuario.foto_perfil ?? null,
        },
        data.token,
        storagePreference
      );

      showToast('Sesión iniciada correctamente');
      navigate(usuario.rol === 'ADMINISTRADOR' ? '/admin' : '/app');
    } catch (err) {
      setErrorAlert(err.message || 'No fue posible iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f7f9fb] min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans w-full">
      {/* Subtle Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#330071]/5 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-[#3d5ca2]/5 rounded-full blur-3xl animate-[pulse_6s_ease-in-out_infinite] [animation-delay:-3s]"></div>
      </div>

      {/* Login Container */}
      <main className="relative z-10 w-full max-w-[440px]">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-lg md:p-10">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 mb-4 flex items-center justify-center p-3 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm">
              <span className="material-symbols-outlined text-[44px] text-purple-900 font-bold block">shield</span>
            </div>
            <h1 className="text-2xl font-black text-purple-950 tracking-tight">SafeWalk U</h1>
            <p className="text-xs text-slate-500 mt-2 text-center font-medium leading-relaxed">
              Inicia sesión con tu cuenta institucional de la UIDE para acompañamiento preventivo.
            </p>
          </div>

          {/* Alerta de Error Reactiva */}
          {errorAlert && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4 border border-red-100">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorAlert}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* Institutional Email Field */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="email">
                Correo institucional
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-900 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                </div>
                <input 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-900 transition-all font-medium" 
                  id="email" 
                  name="email"
                  type="email"
                  placeholder="usuario@uide.edu.ec" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider" htmlFor="password">
                  Contraseña
                </label>
                <a className="text-xs font-semibold text-purple-900 hover:underline transition-all" href="#">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-900 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <input 
                  className="w-full pl-11 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-900 transition-all font-medium" 
                  id="password" 
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center space-x-2 py-1">
              <input 
                className="w-4 h-4 rounded border-slate-300 text-purple-900 focus:ring-purple-900" 
                id="remember" 
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
              />
              <label className="text-xs font-bold text-slate-600 cursor-pointer select-none" htmlFor="remember">
                Mantener sesión iniciada
              </label>
            </div>

            {/* Primary Action */}
            <div className="pt-2">
              <button 
                className="w-full bg-purple-900 hover:bg-purple-950 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none" 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar sesión</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer Section */}
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3 text-center">
            <p className="text-xs text-slate-500 font-medium">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="text-purple-900 font-bold hover:underline">
                Regístrate aquí
              </Link>
            </p>
            <p className="text-xs text-slate-400 font-medium">
              ¿Problemas para acceder?{' '}
              <a className="text-slate-500 font-semibold hover:underline" href="#">Soporte TI</a>
            </p>
          </div>
        </div>

        {/* System Status Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 opacity-60">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Todos los sistemas operativos</span>
        </div>
      </main>
    </div>
  );
};

export default Login;