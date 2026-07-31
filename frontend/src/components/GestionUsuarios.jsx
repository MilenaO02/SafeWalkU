import React, { useEffect, useMemo, useState } from 'react';
import { request } from '../services/api';
import { useAuth } from '../context/auth';
import ConfirmDialog from './ConfirmDialog';
import { formatLabel } from '../utils/formatLabel';

const actionLabels = {
  reactivate: 'Reactivar',
  deactivate: 'Desactivar',
  'grant-admin': 'Convertir en administrador',
  'remove-admin': 'Quitar administrador'
};

export default function GestionUsuarios() {
  const { user: currentUser, showToast } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('TODOS');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const loadUsers = async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await request('/users');
      setUsers(Array.isArray(response) ? response : response.data || []);
      setStatus('ready');
    } catch (loadError) {
      setError(loadError.message);
      setStatus('error');
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = useMemo(() => users.filter((item) => {
    const value = `${item.nombre} ${item.apellido} ${item.correo}`.toLowerCase();
    return value.includes(search.trim().toLowerCase())
      && (role === 'TODOS' || item.rol === role)
      && (statusFilter === 'TODOS' || item.estado === statusFilter);
  }), [users, search, role, statusFilter]);

  const requestAction = (item, action) => {
    if (item.id_usuario === currentUser?.id_usuario) return;
    setPendingAction({ item, action });
  };

  const confirmAction = async () => {
    if (!pendingAction) return;

    const { item, action } = pendingAction;
    setBusyId(item.id_usuario);
    setError(null);

    try {
      let nextUser = item;
      let message;

      if (action === 'reactivate') {
        await request(`/users/${item.id_usuario}/reactivate`, { method: 'PATCH' });
        nextUser = { ...item, estado: 'ACTIVO' };
        message = 'Usuario reactivado correctamente.';
      } else if (action === 'deactivate') {
        await request(`/users/${item.id_usuario}`, { method: 'DELETE' });
        nextUser = { ...item, estado: 'INACTIVO' };
        message = 'Usuario desactivado correctamente.';
      } else {
        const requestedRole = action === 'grant-admin' ? 'ADMINISTRADOR' : 'ESTUDIANTE';
        const response = await request(`/users/${item.id_usuario}/administrator`, {
          method: 'PATCH',
          body: JSON.stringify({ rol: requestedRole })
        });
        nextUser = { ...item, ...(response.data || {}), rol: requestedRole };
        message = response.message || (requestedRole === 'ADMINISTRADOR'
          ? 'Usuario convertido en administrador correctamente.'
          : 'Privilegios de administrador retirados correctamente.');
      }

      setUsers((items) => items.map((candidate) => (
        candidate.id_usuario === item.id_usuario ? nextUser : candidate
      )));
      showToast(message);
    } catch (actionError) {
      setError(actionError.message);
    } finally {
      setBusyId(null);
      setPendingAction(null);
    }
  };

  const isCurrentSession = (item) => item.id_usuario === currentUser?.id_usuario;
  const isBusy = (item) => busyId === item.id_usuario;

  return <div className="space-y-5">
    <div><h2 className="text-xl font-black text-purple-950 md:text-2xl">Gestión de usuarios</h2><p className="mt-1 text-xs text-slate-500">{users.length} usuarios obtenidos desde la API.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">
      <input aria-label="Buscar usuario" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre o correo" className="min-h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm" />
      <select aria-label="Filtrar por rol" value={role} onChange={(event) => setRole(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"><option value="TODOS">Todos</option><option value="ESTUDIANTE">Estudiantes</option><option value="ADMINISTRADOR">Administradores</option></select>
      <select aria-label="Filtrar por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold"><option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Desactivados</option></select>
    </div>
    {status === 'loading' && <p className="rounded-2xl bg-white p-5 text-sm text-slate-500">Cargando usuarios…</p>}
    {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-sm text-red-700"><span>{error}</span><button type="button" onClick={loadUsers} className="min-h-11 rounded-xl border border-red-200 px-4 font-bold">Reintentar</button></div>}
    {status === 'ready' && <div className="grid gap-3">
      {filtered.map((item) => {
        const current = isCurrentSession(item);
        const disabled = isBusy(item) || current || item.estado !== 'ACTIVO';
        const canRemoveAdmin = item.rol === 'ADMINISTRADOR';

        return <article key={item.id_usuario} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-xs font-black text-purple-900">{item.nombre?.[0]}{item.apellido?.[0]}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-slate-900">{item.nombre} {item.apellido}</p><p className="truncate text-xs text-slate-500">{item.correo}</p><div className="mt-1 flex flex-wrap gap-1"><span className="inline-block rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold">{formatLabel(item.rol)}</span><span className={`inline-block rounded-lg px-2 py-1 text-[10px] font-bold ${item.estado === 'ACTIVO' ? 'bg-green-50 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{formatLabel(item.estado)}</span></div></div>
          <div className="flex flex-wrap gap-2 sm:max-w-xs sm:justify-end">
            <button type="button" disabled={disabled} onClick={() => requestAction(item, canRemoveAdmin ? 'remove-admin' : 'grant-admin')} className={`min-h-11 rounded-xl px-4 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${canRemoveAdmin ? 'bg-amber-50 text-amber-800' : 'bg-purple-100 text-purple-900'}`}>{isBusy(item) ? 'Procesando…' : current ? 'Sesión actual' : canRemoveAdmin ? 'Quitar administrador' : 'Convertir en administrador'}</button>
            <button type="button" disabled={isBusy(item) || current} onClick={() => requestAction(item, item.estado === 'ACTIVO' ? 'deactivate' : 'reactivate')} className={`min-h-11 rounded-xl px-4 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${item.estado === 'ACTIVO' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{isBusy(item) ? 'Procesando…' : current ? 'Sesión actual' : item.estado === 'ACTIVO' ? 'Desactivar' : 'Reactivar'}</button>
          </div>
        </article>;
      })}
      {!filtered.length && <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500">No hay usuarios para este filtro.</p>}
    </div>}
    <ConfirmDialog
      open={Boolean(pendingAction)}
      title={pendingAction ? actionLabels[pendingAction.action] : ''}
      message={pendingAction ? `¿${actionLabels[pendingAction.action]} a ${pendingAction.item.nombre} ${pendingAction.item.apellido}? Esta acción se registrará en la base de datos.` : ''}
      confirmText={pendingAction ? actionLabels[pendingAction.action] : 'Aceptar'}
      danger={pendingAction?.action === 'deactivate' || pendingAction?.action === 'remove-admin'}
      busy={Boolean(pendingAction && busyId === pendingAction.item.id_usuario)}
      onClose={() => setPendingAction(null)}
      onConfirm={confirmAction}
    />
  </div>;
}
