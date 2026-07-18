import React, { useState } from 'react';

const INITIAL_USERS = [
  { id: '1029384', nombre: 'María José Andrade',  email: 'mariajose@uide.edu.ec',  rol: 'Estudiante', estado: 'Activo',   avatar: 'MJ', color: 'bg-purple-200 text-purple-900' },
  { id: '1029455', nombre: 'Juan Pablo Vargas',   email: 'juanpablo@uide.edu.ec',  rol: 'Admin',      estado: 'Activo',   avatar: 'JP', color: 'bg-indigo-200 text-indigo-900' },
  { id: '1029671', nombre: 'Ana Belén Castillo',  email: 'anabelen@uide.edu.ec',   rol: 'Estudiante', estado: 'Activo',   avatar: 'AB', color: 'bg-pink-200 text-pink-900'     },
  { id: '1030112', nombre: 'Diego Romero',         email: 'diego.r@uide.edu.ec',    rol: 'Estudiante', estado: 'Inactivo', avatar: 'DR', color: 'bg-slate-200 text-slate-700'   },
];

const ROLES  = ['Todos', 'Estudiante', 'Admin'];
const STATUS = { Activo: 'bg-green-100 text-green-700 border-green-200', Inactivo: 'bg-slate-100 text-slate-500 border-slate-200' };
const ROL_B  = { Estudiante: 'bg-blue-50 text-blue-700 border-blue-200', Admin: 'bg-purple-50 text-purple-700 border-purple-200' };

export default function GestionUsuarios() {
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [users,      setUsers]      = useState(INITIAL_USERS);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'Todos' || u.rol === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, estado: u.estado === 'Activo' ? 'Inactivo' : 'Activo' } : u
      )
    );
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-purple-950 tracking-tight">Gestión de Usuarios</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">{users.length} usuarios registrados en el sistema.</p>
        </div>
        <button
          onClick={() => alert('Formulario de nuevo usuario (próximamente)')}
          className="flex items-center gap-2 bg-purple-900 hover:bg-purple-950 text-white px-4 py-2.5 rounded-xl shadow-md text-xs font-bold transition-all cursor-pointer shrink-0"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tabs rol */}
        <div className="flex gap-1 p-1 bg-slate-100/80 rounded-2xl">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                roleFilter === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 gap-2 shadow-sm w-full sm:w-56">
          <span className="material-symbols-outlined text-slate-400 text-[18px]">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar usuario..."
            className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none w-full placeholder-slate-400"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Nombre Completo', 'Email Institucional', 'Rol', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${u.color}`}>
                        {u.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{u.nombre}</p>
                        <p className="text-[10px] text-slate-400 font-medium">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${ROL_B[u.rol]}`}>
                      {u.rol}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${STATUS[u.estado]}`}>
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleStatus(u.id)}
                        title={u.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                          u.estado === 'Activo'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {u.estado === 'Activo' ? 'block' : 'check_circle'}
                        </span>
                      </button>
                      <button
                        onClick={() => alert(`Editar usuario: ${u.nombre}`)}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm font-medium">
              No se encontraron usuarios para este criterio.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}