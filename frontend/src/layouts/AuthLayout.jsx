import React from 'react';
import { Outlet } from 'react-router-dom';
import { useDarkMode } from '../hooks/useDarkMode';
import campusUide from '../assets/campus-uide-loja.jpg';

export default function AuthLayout() {
  const { isDarkMode, toggle: toggleDarkMode } = useDarkMode();

  return <div
    className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-cover bg-center bg-no-repeat p-4 py-8 font-sans"
    style={{ backgroundImage: `url(${campusUide})` }}
  >
    <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-950/80 via-purple-950/55 to-slate-900/70 dark:from-black/90 dark:via-purple-950/75 dark:to-black/85" />
    <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_42%)]" />
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden"><div className="absolute -right-12 -top-12 h-80 w-80 rounded-full bg-purple-400/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" /><div className="absolute -bottom-16 -left-16 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl animate-[pulse_6s_ease-in-out_infinite] [animation-delay:-3s]" /></div>
    <button onClick={toggleDarkMode} aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'} className="fixed right-5 top-5 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/30 text-slate-700 shadow-sm backdrop-blur-md transition hover:bg-white/50 dark:bg-black/25 dark:text-slate-200 dark:hover:bg-black/40"><span className="material-symbols-outlined">{isDarkMode ? 'light_mode' : 'dark_mode'}</span></button>
    <main className="relative z-10 my-auto w-full max-w-[460px] animate-[fadeIn_0.45s_ease-out]"><Outlet /></main>
  </div>;
}
